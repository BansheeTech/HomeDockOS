// src/static/js/__Services__/DashboardContainersUsage.ts
// Copyright © 2023-2025 Banshee
// https://www.banshee.pro

import { onMounted, onUnmounted, ref } from "vue";
import axios from "axios";

export function useContainersDataUpdater(propCSRF: string, initialIntervalMs = 3000, initialTotalContainers: string, initialActiveContainers: string, maxIntervalMs = 60000) {
  const totalContainers = ref(initialTotalContainers);
  const activeContainers = ref(initialActiveContainers);

  let currentTotalIntervalMs = initialIntervalMs;
  let previousTotalValue = initialTotalContainers;
  let unchangedTotalCount = 0;
  let totalInterval: ReturnType<typeof setInterval>;

  let currentActiveIntervalMs = initialIntervalMs;
  let previousActiveValue = initialActiveContainers;
  let unchangedActiveCount = 0;
  let activeInterval: ReturnType<typeof setInterval>;

  async function fetchTotalContainers() {
    try {
      const response = await axios.get("/thread/installed_containers", {
        headers: {
          "X-HomeDock-CSRF-Token": propCSRF,
        },
      });

      if (response.data && typeof response.data.containers !== "undefined") {
        let newValue: string = response.data.containers.toString();

        if (newValue !== previousTotalValue) {
          currentTotalIntervalMs = initialIntervalMs;
          unchangedTotalCount = 0;
        } else {
          unchangedTotalCount++;
          currentTotalIntervalMs = Math.min(initialIntervalMs * Math.pow(2, unchangedTotalCount), maxIntervalMs);
        }

        previousTotalValue = newValue;
        totalContainers.value = newValue;

        clearInterval(totalInterval);
        totalInterval = setInterval(fetchTotalContainers, currentTotalIntervalMs);
      } else {
        console.warn("Invalid total containers data structure:", response.data);
      }
    } catch (error) {
      console.error("Failed to fetch total containers:", error);
    }
  }

  async function fetchActiveContainers() {
    try {
      const response = await axios.get("/thread/active_containers", {
        headers: {
          "X-HomeDock-CSRF-Token": propCSRF,
        },
      });

      if (response.data && typeof response.data.active_containers !== "undefined") {
        let newValue: string = response.data.active_containers.toString();

        if (newValue !== previousActiveValue) {
          currentActiveIntervalMs = initialIntervalMs;
          unchangedActiveCount = 0;
        } else {
          unchangedActiveCount++;
          currentActiveIntervalMs = Math.min(initialIntervalMs * Math.pow(2, unchangedActiveCount), maxIntervalMs);
        }

        previousActiveValue = newValue;
        activeContainers.value = newValue;

        clearInterval(activeInterval);
        activeInterval = setInterval(fetchActiveContainers, currentActiveIntervalMs);
      } else {
        console.warn("Invalid active containers data structure:", response.data);
      }
    } catch (error) {
      console.error("Failed to fetch active containers:", error);
    }
  }

  onMounted(() => {
    totalInterval = setInterval(fetchTotalContainers, currentTotalIntervalMs);
    activeInterval = setInterval(fetchActiveContainers, currentActiveIntervalMs);

    onUnmounted(() => {
      clearInterval(totalInterval);
      clearInterval(activeInterval);
    });
  });

  return { totalContainers, activeContainers };
}
