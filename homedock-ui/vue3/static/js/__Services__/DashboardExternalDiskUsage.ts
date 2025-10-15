// homedock-ui/vue3/static/js/__Services__/DashboardExternalDiskUsage.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { onMounted, onUnmounted, ref, inject } from "vue";
import axios from "axios";

export function useExternalDiskUsageUpdater(propCSRF: string, initialIntervalMs = 3000, initialExternalDiskUsage: string, maxIntervalMs = 60000) {
  const externalDiskUsage = ref(initialExternalDiskUsage);
  let currentIntervalMs = initialIntervalMs;
  let previousValue = initialExternalDiskUsage;
  let unchangedCount = 0;
  let interval: ReturnType<typeof setInterval>;

  const csrfTokenReactive = inject<{ value: string }>("csrf-token");

  async function fetchExternalDiskUsage() {
    try {
      const response = await axios.get("/thread/update_external_disk_usage", {
        headers: {
          "X-HomeDock-CSRF-Token": csrfTokenReactive?.value || propCSRF,
        },
      });

      if (response.data && typeof response.data.usage !== "undefined") {
        let newValue: string;

        if (typeof response.data.usage === "number") {
          newValue = response.data.usage.toFixed(1);
        } else if (typeof response.data.usage === "string" && response.data.usage !== "") {
          newValue = response.data.usage;
        } else {
          console.warn("Invalid external disk usage data received:", response.data);
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
        externalDiskUsage.value = newValue;

        clearInterval(interval);
        interval = setInterval(fetchExternalDiskUsage, currentIntervalMs);
      } else {
        console.warn("Invalid external disk usage data structure:", response.data);
      }
    } catch (error) {
      console.error("Failed to fetch external disk usage:", error);
    }
  }

  onMounted(() => {
    interval = setInterval(fetchExternalDiskUsage, currentIntervalMs);

    onUnmounted(() => {
      clearInterval(interval);
    });
  });

  return externalDiskUsage;
}
