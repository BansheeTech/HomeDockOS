<!-- src/static/js/__Layouts__/ShieldMode.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template>
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
          <AnimatedIcon :icons="[_anim1_bug, _anim2_alert, _anim3_search]" :interval="1000" :iconSize="20" containerClass="mr-2" />
          <span>Shield Mode Active</span>
        </h2>
        <p :class="[themeClasses.subText]" class="font-light mb-6 leading-3">Only <u>known hosts</u> will be able to sign in.</p>

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
            <a target="_blank" :class="[themeClasses.hyperLink]" class="flex items-center" href="https://docs.homedock.cloud/introduction/features/#shield-mode">
              <Icon :icon="openIcon" class="mr-1 text-current" width="14" height="14" />
              <span>Click here for more information.</span>
            </a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useTheme } from "../__Themes__/ThemeSelector";

import { Icon } from "@iconify/vue";
import backIcon from "@iconify-icons/mdi/arrow-left-circle";
import openIcon from "@iconify-icons/mdi/open-in-new";
import _anim1_bug from "@iconify-icons/mdi/shield-bug";
import _anim2_alert from "@iconify-icons/mdi/shield-alert";
import _anim3_search from "@iconify-icons/mdi/shield-search";

import { Button } from "ant-design-vue";

import AeroPlusWallpaper from "../__Components__/AeroPlusWallpaper.vue";
import ScrollBarThemeLoader from "../__Components__/ScrollBarThemeLoader.vue";
import AnimatedIcon from "../__Components__/AnimatedIcon.vue";
import TopComment from "../__Components__/TopComment.vue";
import BaseImage from "../__Components__/BaseImage.vue";
import StaticOscillatingLines from "../__Components__/StaticOscillatingLines.vue";
import NetworkOffline from "../__Components__/NetworkOffline.vue";

const { themeClasses } = useTheme();
</script>

<style scoped>
.animated-line::after {
  content: "";
  position: absolute;
  left: 0;
  top: -100%;
  width: 100%;
  height: 30px;
  background-color: rgba(255, 0, 0, 0.325);
  animation: moveLine 5s linear infinite;
  z-index: -1;
}

@keyframes moveLine {
  0% {
    top: -800px;
  }
  50% {
    top: 800px;
  }
  100% {
    top: -800px;
  }
}
</style>
