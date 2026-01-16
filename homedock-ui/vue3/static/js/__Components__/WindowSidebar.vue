<!-- homedock-ui/vue3/static/js/__Components__/WindowSidebar.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <transition name="sidebar-backdrop">
    <div v-if="isOpen && isMobile" @click="$emit('close')" class="window-sidebar-backdrop fixed inset-0 bg-black/50 z-40"></div>
  </transition>

  <aside :class="['window-sidebar flex flex-col border-r overflow-hidden transition-transform duration-200 ease-out', themeClasses.fileExplorerSidebar, 'fixed sm:relative inset-y-0 left-0 z-50 sm:z-auto', isOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0']" :style="{ width: `${width}px`, minWidth: `${minWidth}px` }">
    <div v-if="showMobileHeader" class="flex items-center justify-between px-3 py-2 sm:hidden border-b" :class="[themeClasses.fileExplorerToolbar]">
      <span :class="[themeClasses.fileExplorerSidebarSectionTitle]" class="text-xs font-semibold">{{ mobileTitle }}</span>
      <button @click="$emit('close')" :class="[themeClasses.fileExplorerSidebarItem]" class="p-1.5 rounded-md hover:opacity-80 transition-opacity">
        <Icon :icon="closeIcon" class="w-4 h-4" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto py-2 px-2">
      <slot></slot>
    </div>

    <div v-if="$slots.footer" class="flex-shrink-0 border-t" :class="[themeClasses.fileExplorerToolbar]">
      <slot name="footer"></slot>
    </div>
  </aside>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import { Icon } from "@iconify/vue";
import closeIcon from "@iconify-icons/mdi/close";

const props = withDefaults(
  defineProps<{
    isOpen?: boolean;
    width?: number;
    minWidth?: number;
    mobileTitle?: string;
    showMobileHeader?: boolean;
    mobileBreakpoint?: number;
  }>(),
  {
    isOpen: true,
    width: 200,
    minWidth: 180,
    mobileTitle: "Navigation",
    showMobileHeader: true,
    mobileBreakpoint: 640,
  }
);

defineEmits<{
  (e: "close"): void;
}>();

const { themeClasses } = useTheme();

const windowWidth = ref(typeof window !== "undefined" ? window.innerWidth : 1024);

const isMobile = computed(() => windowWidth.value < props.mobileBreakpoint);

function handleResize() {
  windowWidth.value = window.innerWidth;
}

onMounted(() => {
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped>
.window-sidebar {
  will-change: transform;
}

/* Mobile drawer shadow and blur */
@media (max-width: 639px) {
  .window-sidebar {
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
  }
}

/* Backdrop transition */
.sidebar-backdrop-enter-active,
.sidebar-backdrop-leave-active {
  transition: opacity 0.2s ease;
}

.sidebar-backdrop-enter-from,
.sidebar-backdrop-leave-to {
  opacity: 0;
}
</style>
