<!-- homedock-ui/vue3/static/js/__Components__/PackagerSidebar.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <aside :class="[themeClasses.fileExplorerSidebar]" class="w-52 flex-shrink-0 flex flex-col min-h-0 border-r">
    <nav class="flex-1 overflow-y-auto px-2 py-2.5">
      <template v-for="item in PACKAGER_SECTIONS" :key="item.id">
        <div v-if="item.group" :class="[themeClasses.fileExplorerSidebarSectionTitle]" class="text-[10px] font-semibold uppercase tracking-wider px-2 mt-3 mb-1 opacity-60">{{ $t(item.group) }}</div>
        <button type="button" :class="view === item.id ? themeClasses.fileExplorerSidebarItemActive : themeClasses.fileExplorerSidebarItem" class="nav-item" @click="emit('select', item.id)">
          <AppIconGraphic :icon="item.icon" :color="item.color" :size="NAV_TILE_SIZE" />
          <span class="truncate">{{ $t(item.label) }}</span>
          <Icon v-if="busy[item.id]" :icon="loadingIcon" class="w-3.5 h-3.5 ml-auto flex-shrink-0 animate-spin opacity-70" />
          <span v-else-if="counts[item.id] !== undefined" :class="[themeClasses.fileExplorerBadge]" class="text-[9px] px-1.5 rounded-full ml-auto tabular-nums">{{ counts[item.id] }}</span>
        </button>
      </template>
    </nav>
  </aside>
</template>

<script lang="ts">
import packageIcon from "@iconify-icons/mdi/package-variant";
import storeIcon from "@iconify-icons/mdi/storefront-outline";
import plusIcon from "@iconify-icons/mdi/plus-thick";
import swapIcon from "@iconify-icons/mdi/swap-horizontal";

import type { PackagerView } from "../__Composables__/usePackager";

export const PACKAGER_SECTIONS: { id: PackagerView; label: string; icon: any; color: string; group?: string }[] = [
  { id: "packages", label: "My Packages", icon: packageIcon, color: "#3b82f6" },
  { id: "stores", label: "Third-Party Stores", icon: storeIcon, color: "#f59e0b" },
  { id: "create", label: "Create Package", icon: plusIcon, color: "#059669" },
  { id: "transfer", label: "Import & Export", icon: swapIcon, color: "#8b5cf6", group: "Advanced" },
];
</script>

<script lang="ts" setup>
import { useTheme } from "../__Themes__/ThemeSelector";

import { Icon } from "@iconify/vue";
import loadingIcon from "@iconify-icons/mdi/loading";

import AppIconGraphic from "./AppIconGraphic.vue";

const NAV_TILE_SIZE = 18;

defineProps<{
  view: PackagerView;
  counts: Partial<Record<PackagerView, number>>;
  busy: Partial<Record<PackagerView, boolean>>;
}>();

const emit = defineEmits<{
  (e: "select", view: PackagerView): void;
}>();

const { themeClasses } = useTheme();
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
</style>
