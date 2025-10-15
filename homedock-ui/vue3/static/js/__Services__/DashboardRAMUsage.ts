// homedock-ui/vue3/static/js/__Services__/DashboardRAMUsage.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { onMounted, onUnmounted, ref, inject } from "vue";
import axios from "axios";

export function useRamUsageUpdater(propCSRF: string, initialIntervalMs = 3000, initialRamUsage: string, maxIntervalMs = 60000) {
  const ramUsage = ref(initialRamUsage);
  let currentIntervalMs = initialIntervalMs;
  let previousValue = initialRamUsage;
  let unchangedCount = 0;
  let interval: ReturnType<typeof setInterval>;

  const csrfTokenReactive = inject<{ value: string }>("csrf-token");

  async function fetchRamUsage() {
    try {
      const response = await axios.get("/thread/update_ram_usage", {
        headers: {
          "X-HomeDock-CSRF-Token": csrfTokenReactive?.value || propCSRF,
        },
      });

      if (response.data && typeof response.data.ram_usage !== "undefined") {
        let newValue: string;

        if (typeof response.data.ram_usage === "number") {
          newValue = response.data.ram_usage.toFixed(1);
        } else if (typeof response.data.ram_usage === "string" && response.data.ram_usage !== "") {
          newValue = response.data.ram_usage;
        } else {
          console.warn("Invalid RAM usage data received:", response.data);
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
        ramUsage.value = newValue;

        clearInterval(interval);
        interval = setInterval(fetchRamUsage, currentIntervalMs);
      } else {
        console.warn("Invalid RAM usage data structure:", response.data);
      }
    } catch (error) {
      console.error("Failed to fetch RAM usage:", error);
    }
  }

  onMounted(() => {
    interval = setInterval(fetchRamUsage, currentIntervalMs);

    onUnmounted(() => {
      clearInterval(interval);
    });
  });

  return ramUsage;
}
