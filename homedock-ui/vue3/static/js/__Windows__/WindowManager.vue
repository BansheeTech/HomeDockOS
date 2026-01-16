<!-- homedock-ui/vue3/static/js/__Windows__/WindowManager.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="window-manager">
    <Transition name="snap-preview-fade">
      <div v-if="snapPreview" class="snap-preview" :class="[`snap-preview-${snapPreview}`, themeClasses.windowBorderFocused]" :style="snapPreviewStyle" />
    </Transition>
    <TransitionGroup name="window-fade">
      <Window v-for="window in openWindows" :key="window.id" :window="window" :is-active="window.id === activeWindowId" @close="handleClose" @focus="handleFocus" @minimize="handleMinimize" @maximize="handleMaximize" />
    </TransitionGroup>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted } from "vue";
import Window from "./Window.vue";
import { useWindowStore } from "../__Stores__/windowStore";
import { useResponsive } from "../__Composables__/useResponsive";
import { useTheme } from "../__Themes__/ThemeSelector";

interface Props {
  showDebugInfo?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showDebugInfo: false,
});

const windowStore = useWindowStore();
const { taskbarHeightPx } = useResponsive();
const { themeClasses } = useTheme();

const openWindows = computed(() => windowStore.windows);
const activeWindowId = computed(() => windowStore.activeWindowId);
const snapPreview = computed(() => windowStore.snapPreview);

const snapPreviewStyle = computed(() => {
  const screenHeight = typeof window !== "undefined" ? window.innerHeight : 1080;
  const availableHeight = screenHeight - taskbarHeightPx.value;

  return {
    height: `${availableHeight}px`,
  };
});

function handleClose(windowId: string) {
  windowStore.closeWindow(windowId);
}

function handleFocus(windowId: string) {
  windowStore.focusWindow(windowId);
}

function handleMinimize(windowId: string) {
  windowStore.minimizeWindow(windowId);
}

function handleMaximize(windowId: string) {
  windowStore.toggleMaximize(windowId);
}

function requestCloseWindow(windowId: string) {
  const event = new CustomEvent(`homedock:request-close-${windowId}`, {
    cancelable: true,
  });
  const wasNotPrevented = window.dispatchEvent(event);

  if (wasNotPrevented) {
    windowStore.closeWindow(windowId);
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === "Escape" && activeWindowId.value) {
    requestCloseWindow(activeWindowId.value);
    e.preventDefault();
  }

  if (e.altKey && e.key === "F4" && activeWindowId.value) {
    requestCloseWindow(activeWindowId.value);
    e.preventDefault();
  }
}

onMounted(() => {
  document.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeyDown);
});
</script>

<style scoped>
.window-manager {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 100;
}

.window-manager > * {
  pointer-events: auto !important;
}

:deep(.window) {
  pointer-events: auto !important;
}

.debug-info {
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  padding: 0.5rem;
  border-radius: 6px;
  pointer-events: none;
  z-index: 9999;
}

.window-fade-enter-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: bottom center;
}

.window-fade-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 1, 1);
  transform-origin: bottom center;
}

.window-fade-enter-from {
  opacity: 0;
  transform: scale(0.7) translateY(100px);
}

.window-fade-leave-to {
  opacity: 0;
  transform: scale(0.3) translateY(200px);
}

.window-fade-move {
  transition: transform 0.3s ease;
}

.snap-preview {
  position: fixed;
  top: 0;
  width: 50%;
  background: rgba(59, 130, 246, 0.2);
  border-radius: 12px;
  pointer-events: none;
  z-index: 99;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.5);
  animation: snap-pulse 1.5s ease-in-out infinite;
}

@keyframes snap-pulse {
  0%,
  100% {
    background: rgba(59, 130, 246, 0.15);
    box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.4);
  }
  50% {
    background: rgba(59, 130, 246, 0.25);
    box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.7);
  }
}

.snap-preview-left {
  left: 0;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.snap-preview-right {
  right: 0;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.snap-preview-fade-enter-active,
.snap-preview-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.snap-preview-fade-enter-from,
.snap-preview-fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
