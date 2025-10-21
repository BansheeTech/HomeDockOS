// homedock-ui/vue3/static/js/__Stores__/selectedAppsStore.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { defineStore } from "pinia";

interface Application {
  id: string;
  name: string;
  image: string;
  host: string;
  ports: string[];
  usagePercent: number;
  memoryUsagePercent: number;
  networkRxBytes: number;
  networkTxBytes: number;
  status: "running" | "exited" | "paused" | "created";
  statusColor: string;
  image_path: string;
  checked: boolean;
  service_url: string;
  HDGroup: string;
  HDRole?: string;
  isProcessing: boolean;
}

export const useSelectedAppsStore = defineStore("selectedApps", {
  state: () => ({
    selectedApps: [] as string[],
    applications: [] as Application[],
    desiredStates: {} as Record<string, string>,
    errorStates: {} as Record<string, string>,
  }),
  actions: {
    setApplications(newApps: Application[]) {
      const oldApps = this.applications;

      this.applications = newApps.map((newApp) => {
        const oldApp = oldApps.find((o) => o.name === newApp.name);
        if (!oldApp) {
          return {
            ...newApp,
            isProcessing: false,
            checked: this.selectedApps.includes(newApp.name),
          };
        }

        let isProcessing = oldApp.isProcessing;

        const desiredState = this.desiredStates[newApp.name];
        if (desiredState && newApp.status === desiredState) {
          isProcessing = false;
          delete this.desiredStates[newApp.name];
        }

        const statusChanged = oldApp.status !== newApp.status;
        if (statusChanged) {
          isProcessing = false;
        }

        return {
          ...newApp,
          isProcessing,
          checked: this.selectedApps.includes(newApp.name),
        };
      });

      const currentAppNames = new Set(newApps.map((app) => app.name));
      Object.keys(this.desiredStates).forEach((appName) => {
        if (!currentAppNames.has(appName)) {
          delete this.desiredStates[appName];
        }
      });
    },
    setDesiredState(appName: string, state: string) {
      this.desiredStates[appName] = state;
    },
    clearDesiredState(appName: string) {
      delete this.desiredStates[appName];
    },
    getDesiredState(appName: string): string | undefined {
      return this.desiredStates[appName];
    },
    setErrorState(appName: string, errorMessage: string) {
      this.errorStates[appName] = errorMessage;
    },
    clearErrorState(appName: string) {
      delete this.errorStates[appName];
    },
    saveOrder() {
      const ORDER_KEY = "dashboardLocalOrder";
      const mainAppsOrder = this.applications.filter((app) => app.HDRole !== "dependency").map((app) => app.name);

      localStorage.setItem(ORDER_KEY, JSON.stringify(mainAppsOrder));
    },
    updateSelection(newSelection: string[]) {
      this.selectedApps = newSelection;
      this.applications.forEach((app) => {
        app.checked = newSelection.includes(app.name);
      });
    },
    clearSelection() {
      this.selectedApps = [];
      this.applications.forEach((app) => {
        app.checked = false;
      });
    },
    toggleSelection(appName: string) {
      const app = this.applications.find((a) => a.name === appName);
      if (app) {
        app.checked = !app.checked;
        if (app.checked) {
          this.selectedApps.push(app.name);
        } else {
          this.selectedApps = this.selectedApps.filter((name) => name !== appName);
        }
      }
    },
    setProcessing(appName: string, isProcessing: boolean) {
      const app = this.applications.find((a) => a.name === appName);
      if (app) {
        app.isProcessing = isProcessing;
      }
    },
  },
});
