<!-- homedock-ui/vue3/static/js/__Layouts__/App.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template>
  <Favicon />
  <AeroPlusWallpaper />
  <ScrollBarThemeLoader />
  <TopComment />
  <NetworkOffline />
  <StaticOscillatingLines :numLines="9" :line-width="2" :amplitude="500" :points-per-line="3" />
  <div :class="[themeClasses.back]" class="flex items-center justify-center relative p-3 overflow-hidden">
    <div class="flex items-center justify-cente text-white">
      <OrbitLoader :isChecking="isChecking" :isSuccess="isSuccess" :isError="isError" :isHttps="isHttps" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { inject, onMounted, ref } from "vue";

import axios from "axios";

import { useTheme } from "../__Themes__/ThemeSelector";

import Favicon from "../__Components__/Favicon.vue";
import AeroPlusWallpaper from "../__Components__/AeroPlusWallpaper.vue";
import ScrollBarThemeLoader from "../__Components__/ScrollBarThemeLoader.vue";
import TopComment from "../__Components__/TopComment.vue";
import StaticOscillatingLines from "../__Components__/StaticOscillatingLines.vue";
import NetworkOffline from "../__Components__/NetworkOffline.vue";
import OrbitLoader from "../__Components__/OrbitLoader.vue";

const { themeClasses } = useTheme();

const csrfToken = ref<string>(document.querySelector('meta[name="homedock_csrf_token"]')?.getAttribute("content") || "");

const portData = inject<{
  selectedPort: string;
  selectedPath: string;
}>("data-port");

if (!portData) {
  throw new Error("Settings data is missing!");
}

const { selectedPort: port, selectedPath: path } = portData;

const isChecking = ref(true);
const isSuccess = ref(false);
const isError = ref(false);
const isHttps = ref(false);

const checkAppAvailability = async () => {
  if (!port) {
    isChecking.value = false;
    isError.value = true;
    return;
  }

  try {
    const response = await axios.post(
      "/api/check-port",
      { port },
      {
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      }
    );

    if (response.data.available) {
      const appUrl = response.data.url.toLowerCase();
      isHttps.value = appUrl.startsWith("https://");

      isChecking.value = false;
      isSuccess.value = true;
      setTimeout(() => {
        const finalUrl = response.data.url + (path ? `/${path}` : "");
        const newWindow = window.open(finalUrl, "_self");
        if (newWindow) {
          newWindow.opener = null;
        }
      }, 1500);
      return;
    }
  } catch (error) {
    isChecking.value = false;
    isError.value = true;
  }
};

onMounted(() => {
  checkAppAvailability();
});
</script>

<style scoped></style>
