<!-- homedock-ui/vue3/static/js/__Components__/ShowDesktopVerticalLine.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div>
    <div class="hidden md:block fixed bottom-0 right-0 w-[8px] z-[1001] h-[100%]">
      <button ref="buttonRef" class="w-full h-full border-0 cursor-pointer transition-all duration-150 flex items-center justify-center" :class="[isHovered ? themeClasses.showDesktopBgHover : themeClasses.showDesktopBg]" @click.stop="toggleShowDesktop" @contextmenu="handleContextMenu" @mouseenter="isHovered = true" @mouseleave="isHovered = false">
        <div class="w-[2px] h-[80%] rounded-full transition-all duration-150" :class="themeClasses.showDesktopLine" :style="{ opacity: isHovered ? 1 : 0.4 }"></div>
      </button>
    </div>
  </div>

  <Teleport to="body">
    <Transition name="context-menu-fade">
      <div
        v-if="contextMenu.visible"
        ref="contextMenuRef"
        class="fixed z-[9999] rounded-lg p-1 min-w-[200px] select-none origin-bottom-right"
        :class="[themeClasses.taskbarContextMenuBg, themeClasses.taskbarContextMenuBorder, themeClasses.taskbarContextMenuShadow]"
        :style="{
          right: '10px',
          bottom: `calc(${taskbarHeight} + 8px)`,
        }"
      >
        <div v-for="(item, index) in contextMenuItems" :key="index" class="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150" :class="[themeClasses.taskbarContextMenuItem, !item.divider && !item.disabled ? [themeClasses.taskbarContextMenuItemHover, 'cursor-pointer'] : '', item.disabled && [themeClasses.taskbarContextMenuItemDisabled, 'cursor-not-allowed'], item.divider && 'py-1 cursor-default']" @click="handleContextItemClick(item)">
          <template v-if="!item.divider">
            <Icon v-if="item.icon" :icon="item.icon" width="16" height="16" class="flex-shrink-0" />
            <span class="flex-1">{{ item.label }}</span>
          </template>
          <div v-else class="h-px mx-2" :class="themeClasses.taskbarContextMenuDivider"></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

import { useWindowStore } from "../__Stores__/windowStore";
import { useResponsive } from "../__Composables__/useResponsive";
import { useTheme } from "../__Themes__/ThemeSelector";

import { Icon } from "@iconify/vue";
import desktopIcon from "@iconify-icons/mdi/monitor";
import restoreIcon from "@iconify-icons/mdi/window-restore";
import closeIcon from "@iconify-icons/mdi/close";

const windowStore = useWindowStore();
const { taskbarHeight } = useResponsive();
const { themeClasses } = useTheme();

const buttonRef = ref<HTMLButtonElement | null>(null);
const contextMenuRef = ref<HTMLElement | null>(null);
const isHovered = ref(false);

const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
});

interface ContextMenuItem {
  label?: string;
  icon?: any;
  action?: () => void;
  disabled?: boolean;
  divider?: boolean;
}

const contextMenuItems = computed<ContextMenuItem[]>(() => {
  const hasMinimizedWindows = windowStore.windows.some((w) => w.isMinimized);
  const hasWindows = windowStore.windows.length > 0;

  return [
    {
      label: "Show Desktop",
      icon: desktopIcon,
      action: toggleShowDesktop,
    },
    {
      label: "Restore Windows",
      icon: restoreIcon,
      action: restoreAllWindows,
      disabled: !hasMinimizedWindows,
    },
    { divider: true },
    {
      label: "Close All",
      icon: closeIcon,
      action: closeAllWindows,
      disabled: !hasWindows,
    },
  ];
});

function toggleShowDesktop() {
  const nonMinimizedWindows = windowStore.windows.filter((w) => !w.isMinimized);

  if (nonMinimizedWindows.length > 0) {
    nonMinimizedWindows.forEach((window) => {
      windowStore.minimizeWindow(window.id);
    });
  } else {
    restoreAllWindows();
  }
}

function handleContextMenu(e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();

  if (contextMenu.value.visible) {
    closeContextMenu();
    return;
  }

  contextMenu.value = {
    visible: true,
    x: 0,
    y: 0,
  };
}

function handleContextItemClick(item: ContextMenuItem) {
  if (item.disabled || item.divider) return;

  if (item.action) {
    item.action();
  }

  closeContextMenu();
}

function closeContextMenu() {
  contextMenu.value.visible = false;
}

function restoreAllWindows() {
  const minimizedWindows = windowStore.windows.filter((w) => w.isMinimized);

  minimizedWindows.forEach((window) => {
    windowStore.focusWindow(window.id);
  });
}

function closeAllWindows() {
  windowStore.closeAllWindows();
}

function handleClickOutside(e: MouseEvent) {
  if (!contextMenu.value.visible) return;

  const target = e.target as HTMLElement;

  const isOutsideMenu = contextMenuRef.value && !contextMenuRef.value.contains(target);
  const isOutsideButton = buttonRef.value && !buttonRef.value.contains(target);

  if (isOutsideMenu && isOutsideButton) {
    closeContextMenu();
  }
}

function handleEscapeKey(e: KeyboardEvent) {
  if (e.key === "Escape" && contextMenu.value.visible) {
    closeContextMenu();
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleEscapeKey);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleEscapeKey);
});
</script>

<style scoped>
/* Context menu transitions */
.context-menu-fade-enter-active,
.context-menu-fade-leave-active {
  transition: all 0.15s ease;
}

.context-menu-fade-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.context-menu-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
