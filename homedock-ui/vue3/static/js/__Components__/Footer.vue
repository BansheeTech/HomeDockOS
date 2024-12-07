<!-- src/static/js/__Components__/Footer.vue -->
<!-- Copyright © 2023-2025 Banshee -->
<!-- https://www.banshee.pro -->

<template>
  <div :class="[themeClasses.back]" class="mt-auto z-10">
    <div :class="[themeClasses.hrSelector]" class="mt-4"></div>

    <div class="text-[12px] font-[400] pb-8 pl-6 pr-6 pt-8 text-center sm:text-left">
      <div class="block sm:flex sm:justify-between">
        <a target="_blank" href="https://www.homedock.cloud/">
          <div :class="[themeClasses.footerTextLeft]">HomeDock OS {{ commonData.version }} <span class="rainbow-text">Vue3 Build</span></div>
        </a>
        <div :class="[themeClasses.footerTextRight]" class="mt-1 sm:mt-0">Copyright © 2023-{{ currentYear }} Banshee</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { inject } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

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
