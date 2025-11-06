<!-- homedock-ui/vue3/static/js/__Components__/StatusBubble.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Teleport v-if="teleport" :to="teleportTarget">
    <transition :name="transitionName">
      <div v-if="visible" :class="[themeClasses.dropZoneStatusBubble, positionClass]" class="fixed z-[9998] px-4 py-2.5 rounded-lg border flex items-center gap-2 min-w-[200px] max-w-[300px]">
        <Icon v-if="icon" :icon="icon" :class="[themeClasses.dropZoneStatusIcon, spinning && 'animate-spin']" class="w-4 h-4 flex-shrink-0" />
        <Icon v-else :icon="loadingIcon" :class="[themeClasses.dropZoneStatusIcon, 'animate-spin']" class="w-4 h-4 flex-shrink-0" />
        <span :class="[themeClasses.dropZoneStatusText]" class="text-sm font-medium truncate">{{ message }}</span>
      </div>
    </transition>
  </Teleport>

  <transition v-else :name="transitionName">
    <div v-if="visible" :class="[themeClasses.dropZoneStatusBubble, positionClass]" class="fixed z-[9998] px-4 py-2.5 rounded-lg border flex items-center gap-2 min-w-[200px] max-w-[300px]">
      <Icon v-if="icon" :icon="icon" :class="[themeClasses.dropZoneStatusIcon, spinning && 'animate-spin']" class="w-4 h-4 flex-shrink-0" />
      <Icon v-else :icon="loadingIcon" :class="[themeClasses.dropZoneStatusIcon, 'animate-spin']" class="w-4 h-4 flex-shrink-0" />
      <span :class="[themeClasses.dropZoneStatusText]" class="text-sm font-medium truncate">{{ message }}</span>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { Icon } from "@iconify/vue";
import loadingIcon from "@iconify-icons/mdi/loading";

import { useTheme } from "../__Themes__/ThemeSelector";

type Position = "bottom-left" | "bottom-right" | "top-left" | "top-right";

interface Props {
  visible?: boolean;
  message?: string;
  icon?: any;
  spinning?: boolean;
  position?: Position;
  teleport?: boolean;
  teleportTarget?: string;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  message: "",
  icon: undefined,
  spinning: false,
  position: "bottom-left",
  teleport: false,
  teleportTarget: "body",
});

const { themeClasses } = useTheme();

const positionClass = computed(() => {
  switch (props.position) {
    case "bottom-left":
      return "bottom-10 left-3";
    case "bottom-right":
      return "bottom-10 right-3";
    case "top-left":
      return "top-2 left-2";
    case "top-right":
      return "top-2 right-2";
    default:
      return "bottom-12 left-6";
  }
});

const transitionName = computed(() => {
  if (props.position.includes("left")) {
    return "slide-fade-left";
  } else {
    return "slide-fade-right";
  }
});
</script>

<style scoped>
/* Left slide transitions */
.slide-fade-left-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-left-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}

.slide-fade-left-enter-from {
  transform: translateX(-20px);
  opacity: 0;
}

.slide-fade-left-leave-to {
  transform: translateX(-10px);
  opacity: 0;
}

/* Right slide transitions */
.slide-fade-right-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-right-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}

.slide-fade-right-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-fade-right-leave-to {
  transform: translateX(10px);
  opacity: 0;
}
</style>
