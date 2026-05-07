import { ref, onUnmounted } from "vue";

const DEFAULT_HEIGHT = 120;

export function useVirtualScrollMeasurement() {
  const heightCache = ref<Map<string, number>>(new Map());
  let rafId: number | null = null;
  const pending = new Map<string, number>();

  const flush = () => {
    if (pending.size === 0) return;
    let changed = false;
    for (const [id, h] of pending) {
      const prev = heightCache.value.get(id);
      if (prev !== h) {
        heightCache.value.set(id, h);
        changed = true;
      }
    }
    if (changed) {
      heightCache.value = new Map(heightCache.value);
    }
    pending.clear();
    rafId = null;
  };

  const recordHeight = (id: string, element: HTMLElement) => {
    if (!element || !id) return;
    const rect = element.getBoundingClientRect();
    const height = rect.height;
    if (height <= 0) return;
    pending.set(id, height);
    if (rafId === null) {
      rafId = requestAnimationFrame(flush);
    }
  };

  const getHeight = (id: string): number => {
    return heightCache.value.get(id) ?? DEFAULT_HEIGHT;
  };

  const clear = () => {
    heightCache.value = new Map();
    pending.clear();
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  onUnmounted(() => {
    clear();
  });

  return {
    heightCache,
    recordHeight,
    getHeight,
    clear,
  };
}
