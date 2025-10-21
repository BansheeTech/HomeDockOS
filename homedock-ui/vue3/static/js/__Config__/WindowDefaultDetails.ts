// homedock-ui/vue3/static/js/__Config__/WindowDefaultDetails.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { Component, defineAsyncComponent } from "vue";

export interface SystemApp {
  id: string;
  name: string;
  description: string;
  icon: any;
  component: Component;
  defaultWidth: number;
  defaultHeight: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  resizable: boolean;
  maximizable: boolean;
  minimizable: boolean;
  closeable: boolean;
  category: "system" | "tools" | "settings" | "media";
  showInStartMenu?: boolean;
  showInExplorerApp?: boolean;
  showInMyHomeApp?: boolean;
}

const AppAppStore = defineAsyncComponent(() => import("../__Apps__/AppAppStore.vue"));
const AppControlHub = defineAsyncComponent(() => import("../__Apps__/AppControlHub.vue"));
const AppSettings = defineAsyncComponent(() => import("../__Apps__/AppSettings.vue"));
const AppDropzone = defineAsyncComponent(() => import("../__Apps__/AppDropzone.vue"));
const AppExplorer = defineAsyncComponent(() => import("../__Apps__/AppExplorer.vue"));
const AppSystemLogs = defineAsyncComponent(() => import("../__Apps__/AppSystemLogs.vue"));
const AppProperties = defineAsyncComponent(() => import("../__Apps__/AppProperties.vue"));
const AppLogs = defineAsyncComponent(() => import("../__Apps__/AppLogs.vue"));
const AppEdit = defineAsyncComponent(() => import("../__Apps__/AppEdit.vue"));
const AppInstallConfig = defineAsyncComponent(() => import("../__Apps__/AppInstallConfig.vue"));
const AppFolder = defineAsyncComponent(() => import("../__Apps__/AppFolder.vue"));
const AppAbout = defineAsyncComponent(() => import("../__Apps__/AppAbout.vue"));
const AppPackager = defineAsyncComponent(() => import("../__Apps__/AppPackager.vue"));
const AppHome = defineAsyncComponent(() => import("../__Apps__/AppHome.vue"));

import widgetsOutlineIcon from "@iconify-icons/mdi/widgets-outline"; // App Store
import nutIcon from "@iconify-icons/mdi/nut"; // Control Hub
import tuneIcon from "@iconify-icons/mdi/tune"; // Settings
import cubeIcon from "@iconify-icons/mdi/cube"; // Drop Zone
import fileSearchIcon from "@iconify-icons/mdi/file-search"; // Explorer
import chartTimelineVariantIcon from "@iconify-icons/mdi/chart-timeline-variant"; // System Logs
import propertiesIcon from "@iconify-icons/mdi/information-outline"; // Properties
import scriptTextIcon from "@iconify-icons/mdi/script-text"; // Container Logs
import codeBracesIcon from "@iconify-icons/mdi/code-braces"; // Edit Config
import downloadIcon from "@iconify-icons/mdi/download"; // Install Config
import folderOpenIcon from "@iconify-icons/mdi/folder-open"; // Folder View
import informationOutlineIcon from "@iconify-icons/mdi/cloud-question"; // About
import packageVariantIcon from "@iconify-icons/mdi/package-variant"; // App Packager
import cloudIcon from "@iconify-icons/mdi/cloud"; // App Home

// The Registry System Apps
export const SYSTEM_APPS: SystemApp[] = [
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
    id: "dropzone",
    name: "Drop Zone",
    description: "Upload and manage files",
    icon: cubeIcon,
    component: AppDropzone,
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
    id: "logs",
    name: "Container Logs",
    description: "View container logs in real-time",
    icon: scriptTextIcon,
    component: AppLogs,
    defaultWidth: 1024,
    defaultHeight: 768,
    minWidth: 400,
    minHeight: 700,
    resizable: true,
    maximizable: true,
    minimizable: true,
    closeable: true,
    category: "tools",
    showInStartMenu: false,
    showInExplorerApp: false,
    showInMyHomeApp: false,
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
    id: "properties",
    name: "Properties",
    description: "View and manage application properties",
    icon: propertiesIcon,
    component: AppProperties,
    defaultWidth: 400,
    defaultHeight: 700,
    minWidth: 400,
    minHeight: 700,
    resizable: false,
    maximizable: false,
    minimizable: true,
    closeable: true,
    category: "tools",
    showInStartMenu: false,
    showInExplorerApp: false,
    showInMyHomeApp: false,
  },
  {
    id: "edit",
    name: "Edit Configuration",
    description: "Edit docker-compose configuration",
    icon: codeBracesIcon,
    component: AppEdit,
    defaultWidth: 1024,
    defaultHeight: 768,
    minWidth: 400,
    minHeight: 700,
    resizable: true,
    maximizable: true,
    minimizable: true,
    closeable: true,
    category: "tools",
    showInStartMenu: false,
    showInExplorerApp: false,
    showInMyHomeApp: false,
  },
  {
    id: "installconfig",
    name: "Install Application",
    description: "Configure and install application",
    icon: downloadIcon,
    component: AppInstallConfig,
    defaultWidth: 1024,
    defaultHeight: 768,
    minWidth: 400,
    minHeight: 700,
    resizable: true,
    maximizable: true,
    minimizable: true,
    closeable: true,
    category: "tools",
    showInStartMenu: false,
    showInExplorerApp: false,
    showInMyHomeApp: false,
  },
  {
    id: "folder-view",
    name: "Folder",
    description: "View and manage folder contents",
    icon: folderOpenIcon,
    component: AppFolder,
    defaultWidth: 1024,
    defaultHeight: 768,
    minWidth: 400,
    minHeight: 700,
    resizable: true,
    maximizable: true,
    minimizable: true,
    closeable: true,
    category: "tools",
    showInStartMenu: false,
    showInExplorerApp: false,
    showInMyHomeApp: false,
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
