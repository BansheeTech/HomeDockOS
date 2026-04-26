// homedock-ui/vue3/static/js/__Stores__/useSystemStatsStore.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { defineStore } from "pinia";
import { ref, inject } from "vue";
import { registerSSERef } from "./useSSEStore";

import type { DashboardData } from "../__Types__/DashboardData";

export const useSystemStatsStore = defineStore("systemStats", () => {
  const dashboardData = inject<DashboardData | null>("data-dashboard", null);

  const cpuTemp = ref(dashboardData?.cpu_temp || "0");
  const cpuGhz = ref(dashboardData?.get_cpu_max_speed || "0");
  const cpuUsage = ref(dashboardData?.cpu_usage || "0");
  const cpuCores = ref(dashboardData?.cpu_cores || "0");
  const ramUsage = ref(dashboardData?.ram_usage || "0");
  const totalRam = ref(dashboardData?.total_ram || "0");
  const interfaceName = ref(dashboardData?.interface_name || "Network");
  const downloadData = ref(dashboardData?.vdownload || "0 GB");
  const uploadData = ref(dashboardData?.vupload || "0 GB");
  const totalContainers = ref(dashboardData?.n_total_containers || "0");
  const activeContainers = ref(dashboardData?.n_active_containers || "0");
  const uptimeData = ref(dashboardData?.uptime_data || "0d 0h");
  const startTime = ref(dashboardData?.start_time || "0d 0h");

  registerSSERef("cpu_temp", cpuTemp);
  registerSSERef("cpu_usage", cpuUsage);
  registerSSERef("ram_usage", ramUsage);
  registerSSERef("download_data", downloadData);
  registerSSERef("upload_data", uploadData);
  registerSSERef("total_containers", totalContainers);
  registerSSERef("active_containers", activeContainers);
  registerSSERef("system_uptime", uptimeData);
  registerSSERef("homedock_uptime", startTime);

  return {
    cpuTemp,
    cpuGhz,
    cpuUsage,
    cpuCores,
    ramUsage,
    totalRam,
    interfaceName,
    downloadData,
    uploadData,
    totalContainers,
    activeContainers,
    uptimeData,
    startTime,
  };
});
