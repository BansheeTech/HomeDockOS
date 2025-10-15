// homedock-ui/vue3/static/js/__Services__/DashboardNetworkUsage.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { onMounted, onUnmounted, ref, inject } from "vue";
import axios from "axios";

export function useNetworkDataUpdater(propCSRF: string, initialIntervalMs = 3000, initialDownloadData: string, initialUploadData: string, maxIntervalMs = 60000) {
  const downloadData = ref(initialDownloadData);
  const uploadData = ref(initialUploadData);

  let currentDownloadIntervalMs = initialIntervalMs;
  let previousDownloadValue = initialDownloadData;
  let unchangedDownloadCount = 0;
  let downloadInterval: ReturnType<typeof setInterval>;

  let currentUploadIntervalMs = initialIntervalMs;
  let previousUploadValue = initialUploadData;
  let unchangedUploadCount = 0;
  let uploadInterval: ReturnType<typeof setInterval>;

  const csrfTokenReactive = inject<{ value: string }>("csrf-token");

  async function fetchDownloadData() {
    try {
      const response = await axios.get("/thread/downloaded_data", {
        headers: {
          "X-HomeDock-CSRF-Token": csrfTokenReactive?.value || propCSRF,
        },
      });

      if (response.data && typeof response.data.download_data !== "undefined") {
        let newValue: string;

        if (typeof response.data.download_data === "number") {
          newValue = response.data.download_data.toFixed(2);
        } else if (typeof response.data.download_data === "string" && response.data.download_data !== "") {
          newValue = response.data.download_data;
        } else {
          console.warn("Invalid download data received:", response.data);
          return;
        }

        if (newValue !== previousDownloadValue) {
          currentDownloadIntervalMs = initialIntervalMs;
          unchangedDownloadCount = 0;
        } else {
          unchangedDownloadCount++;
          currentDownloadIntervalMs = Math.min(initialIntervalMs * Math.pow(2, unchangedDownloadCount), maxIntervalMs);
        }

        previousDownloadValue = newValue;
        downloadData.value = newValue;

        clearInterval(downloadInterval);
        downloadInterval = setInterval(fetchDownloadData, currentDownloadIntervalMs);
      } else {
        console.warn("Invalid download data structure:", response.data);
      }
    } catch (error) {
      console.error("Failed to fetch download data:", error);
    }
  }

  async function fetchUploadData() {
    try {
      const response = await axios.get("/thread/uploaded_data", {
        headers: {
          "X-HomeDock-CSRF-Token": csrfTokenReactive?.value || propCSRF,
        },
      });

      if (response.data && typeof response.data.upload_data !== "undefined") {
        let newValue: string;

        if (typeof response.data.upload_data === "number") {
          newValue = response.data.upload_data.toFixed(2);
        } else if (typeof response.data.upload_data === "string" && response.data.upload_data !== "") {
          newValue = response.data.upload_data;
        } else {
          console.warn("Invalid upload data received:", response.data);
          return;
        }

        if (newValue !== previousUploadValue) {
          currentUploadIntervalMs = initialIntervalMs;
          unchangedUploadCount = 0;
        } else {
          unchangedUploadCount++;
          currentUploadIntervalMs = Math.min(initialIntervalMs * Math.pow(2, unchangedUploadCount), maxIntervalMs);
        }

        previousUploadValue = newValue;
        uploadData.value = newValue;

        clearInterval(uploadInterval);
        uploadInterval = setInterval(fetchUploadData, currentUploadIntervalMs);
      } else {
        console.warn("Invalid upload data structure:", response.data);
      }
    } catch (error) {
      console.error("Failed to fetch upload data:", error);
    }
  }

  onMounted(() => {
    downloadInterval = setInterval(fetchDownloadData, currentDownloadIntervalMs);
    uploadInterval = setInterval(fetchUploadData, currentUploadIntervalMs);

    onUnmounted(() => {
      clearInterval(downloadInterval);
      clearInterval(uploadInterval);
    });
  });

  return { downloadData, uploadData };
}
