// homedock-ui/vue3/static/js/__Composables__/useAppQuickActions.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import axios from "axios";

import { ref } from "vue";
import { useI18n } from "vue-i18n";

import { useWindowStore } from "../__Stores__/windowStore";
import { useCsrfToken } from "./useCsrfToken";
import type { DockerApp } from "../__Stores__/desktopStore";
import type { ContextMenuAction, ContextMenuItem } from "../__Components__/ContextMenu.vue";

import terminalIcon from "@iconify-icons/mdi/console-line";
import logsIcon from "@iconify-icons/mdi/text-box-outline";
import appDriveIcon from "@iconify-icons/mdi/folder-open";
import controlHubIcon from "@iconify-icons/mdi/nut";
import editConfigIcon from "@iconify-icons/mdi/pencil";

const APP_DRIVE_TTL = 30000;

interface QuickActionOptions {
  parent?: DockerApp | null;
  controlHub?: boolean;
  editConfig?: boolean;
}

const appDriveContainers = ref<Set<string> | null>(null);
let appDriveFetchedAt = 0;
let appDriveRequest: Promise<void> | null = null;

function sanitizeContainerName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "").substring(0, 128);
}

export function useAppQuickActions() {
  const windowStore = useWindowStore();
  const csrfToken = useCsrfToken();
  const { t } = useI18n();

  function refreshAppDriveContainers() {
    if (appDriveRequest || Date.now() - appDriveFetchedAt < APP_DRIVE_TTL) return;

    appDriveRequest = axios
      .get("/api/appdrive/containers", { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } })
      .then((response) => {
        const containers: { name: string }[] = response.data?.containers || [];
        appDriveContainers.value = new Set(containers.map((container) => container.name));
      })
      .catch(() => {
        appDriveContainers.value = null;
      })
      .finally(() => {
        appDriveFetchedAt = Date.now();
        appDriveRequest = null;
      });
  }

  function openAppWindow(appId: string, suffix: string, app: DockerApp, parent?: DockerApp | null) {
    if (!parent) {
      windowStore.openUniqueWindow(appId, app.name, {
        title: `${app.display_name || app.name} - ${suffix}`,
        icon: app.image_path || undefined,
        data: { appName: app.name },
      });
      return;
    }

    const parentName = parent.display_name || parent.name;

    windowStore.openUniqueWindow(appId, app.name, {
      title: `${parentName} / ${app.name} - ${suffix}`,
      icon: parent.image_path || undefined,
      data: { appName: app.name, dependencyOf: parentName },
    });
  }

  function openAppDrive(app: DockerApp) {
    const container = sanitizeContainerName(app.name);
    if (!container) return;

    windowStore.openFileInApp("fileexplorer", {
      title: `File Explorer - ${app.display_name || app.name}`,
      data: { initialLocation: "appdrive", initialContainer: container, initialMountIndex: 0 },
    });
  }

  function openEditConfig(app: DockerApp) {
    windowStore.openUniqueWindow("edit", app.name, {
      title: `${app.display_name || app.name} - ${t("Edit Config")}`,
      data: { appName: app.name },
    });
  }

  function openInControlHub(app: DockerApp) {
    windowStore.openFileInApp("controlhub", { data: { selectedApp: app.name } });
  }

  function quickActionsFor(app: DockerApp, options: QuickActionOptions = {}): ContextMenuItem {
    refreshAppDriveContainers();

    const withoutAppDrive = appDriveContainers.value !== null && !appDriveContainers.value.has(app.name);
    const actions: ContextMenuAction[] = [
      { label: "Terminal", icon: terminalIcon, action: () => openAppWindow("terminal", t("Terminal"), app, options.parent) },
      { label: "Logs", icon: logsIcon, action: () => openAppWindow("logs", t("Logs"), app, options.parent) },
    ];

    if (options.controlHub !== false) {
      actions.push({ label: "Control Hub", icon: controlHubIcon, action: () => openInControlHub(app) });
    }

    if (options.editConfig) {
      actions.push({ label: "Edit Config", icon: editConfigIcon, action: () => openEditConfig(app), disabled: Boolean(options.parent) });
    }

    actions.push({ label: "App Drive", icon: appDriveIcon, action: () => openAppDrive(app), disabled: withoutAppDrive });

    return { actions };
  }

  return { quickActionsFor };
}
