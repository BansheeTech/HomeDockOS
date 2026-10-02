// homedock-ui/vue3/static/js/__Composables__/useStartMenuApps.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { computed, onBeforeUnmount, ref } from "vue";
import { useI18n } from "vue-i18n";

import { useDesktopStore, type DockerApp } from "../__Stores__/desktopStore";
import { useWindowStore } from "../__Stores__/windowStore";
import { appLayoutKey } from "../__Stores__/useDesktopSyncStore";
import { getStartMenuApps, ENTERPRISE_APP_COLOR } from "../__Config__/WindowDefaultDetails";
import type { SystemApp } from "../__Config__/WindowTypes";
import { UTILITIES_APPS } from "../__Config__/UtilitiesDefaultDetails";
import { GAMES_APPS } from "../__Config__/GamesDefaultDetails";
import EnterpriseSRILoader from "../__Utils__/EnterpriseSRILoader";

export type StartMenuAppKind = "system" | "enterprise" | "docker" | "utility" | "game";

export interface StartMenuApp {
  key: string;
  kind: StartMenuAppKind;
  name: string;
  description?: string;
  icon?: any;
  color?: string;
  imagePath?: string;
  moduleName?: string;
  dockerApp?: DockerApp;
}

export interface StartMenuRecentApp {
  app: StartMenuApp;
  at: number;
}

interface EnterpriseStartMenuModule {
  name: string;
  entry: {
    desktopMeta?: {
      id: string;
      moduleName: string;
      displayName: string;
      icon: any;
    };
  };
}

const ENTERPRISE_POLL_MS = 100;

const STATUS_PRIORITY: Record<string, number> = {
  running: 1,
  paused: 2,
  created: 3,
  exited: 4,
};

export function useStartMenuApps() {
  const { t } = useI18n();
  const desktopStore = useDesktopStore();
  const windowStore = useWindowStore();

  const enterpriseModules = ref<EnterpriseStartMenuModule[]>([]);
  let enterpriseTimer: ReturnType<typeof setTimeout> | null = null;

  function loadEnterpriseModules() {
    if (!EnterpriseSRILoader.isReady()) {
      enterpriseTimer = setTimeout(loadEnterpriseModules, ENTERPRISE_POLL_MS);
      return;
    }

    enterpriseTimer = null;
    enterpriseModules.value = EnterpriseSRILoader.getModulesBySlot("startMenu") as EnterpriseStartMenuModule[];
  }

  loadEnterpriseModules();

  onBeforeUnmount(() => {
    if (enterpriseTimer) clearTimeout(enterpriseTimer);
  });

  const fromSystemApp = (kind: StartMenuAppKind) => (app: SystemApp) => ({ key: app.id, kind, name: app.name, description: app.description, icon: app.icon, color: app.color });

  const systemApps = computed<StartMenuApp[]>(() => getStartMenuApps().map(fromSystemApp("system")));

  const utilityApps = computed<StartMenuApp[]>(() => UTILITIES_APPS.map(fromSystemApp("utility")));

  const gameApps = computed<StartMenuApp[]>(() => GAMES_APPS.map(fromSystemApp("game")));

  const enterpriseApps = computed<StartMenuApp[]>(() =>
    enterpriseModules.value.flatMap((module) => {
      const meta = module.entry.desktopMeta;
      return meta ? [{ key: meta.id, kind: "enterprise" as const, name: meta.displayName, icon: meta.icon, color: ENTERPRISE_APP_COLOR, moduleName: meta.moduleName }] : [];
    }),
  );

  const enterpriseSlotModules = computed(() => enterpriseModules.value.filter((module) => !module.entry.desktopMeta).map((module) => module.name));

  const installedApps = computed<StartMenuApp[]>(() =>
    desktopStore.mainDockerApps
      .map((dockerApp) => ({
        key: appLayoutKey(dockerApp.name),
        kind: "docker" as const,
        name: dockerApp.display_name || dockerApp.name,
        description: dockerApp.image,
        imagePath: dockerApp.image_path,
        dockerApp,
      }))
      .sort((a, b) => {
        const priorityA = STATUS_PRIORITY[a.dockerApp.status] || 999;
        const priorityB = STATUS_PRIORITY[b.dockerApp.status] || 999;
        return priorityA !== priorityB ? priorityA - priorityB : a.name.localeCompare(b.name);
      }),
  );

  const allApps = computed(() => [...enterpriseApps.value, ...systemApps.value, ...installedApps.value, ...utilityApps.value, ...gameApps.value]);

  const appsByKey = computed(() => new Map(allApps.value.map((app) => [app.key, app])));

  const pinnedApps = computed(() => desktopStore.pinnedApps.flatMap((key) => appsByKey.value.get(key) ?? []));

  const recentApps = computed<StartMenuRecentApp[]>(() =>
    desktopStore.recentApps.flatMap((entry) => {
      const app = appsByKey.value.get(entry.id);
      return app ? [{ app, at: entry.at }] : [];
    }),
  );

  function appName(app: StartMenuApp): string {
    return app.kind === "docker" || app.kind === "enterprise" ? app.name : t(app.name);
  }

  function matchesQuery(app: StartMenuApp, query: string): boolean {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;

    return appName(app).toLowerCase().includes(needle) || app.name.toLowerCase().includes(needle) || Boolean(app.description?.toLowerCase().includes(needle));
  }

  function searchApps(query: string): StartMenuApp[] {
    const needle = query.trim().toLowerCase();
    const matches = allApps.value.filter((app) => matchesQuery(app, needle));

    return matches.sort((a, b) => Number(!appName(a).toLowerCase().startsWith(needle)) - Number(!appName(b).toLowerCase().startsWith(needle)));
  }

  function launchApp(app: StartMenuApp) {
    if (app.kind === "docker" && app.dockerApp) {
      desktopStore.openDockerApp(app.dockerApp);
      desktopStore.closeStartMenu();
      return;
    }

    if (app.kind === "enterprise") {
      windowStore.openWindow("enterprise-window", { title: app.name, data: { module: app.moduleName, icon: app.icon } });
      desktopStore.addToRecent(app.key);
      desktopStore.closeStartMenu();
      return;
    }

    desktopStore.openSystemApp(app.key);
  }

  return {
    systemApps,
    enterpriseApps,
    enterpriseSlotModules,
    installedApps,
    utilityApps,
    gameApps,
    allApps,
    pinnedApps,
    recentApps,
    appName,
    matchesQuery,
    searchApps,
    launchApp,
  };
}
