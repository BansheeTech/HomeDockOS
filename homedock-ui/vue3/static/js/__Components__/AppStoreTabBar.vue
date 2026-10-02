<!-- homedock-ui/vue3/static/js/__Components__/AppStoreTabBar.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <nav :class="[themeClasses.fileExplorerSidebar]" class="flex-shrink-0 grid grid-cols-4 border-t">
    <button v-for="tab in tabs" :key="tab.id" type="button" :class="activeTab === tab.id ? 'text-blue-500' : themeClasses.storeCardSubtitle" class="relative flex flex-col items-center justify-center gap-0.5 h-[52px] min-w-0 px-1 cursor-pointer transition-colors duration-150" @click="emit('select', tab.id)">
      <span class="relative">
        <Icon :icon="activeTab === tab.id ? tab.activeIcon : tab.icon" class="w-6 h-6" />
        <span v-if="tab.id === 'updates' && updatesCount" class="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold leading-4 text-center tabular-nums">{{ updatesCount }}</span>
        <span v-else-if="tab.id === 'installed' && installingCount" class="absolute -top-1 -right-3 min-w-[16px] h-4 px-1 rounded-full bg-blue-500 text-white text-[10px] font-semibold leading-4 text-center tabular-nums">+{{ installingCount }}</span>
      </span>
      <span class="max-w-full text-[10px] font-medium truncate">{{ $t(tab.label) }}</span>
    </button>
  </nav>
</template>

<script lang="ts" setup>
import { computed } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import { Icon } from "@iconify/vue";

import discoverIcon from "@iconify-icons/mdi/star-outline";
import discoverActiveIcon from "@iconify-icons/mdi/star";
import categoriesIcon from "@iconify-icons/mdi/view-grid-outline";
import categoriesActiveIcon from "@iconify-icons/mdi/view-grid";
import installedIcon from "@iconify-icons/mdi/check-circle-outline";
import installedActiveIcon from "@iconify-icons/mdi/check-circle";
import updatesIcon from "@iconify-icons/mdi/arrow-down-circle-outline";
import updatesActiveIcon from "@iconify-icons/mdi/arrow-down-circle";

const props = defineProps<{
  view: string;
  updatesCount: number;
  installingCount: number;
}>();

const emit = defineEmits<{
  (e: "select", view: string): void;
}>();

const { themeClasses } = useTheme();

const tabs = [
  { id: "discover", label: "Discover", icon: discoverIcon, activeIcon: discoverActiveIcon },
  { id: "categories", label: "Categories", icon: categoriesIcon, activeIcon: categoriesActiveIcon },
  { id: "installed", label: "Library", icon: installedIcon, activeIcon: installedActiveIcon },
  { id: "updates", label: "Updates", icon: updatesIcon, activeIcon: updatesActiveIcon },
];

const activeTab = computed(() => {
  if (props.view.startsWith("category:")) return "categories";
  if (props.view === "installing") return "installed";
  return props.view;
});
</script>
