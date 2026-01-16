// homedock-ui/vue3/static/js/__Config__/WindowDefaultDetails.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { defineAsyncComponent } from "vue";

import type { SystemApp } from "./WindowTypes";

import { UTILITIES_APPS } from "./UtilitiesDefaultDetails";
import { AUXILIARY_APPS } from "./AuxiliaryDefaultDetails";

import WindowLoading from "../__Components__/WindowLoading.vue";

export type { SystemApp };

const AppHome = defineAsyncComponent({
  loader: () => import("../__Apps__/AppHome.vue"),
  loadingComponent: WindowLoading,
  delay: 200,
});
const AppExplorer = defineAsyncComponent({
  loader: () => import("../__Apps__/AppExplorer.vue"),
  loadingComponent: WindowLoading,
  delay: 200,
});
const AppAppStore = defineAsyncComponent({
  loader: () => import("../__Apps__/AppAppStore.vue"),
  loadingComponent: WindowLoading,
  delay: 200,
});
const AppFileExplorer = defineAsyncComponent({
  loader: () => import("../__Apps__/AppFileExplorer.vue"),
  loadingComponent: WindowLoading,
  delay: 200,
});
const AppPackager = defineAsyncComponent({
  loader: () => import("../__Apps__/AppPackager.vue"),
  loadingComponent: WindowLoading,
  delay: 200,
});
const AppControlHub = defineAsyncComponent({
  loader: () => import("../__Apps__/AppControlHub.vue"),
  loadingComponent: WindowLoading,
  delay: 200,
});
const AppSystemLogs = defineAsyncComponent({
  loader: () => import("../__Apps__/AppSystemLogs.vue"),
  loadingComponent: WindowLoading,
  delay: 200,
});
const AppSettings = defineAsyncComponent({
  loader: () => import("../__Apps__/AppSettings.vue"),
  loadingComponent: WindowLoading,
  delay: 200,
});
const AppAbout = defineAsyncComponent({
  loader: () => import("../__Apps__/AppAbout.vue"),
  loadingComponent: WindowLoading,
  delay: 200,
});

import cloudIcon from "@iconify-icons/mdi/cloud";
import fileSearchIcon from "@iconify-icons/mdi/file-search";
import widgetsOutlineIcon from "@iconify-icons/mdi/widgets-outline";
import packageVariantIcon from "@iconify-icons/mdi/package-variant";
import nutIcon from "@iconify-icons/mdi/nut";
import chartTimelineVariantIcon from "@iconify-icons/mdi/chart-timeline-variant";
import tuneIcon from "@iconify-icons/mdi/tune";
import informationOutlineIcon from "@iconify-icons/mdi/cloud-question";
import folderMultipleIcon from "@iconify-icons/mdi/folder-multiple";

const MAIN_SYSTEM_APPS: SystemApp[] = [
  {
    id: "apphome",
    name: "My Home",
    description: "View system information and access applications",
    icon: cloudIcon,
    component: AppHome,
    defaultWidth: 1024,
    defaultHeight: 768,
    minWidth: 400,
    minHeight: 700,
    resizable: true,
    maximizable: true,
    minimizable: true,
    closeable: true,
    category: "system",
    showInStartMenu: true,
    showInExplorerApp: true,
    showInMyHomeApp: false,
  },
  {
    id: "explorer",
    name: "Explorer",
    description: "Search apps, files, and more",
    icon: fileSearchIcon,
    component: AppExplorer,
    defaultWidth: 1024,
    defaultHeight: 768,
    minWidth: 400,
    minHeight: 700,
    resizable: true,
    maximizable: true,
    minimizable: true,
    closeable: true,
    category: "tools",
    showInStartMenu: true,
    showInExplorerApp: true,
    showInMyHomeApp: true,
  },
  {
    id: "appstore",
    name: "App Store",
    description: "Browse and install Docker applications",
    icon: widgetsOutlineIcon,
    component: AppAppStore,
    defaultWidth: 1024,
    defaultHeight: 768,
    minWidth: 400,
    minHeight: 700,
    resizable: true,
    maximizable: true,
    minimizable: true,
    closeable: true,
    category: "system",
    showInStartMenu: true,
    showInExplorerApp: true,
    showInMyHomeApp: true,
  },
  {
    id: "fileexplorer",
    name: "File Explorer",
    description: "Manage your files, encrypted storage, and container volumes",
    icon: folderMultipleIcon,
    component: AppFileExplorer,
    defaultWidth: 1024,
    defaultHeight: 768,
    minWidth: 400,
    minHeight: 700,
    resizable: true,
    maximizable: true,
    minimizable: true,
    closeable: true,
    category: "system",
    showInStartMenu: true,
    showInExplorerApp: true,
    showInMyHomeApp: true,
  },
  {
    id: "packager",
    name: "Packager",
    description: "Export and import .hds application packages",
    icon: packageVariantIcon,
    component: AppPackager,
    defaultWidth: 1024,
    defaultHeight: 768,
    minWidth: 400,
    minHeight: 700,
    resizable: true,
    maximizable: true,
    minimizable: true,
    closeable: true,
    category: "tools",
    showInStartMenu: true,
    showInExplorerApp: true,
    showInMyHomeApp: true,
  },
  {
    id: "controlhub",
    name: "Control Hub",
    description: "Manage your Docker containers",
    icon: nutIcon,
    component: AppControlHub,
    defaultWidth: 1024,
    defaultHeight: 768,
    minWidth: 400,
    minHeight: 700,
    resizable: true,
    maximizable: true,
    minimizable: true,
    closeable: true,
    category: "system",
    showInStartMenu: true,
    showInExplorerApp: true,
    showInMyHomeApp: true,
  },
  {
    id: "systemlogs",
    name: "System Logs",
    description: "View system and application logs",
    icon: chartTimelineVariantIcon,
    component: AppSystemLogs,
    defaultWidth: 1024,
    defaultHeight: 768,
    minWidth: 400,
    minHeight: 700,
    resizable: true,
    maximizable: true,
    minimizable: true,
    closeable: true,
    category: "system",
    showInStartMenu: true,
    showInExplorerApp: true,
    showInMyHomeApp: true,
  },
  {
    id: "settings",
    name: "Settings",
    description: "Configure HomeDock OS",
    icon: tuneIcon,
    component: AppSettings,
    defaultWidth: 1024,
    defaultHeight: 768,
    minWidth: 400,
    minHeight: 700,
    resizable: true,
    maximizable: true,
    minimizable: true,
    closeable: true,
    category: "settings",
    showInStartMenu: true,
    showInExplorerApp: true,
    showInMyHomeApp: true,
  },
  {
    id: "about",
    name: "About",
    description: "View version, license, and system information",
    icon: informationOutlineIcon,
    component: AppAbout,
    defaultWidth: 1024,
    defaultHeight: 768,
    minWidth: 400,
    minHeight: 700,
    resizable: true,
    maximizable: true,
    minimizable: true,
    closeable: true,
    category: "system",
    showInStartMenu: true,
    showInExplorerApp: true,
    showInMyHomeApp: true,
  },
];

export const SYSTEM_APPS: SystemApp[] = [...MAIN_SYSTEM_APPS, ...AUXILIARY_APPS, ...UTILITIES_APPS];

export function getAppById(appId: string): SystemApp | undefined {
  return SYSTEM_APPS.find((app) => app.id === appId);
}

export function getAllApps(): SystemApp[] {
  return SYSTEM_APPS;
}

export function getAppsByCategory(category: SystemApp["category"]): SystemApp[] {
  return SYSTEM_APPS.filter((app) => app.category === category);
}

export function searchApps(query: string): SystemApp[] {
  const lowerQuery = query.toLowerCase();
  return SYSTEM_APPS.filter((app) => app.name.toLowerCase().includes(lowerQuery) || app.description.toLowerCase().includes(lowerQuery));
}

export function appExists(appId: string): boolean {
  return SYSTEM_APPS.some((app) => app.id === appId);
}

export function getStandaloneApps(): SystemApp[] {
  return SYSTEM_APPS.filter((app) => app.showInMyHomeApp !== false);
}

export function getExplorerApps(): SystemApp[] {
  return SYSTEM_APPS.filter((app) => app.showInExplorerApp !== false);
}

export function getStartMenuApps(): SystemApp[] {
  return SYSTEM_APPS.filter((app) => app.showInStartMenu !== false);
}
