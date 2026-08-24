<!-- homedock-ui/vue3/static/js/__Layouts__/AppDenied.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Favicon />
  <AeroPlusWallpaper :blurred="isEmbedded" />
  <ScrollBarThemeLoader />
  <TopComment />
  <StaticOscillatingLines :numLines="10" :amplitude="15" :lineWidth="4" />

  <div :class="[themeClasses.back]" class="flex items-center justify-center min-h-screen login-wrapper relative p-3 overflow-hidden">
    <div class="w-full max-w-xl">
      <div :class="[themeClasses.form]" class="px-6 py-12 lg:px-12 rounded-3xl shadow-lg w-full relative z-10 overflow-hidden anim-pusher mb-2 animated-line">
        <div class="flex mb-2">
          <BaseImage src="/images/logo_trans.svg" alt="Logo" :class="[themeClasses.logo]" class="h-20 hd-top-form-logo animate-pulse" />
        </div>

        <h2 :class="[themeClasses.mainText]" class="text-xl font-normal mb-2 flex items-center">
          <Icon :icon="lockIcon" class="mr-2" width="20" height="20" />
          <span>{{ appDisplayName ? $t("{app} is not open from here", { app: appDisplayName }) : $t("This application is not open from here") }}</span>
        </h2>

        <p :class="[themeClasses.subText]" class="font-light mb-6 leading-relaxed">
          {{ $t("Applications live behind your HomeDock OS session, so their address on its own does not grant access. Open it from your desktop and it will load with the permissions it needs.") }}
        </p>

        <div>
          <p :class="[themeClasses.subText]" class="mt-4 text-xs">
            <a target="_blank" :class="[themeClasses.hyperLink]" class="flex items-center" href="https://docs.homedock.cloud/homedock-os/desktop/#on-screen-apps">
              <Icon :icon="openIcon" class="mr-1 text-current" width="14" height="14" />
              <span>{{ $t("Click here for more information.") }}</span>
            </a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import { Icon } from "@iconify/vue";
import lockIcon from "@iconify-icons/mdi/lock-outline";
import openIcon from "@iconify-icons/mdi/open-in-new";

import Favicon from "../__Components__/Favicon.vue";
import AeroPlusWallpaper from "../__Components__/AeroPlusWallpaper.vue";
import ScrollBarThemeLoader from "../__Components__/ScrollBarThemeLoader.vue";
import TopComment from "../__Components__/TopComment.vue";
import StaticOscillatingLines from "../__Components__/StaticOscillatingLines.vue";
import BaseImage from "../__Components__/BaseImage.vue";

const { themeClasses } = useTheme();

const isEmbedded = window.self !== window.top;

const appData = inject<{ app_display_name: string | null } | null>("data-app", null);
const appDisplayName = appData?.app_display_name || null;
</script>
