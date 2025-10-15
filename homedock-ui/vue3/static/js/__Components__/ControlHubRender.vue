<!-- homedock-ui/vue3/static/js/__Components__/ControlHubRender.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="relative">
    <Transition name="fade">
      <div v-if="isLoading" class="absolute inset-0 h-32 flex justify-center items-center z-10">
        <Icon :icon="loadingIcon" class="text-blue-600 animate-spin" width="60" height="60" />
      </div>
    </Transition>

    <Transition name="fade">
      <template v-if="!isLoading">
        <div v-if="apps.length > 0" class="control-hub-grid">
          <TransitionGroup name="control-list" tag="div" class="grid-container">
            <div v-for="item in apps.filter((app: App) => app.HDRole !== 'dependency')" :key="item.name" class="grid-item">
              <ControlHubApp :app="item" />
            </div>
          </TransitionGroup>
        </div>
        <div v-else class="empty-state-container">
          <AnimatedIcon :icons="[iconAnim1, iconAnim2, iconAnim3, iconAnim4, iconAnim3, iconAnim2]" :interval="1000" :iconSize="64" :containerClass="themeClasses.noAppsIcon" class="transition duration-500 hover:-translate-y-2 hover:scale-105" />
          <p :class="[themeClasses.noAppsTextMain]" class="text-sm text-center text-balance empty-title">No apps installed yet</p>
          <p :class="[themeClasses.noAppsTextMain]" class="text-sm text-center text-balance empty-description">Get started by installing your first application from the App Store</p>
          <button class="install-app-button" @click="openAppStore">
            <Icon :icon="widgetsOutlineIcon" class="button-icon" />
            <span>Browse App Store</span>
          </button>
        </div>
      </template>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { useTheme } from "../__Themes__/ThemeSelector";
import { useDesktopStore } from "../__Stores__/desktopStore";

import ControlHubApp from "../__Components__/ControlHubApp.vue";
import AnimatedIcon from "../__Components__/AnimatedIcon.vue";

import { Icon } from "@iconify/vue";
import loadingIcon from "@iconify-icons/mdi/loading";
import widgetsOutlineIcon from "@iconify-icons/mdi/widgets-outline";
import iconAnim1 from "@iconify-icons/mdi/hexagon-outline";
import iconAnim2 from "@iconify-icons/mdi/hexagon-slice-2";
import iconAnim3 from "@iconify-icons/mdi/hexagon-slice-4";
import iconAnim4 from "@iconify-icons/mdi/hexagon-slice-6";

interface App {
  HDRole?: string;
  name: string;
  image: string;
}
defineProps({
  apps: {
    type: Array as () => App[],
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
});

const { themeClasses } = useTheme();
const desktopStore = useDesktopStore();

function openAppStore() {
  desktopStore.openSystemApp("appstore");
}
</script>

<style scoped>
/* Fade Transition */
.fade-move,
.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.fade-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Control List Transition */
.control-list-enter-active,
.control-list-leave-active {
  transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
  overflow: hidden;
}

.control-list-enter-from {
  max-height: 0;
  opacity: 0;
  transform: scale(1);
}

.control-list-enter-to {
  max-height: 195px;
  opacity: 1;
  transform: scale(1);
}

.control-list-leave-from {
  max-height: 195px;
  opacity: 1;
  transform: scale(1);
}

.control-list-leave-to {
  max-height: 0;
  opacity: 0;
  transform: scale(1);
}

.grid-container {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

@container window (min-width: 600px) {
  .grid-container {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@container window (min-width: 900px) {
  .grid-container {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@container window (min-width: 1200px) {
  .grid-container {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@container window (min-width: 1500px) {
  .grid-container {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

.grid-item {
  min-width: 0;
}

.empty-state-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem 1rem;
  gap: 1rem;
}

.empty-title {
  margin-top: 0.5rem;
  font-weight: 600;
}

.empty-description {
  margin-bottom: 0.5rem;
}

.install-app-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  margin-top: 0.5rem;
  background: rgba(59, 130, 246, 0.9);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.install-app-button:hover {
  background: rgba(59, 130, 246, 1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.install-app-button .button-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
</style>
