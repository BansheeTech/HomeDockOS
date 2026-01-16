// homedock-ui/vue3/static/js/__Config__/AuxiliaryDefaultDetails.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { defineAsyncComponent } from "vue";
import WindowLoading from "../__Components__/WindowLoading.vue";
import type { SystemApp } from "./WindowTypes";

const AppLogs = defineAsyncComponent({
  loader: () => import("../__Apps__/AppLogs.vue"),
  loadingComponent: WindowLoading,
  delay: 200,
});
const AppProperties = defineAsyncComponent({
  loader: () => import("../__Apps__/AppProperties.vue"),
  loadingComponent: WindowLoading,
  delay: 200,
});
const AppEdit = defineAsyncComponent({
  loader: () => import("../__Apps__/AppEdit.vue"),
  loadingComponent: WindowLoading,
  delay: 200,
});
const AppInstallConfig = defineAsyncComponent({
  loader: () => import("../__Apps__/AppInstallConfig.vue"),
  loadingComponent: WindowLoading,
  delay: 200,
});
const AppFolder = defineAsyncComponent({
  loader: () => import("../__Apps__/AppFolder.vue"),
  loadingComponent: WindowLoading,
  delay: 200,
});
const AppEnterpriseWindow = defineAsyncComponent({
  loader: () => import("../__Apps__/AppEnterpriseWindow.vue"),
  loadingComponent: WindowLoading,
  delay: 200,
});
const AppFileProperties = defineAsyncComponent({
  loader: () => import("../__Apps__/AppFileProperties.vue"),
  loadingComponent: WindowLoading,
  delay: 200,
});

import scriptTextIcon from "@iconify-icons/mdi/script-text";
import propertiesIcon from "@iconify-icons/mdi/information-outline";
import codeBracesIcon from "@iconify-icons/mdi/code-braces";
import downloadIcon from "@iconify-icons/mdi/download";
import folderOpenIcon from "@iconify-icons/mdi/folder-open";
import shieldStarIcon from "@iconify-icons/mdi/shield-star";
import fileInformationIcon from "@iconify-icons/mdi/file-document-outline";

export const AUXILIARY_APPS: SystemApp[] = [
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
    id: "enterprise-window",
    name: "Enterprise",
    description: "Enterprise System App Window Placeholder",
    icon: shieldStarIcon,
    component: AppEnterpriseWindow,
    defaultWidth: 1024,
    defaultHeight: 768,
    minWidth: 400,
    minHeight: 700,
    resizable: true,
    maximizable: true,
    minimizable: true,
    closeable: true,
    category: "system",
    showInStartMenu: false,
    showInExplorerApp: false,
    showInMyHomeApp: false,
  },
  {
    id: "fileproperties",
    name: "File Properties",
    description: "View file and folder properties",
    icon: fileInformationIcon,
    component: AppFileProperties,
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
];
