<!-- homedock-ui/vue3/static/js/__Components__/SelectionBox.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Transition name="selection">
    <div v-if="visible" class="selection-box rounded absolute pointer-events-none z-[100]" :class="[themeClasses.desktopSelectionBorder, themeClasses.desktopSelectionBg]" :style="style">
      <div class="absolute inset-0 rounded overflow-hidden">
        <div class="selection-shimmer absolute inset-0 opacity-0" />
      </div>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import type { CSSProperties } from "vue";
import { useTheme } from "../__Themes__/ThemeSelector";

defineProps<{
  visible: boolean;
  style: CSSProperties;
}>();

const { themeClasses } = useTheme();
</script>

<style scoped>
.selection-leave-active {
  animation: selection-out 0.1s ease-out forwards;
}

@keyframes selection-out {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.selection-box {
  box-shadow: inset 0 0 8px 1px rgba(255, 255, 255, 0.15);
}

.selection-shimmer {
  background: linear-gradient(90deg, transparent 0%, rgba(136, 136, 136, 0.2) 50%, transparent 100%);
  animation: shimmer 0.6s ease-out forwards;
}

@keyframes shimmer {
  0% {
    opacity: 0.6;
    transform: translateX(-100%);
  }
  100% {
    opacity: 0;
    transform: translateX(100%);
  }
}
</style>
