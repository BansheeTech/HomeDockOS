// homedock-ui/vue3/static/js/MountPoints/__desktop__.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { createApp, reactive } from "vue";
import { createHead } from "@unhead/vue/client";
import { createPinia } from "pinia";
import router from "../__Router__/index";

import Desktop from "../__Layouts__/Desktop.vue";
import { setCsrfTokenGetter } from "../__Services__/DockerAPIFetchContainerData";

import EnterpriseSRILoader from "../__Utils__/EnterpriseSRILoader";

import type { ThemeData } from "../__Types__/ThemeData";
import type { CommonData } from "../__Types__/CommonData";
import type { SettingsData } from "../__Types__/SettingsData";
import type { DashboardData } from "../__Types__/DashboardData";
import type { DiskData } from "../__Types__/DiskData";

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
const disksData = parseBase64Data("data-disks") as DiskData[] | null;

if (themeData && commonData && settingsData && dashboardData && disksData) {
  const csrfToken = document.querySelector('meta[name="homedock_csrf_token"]')?.getAttribute("content") || "";

  const app = createApp(Desktop);

  const pinia = createPinia();
  app.use(pinia);

  app.use(router);

  const faviconHeadAdder = createHead();
  app.use(faviconHeadAdder);

  const reactiveTheme = reactive({ ...themeData });
  app.provide("data-theme", reactiveTheme);

  const updateTheme = (newTheme: Partial<ThemeData>) => {
    Object.assign(reactiveTheme, newTheme);
  };
  app.provide("update-theme", updateTheme);

  app.provide("data-common", commonData);

  const reactiveSettings = reactive({ ...settingsData });
  app.provide("data-settings", reactiveSettings);

  const updateSettings = (newSettings: Partial<SettingsData>) => {
    Object.assign(reactiveSettings, newSettings);
  };
  app.provide("update-settings", updateSettings);

  app.provide("data-dashboard", dashboardData);
  app.provide("data-disks", disksData);

  const reactiveCsrfToken = reactive({
    value: csrfToken,
  });
  app.provide("csrf-token", reactiveCsrfToken);

  const updateCsrfToken = (newToken: string) => {
    reactiveCsrfToken.value = newToken;
  };
  app.provide("update-csrf-token", updateCsrfToken);

  setCsrfTokenGetter(() => reactiveCsrfToken.value);

  if (commonData.enterprise_available) {
    EnterpriseSRILoader.init({
      csrfToken: reactiveCsrfToken,
      theme: reactiveTheme,
      updateTheme: updateTheme,
    });
  }

  app.mount("#app-desktop-root");
} else {
  console.error("Required data is missing or invalid. Cannot initialize Prism Window Manager.");
  console.error({
    themeData: !!themeData,
    commonData: !!commonData,
    settingsData: !!settingsData,
    dashboardData: !!dashboardData,
    disksData: !!disksData,
  });
}
