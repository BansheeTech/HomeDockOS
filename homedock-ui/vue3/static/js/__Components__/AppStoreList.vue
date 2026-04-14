<!-- homedock-ui/vue3/static/js/__Components__/AppStoreList.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="mt-4">
    <Transition name="app-list-fade" mode="out-in">
      <div v-if="visibleApps.length" :key="listKey" class="app-store-grid">
        <div class="grid-container">
          <div v-for="item in visibleApps" :key="item.name" :class="[themeClasses.storeListSeparator]" class="grid-item border-b last:border-b-0">
            <AppStoreAppCard :app="item" @install="openModal" />
          </div>
        </div>

      <div v-if="appStore.hasMore" ref="sentinel" class="flex justify-center py-4">
        <Icon :icon="loadingIcon" :class="[themeClasses.storeCardSubtitle]" class="w-5 h-5 animate-spin" />
      </div>
    </div>

      <Empty v-else :class="[themeClasses.storeEmptyText]" description="No applications available under this search term"></Empty>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import { useAppStore } from "../__Stores__/useAppStore";
import { useWindowStore } from "../__Stores__/windowStore";

import { App } from "../__Types__/AppStoreApp";

import { Empty } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import loadingIcon from "@iconify-icons/mdi/loading";

import AppStoreAppCard from "../__Components__/AppStoreAppCard.vue";

const { themeClasses } = useTheme();

const appStore = useAppStore();
const windowStore = useWindowStore();

const sentinel = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

const visibleApps = computed(() => appStore.infiniteApps);
const listKey = computed(() => `${appStore.searchQuery}-${appStore.selectedCategory}`);

const observeSentinel = () => {
  if (observer) observer.disconnect();

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting && appStore.hasMore) {
        appStore.loadMore();
      }
    },
    { rootMargin: "200px" }
  );

  if (sentinel.value) {
    observer.observe(sentinel.value);
  }
};

onMounted(() => {
  observeSentinel();
});

watch(sentinel, () => {
  nextTick(() => observeSentinel());
});

onUnmounted(() => {
  observer?.disconnect();
});

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
/* Transition > List fade on filter change */
.app-list-fade-enter-active,
.app-list-fade-leave-active {
  transition: opacity 0.15s ease;
}

.app-list-fade-enter-from,
.app-list-fade-leave-to {
  opacity: 0;
}


.grid-container {
  display: grid;
  gap: 0;
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

@container window (min-width: 800px) {
  .grid-container {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@container window (min-width: 1200px) {
  .grid-container {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.grid-item {
  min-width: 0;
}
</style>
