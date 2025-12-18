<!-- homedock-ui/vue3/static/js/__Components__/VersionControl.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Transition name="text-reveal" appear>
    <div v-if="show" class="absolute bottom-[6px] right-2 text-[9px] md:bottom-2 md:right-3 md:text-[10px] font-medium opacity-15 hover:opacity-40 select-none z-50 font-sans tracking-wide transition duration-300 animate-opacity flex items-center gap-1 md:gap-1.5 cursor-pointer" :class="[themeClasses.versionText]" @click="openAbout" title="About HomeDock OS">
      <LogoIcon class="w-[10px] h-[10px] md:w-[14px] md:h-[14px]" />
      <span>HomeDock OS v{{ version }}</span>
      <EnterpriseSlotRenderer module="AboutBranding" size="mini" />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { inject, ref } from "vue";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useWindowStore } from "../__Stores__/windowStore";

import LogoIcon from "./LogoIcon.vue";

import EnterpriseSlotRenderer from "./EnterpriseSlotRenderer.vue";

const commonData = inject<{ version: string }>("data-common");

if (!commonData) {
  throw new Error("Common data is missing!");
}

const { version } = commonData;

const { themeClasses } = useTheme();
const windowStore = useWindowStore();

const show = ref(true);

function openAbout() {
  windowStore.openWindow("about");
}
</script>

<style scoped>
.text-reveal-enter-active {
  animation: text-reveal 1s cubic-bezier(0.8, 0, 1, 1) 0.3s both;
}

@keyframes text-reveal {
  from {
    clip-path: inset(0 0 0 100%);
  }
  to {
    clip-path: inset(0 0 0 0);
  }
}
</style>
