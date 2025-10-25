<!-- homedock-ui/vue3/static/js/__Components__/NetworkOfflineTray.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Transition name="taskbar-item">
    <div v-if="!online" class="network-offline-wrapper" ref="indicatorRef">
      <div class="network-offline-indicator" :class="[themeClasses.networkIndicatorBg, themeClasses.networkIndicatorIcon, themeClasses.networkIndicatorBgHover, themeClasses.networkIndicatorIconHover]" @click="toggleDropdown">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
          <rect width="24" height="24" fill="none" />
          <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
            <path stroke-dasharray="2 4" stroke-dashoffset="6" d="M2 8.82c5.52 -5.52 14.48 -5.52 20 0">
              <animate attributeName="stroke-dashoffset" dur="0.8s" repeatCount="indefinite" values="6;0" />
            </path>
            <path d="M5.74 12.56c3.59 -3.59 9.93 -3.59 13.52 0" opacity="0.7" />
            <path d="M9.48 16.3c1.66 -1.66 4.38 -1.66 6.04 0" opacity="0.5" />
            <circle cx="12" cy="20" r="1.25" opacity="0.3" />
            <line x1="2" y1="2" x2="22" y2="22" stroke-width="2">
              <animate attributeName="opacity" dur="1s" repeatCount="indefinite" values="0.3;0.8;0.3" />
            </line>
          </g>
        </svg>
      </div>

      <Transition name="dropdown">
        <div v-if="isExpanded" class="network-dropdown border" :class="[themeClasses.networkDropdownBg, themeClasses.networkDropdownBorder, themeClasses.networkDropdownShadow]">
          <div class="dropdown-header px-6 py-4 rounded-t-lg text-sm font-medium flex items-center space-x-3" :class="themeClasses.topBack">
            <span class="dropdown-title" :class="themeClasses.notTextUp">Connection Status</span>
          </div>

          <div class="network-section" :class="themeClasses.networkSectionBorder">
            <div class="status-item" :class="themeClasses.networkStatusItem">
              <Icon :icon="connectionIcon" class="status-icon" :class="themeClasses.networkStatusIconOffline" width="20" height="20" />
              <div class="status-info">
                <span class="status-label" :class="themeClasses.networkStatusLabel">Network Status</span>
                <span class="status-value offline" :class="themeClasses.networkStatusOffline">Disconnected</span>
              </div>
            </div>
          </div>

          <div class="network-section" :class="themeClasses.networkSectionBorder">
            <div class="help-text" :class="themeClasses.networkHelpText">
              <Icon :icon="infoIcon" class="help-icon" width="16" height="16" />
              <span>Unable to communicate with HomeDock OS. Please check your internet connection.</span>
            </div>
          </div>

          <div v-if="lastOnlineTime" class="network-section">
            <div class="time-info" :class="themeClasses.networkTimeInfo">
              <Icon :icon="clockIcon" class="time-icon" width="14" height="14" />
              <span class="time-text">Last online: {{ formatTime(lastOnlineTime) }}</span>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useTrayManager } from "../__Composables__/useTrayManager";

import { Icon } from "@iconify/vue";
import connectionIcon from "@iconify-icons/mdi/connection";
import infoIcon from "@iconify-icons/mdi/information-outline";
import clockIcon from "@iconify-icons/mdi/clock-outline";

const { themeClasses } = useTheme();
const trayManager = useTrayManager();

const TRAY_ID = "network-offline-tray";

const indicatorRef = ref<HTMLElement | null>(null);
const isExpanded = ref(false);
const online = ref(navigator.onLine);
const lastOnlineTime = ref<Date | null>(null);

function updateOnlineStatus() {
  const wasOffline = !online.value;
  online.value = navigator.onLine;

  if (wasOffline && online.value) {
    isExpanded.value = false;
  } else if (!online.value && !lastOnlineTime.value) {
    lastOnlineTime.value = new Date();
  } else if (online.value) {
    lastOnlineTime.value = null;
  }
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // seconds

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleTimeString();
}

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
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
  document.addEventListener("click", handleClickOutside);

  if (!online.value) {
    lastOnlineTime.value = new Date();
  }
});

onUnmounted(() => {
  window.removeEventListener("online", updateOnlineStatus);
  window.removeEventListener("offline", updateOnlineStatus);
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.network-offline-wrapper {
  position: relative;
  user-select: none;
}

.network-offline-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  transition: all 0.15s ease;
  cursor: pointer;
}

.network-dropdown {
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

.network-section {
  padding: 0.75rem 0.875rem;
}

.network-section:last-child {
  border-bottom: none;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 6px;
}

.status-icon {
  flex-shrink: 0;
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
}

.status-label {
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.7;
}

.status-value {
  font-size: 0.875rem;
  font-weight: 600;
}

.help-text {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.75rem;
  line-height: 1.4;
  padding: 0.5rem;
  border-radius: 6px;
}

.help-icon {
  flex-shrink: 0;
  margin-top: 0.125rem;
  opacity: 0.7;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.625rem;
  opacity: 0.6;
  padding: 0.25rem 0.5rem;
}

.time-icon {
  flex-shrink: 0;
}

.time-text {
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
