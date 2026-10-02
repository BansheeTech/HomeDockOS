<!-- homedock-ui/vue3/static/js/__Components__/AppStoreCategoryList.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="flex flex-col gap-6">
    <div :class="[themeClasses.storeInfoBar]" class="rounded-xl border overflow-hidden">
      <template v-for="(category, index) in categories" :key="category.name">
        <div v-if="index > 0" :class="[themeClasses.storeInfoBarDivider]" class="h-px ml-[52px]"></div>
        <button type="button" class="w-full flex items-center gap-3 h-11 px-3 text-left cursor-pointer" @click="emit('select', category.name)">
          <AppIconGraphic :icon="categoryStyle(category.name).icon" :color="categoryStyle(category.name).color" :size="28" />
          <span :class="[themeClasses.storeModalAppName]" class="flex-1 min-w-0 text-sm truncate">{{ $t(category.name) }}</span>
          <span :class="[themeClasses.storeCardSubtitle]" class="text-sm tabular-nums">{{ category.count }}</span>
          <Icon :icon="chevronRightIcon" :class="[themeClasses.storeCardSubtitle]" class="w-5 h-5 -mr-1 flex-shrink-0" />
        </button>
      </template>
    </div>

    <div :class="[themeClasses.storeInfoBar]" class="rounded-xl border overflow-hidden">
      <button type="button" class="w-full flex items-center gap-3 h-11 px-3 text-left cursor-pointer" @click="emit('add-own')">
        <AppIconGraphic :icon="packageIcon" color="#f59e0b" :size="28" />
        <span :class="[themeClasses.storeModalAppName]" class="flex-1 min-w-0 text-sm truncate">{{ $t("Add your own apps") }}</span>
        <Icon :icon="chevronRightIcon" :class="[themeClasses.storeCardSubtitle]" class="w-5 h-5 -mr-1 flex-shrink-0" />
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useTheme } from "../__Themes__/ThemeSelector";
import { categoryStyle } from "../__Config__/AppStoreCategories";

import { Icon } from "@iconify/vue";
import chevronRightIcon from "@iconify-icons/mdi/chevron-right";
import packageIcon from "@iconify-icons/mdi/package-variant";

import AppIconGraphic from "./AppIconGraphic.vue";

defineProps<{
  categories: { name: string; count: number }[];
}>();

const emit = defineEmits<{
  (e: "select", category: string): void;
  (e: "add-own"): void;
}>();

const { themeClasses } = useTheme();
</script>
