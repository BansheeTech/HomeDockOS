<!-- homedock-ui/vue3/static/js/__Components__/PackagerStores.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-3 mb-4">
      <div class="min-w-0">
        <h1 :class="[themeClasses.storeModalAppName, large ? 'text-[28px] leading-tight' : 'text-2xl']" class="m-0 font-bold tracking-tight truncate">{{ $t("Third-Party Stores") }}</h1>
        <p :class="[themeClasses.storeCardSubtitle]" class="m-0 mt-0.5 text-[13px]">{{ $t("Extend the App Store with community catalogs") }}</p>
      </div>
      <KeepWindowOpenBadge :visible="!!busySections.stores" />
    </div>

    <div class="stores-grid">
      <div v-for="store in PREDEFINED_STORES" :key="store.id" :class="[themeClasses.storeInfoBar]" class="flex flex-col gap-3 rounded-2xl border p-4">
        <div class="flex items-center gap-3 min-w-0">
          <span class="store-logo flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0 text-white text-lg font-extrabold" :style="{ background: store.color }">{{ store.name.charAt(0) }}</span>
          <div class="min-w-0">
            <p :class="[themeClasses.storeModalAppName]" class="m-0 text-sm font-semibold truncate">{{ store.name }}</p>
            <p :class="[themeClasses.storeCardSubtitle]" class="m-0 text-xs truncate">{{ storeSource(store.url) }}</p>
          </div>
        </div>

        <div class="flex items-center h-8">
          <template v-if="importedFromStore(store).length">
            <AppIconGraphic v-for="app in importedFromStore(store).slice(0, 6)" :key="app.filename" :image-src="packageIconPath(app)" :size="28" class="-mr-1.5" />
          </template>
          <span v-else :class="[themeClasses.storeCardSubtitle]" class="text-xs">{{ $t("Not added yet") }}</span>
        </div>

        <div class="flex items-center justify-between gap-2 mt-auto">
          <span :class="[themeClasses.storeCardSubtitle]" class="text-xs tabular-nums truncate">{{ importedFromStore(store).length ? $t("{n} imported apps", { n: importedFromStore(store).length }) : "" }}</span>
          <span v-if="loadingStoreUrl === store.url" :class="[themeClasses.storeCardInstallingPill]" class="flex items-center justify-center min-w-[76px] h-7 rounded-full">
            <Icon :icon="loadingIcon" class="w-3.5 h-3.5 animate-spin" />
          </span>
          <button v-else-if="importedFromStore(store).length" type="button" :disabled="!!loadingStoreUrl" :class="[themeClasses.storeCardGetPill]" class="min-w-[76px] h-7 px-4 rounded-full text-xs font-bold cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-default" @click="previewThirdPartyStore(store.url)">{{ $t("Browse") }}</button>
          <button v-else type="button" :disabled="!!loadingStoreUrl" class="min-w-[76px] h-7 px-4 rounded-full bg-blue-600 text-white text-xs font-bold cursor-pointer transition-colors duration-150 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-default" @click="previewThirdPartyStore(store.url)">{{ $t("Add") }}</button>
        </div>

        <TaskProgress v-if="loadingStoreUrl === store.url" :percent="progressPercent" :label="progressLabel" :detail="progressDetail" />
      </div>
    </div>

    <h2 :class="[themeClasses.storeCardSubtitle]" class="m-0 mt-6 mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider">{{ $t("Other store") }}</h2>
    <div :class="[themeClasses.storeInfoBar]" class="flex items-center gap-3 rounded-xl border px-3 py-2">
      <Icon :icon="linkIcon" :class="[themeClasses.storeCardSubtitle]" class="w-4 h-4 flex-shrink-0" />
      <input v-model="thirdPartyUrl" type="url" :disabled="!!loadingStoreUrl" :placeholder="$t('Paste any compatible Casa store ZIP URL')" :class="[themeClasses.storeModalAppName]" class="flex-1 min-w-0 h-8 bg-transparent text-[13px] outline-hidden placeholder:opacity-50 disabled:opacity-50" @keydown.enter="previewThirdPartyStore(thirdPartyUrl)" />
      <span v-if="loadingStoreUrl && loadingStoreUrl === thirdPartyUrl.trim()" :class="[themeClasses.storeCardInstallingPill]" class="flex items-center justify-center min-w-[76px] h-7 rounded-full">
        <Icon :icon="loadingIcon" class="w-3.5 h-3.5 animate-spin" />
      </span>
      <button v-else type="button" :disabled="!thirdPartyUrl.trim() || !!loadingStoreUrl" :class="[themeClasses.storeCardGetPill]" class="min-w-[76px] h-7 px-4 rounded-full text-xs font-bold cursor-pointer transition-colors duration-150 disabled:opacity-40 disabled:cursor-default" @click="previewThirdPartyStore(thirdPartyUrl)">{{ $t("Preview") }}</button>
    </div>
    <TaskProgress v-if="loadingStoreUrl && !isPredefined(loadingStoreUrl)" :percent="progressPercent" :label="progressLabel" :detail="progressDetail" class="mt-2 px-3" />

    <h2 :class="[themeClasses.storeCardSubtitle]" class="m-0 mt-6 mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider">{{ $t("How it works") }}</h2>
    <div :class="[themeClasses.storeInfoBar]" class="rounded-xl border overflow-hidden">
      <template v-for="(item, index) in HOW_IT_WORKS" :key="item.title">
        <div v-if="index > 0" :class="[themeClasses.storeInfoBarDivider]" class="h-px ml-[52px]"></div>
        <div class="flex items-start gap-3 px-3 py-3">
          <AppIconGraphic :icon="item.icon" :color="item.color" :size="28" />
          <div class="min-w-0">
            <p :class="[themeClasses.storeModalAppName]" class="m-0 text-[13px] font-semibold">{{ $t(item.title) }}</p>
            <p :class="[themeClasses.storeCardSubtitle]" class="m-0 mt-0.5 text-xs leading-relaxed">{{ $t(item.text) }}</p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { useTheme } from "../__Themes__/ThemeSelector";
import { usePackager, packageIconPath, formatFileSize, PREDEFINED_STORES } from "../__Composables__/usePackager";

import { Icon } from "@iconify/vue";
import loadingIcon from "@iconify-icons/mdi/loading";
import linkIcon from "@iconify-icons/mdi/link-variant";
import autoIcon from "@iconify-icons/mdi/auto-fix";
import packageIcon from "@iconify-icons/mdi/package-variant";
import shieldIcon from "@iconify-icons/mdi/shield-check";

import AppIconGraphic from "./AppIconGraphic.vue";
import TaskProgress from "./TaskProgress.vue";
import KeepWindowOpenBadge from "./KeepWindowOpenBadge.vue";

defineProps<{
  large?: boolean;
}>();

const HOW_IT_WORKS = [
  { title: "Automatic Conversion", icon: autoIcon, color: "#3b82f6", text: "Metadata, icons, volumes, networks, and ports are automatically adapted for HomeDock OS. You preview and select which apps to import before anything is installed. Compose files are sanitized to remove fingerprinting and platform-specific extensions." },
  { title: "Package Manager", icon: packageIcon, color: "#059669", text: "Imported apps land in the Package Manager as .hds packages. From there you can install them from the App Store, export individually, or bundle them into .hdstore files to share entire collections with other users or across devices." },
  { title: "Open Format", icon: shieldIcon, color: "#ec4899", text: "Both .hds and .hdstore files are standard ZIP archives signed with SHA-256 hashes to prevent tampering. They are not proprietary, you can always unzip them to inspect their contents or recover the original compose files." },
];

const { t } = useI18n();
const { themeClasses } = useTheme();
const { thirdPartyUrl, loadingStoreUrl, storeProgress, busySections, importedFromStore, previewThirdPartyStore } = usePackager();

const isPredefined = (url: string) => PREDEFINED_STORES.some((store) => store.url === url);

const progressPercent = computed(() => {
  const progress = storeProgress.value;
  if (!progress || !progress.total) return null;
  return Math.min(100, Math.round((progress.done / progress.total) * 100));
});

const progressLabel = computed(() => (storeProgress.value?.phase === "apps" ? t("Reading apps...") : t("Downloading store...")));

const progressDetail = computed(() => {
  const progress = storeProgress.value;
  if (!progress) return "";
  if (progress.phase === "apps") return progress.total ? `${progress.done} / ${progress.total}` : "";
  if (!progress.done) return "";
  return progress.total ? `${formatFileSize(progress.done)} / ${formatFileSize(progress.total)} · ${progressPercent.value}%` : formatFileSize(progress.done);
});

function storeSource(url: string): string {
  try {
    const { hostname, pathname } = new URL(url);
    return `${hostname}/${pathname.split("/").filter(Boolean).slice(0, 2).join("/")}`;
  } catch {
    return url;
  }
}
</script>

<style scoped>
.stores-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}

.store-logo {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    0 2px 6px rgba(0, 0, 0, 0.15);
}
</style>
