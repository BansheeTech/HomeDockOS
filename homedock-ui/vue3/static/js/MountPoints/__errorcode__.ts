// homedock-ui/vue3/static/js/MountPoints/__errorcode__.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { createApp } from "vue";
import { createHead } from "@unhead/vue/client";

import ErrorCode from "../__Layouts__/ErrorCode.vue";

import type { ThemeData } from "../__Types__/ThemeData";
import type { ErrorData } from "../__Types__/ErrorData";

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
const errorData = parseBase64Data("data-error") as ErrorData | null;

if (themeData && errorData) {
  const app = createApp(ErrorCode);

  app.provide("data-theme", themeData);
  app.provide("data-error", errorData);

  const faviconHeadAdder = createHead();
  app.use(faviconHeadAdder);

  app.mount("#app-errorcode-root");
} else {
  console.error("Required data is missing or invalid. Cannot initialize ErrorCode.");
}
