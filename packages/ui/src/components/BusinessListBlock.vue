<template>
  <section class="business-list-block" :style="styles">
    <header class="list-header">
      <div>
        <h3>{{ title }}</h3>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
      <input v-model.trim="keyword" class="search-input" :placeholder="searchPlaceholder" />
    </header>

    <div v-if="pagedRows.length" class="table-wrapper">
      <table>
        <thead><tr><th v-for="column in columns" :key="column.key">{{ column.label }}</th></tr></thead>
        <tbody>
          <tr v-for="(row, index) in pagedRows" :key="String(row.id ?? index)">
            <td v-for="column in columns" :key="column.key">{{ row[column.key] ?? "-" }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="empty-state">{{ emptyText }}</p>

    <footer v-if="pageCount > 1" class="pagination">
      <button :disabled="page === 1" @click="page -= 1">上一页</button>
      <span>{{ page }} / {{ pageCount }}</span>
      <button :disabled="page === pageCount" @click="page += 1">下一页</button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

export interface BusinessListColumn { key: string; label: string }
export type BusinessListRow = Record<string, string | number | null | undefined>;

interface Props {
  title?: string;
  subtitle?: string;
  columns?: BusinessListColumn[];
  rows?: BusinessListRow[];
  pageSize?: number;
  searchPlaceholder?: string;
  emptyText?: string;
  styles?: Record<string, string>;
}

const props = withDefaults(defineProps<Props>(), {
  title: "业务数据",
  subtitle: "",
  columns: () => [
    { key: "name", label: "名称" },
    { key: "status", label: "状态" },
  ],
  rows: () => [
    { id: 1, name: "示例记录", status: "待处理" },
    { id: 2, name: "第二条记录", status: "已完成" },
  ],
  pageSize: 5,
  searchPlaceholder: "输入关键词筛选",
  emptyText: "暂无数据",
  styles: () => ({}),
});

const keyword = ref("");
const page = ref(1);
const filteredRows = computed(() => {
  if (!keyword.value) return props.rows;
  const value = keyword.value.toLowerCase();
  return props.rows.filter((row) => Object.values(row).some((item) => String(item ?? "").toLowerCase().includes(value)));
});
const pageCount = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / Math.max(1, props.pageSize))));
const pagedRows = computed(() => filteredRows.value.slice((page.value - 1) * props.pageSize, page.value * props.pageSize));
/** 对外暴露的运行时状态，供联动规则消费（见物料定义的 runtimeEventProperties） */
const emit = defineEmits<{
  "filter-change": [payload: { keyword: string; filteredCount: number }];
}>();

const emitFilterChange = () => {
  emit("filter-change", {
    keyword: keyword.value,
    filteredCount: filteredRows.value.length,
  });
};

// 筛选条件或数据源变化时重置页码，并同步一次运行时状态
watch(
  [keyword, filteredRows],
  () => {
    page.value = 1;
    emitFilterChange();
  },
  { immediate: true },
);
watch(pageCount, (value) => { if (page.value > value) page.value = value; });
</script>

<style scoped>
.business-list-block { padding: 20px; background: var(--color-bg-card); border-radius: var(--radius-lg); }
.list-header { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; margin-bottom: 14px; }
.list-header h3 { margin: 0; color: var(--color-text-primary); font-size: 18px; }
.list-header p { margin: 6px 0 0; color: var(--color-text-secondary); font-size: 13px; }
.search-input { width: 180px; min-height: 34px; padding: 0 10px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); }
.table-wrapper { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { padding: 10px 12px; border-bottom: 1px solid var(--color-border-lighter); text-align: left; white-space: nowrap; }
th { color: var(--color-text-regular); background: var(--color-bg-page); }
.empty-state { padding: 28px 0; text-align: center; color: var(--color-text-placeholder); }
.pagination { display: flex; justify-content: flex-end; align-items: center; gap: 10px; margin-top: 14px; font-size: 13px; }
.pagination button { padding: 5px 10px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-bg-card); cursor: pointer; }
.pagination button:disabled { cursor: not-allowed; opacity: .5; }
</style>
