<!-- homedock-ui/vue3/static/js/__Components__/Footer.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template>
  <div :class="[themeClasses.back]" class="mt-auto z-0">
    <div :class="[themeClasses.hrSelector]" class="mt-4"></div>

    <div class="text-[12px] font-[400] pb-8 pl-6 pr-6 pt-8 text-center sm:text-left">
      <div class="block sm:flex sm:justify-between">
        <div class="flex flex-col items-center sm:items-start">
          <div class="flex flex-col sm:flex-row items-center sm:items-center">
            <div :class="[themeClasses.footerTextLeft]">HomeDock OS {{ commonData.version }}</div>
            <div class="flex items-center sm:ml-1 space-x-4 mt-2 sm:space-x-1 sm:-mt-0.5">
              <a href="https://github.com/BansheeTech/HomeDockOS" target="_blank" class="flex items-center">
                <Icon :class="[themeClasses.footerTextLeftIcons]" class="w-4 h-4 transition duration-300 hover:scale-125 hover:-translate-y-1" :icon="githubIcon" />
              </a>
              <a href="https://www.homedock.cloud" target="_blank" class="flex items-center">
                <Icon :class="[themeClasses.footerTextLeftIcons]" class="w-4 h-4 transition duration-300 hover:scale-125 hover:-translate-y-1" :icon="websiteIcon" />
              </a>
              <a href="https://docs.homedock.cloud" target="_blank" class="flex items-center">
                <Icon :class="[themeClasses.footerTextLeftIcons]" class="w-4 h-4 transition duration-300 hover:scale-125 hover:-translate-y-1" :icon="supportIcon" />
              </a>
            </div>
          </div>
        </div>
        <div :class="[themeClasses.footerTextRight]" class="mt-3 sm:mt-0">Copyright © 2023-{{ currentYear }} Banshee</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { inject } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import { Icon } from "@iconify/vue";
import websiteIcon from "@iconify-icons/mdi/earth";
import supportIcon from "@iconify-icons/mdi/lifebuoy";
import githubIcon from "@iconify-icons/mdi/github";

const commonData = inject<{
  version: string;
}>("data-common");

if (!commonData) {
  throw new Error("Common data is missing!");
}

const { themeClasses } = useTheme();

const currentYear = new Date().getFullYear();
</script>

<style scoped>
@keyframes rainbow {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 100% 50%;
  }
}

.rainbow-text {
  display: inline-block;
  background: linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet, red);
  background-size: 2600%;
  color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
  animation: rainbow 5s linear infinite;
  text-shadow: 1px 1px #ffffff41;
}
</style>
