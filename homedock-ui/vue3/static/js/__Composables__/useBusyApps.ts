// homedock-ui/vue3/static/js/__Composables__/useBusyApps.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { onBeforeUnmount, shallowRef, watch } from "vue";

import { useDesktopStore } from "../__Stores__/desktopStore";

export function useBusyApps(minVisibleMs = 1200) {
  const desktopStore = useDesktopStore();

  const busyIds = shallowRef<ReadonlySet<string>>(new Set());
  const busySince = new Map<string, number>();
  const releaseTimers = new Map<string, ReturnType<typeof setTimeout>>();

  function release(id: string) {
    releaseTimers.delete(id);
    busySince.delete(id);
    const next = new Set(busyIds.value);
    next.delete(id);
    busyIds.value = next;
  }

  watch(
    () => desktopStore.dockerApps.filter((app) => app.isProcessing === true).map((app) => app.id),
    (processingIds) => {
      const now = Date.now();
      const next = new Set(busyIds.value);

      for (const id of processingIds) {
        clearTimeout(releaseTimers.get(id));
        releaseTimers.delete(id);
        if (!next.has(id)) {
          next.add(id);
          busySince.set(id, now);
        }
      }

      for (const id of busyIds.value) {
        if (processingIds.includes(id) || releaseTimers.has(id)) continue;
        const remaining = minVisibleMs - (now - (busySince.get(id) ?? 0));
        if (remaining > 0) {
          releaseTimers.set(
            id,
            setTimeout(() => release(id), remaining),
          );
        } else {
          next.delete(id);
          busySince.delete(id);
        }
      }

      busyIds.value = next;
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    releaseTimers.forEach((timer) => clearTimeout(timer));
    releaseTimers.clear();
  });

  const isBusy = (id: string) => busyIds.value.has(id);

  return { isBusy };
}
