// homedock-ui/vue3/static/js/__Services__/DashboardUptimeUsage.ts
// Copyright © 2023-2025 Banshee, All Rights Reserved
// https://www.banshee.pro

import { onMounted, onUnmounted, ref } from "vue";
import axios from "axios";

export function useUptimeUpdater(propCSRF: string, initialIntervalMs = 3000, initialSystemUptime: string, initialHomeDockUptime: string, maxIntervalMs = 60000) {
  const systemUptime = ref(initialSystemUptime);
  const homeDockUptime = ref(initialHomeDockUptime);

  let currentSystemIntervalMs = initialIntervalMs;
  let previousSystemValue = initialSystemUptime;
  let unchangedSystemCount = 0;
  let systemInterval: ReturnType<typeof setInterval>;

  let currentHomeDockIntervalMs = initialIntervalMs;
  let previousHomeDockValue = initialHomeDockUptime;
  let unchangedHomeDockCount = 0;
  let homeDockInterval: ReturnType<typeof setInterval>;

  async function fetchSystemUptime() {
    try {
      const response = await axios.get("/thread/system_uptime", {
        headers: {
          "X-HomeDock-CSRF-Token": propCSRF,
        },
      });

      if (response.data && typeof response.data.uptime === "string") {
        const newValue = response.data.uptime;

        if (newValue !== previousSystemValue) {
          currentSystemIntervalMs = initialIntervalMs;
          unchangedSystemCount = 0;
        } else {
          unchangedSystemCount++;
          currentSystemIntervalMs = Math.min(initialIntervalMs * Math.pow(2, unchangedSystemCount), maxIntervalMs);
        }

        previousSystemValue = newValue;
        systemUptime.value = newValue;

        clearInterval(systemInterval);
        systemInterval = setInterval(fetchSystemUptime, currentSystemIntervalMs);
      } else {
        console.warn("Invalid system uptime data received:", response.data);
      }
    } catch (error) {
      console.error("Failed to fetch system uptime:", error);
    }
  }

  async function fetchHomeDockUptime() {
    try {
      const response = await axios.get("/thread/homedock_uptime", {
        headers: {
          "X-HomeDock-CSRF-Token": propCSRF,
        },
      });

      if (response.data && typeof response.data.uptime === "string") {
        const newValue = response.data.uptime;

        if (newValue !== previousHomeDockValue) {
          currentHomeDockIntervalMs = initialIntervalMs;
          unchangedHomeDockCount = 0;
        } else {
          unchangedHomeDockCount++;
          currentHomeDockIntervalMs = Math.min(initialIntervalMs * Math.pow(2, unchangedHomeDockCount), maxIntervalMs);
        }

        previousHomeDockValue = newValue;
        homeDockUptime.value = newValue;

        clearInterval(homeDockInterval);
        homeDockInterval = setInterval(fetchHomeDockUptime, currentHomeDockIntervalMs);
      } else {
        console.warn("Invalid HomeDock uptime data received:", response.data);
      }
    } catch (error) {
      console.error("Failed to fetch HomeDock uptime:", error);
    }
  }

  onMounted(() => {
    systemInterval = setInterval(fetchSystemUptime, currentSystemIntervalMs);
    homeDockInterval = setInterval(fetchHomeDockUptime, currentHomeDockIntervalMs);

    onUnmounted(() => {
      clearInterval(systemInterval);
      clearInterval(homeDockInterval);
    });
  });

  return { systemUptime, homeDockUptime };
}
