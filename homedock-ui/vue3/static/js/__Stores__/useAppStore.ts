// homedock-ui/vue3/static/js/__Stores__/useAppStore.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { defineStore } from "pinia";
import axios from "axios";
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

export type AppSortMode = "recommended" | "name";

function appLabel(app: App): string {
  return app.display_name || app.name;
}

function matchesQuery(app: App, lowerQuery: string): boolean {
  if (!lowerQuery) return true;
  return [app.name, app.display_name, app.type, app.category, app.description].some((field) => field?.toLowerCase().includes(lowerQuery));
}

export const useAppStore = defineStore("AppStore", {
  state: () => ({
    apps: [] as App[],
    searchQuery: "",
    selectedCategory: "",
    installedOnly: false,
    sortMode: "recommended" as AppSortMode,
    visibleCount: 20,
  }),
  actions: {
    async loadApps(csrfToken: string) {
      try {
        let allApps: App[] = [...AppStoreDefault];

        const [externalResponse, fetchedContainers] = await Promise.all([axios.get("/api/pkg/external-apps", { headers: { "X-HomeDock-CSRF-Token": csrfToken } }).catch(() => null), fetchContainers(csrfToken)]);

        if (externalResponse && externalResponse.status === 200) {
          const externalData = externalResponse.data;
          if (externalData.success && externalData.apps.length > 0) {
            const existingNames = new Set(allApps.map((a) => a.name));
            const uniqueExternal = externalData.apps.filter((a: { name: string }) => !existingNames.has(a.name));
            allApps = [...allApps, ...uniqueExternal];
          }
        }

        const installedAppNames = fetchedContainers.map((app: { name: string }) => app.name);

        this.apps = allApps.map((app) => {
          const isStillNew = typeof app.new_until === "string" && new Date(app.new_until) >= new Date();

          return {
            ...app,
            is_new: isStillNew,
            new_until: isStillNew ? app.new_until : false,
            is_installed: installedAppNames.includes(app.name),
          };
        });

        await this.initalInstallationPolling(csrfToken);
      } catch (error) {
        console.error("Error loading apps:", error);
        this.apps = AppStoreDefault;
      }
    },
    async initalInstallationPolling(csrfToken: string) {
      const installationStore = useInstallationStore();
      installationStore.startTracking();
    },
    setSearchQuery(query: string) {
      this.searchQuery = query;
      this.visibleCount = 20;
    },
    setListFilter(filter: { category: string; installedOnly: boolean }) {
      if (this.selectedCategory === filter.category && this.installedOnly === filter.installedOnly) return;
      this.selectedCategory = filter.category;
      this.installedOnly = filter.installedOnly;
      this.visibleCount = 20;
    },
    setSortMode(mode: AppSortMode) {
      this.sortMode = mode;
      this.visibleCount = 20;
    },
    loadMore() {
      this.visibleCount += 15;
    },

    updateAppInstallationStatus(appName: string, isInstalled: boolean) {
      const appIndex = this.apps.findIndex((app) => app.name === appName);
      if (appIndex !== -1) {
        this.apps[appIndex] = {
          ...this.apps[appIndex],
          is_installed: isInstalled,
        };
      }
    },
  },
  getters: {
    rankedApps: (state): App[] =>
      state.apps
        .map((app) => ({ app, hash: generateNotHash(`${app.name}-${app.description}`) }))
        .sort((a, b) => {
          if (a.app.is_new !== b.app.is_new) return a.app.is_new ? -1 : 1;
          return a.hash.localeCompare(b.hash);
        })
        .map(({ app }) => app),

    matchingApps: (state): App[] => {
      const lowerQuery = state.searchQuery.trim().toLowerCase();
      const { currentlyInstalling, queue } = useInstallationStore();

      const filtered = state.apps.filter((app) => {
        if (state.selectedCategory && app.category !== state.selectedCategory) return false;
        if (state.installedOnly && !app.is_installed) return false;
        return matchesQuery(app, lowerQuery);
      });

      if (state.sortMode === "name") {
        return filtered.sort((a, b) => appLabel(a).localeCompare(appLabel(b)));
      }

      const priorityOf = (app: App) => {
        if (app.is_new) return 0;
        if (currentlyInstalling === app.name) return 1;
        if (queue.includes(app.name)) return 2;
        if (app.is_installed) return 3;
        return 4;
      };

      return filtered
        .map((app) => ({ app, priority: priorityOf(app), hash: generateNotHash(`${app.name}-${app.description}`) }))
        .sort((a, b) => {
          if (a.priority !== b.priority) return a.priority - b.priority;
          return a.hash.localeCompare(b.hash);
        })
        .map(({ app }) => app);
    },

    infiniteApps(): App[] {
      return this.matchingApps.slice(0, this.visibleCount);
    },

    hasMore(): boolean {
      return this.visibleCount < this.matchingApps.length;
    },

    categoryCounts: (state): { name: string; count: number }[] => {
      const counts = new Map<string, number>();
      for (const app of state.apps) {
        if (app.category) counts.set(app.category, (counts.get(app.category) ?? 0) + 1);
      }
      return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    },

    installedCount: (state): number => state.apps.filter((app) => app.is_installed).length,
  },
});
