<!-- homedock-ui/vue3/static/js/__Desktop__/Taskbar.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="fixed bottom-0 left-0 right-0 z-[1000]" :class="[themeClasses.taskbarBg, themeClasses.taskbarBorder]" :style="{ height: taskbarHeight }">
    <div class="flex items-center h-full px-3 gap-2">
      <button class="flex items-center gap-2 px-4 py-2 rounded-lg border-0 cursor-pointer transition-all duration-150 text-sm font-medium" :class="[themeClasses.startButtonBg, desktopStore.startMenuOpen ? [themeClasses.startButtonBgActive, themeClasses.startButtonTextActive] : [themeClasses.startButtonBgHover, themeClasses.startButtonText]]" @click="toggleStartMenu">
        <LogoIcon :class="['transition-all duration-300 ease-in-out w-[20px] h-[20px]', desktopStore.startMenuOpen ? themeClasses.startButtonIconActive : themeClasses.startButtonIcon]" />
        <span v-if="showTaskbarLabels" class="select-none">Start</span>
      </button>

      <div class="w-px h-[60%]" :class="themeClasses.taskbarDivider"></div>

      <div ref="taskbarApps" class="flex-shrink min-w-0 md:flex-1 overflow-x-auto overflow-y-hidden scrollbar-none scroll-smooth [-webkit-overflow-scrolling:touch] cursor-default">
        <TransitionGroup name="taskbar-item" tag="div" class="flex items-center gap-1">
          <button v-for="window in openWindows" :key="window.id" class="relative flex items-center gap-[0.3rem] px-3 py-2 rounded-lg bg-transparent border-0 cursor-pointer transition-all duration-150 text-sm whitespace-nowrap flex-shrink-0" :class="[themeClasses.taskbarIconText, themeClasses.taskbarIconBgHover, window.id === activeWindowId && !window.isMinimized && themeClasses.taskbarAppActive, window.isMinimized && themeClasses.taskbarAppMinimized]" @click.stop="handleWindowClick(window.id)" @contextmenu="handleWindowContextMenu($event, window)" @touchstart="handleWindowTouchStart($event, window)" @touchmove="handleWindowTouchMove" @touchend="handleWindowTouchEnd($event, window)" :title="window.title">
            <Icon v-if="window.icon" :icon="window.icon" width="20" height="20" />
            <Icon v-else :icon="defaultAppIcon" width="20" height="20" />
            <span v-if="showTaskbarLabels" class="max-w-[120px] overflow-hidden text-ellipsis select-none">{{ window.title }}</span>
            <div v-if="window.id === activeWindowId && !window.isMinimized" class="absolute bottom-[3px] left-[35%] right-[35%] h-[3px] rounded-full opacity-30" :class="themeClasses.taskbarAppIndicator"></div>
            <div v-else-if="!window.isMinimized" class="absolute bottom-[3px] left-[35%] right-[35%] h-[3px] rounded-full opacity-100" :class="themeClasses.taskbarAppIndicatorInactive"></div>
          </button>
        </TransitionGroup>
      </div>

      <div class="flex-grow md:flex-grow-0"></div>

      <div class="flex items-center gap-[0.15rem]">
        <SessionExpiredTray />

        <InstallationIndicator />

        <AppUpdatesIndicator />

        <UpdateIndicator />

        <UploadIndicator />

        <NetworkOfflineTray />

        <SystemStatsWidget :csrfToken="csrfToken" />

        <button class="flex items-center justify-center w-9 h-9 rounded-lg border-0 cursor-pointer transition-all duration-150" :class="[themeClasses.trayIconBg, themeClasses.trayIconText, themeClasses.trayIconBgHover, themeClasses.trayIconTextHover]" title="Notifications" @click.stop="notificationBellRef?.toggleDropdown()">
          <NotificationBell ref="notificationBellRef" />
        </button>

        <DateTimePicker placement="top" />
      </div>
    </div>
  </div>

  <Teleport to="body">
    <Transition name="context-menu-fade">
      <div
        v-if="contextMenu.visible"
        ref="contextMenuRef"
        class="fixed z-[9999] rounded-lg p-1 min-w-[200px] select-none origin-bottom-left"
        :class="[themeClasses.taskbarContextMenuBg, themeClasses.taskbarContextMenuBorder, themeClasses.taskbarContextMenuShadow]"
        :style="{
          left: `${contextMenu.x}px`,
          bottom: `calc(${taskbarHeight} + 8px)`,
        }"
      >
        <div v-for="(item, index) in contextMenuItems" :key="index" class="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150" :class="[themeClasses.taskbarContextMenuItem, !item.divider && !item.disabled ? themeClasses.taskbarContextMenuItemHover : '', item.disabled && themeClasses.taskbarContextMenuItemDisabled, item.divider && 'py-1 cursor-default']" @click="handleContextItemClick(item)">
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
import { ref, computed, inject, onMounted, onBeforeUnmount, nextTick } from "vue";

import { useDesktopStore } from "../__Stores__/desktopStore";
import { useWindowStore } from "../__Stores__/windowStore";
import { useResponsive } from "../__Composables__/useResponsive";
import { useTheme } from "../__Themes__/ThemeSelector";

import { Icon } from "@iconify/vue";
import themeIconLight from "@iconify-icons/mdi/white-balance-sunny";
import themeIconDark from "@iconify-icons/mdi/weather-night";
import defaultAppIcon from "@iconify-icons/mdi/application";
import minimizeIcon from "@iconify-icons/mdi/window-minimize";
import maximizeIcon from "@iconify-icons/mdi/window-maximize";
import restoreIcon from "@iconify-icons/mdi/window-restore";
import closeIcon from "@iconify-icons/mdi/close";

import NotificationBell from "../__Components__/NotificationBell.vue";
import DateTimePicker from "../__Components__/DateTimePicker.vue";
import InstallationIndicator from "../__Components__/InstallationIndicator.vue";
import AppUpdatesIndicator from "../__Components__/AppUpdatesIndicator.vue";
import UpdateIndicator from "../__Components__/UpdateIndicator.vue";
import UploadIndicator from "../__Components__/UploadIndicator.vue";
import NetworkOfflineTray from "../__Components__/NetworkOfflineTray.vue";
import SessionExpiredTray from "../__Components__/SessionExpiredTray.vue";
import LogoIcon from "../__Components__/LogoIcon.vue";
import SystemStatsWidget from "./SystemStatsWidget.vue";

interface ContextMenuItem {
  label?: string;
  icon?: any;
  action?: () => void;
  disabled?: boolean;
  divider?: boolean;
}

const desktopStore = useDesktopStore();
const windowStore = useWindowStore();
const { taskbarHeight, showTaskbarLabels } = useResponsive();
const { themeClasses } = useTheme();

const themeData = inject<{ selectedTheme: string; selectedBack: string }>("data-theme");
const settingsData = inject<{ userName: string }>("data-settings");
const userName = computed(() => settingsData?.userName || "User");

const csrfToken = ref<string>(document.querySelector('meta[name="homedock_csrf_token"]')?.getAttribute("content") || "");

const taskbarApps = ref<HTMLDivElement | null>(null);

const notificationBellRef = ref<InstanceType<typeof NotificationBell> | null>(null);

const isDragging = ref(false);
const startX = ref(0);
const scrollLeft = ref(0);
const hasDragged = ref(false);

let windowLongPressTimer: ReturnType<typeof setTimeout> | null = null;
const windowLongPressStartX = ref(0);
const windowLongPressStartY = ref(0);
const windowLongPressMoved = ref(false);
const WINDOW_LONG_PRESS_DURATION = 500; // ms
const WINDOW_LONG_PRESS_MOVE_THRESHOLD = 10; // px

const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  window: null as any,
});
const contextMenuRef = ref<HTMLElement | null>(null);

const themeIcon = computed(() => {
  return themeData?.selectedTheme === "dark-mode-theme" ? themeIconLight : themeIconDark;
});

const openWindows = computed(() => windowStore.windows);

const activeWindowId = computed(() => windowStore.activeWindowId);

const contextMenuItems = computed<ContextMenuItem[]>(() => {
  const win = contextMenu.value.window;
  if (!win) return [];

  const items: ContextMenuItem[] = [];

  if (win.isMinimized) {
    items.push({
      label: "Restore",
      icon: restoreIcon,
      action: () => {
        windowStore.restoreWindow(win.id);
        windowStore.focusWindow(win.id);
      },
    });
  } else if (win.isMaximized) {
    items.push({
      label: "Restore Down",
      icon: restoreIcon,
      action: () => {
        windowStore.restoreWindow(win.id);
      },
    });
  } else {
    items.push({
      label: "Minimize",
      icon: minimizeIcon,
      action: () => {
        windowStore.minimizeWindow(win.id);
      },
    });
  }

  if (!win.isMinimized && !win.isMaximized) {
    items.push({
      label: "Maximize",
      icon: maximizeIcon,
      action: () => {
        windowStore.maximizeWindow(win.id);
      },
    });
  }

  items.push({ divider: true });

  items.push({
    label: "Close",
    icon: closeIcon,
    action: () => {
      windowStore.closeWindow(win.id);
    },
  });

  return items;
});

function toggleStartMenu() {
  desktopStore.toggleStartMenu();
}

function handleWindowClick(windowId: string) {
  if (!hasDragged.value) {
    windowStore.toggleMinimizeWindow(windowId);
  }
}

function handleScrollStart(e: MouseEvent) {
  if (e.button === 2) {
    return;
  }

  if (!taskbarApps.value) return;

  isDragging.value = true;
  hasDragged.value = false;
  startX.value = e.pageX;
  scrollLeft.value = taskbarApps.value.scrollLeft;

  taskbarApps.value.style.cursor = "grabbing";
  taskbarApps.value.style.userSelect = "none";

  window.addEventListener("mousemove", handleScrollMove);
  window.addEventListener("mouseup", handleScrollEnd);
}

function handleScrollMove(e: MouseEvent) {
  if (!isDragging.value || !taskbarApps.value) return;

  e.preventDefault();
  e.stopPropagation();

  const x = e.pageX;
  const walk = x - startX.value;

  if (Math.abs(walk) > 5) {
    hasDragged.value = true;
  }

  taskbarApps.value.scrollLeft = scrollLeft.value - walk;
}

function handleScrollEnd() {
  if (!taskbarApps.value) return;

  isDragging.value = false;
  taskbarApps.value.style.cursor = "default";
  taskbarApps.value.style.userSelect = "auto";

  window.removeEventListener("mousemove", handleScrollMove);
  window.removeEventListener("mouseup", handleScrollEnd);

  setTimeout(() => {
    hasDragged.value = false;
  }, 50);
}

function handleWindowContextMenu(e: MouseEvent, win: any) {
  e.preventDefault();
  e.stopPropagation();

  if (contextMenu.value.visible) {
    closeContextMenu();
  }

  const clickX = e.clientX;

  contextMenu.value = {
    visible: true,
    x: clickX,
    y: 0,
    window: win,
  };

  nextTick(() => {
    if (!contextMenuRef.value) return;

    const menuRect = contextMenuRef.value.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    let x = clickX;

    if (x + menuRect.width > viewportWidth) {
      x = Math.max(10, viewportWidth - menuRect.width - 10);
    }

    x = Math.max(10, x);

    contextMenu.value.x = x;
  });
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
  contextMenu.value.window = null;
}

function handleWindowTouchStart(e: TouchEvent, win: any) {
  if (e.touches.length > 1) return;

  const touch = e.touches[0];

  windowLongPressStartX.value = touch.clientX;
  windowLongPressStartY.value = touch.clientY;
  windowLongPressMoved.value = false;

  windowLongPressTimer = setTimeout(() => {
    if (!windowLongPressMoved.value) {
      const contextMenuEvent = new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: touch.clientX,
        clientY: touch.clientY,
      });

      handleWindowContextMenu(contextMenuEvent, win);

      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
  }, WINDOW_LONG_PRESS_DURATION);
}

function handleWindowTouchMove(e: TouchEvent) {
  if (!windowLongPressTimer) return;

  const touch = e.touches[0];
  const deltaX = touch.clientX - windowLongPressStartX.value;
  const deltaY = touch.clientY - windowLongPressStartY.value;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  if (distance > WINDOW_LONG_PRESS_MOVE_THRESHOLD) {
    windowLongPressMoved.value = true;

    if (windowLongPressTimer) {
      clearTimeout(windowLongPressTimer);
      windowLongPressTimer = null;
    }
  }
}

function handleWindowTouchEnd(e: TouchEvent, win: any) {
  if (windowLongPressTimer) {
    clearTimeout(windowLongPressTimer);
    windowLongPressTimer = null;
  }

  windowLongPressMoved.value = false;
}

function handleClickOutside(e: MouseEvent) {
  if (!contextMenu.value.visible) return;

  const target = e.target as HTMLElement;

  if (contextMenuRef.value && !contextMenuRef.value.contains(target)) {
    closeContextMenu();
  }
}

function handleEscapeKey(e: KeyboardEvent) {
  if (e.key === "Escape" && contextMenu.value.visible) {
    closeContextMenu();
  }
}

onMounted(() => {
  if (taskbarApps.value) {
    taskbarApps.value.addEventListener("mousedown", handleScrollStart);
  }
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleEscapeKey);
});

onBeforeUnmount(() => {
  if (taskbarApps.value) {
    taskbarApps.value.removeEventListener("mousedown", handleScrollStart);
  }
  window.removeEventListener("mousemove", handleScrollMove);
  window.removeEventListener("mouseup", handleScrollEnd);
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleEscapeKey);

  if (windowLongPressTimer) {
    clearTimeout(windowLongPressTimer);
    windowLongPressTimer = null;
  }
});
</script>

<style scoped>
.overflow-x-auto::-webkit-scrollbar {
  display: none;
  height: 0;
  width: 0;
}

.overflow-x-auto {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

@media (max-width: 768px) {
  .flex.items-center.h-full.px-3.gap-2 {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    gap: 0.25rem;
  }

  .flex.items-center.gap-2.px-4.py-2,
  .relative.flex.items-center {
    padding: 0.5rem;
  }

  .flex.items-center.gap-\[0\.15rem\] {
    gap: 0.125rem;
  }
}

/* Transitions */
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

/* Taskbar item transitions */
.taskbar-item-enter-active,
.taskbar-item-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.taskbar-item-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(10px);
}

.taskbar-item-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(10px);
}

.taskbar-item-move {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
