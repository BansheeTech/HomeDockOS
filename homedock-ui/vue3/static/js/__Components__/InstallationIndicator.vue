<!-- homedock-ui/vue3/static/js/__Components__/InstallationIndicator.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Transition name="taskbar-item">
    <div v-if="isInstalling" class="installation-indicator-wrapper" ref="indicatorRef">
      <div class="installation-indicator" :class="[themeClasses.installIndicatorBg, themeClasses.installIndicatorIcon, themeClasses.installIndicatorBgHover, themeClasses.installIndicatorIconHover]" @click="toggle">
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

      <TrayPanel :open="isOpen" :anchor="indicatorRef" :title="$t('Installing Apps')" :subtitle="installationStore.queue.length ? $t('In Queue ({n})', { n: installationStore.queue.length }) : undefined" :icon="downloadIcon" icon-color="#3b82f6" @close="close">
        <TraySection v-if="installationStore.currentlyInstalling" :title="$t('Currently Installing')">
          <TransitionGroup name="app-switch" tag="div" class="relative">
            <TrayRow :key="`installing-${installationStore.currentlyInstalling}`" :title="getAppDisplayName(installationStore.currentlyInstalling)" highlighted>
              <template #leading>
                <AppIconGraphic :image-src="getAppIcon(installationStore.currentlyInstalling)" :size="28" />
              </template>
              <template #trailing>
                <Icon :icon="loadingIcon" class="w-4 h-4 flex-shrink-0 mr-1 text-blue-500 animate-spin" />
              </template>
            </TrayRow>
          </TransitionGroup>
        </TraySection>

        <TraySection v-if="installationStore.queue.length > 0" :title="$t('Queued')">
          <TransitionGroup name="queue-item" tag="div" class="relative">
            <TrayRow v-for="appName in visibleQueue" :key="`queue-${appName}`" :title="getAppDisplayName(appName)">
              <template #leading>
                <AppIconGraphic :image-src="getAppIcon(appName)" :size="28" />
              </template>
            </TrayRow>
          </TransitionGroup>
          <p v-if="remainingCount > 0" :class="[themeClasses.storeCardSubtitle]" class="m-0 px-1.5 pt-1 text-[11px]">{{ $t("And {n} more...", { n: remainingCount }) }}</p>
        </TraySection>
      </TrayPanel>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { useInstallationStore } from "../__Stores__/useInstallationStore";
import { useAppStore } from "../__Stores__/useAppStore";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useTrayPanel } from "../__Composables__/useTrayManager";

import { Icon } from "@iconify/vue";
import downloadIcon from "@iconify-icons/mdi/tray-arrow-down";
import loadingIcon from "@iconify-icons/mdi/loading";

import AppIconGraphic from "./AppIconGraphic.vue";
import TrayPanel from "./TrayPanel.vue";
import TraySection from "./TraySection.vue";
import TrayRow from "./TrayRow.vue";

const installationStore = useInstallationStore();
const appStore = useAppStore();
const { themeClasses } = useTheme();
const { isOpen, toggle, close } = useTrayPanel("installation-indicator");

const indicatorRef = ref<HTMLElement | null>(null);

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
  const app = appStore.apps.find((a) => a.name === appName);
  if (app && app.picture_path) {
    return app.picture_path;
  }
  return `docker-icons/${appName}.jpg`;
}

function getAppDisplayName(appName: string): string {
  const app = appStore.apps.find((a) => a.name === appName);
  if (app && app.display_name) {
    return app.display_name;
  }
  return appName;
}
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
