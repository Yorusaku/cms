import { describe, it, expect, beforeEach } from 'vitest';
import {
  signMessage,
  verifySignature,
  generateSecret,
  MessageSequenceTracker,
  validateSchemaVersion,
  validateMessageSize,
  validateOrigin,
  createSecureMessage,
  verifySecureMessage,
} from '@cms/utils';

describe('Message Security Utilities', () => {
  describe('signMessage and verifySignature', () => {
    it('generates consistent signature for same message and secret', async () => {
      const message = 'test message';
      const secret = 'test-secret';

      const signature1 = await signMessage(message, secret);
      const signature2 = await signMessage(message, secret);

      expect(signature1).toBe(signature2);
    });

    it('generates different signatures for different messages', async () => {
      const secret = 'test-secret';

      const signature1 = await signMessage('message 1', secret);
      const signature2 = await signMessage('message 2', secret);

      expect(signature1).not.toBe(signature2);
    });

    it('generates different signatures for different secrets', async () => {
      const message = 'test message';

      const signature1 = await signMessage(message, 'secret-1');
      const signature2 = await signMessage(message, 'secret-2');

      expect(signature1).not.toBe(signature2);
    });

    it('verifies valid signature', async () => {
      const message = 'test message';
      const secret = 'test-secret';

      const signature = await signMessage(message, secret);
      const isValid = await verifySignature(message, signature, secret);

      expect(isValid).toBe(true);
    });

    it('rejects invalid signature', async () => {
      const message = 'test message';
      const secret = 'test-secret';

      const signature = await signMessage(message, secret);
      const isValid = await verifySignature(message, 'invalid-signature', secret);

      expect(isValid).toBe(false);
    });

    it('rejects signature with wrong secret', async () => {
      const message = 'test message';

      const signature = await signMessage(message, 'secret-1');
      const isValid = await verifySignature(message, signature, 'secret-2');

      expect(isValid).toBe(false);
    });
  });

  describe('generateSecret', () => {
    it('generates a secret', () => {
      const secret = generateSecret();

      expect(secret).toBeDefined();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThan(0);
    });

    it('generates different secrets each time', () => {
      const secret1 = generateSecret();
      const secret2 = generateSecret();

      expect(secret1).not.toBe(secret2);
    });

    it('generates hex string', () => {
      const secret = generateSecret();

      expect(/^[0-9a-f]+$/.test(secret)).toBe(true);
    });
  });

  describe('MessageSequenceTracker', () => {
    let tracker: MessageSequenceTracker;

    beforeEach(() => {
      tracker = new MessageSequenceTracker();
    });

    it('accepts first message', () => {
      const isValid = tracker.validateSequence(1);

      expect(isValid).toBe(true);
    });

    it('accepts increasing sequence numbers', () => {
      expect(tracker.validateSequence(1)).toBe(true);
      expect(tracker.validateSequence(2)).toBe(true);
      expect(tracker.validateSequence(3)).toBe(true);
    });

    it('rejects duplicate sequence numbers', () => {
      tracker.validateSequence(1);

      const isValid = tracker.validateSequence(1);

      expect(isValid).toBe(false);
    });

    it('accepts out-of-order messages within window', () => {
      tracker.validateSequence(10);

      expect(tracker.validateSequence(5)).toBe(true);
      expect(tracker.validateSequence(8)).toBe(true);
    });

    it('rejects messages outside window', () => {
      tracker.validateSequence(150);

      const isValid = tracker.validateSequence(1);

      expect(isValid).toBe(false);
    });

    it('generates increasing sequence numbers', () => {
      const seq1 = tracker.getNextSequence();
      const seq2 = tracker.getNextSequence();
      const seq3 = tracker.getNextSequence();

      expect(seq2).toBe(seq1 + 1);
      expect(seq3).toBe(seq2 + 1);
    });

    it('resets tracker', () => {
      tracker.validateSequence(10);
      tracker.validateSequence(20);

      tracker.reset();

      expect(tracker.getNextSequence()).toBe(1);
      expect(tracker.validateSequence(10)).toBe(true);
    });
  });

  describe('validateSchemaVersion', () => {
    it('accepts supported version', () => {
      expect(validateSchemaVersion('2.0.0')).toBe(true);
    });

    it('rejects unsupported version', () => {
      expect(validateSchemaVersion('1.0.0')).toBe(false);
      expect(validateSchemaVersion('3.0.0')).toBe(false);
      expect(validateSchemaVersion('invalid')).toBe(false);
    });
  });

  describe('validateMessageSize', () => {
    it('accepts small messages', () => {
      const message = { data: 'small message' };

      expect(validateMessageSize(message)).toBe(true);
    });

    it('accepts messages at size limit', () => {
      const message = { data: 'x'.repeat(1024 * 1024 - 100) };

      expect(validateMessageSize(message)).toBe(true);
    });

    it('rejects messages exceeding size limit', () => {
      const message = { data: 'x'.repeat(2 * 1024 * 1024) };

      expect(validateMessageSize(message)).toBe(false);
    });

    it('respects custom size limit', () => {
      const message = { data: 'x'.repeat(1000) };

      expect(validateMessageSize(message, 500)).toBe(false);
      expect(validateMessageSize(message, 2000)).toBe(true);
    });
  });

  describe('validateOrigin', () => {
    it('accepts whitelisted origins', () => {
      expect(validateOrigin('http://localhost:5173')).toBe(true);
      expect(validateOrigin('http://localhost:5174')).toBe(true);
    });

    it('rejects non-whitelisted origins', () => {
      expect(validateOrigin('http://evil.com')).toBe(false);
      expect(validateOrigin('http://localhost:9999')).toBe(false);
    });
  });

  describe('createSecureMessage', () => {
    it('creates secure message with all required fields', async () => {
      const tracker = new MessageSequenceTracker();
      const data = { test: 'data' };

      const message = await createSecureMessage('TEST_TYPE', data, tracker);

      expect(message.type).toBe('TEST_TYPE');
      expect(message.data).toEqual(data);
      expect(message.sequence).toBe(1);
      expect(message.timestamp).toBeDefined();
      expect(message.signature).toBeDefined();
      expect(message.version).toBe('2.0.0');
    });

    it('increments sequence number', async () => {
      const tracker = new MessageSequenceTracker();

      const message1 = await createSecureMessage('TEST', {}, tracker);
      const message2 = await createSecureMessage('TEST', {}, tracker);

      expect(message2.sequence).toBe(message1.sequence + 1);
    });

    it('generates valid signature', async () => {
      const tracker = new MessageSequenceTracker();
      const data = { test: 'data' };

      const message = await createSecureMessage('TEST_TYPE', data, tracker);

      // Verify signature manually
      const { signature, ...basePayload } = message;
      const messageStr = JSON.stringify(basePayload);
      const secret = sessionStorage.getItem('__cms_message_secret__') || '';
      const isValid = await verifySignature(messageStr, signature, secret);

      expect(isValid).toBe(true);
    });
  });

  describe('verifySecureMessage', () => {
    it('verifies valid secure message', async () => {
      const tracker = new MessageSequenceTracker();
      const data = { test: 'data' };

      const message = await createSecureMessage('TEST_TYPE', data, tracker);

      const verifyTracker = new MessageSequenceTracker();
      const result = await verifySecureMessage(message, verifyTracker);

      expect(result.valid).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.error).toBeUndefined();
    });

    it('rejects message with invalid signature', async () => {
      const tracker = new MessageSequenceTracker();
      const message = await createSecureMessage('TEST', {}, tracker);

      // Tamper with signature
      message.signature = 'invalid-signature';

      const verifyTracker = new MessageSequenceTracker();
      const result = await verifySecureMessage(message, verifyTracker);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('signature');
    });

    it('rejects message with invalid version', async () => {
      const tracker = new MessageSequenceTracker();
      const message = await createSecureMessage('TEST', {}, tracker);

      // Change version
      message.version = '1.0.0';

      const verifyTracker = new MessageSequenceTracker();
      const result = await verifySecureMessage(message, verifyTracker);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('version');
    });

    it('rejects replayed message', async () => {
      const tracker = new MessageSequenceTracker();
      const message = await createSecureMessage('TEST', {}, tracker);

      const verifyTracker = new MessageSequenceTracker();

      // First verification should succeed
      const result1 = await verifySecureMessage(message, verifyTracker);
      expect(result1.valid).toBe(true);

      // Second verification (replay) should fail
      const result2 = await verifySecureMessage(message, verifyTracker);
      expect(result2.valid).toBe(false);
      expect(result2.error).toContain('sequence');
    });

    it('rejects old message', async () => {
      const tracker = new MessageSequenceTracker();
      const message = await createSecureMessage('TEST', {}, tracker);

      // Make message old (6 minutes ago)
      message.timestamp = Date.now() - 6 * 60 * 1000;

      // Re-sign with old timestamp
      const { signature, ...basePayload } = message;
      const secret = sessionStorage.getItem('__cms_message_secret__') || '';
      const messageStr = JSON.stringify(basePayload);
      message.signature = await signMessage(messageStr, secret);

      const verifyTracker = new MessageSequenceTracker();
      const result = await verifySecureMessage(message, verifyTracker);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('timestamp');
    });

    it('rejects oversized message', async () => {
      const tracker = new MessageSequenceTracker();
      const largeData = { data: 'x'.repeat(2 * 1024 * 1024) };

      const message = await createSecureMessage('TEST', largeData, tracker);

      const verifyTracker = new MessageSequenceTracker();
      const result = await verifySecureMessage(message, verifyTracker);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('size');
    });
  });
});
