<!-- homedock-ui/vue3/static/js/__Components__/DesktopLoadingOverlay.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Transition name="loading-fade">
    <div v-if="visible" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-[100]">
      <div :class="[themeClasses.desktopLoadingBg, themeClasses.desktopLoadingBorder, themeClasses.desktopLoadingShadow]" class="flex flex-col items-center gap-4 px-12 py-8 rounded-2xl">
        <LogoIcon :class="[themeClasses.desktopLoadingText]" class="w-12 h-12 select-none" />
        <p :class="[themeClasses.desktopLoadingText]" class="m-0 text-sm font-medium leading-none tracking-wide select-none">{{ $t("Loading Desktop...") }}</p>
        <div :class="[themeClasses.desktopLoadingBarBg]" class="relative w-[200px] h-[3px] rounded-full overflow-hidden">
          <div :class="[themeClasses.desktopLoadingBarFill]" class="loading-bar-fill absolute inset-y-0 left-0 w-2/5 rounded-full"></div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useTheme } from "../__Themes__/ThemeSelector";
import LogoIcon from "./LogoIcon.vue";

defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});

const { themeClasses } = useTheme();
</script>

<style scoped>
.loading-bar-fill {
  animation: loading-bar-animation 0.5s ease-in-out infinite alternate;
}

@keyframes loading-bar-animation {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(150%);
  }
}

.loading-fade-enter-active {
  transition: opacity 0.3s ease;
}

.loading-fade-leave-active {
  transition: opacity 0.5s ease;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
}
</style>
