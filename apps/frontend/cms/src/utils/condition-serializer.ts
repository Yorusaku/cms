/**
 * Condition Serializer — bidirectional conversion between visual model and stored ILinkageCondition format.
 *
 * Visual model: structured rows + nested groups for the condition builder UI.
 * Stored format: ILinkageCondition { type, expression, operator, conditions } from linkage-engine.
 */
import type { ILinkageCondition } from './linkage-engine';

// ==================== Visual Model Types ====================

export interface IConditionRow {
  id: string;
  operator: OperatorType;
  value: string;
}

export interface IConditionGroup {
  id: string;
  type: 'group';
  operator: 'AND' | 'OR';
  conditions: (IConditionRow | IConditionGroup)[];
}

export type OperatorType =
  | 'gt'
  | 'lt'
  | 'eq'
  | 'ne'
  | 'gte'
  | 'lte'
  | 'contains'
  | 'isEmpty'
  | 'isNotEmpty';

let _nextId = 0;
export function nextConditionId(): string {
  return `cond-${++_nextId}-${Date.now()}`;
}

// ==================== Operator Config ====================

interface OperatorConfig {
  label: string;
  template: (value: string) => string;
  /** Regex to parse the generated expression back. Group 1 captures the value. */
  parsePattern: RegExp;
  /** Does this operator require a value input? */
  needsValue: boolean;
}

const OPERATORS: Record<OperatorType, OperatorConfig> = {
  gt: {
    label: '大于',
    template: (v) => `value > ${v}`,
    parsePattern: /^value\s*>\s*(.+)$/,
    needsValue: true,
  },
  lt: {
    label: '小于',
    template: (v) => `value < ${v}`,
    parsePattern: /^value\s*<\s*(.+)$/,
    needsValue: true,
  },
  gte: {
    label: '大于等于',
    template: (v) => `value >= ${v}`,
    parsePattern: /^value\s*>=\s*(.+)$/,
    needsValue: true,
  },
  lte: {
    label: '小于等于',
    template: (v) => `value <= ${v}`,
    parsePattern: /^value\s*<=\s*(.+)$/,
    needsValue: true,
  },
  eq: {
    label: '等于',
    template: (v) => `value === ${v}`,
    parsePattern: /^value\s*===\s*(.+)$/,
    needsValue: true,
  },
  ne: {
    label: '不等于',
    template: (v) => `value !== ${v}`,
    parsePattern: /^value\s*!==\s*(.+)$/,
    needsValue: true,
  },
  contains: {
    label: '包含',
    template: (v) => `String(value).includes(${v})`,
    parsePattern: /^String\(value\)\.includes\((.+)\)$/,
    needsValue: true,
  },
  isEmpty: {
    label: '为空',
    template: () => `value === '' || value === null || value === undefined`,
    parsePattern: /^value\s*===\s*''\s*\|\|\s*value\s*===\s*null\s*\|\|\s*value\s*===\s*undefined$/,
    needsValue: false,
  },
  isNotEmpty: {
    label: '不为空',
    template: () => `value !== '' && value !== null && value !== undefined`,
    parsePattern: /^value\s*!==\s*''\s*&&\s*value\s*!==\s*null\s*&&\s*value\s*!==\s*undefined$/,
    needsValue: false,
  },
};

export function getOperatorLabel(op: OperatorType): string {
  return OPERATORS[op]?.label ?? op;
}

export function operatorNeedsValue(op: OperatorType): boolean {
  return OPERATORS[op]?.needsValue ?? true;
}

// ==================== Value Normalization ====================

function isNumeric(value: string): boolean {
  if (value === '') return false;
  return !isNaN(Number(value)) && isFinite(Number(value));
}

function formatValueForExpression(value: string): string {
  if (isNumeric(value)) return value;
  const escaped = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `'${escaped}'`;
}

function unquoteValue(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, '\\');
  }
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  return trimmed;
}

// ==================== Expression ↔ Operator+Value ====================

export function operatorValueToExpression(operator: OperatorType, value: string): string {
  const config = OPERATORS[operator];
  if (!config) return '';
  if (config.needsValue) {
    return config.template(formatValueForExpression(value));
  }
  return config.template('');
}

export function expressionToOperatorValue(
  expression: string
): { operator: OperatorType; value: string } | null {
  if (!expression || expression.trim() === '') return null;

  const trimmed = expression.trim();
  // Expressions with && or || are complex — can't parse as simple.
  // Exception: isEmpty/isNotEmpty contain || and && but are simple operators, check them first.
  const hasLogicalOp = /\|\||&&/.test(trimmed);

  // Check isEmpty/isNotEmpty first — they contain logical operators but are simple
  for (const op of ['isEmpty', 'isNotEmpty'] as OperatorType[]) {
    const config = OPERATORS[op];
    if (config.parsePattern.test(trimmed)) {
      return { operator: op, value: '' };
    }
  }

  // If expression has logical operators but wasn't isEmpty/isNotEmpty, it's complex
  if (hasLogicalOp) return null;

  // Check remaining operators in priority order
  const priorityOrder: OperatorType[] = ['gte', 'lte', 'eq', 'ne', 'gt', 'lt', 'contains'];
  for (const op of priorityOrder) {
    const config = OPERATORS[op];
    const match = trimmed.match(config.parsePattern);
    if (match) {
      return {
        operator: op,
        value: config.needsValue ? unquoteValue(match[1]) : '',
      };
    }
  }

  return null;
}

// ==================== Visual Model ↔ ILinkageCondition ====================

export function serializeCondition(visual: IConditionGroup | null): ILinkageCondition | undefined {
  if (!visual || visual.conditions.length === 0) return undefined;

  if (visual.conditions.length === 1) {
    const first = visual.conditions[0];
    if ('type' in first && first.type === 'group') {
      // Single nested group — flatten if possible, or serialize as complex
      const inner = serializeCondition(first);
      return inner;
    }

    // Single row
    const row = first as IConditionRow;
    const expression = operatorValueToExpression(row.operator, row.value);
    return {
      type: 'simple',
      expression,
    };
  }

  // Multiple conditions → complex
  const conditions: ILinkageCondition[] = [];
  for (const item of visual.conditions) {
    if ('type' in item && item.type === 'group') {
      const serialized = serializeCondition(item);
      if (serialized) conditions.push(serialized);
    } else {
      const row = item as IConditionRow;
      const expression = operatorValueToExpression(row.operator, row.value);
      conditions.push({ type: 'simple', expression });
    }
  }

  return {
    type: 'complex',
    operator: visual.operator,
    conditions,
  };
}

export function deserializeCondition(stored: ILinkageCondition | undefined | null): IConditionGroup | null {
  if (!stored) return null;

  if (stored.type === 'simple') {
    if (!stored.expression) return null;
    const parsed = expressionToOperatorValue(stored.expression);
    if (!parsed) return null; // Can't parse → caller falls back to advanced mode

    return {
      id: nextConditionId(),
      type: 'group',
      operator: 'AND',
      conditions: [
        {
          id: nextConditionId(),
          operator: parsed.operator,
          value: parsed.value,
        },
      ],
    };
  }

  // Complex type
  if (stored.type === 'complex' && stored.conditions) {
    const group: IConditionGroup = {
      id: nextConditionId(),
      type: 'group',
      operator: stored.operator || 'AND',
      conditions: [],
    };

    for (const child of stored.conditions) {
      if (child.type === 'simple' && child.expression) {
        const parsed = expressionToOperatorValue(child.expression);
        if (parsed) {
          group.conditions.push({
            id: nextConditionId(),
            operator: parsed.operator,
            value: parsed.value,
          });
        } else {
          // A child expression we can't parse — abort entire deserialization
          return null;
        }
      } else if (child.type === 'complex') {
        const nested = deserializeCondition(child);
        if (nested) {
          group.conditions.push(nested);
        } else {
          return null;
        }
      }
    }

    if (group.conditions.length === 0) return null;
    return group;
  }

  return null;
}

export function createEmptyGroup(): IConditionGroup {
  return {
    id: nextConditionId(),
    type: 'group',
    operator: 'AND',
    conditions: [
      {
        id: nextConditionId(),
        operator: 'gt',
        value: '',
      },
    ],
  };
}

export function conditionToExpressionString(stored: ILinkageCondition | undefined | null): string {
  if (!stored) return '无条件';
  if (stored.type === 'simple') return stored.expression ?? '(空)';
  if (stored.type === 'complex') {
    const count = stored.conditions?.length ?? 0;
    return `${stored.operator || 'AND'} (${count} 个子条件)`;
  }
  return '(未知)';
}
