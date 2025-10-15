// homedock-ui/vue3/static/js/MountPoints/__desktop__.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { createApp, reactive } from "vue";
import { createHead } from "@vueuse/head";
import { createPinia } from "pinia";
import router from "../__Router__/index";

import Desktop from "../__Layouts__/Desktop.vue";
import { setCsrfTokenGetter } from "../__Services__/DockerAPIFetchContainerData";

interface ThemeData {
  selected_theme: string;
  selected_back: string;
}

interface CommonData {
  version: string;
}

interface SettingsData {
  user_name: string;
  run_port: number;
  dynamic_dns: string;
  local_dns: boolean;
  run_on_development: boolean;
  disable_usage_data: boolean;
  delete_old_image_containers_after_update: boolean;
  delete_old_image_containers_after_uninstall: boolean;
  delete_internal_data_volumes: boolean;
  default_external_drive: string;
}

interface DashboardData {
  cpu_temp: string;
  get_cpu_max_speed: string;
  cpu_usage: string;
  cpu_cores: string;
  ram_usage: string;
  total_ram: string;
  hard_disk_usage: string;
  hard_disk_total: string;
  external_default_disk: string;
  external_disk_usage: string;
  external_disk_total: string;
  interface_name: string;
  vdownload: string;
  vupload: string;
  n_total_containers: string;
  n_active_containers: string;
  uptime_data: string;
  start_time: string;
}

function parseBase64Data(id: string): any {
  const element = document.getElementById(id)?.textContent;
  if (element) {
    try {
      const jsonData = atob(element);
      return JSON.parse(jsonData);
    } catch (error) {
      console.error(`Error parsing data from element #${id}:`, error);
    }
  } else {
    console.error(`Element with ID '${id}' not found or is empty.`);
  }
  return null;
}

const themeData = parseBase64Data("data-theme") as ThemeData | null;
const commonData = parseBase64Data("data-common") as CommonData | null;
const settingsData = parseBase64Data("data-settings") as SettingsData | null;
const dashboardData = parseBase64Data("data-dashboard") as DashboardData | null;

if (themeData && commonData && settingsData && dashboardData) {
  try {
    const app = createApp(Desktop);

    const pinia = createPinia();
    app.use(pinia);

    app.use(router);

    const faviconHeadAdder = createHead();
    app.use(faviconHeadAdder);

    const reactiveTheme = reactive({
      selectedTheme: themeData.selected_theme,
      selectedBack: themeData.selected_back,
    });
    app.provide("data-theme", reactiveTheme);

    const updateTheme = (newTheme: { selectedTheme?: string; selectedBack?: string }) => {
      if (newTheme.selectedTheme !== undefined) {
        reactiveTheme.selectedTheme = newTheme.selectedTheme;
      }
      if (newTheme.selectedBack !== undefined) {
        reactiveTheme.selectedBack = newTheme.selectedBack;
      }
    };
    app.provide("update-theme", updateTheme);

    app.provide("data-common", {
      version: commonData.version,
    });

    app.provide("data-settings", {
      userName: settingsData.user_name,
      runPort: settingsData.run_port,
      dynamicDNS: settingsData.dynamic_dns,
      localDNS: settingsData.local_dns,
      runOnDev: settingsData.run_on_development,
      disableUsageData: settingsData.disable_usage_data,
      deleteImageOnUpdate: settingsData.delete_old_image_containers_after_update,
      deleteImageOnUninstall: settingsData.delete_old_image_containers_after_uninstall,
      deleteInternalDataVolumes: settingsData.delete_internal_data_volumes,
      defaultExternalDrive: settingsData.default_external_drive,
      validDrives: [],
    });

    app.provide("data-dashboard", {
      cpuTemp: dashboardData.cpu_temp,
      cpuGhz: dashboardData.get_cpu_max_speed,
      cpuUsage: dashboardData.cpu_usage,
      cpuCores: dashboardData.cpu_cores,
      ramUsage: dashboardData.ram_usage,
      totalRam: dashboardData.total_ram,
      hardDiskUsage: dashboardData.hard_disk_usage,
      hardDiskTotal: dashboardData.hard_disk_total,
      externalDefaultDisk: dashboardData.external_default_disk,
      externalDiskUsage: dashboardData.external_disk_usage,
      externalDiskTotal: dashboardData.external_disk_total,
      interfaceName: dashboardData.interface_name,
      downloadData: dashboardData.vdownload,
      uploadData: dashboardData.vupload,
      totalContainers: dashboardData.n_total_containers,
      activeContainers: dashboardData.n_active_containers,
      uptimeData: dashboardData.uptime_data,
      startTime: dashboardData.start_time,
    });

    const csrfToken = document.querySelector('meta[name="homedock_csrf_token"]')?.getAttribute("content") || "";
    const reactiveCsrfToken = reactive({
      value: csrfToken,
    });
    app.provide("csrf-token", reactiveCsrfToken);

    const updateCsrfToken = (newToken: string) => {
      reactiveCsrfToken.value = newToken;
    };
    app.provide("update-csrf-token", updateCsrfToken);

    setCsrfTokenGetter(() => reactiveCsrfToken.value);

    app.mount("#app-desktop-root");

    console.log("▫️ HomeDock OS Prism Window Manager Loaded");
  } catch (error) {
    console.error("❌ Error initializing HomeDock OS Prism Window Manager:", error);
  }
} else {
  console.error("❌ Required data is missing or invalid. Cannot initialize Prism Window Manager.");
  console.error({
    themeData: !!themeData,
    commonData: !!commonData,
    settingsData: !!settingsData,
    dashboardData: !!dashboardData,
  });
}
