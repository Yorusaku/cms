import { describe, it, expect, beforeEach } from "vitest";
import {
  ConditionEngine,
  IConditionalRule,
  EvaluationContext,
  ConditionBuilders,
  createSimpleCondition,
  createAndCondition,
  createOrCondition,
} from "../utils/condition-engine";

describe("ConditionEngine", () => {
  let engine: ConditionEngine;

  beforeEach(() => {
    engine = new ConditionEngine();
  });

  describe("Simple Conditions", () => {
    it("should evaluate equals condition", () => {
      const condition = createSimpleCondition("status", "==", "active");
      const context: EvaluationContext = {
        componentState: { status: "active" },
        pageState: {},
      };

      const result = engine.evaluateCondition(condition, context);
      expect(result).toBe(true);
    });

    it("should evaluate not equals condition", () => {
      const condition = createSimpleCondition("status", "!=", "inactive");
      const context: EvaluationContext = {
        componentState: { status: "active" },
        pageState: {},
      };

      const result = engine.evaluateCondition(condition, context);
      expect(result).toBe(true);
    });

    it("should evaluate greater than condition", () => {
      const condition = createSimpleCondition("price", ">", 100);
      const context: EvaluationContext = {
        componentState: { price: 150 },
        pageState: {},
      };

      const result = engine.evaluateCondition(condition, context);
      expect(result).toBe(true);
    });

    it("should evaluate less than condition", () => {
      const condition = createSimpleCondition("price", "<", 100);
      const context: EvaluationContext = {
        componentState: { price: 50 },
        pageState: {},
      };

      const result = engine.evaluateCondition(condition, context);
      expect(result).toBe(true);
    });

    it("should evaluate in condition", () => {
      const condition = createSimpleCondition("status", "in", [
        "active",
        "pending",
      ]);
      const context: EvaluationContext = {
        componentState: { status: "active" },
        pageState: {},
      };

      const result = engine.evaluateCondition(condition, context);
      expect(result).toBe(true);
    });

    it("should evaluate contains condition", () => {
      const condition = createSimpleCondition("title", "contains", "hello");
      const context: EvaluationContext = {
        componentState: { title: "hello world" },
        pageState: {},
      };

      const result = engine.evaluateCondition(condition, context);
      expect(result).toBe(true);
    });
  });

  describe("Complex Conditions", () => {
    it("should evaluate AND condition", () => {
      const condition = createAndCondition([
        createSimpleCondition("status", "==", "active"),
        createSimpleCondition("price", ">", 100),
      ]);

      const context: EvaluationContext = {
        componentState: { status: "active", price: 150 },
        pageState: {},
      };

      const result = engine.evaluateCondition(condition, context);
      expect(result).toBe(true);
    });

    it("should fail AND condition if any condition fails", () => {
      const condition = createAndCondition([
        createSimpleCondition("status", "==", "active"),
        createSimpleCondition("price", ">", 100),
      ]);

      const context: EvaluationContext = {
        componentState: { status: "active", price: 50 },
        pageState: {},
      };

      const result = engine.evaluateCondition(condition, context);
      expect(result).toBe(false);
    });

    it("should evaluate OR condition", () => {
      const condition = createOrCondition([
        createSimpleCondition("status", "==", "active"),
        createSimpleCondition("status", "==", "pending"),
      ]);

      const context: EvaluationContext = {
        componentState: { status: "pending" },
        pageState: {},
      };

      const result = engine.evaluateCondition(condition, context);
      expect(result).toBe(true);
    });

    it("should fail OR condition if all conditions fail", () => {
      const condition = createOrCondition([
        createSimpleCondition("status", "==", "active"),
        createSimpleCondition("status", "==", "pending"),
      ]);

      const context: EvaluationContext = {
        componentState: { status: "inactive" },
        pageState: {},
      };

      const result = engine.evaluateCondition(condition, context);
      expect(result).toBe(false);
    });
  });

  describe("Conditional Rules", () => {
    it("should register and evaluate rule", () => {
      const rule: IConditionalRule = {
        id: "rule-1",
        name: "Show discount",
        condition: createSimpleCondition("price", ">", 100),
        action: "show",
        enabled: true,
      };

      engine.registerRule(rule);

      const context: EvaluationContext = {
        componentState: { price: 150 },
        pageState: {},
      };

      const result = engine.evaluateRule("rule-1", context);
      expect(result).toBe(true);
    });

    it("should unregister rule", () => {
      const rule: IConditionalRule = {
        id: "rule-1",
        name: "Show discount",
        condition: createSimpleCondition("price", ">", 100),
        action: "show",
        enabled: true,
      };

      engine.registerRule(rule);
      engine.unregisterRule("rule-1");

      expect(engine.getAllRules()).toHaveLength(0);
    });

    it("should not evaluate disabled rule", () => {
      const rule: IConditionalRule = {
        id: "rule-1",
        name: "Show discount",
        condition: createSimpleCondition("price", ">", 100),
        action: "show",
        enabled: false,
      };

      engine.registerRule(rule);

      const context: EvaluationContext = {
        componentState: { price: 150 },
        pageState: {},
      };

      const result = engine.evaluateRule("rule-1", context);
      expect(result).toBe(false);
    });
  });

  describe("Component Visibility", () => {
    it("should show component when show rule condition is met", () => {
      const rule: IConditionalRule = {
        id: "rule-1",
        name: "Show discount",
        condition: createSimpleCondition("price", ">", 100),
        action: "show",
        enabled: true,
      };

      engine.registerRule(rule);

      const context: EvaluationContext = {
        componentState: { price: 150 },
        pageState: {},
      };

      const visibility = engine.getComponentVisibility("comp-1", context);
      expect(visibility).toBe(true);
    });

    it("should hide component when show rule condition is not met", () => {
      const rule: IConditionalRule = {
        id: "rule-1",
        name: "Show discount",
        condition: createSimpleCondition("price", ">", 100),
        action: "show",
        enabled: true,
      };

      engine.registerRule(rule);

      const context: EvaluationContext = {
        componentState: { price: 50 },
        pageState: {},
      };

      const visibility = engine.getComponentVisibility("comp-1", context);
      expect(visibility).toBe(false);
    });

    it("should hide component when hide rule condition is met", () => {
      const rule: IConditionalRule = {
        id: "rule-1",
        name: "Hide discount",
        condition: createSimpleCondition("price", "<", 50),
        action: "hide",
        enabled: true,
      };

      engine.registerRule(rule);

      const context: EvaluationContext = {
        componentState: { price: 30 },
        pageState: {},
      };

      const visibility = engine.getComponentVisibility("comp-1", context);
      expect(visibility).toBe(false);
    });
  });

  describe("Component Enabled State", () => {
    it("should enable component when enable rule condition is met", () => {
      const rule: IConditionalRule = {
        id: "rule-1",
        name: "Enable button",
        condition: createSimpleCondition("hasItems", "==", true),
        action: "enable",
        enabled: true,
      };

      engine.registerRule(rule);

      const context: EvaluationContext = {
        componentState: { hasItems: true },
        pageState: {},
      };

      const enabled = engine.getComponentEnabled("comp-1", context);
      expect(enabled).toBe(true);
    });

    it("should disable component when disable rule condition is met", () => {
      const rule: IConditionalRule = {
        id: "rule-1",
        name: "Disable button",
        condition: createSimpleCondition("isLoading", "==", true),
        action: "disable",
        enabled: true,
      };

      engine.registerRule(rule);

      const context: EvaluationContext = {
        componentState: { isLoading: true },
        pageState: {},
      };

      const enabled = engine.getComponentEnabled("comp-1", context);
      expect(enabled).toBe(false);
    });
  });

  describe("Custom Actions", () => {
    it("should apply custom action", () => {
      const rule: IConditionalRule = {
        id: "rule-1",
        name: "Custom action",
        condition: createSimpleCondition("price", ">", 100),
        action: "custom",
        customAction: (context) => {
          return context.componentState.price * 0.9; // 10% discount
        },
        enabled: true,
      };

      engine.registerRule(rule);

      const context: EvaluationContext = {
        componentState: { price: 150 },
        pageState: {},
      };

      const result = engine.applyCustomAction("rule-1", context);
      expect(result).toBe(135);
    });

    it("should not apply custom action if condition is not met", () => {
      const rule: IConditionalRule = {
        id: "rule-1",
        name: "Custom action",
        condition: createSimpleCondition("price", ">", 100),
        action: "custom",
        customAction: (context) => {
          return context.componentState.price * 0.9;
        },
        enabled: true,
      };

      engine.registerRule(rule);

      const context: EvaluationContext = {
        componentState: { price: 50 },
        pageState: {},
      };

      const result = engine.applyCustomAction("rule-1", context);
      expect(result).toBeNull();
    });
  });

  describe("Condition Builders", () => {
    it("should build equals condition", () => {
      const condition = ConditionBuilders.equals("status", "active");
      const context: EvaluationContext = {
        componentState: { status: "active" },
        pageState: {},
      };

      const result = engine.evaluateCondition(condition, context);
      expect(result).toBe(true);
    });

    it("should build greater than condition", () => {
      const condition = ConditionBuilders.greaterThan("price", 100);
      const context: EvaluationContext = {
        componentState: { price: 150 },
        pageState: {},
      };

      const result = engine.evaluateCondition(condition, context);
      expect(result).toBe(true);
    });

    it("should build in condition", () => {
      const condition = ConditionBuilders.in("status", ["active", "pending"]);
      const context: EvaluationContext = {
        componentState: { status: "active" },
        pageState: {},
      };

      const result = engine.evaluateCondition(condition, context);
      expect(result).toBe(true);
    });

    it("should build isTruthy condition", () => {
      const condition = ConditionBuilders.isTruthy("isActive");
      const context: EvaluationContext = {
        componentState: { isActive: true },
        pageState: {},
      };

      const result = engine.evaluateCondition(condition, context);
      expect(result).toBe(true);
    });

    it("should build isEmpty condition", () => {
      const condition = ConditionBuilders.isEmpty("title");
      const context: EvaluationContext = {
        componentState: { title: "" },
        pageState: {},
      };

      const result = engine.evaluateCondition(condition, context);
      expect(result).toBe(true);
    });
  });

  describe("Rule Management", () => {
    it("should get rules by action type", () => {
      const showRule: IConditionalRule = {
        id: "rule-1",
        name: "Show",
        condition: createSimpleCondition("price", ">", 100),
        action: "show",
        enabled: true,
      };

      const hideRule: IConditionalRule = {
        id: "rule-2",
        name: "Hide",
        condition: createSimpleCondition("price", "<", 50),
        action: "hide",
        enabled: true,
      };

      engine.registerRule(showRule);
      engine.registerRule(hideRule);

      const showRules = engine.getRulesByAction("show");
      expect(showRules).toHaveLength(1);
      expect(showRules[0].id).toBe("rule-1");
    });

    it("should enable/disable rule", () => {
      const rule: IConditionalRule = {
        id: "rule-1",
        name: "Show",
        condition: createSimpleCondition("price", ">", 100),
        action: "show",
        enabled: true,
      };

      engine.registerRule(rule);

      const context: EvaluationContext = {
        componentState: { price: 150 },
        pageState: {},
      };

      let result = engine.evaluateRule("rule-1", context);
      expect(result).toBe(true);

      engine.setRuleEnabled("rule-1", false);
      result = engine.evaluateRule("rule-1", context);
      expect(result).toBe(false);
    });

    it("should clear all rules", () => {
      const rule: IConditionalRule = {
        id: "rule-1",
        name: "Show",
        condition: createSimpleCondition("price", ">", 100),
        action: "show",
        enabled: true,
      };

      engine.registerRule(rule);
      engine.clearAllRules();

      expect(engine.getAllRules()).toHaveLength(0);
    });
  });

  describe("Statistics", () => {
    it("should provide statistics", () => {
      const rule: IConditionalRule = {
        id: "rule-1",
        name: "Show",
        condition: createSimpleCondition("price", ">", 100),
        action: "show",
        enabled: true,
      };

      engine.registerRule(rule);

      const stats = engine.getStatistics();
      expect(stats.totalRules).toBe(1);
      expect(stats.enabledRules).toBe(1);
      expect(stats.showRules).toBe(1);
    });
  });
});
