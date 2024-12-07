// src/static/js/__Stores__/useAppStore.ts
// Copyright © 2023-2025 Banshee
// https://www.banshee.pro

import { defineStore } from "pinia";
import { App } from "../__Types__/AppStoreApp";
import { fetchContainers } from "../__Services__/DockerAPIFetchContainerData";
import AppStoreDefault from "../__Data__/AppStoreDefault.json";

import { useInstallationStore } from "../__Stores__/useInstallationStore";

function generateNotHash(input: string): string {
  let sum = 0;
  for (let i = 0; i < input.length; i++) {
    sum += input.charCodeAt(i);
  }
  return (sum % 10000).toString(36).padStart(3, "1");
}

export const useAppStore = defineStore("AppStore", {
  state: () => ({
    apps: [] as App[],
    searchQuery: "",
    selectedCategory: "",
    currentPage: 1,
    appsPerPage: 15,
  }),
  actions: {
    async loadApps(csrfToken: string) {
      this.apps = AppStoreDefault;

      try {
        const fetchedContainers = await fetchContainers(csrfToken);
        const installedAppNames = fetchedContainers.map((app: { name: string }) => app.name);

        this.apps = this.apps.map((app) => {
          const isStillNew = typeof app.new_until === "string" && new Date(app.new_until) >= new Date();

          return {
            ...app,
            is_new: isStillNew,
            new_until: isStillNew ? app.new_until : false,
            is_installed: installedAppNames.includes(app.name),
          };
        });

        await this.syncInstallationStatus();
        await this.initalInstallationPolling(csrfToken);
      } catch (error) {
        console.error("Error loading apps:", error);
      }
    },
    async syncInstallationStatus() {
      const installationStore = useInstallationStore();
      const { currentlyInstalling, queue } = installationStore;

      this.apps = this.apps.map((app) => {
        const isInQueue = queue.includes(app.name);
        const isCurrentlyInstalling = app.name === currentlyInstalling;

        return {
          ...app,
          installation_status: isCurrentlyInstalling ? "installing" : isInQueue ? `queued (${queue.indexOf(app.name) + 1}/${queue.length})` : app.is_installed ? "installed" : "not_installed",
        };
      });
    },
    async initalInstallationPolling(csrfToken: string) {
      const installationStore = useInstallationStore();
      installationStore.startTracking(csrfToken);
    },
    setPage(page: number) {
      this.currentPage = page;
    },
    setSearchQuery(query: string) {
      this.searchQuery = query;
      this.currentPage = 1;
    },
    setCategoryFilter(category: string) {
      this.selectedCategory = category;
      this.currentPage = 1;
    },
  },
  getters: {
    filteredApps: (state) => {
      const lowerQuery = state.searchQuery.toLowerCase();
      const installationStore = useInstallationStore();
      const { currentlyInstalling, queue } = installationStore;

      const filtered = state.apps.filter((app) => {
        const matchesQuery = app.name.toLowerCase().includes(lowerQuery) || app.type.toLowerCase().includes(lowerQuery) || app.description.toLowerCase().includes(lowerQuery);

        const matchesCategory = state.selectedCategory ? app.category === state.selectedCategory : true;

        return matchesQuery && matchesCategory;
      });

      const prioritized = filtered.map((app) => {
        let priority = 4;
        if (app.is_new) priority = 0;
        else if (currentlyInstalling === app.name) priority = 1;
        else if (queue.includes(app.name)) priority = 2;
        else if (app.is_installed) priority = 3;

        const appNotHash = generateNotHash(`${app.name}-${app.description}`);
        return { ...app, priority, appNotHash };
      });

      prioritized.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.appNotHash.localeCompare(b.appNotHash);
      });

      const start = (state.currentPage - 1) * state.appsPerPage;
      const end = start + state.appsPerPage;
      return prioritized.slice(start, end);
    },

    filteredAppsTotal: (state) => {
      const lowerQuery = state.searchQuery.toLowerCase();
      const filtered = state.apps.filter((app) => {
        const matchesQuery = app.name.toLowerCase().includes(lowerQuery) || app.type.toLowerCase().includes(lowerQuery) || app.description.toLowerCase().includes(lowerQuery);

        const matchesCategory = state.selectedCategory ? app.category === state.selectedCategory : true;

        return matchesQuery && matchesCategory;
      });

      return filtered.length;
    },

    sortedApps: (state) =>
      [...state.apps].sort((a, b) => {
        if (a.is_installed === b.is_installed) {
          if (a.is_new === b.is_new) return a.name.localeCompare(b.name);
          return b.is_new ? 1 : -1;
        }
        return b.is_installed ? -1 : 1;
      }),
  },
});
