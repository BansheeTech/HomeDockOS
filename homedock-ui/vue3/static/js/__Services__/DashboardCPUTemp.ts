// homedock-ui/vue3/static/js/__Services__/DashboardCPUTemp.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { onMounted, onUnmounted, ref, inject } from "vue";
import axios from "axios";

export function useCpuTempUpdater(propCSRF: string, initialIntervalMs = 3000, initialCpuTemp: string, maxIntervalMs = 60000) {
  const cpuTemp = ref(initialCpuTemp);
  let currentIntervalMs = initialIntervalMs;
  let previousValue = initialCpuTemp;
  let unchangedCount = 0;
  let interval: ReturnType<typeof setInterval>;

  const csrfTokenReactive = inject<{ value: string }>("csrf-token");

  async function fetchCpuTemp() {
    try {
      const response = await axios.get("/thread/update_cpu_temp", {
        headers: {
          "X-HomeDock-CSRF-Token": csrfTokenReactive?.value || propCSRF,
        },
      });

      if (response.data && typeof response.data.cpu_temp !== "undefined") {
        let newValue: string;

        if (typeof response.data.cpu_temp === "number") {
          newValue = response.data.cpu_temp.toFixed(1);
        } else if (typeof response.data.cpu_temp === "string" && response.data.cpu_temp !== "") {
          newValue = response.data.cpu_temp;
        } else {
          console.warn("Invalid CPU temperature data received:", response.data);
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
        cpuTemp.value = newValue;

        clearInterval(interval);
        interval = setInterval(fetchCpuTemp, currentIntervalMs);
      } else {
        console.warn("Invalid CPU temperature data structure:", response.data);
      }
    } catch (error) {
      console.error("Failed to fetch CPU temperature:", error);
    }
  }

  onMounted(() => {
    interval = setInterval(fetchCpuTemp, currentIntervalMs);

    onUnmounted(() => {
      clearInterval(interval);
    });
  });

  return cpuTemp;
}
