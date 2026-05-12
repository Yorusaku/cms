<template>
  <div class="visual-condition-builder text-sm">
    <!-- Advanced expression mode -->
    <template v-if="showAdvanced">
      <el-input
        v-model="advancedExpression"
        type="textarea"
        :rows="2"
        placeholder="value > 100"
        class="mb-2"
      />
      <el-button size="small" text type="primary" @click="switchToVisual">
        切换到可视化配置
      </el-button>
      <div v-if="advancedError" class="text-orange-500 text-xs mt-1">
        无法解析当前表达式，请继续使用高级模式
      </div>
    </template>

    <!-- Visual builder mode -->
    <template v-else>
      <div
        class="condition-group border border-gray-200 rounded-md p-3"
        :class="{ 'ml-4 border-l-2 border-l-blue-400': depth > 0 }"
      >
        <!-- AND/OR radio for groups with multiple items -->
        <div v-if="group.conditions.length > 1" class="flex items-center gap-2 mb-2">
          <span class="text-xs text-gray-500">条件逻辑：</span>
          <el-radio-group
            :model-value="group.operator"
            size="small"
            @update:model-value="setOperator"
          >
            <el-radio-button label="AND">且</el-radio-button>
            <el-radio-button label="OR">或</el-radio-button>
          </el-radio-group>
        </div>

        <!-- Condition rows -->
        <div
          v-for="(item, idx) in group.conditions"
          :key="item.id"
          class="mb-2 last:mb-0"
        >
          <!-- Row -->
          <div v-if="!isGroupItem(item)" class="flex items-center gap-2">
            <el-select
              :model-value="getItemOp(item)"
              size="small"
              class="w-24"
              @update:model-value="(v: string) => setRowOperator(idx, v as OperatorType)"
            >
              <el-option label="大于" value="gt" />
              <el-option label="小于" value="lt" />
              <el-option label="等于" value="eq" />
              <el-option label="不等于" value="ne" />
              <el-option label="大于等于" value="gte" />
              <el-option label="小于等于" value="lte" />
              <el-option label="包含" value="contains" />
              <el-option label="为空" value="isEmpty" />
              <el-option label="不为空" value="isNotEmpty" />
            </el-select>

            <el-input
              v-if="operatorNeedsValue(getItemOp(item) as OperatorType)"
              :model-value="getItemVal(item)"
              size="small"
              placeholder="值"
              class="flex-1"
              @update:model-value="(v: string) => setRowValue(idx, v)"
            />

            <el-button
              size="small"
              text
              type="danger"
              @click="removeRow(idx)"
            >
              <el-icon><Close /></el-icon>
            </el-button>
          </div>

          <!-- Nested group -->
          <VisualConditionBuilder
            v-else
            :model-value="serializeCondition(getItemAsGroup(item))"
            :depth="depth + 1"
            :max-depth="maxDepth"
            @update:model-value="(v) => setNestedGroup(idx, v)"
          />
        </div>

        <!-- Add buttons -->
        <div class="flex items-center gap-2 mt-2 pt-2 border-t border-dashed border-gray-200">
          <el-button size="small" text type="primary" @click="addRow">
            <el-icon><Plus /></el-icon>
            添加条件
          </el-button>
          <el-button
            v-if="depth < maxDepth - 1"
            size="small"
            text
            type="primary"
            @click="addGroup"
          >
            <el-icon><FolderAdd /></el-icon>
            添加条件组
          </el-button>
        </div>
      </div>

      <el-button size="small" text type="primary" class="mt-2" @click="switchToAdvanced">
        切换到高级表达式
      </el-button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Close, Plus, FolderAdd } from '@element-plus/icons-vue';
import type { ILinkageCondition } from '@/utils/linkage-engine';
import {
  type IConditionRow,
  type IConditionGroup,
  type OperatorType,
  deserializeCondition,
  serializeCondition,
  createEmptyGroup,
  nextConditionId,
  operatorNeedsValue,
  expressionToOperatorValue,
} from '@/utils/condition-serializer';

interface Props {
  modelValue?: ILinkageCondition | null;
  depth?: number;
  maxDepth?: number;
}

const props = withDefaults(defineProps<Props>(), {
  depth: 0,
  maxDepth: 3,
});

const emit = defineEmits<{
  'update:modelValue': [value: ILinkageCondition | undefined];
}>();

// ==================== Template Helpers ====================

function isGroupItem(item: IConditionRow | IConditionGroup): boolean {
  return 'type' in item && item.type === 'group';
}

function getItemOp(item: IConditionRow | IConditionGroup): string {
  return (item as IConditionRow).operator ?? '';
}

function getItemVal(item: IConditionRow | IConditionGroup): string {
  return (item as IConditionRow).value ?? '';
}

function getItemAsGroup(item: IConditionRow | IConditionGroup): IConditionGroup {
  return item as IConditionGroup;
}

// ==================== State ====================

const showAdvanced = ref(false);
const advancedExpression = ref('');
const advancedError = ref(false);

const group = ref<IConditionGroup>(createEmptyGroup());

// ==================== Watchers ====================

watch(
  () => props.modelValue,
  (val) => {
    if (showAdvanced.value) {
      if (val?.type === 'simple' && val.expression) {
        advancedExpression.value = val.expression;
      } else if (val?.type === 'complex') {
        advancedExpression.value = '';
        advancedError.value = true;
      } else if (!val) {
        advancedExpression.value = '';
        advancedError.value = false;
      }
      return;
    }

    const parsed = deserializeCondition(val ?? undefined);
    if (parsed) {
      group.value = parsed;
      advancedError.value = false;
    } else if (val) {
      showAdvanced.value = true;
      if (val.type === 'simple') {
        advancedExpression.value = val.expression ?? '';
      } else {
        advancedExpression.value = '';
      }
      advancedError.value = false;
    } else {
      group.value = createEmptyGroup();
      advancedError.value = false;
    }
  },
  { immediate: true }
);

let syncTimer: ReturnType<typeof setTimeout> | null = null;

function syncUp() {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    const result = serializeCondition(group.value);
    emit('update:modelValue', result);
  }, 150);
}

watch(group, syncUp, { deep: true });

// ==================== Row Operations ====================

function addRow() {
  group.value.conditions.push({
    id: nextConditionId(),
    operator: 'gt',
    value: '',
  });
}

function removeRow(idx: number) {
  const conditions = [...group.value.conditions];
  conditions.splice(idx, 1);
  if (conditions.length === 0) {
    emit('update:modelValue', undefined);
    group.value = createEmptyGroup();
    return;
  }
  group.value = { ...group.value, conditions };
}

function setRowOperator(idx: number, operator: OperatorType) {
  const row = group.value.conditions[idx] as IConditionRow;
  row.operator = operator;
}

function setRowValue(idx: number, value: string) {
  const row = group.value.conditions[idx] as IConditionRow;
  row.value = value;
}

function setOperator(operator: string) {
  group.value.operator = operator as 'AND' | 'OR';
}

// ==================== Group Operations ====================

function addGroup() {
  group.value.conditions.push(createEmptyGroup());
}

function setNestedGroup(idx: number, serialized: ILinkageCondition | undefined) {
  if (!serialized) {
    const conditions = [...group.value.conditions];
    conditions.splice(idx, 1);
    if (conditions.length === 0) {
      emit('update:modelValue', undefined);
      group.value = createEmptyGroup();
      return;
    }
    group.value = { ...group.value, conditions };
    return;
  }

  const parsed = deserializeCondition(serialized);
  if (parsed) {
    const conditions = [...group.value.conditions];
    conditions[idx] = parsed;
    group.value = { ...group.value, conditions };
  }
}

// ==================== Mode Switching ====================

function switchToAdvanced() {
  const serialized = serializeCondition(group.value);
  if (serialized?.type === 'simple' && serialized.expression) {
    advancedExpression.value = serialized.expression;
  } else if (serialized?.type === 'complex') {
    advancedExpression.value = buildExpressionString(serialized);
  } else {
    advancedExpression.value = '';
  }
  advancedError.value = false;
  showAdvanced.value = true;
}

function switchToVisual() {
  const expr = advancedExpression.value.trim();
  if (!expr) {
    showAdvanced.value = false;
    group.value = createEmptyGroup();
    emit('update:modelValue', undefined);
    return;
  }

  const parsed = expressionToOperatorValue(expr);
  if (parsed) {
    advancedError.value = false;
    showAdvanced.value = false;
    group.value = {
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
    syncUp();
    return;
  }

  advancedError.value = true;
}

function buildExpressionString(condition: ILinkageCondition): string {
  if (condition.type === 'simple') return condition.expression ?? '';
  if (condition.type === 'complex') {
    const parts = (condition.conditions ?? []).map((c) => {
      const inner = buildExpressionString(c);
      return c.type === 'complex' ? `(${inner})` : inner;
    });
    const joiner = condition.operator === 'OR' ? ' || ' : ' && ';
    return parts.join(joiner);
  }
  return '';
}
</script>

<style scoped>
.visual-condition-builder {
  width: 100%;
}

.condition-group {
  background: #fafafa;
}
</style>
