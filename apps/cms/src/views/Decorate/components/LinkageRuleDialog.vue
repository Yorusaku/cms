<template>
  <el-dialog
    :model-value="modelValue"
    title="配置联动规则"
    width="600px"
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
          <el-option label="转大写" value="uppercase" />
          <el-option label="限制范围" value="clamp" />
          <el-option label="自定义函数" value="custom" />
        </el-select>
      </el-form-item>

      <el-form-item v-if="transformType === 'multiply'" label="系数">
        <el-input-number v-model="multiplier" :step="0.1" :precision="2" class="w-full" />
      </el-form-item>

      <el-form-item v-if="transformType === 'clamp'" label="范围">
        <div class="flex items-center gap-2">
          <el-input-number v-model="clampMin" placeholder="最小值" />
          <span>~</span>
          <el-input-number v-model="clampMax" placeholder="最大值" />
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
        <el-select v-model="conditionType" placeholder="选择条件" class="w-full">
          <el-option label="无条件" value="none" />
          <el-option label="大于" value="gt" />
          <el-option label="小于" value="lt" />
          <el-option label="等于" value="eq" />
          <el-option label="不等于" value="ne" />
          <el-option label="自定义表达式" value="custom" />
        </el-select>
      </el-form-item>

      <el-form-item v-if="conditionType !== 'none' && conditionType !== 'custom'" label="条件值">
        <el-input v-model="conditionValue" placeholder="输入条件值" />
      </el-form-item>

      <el-form-item v-if="conditionType === 'custom'" label="表达式">
        <el-input
          v-model="customCondition"
          placeholder="value > 100"
          type="textarea"
          :rows="2"
        />
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

const transformType = ref<string>('none');
const multiplier = ref(1);
const clampMin = ref(0);
const clampMax = ref(100);
const customTransform = ref('');

const conditionType = ref<string>('none');
const conditionValue = ref('');
const customCondition = ref('');

const rules: FormRules = {
  sourceComponentId: [{ required: true, message: '请选择来源组件', trigger: 'change' }],
  sourceProperty: [{ required: true, message: '请输入来源属性', trigger: 'blur' }],
  targetComponentId: [{ required: true, message: '请选择目标组件', trigger: 'change' }],
  targetProperty: [{ required: true, message: '请输入目标属性', trigger: 'blur' }],
};

// 获取组件属性列表
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

// 监听 linkage 变化，初始化表单
watch(() => props.linkage, (linkage) => {
  if (linkage) {
    form.value = {
      sourceComponentId: linkage.sourceComponentId,
      sourceProperty: linkage.sourceProperty,
      targetComponentId: linkage.targetComponentId,
      targetProperty: linkage.targetProperty,
    };

    // 解析转换函数
    if (linkage.transformFn) {
      const fnStr = linkage.transformFn;
      if (fnStr.includes('* ')) {
        transformType.value = 'multiply';
        const match = fnStr.match(/\* ([\d.]+)/);
        if (match) multiplier.value = parseFloat(match[1]);
      } else if (fnStr.includes('toUpperCase')) {
        transformType.value = 'uppercase';
      } else if (fnStr.includes('Math.min') && fnStr.includes('Math.max')) {
        transformType.value = 'clamp';
      } else {
        transformType.value = 'custom';
        customTransform.value = fnStr;
      }
    } else {
      transformType.value = 'none';
    }

    // 解析条件
    if (linkage.condition?.expression) {
      const expr = linkage.condition.expression;
      if (expr.includes('>')) {
        conditionType.value = 'gt';
        conditionValue.value = expr.split('>')[1].trim();
      } else if (expr.includes('<')) {
        conditionType.value = 'lt';
        conditionValue.value = expr.split('<')[1].trim();
      } else if (expr.includes('===')) {
        conditionType.value = 'eq';
        conditionValue.value = expr.split('===')[1].trim();
      } else if (expr.includes('!==')) {
        conditionType.value = 'ne';
        conditionValue.value = expr.split('!==')[1].trim();
      } else {
        conditionType.value = 'custom';
        customCondition.value = expr;
      }
    } else {
      conditionType.value = 'none';
    }
  } else {
    // 重置表单
    form.value = {
      sourceComponentId: '',
      sourceProperty: '',
      targetComponentId: '',
      targetProperty: '',
    };
    transformType.value = 'none';
    conditionType.value = 'none';
  }
}, { immediate: true });

const handleCancel = () => {
  emit('update:modelValue', false);
};

const handleSave = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    // 构建转换函数
    let transformFn: string | undefined;
    if (transformType.value === 'multiply') {
      transformFn = `(value) => value * ${multiplier.value}`;
    } else if (transformType.value === 'uppercase') {
      transformFn = `(value) => String(value).toUpperCase()`;
    } else if (transformType.value === 'clamp') {
      transformFn = `(value) => Math.min(Math.max(value, ${clampMin.value}), ${clampMax.value})`;
    } else if (transformType.value === 'custom') {
      transformFn = customTransform.value;
    }

    // 构建条件
    let condition: IComponentLinkage['condition'];
    if (conditionType.value !== 'none') {
      let expression = '';
      if (conditionType.value === 'gt') {
        expression = `value > ${conditionValue.value}`;
      } else if (conditionType.value === 'lt') {
        expression = `value < ${conditionValue.value}`;
      } else if (conditionType.value === 'eq') {
        expression = `value === ${conditionValue.value}`;
      } else if (conditionType.value === 'ne') {
        expression = `value !== ${conditionValue.value}`;
      } else if (conditionType.value === 'custom') {
        expression = customCondition.value;
      }

      condition = {
        type: 'simple',
        expression,
      };
    }

    const linkage: IComponentLinkage = {
      id: props.linkage?.id || `linkage-${Date.now()}`,
      sourceComponentId: form.value.sourceComponentId,
      sourceProperty: form.value.sourceProperty,
      targetComponentId: form.value.targetComponentId,
      targetProperty: form.value.targetProperty,
      transformFn,
      condition,
      enabled: props.linkage?.enabled ?? true,
    };

    emit('save', linkage);
    ElMessage.success('联动规则保存成功');
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};
</script>
