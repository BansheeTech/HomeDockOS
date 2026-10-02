<!-- homedock-ui/vue3/static/js/__Components__/AppStoreUpdates.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-3 mb-4">
      <div class="min-w-0">
        <h1 :class="[themeClasses.storeModalAppName, large ? 'text-[28px] leading-tight' : 'text-2xl']" class="m-0 font-bold tracking-tight truncate">{{ $t("Updates") }}</h1>
        <p :class="[themeClasses.storeCardSubtitle]" class="m-0 mt-0.5 text-[13px]">{{ pendingCount ? `${pendingCount} ${pendingCount === 1 ? $t("app") : $t("apps")}` : $t("Everything is up to date") }}</p>
      </div>
      <button v-if="pendingCount > 1" type="button" class="h-7 px-3.5 rounded-md border-0 bg-blue-600 text-white text-xs font-semibold cursor-pointer transition-colors duration-150 hover:bg-blue-500" @click="updateAll">{{ $t("Update All") }}</button>
    </div>

    <div v-if="rows.length" class="updates-grid">
      <div v-for="row in rows" :key="row.docker.name" :class="[themeClasses.storeRowHover]" class="flex items-center gap-3 h-[76px] -mx-2.5 px-2.5 rounded-[22px] cursor-pointer transition-colors duration-150" @click="openRow(row)">
        <AppIconGraphic :image-src="row.icon" :size="56" />
        <div :class="[themeClasses.storeListSeparator]" class="flex-1 min-w-0 self-stretch flex items-center gap-3 border-b">
          <div class="flex-1 min-w-0">
            <h3 :class="[themeClasses.storeModalAppName]" class="m-0 text-[13px] font-semibold truncate">{{ row.title }}</h3>
            <p :class="[themeClasses.storeCardSubtitle]" class="m-0 text-xs truncate">{{ row.subtitle }}</p>
            <p :class="[themeClasses.storeDescription]" class="m-0 text-[11px] truncate">{{ $t("Update available") }}</p>
          </div>

          <div class="flex-shrink-0" @click.stop>
            <span v-if="updateStore.isUpdating(row.docker.name)" :class="[themeClasses.storeCardInstallingPill]" class="flex items-center justify-center min-w-[76px] h-7 px-3 rounded-full">
              <Icon :icon="loadingIcon" class="w-3.5 h-3.5 animate-spin" />
            </span>
            <button v-else type="button" :class="[themeClasses.storeCardGetPill]" class="min-w-[76px] h-7 px-4 rounded-full border-0 text-xs font-bold cursor-pointer transition-colors duration-150" @click="updateRow(row)">{{ $t("Update") }}</button>
          </div>
        </div>
      </div>
    </div>

    <Empty v-else :class="[themeClasses.storeEmptyText]" class="py-10" :description="$t('Everything is up to date')" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useAppStoreActions } from "../__Composables__/useAppStoreActions";

import { useDesktopStore } from "../__Stores__/desktopStore";
import { useAppUpdateStore } from "../__Stores__/useAppUpdateStore";
import { updateContainer } from "../__Services__/DockerActions";

import type { DockerApp } from "../__Stores__/desktopStore";

import { Empty } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import loadingIcon from "@iconify-icons/mdi/loading";

import AppIconGraphic from "../__Components__/AppIconGraphic.vue";

defineProps<{
  large?: boolean;
}>();

interface UpdateRow {
  docker: DockerApp;
  title: string;
  subtitle: string;
  icon: string;
}

const { themeClasses } = useTheme();
const csrfToken = useCsrfToken();

const desktopStore = useDesktopStore();
const updateStore = useAppUpdateStore();
const { findStoreApp } = useAppStoreActions();

const rows = computed<UpdateRow[]>(() =>
  desktopStore.dockerApps
    .filter((docker) => docker.has_update === true)
    .map((docker) => {
      const storeApp = findStoreApp(docker.HDGroup || docker.name) ?? findStoreApp(docker.name);
      return {
        docker,
        title: docker.display_name || docker.name,
        subtitle: storeApp?.type || docker.HDGroup || "",
        icon: docker.image_path || storeApp?.picture_path || `docker-icons/${docker.name}.jpg`,
      };
    }),
);

const pendingCount = computed(() => rows.value.filter((row) => !updateStore.isUpdating(row.docker.name)).length);

function updateRow(row: UpdateRow) {
  updateContainer(row.docker, csrfToken.value);
}

function updateAll() {
  for (const row of rows.value) {
    if (!updateStore.isUpdating(row.docker.name)) updateContainer(row.docker, csrfToken.value);
  }
}

function openRow(row: UpdateRow) {
  desktopStore.openDockerApp(row.docker);
}
</script>

<style scoped>
.updates-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  column-gap: 24px;
}

@container appstore-content (min-width: 560px) {
  .updates-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@container appstore-content (min-width: 900px) {
  .updates-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
