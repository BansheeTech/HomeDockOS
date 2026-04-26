// homedock-ui/vue3/static/js/MountPoints/__app__.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { createApp } from "vue";
import { createHead } from "@unhead/vue/client";

import App from "../__Layouts__/App.vue";

import type { ThemeData } from "../__Types__/ThemeData";
import type { PortData } from "../__Types__/PortData";

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
  const app = createApp(App);

  app.provide("data-theme", themeData);
  app.provide("data-port", portData);

  const faviconHeadAdder = createHead();
  app.use(faviconHeadAdder);

  app.mount("#app-app-root");
} else {
  console.error("Required data is missing or invalid. Cannot initialize App.");
}
