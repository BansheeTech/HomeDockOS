// homedock-ui/vue3/static/js/__Stores__/useSystemStatsStore.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import axios from "axios";
import { defineStore } from "pinia";
import { ref, inject } from "vue";
import { useCsrfToken } from "../__Composables__/useCsrfToken";

interface DashboardData {
  cpuTemp?: string;
  cpuGhz?: string;
  cpuUsage?: string;
  cpuCores?: string;
  ramUsage?: string;
  totalRam?: string;
  hardDiskUsage?: string;
  hardDiskTotal?: string;
  externalDefaultDisk?: string;
  externalDiskUsage?: string;
  externalDiskTotal?: string;
  interfaceName?: string;
  downloadData?: string;
  uploadData?: string;
  totalContainers?: string;
  activeContainers?: string;
  uptimeData?: string;
  startTime?: string;
}

export const useSystemStatsStore = defineStore("systemStats", () => {
  const dashboardData = inject<DashboardData>("data-dashboard");
  const csrfToken = useCsrfToken();

  const cpuTemp = ref(dashboardData?.cpuTemp || "0");
  const cpuGhz = ref(dashboardData?.cpuGhz || "0");
  const cpuUsage = ref(dashboardData?.cpuUsage || "0");
  const cpuCores = ref(dashboardData?.cpuCores || "0");
  const ramUsage = ref(dashboardData?.ramUsage || "0");
  const totalRam = ref(dashboardData?.totalRam || "0");
  const hardDiskUsage = ref(dashboardData?.hardDiskUsage || "0");
  const hardDiskTotal = ref(dashboardData?.hardDiskTotal || "0");
  const externalDefaultDisk = ref(dashboardData?.externalDefaultDisk || "disabled");
  const externalDiskUsage = ref(dashboardData?.externalDiskUsage || "0");
  const externalDiskTotal = ref(dashboardData?.externalDiskTotal || "0");
  const interfaceName = ref(dashboardData?.interfaceName || "Network");
  const downloadData = ref(dashboardData?.downloadData || "0 GB");
  const uploadData = ref(dashboardData?.uploadData || "0 GB");
  const totalContainers = ref(dashboardData?.totalContainers || "0");
  const activeContainers = ref(dashboardData?.activeContainers || "0");
  const uptimeData = ref(dashboardData?.uptimeData || "0d 0h");
  const startTime = ref(dashboardData?.startTime || "0d 0h");

  let intervals: Record<string, ReturnType<typeof setInterval>> = {};
  let previousValues: Record<string, string> = {};
  let unchangedCounts: Record<string, number> = {};

  const initialIntervalMs = 3000;
  const maxIntervalMs = 60000;

  async function fetchEndpoint(endpoint: string, dataKey: string, targetRef: any, extractValue: (response: any) => string | undefined) {
    try {
      const response = await axios.get(endpoint, {
        headers: {
          "X-HomeDock-CSRF-Token": csrfToken.value,
        },
      });

      const newValue = extractValue(response.data);
      if (newValue === undefined) {
        console.warn(`Invalid data received from ${endpoint}:`, response.data);
        return;
      }

      if (newValue !== previousValues[dataKey]) {
        unchangedCounts[dataKey] = 0;
        clearInterval(intervals[dataKey]);
        intervals[dataKey] = setInterval(() => fetchEndpoint(endpoint, dataKey, targetRef, extractValue), initialIntervalMs);
      } else {
        unchangedCounts[dataKey] = (unchangedCounts[dataKey] || 0) + 1;
        const newInterval = Math.min(initialIntervalMs * Math.pow(2, unchangedCounts[dataKey]), maxIntervalMs);
        clearInterval(intervals[dataKey]);
        intervals[dataKey] = setInterval(() => fetchEndpoint(endpoint, dataKey, targetRef, extractValue), newInterval);
      }

      previousValues[dataKey] = newValue;
      targetRef.value = newValue;
    } catch (error) {
      console.error(`Failed to fetch ${endpoint}:`, error);
    }
  }

  function startPolling() {
    intervals.cpuTemp = setInterval(
      () =>
        fetchEndpoint("/thread/update_cpu_temp", "cpuTemp", cpuTemp, (data) => {
          if (typeof data.cpu_temp === "number") return data.cpu_temp.toFixed(1);
          if (typeof data.cpu_temp === "string") return data.cpu_temp;
        }),
      initialIntervalMs
    );

    intervals.cpuUsage = setInterval(
      () =>
        fetchEndpoint("/thread/update_cpu_usage", "cpuUsage", cpuUsage, (data) => {
          if (typeof data.cpu_usage === "number") return data.cpu_usage.toFixed(1);
          if (typeof data.cpu_usage === "string") return data.cpu_usage;
        }),
      initialIntervalMs
    );

    intervals.ramUsage = setInterval(
      () =>
        fetchEndpoint("/thread/update_ram_usage", "ramUsage", ramUsage, (data) => {
          if (typeof data.ram_usage === "number") return data.ram_usage.toFixed(1);
          if (typeof data.ram_usage === "string") return data.ram_usage;
        }),
      initialIntervalMs
    );

    intervals.hardDiskUsage = setInterval(
      () =>
        fetchEndpoint("/thread/update_disk_usage", "hardDiskUsage", hardDiskUsage, (data) => {
          if (typeof data.disk_usage === "number") return data.disk_usage.toFixed(1);
          if (typeof data.disk_usage === "string") return data.disk_usage;
        }),
      initialIntervalMs
    );

    intervals.externalDiskUsage = setInterval(
      () =>
        fetchEndpoint("/thread/update_external_disk_usage", "externalDiskUsage", externalDiskUsage, (data) => {
          if (typeof data.usage === "number") return data.usage.toFixed(1);
          if (typeof data.usage === "string") return data.usage;
        }),
      initialIntervalMs
    );

    intervals.downloadData = setInterval(
      () =>
        fetchEndpoint("/thread/downloaded_data", "downloadData", downloadData, (data) => {
          if (typeof data.download_data === "number") return data.download_data.toFixed(2);
          if (typeof data.download_data === "string") return data.download_data;
        }),
      initialIntervalMs
    );

    intervals.uploadData = setInterval(
      () =>
        fetchEndpoint("/thread/uploaded_data", "uploadData", uploadData, (data) => {
          if (typeof data.upload_data === "number") return data.upload_data.toFixed(2);
          if (typeof data.upload_data === "string") return data.upload_data;
        }),
      initialIntervalMs
    );

    intervals.totalContainers = setInterval(
      () =>
        fetchEndpoint("/thread/installed_containers", "totalContainers", totalContainers, (data) => {
          if (typeof data.containers !== "undefined") return data.containers.toString();
        }),
      initialIntervalMs
    );

    intervals.activeContainers = setInterval(
      () =>
        fetchEndpoint("/thread/active_containers", "activeContainers", activeContainers, (data) => {
          if (typeof data.active_containers !== "undefined") return data.active_containers.toString();
        }),
      initialIntervalMs
    );

    intervals.systemUptime = setInterval(
      () =>
        fetchEndpoint("/thread/system_uptime", "systemUptime", uptimeData, (data) => {
          if (typeof data.uptime === "string") return data.uptime;
        }),
      initialIntervalMs
    );

    intervals.homeDockUptime = setInterval(
      () =>
        fetchEndpoint("/thread/homedock_uptime", "homeDockUptime", startTime, (data) => {
          if (typeof data.uptime === "string") return data.uptime;
        }),
      initialIntervalMs
    );
  }

  function stopPolling() {
    Object.values(intervals).forEach((interval) => clearInterval(interval));
    intervals = {};
  }

  return {
    cpuTemp,
    cpuGhz,
    cpuUsage,
    cpuCores,
    ramUsage,
    totalRam,
    hardDiskUsage,
    hardDiskTotal,
    externalDefaultDisk,
    externalDiskUsage,
    externalDiskTotal,
    interfaceName,
    downloadData,
    uploadData,
    totalContainers,
    activeContainers,
    uptimeData,
    startTime,

    startPolling,
    stopPolling,
  };
});
