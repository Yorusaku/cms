import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getPerformanceMonitor } from "../utils/performance-monitor";
import { createDebounce, createThrottle, PerformanceMetrics } from "../utils/editor-optimization";

describe("Performance Benchmarks", () => {
  let monitor = getPerformanceMonitor();
  let metrics: PerformanceMetrics;

  beforeEach(() => {
    metrics = new PerformanceMetrics();
  });

  afterEach(() => {
    monitor.destroy();
    monitor = getPerformanceMonitor();
  });

  describe("Component Rendering Performance", () => {
    it("should render 100 components in less than 100ms", () => {
      metrics.mark("render-100-start");

      // Simulate rendering 100 components
      const components = Array.from({ length: 100 }, (_, i) => ({
        id: `component-${i}`,
        type: "NoticeBlock",
        props: { title: `Component ${i}` },
      }));

      // Simulate render time
      const startTime = performance.now();
      components.forEach((component) => {
        // Simulate component rendering
        JSON.stringify(component);
      });
      const renderTime = performance.now() - startTime;

      metrics.mark("render-100-end");
      const duration = metrics.measure("render-100", "render-100-start", "render-100-end");

      expect(duration).toBeLessThan(100);
      expect(renderTime).toBeLessThan(100);
    });

    it("should render 1000 components in less than 500ms", () => {
      metrics.mark("render-1000-start");

      const components = Array.from({ length: 1000 }, (_, i) => ({
        id: `component-${i}`,
        type: "ProductBlock",
        props: { title: `Component ${i}` },
      }));

      const startTime = performance.now();
      components.forEach((component) => {
        JSON.stringify(component);
      });
      const renderTime = performance.now() - startTime;

      metrics.mark("render-1000-end");
      const duration = metrics.measure("render-1000", "render-1000-start", "render-1000-end");

      expect(duration).toBeLessThan(500);
      expect(renderTime).toBeLessThan(500);
    });
  });

  describe("Drag Response Performance", () => {
    it("should respond to drag events in less than 50ms", () => {
      const dragHandler = () => {
        // Simulate drag handling
        const data = { x: 100, y: 200, componentId: "test-component" };
        JSON.stringify(data);
      };

      const throttledDrag = createThrottle(dragHandler, { wait: 16 });

      metrics.mark("drag-start");

      // Simulate 10 drag events
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        throttledDrag();
        const responseTime = performance.now() - startTime;
        expect(responseTime).toBeLessThan(50);
      }

      metrics.mark("drag-end");
      const duration = metrics.measure("drag", "drag-start", "drag-end");

      expect(duration).toBeLessThan(500); // Total time for 10 events
    });
  });

  describe("Save Draft Performance", () => {
    it("should save draft in less than 200ms", () => {
      const saveHandler = () => {
        // Simulate save operation
        const schema = {
          version: "2.0.0",
          pageConfig: { name: "Test Page" },
          componentMap: {},
          rootIds: [],
        };
        JSON.stringify(schema);
      };

      const debouncedSave = createDebounce(saveHandler, { wait: 300 });

      metrics.mark("save-start");

      const startTime = performance.now();
      debouncedSave();
      const responseTime = performance.now() - startTime;

      metrics.mark("save-end");
      const duration = metrics.measure("save", "save-start", "save-end");

      expect(responseTime).toBeLessThan(200);
      expect(duration).toBeLessThan(200);
    });
  });

  describe("Debounce Performance", () => {
    it("should debounce rapid calls efficiently", () => {
      let callCount = 0;
      const handler = () => {
        callCount++;
      };

      const debounced = createDebounce(handler, { wait: 100 });

      metrics.mark("debounce-start");

      // Simulate rapid calls
      for (let i = 0; i < 100; i++) {
        debounced();
      }

      metrics.mark("debounce-end");
      const duration = metrics.measure("debounce", "debounce-start", "debounce-end");

      // Should complete quickly even with 100 calls
      expect(duration).toBeLessThan(50);
    });
  });

  describe("Throttle Performance", () => {
    it("should throttle scroll events efficiently", () => {
      let callCount = 0;
      const handler = () => {
        callCount++;
      };

      const throttled = createThrottle(handler, { wait: 16 });

      metrics.mark("throttle-start");

      // Simulate scroll events
      for (let i = 0; i < 60; i++) {
        throttled();
      }

      metrics.mark("throttle-end");
      const duration = metrics.measure("throttle", "throttle-start", "throttle-end");

      // Should complete quickly
      expect(duration).toBeLessThan(100);
    });
  });

  describe("Performance Metrics Collection", () => {
    it("should collect and report metrics accurately", () => {
      metrics.mark("operation-start");

      // Simulate some work
      let sum = 0;
      for (let i = 0; i < 1000; i++) {
        sum += i;
      }

      metrics.mark("operation-end");
      const duration = metrics.measure("operation", "operation-start", "operation-end");

      const report = metrics.getMetrics("operation");
      expect(report).toBeDefined();
      expect(report?.count).toBe(1);
      expect(report?.avg).toBeGreaterThan(0);
      expect(report?.min).toBeLessThanOrEqual(report?.max!);
    });

    it("should track multiple measurements", () => {
      for (let i = 0; i < 5; i++) {
        metrics.mark(`test-${i}-start`);
        // Simulate work
        let sum = 0;
        for (let j = 0; j < 100; j++) {
          sum += j;
        }
        metrics.mark(`test-${i}-end`);
        metrics.measure(`test-${i}`, `test-${i}-start`, `test-${i}-end`);
      }

      const report = metrics.getMetrics("test-0");
      expect(report?.count).toBe(1);
    });
  });

  describe("Core Web Vitals Monitoring", () => {
    it("should track LCP metric", () => {
      monitor.markStart("lcp-test");
      // Simulate some rendering
      const data = Array.from({ length: 100 }, (_, i) => i);
      JSON.stringify(data);
      monitor.markEnd("lcp-test", "editorInitTime");

      const metrics = monitor.getCustomMetrics();
      expect(metrics.editorInitTime).toBeGreaterThan(0);
    });

    it("should provide performance report", () => {
      monitor.recordMetric("componentRenderTime", 50);
      monitor.recordMetric("dragResponseTime", 30);

      const report = monitor.getReport();
      expect(report.componentRenderTime).toBe(50);
      expect(report.dragResponseTime).toBe(30);
      expect(report.timestamp).toBeGreaterThan(0);
      expect(report.url).toBeDefined();
    });

    it("should check performance targets", () => {
      const targets = monitor.checkTargets();
      expect(targets).toHaveProperty("lcp");
      expect(targets).toHaveProperty("fid");
      expect(targets).toHaveProperty("cls");
      expect(targets).toHaveProperty("ttfb");
    });
  });

  describe("Memory Performance", () => {
    it("should handle large component maps efficiently", () => {
      metrics.mark("memory-start");

      // Create a large component map
      const componentMap: Record<string, any> = {};
      for (let i = 0; i < 1000; i++) {
        componentMap[`component-${i}`] = {
          id: `component-${i}`,
          type: "Block",
          props: { title: `Component ${i}` },
          children: [],
        };
      }

      const serialized = JSON.stringify(componentMap);
      const size = new Blob([serialized]).size;

      metrics.mark("memory-end");
      const duration = metrics.measure("memory", "memory-start", "memory-end");

      // Should complete in reasonable time
      expect(duration).toBeLessThan(100);
      // 1000 components should be < 100KB
      expect(size).toBeLessThan(100000);
    });
  });
});
