// src/static/js/__Services__/DashboardCPUUsage.ts
// Copyright © 2023-2025 Banshee, All Rights Reserved
// https://www.banshee.pro

import { onMounted, onUnmounted, ref } from "vue";
import axios from "axios";

export function useCpuUsageUpdater(propCSRF: string, initialIntervalMs = 3000, initialCpuUsage: string, maxIntervalMs = 60000) {
  const cpuUsage = ref(initialCpuUsage);
  let currentIntervalMs = initialIntervalMs;
  let previousValue = initialCpuUsage;
  let unchangedCount = 0;
  let interval: ReturnType<typeof setInterval>;

  async function fetchCpuUsage() {
    try {
      const response = await axios.get("/thread/update_cpu_usage", {
        headers: {
          "X-HomeDock-CSRF-Token": propCSRF,
        },
      });

      if (response.data && typeof response.data.cpu_usage !== "undefined") {
        let newValue: string;

        if (typeof response.data.cpu_usage === "number") {
          newValue = response.data.cpu_usage.toFixed(1);
        } else if (typeof response.data.cpu_usage === "string" && response.data.cpu_usage !== "") {
          newValue = response.data.cpu_usage;
        } else {
          console.warn("Invalid CPU usage data received:", response.data);
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
        cpuUsage.value = newValue;

        clearInterval(interval);
        interval = setInterval(fetchCpuUsage, currentIntervalMs);
      } else {
        console.warn("Invalid CPU usage data structure:", response.data);
      }
    } catch (error) {
      console.error("Failed to fetch CPU usage:", error);
    }
  }

  onMounted(() => {
    interval = setInterval(fetchCpuUsage, currentIntervalMs);

    onUnmounted(() => {
      clearInterval(interval);
    });
  });

  return cpuUsage;
}
