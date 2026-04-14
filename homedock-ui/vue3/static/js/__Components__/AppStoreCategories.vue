<!-- homedock-ui/vue3/static/js/__Components__/AppStoreCategories.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="categories-scroll flex gap-2 overflow-x-auto py-2">
    <button @click="selectCategory('')" :class="[selectedCategory === '' ? themeClasses.storeCategoryPillActive : themeClasses.storeCategoryPill]" class="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200">
      <Icon :icon="allInclusiveIcon" class="h-3.5 w-3.5" />
      All
    </button>

    <button v-for="category in categories" :key="category" @click="selectCategory(category)" :class="[selectedCategory === category ? themeClasses.storeCategoryPillActive : themeClasses.storeCategoryPill]" class="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200">
      <Icon v-if="icons[category as Category]" :icon="icons[category as Category]" class="h-3.5 w-3.5" />
      {{ category }}
    </button>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import { Icon } from "@iconify/vue";
import type { IconifyIcon } from "@iconify/vue";

import allInclusiveIcon from "@iconify-icons/mdi/all-inclusive";
import aiIcon from "@iconify-icons/mdi/robot";
import devToolsIcon from "@iconify-icons/mdi/toolbox";
import filesIcon from "@iconify-icons/mdi/file-document-box";
import gamingIcon from "@iconify-icons/mdi/gamepad";
import homeAutomationIcon from "@iconify-icons/mdi/home-automation";
import mediaIcon from "@iconify-icons/mdi/movie-open";
import networkingIcon from "@iconify-icons/mdi/lan";
import socialIcon from "@iconify-icons/mdi/message-text";
import webDevIcon from "@iconify-icons/mdi/web";

import { useAppStore } from "../__Stores__/useAppStore";

type Category = "AI" | "Developer Tools" | "Files & Productivity" | "Gaming" | "Home & Automation" | "Media" | "Networking" | "Social" | "Web Development";

const icons: Record<Category, IconifyIcon> = {
  AI: aiIcon,
  "Developer Tools": devToolsIcon,
  "Files & Productivity": filesIcon,
  Gaming: gamingIcon,
  "Home & Automation": homeAutomationIcon,
  Media: mediaIcon,
  Networking: networkingIcon,
  Social: socialIcon,
  "Web Development": webDevIcon,
};

const { themeClasses } = useTheme();

const appStore = useAppStore();

const categories = computed(() => {
  return Array.from(new Set(appStore.apps.map((app) => app.category)));
});

const selectedCategory = computed(() => appStore.selectedCategory);

const selectCategory = (category: string) => {
  appStore.setCategoryFilter(category);
};
</script>

<style scoped>
.categories-scroll {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.categories-scroll::-webkit-scrollbar {
  display: none;
}
</style>
