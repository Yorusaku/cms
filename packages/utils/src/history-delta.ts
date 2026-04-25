/**
 * History Delta Manager
 *
 * Implements incremental history tracking for Undo/Redo operations.
 * Instead of storing full snapshots, stores only the changes (deltas).
 */

export interface HistoryDelta {
  type: 'add' | 'update' | 'delete' | 'reorder';
  path: string[]; // Path to the changed property
  oldValue?: any;
  newValue?: any;
  timestamp: number;
}

export interface HistorySnapshot {
  deltas: HistoryDelta[];
  timestamp: number;
}

/**
 * Calculate delta between two objects
 */
export function calculateDelta(
  oldObj: any,
  newObj: any,
  path: string[] = []
): HistoryDelta[] {
  const deltas: HistoryDelta[] = [];

  // Handle null/undefined
  if (oldObj === newObj) {
    return deltas;
  }

  if (oldObj === null || oldObj === undefined) {
    deltas.push({
      type: 'add',
      path,
      newValue: newObj,
      timestamp: Date.now(),
    });
    return deltas;
  }

  if (newObj === null || newObj === undefined) {
    deltas.push({
      type: 'delete',
      path,
      oldValue: oldObj,
      timestamp: Date.now(),
    });
    return deltas;
  }

  // Handle primitives
  if (typeof oldObj !== 'object' || typeof newObj !== 'object') {
    if (oldObj !== newObj) {
      deltas.push({
        type: 'update',
        path,
        oldValue: oldObj,
        newValue: newObj,
        timestamp: Date.now(),
      });
    }
    return deltas;
  }

  // Handle arrays
  if (Array.isArray(oldObj) && Array.isArray(newObj)) {
    if (JSON.stringify(oldObj) !== JSON.stringify(newObj)) {
      deltas.push({
        type: 'update',
        path,
        oldValue: oldObj,
        newValue: newObj,
        timestamp: Date.now(),
      });
    }
    return deltas;
  }

  // Handle objects
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  for (const key of allKeys) {
    const oldValue = oldObj[key];
    const newValue = newObj[key];

    if (!(key in oldObj)) {
      // Property added
      deltas.push({
        type: 'add',
        path: [...path, key],
        newValue,
        timestamp: Date.now(),
      });
    } else if (!(key in newObj)) {
      // Property deleted
      deltas.push({
        type: 'delete',
        path: [...path, key],
        oldValue,
        timestamp: Date.now(),
      });
    } else if (typeof oldValue === 'object' && typeof newValue === 'object') {
      // Nested object - recurse
      const nestedDeltas = calculateDelta(oldValue, newValue, [...path, key]);
      deltas.push(...nestedDeltas);
    } else if (oldValue !== newValue) {
      // Property updated
      deltas.push({
        type: 'update',
        path: [...path, key],
        oldValue,
        newValue,
        timestamp: Date.now(),
      });
    }
  }

  return deltas;
}

/**
 * Apply delta to an object
 */
export function applyDelta(obj: any, delta: HistoryDelta): any {
  if (delta.path.length === 0) {
    // Root level change
    if (delta.type === 'add' || delta.type === 'update') {
      return delta.newValue;
    } else if (delta.type === 'delete') {
      return undefined;
    }
  }

  // Clone object
  const result = JSON.parse(JSON.stringify(obj));

  // Navigate to parent
  let current = result;
  for (let i = 0; i < delta.path.length - 1; i++) {
    const key = delta.path[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }

  const lastKey = delta.path[delta.path.length - 1];

  // Apply change
  if (delta.type === 'add' || delta.type === 'update') {
    current[lastKey] = delta.newValue;
  } else if (delta.type === 'delete') {
    delete current[lastKey];
  }

  return result;
}

/**
 * Apply multiple deltas to an object
 */
export function applyDeltas(obj: any, deltas: HistoryDelta[]): any {
  let result = obj;
  for (const delta of deltas) {
    result = applyDelta(result, delta);
  }
  return result;
}

/**
 * Reverse a delta (for undo)
 */
export function reverseDelta(delta: HistoryDelta): HistoryDelta {
  if (delta.type === 'add') {
    return {
      type: 'delete',
      path: delta.path,
      oldValue: delta.newValue,
      timestamp: Date.now(),
    };
  } else if (delta.type === 'delete') {
    return {
      type: 'add',
      path: delta.path,
      newValue: delta.oldValue,
      timestamp: Date.now(),
    };
  } else {
    // update
    return {
      type: 'update',
      path: delta.path,
      oldValue: delta.newValue,
      newValue: delta.oldValue,
      timestamp: Date.now(),
    };
  }
}

/**
 * Compress consecutive similar deltas
 */
export function compressDeltas(deltas: HistoryDelta[]): HistoryDelta[] {
  if (deltas.length === 0) return [];

  const compressed: HistoryDelta[] = [];
  let current = deltas[0];

  for (let i = 1; i < deltas.length; i++) {
    const next = deltas[i];

    // Check if deltas can be merged (same path, both updates)
    if (
      current.type === 'update' &&
      next.type === 'update' &&
      current.path.join('.') === next.path.join('.') &&
      next.timestamp - current.timestamp < 1000 // Within 1 second
    ) {
      // Merge: keep old value from current, new value from next
      current = {
        ...current,
        newValue: next.newValue,
        timestamp: next.timestamp,
      };
    } else {
      compressed.push(current);
      current = next;
    }
  }

  compressed.push(current);
  return compressed;
}

/**
 * Calculate size of deltas in bytes
 */
export function calculateDeltaSize(deltas: HistoryDelta[]): number {
  return new Blob([JSON.stringify(deltas)]).size;
}

/**
 * Incremental History Manager
 */
export class IncrementalHistoryManager<T> {
  private baseSnapshot: T;
  private history: HistorySnapshot[] = [];
  private currentIndex = -1;
  private maxCapacity = 50;

  constructor(initialState: T, maxCapacity = 50) {
    this.baseSnapshot = JSON.parse(JSON.stringify(initialState));
    this.maxCapacity = maxCapacity;
  }

  /**
   * Record a change
   */
  record(newState: T): void {
    const currentState = this.getCurrentState();
    const deltas = calculateDelta(currentState, newState);

    if (deltas.length === 0) {
      return; // No changes
    }

    // Remove any history after current index (for redo)
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Add new snapshot
    this.history.push({
      deltas: compressDeltas(deltas),
      timestamp: Date.now(),
    });

    this.currentIndex++;

    // Maintain capacity
    if (this.history.length > this.maxCapacity) {
      // Merge oldest snapshot into base
      const oldest = this.history.shift()!;
      this.baseSnapshot = applyDeltas(this.baseSnapshot, oldest.deltas);
      this.currentIndex--;
    }
  }

  /**
   * Undo last change
   */
  undo(): T | null {
    if (!this.canUndo()) {
      return null;
    }

    this.currentIndex--;
    return this.getCurrentState();
  }

  /**
   * Redo last undone change
   */
  redo(): T | null {
    if (!this.canRedo()) {
      return null;
    }

    this.currentIndex++;
    return this.getCurrentState();
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Get current state
   */
  getCurrentState(): T {
    let state = JSON.parse(JSON.stringify(this.baseSnapshot));

    for (let i = 0; i <= this.currentIndex; i++) {
      state = applyDeltas(state, this.history[i].deltas);
    }

    return state;
  }

  /**
   * Get history statistics
   */
  getStatistics() {
    const totalDeltas = this.history.reduce(
      (sum, snapshot) => sum + snapshot.deltas.length,
      0
    );

    const totalSize = this.history.reduce(
      (sum, snapshot) => sum + calculateDeltaSize(snapshot.deltas),
      0
    );

    return {
      snapshotCount: this.history.length,
      totalDeltas,
      totalSize,
      averageDeltasPerSnapshot: totalDeltas / Math.max(1, this.history.length),
      currentIndex: this.currentIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    };
  }

  /**
   * Clear history
   */
  clear(): void {
    this.baseSnapshot = this.getCurrentState();
    this.history = [];
    this.currentIndex = -1;
  }
}
