// src/static/js/__Stores__/useModalStore.ts
// Copyright © 2023-2025 Banshee, All Rights Reserved
// https://www.banshee.pro

import { defineStore } from "pinia";
import { App } from "../__Types__/AppStoreApp";
import axios from "axios";

import { useAppStore } from "../__Stores__/useAppStore";
import { useInstallationStore } from "../__Stores__/useInstallationStore";

type CheckedType = boolean | string | number;

export const useModalStore = defineStore("ModalStore", {
  state: () => ({
    apps: [] as App[],
    isModalVisible: false,
    selectedApp: null as App | null,
    isAdvancedMode: false,
    ports: [] as string[],
    volumes: [] as string[],
    restartPolicy: "unless-stopped",
    advancedCompose: "",
    userName: "",
    userPassword: "",
    isProcessing: {} as Record<string, boolean>,
  }),
  actions: {
    async fetchAppInfo(containerName: string, csrfToken: string) {
      try {
        const response = await axios.get(`/api/get-appstore-info`, {
          params: { containerName },
          headers: { "X-HomeDock-CSRF-Token": csrfToken },
        });
        if (response.data?.success) {
          this.ports = response.data.data.ports || [];
          this.volumes = response.data.data.volumes || [];
          this.advancedCompose = response.data.data.ymlContent || "";
          this.restartPolicy = "unless-stopped";
          this.userName = response.data.data.user_name || undefined;
          this.userPassword = response.data.data.password || undefined;
        } else {
          console.error("Failed to fetch app info:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching app info:", error);
      }
    },
    async installApp(containerName: string, csrfToken: string) {
      if (this.isProcessing[containerName]) {
        return;
      }

      this.isProcessing[containerName] = true;

      const installationStore = useInstallationStore();
      try {
        const configPayload = this.isAdvancedMode
          ? {
              containerName,
              configType: "advanced",
              ymlContent: this.advancedCompose,
              homedock_csrf_token: csrfToken,
            }
          : {
              containerName,
              configType: "simple",
              userName: this.userName,
              userPassword: this.userPassword,
              ports: this.ports,
              volumes: this.volumes,
              restartPolicy: this.restartPolicy,
              homedock_csrf_token: csrfToken,
            };

        const configResponse = await axios.post("/api/process-config", configPayload, {
          headers: { "X-HomeDock-CSRF-Token": csrfToken },
        });

        if (!configResponse.data.success) {
          console.error(`Failed to process configuration: ${configResponse.data.message}`);
          return;
        }

        await installationStore.trackInstallations(csrfToken);

        const installResponse = await axios.post("/api/app-store-install-container", {
          containerName,
          homedock_csrf_token: csrfToken,
        });

        if (installResponse.data.success) {
          console.log(`Installation queued: ${installResponse.data.message}`);
        } else {
          console.error(`Failed to queue installation: ${installResponse.data.message}`);
        }
      } catch (error) {
        console.error("Error during installation process:", error);
      } finally {
        this.isProcessing[containerName] = false;
      }
    },
    addPort() {
      this.ports.push("");
    },
    removePort(index: number) {
      this.ports.splice(index, 1);
    },
    addVolume() {
      this.volumes.push("");
    },
    removeVolume(index: number) {
      this.volumes.splice(index, 1);
    },
    toggleAdvancedMode(checked: CheckedType, e: Event) {
      this.isAdvancedMode = !!checked;
    },
    openModal(app: App, csrfToken: string) {
      this.selectedApp = app;
      this.isModalVisible = true;
      this.fetchAppInfo(app.name, csrfToken);
      this.syncSelectedApp();
    },
    closeModal() {
      this.isModalVisible = false;
      this.selectedApp = null;
    },
    syncSelectedApp() {
      const appStore = useAppStore();
      if (this.selectedApp) {
        const updatedApp = appStore.apps.find((app) => app.name === this.selectedApp?.name);
        if (updatedApp) {
          this.selectedApp = { ...this.selectedApp, ...updatedApp };
        }
      }
    },
  },
});
