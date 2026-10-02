<!-- homedock-ui/vue3/static/js/__Components__/AppStoreList.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div ref="rootRef">
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
            <div class="grid gap-x-6 h-full" :style="{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }">
              <template v-for="colIdx in cols" :key="colIdx">
                <AppStoreAppCard v-if="getApp(virtualRow.index, colIdx - 1)" :app="getApp(virtualRow.index, colIdx - 1)!" />
                <div v-else></div>
              </template>
            </div>
          </div>
        </div>

        <div v-if="appStore.hasMore" ref="sentinel" class="flex justify-center py-4">
          <Icon :icon="loadingIcon" :class="[themeClasses.storeCardSubtitle]" class="w-5 h-5 animate-spin" />
        </div>
      </div>

      <Empty v-else :class="[themeClasses.storeEmptyText]" class="py-10" :description="emptyText || $t('No applications available under this search term')"></Empty>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useVirtualizer } from "@tanstack/vue-virtual";

import { useTheme } from "../__Themes__/ThemeSelector";

import { useAppStore } from "../__Stores__/useAppStore";

import { App } from "../__Types__/AppStoreApp";

import { Empty } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import loadingIcon from "@iconify-icons/mdi/loading";

import AppStoreAppCard from "../__Components__/AppStoreAppCard.vue";

defineProps<{
  emptyText?: string;
}>();

const { themeClasses } = useTheme();

const appStore = useAppStore();

const rootRef = ref<HTMLElement | null>(null);
const scrollRef = ref<HTMLElement | null>(null);
const sentinel = ref<HTMLElement | null>(null);
const cols = ref(1);

let resizeObserver: ResizeObserver | null = null;
let sentinelObserver: IntersectionObserver | null = null;

const ROW_HEIGHT = 76;

const allApps = computed(() => appStore.infiniteApps);
const listKey = computed(() => [appStore.searchQuery, appStore.selectedCategory, appStore.installedOnly, appStore.sortMode].join("|"));
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
  if (width >= 900) cols.value = 3;
  else if (width >= 560) cols.value = 2;
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
</script>

<style scoped>
.app-list-fade-enter-active,
.app-list-fade-leave-active {
  transition: opacity 0.15s ease;
}

.app-list-fade-enter-from,
.app-list-fade-leave-to {
  opacity: 0;
}
</style>
