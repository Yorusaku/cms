import { describe, it, expect } from "vitest";
import {
  operatorValueToExpression,
  expressionToOperatorValue,
  serializeCondition,
  deserializeCondition,
  createEmptyGroup,
  conditionToExpressionString,
  operatorNeedsValue,
} from "../utils/condition-serializer";
import type { ILinkageCondition } from "../utils/linkage-engine";
import type { IConditionGroup } from "../utils/condition-serializer";

describe("condition-serializer", () => {
  // ==================== operatorValueToExpression ====================
  describe("operatorValueToExpression", () => {
    it("gt: value > 100", () => {
      expect(operatorValueToExpression("gt", "100")).toBe("value > 100");
    });

    it("lt: value < 50", () => {
      expect(operatorValueToExpression("lt", "50")).toBe("value < 50");
    });

    it("gte: value >= 18", () => {
      expect(operatorValueToExpression("gte", "18")).toBe("value >= 18");
    });

    it("lte: value <= 65", () => {
      expect(operatorValueToExpression("lte", "65")).toBe("value <= 65");
    });

    it("eq: value === 'VIP' (string wrapping)", () => {
      expect(operatorValueToExpression("eq", "VIP")).toBe("value === 'VIP'");
    });

    it("ne: value !== 'admin'", () => {
      expect(operatorValueToExpression("ne", "admin")).toBe("value !== 'admin'");
    });

    it("contains: String(value).includes('test')", () => {
      expect(operatorValueToExpression("contains", "test")).toBe(
        "String(value).includes('test')"
      );
    });

    it("isEmpty: no value needed", () => {
      expect(operatorValueToExpression("isEmpty", "")).toBe(
        "value === '' || value === null || value === undefined"
      );
    });

    it("isNotEmpty: no value needed", () => {
      expect(operatorValueToExpression("isNotEmpty", "")).toBe(
        "value !== '' && value !== null && value !== undefined"
      );
    });

    it("escapes single quotes in string values", () => {
      expect(operatorValueToExpression("eq", "it's")).toBe("value === 'it\\'s'");
    });
  });

  // ==================== expressionToOperatorValue ====================
  describe("expressionToOperatorValue", () => {
    it("parses 'value > 100' → gt", () => {
      const result = expressionToOperatorValue("value > 100");
      expect(result).toEqual({ operator: "gt", value: "100" });
    });

    it("parses 'value < 50' → lt", () => {
      const result = expressionToOperatorValue("value < 50");
      expect(result).toEqual({ operator: "lt", value: "50" });
    });

    it("parses multi-char operators with priority (>= before >)", () => {
      const result = expressionToOperatorValue("value >= 18");
      expect(result).toEqual({ operator: "gte", value: "18" });
    });

    it("parses <= before <", () => {
      const result = expressionToOperatorValue("value <= 65");
      expect(result).toEqual({ operator: "lte", value: "65" });
    });

    it("parses === before =", () => {
      const result = expressionToOperatorValue("value === 'VIP'");
      expect(result).toEqual({ operator: "eq", value: "VIP" });
    });

    it("parses !== before !=", () => {
      const result = expressionToOperatorValue("value !== 'admin'");
      expect(result).toEqual({ operator: "ne", value: "admin" });
    });

    it("parses contains expression", () => {
      const result = expressionToOperatorValue("String(value).includes('test')");
      expect(result).toEqual({ operator: "contains", value: "test" });
    });

    it("parses isEmpty expression", () => {
      const result = expressionToOperatorValue(
        "value === '' || value === null || value === undefined"
      );
      expect(result).toEqual({ operator: "isEmpty", value: "" });
    });

    it("parses isNotEmpty expression", () => {
      const result = expressionToOperatorValue(
        "value !== '' && value !== null && value !== undefined"
      );
      expect(result).toEqual({ operator: "isNotEmpty", value: "" });
    });

    it("returns null for complex expressions", () => {
      const result = expressionToOperatorValue("value > 100 && value < 500");
      expect(result).toBeNull();
    });

    it("returns null for empty expression", () => {
      expect(expressionToOperatorValue("")).toBeNull();
      expect(expressionToOperatorValue("  ")).toBeNull();
    });

    it("unquotes single-quoted string values", () => {
      const result = expressionToOperatorValue("value === 'hello'");
      expect(result).toEqual({ operator: "eq", value: "hello" });
    });
  });

  // ==================== serializeCondition + deserializeCondition ====================
  describe("serializeCondition ↔ deserializeCondition round-trip", () => {
    it("single row: round-trips", () => {
      const group: IConditionGroup = {
        id: "g1",
        type: "group",
        operator: "AND",
        conditions: [{ id: "r1", operator: "gt", value: "100" }],
      };

      const serialized = serializeCondition(group);
      expect(serialized).toBeDefined();
      expect(serialized!.type).toBe("simple");
      expect(serialized!.expression).toBe("value > 100");

      const deserialized = deserializeCondition(serialized);
      expect(deserialized).not.toBeNull();
      expect(deserialized!.conditions).toHaveLength(1);
      const row: any = deserialized!.conditions[0];
      expect(row.operator).toBe("gt");
      expect(row.value).toBe("100");
    });

    it("multiple rows with AND: round-trips", () => {
      const group: IConditionGroup = {
        id: "g1",
        type: "group",
        operator: "AND",
        conditions: [
          { id: "r1", operator: "gt", value: "100" },
          { id: "r2", operator: "lt", value: "500" },
        ],
      };

      const serialized = serializeCondition(group)!;
      expect(serialized.type).toBe("complex");
      expect(serialized.operator).toBe("AND");
      expect(serialized.conditions).toHaveLength(2);

      const deserialized = deserializeCondition(serialized);
      expect(deserialized).not.toBeNull();
      expect(deserialized!.operator).toBe("AND");
      expect(deserialized!.conditions).toHaveLength(2);
    });

    it("multiple rows with OR: round-trips", () => {
      const group: IConditionGroup = {
        id: "g1",
        type: "group",
        operator: "OR",
        conditions: [
          { id: "r1", operator: "eq", value: "VIP" },
          { id: "r2", operator: "eq", value: "admin" },
        ],
      };

      const serialized = serializeCondition(group)!;
      expect(serialized.type).toBe("complex");
      expect(serialized.operator).toBe("OR");

      const deserialized = deserializeCondition(serialized);
      expect(deserialized!.operator).toBe("OR");
    });

    it("nested groups: round-trips", () => {
      const inner: IConditionGroup = {
        id: "inner",
        type: "group",
        operator: "OR",
        conditions: [
          { id: "r1", operator: "eq", value: "VIP" },
          { id: "r2", operator: "eq", value: "admin" },
        ],
      };

      const outer: IConditionGroup = {
        id: "outer",
        type: "group",
        operator: "AND",
        conditions: [
          { id: "r3", operator: "gt", value: "100" },
          inner,
        ],
      };

      const serialized = serializeCondition(outer)!;
      expect(serialized.type).toBe("complex");

      const deserialized = deserializeCondition(serialized);
      expect(deserialized).not.toBeNull();
      expect(deserialized!.conditions).toHaveLength(2);
    });

    it("empty group returns undefined", () => {
      const group: IConditionGroup = {
        id: "g1",
        type: "group",
        operator: "AND",
        conditions: [],
      };
      expect(serializeCondition(group)).toBeUndefined();
    });

    it("null group returns undefined", () => {
      expect(serializeCondition(null)).toBeUndefined();
    });

    it("deserializeCondition returns null for null/undefined", () => {
      expect(deserializeCondition(null)).toBeNull();
      expect(deserializeCondition(undefined)).toBeNull();
    });

    it("deserializeCondition returns null for unparseable expression", () => {
      const stored: ILinkageCondition = {
        type: "simple",
        expression: "value > 100 && value < 500",
      };
      expect(deserializeCondition(stored)).toBeNull();
    });
  });

  // ==================== createEmptyGroup ====================
  describe("createEmptyGroup", () => {
    it("creates a group with one default row", () => {
      const group = createEmptyGroup();
      expect(group.type).toBe("group");
      expect(group.operator).toBe("AND");
      expect(group.conditions).toHaveLength(1);
      expect(group.conditions[0]).toHaveProperty("operator", "gt");
    });
  });

  // ==================== conditionToExpressionString ====================
  describe("conditionToExpressionString", () => {
    it("returns '无条件' for null", () => {
      expect(conditionToExpressionString(null)).toBe("无条件");
    });

    it("returns expression for simple", () => {
      expect(conditionToExpressionString({ type: "simple", expression: "value > 100" })).toBe(
        "value > 100"
      );
    });

    it("returns summary for complex", () => {
      expect(
        conditionToExpressionString({
          type: "complex",
          operator: "AND",
          conditions: [
            { type: "simple", expression: "a" },
            { type: "simple", expression: "b" },
          ],
        })
      ).toBe("AND (2 个子条件)");
    });
  });

  // ==================== operatorNeedsValue ====================
  describe("operatorNeedsValue", () => {
    it("isEmpty does not need value", () => {
      expect(operatorNeedsValue("isEmpty")).toBe(false);
    });

    it("isNotEmpty does not need value", () => {
      expect(operatorNeedsValue("isNotEmpty")).toBe(false);
    });

    it("gt needs value", () => {
      expect(operatorNeedsValue("gt")).toBe(true);
    });
  });
});
