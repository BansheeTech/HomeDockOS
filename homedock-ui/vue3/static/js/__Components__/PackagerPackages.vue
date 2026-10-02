<!-- homedock-ui/vue3/static/js/__Components__/PackagerPackages.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-3 mb-4">
      <div class="min-w-0">
        <h1 :class="[themeClasses.storeModalAppName, large ? 'text-[28px] leading-tight' : 'text-2xl']" class="m-0 font-bold tracking-tight truncate">{{ $t("My Packages") }}</h1>
        <p :class="[themeClasses.storeCardSubtitle]" class="m-0 mt-0.5 text-[13px]">{{ externalApps.length }} {{ externalApps.length === 1 ? $t("package") : $t("packages") }}</p>
      </div>
      <div v-if="externalApps.length > 0" :class="large ? 'w-full' : 'w-44'" class="relative flex items-center">
        <Icon :icon="searchIcon" :class="[themeClasses.explorerSearchIcon]" class="absolute left-2 w-3.5 h-3.5 pointer-events-none" />
        <input v-model="packageSearch" type="text" :placeholder="$t('Search packages')" autocomplete="off" spellcheck="false" :class="[themeClasses.explorerSearchInput, themeClasses.explorerSearchInputText, themeClasses.explorerSearchInputFocusRing]" class="w-full h-6 pl-7 pr-6 rounded-md border text-xs outline-none transition-all duration-150" @keydown.esc="packageSearch = ''" />
        <button v-if="packageSearch" type="button" :aria-label="$t('Clear')" :class="[themeClasses.explorerClearButton, themeClasses.explorerClearButtonHover]" class="absolute right-1 flex items-center justify-center w-5 h-5 rounded cursor-pointer" @click="packageSearch = ''">
          <Icon :icon="closeIcon" class="w-3 h-3" />
        </button>
      </div>
    </div>

    <div v-if="isLoadingExternal" class="flex justify-center py-16">
      <Icon :icon="loadingIcon" :class="[themeClasses.storeCardSubtitle]" class="w-8 h-8 animate-spin" />
    </div>

    <div v-else-if="externalApps.length === 0" :class="[themeClasses.storeInfoBar]" class="flex flex-col items-center text-center gap-3 rounded-2xl border px-6 py-10">
      <AppIconGraphic :icon="packageIcon" color="#3b82f6" :size="56" />
      <div>
        <p :class="[themeClasses.storeModalAppName]" class="m-0 text-[15px] font-semibold">{{ $t("No packages yet") }}</p>
        <p :class="[themeClasses.storeCardSubtitle]" class="m-0 mt-1 text-xs max-w-sm">{{ $t("Add a third-party store, create your own package or drop .hds files anywhere in this window.") }}</p>
      </div>
      <div class="flex flex-wrap justify-center gap-2">
        <button type="button" :class="[themeClasses.storeCardInstalledPill]" class="h-7 px-4 rounded-full text-xs font-semibold cursor-pointer transition-colors duration-150" @click="view = 'create'">{{ $t("Create Package") }}</button>
        <button type="button" class="h-7 px-4 rounded-full bg-blue-600 text-white text-xs font-semibold cursor-pointer transition-colors duration-150 hover:bg-blue-500" @click="view = 'stores'">{{ $t("Add stores") }}</button>
      </div>
    </div>

    <Empty v-else-if="filteredExternalApps.length === 0" :class="[themeClasses.storeEmptyText]" class="py-10" :description="$t('No packages match &quot;{search}&quot;', { search: packageSearch })" />

    <div v-else class="packages-grid">
      <div v-for="app in filteredExternalApps" :key="app.filename" :class="[themeClasses.storeRowHover]" class="package-row flex items-center gap-3 h-[76px] -mx-2.5 px-2.5 rounded-[22px] cursor-pointer transition-colors duration-150" @click="openDetails(app)">
        <AppIconGraphic v-if="app.manifest?.icon" :image-src="packageIconPath(app)" :size="52" />
        <AppIconGraphic v-else :icon="app.is_valid ? packageIcon : alertIcon" :color="app.is_valid ? undefined : '#dc2626'" :size="52" />

        <div :class="[themeClasses.storeListSeparator]" class="flex-1 min-w-0 self-stretch flex items-center gap-2 border-b">
          <div class="flex-1 min-w-0">
            <h3 :class="[themeClasses.storeModalAppName]" class="m-0 text-[13px] font-semibold truncate">{{ app.manifest?.display_name || app.manifest?.name || app.filename }}</h3>
            <p :class="[themeClasses.storeCardSubtitle]" class="m-0 text-xs truncate">{{ app.manifest?.type || $t(app.manifest?.category || "Uncategorized") }}</p>
            <p v-if="app.is_valid" :class="[themeClasses.storeDescription]" class="m-0 text-[11px] truncate">{{ app.manifest?.author || $t("Unknown author") }}</p>
            <p v-else :class="[themeClasses.packagerErrorText]" class="m-0 text-[11px] truncate">{{ app.validation_message }}</p>
          </div>

          <div class="flex items-center gap-1.5 flex-shrink-0" @click.stop>
            <span v-if="isPackageBeingInstalled(app.manifest?.name)" :class="[themeClasses.storeCardInstallingPill]" class="flex items-center justify-center min-w-[68px] h-7 rounded-full">
              <Icon :icon="loadingIcon" class="w-3.5 h-3.5 animate-spin" />
            </span>
            <button v-else-if="app.is_installed" type="button" :class="[themeClasses.storeCardInstalledPill]" class="min-w-[68px] h-7 px-3.5 rounded-full text-xs font-bold cursor-pointer transition-colors duration-150" @click="openInStore(app)">{{ $t("Open") }}</button>
            <button v-else-if="app.is_valid" type="button" :class="[themeClasses.storeCardGetPill]" class="min-w-[68px] h-7 px-3.5 rounded-full text-xs font-bold cursor-pointer transition-colors duration-150" @click="openInStore(app)">{{ $t("Get") }}</button>
            <button type="button" :aria-label="$t('More')" :class="[themeClasses.storeCardInstalledPill]" class="flex items-center justify-center w-7 h-7 rounded-full cursor-pointer transition-colors duration-150" @click="openMenu($event, app)">
              <Icon :icon="moreIcon" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <ContextMenu :visible="menu.visible" :x="menu.x" :y="menu.y" :items="menuItems" @close="menu.visible = false" />
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { usePackager, packageIconPath } from "../__Composables__/usePackager";
import { useAppStoreActions } from "../__Composables__/useAppStoreActions";

import { Empty } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import searchIcon from "@iconify-icons/mdi/magnify";
import closeIcon from "@iconify-icons/mdi/close";
import loadingIcon from "@iconify-icons/mdi/loading";
import packageIcon from "@iconify-icons/mdi/package-variant";
import alertIcon from "@iconify-icons/mdi/alert-circle";
import moreIcon from "@iconify-icons/mdi/dots-horizontal";
import infoIcon from "@iconify-icons/mdi/information-outline";
import exportIcon from "@iconify-icons/mdi/tray-arrow-up";
import shareIcon from "@iconify-icons/mdi/share-variant-outline";
import deleteIcon from "@iconify-icons/mdi/delete-outline";

import AppIconGraphic from "./AppIconGraphic.vue";
import ContextMenu from "./ContextMenu.vue";
import type { ContextMenuItem } from "./ContextMenu.vue";

defineProps<{
  large?: boolean;
}>();

const { themeClasses } = useTheme();
const { view, externalApps, filteredExternalApps, packageSearch, isLoadingExternal, isPackageBeingInstalled, isImported, openDetails, exportPackage, openBadgeDialog, deletePackage, reloadStoreApps } = usePackager();
const { findStoreApp, openAppDetails, openInstalledApp } = useAppStoreActions();

const menu = reactive({ visible: false, x: 0, y: 0 });
const menuApp = ref<any>(null);

async function openInStore(app: any) {
  const name = app.manifest?.name;
  if (!name) return;
  let storeApp = findStoreApp(name);
  if (!storeApp) {
    await reloadStoreApps();
    storeApp = findStoreApp(name);
  }
  if (!storeApp) return;
  if (storeApp.is_installed) openInstalledApp(storeApp);
  else openAppDetails(storeApp);
}

function openMenu(event: MouseEvent, app: any) {
  const target = (event.currentTarget as HTMLElement).getBoundingClientRect();
  menuApp.value = app;
  menu.x = target.right - 8;
  menu.y = target.bottom + 4;
  menu.visible = true;
}

const menuItems = computed<ContextMenuItem[]>(() => {
  const app = menuApp.value;
  if (!app) return [];
  const locked = app.is_installed || isPackageBeingInstalled(app.manifest?.name);
  return [{ label: "Details", icon: infoIcon, action: () => openDetails(app) }, { label: "Download .hds", icon: exportIcon, disabled: !isImported(app), action: () => exportPackage(app.manifest?.name) }, { label: "Share your .hds Package", icon: shareIcon, disabled: !app.is_valid, action: () => openBadgeDialog(app) }, { divider: true }, { label: "Delete .hds", icon: deleteIcon, disabled: locked, action: () => deletePackage(app) }];
});
</script>

<style scoped>
.packages-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  column-gap: 24px;
}

.package-row {
  content-visibility: auto;
  contain-intrinsic-size: auto 76px;
}

@container packager-content (min-width: 560px) {
  .packages-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@container packager-content (min-width: 900px) {
  .packages-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
