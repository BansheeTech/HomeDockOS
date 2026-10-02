<!-- homedock-ui/vue3/static/js/__Components__/PackagerTabBar.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <nav :class="[themeClasses.fileExplorerSidebar]" class="flex-shrink-0 grid grid-cols-4 border-t">
    <button v-for="item in PACKAGER_SECTIONS" :key="item.id" type="button" :class="view === item.id ? 'text-blue-500' : themeClasses.storeCardSubtitle" class="flex flex-col items-center justify-center gap-0.5 h-[52px] min-w-0 px-1 cursor-pointer transition-colors duration-150" @click="emit('select', item.id)">
      <span class="relative">
        <Icon :icon="item.icon" class="w-6 h-6" />
        <span v-if="busy[item.id]" class="absolute -top-1 -right-2 flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white">
          <Icon :icon="loadingIcon" class="w-3 h-3 animate-spin" />
        </span>
      </span>
      <span class="max-w-full text-[10px] font-medium truncate">{{ $t(item.label) }}</span>
    </button>
  </nav>
</template>

<script lang="ts" setup>
import { useTheme } from "../__Themes__/ThemeSelector";
import { PACKAGER_SECTIONS } from "./PackagerSidebar.vue";

import { Icon } from "@iconify/vue";
import loadingIcon from "@iconify-icons/mdi/loading";

import type { PackagerView } from "../__Composables__/usePackager";

defineProps<{
  view: PackagerView;
  busy: Partial<Record<PackagerView, boolean>>;
}>();

const emit = defineEmits<{
  (e: "select", view: PackagerView): void;
}>();

const { themeClasses } = useTheme();
</script>
