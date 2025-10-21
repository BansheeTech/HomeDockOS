<!-- homedock-ui/vue3/static/js/__Windows__/Window.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Transition name="minimize">
    <div
      v-if="!window.isMinimized"
      ref="windowRef"
      class="window"
      :class="[
        themeClasses.windowBg,
        isActive ? themeClasses.windowBorderFocused : themeClasses.windowBorder,
        themeClasses.windowShadow,
        {
          active: isActive,
          maximized: window.isMaximized,
          'fullscreen-mobile': isMobile,
          dragging: dragState?.isDragging,
          resizing: resizeState?.isResizing,
        },
      ]"
      :style="windowStyle"
      @mousedown="handleFocus"
    >
      <div class="window-header" :class="[themeClasses.windowTitleBarBg, themeClasses.windowTitleBarBorder]">
        <div class="window-header-draggable" @mousedown="handleHeaderMouseDown" @dblclick="handleHeaderDblClick">
          <div v-if="window.icon" class="window-icon-container transition duration-150" :class="isActive ? themeClasses.windowIconContainerBgFocused : themeClasses.windowIconContainerBg">
            <Icon :icon="window.icon" class="window-icon" :class="isActive ? themeClasses.windowTitleTextFocused : themeClasses.windowTitleText" width="16" height="16" />
          </div>

          <span class="window-title" :class="isActive ? themeClasses.windowTitleTextFocused : themeClasses.windowTitleText">{{ window.title }}</span>
        </div>

        <div class="window-controls">
          <button v-if="appConfig?.minimizable !== false" class="window-control minimize" :class="[themeClasses.windowButtonText, themeClasses.windowButtonBgHover, themeClasses.windowButtonTextHover]" @click.stop="handleMinimize" title="Minimize">
            <Icon :icon="minimizeIcon" :width="isMobile ? 14 : 12" :height="isMobile ? 14 : 12" />
          </button>
          <button v-if="!isMobile && appConfig?.maximizable !== false" class="window-control maximize" :class="[themeClasses.windowButtonText, themeClasses.windowButtonBgHover, themeClasses.windowButtonTextHover]" @click.stop="handleToggleMaximize" title="Maximize">
            <Icon :icon="window.isMaximized ? restoreIcon : maximizeIcon" width="12" height="12" />
          </button>
          <button v-if="appConfig?.closeable !== false" class="window-control close" :class="[themeClasses.windowButtonText, themeClasses.windowCloseButtonBgHover, themeClasses.windowCloseButtonTextHover]" @click.stop="handleClose" title="Close">
            <Icon :icon="closeIcon" :width="isMobile ? 14 : 12" :height="isMobile ? 14 : 12" />
          </button>
        </div>
      </div>

      <div class="window-body window-container">
        <component :is="appComponent" v-if="appComponent" v-bind="window.data" />
        <div v-else class="window-placeholder" :class="themeClasses.windowPlaceholderText">
          <p>App component not loaded</p>
          <p class="text-sm opacity-50">appId: {{ window.appId }}</p>
        </div>
      </div>

      <template v-if="!window.isMaximized && !isMobile && appConfig?.resizable !== false">
        <div class="resize-handle resize-n" @mousedown.stop="(e: MouseEvent) => handleResizeStart('n', e)"></div>
        <div class="resize-handle resize-s" @mousedown.stop="(e: MouseEvent) => handleResizeStart('s', e)"></div>
        <div class="resize-handle resize-e" @mousedown.stop="(e: MouseEvent) => handleResizeStart('e', e)"></div>
        <div class="resize-handle resize-w" @mousedown.stop="(e: MouseEvent) => handleResizeStart('w', e)"></div>
        <div class="resize-handle resize-ne" @mousedown.stop="(e: MouseEvent) => handleResizeStart('ne', e)"></div>
        <div class="resize-handle resize-nw" @mousedown.stop="(e: MouseEvent) => handleResizeStart('nw', e)"></div>
        <div class="resize-handle resize-se" @mousedown.stop="(e: MouseEvent) => handleResizeStart('se', e)"></div>
        <div class="resize-handle resize-sw" @mousedown.stop="(e: MouseEvent) => handleResizeStart('sw', e)"></div>
      </template>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, markRaw } from "vue";
import { Icon } from "@iconify/vue";
import minimizeIcon from "@iconify-icons/mdi/window-minimize";
import maximizeIcon from "@iconify-icons/mdi/window-maximize";
import restoreIcon from "@iconify-icons/mdi/window-restore";
import closeIcon from "@iconify-icons/mdi/close";

import { useWindowStore, WindowState } from "../__Stores__/windowStore";
import { getAppById } from "../__Config__/WindowDefaultDetails";
import { useResponsive } from "../__Composables__/useResponsive";
import { useTheme } from "../__Themes__/ThemeSelector";

interface Props {
  window: WindowState;
  isActive: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [windowId: string];
  focus: [windowId: string];
  minimize: [windowId: string];
  maximize: [windowId: string];
}>();

const windowStore = useWindowStore();
const { isMobile, isResizeEnabled, isDragEnabled, taskbarHeight, availableHeight } = useResponsive();
const { themeClasses } = useTheme();

const windowRef = ref<HTMLElement | null>(null);

const appConfig = computed(() => getAppById(props.window.appId));

const appComponent = computed(() => {
  return appConfig.value ? markRaw(appConfig.value.component) : null;
});

const windowStyle = computed(() => {
  if (isMobile.value) {
    return {
      top: "0",
      left: "0",
      width: "100vw",
      height: availableHeight.value,
      zIndex: props.window.zIndex,
    };
  }

  if (props.window.isMaximized) {
    return {
      top: "0",
      left: "0",
      width: "100%",
      height: `calc(100% - ${taskbarHeight.value})`,
      zIndex: props.window.zIndex,
    };
  }

  return {
    top: `${props.window.y}px`,
    left: `${props.window.x}px`,
    width: `${props.window.width}px`,
    height: `${props.window.height}px`,
    zIndex: props.window.zIndex,
  };
});

const dragState = ref<{
  isDragging: boolean;
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
} | null>(null);

const lastClickTime = ref<number>(0);
const DOUBLE_CLICK_THRESHOLD = 300;

const resizeState = ref<{
  isResizing: boolean;
  direction: string;
  startX: number;
  startY: number;
  initialWidth: number;
  initialHeight: number;
  initialX: number;
  initialY: number;
} | null>(null);

function handleFocus() {
  if (!props.isActive) {
    windowStore.focusWindow(props.window.id);
  }
}

function handleClose() {
  windowStore.closeWindow(props.window.id);
}

function handleMinimize() {
  windowStore.minimizeWindow(props.window.id);
}

function handleToggleMaximize() {
  windowStore.toggleMaximize(props.window.id);
}

function handleHeaderMouseDown(e: MouseEvent) {
  if (props.window.isMaximized) return;
  if (isMobile.value) return;
  if (e.button !== 0) return;

  const now = Date.now();
  const timeSinceLastClick = now - lastClickTime.value;

  if (timeSinceLastClick < DOUBLE_CLICK_THRESHOLD) {
    lastClickTime.value = 0;
    return;
  }

  lastClickTime.value = now;

  handleFocus();

  dragState.value = {
    isDragging: true,
    startX: e.clientX,
    startY: e.clientY,
    initialX: props.window.x,
    initialY: props.window.y,
  };

  document.addEventListener("mousemove", handleDragMove);
  document.addEventListener("mouseup", handleDragEnd);

  e.preventDefault();
}

function handleHeaderDblClick(e: MouseEvent) {
  if (appConfig.value?.maximizable !== false) {
    handleToggleMaximize();
  }

  e.preventDefault();
  e.stopPropagation();
}

function handleDragMove(e: MouseEvent) {
  if (!dragState.value || !dragState.value.isDragging) return;

  const deltaX = e.clientX - dragState.value.startX;
  const deltaY = e.clientY - dragState.value.startY;

  const newX = dragState.value.initialX + deltaX;
  const newY = dragState.value.initialY + deltaY;

  windowStore.updateWindowPosition(props.window.id, newX, newY);
}

function handleDragEnd() {
  dragState.value = null;

  document.removeEventListener("mousemove", handleDragMove);
  document.removeEventListener("mouseup", handleDragEnd);
}

function handleResizeStart(direction: string, e: MouseEvent) {
  if (props.window.isMaximized) return;

  resizeState.value = {
    isResizing: true,
    direction,
    startX: e.clientX,
    startY: e.clientY,
    initialWidth: props.window.width,
    initialHeight: props.window.height,
    initialX: props.window.x,
    initialY: props.window.y,
  };

  handleFocus();

  document.addEventListener("mousemove", handleResizeMove);
  document.addEventListener("mouseup", handleResizeEnd);

  e.preventDefault();
  e.stopPropagation();
}

function handleResizeMove(e: MouseEvent) {
  if (!resizeState.value || !resizeState.value.isResizing) return;

  const state = resizeState.value;
  const deltaX = e.clientX - state.startX;
  const deltaY = e.clientY - state.startY;

  let newWidth = state.initialWidth;
  let newHeight = state.initialHeight;
  let newX = state.initialX;
  let newY = state.initialY;

  if (state.direction.includes("e")) {
    newWidth = state.initialWidth + deltaX;
  }
  if (state.direction.includes("w")) {
    newWidth = state.initialWidth - deltaX;
    newX = state.initialX + deltaX;
  }
  if (state.direction.includes("s")) {
    newHeight = state.initialHeight + deltaY;
  }
  if (state.direction.includes("n")) {
    newHeight = state.initialHeight - deltaY;
    newY = state.initialY + deltaY;
  }

  const config = appConfig.value;
  const minWidth = config?.minWidth ?? 400;
  const minHeight = config?.minHeight ?? 300;
  const maxWidth = config?.maxWidth;
  const maxHeight = config?.maxHeight;

  if (newWidth < minWidth) {
    newWidth = minWidth;
    if (state.direction.includes("w")) {
      newX = state.initialX + state.initialWidth - minWidth;
    }
  }

  if (maxWidth && newWidth > maxWidth) {
    newWidth = maxWidth;
    if (state.direction.includes("w")) {
      newX = state.initialX + state.initialWidth - maxWidth;
    }
  }

  if (newHeight < minHeight) {
    newHeight = minHeight;
    if (state.direction.includes("n")) {
      newY = state.initialY + state.initialHeight - minHeight;
    }
  }

  if (maxHeight && newHeight > maxHeight) {
    newHeight = maxHeight;
    if (state.direction.includes("n")) {
      newY = state.initialY + state.initialHeight - maxHeight;
    }
  }

  windowStore.updateWindowSize(props.window.id, newWidth, newHeight);

  if (newX !== state.initialX || newY !== state.initialY) {
    windowStore.updateWindowPosition(props.window.id, newX, newY);
  }
}

function handleResizeEnd() {
  resizeState.value = null;

  document.removeEventListener("mousemove", handleResizeMove);
  document.removeEventListener("mouseup", handleResizeEnd);
}

onUnmounted(() => {
  document.removeEventListener("mousemove", handleDragMove);
  document.removeEventListener("mouseup", handleDragEnd);
  document.removeEventListener("mousemove", handleResizeMove);
  document.removeEventListener("mouseup", handleResizeEnd);
});
</script>

<style scoped>
.window {
  position: absolute;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  contain: layout style paint;
}

.window:not(.dragging):not(.resizing) {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Performance optimization drag/resize */
:global(.window.dragging),
:global(.window.resizing) {
  transition: none !important;
  pointer-events: none !important;
  user-select: none !important;
  backface-visibility: hidden;
  isolation: isolate;
}

/* Disable transitions */
:global(.window.dragging *),
:global(.window.resizing *) {
  transition: none !important;
  pointer-events: none !important;
  user-select: none !important;
}

/* Isolate contentn  */
:global(.window.dragging .window-body),
:global(.window.resizing .window-body) {
  contain: strict;
  content-visibility: auto;
}

.window.active {
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.2), 0 0 0 1px rgba(59, 130, 246, 0.3);
}

.window.maximized {
  border-radius: 0;
  border: none;
  box-shadow: none;
}

.window.fullscreen-mobile {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  border-radius: 0 !important;
  border: none !important;
  max-width: 100vw !important;
}

.minimize-enter-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: bottom center;
}

.minimize-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 1, 1);
  transform-origin: bottom center;
}

.minimize-enter-from {
  opacity: 0;
  transform: scale(0.7) translateY(100px);
}

.minimize-leave-to {
  opacity: 0;
  transform: scale(0.3) translateY(200px);
}

.window-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  user-select: none;
  flex-shrink: 0;
}

.window-header-draggable {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
  cursor: move;
}

.window.maximized .window-header-draggable,
.window.fullscreen-mobile .window-header-draggable {
  cursor: default;
}

.window-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  flex-shrink: 0;
}

.window-icon {
  flex-shrink: 0;
}

.window-title {
  flex: 1;
  min-width: 0;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.window-controls {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.window-control {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.window-body {
  flex: 1;
  overflow: auto;
  position: relative;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.window-container {
  container-type: inline-size;
  container-name: window;
}

.window-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 0.5rem;
}

.resize-handle {
  position: absolute;
  z-index: 10;
}

.resize-n,
.resize-s {
  left: 0;
  right: 0;
  height: 6px;
  cursor: ns-resize;
}

.resize-n {
  top: 0;
}
.resize-s {
  bottom: 0;
}

.resize-e,
.resize-w {
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: ew-resize;
}

.resize-e {
  right: 0;
}
.resize-w {
  left: 0;
}

.resize-ne,
.resize-nw,
.resize-se,
.resize-sw {
  width: 12px;
  height: 12px;
}

.resize-ne {
  top: 0;
  right: 0;
  cursor: nesw-resize;
}

.resize-nw {
  top: 0;
  left: 0;
  cursor: nwse-resize;
}

.resize-se {
  bottom: 0;
  right: 0;
  cursor: nwse-resize;
}

.resize-sw {
  bottom: 0;
  left: 0;
  cursor: nesw-resize;
}

@media (max-width: 768px) {
  .window-header {
    padding: 0.625rem 0.875rem;
  }

  .window-control {
    width: 36px;
    height: 36px;
  }

  .window-title {
    font-size: 0.9375rem;
  }

  .window-icon {
    width: 18px;
    height: 18px;
  }

  .window.fullscreen-mobile .window-body {
    height: calc(100% - 48px);
  }
}
</style>
