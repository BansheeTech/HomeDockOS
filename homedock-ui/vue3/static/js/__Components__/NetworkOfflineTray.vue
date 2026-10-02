<!-- homedock-ui/vue3/static/js/__Components__/NetworkOfflineTray.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Transition name="taskbar-item">
    <div v-if="!online" class="network-offline-wrapper" ref="indicatorRef">
      <div class="network-offline-indicator" :class="[themeClasses.networkIndicatorBg, themeClasses.networkIndicatorIcon, themeClasses.networkIndicatorBgHover, themeClasses.networkIndicatorIconHover]" @click="toggle">
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

      <TrayPanel :open="isOpen" :anchor="indicatorRef" :title="$t('Connection Status')" :subtitle="lastOnlineTime ? `${$t('Last online')}: ${formatTime(lastOnlineTime)}` : undefined" :icon="wifiOffIcon" icon-color="#ef4444" @close="close">
        <div class="px-1.5 pt-1 space-y-2.5">
          <div :class="[themeClasses.storeInfoBar]" class="flex items-center gap-3 px-3 py-2.5 rounded-xl border">
            <span class="relative flex w-2.5 h-2.5 flex-shrink-0">
              <span class="absolute inset-0 rounded-full bg-red-500 opacity-60 animate-ping"></span>
              <span class="relative w-2.5 h-2.5 rounded-full bg-red-500"></span>
            </span>
            <span :class="[themeClasses.storeCardSubtitle]" class="flex-1 min-w-0 text-xs truncate">{{ $t("Network Status") }}</span>
            <span class="flex-shrink-0 text-xs font-semibold text-red-500">{{ $t("Disconnected") }}</span>
          </div>
          <p :class="[themeClasses.storeCardSubtitle]" class="m-0 px-1 pb-1 text-xs leading-relaxed">{{ $t("Unable to communicate with HomeDock OS. Please check your internet connection.") }}</p>
        </div>
      </TrayPanel>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useTrayPanel } from "../__Composables__/useTrayManager";

import wifiOffIcon from "@iconify-icons/mdi/wifi-off";

import TrayPanel from "./TrayPanel.vue";

const { themeClasses } = useTheme();
const { isOpen, toggle, close } = useTrayPanel("network-offline-tray");

const indicatorRef = ref<HTMLElement | null>(null);
const online = ref(navigator.onLine);
const lastOnlineTime = ref<Date | null>(null);

function updateOnlineStatus() {
  const wasOffline = !online.value;
  online.value = navigator.onLine;

  if (wasOffline && online.value) {
    close();
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

onMounted(() => {
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);

  if (!online.value) {
    lastOnlineTime.value = new Date();
  }
});

onUnmounted(() => {
  window.removeEventListener("online", updateOnlineStatus);
  window.removeEventListener("offline", updateOnlineStatus);
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
