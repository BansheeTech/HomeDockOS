// homedock-ui/vue3/static/js/MountPoints/__app__.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { createApp } from "vue";
import { createHead } from "@unhead/vue/client";

import App from "../__Layouts__/App.vue";

interface ThemeData {
  selected_theme: string;
  selected_back: string;
}

interface PortData {
  selected_port: string;
  selected_path: string;
  selected_app_slug: string;
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

const portData = parseBase64Data("data-port") as PortData | null;

if (themeData && portData) {
  try {
    const app = createApp(App);

    app.provide("data-theme", {
      selectedTheme: themeData.selected_theme,
      selectedBack: themeData.selected_back,
    });

    app.provide("data-port", {
      selectedPort: portData.selected_port,
      selectedPath: portData.selected_path,
      appSlug: portData.selected_app_slug,
    });

    const faviconHeadAdder = createHead();
    app.use(faviconHeadAdder);

    app.mount("#app-app-root");
  } catch (error) {
    console.error("Error initializing the Vue app:", error);
  }
} else {
  console.error("Required data (data-theme or data-initial) is missing or invalid.");
}
