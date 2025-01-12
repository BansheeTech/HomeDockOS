// homedock-ui/vue3/static/js/MountPoints/__dashboard__.ts

import { createApp } from "vue";
import { createHead } from '@vueuse/head';
import { createPinia } from "pinia";

import Dashboard from "../__Layouts__/Dashboard.vue";

interface ThemeData {
  selected_theme: string;
  selected_back: string;
}

interface CommonData {
  version: string;
}

interface SettingsData {
  user_name: string;
}

interface InitialData {
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

const initialData = parseBase64Data("data-initial") as InitialData | null;

const commonData = parseBase64Data("data-common") as CommonData | null;

const settingsData = parseBase64Data("data-settings") as SettingsData | null;

if (themeData && commonData && settingsData  && initialData) {
  try {
    const app = createApp(Dashboard);
    const pinia = createPinia();

    app.use(pinia);

    app.provide("data-theme", {
      selectedTheme: themeData.selected_theme,
      selectedBack: themeData.selected_back,
    });

    app.provide("data-common", {
      version: commonData.version,
    });

    app.provide("data-settings", {
      userName: settingsData.user_name,
    });

    app.provide("data-initial", {
      cpuTemp: initialData.cpu_temp,
      cpuGhz: initialData.get_cpu_max_speed,
      cpuUsage: initialData.cpu_usage,
      cpuCores: initialData.cpu_cores,
      ramUsage: initialData.ram_usage,
      totalRam: initialData.total_ram,
      hardDiskUsage: initialData.hard_disk_usage,
      hardDiskTotal: initialData.hard_disk_total,
      externalDefaultDisk: initialData.external_default_disk,
      externalDiskUsage: initialData.external_disk_usage,
      externalDiskTotal: initialData.external_disk_total,
      interfaceName: initialData.interface_name,
      downloadData: initialData.vdownload,
      uploadData: initialData.vupload,
      totalContainers: initialData.n_total_containers,
      activeContainers: initialData.n_active_containers,
      uptimeData: initialData.uptime_data,
      startTime: initialData.start_time,
    });

    const faviconHeadAdder = createHead();
    app.use(faviconHeadAdder);

    app.mount("#app-dashboard-root");
  } catch (error) {
    console.error("Error initializing the Vue app:", error);
  }
} else {
  console.error("Required data (data-theme or data-initial) is missing or invalid.");
}
