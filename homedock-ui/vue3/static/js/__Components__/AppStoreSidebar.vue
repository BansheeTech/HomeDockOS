<!-- homedock-ui/vue3/static/js/__Components__/AppStoreSidebar.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <aside :class="[themeClasses.fileExplorerSidebar]" class="w-52 flex-shrink-0 flex flex-col min-h-0 border-r">
    <div class="px-2.5 pt-2.5 pb-2">
      <div class="relative flex items-center">
        <Icon :icon="searchIcon" :class="[themeClasses.explorerSearchIcon]" class="absolute left-2 w-3.5 h-3.5 pointer-events-none" />
        <input :value="query" type="text" :placeholder="$t('Search apps...')" autocomplete="off" spellcheck="false" :class="[themeClasses.explorerSearchInput, themeClasses.explorerSearchInputText, themeClasses.explorerSearchInputFocusRing]" class="w-full h-7 pl-7 pr-6 rounded-md border text-xs outline-hidden transition-all duration-150" @input="emit('update:query', ($event.target as HTMLInputElement).value)" @keydown.esc="emit('update:query', '')" />
        <button v-if="query" type="button" :aria-label="$t('Clear')" :class="[themeClasses.explorerClearButton, themeClasses.explorerClearButtonHover]" class="absolute right-1 flex items-center justify-center w-5 h-5 rounded border-0 bg-transparent cursor-pointer" @click="emit('update:query', '')">
          <Icon :icon="closeIcon" class="w-3 h-3" />
        </button>
      </div>
    </div>

    <nav class="flex-1 overflow-y-auto px-2 pb-2">
      <button type="button" :class="itemClasses('discover')" class="nav-item" @click="emit('update:view', 'discover')">
        <AppIconGraphic :icon="discoverIcon" color="#0ea5e9" :size="NAV_TILE_SIZE" />
        <span class="truncate">{{ $t("Discover") }}</span>
      </button>

      <div :class="[themeClasses.fileExplorerSidebarSectionTitle]" class="text-[10px] font-semibold uppercase tracking-wider px-2 mt-3 mb-1 opacity-60">{{ $t("Categories") }}</div>
      <button v-for="category in categories" :key="category.name" type="button" :class="itemClasses(`category:${category.name}`)" class="nav-item" @click="emit('update:view', `category:${category.name}`)">
        <AppIconGraphic :icon="categoryStyle(category.name).icon" :color="categoryStyle(category.name).color" :size="NAV_TILE_SIZE" />
        <span class="truncate">{{ $t(category.name) }}</span>
        <span :class="[themeClasses.fileExplorerBadge]" class="text-[9px] px-1.5 rounded-full ml-auto tabular-nums">{{ category.count }}</span>
      </button>

      <div :class="[themeClasses.fileExplorerSidebarSectionTitle]" class="text-[10px] font-semibold uppercase tracking-wider px-2 mt-3 mb-1 opacity-60">{{ $t("Library") }}</div>
      <Transition name="nav-reveal">
        <button v-if="installingCount" type="button" :class="itemClasses('installing')" class="nav-item" @click="emit('update:view', 'installing')">
          <AppIconGraphic :icon="installingIcon" color="#6366f1" :size="NAV_TILE_SIZE" class="animate-pulse" />
          <span class="truncate">{{ $t("Installing Apps") }}</span>
          <span class="min-w-[18px] h-[18px] px-1.5 ml-auto rounded-full bg-blue-500 text-white text-[10px] font-semibold leading-[18px] text-center tabular-nums">+{{ installingCount }}</span>
        </button>
      </Transition>
      <button type="button" :class="itemClasses('installed')" class="nav-item" @click="emit('update:view', 'installed')">
        <AppIconGraphic :icon="installedIcon" color="#059669" :size="NAV_TILE_SIZE" />
        <span class="truncate">{{ $t("Installed Apps") }}</span>
        <span :class="[themeClasses.fileExplorerBadge]" class="text-[9px] px-1.5 rounded-full ml-auto tabular-nums">{{ installedCount }}</span>
      </button>
      <button type="button" :class="itemClasses('updates')" class="nav-item" @click="emit('update:view', 'updates')">
        <AppIconGraphic :icon="updatesIcon" color="#2563eb" :size="NAV_TILE_SIZE" />
        <span class="truncate">{{ $t("Updates") }}</span>
        <span v-if="updatesCount" class="min-w-[18px] h-[18px] px-1 ml-auto rounded-full bg-red-500 text-white text-[10px] font-semibold leading-[18px] text-center tabular-nums">{{ updatesCount }}</span>
      </button>
    </nav>

    <div :class="[themeClasses.fileExplorerSidebar]" class="border-t px-2 py-2">
      <button type="button" :class="[themeClasses.fileExplorerSidebarItem]" class="nav-item" @click="emit('add-own')">
        <AppIconGraphic :icon="packageIcon" color="#f59e0b" :size="NAV_TILE_SIZE" />
        <span class="truncate">{{ $t("Add your own apps") }}</span>
      </button>
    </div>
  </aside>
</template>

<script lang="ts" setup>
import { useTheme } from "../__Themes__/ThemeSelector";
import { categoryStyle } from "../__Config__/AppStoreCategories";

import { Icon } from "@iconify/vue";

import searchIcon from "@iconify-icons/mdi/magnify";
import closeIcon from "@iconify-icons/mdi/close";
import discoverIcon from "@iconify-icons/mdi/star-outline";
import installedIcon from "@iconify-icons/mdi/check-circle-outline";
import updatesIcon from "@iconify-icons/mdi/arrow-down-circle-outline";
import packageIcon from "@iconify-icons/mdi/package-variant";
import installingIcon from "@iconify-icons/mdi/tray-arrow-down";

import AppIconGraphic from "./AppIconGraphic.vue";

const NAV_TILE_SIZE = 18;

const props = defineProps<{
  view: string;
  query: string;
  categories: { name: string; count: number }[];
  installingCount: number;
  installedCount: number;
  updatesCount: number;
}>();

const emit = defineEmits<{
  (e: "update:view", view: string): void;
  (e: "update:query", query: string): void;
  (e: "add-own"): void;
}>();

const { themeClasses } = useTheme();

function itemClasses(id: string) {
  return !props.query && props.view === id ? themeClasses.value.fileExplorerSidebarItemActive : themeClasses.value.fileExplorerSidebarItem;
}
</script>

<style scoped>
.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.nav-reveal-enter-active,
.nav-reveal-leave-active {
  transition:
    opacity 0.2s ease,
    max-height 0.2s ease;
  max-height: 34px;
  overflow: hidden;
}

.nav-reveal-enter-from,
.nav-reveal-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
