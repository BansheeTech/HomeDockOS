// homedock-ui/vue3/static/js/__Composables__/useWindowRAMManager.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { ref, watch, onUnmounted, type Ref } from "vue";

const MEMORY_PRESSURE_THRESHOLD = 0.75;
const GRACE_PERIOD_MS = 120000;
const MAX_GRACE_PERIOD_MS = 300000;
const MEMORY_CHECK_INTERVAL = 5000;

interface MinimizedWindow {
  id: string;
  minimizedAt: number;
  destroy: () => void;
}

const minimizedWindows: Map<string, MinimizedWindow> = new Map();
let memoryCheckInterval: ReturnType<typeof setInterval> | null = null;

function getMaxMinimizedWindows(): number {
  const deviceMemory = (navigator as any).deviceMemory;

  if (!deviceMemory || deviceMemory < 2) {
    return 4;
  }

  if (deviceMemory <= 2) return 2;
  if (deviceMemory <= 4) return 4;
  if (deviceMemory <= 8) return 6;
  return 8;
}

function isUnderMemoryPressure(): boolean {
  const memory = (performance as any).memory;
  if (!memory) return false;

  const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
  return usageRatio > MEMORY_PRESSURE_THRESHOLD;
}

function getExpiredWindows(): MinimizedWindow[] {
  const now = Date.now();
  return Array.from(minimizedWindows.values())
    .filter((w) => now - w.minimizedAt > GRACE_PERIOD_MS)
    .sort((a, b) => a.minimizedAt - b.minimizedAt);
}

function getMaxExpiredWindows(): MinimizedWindow[] {
  const now = Date.now();
  return Array.from(minimizedWindows.values())
    .filter((w) => now - w.minimizedAt > MAX_GRACE_PERIOD_MS)
    .sort((a, b) => a.minimizedAt - b.minimizedAt);
}

function cleanupOldestWindows(countToRemove: number = 1): void {
  const sorted = Array.from(minimizedWindows.values()).sort((a, b) => a.minimizedAt - b.minimizedAt);

  for (let i = 0; i < Math.min(countToRemove, sorted.length); i++) {
    sorted[i].destroy();
  }
}

function startMemoryMonitoring(): void {
  if (memoryCheckInterval) return;

  memoryCheckInterval = setInterval(() => {
    const maxAllowed = getMaxMinimizedWindows();
    const currentCount = minimizedWindows.size;

    // 1.- Mempressure: immediately destroy oldest
    if (isUnderMemoryPressure() && currentCount > 0) {
      cleanupOldestWindows(1);
      return;
    }

    // 2.- Absolute max: destroy exceeding max time
    const maxExpired = getMaxExpiredWindows();
    if (maxExpired.length > 0) {
      for (const w of maxExpired) {
        w.destroy();
      }
      return;
    }

    // 3.- Over limit: destroy expired over grace period
    if (currentCount > maxAllowed) {
      const expired = getExpiredWindows();
      if (expired.length > 0) {
        const toRemove = Math.min(expired.length, currentCount - maxAllowed);
        for (let i = 0; i < toRemove; i++) {
          expired[i].destroy();
        }
      }
    }
  }, MEMORY_CHECK_INTERVAL);
}

function stopMemoryMonitoringIfEmpty(): void {
  if (minimizedWindows.size === 0 && memoryCheckInterval) {
    clearInterval(memoryCheckInterval);
    memoryCheckInterval = null;
  }
}

export function useWindowRAMManager(isMinimized: Ref<boolean> | (() => boolean)) {
  const id = `window-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  const shouldKeepAlive = ref(true);

  const destroyComponent = () => {
    shouldKeepAlive.value = false;
    minimizedWindows.delete(id);
    stopMemoryMonitoringIfEmpty();
  };

  watch(
    isMinimized,
    (minimized) => {
      if (minimized) {
        minimizedWindows.set(id, {
          id,
          minimizedAt: Date.now(),
          destroy: destroyComponent,
        });

        startMemoryMonitoring();
      } else {
        minimizedWindows.delete(id);
        shouldKeepAlive.value = true;
        stopMemoryMonitoringIfEmpty();
      }
    },
    { immediate: true }
  );

  onUnmounted(() => {
    minimizedWindows.delete(id);
    stopMemoryMonitoringIfEmpty();
  });

  return { shouldKeepAlive };
}
