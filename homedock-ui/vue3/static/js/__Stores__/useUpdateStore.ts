// homedock-ui/vue3/static/js/__Stores__/useUpdateStore.ts
// Copyright © 2023-2025 Banshee
// https://www.banshee.pro

import { defineStore } from "pinia";

import axios from "axios";

interface UpdateInfo {
  current_version: string;
  latest_version: string;
  update_available: boolean;
}

function isVersionGreater(v1: string, v2: string): boolean {
  try {
    const parts1 = v1.split(".").map((x) => parseInt(x, 10));
    const parts2 = v2.split(".").map((x) => parseInt(x, 10));

    const maxLen = Math.max(parts1.length, parts2.length);
    while (parts1.length < maxLen) parts1.push(0);
    while (parts2.length < maxLen) parts2.push(0);

    for (let i = 0; i < maxLen; i++) {
      if (parts1[i] > parts2[i]) return true;
      if (parts1[i] < parts2[i]) return false;
    }

    return false;
  } catch (error) {
    return v1 !== v2;
  }
}

export const useUpdateStore = defineStore("updateStore", {
  state: () => ({
    currentVersion: "",
    latestVersion: "",
    updateAvailable: false,
    lastChecked: 0,
  }),

  actions: {
    async checkForUpdate(csrfToken: string) {
      const now = Date.now();
      const updateCheckData = localStorage.getItem("updateCheckData");

      if (updateCheckData) {
        const parsedData = JSON.parse(updateCheckData);
        this.currentVersion = parsedData.currentVersion;
        this.latestVersion = parsedData.latestVersion;
        this.lastChecked = parsedData.lastChecked;

        if (isVersionGreater(parsedData.latestVersion, parsedData.currentVersion)) {
          this.updateAvailable = true;
          return;
        }

        if (now - parsedData.lastChecked < 12 * 60 * 60 * 1000) {
          return;
        }
      }

      try {
        const response = await axios.get<UpdateInfo>("/api/check_update", {
          headers: { "X-HomeDock-CSRF-Token": csrfToken },
        });

        this.currentVersion = response.data.current_version;
        this.latestVersion = response.data.latest_version;
        this.updateAvailable = response.data.update_available;

        const updateData = {
          lastChecked: now,
          currentVersion: response.data.current_version,
          latestVersion: response.data.latest_version,
        };
        localStorage.setItem("updateCheckData", JSON.stringify(updateData));
      } catch (error) {
        this.updateAvailable = false;
        console.error("Error checking for updates:", error);
      }
    },

    async triggerUpdate(csrfToken: string) {
      try {
        axios.post("/api/update_now", {}, { headers: { "X-HomeDock-CSRF-Token": csrfToken } });
        localStorage.removeItem("updateCheckData");
        axios.post("/logout", {}, { headers: { "X-HomeDock-CSRF-Token": csrfToken } });

        setTimeout(() => {
          window.location.href = "/";
        }, 2500);
      } catch (error) {
        console.error("Error updating HomeDock OS:", error);
      }
    },
  },
});
