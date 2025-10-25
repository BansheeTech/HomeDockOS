<!-- homedock-ui/vue3/static/js/__Components__/UpdateIndicator.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Transition name="taskbar-item">
    <div v-if="isUpdating || isCheckingUpdates" class="update-indicator-wrapper" ref="indicatorRef">
      <div class="update-indicator" :class="[themeClasses.updateIndicatorBg, themeClasses.updateIndicatorIcon, themeClasses.updateIndicatorBgHover, themeClasses.updateIndicatorIconHover]" @click="toggleDropdown">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
          <rect width="24" height="24" fill="none" />
          <defs>
            <filter id="SVGg4wYRcsm">
              <feGaussianBlur in="SourceGraphic" result="y" stdDeviation="1.5" />
              <feColorMatrix in="y" result="z" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 18 -7" />
              <feBlend in="SourceGraphic" in2="z" />
            </filter>
          </defs>
          <g fill="currentColor" filter="url(#SVGg4wYRcsm)" stroke-width="0.5" stroke="currentColor">
            <circle cx="4" cy="12" r="3">
              <animate attributeName="cx" calcMode="spline" dur="0.75s" keySplines=".56,.52,.17,.98;.56,.52,.17,.98" repeatCount="indefinite" values="4;9;4" />
              <animate attributeName="r" calcMode="spline" dur="0.75s" keySplines=".56,.52,.17,.98;.56,.52,.17,.98" repeatCount="indefinite" values="3;8;3" />
            </circle>
            <circle cx="15" cy="12" r="8">
              <animate attributeName="cx" calcMode="spline" dur="0.75s" keySplines=".56,.52,.17,.98;.56,.52,.17,.98" repeatCount="indefinite" values="15;20;15" />
              <animate attributeName="r" calcMode="spline" dur="0.75s" keySplines=".56,.52,.17,.98;.56,.52,.17,.98" repeatCount="indefinite" values="8;3;8" />
            </circle>
          </g>
        </svg>
      </div>

      <Transition name="dropdown">
        <div v-if="isExpanded" class="update-dropdown border" :class="[themeClasses.updateDropdownBg, themeClasses.updateDropdownBorder, themeClasses.updateDropdownShadow]">
          <div class="dropdown-header px-6 py-4 rounded-t-lg text-sm font-medium flex items-center space-x-3" :class="themeClasses.topBack">
            <span class="dropdown-title" :class="themeClasses.notTextUp">{{ isCheckingUpdates ? "Checking Updates" : "Updating Apps" }}</span>
          </div>

          <div v-if="isCheckingUpdates" class="update-section" :class="themeClasses.updateSectionBorder">
            <div class="app-item" :class="themeClasses.updateAppItemUpdating">
              <div class="spinner border-2" :class="[themeClasses.updateSpinnerBorder, themeClasses.updateSpinnerTop]"></div>
              <span class="app-name" :class="themeClasses.updateAppName">Checking for updates...</span>
            </div>
          </div>

          <div v-if="updateStore.currentlyUpdating" class="update-section" :class="themeClasses.updateSectionBorder">
            <div class="section-label" :class="themeClasses.updateSectionLabel">Currently Updating</div>
            <TransitionGroup name="app-switch" tag="div">
              <div class="app-item" :class="themeClasses.updateAppItemUpdating" :key="`updating-${updateStore.currentlyUpdating.name}`">
                <BaseImage :key="`img-updating-${updateStore.currentlyUpdating.name}`" :src="updateStore.currentlyUpdating.image_path || `docker-icons/${updateStore.currentlyUpdating.name}.jpg`" class="app-icon rounded-md" alt="" draggable="false" />
                <span class="app-name" :class="themeClasses.updateAppName">{{ updateStore.currentlyUpdating.display_name }}</span>
                <div class="spinner border-2" :class="[themeClasses.updateSpinnerBorder, themeClasses.updateSpinnerTop]"></div>
              </div>
            </TransitionGroup>
          </div>

          <div v-if="updateStore.queue.length > 0" class="update-section" :class="themeClasses.updateSectionBorder">
            <div class="section-label" :class="themeClasses.updateSectionLabel">In Queue ({{ updateStore.queue.length }})</div>
            <div class="app-list">
              <TransitionGroup name="queue-item" tag="div">
                <div v-for="(appInfo, index) in visibleQueue" :key="`queue-${appInfo.name}`" class="app-item" :class="[themeClasses.updateAppItemBg, themeClasses.updateAppItemBgHover]">
                  <BaseImage :key="`img-queue-${index}-${appInfo.name}`" :src="appInfo.image_path || `docker-icons/${appInfo.name}.jpg`" class="app-icon rounded-md" alt="" draggable="false" />
                  <span class="app-name" :class="themeClasses.updateAppName">{{ appInfo.display_name }}</span>
                </div>
              </TransitionGroup>
              <div v-if="remainingCount > 0" class="more-apps" :class="themeClasses.updateMoreApps">And {{ remainingCount }} more...</div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";

import { useAppUpdateStore } from "../__Stores__/useAppUpdateStore";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useTrayManager } from "../__Composables__/useTrayManager";

import BaseImage from "./BaseImage.vue";

const updateStore = useAppUpdateStore();
const { themeClasses } = useTheme();
const trayManager = useTrayManager();

const TRAY_ID = "update-indicator";

const indicatorRef = ref<HTMLElement | null>(null);
const isExpanded = ref(false);

const MAX_VISIBLE = 3;

const isUpdating = computed(() => {
  return updateStore.currentlyUpdating !== null || updateStore.queue.length > 0;
});

const isCheckingUpdates = computed(() => {
  return updateStore.isCheckingUpdates;
});

const visibleQueue = computed(() => {
  const maxToShow = updateStore.currentlyUpdating ? MAX_VISIBLE - 1 : MAX_VISIBLE;
  return updateStore.queue.slice(0, maxToShow);
});

const remainingCount = computed(() => {
  const maxToShow = updateStore.currentlyUpdating ? MAX_VISIBLE - 1 : MAX_VISIBLE;
  return Math.max(0, updateStore.queue.length - maxToShow);
});

function toggleDropdown(e: MouseEvent) {
  e.stopPropagation();
  if (!isExpanded.value) {
    trayManager.openTray(TRAY_ID);
    isExpanded.value = true;
  } else {
    trayManager.closeTray(TRAY_ID);
    isExpanded.value = false;
  }
}

function closeDropdown() {
  trayManager.closeTray(TRAY_ID);
  isExpanded.value = false;
}

function handleClickOutside(event: MouseEvent) {
  if (indicatorRef.value && !indicatorRef.value.contains(event.target as Node)) {
    closeDropdown();
  }
}

watch(
  () => trayManager.activeTrayId.value,
  (newTrayId) => {
    if (newTrayId !== TRAY_ID && isExpanded.value) {
      isExpanded.value = false;
    }
  }
);

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.update-indicator-wrapper {
  position: relative;
  user-select: none;
}

.update-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  transition: all 0.15s ease;
  cursor: pointer;
}

.update-dropdown {
  position: fixed;
  right: 1rem;
  left: auto;
  bottom: 4rem;
  border-radius: 12px;
  width: 280px;
  z-index: 9999;
  overflow: hidden;
}

.dropdown-header {
  padding: 0.75rem 0.875rem;
}

.dropdown-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.update-section {
  padding: 0.75rem 0.875rem;
}

.update-section:last-child {
  border-bottom: none;
}

.section-label {
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 0.5rem;
}

.app-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.app-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem;
  border-radius: 6px;
  transition: background 0.15s ease;
}

.app-icon {
  width: 24px;
  height: 24px;
  object-fit: cover;
  flex-shrink: 0;
}

.app-name {
  font-size: 0.75rem;
  font-weight: 500;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spinner {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.more-apps {
  font-size: 0.7rem;
  text-align: center;
  padding: 0.25rem;
  font-style: italic;
}

/* Dropdown Animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
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

/* App switch animation */
.app-switch-move,
.app-switch-enter-active,
.app-switch-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.app-switch-enter-from {
  opacity: 0;
  transform: translateX(15px);
}

.app-switch-leave-to {
  opacity: 0;
  transform: translateX(-15px);
}

.app-switch-leave-active {
  position: absolute;
  width: 100%;
}

/* Queue item animation */
.queue-item-move,
.queue-item-enter-active,
.queue-item-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.queue-item-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.queue-item-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.queue-item-leave-active {
  position: absolute;
  width: 100%;
}
</style>
