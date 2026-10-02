<!-- homedock-ui/vue3/static/js/__Components__/PackagerTransfer.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-3 mb-4">
      <div class="min-w-0">
        <h1 :class="[themeClasses.storeModalAppName, large ? 'text-[28px] leading-tight' : 'text-2xl']" class="m-0 font-bold tracking-tight truncate">{{ $t("Import & Export") }}</h1>
        <p :class="[themeClasses.storeCardSubtitle]" class="m-0 mt-0.5 text-[13px]">{{ $t("Move packages between your HomeDock OS servers or share them") }}</p>
      </div>
      <KeepWindowOpenBadge :visible="!!busySections.transfer" />
    </div>

    <label :class="[themeClasses.storeListSeparator, dragging ? 'bg-blue-500/10 !border-blue-500' : '']" class="flex flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed px-6 py-8 text-center cursor-pointer transition-colors duration-150" @dragenter.prevent="dragging = true" @dragover.prevent="dragging = true" @dragleave.prevent="dragging = false" @drop.prevent.stop="onDrop">
      <AppIconGraphic :icon="busy ? loadingIcon : importIcon" color="#8b5cf6" :size="48" :class="busy && 'tile-busy'" />
      <span :class="[themeClasses.storeModalAppName]" class="text-sm font-semibold">{{ isUploading ? $t("Importing package...") : isPreviewingStore ? $t("Reading...") : $t("Drop .hds or .hdstore files here") }}</span>
      <span :class="[themeClasses.storeCardSubtitle]" class="text-xs">{{ $t("or click to choose them") }}</span>
      <input type="file" accept=".hds,.hdstore" multiple class="hidden" :disabled="busy" @change="onPick" />
    </label>

    <h2 :class="groupTitleClass">{{ $t("Export") }}</h2>
    <div :class="[themeClasses.storeInfoBar]" class="rounded-xl border overflow-hidden">
      <div class="flex items-center gap-3 px-3 py-3">
        <AppIconGraphic :icon="bundleIcon" color="#3b82f6" :size="28" />
        <div class="flex-1 min-w-0">
          <p :class="[themeClasses.storeModalAppName]" class="m-0 text-[13px] font-semibold">HomeDock OS App Store (.hdstore)</p>
          <p :class="[themeClasses.storeCardSubtitle]" class="m-0 text-xs">{{ $t("Bundle all your packages into a single file") }} · {{ $t("Up to 999 packages per .hdstore file") }}</p>
        </div>
        <button type="button" :disabled="validApps.length === 0 || isExportingStore" :class="[themeClasses.storeCardGetPill]" class="h-7 px-4 rounded-full text-xs font-bold cursor-pointer flex-shrink-0 transition-colors duration-150 disabled:opacity-40 disabled:cursor-default" @click="showExportStoreDialog = true">{{ isExportingStore ? $t("Exporting...") : $t("Export .hdstore") }}</button>
      </div>
      <Transition name="progress-reveal">
        <TaskProgress v-if="exportProgress" :percent="exportPercent" :label="exportProgress.loaded ? $t('Downloading bundle...') : $t('Preparing bundle...')" :detail="exportDetail" class="px-3 pb-3 pl-[52px]" />
      </Transition>
      <div :class="[themeClasses.storeInfoBarDivider]" class="h-px ml-[52px]"></div>
      <div class="flex items-center gap-3 px-3 py-3">
        <AppIconGraphic :icon="packageIcon" color="#64748b" :size="28" />
        <div class="flex-1 min-w-0">
          <p :class="[themeClasses.storeModalAppName]" class="m-0 text-[13px] font-semibold">{{ $t("Download .hds") }}</p>
          <p :class="[themeClasses.storeCardSubtitle]" class="m-0 text-xs">{{ $t("Export a single package from its … menu in My Packages") }}</p>
        </div>
      </div>
    </div>

    <h2 :class="groupTitleClass">{{ $t("Migrate") }}</h2>
    <div :class="[themeClasses.storeInfoBar]" class="rounded-xl border overflow-hidden">
      <label class="flex items-center gap-3 px-3 py-3 cursor-pointer" @dragover.prevent @drop.prevent.stop="onMigrateDrop">
        <AppIconGraphic :icon="isMigratingSingle ? loadingIcon : fileCodeIcon" color="#f59e0b" :size="28" :class="isMigratingSingle && 'tile-busy'" />
        <span class="flex-1 min-w-0">
          <span :class="[themeClasses.storeModalAppName]" class="block text-[13px] font-semibold">{{ isMigratingSingle ? $t("Migrating compose...") : $t("Migrate Casa Compose") }}</span>
          <span :class="[themeClasses.storeCardSubtitle]" class="block text-xs">{{ isMigratingSingle ? migrateProgress || $t("Please wait") : $t("Drop a compatible .yml compose file here or click to browse") }}</span>
        </span>
        <input type="file" accept=".yml,.yaml" class="hidden" :disabled="isMigratingSingle" @change="onMigratePick" />
      </label>
    </div>

    <p :class="[themeClasses.storeCardSubtitle]" class="m-0 mt-5 px-3 text-[11px] leading-relaxed">{{ $t("Both .hds and .hdstore files are standard ZIP archives signed with SHA-256 hashes to prevent tampering. They are not proprietary, you can always unzip them to inspect their contents or recover the original compose files.") }}</p>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { usePackager, formatFileSize } from "../__Composables__/usePackager";

import { Icon } from "@iconify/vue";
import loadingIcon from "@iconify-icons/mdi/loading";
import importIcon from "@iconify-icons/mdi/tray-arrow-down";
import bundleIcon from "@iconify-icons/mdi/package-variant-closed-plus";
import packageIcon from "@iconify-icons/mdi/package-variant";
import fileCodeIcon from "@iconify-icons/mdi/file-code-outline";

import AppIconGraphic from "./AppIconGraphic.vue";
import TaskProgress from "./TaskProgress.vue";
import KeepWindowOpenBadge from "./KeepWindowOpenBadge.vue";

defineProps<{
  large?: boolean;
}>();

const { themeClasses } = useTheme();
const { validApps, busySections, isUploading, isPreviewingStore, isExportingStore, exportProgress, showExportStoreDialog, isMigratingSingle, migrateProgress, handleFiles, migrateCompose } = usePackager();

const dragging = ref(false);

const exportPercent = computed(() => {
  const progress = exportProgress.value;
  if (!progress || !progress.loaded || !progress.total) return null;
  return Math.min(100, Math.round((progress.loaded / progress.total) * 100));
});

const exportDetail = computed(() => {
  const progress = exportProgress.value;
  if (!progress?.loaded) return "";
  return progress.total ? `${formatFileSize(progress.loaded)} / ${formatFileSize(progress.total)} · ${exportPercent.value}%` : formatFileSize(progress.loaded);
});
const busy = computed(() => isUploading.value || isPreviewingStore.value);

const groupTitleClass = computed(() => [themeClasses.value.storeCardSubtitle, "m-0 mt-6 mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider"]);

function onDrop(event: DragEvent) {
  dragging.value = false;
  handleFiles(Array.from(event.dataTransfer?.files ?? []));
}

function onPick(event: Event) {
  const input = event.target as HTMLInputElement;
  handleFiles(Array.from(input.files ?? []));
  input.value = "";
}

function onMigrateDrop(event: DragEvent) {
  const file = event.dataTransfer?.files?.[0];
  if (file) migrateCompose(file);
}

function onMigratePick(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (file) migrateCompose(file);
}
</script>

<style scoped>
.tile-busy :deep(.app-icon-glyph) {
  animation: spin 1s linear infinite;
}

.progress-reveal-enter-active,
.progress-reveal-leave-active {
  transition: opacity 0.2s ease;
}

.progress-reveal-enter-from,
.progress-reveal-leave-to {
  opacity: 0;
}
</style>
