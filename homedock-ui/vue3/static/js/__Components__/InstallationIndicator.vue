<!-- homedock-ui/vue3/static/js/__Components__/InstallationIndicator.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Transition name="taskbar-item">
    <div v-if="isInstalling" class="installation-indicator-wrapper" ref="indicatorRef">
      <div class="installation-indicator" :class="[themeClasses.installIndicatorBg, themeClasses.installIndicatorIcon, themeClasses.installIndicatorBgHover, themeClasses.installIndicatorIconHover]" @click="toggleDropdown">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
          <rect width="24" height="24" fill="none" />
          <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.3">
            <path stroke-dasharray="2 4" stroke-dashoffset="6" d="M12 3c4.97 0 9 4.03 9 9c0 4.97 -4.03 9 -9 9">
              <animate attributeName="stroke-dashoffset" dur="0.6s" repeatCount="indefinite" values="6;0" />
            </path>
            <path stroke-dasharray="32" stroke-dashoffset="32" d="M12 21c-4.97 0 -9 -4.03 -9 -9c0 -4.97 4.03 -9 9 -9">
              <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.1s" dur="0.4s" values="32;0" />
            </path>
            <path stroke-dasharray="10" stroke-dashoffset="10" d="M12 8v7.5">
              <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.5s" dur="0.2s" values="10;0" />
            </path>
            <path stroke-dasharray="6" stroke-dashoffset="6" d="M12 15.5l3.5 -3.5M12 15.5l-3.5 -3.5">
              <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.7s" dur="0.2s" values="6;0" />
            </path>
          </g>
        </svg>
      </div>

      <Transition name="dropdown">
        <div v-if="isExpanded" class="installation-dropdown border" :class="[themeClasses.installDropdownBg, themeClasses.installDropdownBorder, themeClasses.installDropdownShadow]">
          <div class="dropdown-header px-6 py-4 rounded-t-lg text-sm font-medium flex items-center space-x-3" :class="themeClasses.topBack">
            <span class="dropdown-title" :class="themeClasses.notTextUp">Installing Apps</span>
          </div>

          <div v-if="installationStore.currentlyInstalling" class="installation-section" :class="themeClasses.installSectionBorder">
            <div class="section-label" :class="themeClasses.installSectionLabel">Currently Installing</div>
            <div class="app-item" :class="themeClasses.installAppItemInstalling" :key="`installing-${installationStore.currentlyInstalling}`">
              <BaseImage :key="`img-installing-${installationStore.currentlyInstalling}`" :src="getAppIcon(installationStore.currentlyInstalling)" class="app-icon rounded-sm" alt="" draggable="false" />
              <span class="app-name" :class="themeClasses.installAppName">{{ installationStore.currentlyInstalling }}</span>
              <div class="spinner border-2" :class="[themeClasses.installSpinnerBorder, themeClasses.installSpinnerTop]"></div>
            </div>
          </div>

          <div v-if="installationStore.queue.length > 0" class="installation-section" :class="themeClasses.installSectionBorder">
            <div class="section-label" :class="themeClasses.installSectionLabel">In Queue ({{ installationStore.queue.length }})</div>
            <div class="app-list">
              <div v-for="(appName, index) in visibleQueue" :key="`queue-${index}-${appName}`" class="app-item" :class="[themeClasses.installAppItemBg, themeClasses.installAppItemBgHover]">
                <BaseImage :key="`img-queue-${index}-${appName}`" :src="getAppIcon(appName)" class="app-icon rounded-sm" alt="" draggable="false" />
                <span class="app-name" :class="themeClasses.installAppName">{{ appName }}</span>
              </div>
              <div v-if="remainingCount > 0" class="more-apps" :class="themeClasses.installMoreApps">And {{ remainingCount }} more...</div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useInstallationStore } from "../__Stores__/useInstallationStore";

import { useTheme } from "../__Themes__/ThemeSelector";

import BaseImage from "./BaseImage.vue";

const installationStore = useInstallationStore();
const { themeClasses } = useTheme();
const indicatorRef = ref<HTMLElement | null>(null);
const isExpanded = ref(false);

const MAX_VISIBLE = 5;

const isInstalling = computed(() => {
  return installationStore.currentlyInstalling !== null || installationStore.queue.length > 0;
});

const visibleQueue = computed(() => {
  const maxToShow = installationStore.currentlyInstalling ? MAX_VISIBLE - 1 : MAX_VISIBLE;
  return installationStore.queue.slice(0, maxToShow);
});

const remainingCount = computed(() => {
  const maxToShow = installationStore.currentlyInstalling ? MAX_VISIBLE - 1 : MAX_VISIBLE;
  return Math.max(0, installationStore.queue.length - maxToShow);
});

function getAppIcon(appName: string): string {
  return `docker-icons/${appName}.jpg`;
}

function toggleDropdown(e: MouseEvent) {
  e.stopPropagation();
  isExpanded.value = !isExpanded.value;
}

function closeDropdown() {
  isExpanded.value = false;
}

function handleClickOutside(event: MouseEvent) {
  if (indicatorRef.value && !indicatorRef.value.contains(event.target as Node)) {
    closeDropdown();
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.installation-indicator-wrapper {
  position: relative;
  user-select: none;
}

.installation-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  transition: all 0.15s ease;
  cursor: pointer;
}

.installation-dropdown {
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

.installation-section {
  padding: 0.75rem 0.875rem;
}

.installation-section:last-child {
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
  border-radius: 0.125rem;
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
</style>
