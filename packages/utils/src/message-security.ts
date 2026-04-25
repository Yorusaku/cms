/**
 * Message Security Utilities
 *
 * Provides security features for iframe postMessage communication:
 * - HMAC-SHA256 message signing
 * - Message sequence tracking (anti-replay)
 * - Schema version validation
 * - Message size limits
 */

/**
 * Generate HMAC-SHA256 signature for message
 */
export async function signMessage(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verify HMAC-SHA256 signature
 */
export async function verifySignature(
  message: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expectedSignature = await signMessage(message, secret);
  return signature === expectedSignature;
}

/**
 * Generate a shared secret for message signing
 * In production, this should be generated server-side and shared securely
 */
export function generateSecret(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Get or create shared secret from sessionStorage
 */
export function getSharedSecret(): string {
  const key = '__cms_message_secret__';
  let secret = sessionStorage.getItem(key);

  if (!secret) {
    secret = generateSecret();
    sessionStorage.setItem(key, secret);
  }

  return secret;
}

/**
 * Message sequence tracker for anti-replay protection
 */
export class MessageSequenceTracker {
  private lastSequence = 0;
  private processedMessages = new Set<number>();
  private maxWindowSize = 100; // Keep track of last 100 messages

  /**
   * Validate and record message sequence
   * Returns true if sequence is valid (not a replay)
   */
  validateSequence(sequence: number): boolean {
    // Reject if sequence is too old
    if (sequence <= this.lastSequence - this.maxWindowSize) {
      return false;
    }

    // Reject if already processed
    if (this.processedMessages.has(sequence)) {
      return false;
    }

    // Accept and record
    this.processedMessages.add(sequence);

    // Update last sequence if this is newer
    if (sequence > this.lastSequence) {
      this.lastSequence = sequence;
    }

    // Clean up old sequences
    this.cleanup();

    return true;
  }

  /**
   * Get next sequence number for outgoing messages
   */
  getNextSequence(): number {
    return ++this.lastSequence;
  }

  /**
   * Clean up old processed messages
   */
  private cleanup(): void {
    if (this.processedMessages.size > this.maxWindowSize) {
      const threshold = this.lastSequence - this.maxWindowSize;
      this.processedMessages.forEach(seq => {
        if (seq < threshold) {
          this.processedMessages.delete(seq);
        }
      });
    }
  }

  /**
   * Reset tracker (useful for testing)
   */
  reset(): void {
    this.lastSequence = 0;
    this.processedMessages.clear();
  }
}

/**
 * Validate Schema version compatibility
 */
export function validateSchemaVersion(version: string): boolean {
  const supportedVersions = ['2.0.0'];
  return supportedVersions.includes(version);
}

/**
 * Check message size limit (1MB default)
 */
export function validateMessageSize(message: any, maxSizeBytes = 1024 * 1024): boolean {
  const messageStr = JSON.stringify(message);
  const sizeBytes = new Blob([messageStr]).size;
  return sizeBytes <= maxSizeBytes;
}

/**
 * Origin whitelist for development and production
 */
export function getOriginWhitelist(): string[] {
  const isDev = import.meta.env.DEV;

  if (isDev) {
    // Development: allow localhost with different ports
    return [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:3000',
    ];
  }

  // Production: only allow same origin
  return [window.location.origin];
}

/**
 * Validate message origin against whitelist
 */
export function validateOrigin(origin: string): boolean {
  const whitelist = getOriginWhitelist();
  return whitelist.includes(origin);
}

/**
 * Secure message payload with signature and metadata
 */
export interface SecureMessagePayload<T = unknown> {
  type: string;
  data: T;
  sequence: number;
  timestamp: number;
  signature: string;
  version: string;
}

/**
 * Create a secure message payload
 */
export async function createSecureMessage<T>(
  type: string,
  data: T,
  sequenceTracker: MessageSequenceTracker
): Promise<SecureMessagePayload<T>> {
  const sequence = sequenceTracker.getNextSequence();
  const timestamp = Date.now();
  const version = '2.0.0';

  // Create base payload
  const basePayload = {
    type,
    data,
    sequence,
    timestamp,
    version,
  };

  // Sign the payload
  const secret = getSharedSecret();
  const messageStr = JSON.stringify(basePayload);
  const signature = await signMessage(messageStr, secret);

  return {
    ...basePayload,
    signature,
  };
}

/**
 * Verify and extract secure message payload
 */
export async function verifySecureMessage<T>(
  payload: SecureMessagePayload<T>,
  sequenceTracker: MessageSequenceTracker
): Promise<{ valid: boolean; data?: T; error?: string }> {
  // Validate message size
  if (!validateMessageSize(payload)) {
    return { valid: false, error: 'Message size exceeds limit' };
  }

  // Validate schema version
  if (!validateSchemaVersion(payload.version)) {
    return { valid: false, error: `Unsupported schema version: ${payload.version}` };
  }

  // Validate sequence (anti-replay)
  if (!sequenceTracker.validateSequence(payload.sequence)) {
    return { valid: false, error: 'Invalid or replayed message sequence' };
  }

  // Verify signature
  const { signature, ...basePayload } = payload;
  const secret = getSharedSecret();
  const messageStr = JSON.stringify(basePayload);
  const isValid = await verifySignature(messageStr, signature, secret);

  if (!isValid) {
    return { valid: false, error: 'Invalid message signature' };
  }

  // Check timestamp (reject messages older than 5 minutes)
  const age = Date.now() - payload.timestamp;
  if (age > 5 * 60 * 1000) {
    return { valid: false, error: 'Message timestamp too old' };
  }

  return { valid: true, data: payload.data };
}
