// homedock-ui/vue3/static/js/__Stores__/useInstallationStore.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { defineStore } from "pinia";
import axios from "axios";

import { useAppStore } from "../__Stores__/useAppStore";

export const useInstallationStore = defineStore("InstallationStore", {
  state: () => ({
    currentlyInstalling: null as string | null,
    queue: [] as string[],
    idleCheckCounter: 0,
    maxIdleChecks: 10,
    isTrackingActive: false,
  }),
  actions: {
    async fetchInstallationStatus(csrfToken: string) {
      try {
        const response = await axios.get("/api/get-installation-status", {
          headers: { "X-HomeDock-CSRF-Token": csrfToken },
        });

        if (response.data) {
          this.currentlyInstalling = response.data.currently_installing;
          this.queue = response.data.queue || [];

          if (this.currentlyInstalling || this.queue.length > 0) {
            this.idleCheckCounter = 0;
          }
        } else {
          console.error("Failed to fetch installation status.");
        }
      } catch (error) {
        console.error("Error fetching installation status:", error);
      }
    },
    async fetchContainers(csrfToken: string) {
      try {
        const response = await axios.get("/api/containers", {
          headers: { "X-HomeDock-CSRF-Token": csrfToken },
        });

        if (response.data) {
          const appStore = useAppStore();
          const installedAppNames = response.data.map((container: { name: string }) => container.name);

          appStore.apps = appStore.apps.map((app) => ({
            ...app,
            is_installed: installedAppNames.includes(app.name),
          }));
        } else {
          console.error("Failed to fetch containers.");
        }
      } catch (error) {
        console.error("Error fetching containers:", error);
      }
    },
    async trackInstallations(csrfToken: string) {
      if (this.isTrackingActive) {
        return;
      }

      this.isTrackingActive = true;

      let previousInstalling: string | null = null;

      const pollStatus = async () => {
        try {
          await this.fetchInstallationStatus(csrfToken);

          if (this.currentlyInstalling !== previousInstalling) {
            if (previousInstalling) {
              await this.fetchContainers(csrfToken);
            }

            previousInstalling = this.currentlyInstalling;
          }

          if (!this.currentlyInstalling && this.queue.length === 0) {
            this.idleCheckCounter++;
            if (this.idleCheckCounter >= this.maxIdleChecks) {
              this.isTrackingActive = false;
              this.idleCheckCounter = 0;
              return;
            }
          } else {
            this.idleCheckCounter = 0;
          }
        } catch (error) {
          console.error("Error during polling:", error);
        }

        if (this.isTrackingActive) {
          setTimeout(() => pollStatus(), 1000);
        }
      };

      pollStatus();
    },
    startTracking(csrfToken: string) {
      if (!this.isTrackingActive) {
        this.trackInstallations(csrfToken);
      }
    },
    isInstalling(appName: string): boolean {
      return this.currentlyInstalling === appName || this.queue.includes(appName);
    },
  },
});
