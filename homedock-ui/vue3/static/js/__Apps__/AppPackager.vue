<!-- homedock-ui/vue3/static/js/__Apps__/AppPackager.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div ref="rootRef" class="app-packager flex flex-col h-full overflow-hidden" @dragover.prevent @drop.prevent="onWindowDrop">
    <div class="flex flex-1 min-h-0">
      <PackagerSidebar v-if="!isMobileLayout" :view="view" :counts="sidebarCounts" :busy="busySections" @select="selectView" />

      <main ref="scrollRef" class="flex-1 min-w-0 min-h-0 overflow-y-auto">
        <div :class="isMobileLayout ? 'px-4 pt-3' : 'px-6 pt-5'" class="packager-content pb-8">
          <Transition name="view-fade" mode="out-in">
            <PackagerPackages v-if="view === 'packages'" key="packages" :large="isMobileLayout" />
            <PackagerStores v-else-if="view === 'stores'" key="stores" :large="isMobileLayout" />
            <PackagerCreate v-else-if="view === 'create'" key="create" :large="isMobileLayout" />
            <PackagerTransfer v-else key="transfer" :large="isMobileLayout" />
          </Transition>
        </div>
      </main>
    </div>

    <PackagerTabBar v-if="isMobileLayout" :view="view" :busy="busySections" @select="selectView" />

    <AppDialog v-model:visible="showDetails" type="info" :title="$t('Package Details')" :ok-text="$t('Close')" :ok-cancel="false" :width="480" @ok="showDetails = false">
      <div v-if="detailsApp" class="space-y-4">
        <div class="flex items-center gap-3.5">
          <AppIconGraphic v-if="detailsApp.manifest?.icon" :image-src="packageIconPath(detailsApp)" :size="56" />
          <AppIconGraphic v-else :icon="packageIcon" :size="56" />
          <div class="min-w-0">
            <p :class="[themeClasses.storeModalAppName]" class="m-0 text-base font-bold truncate">{{ detailsApp.manifest?.display_name || detailsApp.manifest?.name || detailsApp.filename }}</p>
            <p :class="[themeClasses.storeCardSubtitle]" class="m-0 text-xs truncate">{{ $t("Packed by") }} {{ detailsApp.manifest?.author || $t("Unknown author") }} · {{ formatFileSize(detailsApp.size) }}</p>
          </div>
        </div>

        <p v-if="detailsApp.manifest?.description" :class="[themeClasses.storeCardSubtitle]" class="m-0 text-xs leading-relaxed">{{ detailsApp.manifest.description }}</p>

        <div :class="[themeClasses.storeInfoBar]" class="rounded-xl border overflow-hidden">
          <template v-for="(row, index) in detailRows" :key="row.label">
            <div v-if="index > 0" :class="[themeClasses.storeInfoBarDivider]" class="h-px ml-3"></div>
            <div class="flex items-center gap-3 px-3 py-2 text-xs">
              <span :class="[themeClasses.storeCardSubtitle]" class="w-20 flex-shrink-0">{{ $t(row.label) }}</span>
              <span :class="[themeClasses.storeModalAppName, row.mono ? 'font-mono text-[11px]' : '']" class="flex-1 min-w-0 truncate select-text" :title="row.value">{{ row.value }}</span>
            </div>
          </template>
        </div>

        <p v-if="!detailsApp.is_valid" :class="[themeClasses.packagerErrorText]" class="m-0 flex items-center gap-1.5 text-xs">
          <Icon :icon="alertIcon" class="w-3.5 h-3.5 flex-shrink-0" />
          {{ detailsApp.validation_message }}
        </p>

        <div class="flex flex-wrap gap-2">
          <button v-if="isImported(detailsApp)" type="button" :disabled="exportingApp === detailsApp.manifest?.name" :class="[themeClasses.storeCardGetPill]" class="flex items-center gap-1.5 h-7 px-3.5 rounded-full text-xs font-semibold cursor-pointer disabled:opacity-50" @click="exportPackage(detailsApp.manifest?.name)">
            <Icon :icon="exportingApp === detailsApp.manifest?.name ? loadingIcon : exportIcon" :class="exportingApp === detailsApp.manifest?.name ? 'animate-spin' : ''" class="w-3.5 h-3.5" />
            <span>{{ $t("Download .hds") }}</span>
          </button>
          <button v-if="detailsApp.is_valid" type="button" :class="[themeClasses.storeCardGetPill]" class="flex items-center gap-1.5 h-7 px-3.5 rounded-full text-xs font-semibold cursor-pointer" @click="openBadgeDialog(detailsApp)">
            <Icon :icon="shareIcon" class="w-3.5 h-3.5" />
            <span>{{ $t("Share your .hds Package") }}</span>
          </button>
          <button type="button" :disabled="detailsLocked || deletingApp === detailsApp.filename" :title="detailsApp.is_installed ? $t('Cannot delete: App is installed. Uninstall it from App Store first.') : undefined" class="flex items-center gap-1.5 h-7 px-3.5 rounded-full text-xs font-semibold cursor-pointer bg-red-500/10 text-red-500 transition-colors duration-150 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed" @click="deleteFromDetails">
            <Icon :icon="deletingApp === detailsApp.filename ? loadingIcon : deleteIcon" :class="deletingApp === detailsApp.filename ? 'animate-spin' : ''" class="w-3.5 h-3.5" />
            <span>{{ deletingApp === detailsApp.filename ? $t("Deleting...") : $t("Delete .hds") }}</span>
          </button>
        </div>
      </div>
    </AppDialog>

    <PackagerComposeDialog />

    <AppDialog v-model:visible="showOverwriteDialog" type="error" :title="$t('Package Already Exists')" :ok-text="$t('Close')" :ok-cancel="false" @ok="closeConflictDialog">
      <div class="flex items-start gap-3">
        <Icon :icon="alertIcon" :class="['w-6 h-6 flex-shrink-0', themeClasses.packagerErrorText]" />
        <div class="flex-1">
          <p :class="['font-semibold mb-2', themeClasses.packagerText]">{{ $t("Cannot import package") }}</p>
          <p :class="['text-sm mb-2', themeClasses.packagerTextMuted]">{{ $t("The package {name} ({slug}) is already installed and has the following files:", { name: overwriteData?.displayName, slug: overwriteData?.appSlug }) }}</p>
          <ul :class="['text-sm -space-y-1 mb-2', themeClasses.packageConflictFileList]">
            <li v-for="file in overwriteData?.existingFiles" :key="file" class="flex items-start gap-1">
              <span>•</span>
              <code class="text-xs font-mono">{{ file }}</code>
            </li>
          </ul>
          <div :class="[themeClasses.packageConflictInstructionBorder]">
            <p :class="['text-sm font-semibold mb-1', themeClasses.packageConflictInstructionTitle]">{{ $t("To upload a new version:") }}</p>
            <p :class="['text-xs', themeClasses.packageConflictInstructionText]">
              {{ $t("Delete the existing package from My Packages, then import the new version.") }}
            </p>
          </div>
        </div>
      </div>
    </AppDialog>

    <PackagerBadgeDialog v-model:visible="showBadgeDialog" :app="badgeApp" />

    <AppDialog v-model:visible="showExportStoreDialog" type="info" :title="$t('Export .hdstore App Store Bundle')" :ok-text="isExportingStore ? $t('Exporting...') : $t('Export Selected')" :cancel-text="$t('Cancel')" :ok-cancel="true" :width="500" :ok-disabled="isExportingStore || selectedStoreApps.size === 0" :loading="isExportingStore" :mask-closable="!isExportingStore" @ok="exportStore" @cancel="closeExportStoreDialog">
      <div class="space-y-3">
        <p :class="['text-xs', themeClasses.packagerTextMuted]">{{ $t("Select packages to include in the .hdstore bundle (max 999).") }}</p>
        <button type="button" :class="[themeClasses.storeCardGetPill]" class="h-7 px-3.5 rounded-full text-xs font-semibold cursor-pointer" @click="selectAllStoreApps">{{ selectedStoreApps.size === validApps.length ? $t("Deselect All") : $t("Select All") }}</button>
        <div class="max-h-64 overflow-y-auto space-y-0.5">
          <div v-for="app in validApps" :key="app.manifest.name" :class="selectedStoreApps.has(app.manifest.name) ? 'bg-blue-500/10' : themeClasses.storeRowHover" class="flex items-center gap-3 px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors duration-150" @click="toggleStoreAppSelection(app.manifest.name)">
            <span :class="selectedStoreApps.has(app.manifest.name) ? 'bg-blue-500 border-blue-500' : themeClasses.windowBorder" class="w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0">
              <Icon v-if="selectedStoreApps.has(app.manifest.name)" :icon="checkIcon" class="w-3 h-3 text-white" />
            </span>
            <AppIconGraphic :image-src="packageIconPath(app)" :size="28" />
            <div class="flex-1 min-w-0">
              <p :class="[themeClasses.storeModalAppName]" class="m-0 text-xs font-medium truncate">{{ app.manifest.display_name || app.manifest.name }}</p>
              <p :class="[themeClasses.storeCardSubtitle]" class="m-0 text-[10px] truncate">{{ app.manifest.author || $t("Unknown") }}</p>
            </div>
            <span :class="[themeClasses.storeCardSubtitle]" class="text-[10px] flex-shrink-0 tabular-nums">{{ formatFileSize(app.size) }}</span>
          </div>
        </div>
        <p v-if="selectedStoreApps.size > 0" :class="['m-0 text-xs', themeClasses.packagerSuccessText]">{{ $t("{n} package(s) selected", { n: selectedStoreApps.size }) }}</p>
      </div>
    </AppDialog>

    <AppDialog v-model:visible="showImportStoreDialog" type="info" :title="$t('Import .hdstore App Store Bundle')" :ok-text="isImportingStore ? $t('Importing...') : $t('Import {n} Package(s)', { n: importStoreSelectedSlugs.size })" :cancel-text="$t('Cancel')" :ok-cancel="true" :ok-disabled="isImportingStore || importStoreSelectedSlugs.size === 0" :loading="isImportingStore" :width="500" :close-on-ok="false" :mask-closable="!isImportingStore" @ok="confirmImportStore" @cancel="closeImportStoreDialog">
      <PackageSelectionList v-if="importStorePreview" :packages="importStorePreview.packages" :selected="importStoreSelectedSlugs" :summary="$t('{n} package(s) found in this bundle.', { n: importStorePreview.package_count })" :selected-label="$t('{n} package(s) selected', { n: importStoreSelectedSlugs.size })" @toggle="toggleImportStorePkg" @toggle-all="importStoreToggleAll" />
    </AppDialog>

    <AppDialog v-model:visible="showThirdPartyDialog" type="info" :title="$t('Import from Third-Party Store')" :ok-text="isImportingThirdParty ? $t('Importing...') : $t('Import {n} App(s)', { n: thirdPartySelectedSlugs.size })" :cancel-text="$t('Cancel')" :ok-cancel="true" :ok-disabled="isImportingThirdParty || thirdPartySelectedSlugs.size === 0" :loading="isImportingThirdParty" :width="500" :close-on-ok="false" :mask-closable="!isImportingThirdParty" @ok="confirmThirdPartyImport" @cancel="closeThirdPartyDialog">
      <PackageSelectionList v-if="thirdPartyPreview" :packages="thirdPartyPreview.packages" :selected="thirdPartySelectedSlugs" :summary="$t('{n} app(s) found.', { n: thirdPartyPreview.package_count })" :selected-label="$t('{n} app(s) selected', { n: thirdPartySelectedSlugs.size })" @toggle="toggleThirdPartyPkg" @toggle-all="thirdPartyToggleAll" />
    </AppDialog>

    <StatusBar :icon="packageIcon" :message="statusMessage" :info="statusInfo" :showHelp="true">
      <template #help>
        <div class="space-y-2.5 max-w-sm">
          <div class="flex items-center gap-2">
            <StatusBarHelpIcon :icon="packageIcon" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">{{ $t("Packager") }}</h4>
          </div>
          <div :class="['text-[10px] md:text-xs space-y-2 leading-relaxed', themeClasses.statusBarInfo]">
            <p v-if="view === 'create'">{{ $t("Create custom .hds packages with your docker-compose files to be able to import any application into the HomeDock OS App Store. Use DevHooks to make your packages dynamic and compatible with different environments such as Windows, macOS and Linux.") }}</p>
            <p v-else-if="view === 'stores'">{{ $t("Import apps directly from third-party stores like Casa or Zima. Paste a link to a store ZIP archive and select which apps to import. Metadata, icons, and volumes are adapted automatically.") }}</p>
            <p v-else>{{ $t("Import packages from others or export your already imported apps, share them, keep them private or publish your own .hds files on GitHub. Once exported, all packages are verified with SHA256 hashes to ensure integrity and avoid third party modifications.") }}</p>
          </div>
        </div>
      </template>
    </StatusBar>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useWindowStore } from "../__Stores__/windowStore";
import { providePackager, packageIconPath, formatFileSize, PREDEFINED_STORES } from "../__Composables__/usePackager";
import type { PackagerView } from "../__Composables__/usePackager";

import { Icon } from "@iconify/vue";
import packageIcon from "@iconify-icons/mdi/package-variant";
import loadingIcon from "@iconify-icons/mdi/loading";
import alertIcon from "@iconify-icons/mdi/alert-circle";
import exportIcon from "@iconify-icons/mdi/tray-arrow-up";
import shareIcon from "@iconify-icons/mdi/share-variant-outline";
import deleteIcon from "@iconify-icons/mdi/delete-outline";
import checkIcon from "@iconify-icons/mdi/check";

import StatusBar from "../__Components__/StatusBar.vue";
import StatusBarHelpIcon from "../__Components__/StatusBarHelpIcon.vue";
import AppDialog from "../__Components__/AppDialog.vue";
import AppIconGraphic from "../__Components__/AppIconGraphic.vue";
import PackagerBadgeDialog from "../__Components__/PackagerBadgeDialog.vue";
import PackagerSidebar from "../__Components__/PackagerSidebar.vue";
import PackagerTabBar from "../__Components__/PackagerTabBar.vue";
import PackagerPackages from "../__Components__/PackagerPackages.vue";
import PackagerStores from "../__Components__/PackagerStores.vue";
import PackagerCreate from "../__Components__/PackagerCreate.vue";
import PackagerTransfer from "../__Components__/PackagerTransfer.vue";
import PackageSelectionList from "../__Components__/PackageSelectionList.vue";
import PackagerComposeDialog from "../__Components__/PackagerComposeDialog.vue";

const LEGACY_TABS: Record<string, PackagerView> = { manager: "packages", generator: "create", stores: "stores" };
const MOBILE_ENTER_THRESHOLD = 600;
const MOBILE_EXIT_THRESHOLD = 680;

const props = defineProps<{
  tab?: string;
  _windowId?: string;
}>();

const { t } = useI18n();
const { themeClasses } = useTheme();
const windowStore = useWindowStore();

const packager = providePackager();
const { view, busySections, externalApps, importedApps, validApps, deletingApp, exportingApp, isPackageBeingInstalled, isImported, detailsApp, showDetails, exportPackage, deletePackage, badgeApp, showBadgeDialog, openBadgeDialog, showOverwriteDialog, overwriteData, closeConflictDialog, handleFiles, usedDevHooks, showThirdPartyDialog, thirdPartyPreview, isImportingThirdParty, thirdPartySelectedSlugs, importedFromStore, toggleThirdPartyPkg, thirdPartyToggleAll, closeThirdPartyDialog, confirmThirdPartyImport, showExportStoreDialog, selectedStoreApps, isExportingStore, toggleStoreAppSelection, selectAllStoreApps, closeExportStoreDialog, exportStore, showImportStoreDialog, importStorePreview, importStoreSelectedSlugs, isImportingStore, toggleImportStorePkg, importStoreToggleAll, closeImportStoreDialog, confirmImportStore } = packager;

const rootRef = ref<HTMLElement | null>(null);
const scrollRef = ref<HTMLElement | null>(null);
const isMobileLayout = ref(false);

let resizeObserver: ResizeObserver | null = null;

watch(
  () => props.tab,
  (tab) => {
    const target = tab ? (LEGACY_TABS[tab] ?? (tab as PackagerView)) : undefined;
    if (!target) return;
    view.value = target;
    if (props._windowId) windowStore.updateWindowData(props._windowId, { tab: undefined });
  },
  { immediate: true },
);

const sidebarCounts = computed<Partial<Record<PackagerView, number>>>(() => ({
  packages: externalApps.value.length,
  stores: PREDEFINED_STORES.filter((store) => importedFromStore(store).length > 0).length,
}));

const statusMessage = computed(() => {
  if (view.value === "create") return t("Packager");
  if (view.value === "stores") return t("Third-Party Stores");
  if (view.value === "transfer") return t("Import & Export");
  return t("{n} {unit} available", { n: externalApps.value.length, unit: externalApps.value.length === 1 ? t("package") : t("packages") });
});

const statusInfo = computed(() => {
  if (view.value === "create") return usedDevHooks.value.length ? t("{n} DevHooks detected", { n: usedDevHooks.value.length }) : t("Ready to create");
  if (view.value === "stores") return t("Casa and Zima Stores");
  return t("{n} imported apps", { n: importedApps.value.length });
});

const detailsLocked = computed(() => Boolean(detailsApp.value && (detailsApp.value.is_installed || isPackageBeingInstalled(detailsApp.value.manifest?.name))));

const detailRows = computed(() => {
  const app = detailsApp.value;
  if (!app) return [];
  const manifest = app.manifest || {};
  return [manifest.docker_image && { label: "Image", value: manifest.docker_image, mono: true }, manifest.version && { label: "Version", value: manifest.version, mono: true }, manifest.category && { label: "Category", value: t(manifest.category) }, { label: "File", value: app.filename, mono: true }, app.hash && { label: "Hash", value: app.hash, mono: true }].filter(Boolean) as { label: string; value: string; mono?: boolean }[];
});

function deleteFromDetails() {
  if (!detailsApp.value) return;
  showDetails.value = false;
  deletePackage(detailsApp.value);
}

function selectView(next: PackagerView) {
  view.value = next;
  if (scrollRef.value) scrollRef.value.scrollTop = 0;
}

function onWindowDrop(event: DragEvent) {
  const files = Array.from(event.dataTransfer?.files ?? []).filter((file) => file.name.endsWith(".hds") || file.name.endsWith(".hdstore"));
  if (files.length) handleFiles(files);
}

function updateMobileLayout(width: number) {
  if (width <= 0) return;
  if (!isMobileLayout.value && width < MOBILE_ENTER_THRESHOLD) isMobileLayout.value = true;
  else if (isMobileLayout.value && width > MOBILE_EXIT_THRESHOLD) isMobileLayout.value = false;
}

onMounted(() => {
  packager.refreshAll(false);

  if (rootRef.value) {
    updateMobileLayout(rootRef.value.clientWidth);
    resizeObserver = new ResizeObserver((entries) => updateMobileLayout(entries[0]?.contentRect.width ?? 0));
    resizeObserver.observe(rootRef.value);
  }
});

onUnmounted(() => {
  resizeObserver?.disconnect();
});
</script>

<style scoped>
.packager-content {
  container-type: inline-size;
  container-name: packager-content;
}

.view-fade-enter-active,
.view-fade-leave-active {
  transition: opacity 0.15s ease;
}

.view-fade-enter-from,
.view-fade-leave-to {
  opacity: 0;
}
</style>
