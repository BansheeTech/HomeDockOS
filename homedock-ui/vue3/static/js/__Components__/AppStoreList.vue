<!-- homedock-ui/vue3/static/js/__Components__/AppStoreList.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="mt-4" ref="rootRef">
    <Transition name="app-list-fade" mode="out-in">
      <div v-if="allApps.length" :key="listKey">
        <div :style="{ height: `${virtualizer.getTotalSize()}px`, position: 'relative', width: '100%' }">
          <div
            v-for="virtualRow in virtualizer.getVirtualItems()"
            :key="getRowKey(virtualRow.index)"
            :style="{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }"
          >
            <div class="virtual-row">
              <template v-for="colIdx in cols" :key="colIdx">
                <div v-if="getApp(virtualRow.index, colIdx - 1)" :class="[themeClasses.storeListSeparator]" class="grid-item border-b">
                  <AppStoreAppCard :app="getApp(virtualRow.index, colIdx - 1)!" @install="openModal" />
                </div>
                <div v-else class="grid-item"></div>
              </template>
            </div>
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
import { useVirtualizer } from "@tanstack/vue-virtual";

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

const rootRef = ref<HTMLElement | null>(null);
const scrollRef = ref<HTMLElement | null>(null);
const sentinel = ref<HTMLElement | null>(null);
const cols = ref(1);

let resizeObserver: ResizeObserver | null = null;
let sentinelObserver: IntersectionObserver | null = null;

const ROW_HEIGHT = 88;

const allApps = computed(() => appStore.infiniteApps);
const listKey = computed(() => `${appStore.searchQuery}-${appStore.selectedCategory}`);
const rowCount = computed(() => Math.ceil(allApps.value.length / cols.value));

const virtualizer = useVirtualizer(
  computed(() => ({
    count: rowCount.value,
    getScrollElement: () => scrollRef.value,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  })),
);

function getApp(rowIndex: number, colIndex: number): App | null {
  const idx = rowIndex * cols.value + colIndex;
  return allApps.value[idx] || null;
}

function getRowKey(rowIndex: number): string {
  const names: string[] = [];
  for (let c = 0; c < cols.value; c++) {
    const app = getApp(rowIndex, c);
    names.push(app ? app.name : `empty-${c}`);
  }
  return names.join("|");
}

function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement;
  while (node) {
    const style = getComputedStyle(node);
    if (style.overflowY === "auto" || style.overflowY === "scroll") {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

function updateCols() {
  if (!rootRef.value) return;
  const width = rootRef.value.clientWidth;
  if (width >= 1200) cols.value = 3;
  else if (width >= 800) cols.value = 2;
  else cols.value = 1;
}

function observeSentinel() {
  if (sentinelObserver) sentinelObserver.disconnect();

  sentinelObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting && appStore.hasMore) {
        appStore.loadMore();
      }
    },
    { rootMargin: "200px" },
  );

  if (sentinel.value) {
    sentinelObserver.observe(sentinel.value);
  }
}

onMounted(() => {
  scrollRef.value = findScrollParent(rootRef.value);

  updateCols();
  resizeObserver = new ResizeObserver(() => updateCols());
  if (rootRef.value) resizeObserver.observe(rootRef.value);

  observeSentinel();
});

watch(sentinel, () => {
  nextTick(() => observeSentinel());
});

watch(listKey, () => {
  nextTick(() => {
    virtualizer.value.scrollToIndex(0);
  });
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  sentinelObserver?.disconnect();
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

.virtual-row {
  display: grid;
  gap: 0;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  height: 100%;
}

@container window (min-width: 800px) {
  .virtual-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@container window (min-width: 1200px) {
  .virtual-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.grid-item {
  min-width: 0;
}
</style>
