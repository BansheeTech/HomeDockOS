<!-- homedock-ui/vue3/static/js/__Layouts__/App.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template>
  <Favicon />
  <AeroPlusWallpaper />
  <ScrollBarThemeLoader />
  <TopComment />
  <NetworkOffline />
  <StaticOscillatingLines :numLines="12" :line-width="3" :amplitude="600" :points-per-line="2" />

  <div :class="[themeClasses.back]" class="flex flex-col items-center justify-center relative p-3 overflow-hidden">
    <div class="flex items-center justify-center text-white">
      <OrbitLoader :isChecking="isChecking" :isSuccess="isSuccess" :isError="isError" :isHttps="isHttps" />
    </div>

    <Transition name="fade-slide" mode="out-in">
      <p v-if="errorMessage" :class="[themeClasses.appErrorMessage]" class="flex items-center text-xs mt-4 text-center px-3 py-1 rounded-full z-10">
        <Icon v-if="isChecking" :icon="loadingIcon" class="text-xs mr-1 animate-spin" />
        <Icon v-if="isError" :icon="linkVariantOff" class="text-xs mr-1" />
        <span>{{ errorMessage }}</span>
      </p>
    </Transition>

    <Transition name="fade-slide" mode="out-in">
      <template v-if="isError">
        <a target="_blank" v-if="isError" href="https://docs.homedock.cloud/troubleshooting/app-not-available/" :class="[themeClasses.appDocsMessage]" class="flex items-center text-xs mt-2 text-center px-3 py-1 rounded-full z-50 transition duration-300" style="position: relative; pointer-events: auto">
          <Icon :icon="cursorDefaultClickIcon" class="text-xs mr-1" />
          <span>Why is this app not loading?</span>
        </a>
      </template>
    </Transition>
  </div>

  <StatusFooter :isSuccess="isSuccess" :isError="isError" :statusMessage="statusMessage" :port="String(port)" />
</template>

<script setup lang="ts">
import { inject, onMounted, ref, computed } from "vue";
import axios from "axios";
import { useTheme } from "../__Themes__/ThemeSelector";

import { Icon } from "@iconify/vue";
import linkVariantOff from "@iconify-icons/mdi/link-variant-off";
import loadingIcon from "@iconify-icons/mdi/loading";
import cursorDefaultClickIcon from "@iconify-icons/mdi/cursor-default-click";

import Favicon from "../__Components__/Favicon.vue";
import AeroPlusWallpaper from "../__Components__/AeroPlusWallpaper.vue";
import ScrollBarThemeLoader from "../__Components__/ScrollBarThemeLoader.vue";
import TopComment from "../__Components__/TopComment.vue";
import StaticOscillatingLines from "../__Components__/StaticOscillatingLines.vue";
import NetworkOffline from "../__Components__/NetworkOffline.vue";
import OrbitLoader from "../__Components__/OrbitLoader.vue";
import StatusFooter from "../__Components__/StatusFooter.vue";

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
const errorMessage = ref<string | null>(null);
const statusMessage = ref<string>("Initializing...");

const maxRetries = 10;
let retryCount = 0;

const checkAppAvailability = async () => {
  if (!port) {
    isChecking.value = false;
    isError.value = true;
    errorMessage.value = "Not valid port specified";
    statusMessage.value = "Invalid app port";
    return;
  }

  statusMessage.value = "Checking app availability...";

  try {
    const response = await axios.post(
      "/api/check-port",
      { port: port, subpath: path }, 
      {
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      }
    );

    if (response.data.available) {
      const appUrl = response.data.url.toLowerCase();
      isHttps.value = appUrl.startsWith("https://");

      isChecking.value = false;
      isSuccess.value = true;
      errorMessage.value = null;
      statusMessage.value = "Connection established";
      setTimeout(() => {
        const finalUrl = response.data.url + (path ? `/${path}` : "");
        const newWindow = window.open(finalUrl, "_self");
        if (newWindow) {
          newWindow.opener = null;
        }
      }, 1500);
      return;
    } else {
      throw new Error("Service not available.");
    }
  } catch (error) {
    retryCount++;
    errorMessage.value = `Retrying ${retryCount}/${maxRetries}`;
    statusMessage.value = `Retrying ${retryCount}/${maxRetries}`;

    if (retryCount < maxRetries) {
      setTimeout(checkAppAvailability, 2500);
    } else {
      isChecking.value = false;
      isError.value = true;
      errorMessage.value = `App not available on ${port}`;
      statusMessage.value = "Application unavailable";
    }
  }
};

onMounted(() => {
  checkAppAvailability();
});
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 1s ease, transform 1s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
