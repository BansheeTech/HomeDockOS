<!-- homedock-ui/vue3/static/js/__Components__/AppStoreList.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="mt-4">
    <div v-if="visibleApps.length" class="app-store-grid">
      <TransitionGroup name="app-list" tag="div" class="grid-container">
        <div v-for="item in visibleApps" :key="item.name" class="grid-item">
          <AppStoreAppCard :app="item" @install="openModal" />
        </div>
      </TransitionGroup>
    </div>

    <Empty v-else :class="[themeClasses.storeEmptyText]" description="No applications available under this search term"></Empty>

    <Pagination :class="[themeClasses.scopeSelector]" :current="appStore.currentPage" :pageSize="appStore.appsPerPage" :total="appStore.filteredAppsTotal" @change="appStore.setPage" :showSizeChanger="false" :pageSizeOptions="[15, 30, 45]" :responsive="true" :simple="false" class="mt-4 text-center" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import { useAppStore } from "../__Stores__/useAppStore";
import { useWindowStore } from "../__Stores__/windowStore";

import { App } from "../__Types__/AppStoreApp";

import { Empty, Pagination } from "ant-design-vue";

import AppStoreAppCard from "../__Components__/AppStoreAppCard.vue";

const { themeClasses } = useTheme();

const appStore = useAppStore();
const windowStore = useWindowStore();

const visibleApps = computed(() => appStore.filteredApps);

const openModal = (app: App) => {
  const selectedAppFromStore = appStore.apps.find((a) => a.name === app.name) || app;

  const existingWindow = windowStore.windows.find((w) => w.appId === "installconfig" && w.data?.app?.name === selectedAppFromStore.name);

  if (existingWindow) {
    windowStore.focusWindow(existingWindow.id);
    if (existingWindow.isMinimized) {
      existingWindow.isMinimized = false;
    }
    return;
  }

  const displayName = selectedAppFromStore.display_name || selectedAppFromStore.name;

  windowStore.openWindow("installconfig", {
    title: `Install ${displayName}`,
    data: { app: selectedAppFromStore },
    allowMultiple: true,
  });
};
</script>

<style scoped>
/* Transitions > App Card Moving */
.app-list-enter-active,
.app-list-leave-active {
  transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
  overflow: hidden;
}

.app-list-enter-from {
  max-height: 0;
  opacity: 0;
  transform: scale(1);
}

.app-list-enter-to {
  max-height: 195px;
  opacity: 1;
  transform: scale(1);
}

.app-list-leave-from {
  max-height: 195px;
  opacity: 1;
  transform: scale(1);
}

.app-list-leave-to {
  max-height: 0;
  opacity: 0;
  transform: scale(1);
}

/* Ant D Styles Overrides */
::v-deep(.dark-mode-theme .ant-pagination-item) {
  background-color: rgb(36, 36, 36) !important;
  color: rgb(255, 255, 255) !important;
}
::v-deep(.aero-mode-theme .ant-pagination-item) {
  background-color: rgba(36, 36, 36, 0.2) !important;
  color: rgb(255, 255, 255) !important;
}

::v-deep(.dark-mode-theme.ant-pagination .ant-pagination-item a) {
  color: white !important;
}

::v-deep(.aero-mode-theme.ant-pagination .ant-pagination-item a) {
  color: white !important;
}

::v-deep(.dark-mode-theme.ant-pagination .ant-pagination-item-link) {
  color: rgb(119, 119, 119) !important;
}

::v-deep(.aero-mode-theme.ant-pagination .ant-pagination-item-link) {
  color: rgb(119, 119, 119, 0.75) !important;
}

::v-deep(.dark-mode-theme.ant-pagination .ant-pagination-item-ellipsis) {
  color: rgb(119, 119, 119) !important;
}

::v-deep(.aero-mode-theme.ant-pagination .ant-pagination-item-ellipsis) {
  color: rgb(119, 119, 119, 0.75) !important;
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
</style>
