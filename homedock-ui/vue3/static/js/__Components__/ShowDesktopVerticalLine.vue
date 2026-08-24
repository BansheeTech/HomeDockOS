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
        :class="[themeClasses.contextMenuBg, themeClasses.contextMenuBorder, themeClasses.contextMenuShadow]"
        :style="{
          right: '10px',
          bottom: `calc(${taskbarHeight} + 8px)`,
        }"
      >
        <div v-for="(item, index) in contextMenuItems" :key="index" class="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150" :class="[themeClasses.contextMenuItem, !item.divider && !item.disabled ? [themeClasses.contextMenuItemBgHover, themeClasses.contextMenuItemTextHover, 'cursor-pointer'] : '', item.disabled && [themeClasses.contextMenuItemDisabled, 'cursor-not-allowed'], item.divider && 'py-1 cursor-default']" @click="handleContextItemClick(item)">
          <template v-if="!item.divider">
            <Icon v-if="item.icon" :icon="item.icon" width="16" height="16" class="flex-shrink-0" />
            <span class="flex-1">{{ item.label ? $t(item.label) : "" }}</span>
            <span v-if="item.shortcut" class="flex-shrink-0 text-xs" :class="themeClasses.contextMenuShortcut">{{ item.shortcut }}</span>
          </template>
          <div v-else class="h-px mx-2 flex-1" :class="themeClasses.contextMenuDivider"></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from "vue";

import { useWindowStore } from "../__Stores__/windowStore";
import { useQuickViewStore } from "../__Stores__/useQuickViewStore";
import { useScreenshotStore } from "../__Stores__/useScreenshotStore";
import { shortcutLabel } from "../__Utils__/PlatformKeys";
import { isScreenCaptureSupported, type CaptureRect } from "../__Utils__/ScreenCapture";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useResponsive } from "../__Composables__/useResponsive";
import { useTheme } from "../__Themes__/ThemeSelector";

import { Icon } from "@iconify/vue";
import desktopIcon from "@iconify-icons/mdi/monitor";
import quickViewIcon from "@iconify-icons/mdi/view-dashboard-variant-outline";
import cameraIcon from "@iconify-icons/mdi/monitor-screenshot";
import restoreIcon from "@iconify-icons/mdi/window-restore";
import closeIcon from "@iconify-icons/mdi/close";

const windowStore = useWindowStore();
const quickView = useQuickViewStore();
const screenshotStore = useScreenshotStore();
const csrfToken = useCsrfToken();
const { taskbarHeight } = useResponsive();
const { themeClasses } = useTheme();

const captureSupported = isScreenCaptureSupported();

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
  shortcut?: string;
  disabled?: boolean;
  divider?: boolean;
}

const contextMenuItems = computed<ContextMenuItem[]>(() => {
  const hasMinimizedWindows = windowStore.appWindows.some((w) => w.isMinimized);
  const hasWindows = windowStore.appWindows.length > 0;
  const hasVisibleWindows = windowStore.appWindows.some((w) => !w.isMinimized && !w.isClosing);

  return [
    {
      label: "Show Desktop",
      icon: desktopIcon,
      action: toggleShowDesktop,
    },
    {
      label: "Quick View",
      icon: quickViewIcon,
      shortcut: shortcutLabel("↑"),
      action: () => quickView.toggle(),
      disabled: !hasVisibleWindows || windowStore.hasOpenDialog,
    },
    {
      label: "Restore Windows",
      icon: restoreIcon,
      action: restoreAllWindows,
      disabled: !hasMinimizedWindows,
    },
    { divider: true },
    {
      label: "Screenshot",
      icon: cameraIcon,
      action: () => captureDesktop(),
      disabled: !captureSupported || screenshotStore.isCapturing,
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
  const nonMinimizedWindows = windowStore.appWindows.filter((w) => !w.isMinimized);

  if (nonMinimizedWindows.length > 0) {
    nonMinimizedWindows.forEach((window) => {
      windowStore.minimizeWindow(window.id);
    });
  } else {
    restoreAllWindows();
  }
}

async function runCapture(rect: CaptureRect | null) {
  closeContextMenu();
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 200));

  await screenshotStore.capture(rect, csrfToken.value);
}

function captureDesktop() {
  void runCapture(null);
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
  const minimizedWindows = windowStore.appWindows.filter((w) => w.isMinimized);

  minimizedWindows.forEach((window) => {
    windowStore.focusWindow(window.id);
  });
}

function closeAllWindows() {
  void windowStore.requestCloseAll();
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
