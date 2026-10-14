<template>
  <section class="stat-card-block" :style="styles">
    <div class="stat-icon" :style="{ backgroundColor: `${accentColor}18`, color: accentColor }">{{ icon }}</div>
    <div class="stat-content">
      <p>{{ title }}</p>
      <strong>{{ value }}</strong>
      <small :style="{ color: accentColor }">{{ description }}</small>
    </div>
  </section>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
  value?: string | number;
  description?: string;
  icon?: string;
  accentColor?: string;
  styles?: Record<string, string>;
}

withDefaults(defineProps<Props>(), {
  title: "待处理事项",
  value: 12,
  description: "较昨日 +8%",
  icon: "数",
  accentColor: "#2563eb",
  styles: () => ({}),
});
</script>

<style scoped>
.stat-card-block { display: flex; align-items: center; gap: 14px; padding: 18px; background: #fff; border-radius: 10px; }
.stat-icon { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 10px; font-size: 14px; font-weight: 600; }
.stat-content p { margin: 0 0 6px; color: #6b7280; font-size: 13px; }
.stat-content strong { display: block; color: #111827; font-size: 26px; line-height: 1; }
.stat-content small { display: block; margin-top: 7px; font-size: 12px; }
</style>
