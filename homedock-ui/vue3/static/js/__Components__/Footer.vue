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
              <a href="https://discord.gg/Zj3JCYsRWw" target="_blank" class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" :class="[themeClasses.loginSocials]" class="w-4 h-4 transition duration-300 hover:scale-125 hover:-translate-y-1" viewBox="0 0 24 24">
                  <rect width="24" height="24" fill="none" />
                  <path fill="currentColor" d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.1.1 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.1 16.1 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02M8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12m6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12" />
                </svg>
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
