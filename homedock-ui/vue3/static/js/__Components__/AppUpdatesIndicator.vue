<!-- homedock-ui/vue3/static/js/__Components__/AppUpdatesIndicator.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Transition name="taskbar-item">
    <div v-if="hasUpdates" class="updates-indicator-wrapper" ref="indicatorRef">
      <div class="updates-indicator" :class="[themeClasses.installIndicatorBg, themeClasses.installIndicatorBgHover]" @click="toggleDropdown">
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

      <Transition name="dropdown">
        <Teleport to="body">
          <div v-if="isExpanded" class="updates-dropdown border" :class="[themeClasses.installDropdownBg, themeClasses.installDropdownBorder, themeClasses.installDropdownShadow]">
            <div class="dropdown-header px-6 py-4 rounded-t-lg text-sm font-medium flex items-center space-x-3" :class="themeClasses.topBack">
              <span class="dropdown-title" :class="themeClasses.notTextUp">Updates Available</span>
            </div>

            <div v-if="containersWithUpdates.length > 0" class="updates-section" :class="themeClasses.installSectionBorder">
              <div class="section-label" :class="themeClasses.installSectionLabel">{{ updatesCount }} Update{{ updatesCount > 1 ? "s" : "" }} Available</div>
              <div class="app-list">
                <TransitionGroup name="app-switch" tag="div">
                  <div v-for="container in visibleUpdates" :key="`update-${container.name}`" class="app-item" :class="[themeClasses.installAppItemBg, themeClasses.installAppItemBgHover]" @click="updateContainer(container.name)">
                    <BaseImage :key="`img-update-${container.name}`" :src="getContainerIcon(container)" class="app-icon rounded-md" alt="" draggable="false" />
                    <span class="app-name" :class="themeClasses.installAppName">{{ container.display_name }}</span>
                    <div class="update-arrow" :class="themeClasses.installAppName">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 5v14M19 12l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </TransitionGroup>
                <div v-if="remainingCount > 0" class="more-apps" :class="themeClasses.installMoreApps">And {{ remainingCount }} more...</div>
              </div>
            </div>
          </div>
        </Teleport>
      </Transition>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";

import { Badge } from "ant-design-vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useDesktopStore } from "../__Stores__/desktopStore";
import { useAppUpdateStore } from "../__Stores__/useAppUpdateStore";
import { updateContainer as updateDockerContainer } from "../__Services__/DockerActions";
import { useTrayManager } from "../__Composables__/useTrayManager";

import BaseImage from "./BaseImage.vue";

const { themeClasses } = useTheme();
const csrfToken = useCsrfToken();
const desktopStore = useDesktopStore();
const updateStore = useAppUpdateStore();
const trayManager = useTrayManager();

const TRAY_ID = "app-updates-indicator";

const indicatorRef = ref<HTMLElement | null>(null);
const isExpanded = ref(false);

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
  closeDropdown();

  const app = desktopStore.dockerApps.find((a) => a.name === containerName);
  if (!app) {
    console.error("Container not found:", containerName);
    return;
  }

  updateDockerContainer(app, csrfToken.value);
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
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
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

.updates-dropdown {
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

.updates-section {
  padding: 0.75rem 0.875rem;
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
  cursor: pointer;
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

.update-arrow {
  flex-shrink: 0;
  opacity: 0.6;
  transition: opacity 0.15s ease;
}

.app-item:hover .update-arrow {
  opacity: 1;
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
</style>
