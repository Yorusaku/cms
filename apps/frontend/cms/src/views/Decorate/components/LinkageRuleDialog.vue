<template>
  <el-dialog
    :model-value="modelValue"
    title="配置联动规则"
    width="640px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
      <el-form-item label="来源组件" prop="sourceComponentId">
        <el-select
          v-model="form.sourceComponentId"
          placeholder="选择来源组件"
          filterable
          class="w-full"
        >
          <el-option
            v-for="comp in components"
            :key="comp.id"
            :label="getComponentLabel(comp)"
            :value="comp.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="来源属性" prop="sourceProperty">
        <el-select
          v-model="form.sourceProperty"
          placeholder="选择属性"
          filterable
          allow-create
          class="w-full"
        >
          <el-option
            v-for="prop in sourceProperties"
            :key="prop"
            :label="prop"
            :value="prop"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="目标组件" prop="targetComponentId">
        <el-select
          v-model="form.targetComponentId"
          placeholder="选择目标组件"
          filterable
          class="w-full"
        >
          <el-option
            v-for="comp in components"
            :key="comp.id"
            :label="getComponentLabel(comp)"
            :value="comp.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="目标属性" prop="targetProperty">
        <el-select
          v-model="form.targetProperty"
          placeholder="选择属性"
          filterable
          allow-create
          class="w-full"
        >
          <el-option
            v-for="prop in targetProperties"
            :key="prop"
            :label="prop"
            :value="prop"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="数据转换">
        <el-select v-model="transformType" placeholder="选择转换方式" class="w-full">
          <el-option label="不转换" value="none" />
          <el-option label="乘以系数" value="multiply" />
          <el-option label="加上数值" value="add" />
          <el-option label="转大写" value="uppercase" />
          <el-option label="转小写" value="lowercase" />
          <el-option label="限制范围" value="clamp" />
          <el-option label="值域映射" value="map" />
          <el-option label="格式化货币" value="currency" />
          <el-option label="取反" value="invert" />
          <el-option label="自定义函数" value="custom" />
        </el-select>
      </el-form-item>

      <el-form-item v-if="transformType === 'multiply'" label="系数">
        <el-input-number v-model="multiplier" :step="0.1" :precision="2" class="w-full" />
      </el-form-item>

      <el-form-item v-if="transformType === 'add'" label="加数">
        <el-input-number v-model="addAmount" :step="1" class="w-full" />
      </el-form-item>

      <el-form-item v-if="transformType === 'clamp'" label="范围">
        <div class="flex items-center gap-2">
          <el-input-number v-model="clampMin" placeholder="最小值" />
          <span>~</span>
          <el-input-number v-model="clampMax" placeholder="最大值" />
        </div>
      </el-form-item>

      <el-form-item v-if="transformType === 'map'" label="映射范围">
        <div class="space-y-1">
          <div class="flex items-center gap-1 text-xs text-gray-500">
            <span class="w-12">输入：</span>
            <el-input-number v-model="mapFromMin" size="small" placeholder="最小值" />
            <span>~</span>
            <el-input-number v-model="mapFromMax" size="small" placeholder="最大值" />
          </div>
          <div class="flex items-center gap-1 text-xs text-gray-500">
            <span class="w-12">输出：</span>
            <el-input-number v-model="mapToMin" size="small" placeholder="最小值" />
            <span>~</span>
            <el-input-number v-model="mapToMax" size="small" placeholder="最大值" />
          </div>
        </div>
      </el-form-item>

      <el-form-item v-if="transformType === 'custom'" label="函数代码">
        <el-input
          v-model="customTransform"
          type="textarea"
          :rows="3"
          placeholder="(value) => value * 2"
        />
      </el-form-item>

      <el-form-item label="触发条件">
        <VisualConditionBuilder v-model="conditionData" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import type { IComponentLinkage, IComponentSchemaV2 } from '@cms/types';
import type { ILinkageCondition } from '@/utils/linkage-engine';
import VisualConditionBuilder from '@/components/basic/VisualConditionBuilder.vue';

interface Props {
  modelValue: boolean;
  linkage: IComponentLinkage | null;
  components: IComponentSchemaV2[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  save: [linkage: IComponentLinkage];
}>();

const formRef = ref<FormInstance>();
const form = ref({
  sourceComponentId: '',
  sourceProperty: '',
  targetComponentId: '',
  targetProperty: '',
});

// Transform state
const transformType = ref<string>('none');
const multiplier = ref(1);
const addAmount = ref(0);
const clampMin = ref(0);
const clampMax = ref(100);
const mapFromMin = ref(0);
const mapFromMax = ref(100);
const mapToMin = ref(0);
const mapToMax = ref(100);
const customTransform = ref('');

// Condition state — managed by VisualConditionBuilder
const conditionData = ref<ILinkageCondition | null>(null);

const rules: FormRules = {
  sourceComponentId: [{ required: true, message: '请选择来源组件', trigger: 'change' }],
  sourceProperty: [{ required: true, message: '请输入来源属性', trigger: 'blur' }],
  targetComponentId: [{ required: true, message: '请选择目标组件', trigger: 'change' }],
  targetProperty: [{ required: true, message: '请输入目标属性', trigger: 'blur' }],
};

const sourceProperties = computed(() => {
  if (!form.value.sourceComponentId) return [];
  const component = props.components.find(c => c.id === form.value.sourceComponentId);
  if (!component) return [];
  return Object.keys(component.props || {});
});

const targetProperties = computed(() => {
  if (!form.value.targetComponentId) return [];
  const component = props.components.find(c => c.id === form.value.targetComponentId);
  if (!component) return [];
  return Object.keys(component.props || {});
});

const getComponentLabel = (comp: IComponentSchemaV2) => {
  return `${comp.type} (${comp.id.slice(0, 8)})`;
};

// ==================== Transform String Parsing ====================

interface TransformMatcher {
  type: string;
  match: (s: string) => boolean;
  extract: (s: string) => Record<string, any>;
}

const TRANSFORM_MATCHERS: TransformMatcher[] = [
  {
    type: 'uppercase',
    match: (s) => s.includes('.toUpperCase()'),
    extract: () => ({}),
  },
  {
    type: 'lowercase',
    match: (s) => s.includes('.toLowerCase()'),
    extract: () => ({}),
  },
  {
    type: 'clamp',
    match: (s) => s.includes('Math.min') && s.includes('Math.max'),
    extract: (s) => {
      // (value) => Math.min(Math.max(value, 0), 100)
      const nums = s.match(/Math\.min\(Math\.max\(value,\s*([\d.]+)\),\s*([\d.]+)\)/);
      return {
        clampMin: nums ? parseFloat(nums[1]) : 0,
        clampMax: nums ? parseFloat(nums[2]) : 100,
      };
    },
  },
  {
    type: 'map',
    match: (s) => s.includes('const n = Number(value)') && s.includes('const r = (n'),
    extract: (s) => {
      // IIFE: (() => { const n = Number(value); const r = (n - FM) / (FX - FM); return TM + r * (TX - TM); })()
      const nums = s.match(/[\d.]+/g);
      if (nums && nums.length >= 4) {
        return {
          mapFromMin: parseFloat(nums[0]),
          mapFromMax: parseFloat(nums[1]),
          mapToMin: parseFloat(nums[2]),
          mapToMax: parseFloat(nums[3]),
        };
      }
      return {};
    },
  },
  {
    type: 'multiply',
    match: (s) => /\*\s*[\d.]+/.test(s) && !s.includes('Math.min'),
    extract: (s) => {
      const match = s.match(/\*\s*([\d.]+)/);
      return { multiplier: match ? parseFloat(match[1]) : 1 };
    },
  },
  {
    type: 'add',
    match: (s) => /\+\s*[\d.]+/.test(s),
    extract: (s) => {
      const match = s.match(/\+\s*([\d.]+)/);
      return { addAmount: match ? parseFloat(match[1]) : 0 };
    },
  },
  {
    type: 'currency',
    match: (s) => s.includes('$') && s.includes('.toFixed(2)'),
    extract: () => ({}),
  },
  {
    type: 'invert',
    match: (s) => s.trim() === '!value' || s.includes('!value'),
    extract: () => ({}),
  },
];

function parseTransformFn(fnStr: string | undefined): void {
  if (!fnStr) {
    transformType.value = 'none';
    return;
  }

  // Strip the arrow function wrapper to get the body
  let body = fnStr;
  body = body.replace(/^\(value\)\s*=>\s*/, '');
  body = body.replace(/^function\s*\(value\)\s*\{?\s*return\s*/, '');
  body = body.replace(/\}?\s*$/, '');
  body = body.trim();

  // Try matchers in priority order
  for (const matcher of TRANSFORM_MATCHERS) {
    if (matcher.match(body)) {
      const params = matcher.extract(body);
      transformType.value = matcher.type;
      if ('multiplier' in params) multiplier.value = params.multiplier;
      if ('addAmount' in params) addAmount.value = params.addAmount;
      if ('clampMin' in params) clampMin.value = params.clampMin;
      if ('clampMax' in params) clampMax.value = params.clampMax;
      if ('mapFromMin' in params) mapFromMin.value = params.mapFromMin;
      if ('mapFromMax' in params) mapFromMax.value = params.mapFromMax;
      if ('mapToMin' in params) mapToMin.value = params.mapToMin;
      if ('mapToMax' in params) mapToMax.value = params.mapToMax;
      return;
    }
  }

  // Fallback to custom
  transformType.value = 'custom';
  customTransform.value = fnStr;
}

// ==================== Watch for Edit Mode ====================

watch(() => props.linkage, (linkage) => {
  if (linkage) {
    form.value = {
      sourceComponentId: linkage.sourceComponentId,
      sourceProperty: linkage.sourceProperty,
      targetComponentId: linkage.targetComponentId,
      targetProperty: linkage.targetProperty,
    };

    parseTransformFn(linkage.transformFn);
    conditionData.value = linkage.condition ?? null;
  } else {
    form.value = {
      sourceComponentId: '',
      sourceProperty: '',
      targetComponentId: '',
      targetProperty: '',
    };
    transformType.value = 'none';
    conditionData.value = null;
  }
}, { immediate: true });

// ==================== Save ====================

const handleCancel = () => {
  emit('update:modelValue', false);
};

const handleSave = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    let transformFn: string | undefined;
    if (transformType.value === 'multiply') {
      transformFn = `(value) => value * ${multiplier.value}`;
    } else if (transformType.value === 'add') {
      transformFn = `(value) => value + ${addAmount.value}`;
    } else if (transformType.value === 'uppercase') {
      transformFn = `(value) => String(value).toUpperCase()`;
    } else if (transformType.value === 'lowercase') {
      transformFn = `(value) => String(value).toLowerCase()`;
    } else if (transformType.value === 'clamp') {
      transformFn = `(value) => Math.min(Math.max(value, ${clampMin.value}), ${clampMax.value})`;
    } else if (transformType.value === 'map') {
      // IIFE so that new Function('value', 'return BODY') works (body must be an expression)
      transformFn = `(value) => (() => { const n = Number(value); const r = (n - ${mapFromMin.value}) / (${mapFromMax.value} - ${mapFromMin.value}); return ${mapToMin.value} + r * (${mapToMax.value} - ${mapToMin.value}); })()`;
    } else if (transformType.value === 'currency') {
      transformFn = `(value) => \`$\${Number(value).toFixed(2)}\``;
    } else if (transformType.value === 'invert') {
      transformFn = `(value) => !value`;
    } else if (transformType.value === 'custom') {
      transformFn = customTransform.value;
    }

    const linkage: IComponentLinkage = {
      id: props.linkage?.id || `linkage-${Date.now()}`,
      sourceComponentId: form.value.sourceComponentId,
      sourceProperty: form.value.sourceProperty,
      targetComponentId: form.value.targetComponentId,
      targetProperty: form.value.targetProperty,
      transformFn,
      condition: conditionData.value ?? undefined,
      enabled: props.linkage?.enabled ?? true,
    };

    emit('save', linkage);
    ElMessage.success('联动规则保存成功');
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};
</script>
