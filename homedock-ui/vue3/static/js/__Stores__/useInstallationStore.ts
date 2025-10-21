// homedock-ui/vue3/static/js/__Stores__/useInstallationStore.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "axios";

import { useAppStore } from "../__Stores__/useAppStore";
import { useCsrfToken } from "../__Composables__/useCsrfToken";

export const useInstallationStore = defineStore("InstallationStore", () => {
  const csrfToken = useCsrfToken();

  const currentlyInstalling = ref<string | null>(null);
  const queue = ref<string[]>([]);
  const idleCheckCounter = ref(0);
  const maxIdleChecks = ref(10);
  const isTrackingActive = ref(false);

  async function fetchInstallationStatus() {
    try {
      const response = await axios.get("/api/get-installation-status", {
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      });

      if (response.data) {
        currentlyInstalling.value = response.data.currently_installing;
        queue.value = response.data.queue || [];

        if (currentlyInstalling.value || queue.value.length > 0) {
          idleCheckCounter.value = 0;
        }
      } else {
        console.error("Failed to fetch installation status.");
      }
    } catch (error) {
      console.error("Error fetching installation status:", error);
    }
  }

  async function fetchContainers() {
    try {
      const response = await axios.get("/api/containers", {
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
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
  }

  async function trackInstallations() {
    if (isTrackingActive.value) {
      return;
    }

    isTrackingActive.value = true;

    let previousInstalling: string | null = null;

    const pollStatus = async () => {
      try {
        await fetchInstallationStatus();

        if (currentlyInstalling.value !== previousInstalling) {
          if (previousInstalling) {
            await fetchContainers();
          }

          previousInstalling = currentlyInstalling.value;
        }

        if (!currentlyInstalling.value && queue.value.length === 0) {
          idleCheckCounter.value++;
          if (idleCheckCounter.value >= maxIdleChecks.value) {
            isTrackingActive.value = false;
            idleCheckCounter.value = 0;
            return;
          }
        } else {
          idleCheckCounter.value = 0;
        }
      } catch (error) {
        console.error("Error during polling:", error);
      }

      if (isTrackingActive.value) {
        setTimeout(() => pollStatus(), 1000);
      }
    };

    pollStatus();
  }

  function startTracking() {
    if (!isTrackingActive.value) {
      trackInstallations();
    }
  }

  function isInstalling(appName: string): boolean {
    return currentlyInstalling.value === appName || queue.value.includes(appName);
  }

  return {
    currentlyInstalling,
    queue,
    idleCheckCounter,
    maxIdleChecks,
    isTrackingActive,
    fetchInstallationStatus,
    fetchContainers,
    trackInstallations,
    startTracking,
    isInstalling,
  };
});
