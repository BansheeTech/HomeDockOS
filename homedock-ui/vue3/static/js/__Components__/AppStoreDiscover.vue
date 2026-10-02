<!-- homedock-ui/vue3/static/js/__Components__/AppStoreDiscover.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div>
    <Banners />

    <section v-for="shelf in shelves" :key="shelf.key" class="mt-7">
      <div :class="[themeClasses.storeListSeparator]" class="flex items-baseline justify-between gap-3 pt-3.5 mb-1 border-t">
        <h2 :class="[themeClasses.storeModalAppName]" class="m-0 text-[17px] font-bold truncate">{{ $t(shelf.title) }}</h2>
        <button v-if="shelf.category" type="button" class="flex-shrink-0 border-0 bg-transparent p-0 text-[13px] text-blue-500 cursor-pointer hover:text-blue-400" @click="emit('select-category', shelf.category)">{{ $t("See All") }}</button>
      </div>
      <div class="shelf-grid">
        <AppStoreAppCard v-for="app in shelf.apps" :key="app.name" :app="app" />
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useAppStore } from "../__Stores__/useAppStore";

import type { App } from "../__Types__/AppStoreApp";

import Banners from "../__Components__/Banners.vue";
import AppStoreAppCard from "../__Components__/AppStoreAppCard.vue";

const SHELF_SIZE = 6;

const ESSENTIALS = ["immich", "vaultwarden", "pihole", "nextcloud", "jellyfin", "homeassistant", "uptime-kuma", "stirling-pdf", "filebrowser", "wireguard"];

interface Shelf {
  key: string;
  title: string;
  category?: string;
  apps: App[];
}

const emit = defineEmits<{
  (e: "select-category", category: string): void;
}>();

const { themeClasses } = useTheme();
const appStore = useAppStore();

const shelves = computed<Shelf[]>(() => {
  const ranked = appStore.rankedApps;
  const byName = new Map(ranked.map((app) => [app.name, app]));

  const featured = [...ranked.filter((app) => app.is_new), ...ESSENTIALS.map((name) => byName.get(name)).filter((app): app is App => Boolean(app))];
  const featuredApps = [...new Set(featured)].slice(0, SHELF_SIZE);

  const result: Shelf[] = [];
  if (featuredApps.length === SHELF_SIZE) result.push({ key: "featured", title: "Featured Apps", apps: featuredApps });

  for (const { name, count } of appStore.categoryCounts) {
    if (count < SHELF_SIZE) continue;
    result.push({ key: name, title: name, category: name, apps: ranked.filter((app) => app.category === name).slice(0, SHELF_SIZE) });
  }

  return result;
});
</script>

<style scoped>
.shelf-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  column-gap: 24px;
}

@container appstore-content (min-width: 560px) {
  .shelf-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@container appstore-content (min-width: 900px) {
  .shelf-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
