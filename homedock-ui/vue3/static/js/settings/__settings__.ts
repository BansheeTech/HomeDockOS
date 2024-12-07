// src/static/js/dashboard/__dashboard__.ts

import { createApp } from "vue";
import { createPinia } from "pinia";

import Dashboard from "../__Layouts__/Settings.vue";

interface ThemeData {
  selected_theme: string;
  selected_back: string;
  run_port: string;
}

interface CommonData {
  version: string;
}

interface SettingsData {
  user_name: string;
  run_port: string;
  dynamic_dns: string;
  local_dns: string;
  run_on_development: string;
  delete_old_image_containers_after_update: string;
  delete_old_image_containers_after_uninstall: string;
  default_external_drive: string;
  valid_drives: string;
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

if (themeData && commonData && settingsData) {
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
      runPort: settingsData.run_port,
      dynamicDNS: settingsData.dynamic_dns,
      localDNS: settingsData.local_dns,
      runOnDev: settingsData.run_on_development,
      deleteImageOnUpdate: settingsData.delete_old_image_containers_after_update,
      deleteImageOnUninstall: settingsData.delete_old_image_containers_after_uninstall,
      defaultExternalDrive: settingsData.default_external_drive,
      validDrives: settingsData.valid_drives,
    });

    app.mount("#app-settings-root");
  } catch (error) {
    console.error("Error initializing the Vue app:", error);
  }
} else {
  console.error("Required data (data-theme or data-initial) is missing or invalid.");
}
