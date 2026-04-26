<!-- homedock-ui/vue3/static/js/__Layouts__/App.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Favicon />
  <AeroPlusWallpaper />
  <ScrollBarThemeLoader />
  <TopComment />
  <StaticOscillatingLines :numLines="12" :amplitude="600" :lineWidth="3" :points-per-line="4" :isSuccess="isSuccess" :isError="isError" :isChecking="isChecking" />

  <div :class="[themeClasses.back]" class="flex flex-col items-center justify-center relative p-3 overflow-hidden">
    <div class="flex items-center justify-center text-white">
      <OrbitLoader :isChecking="isChecking" :isSuccess="isSuccess" :isError="isError" :isHttps="isHttps" />
    </div>

    <Transition name="fade-slide" appear>
      <div v-if="appDisplayName" :class="[themeClasses.appStatusPill]" class="flex items-center gap-2.5 z-10 mt-1 px-5 py-1.5 rounded-full backdrop-blur-xl border">
        <Transition name="icon-slide">
          <BaseImage v-if="appIconReady" :src="appIconSrc" :alt="appDisplayName" class="w-7 h-7 rounded-full shadow-sm" draggable="false" />
        </Transition>
        <span class="text-lg font-semibold tracking-tight">{{ appDisplayName }}</span>
      </div>
    </Transition>

    <div class="flex items-center mt-4 z-10 space-x-1.5">
      <template v-for="(step, index) in steps" :key="index">
        <div class="flex items-center space-x-1.5">
          <div class="w-1.5 h-1.5 rounded-full transition-all duration-700 ease-out" :class="stepDotClass(index)" />
          <span class="text-[11px] font-medium transition-all duration-500 ease-out" :class="stepLabelClass(index)">
            {{ step }}
          </span>
        </div>
        <div v-if="index < steps.length - 1" class="w-5 h-px mx-1 transition-all duration-500" :class="stepLineClass(index)" />
      </template>
    </div>

    <div class="flex flex-col items-center mt-4 z-[60] space-y-2">
      <Transition name="fade-slide" mode="out-in">
        <p v-if="statusPillText" :class="[themeClasses.appStatusPill]" class="flex items-center text-xs text-center px-4 py-1.5 rounded-full backdrop-blur-xl border">
          <Icon v-if="isChecking" :icon="loadingIcon" class="text-xs mr-1.5 animate-spin" />
          <Icon v-if="isError" :icon="linkVariantOff" class="text-xs mr-1.5" />
          <Icon v-if="isSuccess" :icon="checkBoldIcon" class="text-xs mr-1.5" />
          <span>{{ statusPillText }}</span>
        </p>
      </Transition>

      <Transition name="fade-scale-up">
        <div v-if="isError" class="flex flex-col items-center space-y-2">
          <a target="_blank" href="https://docs.homedock.cloud/troubleshooting/app-not-available/" :class="[themeClasses.appDocsMessage]" class="flex items-center text-xs px-3 py-1 rounded-full transition duration-300">
            <Icon :icon="cursorDefaultClickIcon" class="text-xs mr-1" />
            <span>Why is this app not loading?</span>
          </a>
          <button @click="retryConnection" :class="[themeClasses.appDocsMessage]" class="flex items-center text-xs px-3 py-1 rounded-full transition duration-300 cursor-pointer">
            <Icon :icon="refreshIcon" class="text-xs mr-1" />
            <span>Try Again</span>
          </button>
        </div>
      </Transition>
    </div>
  </div>

  <StatusFooter :isSuccess="isSuccess" :isError="isError" :statusMessage="statusMessage" :port="String(port)" :appSlug="appSlug" />
</template>

<script setup lang="ts">
import { inject, onMounted, ref, computed } from "vue";
import axios from "axios";
import { useTheme } from "../__Themes__/ThemeSelector";

import type { PortData } from "../__Types__/PortData";

import { Icon } from "@iconify/vue";
import linkVariantOff from "@iconify-icons/mdi/link-variant-off";
import loadingIcon from "@iconify-icons/mdi/loading";
import checkBoldIcon from "@iconify-icons/mdi/check-bold";
import cursorDefaultClickIcon from "@iconify-icons/mdi/cursor-default-click";
import refreshIcon from "@iconify-icons/mdi/refresh";

import Favicon from "../__Components__/Favicon.vue";
import AeroPlusWallpaper from "../__Components__/AeroPlusWallpaper.vue";
import ScrollBarThemeLoader from "../__Components__/ScrollBarThemeLoader.vue";
import TopComment from "../__Components__/TopComment.vue";
import StaticOscillatingLines from "../__Components__/StaticOscillatingLines.vue";
import OrbitLoader from "../__Components__/OrbitLoader.vue";
import StatusFooter from "../__Components__/StatusFooter.vue";
import BaseImage from "../__Components__/BaseImage.vue";

const { themeClasses } = useTheme();

const csrfToken = ref<string>(document.querySelector('meta[name="homedock_csrf_token"]')?.getAttribute("content") || "");

const portData = inject<PortData | null>("data-port", null);

if (!portData) {
  throw new Error("Port data is missing!");
}

const { selected_port: port, selected_path: path, selected_app_slug: appSlug, selected_app_display_name: appDisplayName } = portData;

const isChecking = ref(true);
const isSuccess = ref(false);
const isError = ref(false);

const isHttps = ref(false);
const errorMessage = ref<string | null>(null);
const statusMessage = ref<string>("Initializing...");

const maxRetries = 10;
const retryCount = ref(0);

const appIconSrc = ref("");
const appIconReady = ref(false);

const resolveAppIcon = async (slug: string) => {
  const extensions = [".jpg", ".jpeg", ".png"];
  const prefixes = ["docker-icons/", "user-images/"];

  for (const prefix of prefixes) {
    for (const ext of extensions) {
      const path = `${prefix}${slug}${ext}`;
      try {
        const res = await fetch(`/images/${path}`, { method: "HEAD" });
        if (res.ok) {
          const fullUrl = `/images/${path}`;
          await new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => reject();
            img.src = fullUrl;
          });
          appIconSrc.value = path;
          appIconReady.value = true;
          return;
        }
      } catch {}
    }
  }
};

if (appSlug) resolveAppIcon(appSlug);

const steps = ["Connecting", "Verifying", "Launching"];

const animatedStep = ref(0);

const currentStep = computed(() => {
  if (isError.value) return -1;
  if (isSuccess.value) return animatedStep.value;
  if (retryCount.value > 0) return 1;
  return 0;
});

const statusPillText = computed(() => {
  if (isSuccess.value) return "Connection established";
  if (isError.value) return `App not available on port ${port}`;
  if (errorMessage.value) return errorMessage.value;
  return null;
});

const stepDotClass = (index: number) => {
  if (isError.value) {
    return index <= 1 ? themeClasses.value.appStepDotError : themeClasses.value.appStepDot;
  }
  if (index < currentStep.value) return themeClasses.value.appStepDotDone;
  if (index === currentStep.value) return [themeClasses.value.appStepDotActive, "scale-125 animate-pulse"];
  return themeClasses.value.appStepDot;
};

const stepLabelClass = (index: number) => {
  if (isError.value) {
    return index <= 1 ? themeClasses.value.appStepLabelActive : themeClasses.value.appStepLabel;
  }
  if (index <= currentStep.value) return themeClasses.value.appStepLabelActive;
  return themeClasses.value.appStepLabel;
};

const stepLineClass = (index: number) => {
  if (isError.value) return index === 0 ? "bg-red-400/50" : "bg-gray-300/20";
  if (index < currentStep.value) return "bg-green-400/50";
  return "bg-gray-300/20";
};

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
      },
    );

    if (response.data.available) {
      const appUrl = response.data.url.toLowerCase();
      isHttps.value = appUrl.startsWith("https://");

      isChecking.value = false;
      isSuccess.value = true;
      errorMessage.value = null;
      statusMessage.value = "Connection established";

      animatedStep.value = 1;
      setTimeout(() => {
        animatedStep.value = 2;
      }, 400);
      setTimeout(() => {
        animatedStep.value = 3;
      }, 800);

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
    retryCount.value++;
    errorMessage.value = `Retrying ${retryCount.value}/${maxRetries}`;
    statusMessage.value = `Retrying ${retryCount.value}/${maxRetries}`;

    if (retryCount.value < maxRetries) {
      setTimeout(checkAppAvailability, 2500);
    } else {
      isChecking.value = false;
      isError.value = true;
      errorMessage.value = `App not available on ${port}`;
      statusMessage.value = "Application unavailable";
    }
  }
};

const retryConnection = () => {
  retryCount.value = 0;
  animatedStep.value = 0;
  isChecking.value = true;
  isSuccess.value = false;
  isError.value = false;
  errorMessage.value = null;
  statusMessage.value = "Checking app availability...";
  checkAppAvailability();
};

onMounted(() => {
  checkAppAvailability();
});
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 1s ease,
    transform 1s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.fade-scale-up-enter-active {
  transition:
    opacity 0.5s cubic-bezier(0.25, 1, 0.5, 1),
    transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
}

.fade-scale-up-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.fade-scale-up-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(8px);
}

.fade-scale-up-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-4px);
}

.icon-slide-enter-active {
  transition:
    opacity 0.5s cubic-bezier(0.25, 1, 0.5, 1),
    transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
}

.icon-slide-enter-from {
  opacity: 0;
  transform: translateX(-12px) scale(0.85);
}
</style>
