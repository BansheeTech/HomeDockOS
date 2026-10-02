<!-- homedock-ui/vue3/static/js/__Components__/UpdateIndicator.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Transition name="taskbar-item">
    <div v-if="isUpdating || isCheckingUpdates" class="update-indicator-wrapper" ref="indicatorRef">
      <div class="update-indicator" :class="[themeClasses.updateIndicatorBg, themeClasses.updateIndicatorIcon, themeClasses.updateIndicatorBgHover, themeClasses.updateIndicatorIconHover]" @click="toggle">
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

      <TrayPanel :open="isOpen" :anchor="indicatorRef" :title="isCheckingUpdates ? $t('Checking Updates') : $t('Updating Apps')" :subtitle="updateStore.queue.length ? $t('In Queue ({n})', { n: updateStore.queue.length }) : undefined" :icon="refreshIcon" icon-color="#8b5cf6" :icon-spin="isCheckingUpdates" @close="close">
        <TraySection v-if="isCheckingUpdates">
          <TrayRow :title="$t('Checking for updates...')" highlighted>
            <template #leading>
              <span class="flex items-center justify-center w-7 h-7 flex-shrink-0">
                <Icon :icon="loadingIcon" class="w-4 h-4 text-blue-500 animate-spin" />
              </span>
            </template>
          </TrayRow>
        </TraySection>

        <TraySection v-if="updateStore.currentlyUpdating" :title="$t('Currently Updating')">
          <TransitionGroup name="app-switch" tag="div" class="relative">
            <TrayRow :key="`updating-${updateStore.currentlyUpdating.name}`" :title="updateStore.currentlyUpdating.display_name" highlighted>
              <template #leading>
                <AppIconGraphic :image-src="updateStore.currentlyUpdating.image_path || `docker-icons/${updateStore.currentlyUpdating.name}.jpg`" :size="28" />
              </template>
              <template #trailing>
                <Icon :icon="loadingIcon" class="w-4 h-4 flex-shrink-0 mr-1 text-blue-500 animate-spin" />
              </template>
            </TrayRow>
          </TransitionGroup>
        </TraySection>

        <TraySection v-if="updateStore.queue.length > 0" :title="$t('Queued')">
          <TransitionGroup name="queue-item" tag="div" class="relative">
            <TrayRow v-for="appInfo in visibleQueue" :key="`queue-${appInfo.name}`" :title="appInfo.display_name">
              <template #leading>
                <AppIconGraphic :image-src="appInfo.image_path || `docker-icons/${appInfo.name}.jpg`" :size="28" />
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

import { useAppUpdateStore } from "../__Stores__/useAppUpdateStore";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useTrayPanel } from "../__Composables__/useTrayManager";

import { Icon } from "@iconify/vue";
import refreshIcon from "@iconify-icons/mdi/refresh";
import loadingIcon from "@iconify-icons/mdi/loading";

import AppIconGraphic from "./AppIconGraphic.vue";
import TrayPanel from "./TrayPanel.vue";
import TraySection from "./TraySection.vue";
import TrayRow from "./TrayRow.vue";

const updateStore = useAppUpdateStore();
const { themeClasses } = useTheme();
const { isOpen, toggle, close } = useTrayPanel("update-indicator");

const indicatorRef = ref<HTMLElement | null>(null);

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
