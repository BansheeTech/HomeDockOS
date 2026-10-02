<!-- homedock-ui/vue3/static/js/__Components__/AppUpdatesIndicator.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Transition name="taskbar-item">
    <div v-if="hasUpdates" class="updates-indicator-wrapper" ref="indicatorRef">
      <div class="updates-indicator" :class="[themeClasses.installIndicatorBg, themeClasses.installIndicatorBgHover]" @click="toggle">
        <Badge :count="updatesCount" size="small" :overflow-count="9" color="#488c00">
          <div :class="[themeClasses.installIndicatorIcon, themeClasses.installIndicatorIconHover]">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
              <rect width="24" height="24" fill="none" />
              <circle cx="12" cy="12" r="0" fill="currentColor">
                <animate fill="freeze" attributeName="r" begin="0.7s" dur="0.2s" values="0;4" />
              </circle>
              <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.3">
                <path stroke-dasharray="56" stroke-dashoffset="56" d="M12 4c4.42 0 8 3.58 8 8c0 4.42 -3.58 8 -8 8c-4.42 0 -8 -3.58 -8 -8c0 -4.42 3.58 -8 8 -8Z">
                  <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.6s" values="56;0" />
                </path>
                <path stroke-dasharray="4" stroke-dashoffset="4" d="M12 4v0M20 12h0M12 20v0M4 12h0" opacity="0">
                  <animate fill="freeze" attributeName="d" begin="1s" dur="0.2s" values="M12 4v0M20 12h0M12 20v0M4 12h0;M12 4v-2M20 12h2M12 20v2M4 12h-2" />
                  <animate fill="freeze" attributeName="stroke-dashoffset" begin="1s" dur="0.2s" values="4;0" />
                  <set fill="freeze" attributeName="opacity" begin="1s" to="1" />
                  <animateTransform attributeName="transform" dur="30s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12" />
                </path>
              </g>
            </svg>
          </div>
        </Badge>
      </div>

      <TrayPanel :open="isOpen" :anchor="indicatorRef" :title="$t('Updates Available')" :subtitle="$t('{n} Updates Available', { n: updatesCount })" :icon="updateIcon" icon-color="#16a34a" @close="close">
        <TraySection>
          <TransitionGroup :css="false" tag="div" @leave="collapseLeave">
            <TrayRow v-for="container in visibleUpdates" :key="`update-${container.name}`" :title="container.display_name" interactive @click="updateContainer(container.name)">
              <template #leading>
                <AppIconGraphic :image-src="getContainerIcon(container)" :size="28" />
              </template>
              <template #trailing>
                <span :class="[themeClasses.storeCardGetPill]" class="flex-shrink-0 h-6 px-3 rounded-full text-[11px] font-bold leading-6 transition-colors duration-150">{{ $t("Update") }}</span>
              </template>
            </TrayRow>
          </TransitionGroup>
          <p v-if="remainingCount > 0" :class="[themeClasses.storeCardSubtitle]" class="m-0 px-1.5 pt-1 text-[11px]">{{ $t("And {n} more...", { n: remainingCount }) }}</p>
        </TraySection>

        <template v-if="updatesCount > 1" #footer>
          <button type="button" class="flex items-center justify-center gap-1.5 w-full h-8 rounded-full border-0 bg-blue-600 text-white text-xs font-semibold cursor-pointer transition-colors duration-150 hover:bg-blue-500" @click="updateAll">
            <Icon :icon="updateAllIcon" class="w-3.5 h-3.5" />
            {{ $t("Update All ({n})", { n: updatesCount }) }}
          </button>
        </template>
      </TrayPanel>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";

import { Badge } from "ant-design-vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useDesktopStore } from "../__Stores__/desktopStore";
import { useAppUpdateStore } from "../__Stores__/useAppUpdateStore";
import { updateContainer as updateDockerContainer } from "../__Services__/DockerActions";
import { useTrayPanel } from "../__Composables__/useTrayManager";
import { collapseLeave } from "../__Utils__/collapseLeave";

import { Icon } from "@iconify/vue";
import updateIcon from "@iconify-icons/mdi/update";
import updateAllIcon from "@iconify-icons/mdi/tray-arrow-down";

import AppIconGraphic from "./AppIconGraphic.vue";
import TrayPanel from "./TrayPanel.vue";
import TraySection from "./TraySection.vue";
import TrayRow from "./TrayRow.vue";

const { themeClasses } = useTheme();
const csrfToken = useCsrfToken();
const desktopStore = useDesktopStore();
const updateStore = useAppUpdateStore();
const { isOpen, toggle, close } = useTrayPanel("app-updates-indicator");

const indicatorRef = ref<HTMLElement | null>(null);

const MAX_VISIBLE = 5;

const containersWithUpdates = computed(() => {
  return desktopStore.dockerApps.filter((app) => {
    return app.has_update === true && !updateStore.isUpdating(app.name);
  });
});

const hasUpdates = computed(() => {
  return containersWithUpdates.value.length > 0;
});

const updatesCount = computed(() => {
  return containersWithUpdates.value.length;
});

const visibleUpdates = computed(() => {
  return containersWithUpdates.value.slice(0, MAX_VISIBLE);
});

const remainingCount = computed(() => {
  return Math.max(0, containersWithUpdates.value.length - MAX_VISIBLE);
});

function getContainerIcon(container: any): string {
  if (container.image_path) {
    return container.image_path;
  }
  return `docker-icons/${container.name}.jpg`;
}

function updateContainer(containerName: string) {
  const app = desktopStore.dockerApps.find((a) => a.name === containerName);
  if (!app) {
    console.error("Container not found:", containerName);
    return;
  }

  updateDockerContainer(app, csrfToken.value);
}

function updateAll() {
  close();
  for (const container of containersWithUpdates.value) {
    const app = desktopStore.dockerApps.find((a) => a.name === container.name);
    if (app) updateDockerContainer(app, csrfToken.value);
  }
}
</script>

<style scoped>
.updates-indicator-wrapper {
  position: relative;
  user-select: none;
}

.updates-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  transition: all 0.15s ease;
  cursor: pointer;
  position: relative;
}

@keyframes blink {
  0%,
  80%,
  100% {
    opacity: 1;
  }
  90% {
    opacity: 0.2;
  }
}

:deep(.ant-scroll-number) {
  animation: blink 4s infinite;
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
