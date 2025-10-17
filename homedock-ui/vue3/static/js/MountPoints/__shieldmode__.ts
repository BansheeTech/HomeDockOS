// homedock-ui/vue3/static/js/MountPoints/__shieldmode__.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { createApp } from "vue";
import { createHead } from "@unhead/vue/client";

import Limited from "../__Layouts__/ShieldMode.vue";

interface ThemeData {
  selected_theme: string;
  selected_back: string;
}

const base64Data = document.getElementById("data-theme")?.textContent;

if (base64Data) {
  const jsonData = atob(base64Data);

  let themeData: ThemeData;

  try {
    themeData = JSON.parse(jsonData) as ThemeData;

    const app = createApp(Limited);

    app.provide("data-theme", {
      selectedTheme: themeData.selected_theme,
      selectedBack: themeData.selected_back,
    });

    const faviconHeadAdder = createHead();
    app.use(faviconHeadAdder);

    app.mount("#app-shieldmode-root");
  } catch (error) {
    console.error("Error parsing data-theme objects:", error);
  }
} else {
  console.error("The element 'data-theme' wasn't found or it's empty.");
}
