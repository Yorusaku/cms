/**
 * Performance monitoring for Core Web Vitals and custom metrics
 */

export interface CoreWebVitals {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

export interface CustomMetrics {
  editorInitTime?: number;
  componentRenderTime?: number;
  dragResponseTime?: number;
  saveDraftTime?: number;
  publishTime?: number;
  scrollFrameRate?: number;
}

export interface PerformanceReport extends CoreWebVitals, CustomMetrics {
  timestamp: number;
  url: string;
  userAgent: string;
}

class PerformanceMonitor {
  private vitals: CoreWebVitals = {};
  private customMetrics: CustomMetrics = {};
  private observers: Map<string, PerformanceObserver> = new Map();
  private callbacks: Array<(report: PerformanceReport) => void> = [];

  constructor() {
    this.initializeVitalsObservers();
  }

  private initializeVitalsObservers(): void {
    // LCP (Largest Contentful Paint)
    if ("PerformanceObserver" in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.vitals.lcp = lastEntry.renderTime || lastEntry.loadTime;
        });
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
        this.observers.set("lcp", lcpObserver);
      } catch (e) {
        console.warn("LCP observer not supported");
      }

      // FID (First Input Delay)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            const firstEntry = entries[0];
            this.vitals.fid = (firstEntry as any).processingDuration;
          }
        });
        fidObserver.observe({ entryTypes: ["first-input"] });
        this.observers.set("fid", fidObserver);
      } catch (e) {
        console.warn("FID observer not supported");
      }

      // CLS (Cumulative Layout Shift)
      try {
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          let cls = 0;
          entries.forEach((entry) => {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value;
            }
          });
          this.vitals.cls = cls;
        });
        clsObserver.observe({ entryTypes: ["layout-shift"] });
        this.observers.set("cls", clsObserver);
      } catch (e) {
        console.warn("CLS observer not supported");
      }

      // TTFB (Time to First Byte)
      try {
        const navigationTiming = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
        if (navigationTiming) {
          this.vitals.ttfb = navigationTiming.responseStart - navigationTiming.fetchStart;
        }
      } catch (e) {
        console.warn("TTFB not available");
      }
    }
  }

  /**
   * Record custom metric
   */
  recordMetric(name: keyof CustomMetrics, value: number): void {
    this.customMetrics[name] = value;
  }

  /**
   * Mark the start of a measurement
   */
  markStart(name: string): void {
    try {
      performance.mark(`${name}-start`);
    } catch (e) {
      console.warn(`Failed to mark start for ${name}`);
    }
  }

  /**
   * Mark the end of a measurement and record the duration
   */
  markEnd(name: string, metricName?: keyof CustomMetrics): number {
    try {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);

      const measure = performance.getEntriesByName(name)[0];
      const duration = measure.duration;

      if (metricName) {
        this.recordMetric(metricName, duration);
      }

      return duration;
    } catch (e) {
      console.warn(`Failed to measure ${name}`);
      return 0;
    }
  }

  /**
   * Get current vitals
   */
  getVitals(): CoreWebVitals {
    return { ...this.vitals };
  }

  /**
   * Get current custom metrics
   */
  getCustomMetrics(): CustomMetrics {
    return { ...this.customMetrics };
  }

  /**
   * Get complete performance report
   */
  getReport(): PerformanceReport {
    return {
      ...this.vitals,
      ...this.customMetrics,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
  }

  /**
   * Register callback for performance reports
   */
  onReport(callback: (report: PerformanceReport) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Emit performance report
   */
  emitReport(): void {
    const report = this.getReport();
    this.callbacks.forEach((callback) => {
      try {
        callback(report);
      } catch (e) {
        console.error("Error in performance callback:", e);
      }
    });
  }

  /**
   * Check if metrics meet targets
   */
  checkTargets(): {
    lcp: boolean;
    fid: boolean;
    cls: boolean;
    ttfb: boolean;
  } {
    return {
      lcp: (this.vitals.lcp || 0) <= 2500, // Target: < 2.5s
      fid: (this.vitals.fid || 0) <= 100, // Target: < 100ms
      cls: (this.vitals.cls || 0) <= 0.1, // Target: < 0.1
      ttfb: (this.vitals.ttfb || 0) <= 600, // Target: < 600ms
    };
  }

  /**
   * Clear all observers and data
   */
  destroy(): void {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers.clear();
    this.vitals = {};
    this.customMetrics = {};
    this.callbacks = [];
  }
}

// Singleton instance
let instance: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!instance) {
    instance = new PerformanceMonitor();
  }
  return instance;
}

export function createPerformanceMonitor(): PerformanceMonitor {
  return new PerformanceMonitor();
}
