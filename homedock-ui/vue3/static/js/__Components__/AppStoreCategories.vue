<!-- homedock-ui/vue3/static/js/__Components__/AppStoreCategories.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template>
  <div class="overflow-x-auto whitespace-nowrap py-1">
    <Button type="dashed" @click="selectCategory('')" :class="[themeClasses.storeCategoriesAll, { '!border-blue-500 !text-blue-500': selectedCategory === '' }]" class="px-4 text-[10px] rounded-lg border">
      <div class="flex items-center">
        <Icon :icon="allInclusiveIcon" class="mr-1 mb-0.5 h-4 w-4" />
        Show All
      </div>
    </Button>

    <Button v-for="category in categories" :key="category" @click="selectCategory(category)" :class="[themeClasses.storeCategoriesSelect, { '!border-blue-500 !text-blue-500': selectedCategory === category }]" class="px-4 ml-1 text-[10px] rounded-lg border">
      <div class="flex items-center">
        <template v-if="icons[category as Category]">
          <Icon :icon="icons[category as Category]" class="mr-1 mb-0.5 h-4 w-4" />
        </template>
        {{ category }}
      </div>
    </Button>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import { Button } from "ant-design-vue";

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

<style scoped></style>
