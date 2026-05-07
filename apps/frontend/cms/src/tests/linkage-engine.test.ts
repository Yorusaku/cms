import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  LinkageEngine,
  IComponentLinkage,
  LinkageTransforms,
} from "../utils/linkage-engine";

describe("LinkageEngine", () => {
  let engine: LinkageEngine;

  beforeEach(() => {
    engine = new LinkageEngine();
  });

  afterEach(() => {
    engine.clearAllLinkages();
  });

  describe("Linkage Registration", () => {
    it("should register a linkage", () => {
      const linkage: IComponentLinkage = {
        id: "link-1",
        sourceComponentId: "comp-1",
        targetComponentId: "comp-2",
        sourceProperty: "price",
        targetProperty: "totalPrice",
        enabled: true,
      };

      engine.registerLinkage(linkage);
      const allLinkages = engine.getAllLinkages();

      expect(allLinkages).toHaveLength(1);
      expect(allLinkages[0].id).toBe("link-1");
    });

    it("should not register duplicate linkage", () => {
      const linkage: IComponentLinkage = {
        id: "link-1",
        sourceComponentId: "comp-1",
        targetComponentId: "comp-2",
        sourceProperty: "price",
        targetProperty: "totalPrice",
        enabled: true,
      };

      engine.registerLinkage(linkage);
      engine.registerLinkage(linkage);

      expect(engine.getAllLinkages()).toHaveLength(1);
    });

    it("should unregister a linkage", () => {
      const linkage: IComponentLinkage = {
        id: "link-1",
        sourceComponentId: "comp-1",
        targetComponentId: "comp-2",
        sourceProperty: "price",
        targetProperty: "totalPrice",
        enabled: true,
      };

      engine.registerLinkage(linkage);
      engine.unregisterLinkage("link-1");

      expect(engine.getAllLinkages()).toHaveLength(0);
    });
  });

  describe("Linkage Triggering", () => {
    it("should trigger linkage and update target component", () => {
      const linkage: IComponentLinkage = {
        id: "link-1",
        sourceComponentId: "comp-1",
        targetComponentId: "comp-2",
        sourceProperty: "price",
        targetProperty: "totalPrice",
        enabled: true,
      };

      engine.registerLinkage(linkage);
      engine.triggerLinkage("comp-1", "price", 100);

      const targetState = engine.getComponentState("comp-2");
      expect(targetState.totalPrice).toBe(100);
    });

    it("should apply transformation function", () => {
      const linkage: IComponentLinkage = {
        id: "link-1",
        sourceComponentId: "comp-1",
        targetComponentId: "comp-2",
        sourceProperty: "price",
        targetProperty: "totalPrice",
        transformFn: (value) => value * 1.1, // Add 10%
        enabled: true,
      };

      engine.registerLinkage(linkage);
      engine.triggerLinkage("comp-1", "price", 100);

      const targetState = engine.getComponentState("comp-2");
      expect(targetState.totalPrice).toBe(110);
    });

    it("should evaluate condition before triggering linkage", () => {
      const linkage: IComponentLinkage = {
        id: "link-1",
        sourceComponentId: "comp-1",
        targetComponentId: "comp-2",
        sourceProperty: "price",
        targetProperty: "totalPrice",
        condition: {
          type: "simple",
          expression: "value > 100",
        },
        enabled: true,
      };

      engine.registerLinkage(linkage);

      // Should not trigger (value <= 100)
      engine.triggerLinkage("comp-1", "price", 50);
      let targetState = engine.getComponentState("comp-2");
      expect(targetState.totalPrice).toBeUndefined();

      // Should trigger (value > 100)
      engine.triggerLinkage("comp-1", "price", 150);
      targetState = engine.getComponentState("comp-2");
      expect(targetState.totalPrice).toBe(150);
    });
  });

  describe("Event Subscription", () => {
    it("should notify subscribers of linkage events", () => {
      const linkage: IComponentLinkage = {
        id: "link-1",
        sourceComponentId: "comp-1",
        targetComponentId: "comp-2",
        sourceProperty: "price",
        targetProperty: "totalPrice",
        enabled: true,
      };

      engine.registerLinkage(linkage);

      let eventReceived = false;
      let receivedValue = 0;

      engine.subscribe("comp-2", (event) => {
        eventReceived = true;
        receivedValue = event.value;
      });

      engine.triggerLinkage("comp-1", "price", 100);

      expect(eventReceived).toBe(true);
      expect(receivedValue).toBe(100);
    });

    it("should allow unsubscribing from events", () => {
      const linkage: IComponentLinkage = {
        id: "link-1",
        sourceComponentId: "comp-1",
        targetComponentId: "comp-2",
        sourceProperty: "price",
        targetProperty: "totalPrice",
        enabled: true,
      };

      engine.registerLinkage(linkage);

      let callCount = 0;
      const unsubscribe = engine.subscribe("comp-2", () => {
        callCount++;
      });

      engine.triggerLinkage("comp-1", "price", 100);
      expect(callCount).toBe(1);

      unsubscribe();

      engine.triggerLinkage("comp-1", "price", 200);
      expect(callCount).toBe(1); // Should not increase
    });
  });

  describe("Transformation Functions", () => {
    it("should apply uppercase transformation", () => {
      const linkage: IComponentLinkage = {
        id: "link-1",
        sourceComponentId: "comp-1",
        targetComponentId: "comp-2",
        sourceProperty: "title",
        targetProperty: "displayTitle",
        transformFn: LinkageTransforms.uppercase,
        enabled: true,
      };

      engine.registerLinkage(linkage);
      engine.triggerLinkage("comp-1", "title", "hello");

      const targetState = engine.getComponentState("comp-2");
      expect(targetState.displayTitle).toBe("HELLO");
    });

    it("should apply multiply transformation", () => {
      const linkage: IComponentLinkage = {
        id: "link-1",
        sourceComponentId: "comp-1",
        targetComponentId: "comp-2",
        sourceProperty: "price",
        targetProperty: "totalPrice",
        transformFn: LinkageTransforms.multiply(1.2),
        enabled: true,
      };

      engine.registerLinkage(linkage);
      engine.triggerLinkage("comp-1", "price", 100);

      const targetState = engine.getComponentState("comp-2");
      expect(targetState.totalPrice).toBe(120);
    });

    it("should apply clamp transformation", () => {
      const linkage: IComponentLinkage = {
        id: "link-1",
        sourceComponentId: "comp-1",
        targetComponentId: "comp-2",
        sourceProperty: "value",
        targetProperty: "clampedValue",
        transformFn: LinkageTransforms.clamp(0, 100),
        enabled: true,
      };

      engine.registerLinkage(linkage);

      engine.triggerLinkage("comp-1", "value", 150);
      let targetState = engine.getComponentState("comp-2");
      expect(targetState.clampedValue).toBe(100);

      engine.triggerLinkage("comp-1", "value", -50);
      targetState = engine.getComponentState("comp-2");
      expect(targetState.clampedValue).toBe(0);
    });
  });

  describe("Linkage History", () => {
    it("should record linkage events in history", () => {
      const linkage: IComponentLinkage = {
        id: "link-1",
        sourceComponentId: "comp-1",
        targetComponentId: "comp-2",
        sourceProperty: "price",
        targetProperty: "totalPrice",
        enabled: true,
      };

      engine.registerLinkage(linkage);
      engine.triggerLinkage("comp-1", "price", 100);
      engine.triggerLinkage("comp-1", "price", 200);

      const history = engine.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].value).toBe(100);
      expect(history[1].value).toBe(200);
    });

    it("should limit history size", () => {
      const linkage: IComponentLinkage = {
        id: "link-1",
        sourceComponentId: "comp-1",
        targetComponentId: "comp-2",
        sourceProperty: "price",
        targetProperty: "totalPrice",
        enabled: true,
      };

      engine.registerLinkage(linkage);

      // Trigger more than max history size
      for (let i = 0; i < 150; i++) {
        engine.triggerLinkage("comp-1", "price", i);
      }

      const history = engine.getHistory();
      expect(history.length).toBeLessThanOrEqual(100);
    });

    it("should clear history", () => {
      const linkage: IComponentLinkage = {
        id: "link-1",
        sourceComponentId: "comp-1",
        targetComponentId: "comp-2",
        sourceProperty: "price",
        targetProperty: "totalPrice",
        enabled: true,
      };

      engine.registerLinkage(linkage);
      engine.triggerLinkage("comp-1", "price", 100);

      engine.clearHistory();
      expect(engine.getHistory()).toHaveLength(0);
    });
  });

  describe("Linkage Control", () => {
    it("should enable/disable linkage", () => {
      const linkage: IComponentLinkage = {
        id: "link-1",
        sourceComponentId: "comp-1",
        targetComponentId: "comp-2",
        sourceProperty: "price",
        targetProperty: "totalPrice",
        enabled: true,
      };

      engine.registerLinkage(linkage);
      engine.triggerLinkage("comp-1", "price", 100);

      let targetState = engine.getComponentState("comp-2");
      expect(targetState.totalPrice).toBe(100);

      // Disable linkage
      engine.setLinkageEnabled("link-1", false);
      engine.triggerLinkage("comp-1", "price", 200);

      targetState = engine.getComponentState("comp-2");
      expect(targetState.totalPrice).toBe(100); // Should not update
    });

    it("should get linkages for component", () => {
      const linkage1: IComponentLinkage = {
        id: "link-1",
        sourceComponentId: "comp-1",
        targetComponentId: "comp-2",
        sourceProperty: "price",
        targetProperty: "totalPrice",
        enabled: true,
      };

      const linkage2: IComponentLinkage = {
        id: "link-2",
        sourceComponentId: "comp-1",
        targetComponentId: "comp-3",
        sourceProperty: "price",
        targetProperty: "discount",
        enabled: true,
      };

      engine.registerLinkage(linkage1);
      engine.registerLinkage(linkage2);

      const linkages = engine.getLinkagesForComponent("comp-1");
      expect(linkages).toHaveLength(2);
    });
  });

  describe("Statistics", () => {
    it("should provide statistics", () => {
      const linkage: IComponentLinkage = {
        id: "link-1",
        sourceComponentId: "comp-1",
        targetComponentId: "comp-2",
        sourceProperty: "price",
        targetProperty: "totalPrice",
        enabled: true,
      };

      engine.registerLinkage(linkage);
      engine.triggerLinkage("comp-1", "price", 100);

      const stats = engine.getStatistics();
      expect(stats.totalLinkages).toBe(1);
      expect(stats.enabledLinkages).toBe(1);
      expect(stats.totalComponents).toBe(2);
      expect(stats.historySize).toBe(1);
    });
  });
});
