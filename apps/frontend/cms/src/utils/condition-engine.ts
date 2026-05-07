/**
 * Condition Engine
 *
 * Evaluates conditions to determine component visibility and behavior.
 * Supports complex conditional logic with AND/OR operators.
 */

export interface IConditionExpression {
  type: "simple" | "complex";
  operator?: "AND" | "OR";
  conditions?: IConditionExpression[];
  // Simple condition fields
  field?: string;
  operator?: "==" | "!=" | ">" | "<" | ">=" | "<=" | "in" | "contains";
  value?: any;
}

export interface IConditionalRule {
  id: string;
  name: string;
  condition: IConditionExpression;
  action: "show" | "hide" | "enable" | "disable" | "custom";
  customAction?: (context: any) => any;
  enabled: boolean;
}

export interface EvaluationContext {
  componentState: Record<string, any>;
  pageState: Record<string, any>;
  userData?: Record<string, any>;
  timestamp?: number;
}

/**
 * ConditionEngine evaluates conditions and applies rules
 */
export class ConditionEngine {
  private rules = new Map<string, IConditionalRule>();
  private evaluationCache = new Map<string, boolean>();
  private cacheTimeout = 1000; // 1 second
  private lastCacheTime = 0;

  /**
   * Register a conditional rule
   */
  registerRule(rule: IConditionalRule): void {
    if (this.rules.has(rule.id)) {
      console.warn(`Rule ${rule.id} already exists`);
      return;
    }
    this.rules.set(rule.id, rule);
  }

  /**
   * Unregister a rule
   */
  unregisterRule(ruleId: string): void {
    this.rules.delete(ruleId);
    this.evaluationCache.delete(ruleId);
  }

  /**
   * Evaluate a condition expression
   */
  evaluateCondition(
    condition: IConditionExpression,
    context: EvaluationContext
  ): boolean {
    if (condition.type === "simple") {
      return this.evaluateSimpleCondition(condition, context);
    }

    if (condition.type === "complex") {
      return this.evaluateComplexCondition(condition, context);
    }

    return true;
  }

  /**
   * Evaluate a simple condition
   */
  private evaluateSimpleCondition(
    condition: IConditionExpression,
    context: EvaluationContext
  ): boolean {
    const { field, operator, value } = condition;

    if (!field) {
      return true;
    }

    const fieldValue = this.getFieldValue(field, context);

    switch (operator) {
      case "==":
        return fieldValue == value;
      case "!=":
        return fieldValue != value;
      case ">":
        return Number(fieldValue) > Number(value);
      case "<":
        return Number(fieldValue) < Number(value);
      case ">=":
        return Number(fieldValue) >= Number(value);
      case "<=":
        return Number(fieldValue) <= Number(value);
      case "in":
        return Array.isArray(value) && value.includes(fieldValue);
      case "contains":
        return String(fieldValue).includes(String(value));
      default:
        return true;
    }
  }

  /**
   * Evaluate a complex condition
   */
  private evaluateComplexCondition(
    condition: IConditionExpression,
    context: EvaluationContext
  ): boolean {
    if (!condition.conditions || condition.conditions.length === 0) {
      return true;
    }

    const operator = condition.operator || "AND";
    const results = condition.conditions.map((c) =>
      this.evaluateCondition(c, context)
    );

    if (operator === "AND") {
      return results.every((r) => r);
    } else if (operator === "OR") {
      return results.some((r) => r);
    }

    return true;
  }

  /**
   * Get field value from context
   */
  private getFieldValue(field: string, context: EvaluationContext): any {
    // Support nested field access: "componentState.title"
    const parts = field.split(".");
    let value: any = context;

    for (const part of parts) {
      if (value && typeof value === "object") {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Evaluate a rule
   */
  evaluateRule(ruleId: string, context: EvaluationContext): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule || !rule.enabled) {
      return false;
    }

    // Check cache
    const now = Date.now();
    if (now - this.lastCacheTime < this.cacheTimeout) {
      const cached = this.evaluationCache.get(ruleId);
      if (cached !== undefined) {
        return cached;
      }
    } else {
      this.evaluationCache.clear();
      this.lastCacheTime = now;
    }

    const result = this.evaluateCondition(rule.condition, context);
    this.evaluationCache.set(ruleId, result);

    return result;
  }

  /**
   * Evaluate all rules for a component
   */
  evaluateRulesForComponent(
    componentId: string,
    context: EvaluationContext
  ): Map<string, boolean> {
    const results = new Map<string, boolean>();

    for (const [ruleId, rule] of this.rules) {
      const result = this.evaluateRule(ruleId, context);
      results.set(ruleId, result);
    }

    return results;
  }

  /**
   * Get visibility for a component based on rules
   */
  getComponentVisibility(
    componentId: string,
    context: EvaluationContext
  ): boolean {
    let isVisible = true;

    for (const [, rule] of this.rules) {
      if (!rule.enabled) {
        continue;
      }

      const conditionMet = this.evaluateCondition(rule.condition, context);

      if (rule.action === "show" && !conditionMet) {
        isVisible = false;
        break;
      }

      if (rule.action === "hide" && conditionMet) {
        isVisible = false;
        break;
      }
    }

    return isVisible;
  }

  /**
   * Get enabled state for a component based on rules
   */
  getComponentEnabled(
    componentId: string,
    context: EvaluationContext
  ): boolean {
    let isEnabled = true;

    for (const [, rule] of this.rules) {
      if (!rule.enabled) {
        continue;
      }

      const conditionMet = this.evaluateCondition(rule.condition, context);

      if (rule.action === "enable" && !conditionMet) {
        isEnabled = false;
        break;
      }

      if (rule.action === "disable" && conditionMet) {
        isEnabled = false;
        break;
      }
    }

    return isEnabled;
  }

  /**
   * Apply custom action for a rule
   */
  applyCustomAction(ruleId: string, context: EvaluationContext): any {
    const rule = this.rules.get(ruleId);
    if (!rule || !rule.customAction) {
      return null;
    }

    const conditionMet = this.evaluateCondition(rule.condition, context);
    if (!conditionMet) {
      return null;
    }

    try {
      return rule.customAction(context);
    } catch (error) {
      console.error(`Error in custom action for rule ${ruleId}:`, error);
      return null;
    }
  }

  /**
   * Get all rules
   */
  getAllRules(): IConditionalRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get rules by action type
   */
  getRulesByAction(action: string): IConditionalRule[] {
    return Array.from(this.rules.values()).filter((r) => r.action === action);
  }

  /**
   * Enable/disable a rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
      this.evaluationCache.delete(ruleId);
    }
  }

  /**
   * Clear all rules
   */
  clearAllRules(): void {
    this.rules.clear();
    this.evaluationCache.clear();
  }

  /**
   * Get rule statistics
   */
  getStatistics() {
    return {
      totalRules: this.rules.size,
      enabledRules: Array.from(this.rules.values()).filter((r) => r.enabled)
        .length,
      showRules: this.getRulesByAction("show").length,
      hideRules: this.getRulesByAction("hide").length,
      enableRules: this.getRulesByAction("enable").length,
      disableRules: this.getRulesByAction("disable").length,
      customRules: this.getRulesByAction("custom").length,
    };
  }
}

/**
 * Create a singleton instance of ConditionEngine
 */
let instance: ConditionEngine | null = null;

export function getConditionEngine(): ConditionEngine {
  if (!instance) {
    instance = new ConditionEngine();
  }
  return instance;
}

export function createConditionEngine(): ConditionEngine {
  return new ConditionEngine();
}

/**
 * Helper function to create simple conditions
 */
export function createSimpleCondition(
  field: string,
  operator: string,
  value: any
): IConditionExpression {
  return {
    type: "simple",
    field,
    operator: operator as any,
    value,
  };
}

/**
 * Helper function to create complex conditions
 */
export function createComplexCondition(
  operator: "AND" | "OR",
  conditions: IConditionExpression[]
): IConditionExpression {
  return {
    type: "complex",
    operator,
    conditions,
  };
}

/**
 * Helper function to create AND condition
 */
export function createAndCondition(
  conditions: IConditionExpression[]
): IConditionExpression {
  return createComplexCondition("AND", conditions);
}

/**
 * Helper function to create OR condition
 */
export function createOrCondition(
  conditions: IConditionExpression[]
): IConditionExpression {
  return createComplexCondition("OR", conditions);
}

/**
 * Common condition builders
 */
export const ConditionBuilders = {
  // Check if field equals value
  equals: (field: string, value: any) =>
    createSimpleCondition(field, "==", value),

  // Check if field not equals value
  notEquals: (field: string, value: any) =>
    createSimpleCondition(field, "!=", value),

  // Check if field is greater than value
  greaterThan: (field: string, value: any) =>
    createSimpleCondition(field, ">", value),

  // Check if field is less than value
  lessThan: (field: string, value: any) =>
    createSimpleCondition(field, "<", value),

  // Check if field is in array
  in: (field: string, values: any[]) =>
    createSimpleCondition(field, "in", values),

  // Check if field contains value
  contains: (field: string, value: any) =>
    createSimpleCondition(field, "contains", value),

  // Check if field is truthy
  isTruthy: (field: string) =>
    createSimpleCondition(field, "!=", false),

  // Check if field is falsy
  isFalsy: (field: string) =>
    createSimpleCondition(field, "==", false),

  // Check if field is empty
  isEmpty: (field: string) =>
    createSimpleCondition(field, "==", ""),

  // Check if field is not empty
  isNotEmpty: (field: string) =>
    createSimpleCondition(field, "!=", ""),
};
