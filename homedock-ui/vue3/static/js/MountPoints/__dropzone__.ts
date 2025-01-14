// homedock-ui/vue3/static/js/MountPoints/__dropzone__.ts

import { createApp } from "vue";
import { createHead } from "@vueuse/head";
import { createPinia } from "pinia";

import Dropzone from "../__Layouts__/Dropzone.vue";

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
    const app = createApp(Dropzone);
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

    const faviconHeadAdder = createHead();
    app.use(faviconHeadAdder);

    app.mount("#app-dropzone-root");
  } catch (error) {
    console.error("Error initializing the Vue app:", error);
  }
} else {
  console.error("Required data (data-theme or data-initial) is missing or invalid.");
}