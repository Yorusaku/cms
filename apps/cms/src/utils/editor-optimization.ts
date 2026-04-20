import { ref, Ref } from "vue";

export interface DebounceOptions {
  wait: number;
  maxWait?: number;
  leading?: boolean;
  trailing?: boolean;
}

export interface ThrottleOptions {
  wait: number;
  leading?: boolean;
  trailing?: boolean;
}

/**
 * Debounce function with configurable options
 */
export function createDebounce<T extends (...args: any[]) => any>(
  fn: T,
  options: DebounceOptions,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime = 0;
  let lastInvokeTime = 0;
  let result: any;

  const { wait, maxWait, leading = false, trailing = true } = options;

  return function debounced(...args: Parameters<T>) {
    const time = Date.now();
    const isInvoking = leading && !lastCallTime;

    if (isInvoking) {
      lastInvokeTime = time;
    }

    lastCallTime = time;

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    if (maxWait && time - lastInvokeTime >= maxWait) {
      result = fn(...args);
      lastInvokeTime = time;
    } else if (trailing) {
      timeoutId = setTimeout(() => {
        result = fn(...args);
        lastInvokeTime = Date.now();
        timeoutId = null;
      }, wait);
    }

    return result;
  };
}

/**
 * Throttle function with configurable options
 */
export function createThrottle<T extends (...args: any[]) => any>(
  fn: T,
  options: ThrottleOptions,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime = 0;
  let lastInvokeTime = 0;

  const { wait, leading = true, trailing = true } = options;

  return function throttled(...args: Parameters<T>) {
    const time = Date.now();
    const isInvoking = leading && !lastCallTime;

    if (isInvoking) {
      lastInvokeTime = time;
      fn(...args);
    }

    lastCallTime = time;

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeUntilNextInvoke = wait - timeSinceLastInvoke;

    if (timeUntilNextInvoke <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastInvokeTime = time;
      fn(...args);
    } else if (trailing && !timeoutId) {
      timeoutId = setTimeout(() => {
        lastInvokeTime = leading ? Date.now() : 0;
        timeoutId = null;
        fn(...args);
      }, timeUntilNextInvoke);
    }
  };
}

/**
 * RAF-based scroll throttle for smooth scrolling
 */
export function createRAFThrottle<T extends (...args: any[]) => any>(
  fn: T,
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  return function throttled(...args: Parameters<T>) {
    lastArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (lastArgs) {
          fn(...lastArgs);
        }
        rafId = null;
      });
    }
  };
}

/**
 * Component render cache for memoization
 */
export class ComponentRenderCache {
  private cache = new Map<string, any>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: string): any {
    return this.cache.get(key);
  }

  set(key: string, value: any): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }
}

/**
 * Batch update helper for reducing re-renders
 */
export function createBatchUpdate<T extends Record<string, any>>(
  initialState: T,
  onUpdate: (state: T) => void,
  batchWait: number = 16,
): {
  update: (updates: Partial<T>) => void;
  flush: () => void;
  state: Ref<T>;
} {
  const state = ref<T>({ ...initialState });
  let pendingUpdates: Partial<T> = {};
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (Object.keys(pendingUpdates).length > 0) {
      state.value = { ...state.value, ...pendingUpdates };
      onUpdate(state.value);
      pendingUpdates = {};
    }
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const update = (updates: Partial<T>) => {
    pendingUpdates = { ...pendingUpdates, ...updates };

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(flush, batchWait);
  };

  return {
    update,
    flush,
    state: state as Ref<T>,
  };
}

/**
 * Performance metrics collector
 */
export class PerformanceMetrics {
  private marks = new Map<string, number>();
  private measures = new Map<string, number[]>();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string): number {
    const startTime = this.marks.get(startMark);
    const endTime = endMark ? this.marks.get(endMark) : performance.now();

    if (startTime === undefined) {
      console.warn(`Start mark "${startMark}" not found`);
      return 0;
    }

    const duration = (endTime || performance.now()) - startTime;

    if (!this.measures.has(name)) {
      this.measures.set(name, []);
    }
    this.measures.get(name)!.push(duration);

    return duration;
  }

  getMetrics(name: string) {
    const values = this.measures.get(name) || [];
    if (values.length === 0) {
      return null;
    }

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return { avg, min, max, count: values.length, total: sum };
  }

  clear(): void {
    this.marks.clear();
    this.measures.clear();
  }

  clearMark(name: string): void {
    this.marks.delete(name);
  }

  clearMeasure(name: string): void {
    this.measures.delete(name);
  }
}
