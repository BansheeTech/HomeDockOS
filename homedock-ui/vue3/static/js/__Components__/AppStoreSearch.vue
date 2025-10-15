<!-- homedock-ui/vue3/static/js/__Components__/AppStoreSearch.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div>
    <AutoComplete v-model:value="searchQuery" class="w-full" :popup-class-name="`${themeClasses.scopeSelector} w-10`" :options="autocompleteOptions" @select="handleSelect" @popupScroll="handlePopupScroll">
      <template #option="item">
        <span v-if="item.options">
          <Icon v-if="item.value === 'Reset'" class="inline-flex mb-1" :icon="deleteEmptyIcon" size="14px" color="#bbb" />
          <Icon v-else-if="item.value === 'Installed'" class="inline-flex mb-1" :icon="checkAllIcon" size="14px" color="#bbb" />
          <Icon v-else-if="item.value === 'New'" class="inline-flex mb-1" :icon="squareRoundedBadgeIcon" size="14px" color="#bbb" />
          <Icon v-else-if="item.value === 'Not Installed'" class="inline-flex mb-1" :icon="appsIcon" size="14px" color="#bbb" />
          {{ item.label }}
        </span>
        <div v-else class="items-center flex">
          <span><BaseImage v-if="item.picture_path" :draggable="false" :src="item.picture_path" alt="icon" class="h-6 w-6 min-h-6 min-w-6 rounded-md mr-1" /></span>
          <span :class="[themeClasses.storeSearchAppName]" class="ml-1">{{ item.label || item.value }}</span>
          <span v-if="item.is_new" class="ml-1 animate-pulse"><Icon :icon="newBoxIcon" size="20px" color="#348feb" class="ml-1" /></span>
          <span :class="[themeClasses.storeSearchCategory]" class="ml-1 text-xs truncate ellipsis">{{ item.type }}</span>
        </div>
      </template>
      <InputSearch v-model:value="searchQuery" placeholder="Search for an app..." enter-button="Search" class="w-full text-sm" autocomplete="new-password">
        <template #prefix>
          <Icon :icon="appsIcon" class="mx-1 text-stone-400" />
        </template>
      </InputSearch>
    </AutoComplete>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import { InputSearch, AutoComplete } from "ant-design-vue";

import dayjs from "dayjs";

import { Icon } from "@iconify/vue";
import deleteEmptyIcon from "@iconify-icons/mdi/delete-empty";
import checkAllIcon from "@iconify-icons/mdi/check-all";
import squareRoundedBadgeIcon from "@iconify-icons/mdi/square-rounded-badge";
import appsIcon from "@iconify-icons/mdi/apps";
import newBoxIcon from "@iconify-icons/mdi/new-box";

import { App } from "../__Types__/AppStoreApp";

import BaseImage from "../__Components__/BaseImage.vue";

import { useAppStore } from "../__Stores__/useAppStore";

const appStore = useAppStore();

const { themeClasses } = useTheme();

const selectedApp = ref<App | null>(null);
const currentPage = ref(1);
const isLoading = ref(false);
const searchQuery = ref("");

const autocompleteOptions = computed(() => {
  const apps = appStore.sortedApps;
  const lowerSearchQuery = searchQuery.value.toLowerCase();

  const filteredApps = lowerSearchQuery ? apps.filter((app) => app.name.toLowerCase().includes(lowerSearchQuery) || app.type.toLowerCase().includes(lowerSearchQuery)) : apps;

  const installedApps = filteredApps.filter((app) => app.is_installed);
  const newApps = filteredApps.filter((app) => app.is_new && !app.is_installed && typeof app.new_until === "string" && dayjs().isBefore(dayjs(app.new_until))); // Aplicaciones nuevas que no están instaladas
  const notInstalledApps = filteredApps.filter((app) => !app.is_installed && !app.is_new);

  return [
    {
      value: "Reset",
      label: "Reset",
      options: [{ value: "", label: "Clear this view" }],
    },
    {
      value: "New",
      label: `New (${newApps.length})`,
      options: newApps.map((app) => ({
        value: app.name,
        label: app.name,
        picture_path: app.picture_path,
        type: app.type,
        icon: app.icon,
      })),
    },
    {
      value: "Installed",
      label: `Installed (${installedApps.length})`,
      options: installedApps.map((app) => ({
        value: app.name,
        label: app.name,
        picture_path: app.picture_path,
        type: app.type,
        icon: app.icon,
        is_new: app.is_new,
      })),
    },
    {
      value: "Not Installed",
      label: `Not Installed (${notInstalledApps.length})`,
      options: notInstalledApps.map((app) => ({
        value: app.name,
        label: app.name,
        picture_path: app.picture_path,
        type: app.type,
        icon: app.icon,
      })),
    },
  ];
});

const handleSelect = (value: string | number | { value: string | number }) => {
  let appName: string;

  if (typeof value === "string" || typeof value === "number") {
    appName = value.toString();
  } else {
    appName = value.value.toString();
  }

  if (appName === "") {
    clearView();
  } else {
    selectedApp.value = appStore.apps.find((app) => app.name === appName) || null;
  }
};

const clearView = () => {
  searchQuery.value = "";
  currentPage.value = 1;
};

const handlePopupScroll = (event: Event) => {
  const container = event.target as HTMLElement;
  if (container.scrollTop + container.clientHeight >= container.scrollHeight) {
    if (!isLoading.value) loadMore();
  }
};

const loadMore = () => {
  if (isLoading.value || searchQuery.value) return;

  isLoading.value = true;
  currentPage.value += 1;
  isLoading.value = false;
};

watch(searchQuery, (newQuery) => {
  appStore.setSearchQuery(newQuery);
  if (newQuery) {
    appStore.setCategoryFilter("");
  }
});
</script>

<style scoped></style>
