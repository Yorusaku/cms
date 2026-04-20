import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  DataBindingEngine,
  IDataSource,
  IDataBinding,
  createAPIDataSource,
  createStaticDataSource,
  createComputedDataSource,
} from "../utils/data-binding-engine";

describe("DataBindingEngine", () => {
  let engine: DataBindingEngine;

  beforeEach(() => {
    engine = new DataBindingEngine();
  });

  afterEach(() => {
    engine.destroy();
  });

  describe("Data Source Registration", () => {
    it("should register a data source", () => {
      const source = createStaticDataSource("source-1", "Static Data", {
        items: [1, 2, 3],
      });

      engine.registerDataSource(source);
      const sources = engine.getAllDataSources();

      expect(sources).toHaveLength(1);
      expect(sources[0].id).toBe("source-1");
    });

    it("should not register duplicate data source", () => {
      const source = createStaticDataSource("source-1", "Static Data", {
        items: [1, 2, 3],
      });

      engine.registerDataSource(source);
      engine.registerDataSource(source);

      expect(engine.getAllDataSources()).toHaveLength(1);
    });

    it("should unregister a data source", () => {
      const source = createStaticDataSource("source-1", "Static Data", {
        items: [1, 2, 3],
      });

      engine.registerDataSource(source);
      engine.unregisterDataSource("source-1");

      expect(engine.getAllDataSources()).toHaveLength(0);
    });
  });

  describe("Static Data Source", () => {
    it("should fetch static data", async () => {
      const source = createStaticDataSource("source-1", "Static Data", {
        items: [1, 2, 3],
      });

      engine.registerDataSource(source);
      const data = await engine.fetchData("source-1");

      expect(data).toEqual({ items: [1, 2, 3] });
    });

    it("should cache static data", async () => {
      const source = createStaticDataSource("source-1", "Static Data", {
        items: [1, 2, 3],
      });
      source.cacheEnabled = true;
      source.cacheDuration = 5000;

      engine.registerDataSource(source);

      const data1 = await engine.fetchData("source-1");
      const data2 = await engine.fetchData("source-1");

      expect(data1).toEqual(data2);
    });

    it("should apply transformation function", async () => {
      const source = createStaticDataSource("source-1", "Static Data", {
        items: [1, 2, 3],
      });
      source.transformFn = (data) => ({
        ...data,
        count: data.items.length,
      });

      engine.registerDataSource(source);
      const data = await engine.fetchData("source-1");

      expect(data.count).toBe(3);
    });
  });

  describe("Computed Data Source", () => {
    it("should compute data", async () => {
      const source = createComputedDataSource(
        "source-1",
        "Computed Data",
        () => ({
          timestamp: Date.now(),
          random: Math.random(),
        })
      );

      engine.registerDataSource(source);
      const data = await engine.fetchData("source-1");

      expect(data).toHaveProperty("timestamp");
      expect(data).toHaveProperty("random");
    });

    it("should handle compute function errors", async () => {
      const source = createComputedDataSource("source-1", "Computed Data", () => {
        throw new Error("Compute error");
      });

      engine.registerDataSource(source);

      await expect(engine.fetchData("source-1")).rejects.toThrow(
        "Compute error"
      );
    });
  });

  describe("Data Binding", () => {
    it("should register a binding", () => {
      const source = createStaticDataSource("source-1", "Static Data", {
        items: [1, 2, 3],
      });
      const binding: IDataBinding = {
        id: "binding-1",
        componentId: "comp-1",
        dataSourceId: "source-1",
        targetProperty: "items",
        enabled: true,
      };

      engine.registerDataSource(source);
      engine.registerBinding(binding);

      const bindings = engine.getAllBindings();
      expect(bindings).toHaveLength(1);
    });

    it("should apply data binding", async () => {
      const source = createStaticDataSource("source-1", "Static Data", {
        items: [1, 2, 3],
      });
      const binding: IDataBinding = {
        id: "binding-1",
        componentId: "comp-1",
        dataSourceId: "source-1",
        targetProperty: "items",
        enabled: true,
      };

      engine.registerDataSource(source);
      engine.registerBinding(binding);
      await engine.applyDataBinding("binding-1");

      const componentData = engine.getComponentData("comp-1");
      expect(componentData.items).toEqual([1, 2, 3]);
    });

    it("should not apply disabled binding", async () => {
      const source = createStaticDataSource("source-1", "Static Data", {
        items: [1, 2, 3],
      });
      const binding: IDataBinding = {
        id: "binding-1",
        componentId: "comp-1",
        dataSourceId: "source-1",
        targetProperty: "items",
        enabled: false,
      };

      engine.registerDataSource(source);
      engine.registerBinding(binding);
      await engine.applyDataBinding("binding-1");

      const componentData = engine.getComponentData("comp-1");
      expect(componentData.items).toBeUndefined();
    });

    it("should apply all bindings for component", async () => {
      const source1 = createStaticDataSource("source-1", "Data 1", {
        items: [1, 2, 3],
      });
      const source2 = createStaticDataSource("source-2", "Data 2", {
        count: 3,
      });

      const binding1: IDataBinding = {
        id: "binding-1",
        componentId: "comp-1",
        dataSourceId: "source-1",
        targetProperty: "items",
        enabled: true,
      };

      const binding2: IDataBinding = {
        id: "binding-2",
        componentId: "comp-1",
        dataSourceId: "source-2",
        targetProperty: "count",
        enabled: true,
      };

      engine.registerDataSource(source1);
      engine.registerDataSource(source2);
      engine.registerBinding(binding1);
      engine.registerBinding(binding2);

      await engine.applyBindingsForComponent("comp-1");

      const componentData = engine.getComponentData("comp-1");
      expect(componentData.items).toEqual([1, 2, 3]);
      expect(componentData.count).toBe(3);
    });
  });

  describe("Event Subscription", () => {
    it("should notify subscribers of data changes", async () => {
      const source = createStaticDataSource("source-1", "Static Data", {
        items: [1, 2, 3],
      });

      engine.registerDataSource(source);

      let eventReceived = false;
      let receivedData: any = null;

      engine.subscribe("source-1", (event) => {
        eventReceived = true;
        receivedData = event.data;
      });

      await engine.fetchData("source-1");

      expect(eventReceived).toBe(true);
      expect(receivedData).toEqual({ items: [1, 2, 3] });
    });

    it("should allow unsubscribing", async () => {
      const source = createStaticDataSource("source-1", "Static Data", {
        items: [1, 2, 3],
      });

      engine.registerDataSource(source);

      let callCount = 0;
      const unsubscribe = engine.subscribe("source-1", () => {
        callCount++;
      });

      await engine.fetchData("source-1");
      expect(callCount).toBe(1);

      unsubscribe();

      await engine.fetchData("source-1");
      expect(callCount).toBe(1); // Should not increase
    });

    it("should notify subscribers of errors", async () => {
      const source = createComputedDataSource("source-1", "Computed Data", () => {
        throw new Error("Compute error");
      });

      engine.registerDataSource(source);

      let errorReceived: Error | undefined;

      engine.subscribe("source-1", (event) => {
        errorReceived = event.error;
      });

      try {
        await engine.fetchData("source-1");
      } catch (e) {
        // Expected error
      }

      expect(errorReceived).toBeDefined();
      expect(errorReceived?.message).toBe("Compute error");
    });
  });

  describe("Cache Management", () => {
    it("should clear cache for a data source", async () => {
      const source = createStaticDataSource("source-1", "Static Data", {
        items: [1, 2, 3],
      });
      source.cacheEnabled = true;
      source.cacheDuration = 5000;

      engine.registerDataSource(source);

      await engine.fetchData("source-1");
      engine.clearCache("source-1");

      // After clearing cache, next fetch should work
      const data = await engine.fetchData("source-1");
      expect(data).toEqual({ items: [1, 2, 3] });
    });

    it("should clear all caches", async () => {
      const source1 = createStaticDataSource("source-1", "Data 1", {
        items: [1, 2, 3],
      });
      const source2 = createStaticDataSource("source-2", "Data 2", {
        count: 3,
      });

      source1.cacheEnabled = true;
      source2.cacheEnabled = true;

      engine.registerDataSource(source1);
      engine.registerDataSource(source2);

      await engine.fetchData("source-1");
      await engine.fetchData("source-2");

      engine.clearAllCaches();

      // After clearing all caches, fetches should work
      const data1 = await engine.fetchData("source-1");
      const data2 = await engine.fetchData("source-2");

      expect(data1).toEqual({ items: [1, 2, 3] });
      expect(data2).toEqual({ count: 3 });
    });
  });

  describe("Binding Management", () => {
    it("should get bindings for component", () => {
      const source = createStaticDataSource("source-1", "Static Data", {
        items: [1, 2, 3],
      });

      const binding1: IDataBinding = {
        id: "binding-1",
        componentId: "comp-1",
        dataSourceId: "source-1",
        targetProperty: "items",
        enabled: true,
      };

      const binding2: IDataBinding = {
        id: "binding-2",
        componentId: "comp-1",
        dataSourceId: "source-1",
        targetProperty: "count",
        enabled: true,
      };

      engine.registerDataSource(source);
      engine.registerBinding(binding1);
      engine.registerBinding(binding2);

      const bindings = engine.getBindingsForComponent("comp-1");
      expect(bindings).toHaveLength(2);
    });

    it("should enable/disable binding", async () => {
      const source = createStaticDataSource("source-1", "Static Data", {
        items: [1, 2, 3],
      });

      const binding: IDataBinding = {
        id: "binding-1",
        componentId: "comp-1",
        dataSourceId: "source-1",
        targetProperty: "items",
        enabled: true,
      };

      engine.registerDataSource(source);
      engine.registerBinding(binding);

      await engine.applyDataBinding("binding-1");
      let componentData = engine.getComponentData("comp-1");
      expect(componentData.items).toEqual([1, 2, 3]);

      engine.setBindingEnabled("binding-1", false);
      await engine.applyDataBinding("binding-1");

      componentData = engine.getComponentData("comp-1");
      expect(componentData.items).toEqual([1, 2, 3]); // Should not change
    });
  });

  describe("Error Handling", () => {
    it("should handle error with error handler", async () => {
      const source = createComputedDataSource("source-1", "Computed Data", () => {
        throw new Error("Compute error");
      });
      source.errorHandler = () => ({ fallback: true });

      engine.registerDataSource(source);
      const data = await engine.fetchData("source-1");

      expect(data).toEqual({ fallback: true });
    });

    it("should throw error if no error handler", async () => {
      const source = createComputedDataSource("source-1", "Computed Data", () => {
        throw new Error("Compute error");
      });

      engine.registerDataSource(source);

      await expect(engine.fetchData("source-1")).rejects.toThrow(
        "Compute error"
      );
    });
  });

  describe("Statistics", () => {
    it("should provide statistics", async () => {
      const apiSource = createAPIDataSource(
        "api-1",
        "API Data",
        "https://api.example.com/data"
      );
      const staticSource = createStaticDataSource("static-1", "Static Data", {
        items: [1, 2, 3],
      });

      const binding: IDataBinding = {
        id: "binding-1",
        componentId: "comp-1",
        dataSourceId: "static-1",
        targetProperty: "items",
        enabled: true,
      };

      engine.registerDataSource(apiSource);
      engine.registerDataSource(staticSource);
      engine.registerBinding(binding);

      const stats = engine.getStatistics();
      expect(stats.totalDataSources).toBe(2);
      expect(stats.apiSources).toBe(1);
      expect(stats.staticSources).toBe(1);
      expect(stats.totalBindings).toBe(1);
      expect(stats.enabledBindings).toBe(1);
    });
  });

  describe("Data Source Helpers", () => {
    it("should create API data source", () => {
      const source = createAPIDataSource(
        "api-1",
        "API Data",
        "https://api.example.com/data"
      );

      expect(source.type).toBe("api");
      expect(source.url).toBe("https://api.example.com/data");
      expect(source.method).toBe("GET");
      expect(source.cacheEnabled).toBe(true);
    });

    it("should create static data source", () => {
      const source = createStaticDataSource("static-1", "Static Data", {
        items: [1, 2, 3],
      });

      expect(source.type).toBe("static");
      expect(source.data).toEqual({ items: [1, 2, 3] });
    });

    it("should create computed data source", () => {
      const computeFn = () => ({ timestamp: Date.now() });
      const source = createComputedDataSource(
        "computed-1",
        "Computed Data",
        computeFn
      );

      expect(source.type).toBe("computed");
      expect(source.computeFn).toBe(computeFn);
    });
  });
});
