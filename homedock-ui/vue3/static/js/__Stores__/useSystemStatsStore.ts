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

const keyToRefName: Record<string, string> = {
  cpu_temp: "cpuTemp",
  cpu_usage: "cpuUsage",
  ram_usage: "ramUsage",
  disk_usage: "hardDiskUsage",
  external_disk_usage: "externalDiskUsage",
  download_data: "downloadData",
  upload_data: "uploadData",
  total_containers: "totalContainers",
  active_containers: "activeContainers",
  system_uptime: "uptimeData",
  homedock_uptime: "startTime",
};

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

  const refs: Record<string, ReturnType<typeof ref<string>>> = {
    cpuTemp,
    cpuUsage,
    ramUsage,
    hardDiskUsage,
    externalDiskUsage,
    downloadData,
    uploadData,
    totalContainers,
    activeContainers,
    uptimeData,
    startTime,
  };

  let abortController: AbortController | null = null;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  let reconnectDelay = 0;

  function applyData(data: Record<string, string>) {
    for (const [sseKey, value] of Object.entries(data)) {
      const refName = keyToRefName[sseKey];
      if (refName && refs[refName]) {
        refs[refName].value = String(value);
      }
    }
  }

  function startPolling() {
    if (abortController) return;
    abortController = new AbortController();

    const connect = () => {
      const signal = abortController!.signal;
      let lastIndex = 0;
      let buffer = "";

      axios
        .get("/stream/stats", {
          headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
          signal,
          responseType: "text",
          onDownloadProgress: (progressEvent) => {
            const responseText = (progressEvent.event?.target as XMLHttpRequest)?.responseText;
            if (!responseText) return;

            const newData = responseText.substring(lastIndex);
            lastIndex = responseText.length;

            const combined = buffer + newData;
            const parts = combined.split("\n\n");
            buffer = parts.pop()!;

            for (const part of parts) {
              if (!part.trim()) continue;
              let event = "message";
              let data = "";
              for (const line of part.split("\n")) {
                if (line.startsWith("event: ")) event = line.slice(7);
                else if (line.startsWith("data: ")) data = line.slice(6);
              }
              if (data && (event === "snapshot" || event === "patch")) {
                try {
                  applyData(JSON.parse(data));
                } catch {
                  /* nope */
                }
              }
            }
          },
        })
        .then(() => {
          reconnectDelay = 0;
          if (!signal.aborted) connect();
        })
        .catch(() => {
          if (signal.aborted) return;
          reconnectDelay = Math.min((reconnectDelay || 1500) * 2, 60000);
          const jitter = reconnectDelay * (0.5 + Math.random() * 0.5);
          reconnectTimeout = setTimeout(connect, jitter);
        });
    };

    connect();
  }

  function stopPolling() {
    if (reconnectTimeout !== null) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
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
