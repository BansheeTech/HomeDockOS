// homedock-ui/vue3/static/js/__Services__/DashboardHardDiskUsage.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { onMounted, onUnmounted, ref, inject } from "vue";
import axios from "axios";

export function useHardDiskUsageUpdater(propCSRF: string, initialIntervalMs = 3000, initialHardDiskUsage: string, maxIntervalMs = 60000) {
  const hardDiskUsage = ref(initialHardDiskUsage);
  let currentIntervalMs = initialIntervalMs;
  let previousValue = initialHardDiskUsage;
  let unchangedCount = 0;
  let interval: ReturnType<typeof setInterval>;

  const csrfTokenReactive = inject<{ value: string }>("csrf-token");

  async function fetchHardDiskUsage() {
    try {
      const response = await axios.get("/thread/update_disk_usage", {
        headers: {
          "X-HomeDock-CSRF-Token": csrfTokenReactive?.value || propCSRF,
        },
      });

      if (response.data && typeof response.data.disk_usage !== "undefined") {
        let newValue: string;

        if (typeof response.data.disk_usage === "number") {
          newValue = response.data.disk_usage.toFixed(1);
        } else if (typeof response.data.disk_usage === "string" && response.data.disk_usage !== "") {
          newValue = response.data.disk_usage;
        } else {
          console.warn("Invalid hard disk usage data received:", response.data);
          return;
        }

        if (newValue !== previousValue) {
          currentIntervalMs = initialIntervalMs;
          unchangedCount = 0;
        } else {
          unchangedCount++;
          currentIntervalMs = Math.min(initialIntervalMs * Math.pow(2, unchangedCount), maxIntervalMs);
        }

        previousValue = newValue;
        hardDiskUsage.value = newValue;

        clearInterval(interval);
        interval = setInterval(fetchHardDiskUsage, currentIntervalMs);
      } else {
        console.warn("Invalid hard disk usage data structure:", response.data);
      }
    } catch (error) {
      console.error("Failed to fetch hard disk usage:", error);
    }
  }

  onMounted(() => {
    interval = setInterval(fetchHardDiskUsage, currentIntervalMs);

    onUnmounted(() => {
      clearInterval(interval);
    });
  });

  return hardDiskUsage;
}
