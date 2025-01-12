<!-- homedock-ui/vue3/static/js/__Layouts__/ErrorCode.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template>
  <Favicon />
  <AeroPlusWallpaper />
  <ScrollBarThemeLoader />
  <TopComment />
  <NetworkOffline />
  <StaticOscillatingLines />
  <div :class="[themeClasses.back]" class="flex items-center justify-center min-h-screen login-wrapper relative p-3 overflow-hidden">
    <div class="w-full max-w-xl">
      <div :class="[themeClasses.form]" class="px-6 py-12 lg:px-12 rounded-3xl shadow-lg w-full relative z-10 overflow-hidden container-scroller mb-2 animated-line">
        <div class="flex mb-2">
          <BaseImage src="/images/logo_trans.svg" alt="Logo" :class="[themeClasses.logo]" class="h-20 hd-top-form-logo animate-pulse" />
        </div>
        <h2 :class="[themeClasses.mainText]" class="text-xl font-normal mb-2 flex items-center">
          <AnimatedIcon :icons="[_anim_confused, _anim_happy, _anim_normal, _anim_angry, _anim_dead]" :interval="1000" :iconSize="20" containerClass="mr-2" />
          <span>Error HDOS-{{ errorData.errorCode }}</span>
        </h2>
        <p :class="[themeClasses.errorMessage]" class="font-light mb-6 leading-3">{{ errorData.errorMessage }}</p>

        <a href="/">
          <Button id="main_button_login" type="primary" htmlType="submit" class="w-full flex items-center justify-center h-14 mt-8 relative overflow-hidden border-0 disabled:bg-blue-400 disabled:cursor-pointer disabled:text-white">
            <div class="flex items-center justify-center">
              <Icon :icon="backIcon" class="text-white" width="16" height="16" />
              <span class="ml-1">Go Back</span>
            </div>
          </Button>
        </a>

        <div>
          <p :class="[themeClasses.subText]" class="mt-4 text-xs">
            <a target="_blank" :class="[themeClasses.hyperLink]" class="flex items-center" :href="errorData && errorData.errorCode ? `https://docs.homedock.cloud/troubleshooting/error-codes/#hdos-${errorData.errorCode}` : 'https://docs.homedock.cloud'">
              <Icon :icon="openIcon" class="mr-1 text-current" width="14" height="14" />
              <span>
                Click here for more information
                <template v-if="errorData && errorData.errorCode"> about HDOS-{{ errorData.errorCode }}. </template>
                <template v-else> . </template>
              </span>
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
import backIcon from "@iconify-icons/mdi/arrow-left-circle";
import openIcon from "@iconify-icons/mdi/open-in-new";
import _anim_confused from "@iconify-icons/mdi/robot-confused";
import _anim_happy from "@iconify-icons/mdi/robot-happy";
import _anim_angry from "@iconify-icons/mdi/robot-angry";
import _anim_dead from "@iconify-icons/mdi/robot-dead";
import _anim_normal from "@iconify-icons/mdi/robot";

import { Button } from "ant-design-vue";

import Favicon from "../__Components__/Favicon.vue";
import AeroPlusWallpaper from "../__Components__/AeroPlusWallpaper.vue";
import ScrollBarThemeLoader from "../__Components__/ScrollBarThemeLoader.vue";
import AnimatedIcon from "../__Components__/AnimatedIcon.vue";
import TopComment from "../__Components__/TopComment.vue";
import BaseImage from "../__Components__/BaseImage.vue";
import StaticOscillatingLines from "../__Components__/StaticOscillatingLines.vue";
import NetworkOffline from "../__Components__/NetworkOffline.vue";

const errorData = inject<{ errorCode: string; errorMessage: string }>("data-error") || {
  errorCode: "000",
  errorMessage: "An unexpected error occurred.",
};

const { themeClasses } = useTheme();
</script>

<style scoped>
.animated-line::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, transparent 65%, rgba(255, 0, 0, 0.5));
  animation: flickerBreath 4s infinite;
  opacity: 1;
  pointer-events: none;
  z-index: -1;
}

@keyframes flickerBreath {
  0% {
    background-position: 0 0;
    opacity: 0;
  }
  25% {
    opacity: 0.1;
  }
  50% {
    background-position: 100% 100%;
    opacity: 1;
  }
  75% {
    opacity: 0.1;
  }
  100% {
    background-position: 0 0;
    opacity: 0;
  }
}
</style>
