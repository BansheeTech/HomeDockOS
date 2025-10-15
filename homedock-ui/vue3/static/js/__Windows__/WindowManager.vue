<!-- homedock-ui/vue3/static/js/__Windows__/WindowManager.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="window-manager">
    <TransitionGroup name="window-fade">
      <Window v-for="window in openWindows" :key="window.id" :window="window" :is-active="window.id === activeWindowId" @close="handleClose" @focus="handleFocus" @minimize="handleMinimize" @maximize="handleMaximize" />
    </TransitionGroup>

    <!-- <div v-if="showDebugInfo" class="debug-info">
      <p class="text-xs text-white opacity-50">Windows: {{ openWindows.length }}</p>
      <p class="text-xs text-white opacity-50">Active: {{ activeWindowId }}</p>
    </div> -->
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted } from "vue";
import Window from "./Window.vue";
import { useWindowStore } from "../__Stores__/windowStore";

interface Props {
  showDebugInfo?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showDebugInfo: false,
});

const windowStore = useWindowStore();

const openWindows = computed(() => windowStore.windows);
const activeWindowId = computed(() => windowStore.activeWindowId);

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

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === "Escape" && activeWindowId.value) {
    windowStore.closeWindow(activeWindowId.value);
    e.preventDefault();
  }

  if (e.altKey && e.key === "F4" && activeWindowId.value) {
    windowStore.closeWindow(activeWindowId.value);
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
</style>
