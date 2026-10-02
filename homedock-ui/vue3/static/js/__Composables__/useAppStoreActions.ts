// homedock-ui/vue3/static/js/__Composables__/useAppStoreActions.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { t } from "../__Languages__";

import { useAppStore } from "../__Stores__/useAppStore";
import { useDesktopStore } from "../__Stores__/desktopStore";
import { useWindowStore } from "../__Stores__/windowStore";

import type { App } from "../__Types__/AppStoreApp";
import type { DockerApp } from "../__Stores__/desktopStore";

export function useAppStoreActions() {
  const appStore = useAppStore();
  const desktopStore = useDesktopStore();
  const windowStore = useWindowStore();

  function findStoreApp(name: string): App | undefined {
    const lowerName = name.toLowerCase();
    return appStore.apps.find((app) => app.name.toLowerCase() === lowerName);
  }

  function findDockerApp(app: App): DockerApp | undefined {
    return desktopStore.dockerApps.find((docker) => docker.name === app.name) ?? desktopStore.dockerApps.find((docker) => docker.HDGroup === app.name && docker.HDRole !== "dependency");
  }

  function openAppDetails(app: App) {
    const storeApp = findStoreApp(app.name) ?? app;

    const existingWindow = windowStore.windows.find((w) => w.appId === "installconfig" && w.data?.app?.name === storeApp.name);

    if (existingWindow) {
      windowStore.focusWindow(existingWindow.id);
      if (existingWindow.isMinimized) {
        existingWindow.isMinimized = false;
      }
      return;
    }

    windowStore.openUniqueWindow("installconfig", storeApp.name, {
      title: t("Install {name}", { name: storeApp.display_name || storeApp.name }),
      data: { app: storeApp },
    });
  }

  function openInstalledApp(app: App) {
    const docker = findDockerApp(app);
    if (docker) desktopStore.openDockerApp(docker);
    else openAppDetails(app);
  }

  return { findStoreApp, findDockerApp, openAppDetails, openInstalledApp };
}
