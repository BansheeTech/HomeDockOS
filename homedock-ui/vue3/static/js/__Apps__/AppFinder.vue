<!-- homedock-ui/vue3/static/js/__Apps__/AppFinder.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div ref="rootRef" class="flex h-full flex-col overflow-hidden" @keydown="handleKeyDown">
    <div class="shrink-0 border-b px-4 pb-3 pt-4" :class="themeClasses.explorerHeaderBorder">
      <div class="relative flex items-center">
        <Icon :icon="searchIcon" :class="themeClasses.explorerSearchIcon" class="pointer-events-none absolute left-4 h-5 w-5" />
        <input ref="searchInputRef" v-model="searchQuery" type="text" :placeholder="$t('Search apps, files, and more...')" class="flex-1 rounded-lg border py-3 pl-12 pr-11 text-sm outline-none transition-all duration-200" :class="[themeClasses.explorerSearchInput, themeClasses.explorerSearchInputText, themeClasses.explorerSearchInputFocusRing]" />
        <button v-if="searchQuery" type="button" class="absolute right-2 cursor-pointer rounded border-none bg-transparent p-2 transition-all duration-150" :class="[themeClasses.explorerClearButton, themeClasses.explorerClearButtonHover]" @click="clearSearch">
          <Icon :icon="closeIcon" class="h-4 w-4" />
        </button>
      </div>

      <div class="finder-scopes mt-3">
        <Segmented v-model:value="scope" :options="scopeOptions" :block="isMobile || isCompact" :class="themeClasses.scopeSelector">
          <template #label="{ payload }">
            <div class="flex min-h-[inherit] items-center justify-center gap-1.5 px-1">
              <Icon :icon="payload.icon" class="h-4 w-4 shrink-0" />
              <span v-if="!isCompact">{{ $t(payload.label) }}</span>
            </div>
          </template>
        </Segmented>
      </div>
    </div>

    <div class="flex min-h-0 flex-1">
      <div ref="listRef" class="min-h-0 overflow-y-auto p-2" :class="showPreview ? ['w-[42%] min-w-[260px] max-w-[400px] shrink-0 border-r', themeClasses.explorerHeaderBorder] : 'flex-1'">
        <template v-if="flatEntries.length > 0">
          <section v-for="group in groups" :key="group.key" class="mb-3 last:mb-0">
            <h3 class="m-0 mb-1 px-2 pt-1 text-[0.6875rem] font-semibold" :class="themeClasses.explorerGroupHeader">{{ $t(group.title) }}</h3>

            <button v-for="entry in group.entries" :key="entry.id" type="button" :data-entry-id="entry.id" class="finder-row" :class="entry.id === selected?.id ? themeClasses.finderRowSelected : themeClasses.finderRowHover" @click="handleRowClick(entry)" @dblclick="runPrimary(entry)">
              <span class="flex h-7 w-7 shrink-0 items-center justify-center">
                <StartMenuAppIcon v-if="entry.type === 'app'" :app="entry.app" :size="26" />
                <AppIconGraphic v-else-if="entry.type === 'store'" :image-src="storeImage(entry.storeApp)" :size="26" />
                <FolderGraphic v-else-if="entry.file.target.isDirectory" :size="26" />
                <FileGraphic v-else :name="entry.file.target.fileName" :size="26" />
              </span>
              <span class="flex min-w-0 flex-1 flex-col">
                <span class="truncate text-[0.8125rem] font-medium" :class="entry.id === selected?.id ? themeClasses.finderRowSelectedText : themeClasses.explorerItemName">{{ entry.title }}</span>
                <span v-if="entry.subtitle" class="truncate text-[0.6875rem]" :class="entry.id === selected?.id ? themeClasses.finderRowSelectedSubtext : themeClasses.explorerItemDescription">{{ entry.subtitle }}</span>
              </span>
            </button>
          </section>

          <p v-if="filesSearching" class="m-0 px-2 py-2 text-xs" :class="themeClasses.explorerItemDescription">{{ $t("Searching...") }}</p>
        </template>

        <div v-else class="flex h-full flex-col items-center justify-center gap-2 px-6 py-12 text-center">
          <Icon :icon="hasQuery ? searchOffIcon : searchIcon" class="mb-1 h-10 w-10" :class="themeClasses.explorerEmptyIcon" />
          <template v-if="hasQuery">
            <p class="m-0 text-sm font-medium" :class="themeClasses.explorerEmptyText">{{ filesSearching ? $t("Searching...") : $t('No results found for "{query}"', { query }) }}</p>
            <p v-if="!filesSearching" class="m-0 text-xs" :class="themeClasses.explorerEmptySubtext">{{ $t("Try different keywords or check your spelling") }}</p>
          </template>
          <p v-else class="m-0 text-sm" :class="themeClasses.explorerEmptySubtext">{{ $t(EMPTY_MESSAGES[scope]) }}</p>
        </div>
      </div>

      <div v-if="showPreview" class="min-h-0 flex-1 overflow-y-auto">
        <Transition name="finder-preview" mode="out-in">
          <div v-if="selected" :key="selected.id" class="flex flex-col items-center px-8 pb-8 pt-10">
            <div class="flex h-32 w-full items-center justify-center">
              <StartMenuAppIcon v-if="selected.type === 'app'" :app="selected.app" :size="88" />
              <AppIconGraphic v-else-if="selected.type === 'store'" :image-src="storeImage(selected.storeApp)" :size="88" />
              <FolderGraphic v-else-if="selected.file.target.isDirectory" :size="96" />
              <FileThumbnail v-else :request="thumbnailRequest(selected.file)" class="h-32 w-52">
                <FileGraphic :name="selected.file.target.fileName" :size="96" />
              </FileThumbnail>
            </div>

            <h2 class="m-0 mt-4 max-w-full break-words text-center text-lg font-semibold" :class="themeClasses.explorerItemName">{{ selected.title }}</h2>
            <p class="m-0 mt-0.5 text-center text-xs" :class="themeClasses.explorerItemDescription">{{ kindLabel(selected) }}</p>
            <p v-if="previewDescription" class="m-0 mt-3 max-w-sm text-center text-xs leading-relaxed" :class="themeClasses.explorerItemDescription">{{ previewDescription }}</p>

            <dl v-if="previewFacts.length > 0" class="m-0 mt-6 w-full max-w-sm">
              <div v-for="fact in previewFacts" :key="fact.label" class="flex items-baseline justify-between gap-4 py-2 text-xs last:border-b-0" :class="themeClasses.appPropsInfoRowBorder">
                <dt class="shrink-0" :class="themeClasses.appPropsInfoLabel">{{ $t(fact.label) }}</dt>
                <dd class="m-0 flex min-w-0 items-center gap-1.5 text-right" :class="themeClasses.appPropsInfoValue">
                  <span v-if="fact.dot" class="h-2 w-2 shrink-0 rounded-full" :class="fact.dot"></span>
                  <span class="truncate" :title="fact.value">{{ fact.value }}</span>
                </dd>
              </div>
            </dl>

            <div class="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button v-for="action in previewActions" :key="action.label" type="button" class="finder-action" :class="action.primary ? [themeClasses.packagerPrimaryButtonBg, themeClasses.packagerPrimaryButtonBgHover, themeClasses.packagerPrimaryButtonText] : [themeClasses.explorerActionButton, themeClasses.explorerActionButtonHover]" @click="action.run()">
                <Icon :icon="action.icon" class="h-4 w-4" />
                {{ action.label }}
              </button>
            </div>
          </div>

          <div v-else key="none" class="flex h-full items-center justify-center">
            <Icon :icon="fileSearchIcon" class="h-16 w-16" :class="themeClasses.explorerEmptyIcon" />
          </div>
        </Transition>
      </div>
    </div>

    <StatusBar :icon="fileSearchIcon" :message="$t('Finder')" :info="`${flatEntries.length} ${flatEntries.length === 1 ? $t('item') : $t('items')}`" :showHelp="true">
      <template #help>
        <div class="max-w-sm space-y-2.5">
          <div class="flex items-center gap-2">
            <StatusBarHelpIcon :icon="fileSearchIcon" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">{{ $t("Finder") }}</h4>
          </div>

          <div :class="['space-y-2 text-[10px] leading-relaxed md:text-xs', themeClasses.statusBarInfo]">
            <p>{{ $t("Search across all available content in HomeDock OS including system applications, installed applications, available software from the App Store, and encrypted files stored in Drop Zone. Use filters to narrow results by category or search by name to quickly find what you need.") }}</p>
          </div>
        </div>
      </template>
    </StatusBar>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";

import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Segmented, message } from "ant-design-vue";

import { useDesktopStore, shortcutTargetData, type ShortcutTarget } from "../__Stores__/desktopStore";
import { useAppStore } from "../__Stores__/useAppStore";
import { useWindowStore } from "../__Stores__/windowStore";
import { useFileExplorerStore, type RecentItem } from "../__Stores__/useFileExplorerStore";
import { useUploadingStore } from "../__Stores__/useUploadingStore";
import { useResponsive } from "../__Composables__/useResponsive";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useStartMenuApps, type StartMenuApp } from "../__Composables__/useStartMenuApps";
import { THUMBNAIL_EXTENSIONS, thumbnailExtension, type ThumbnailRequest } from "../__Composables__/useThumbnails";
import { useTheme } from "../__Themes__/ThemeSelector";
import { startContainer } from "../__Services__/DockerActions";
import type { App as StoreApp } from "../__Types__/AppStoreApp";

import StatusBar from "../__Components__/StatusBar.vue";
import StatusBarHelpIcon from "../__Components__/StatusBarHelpIcon.vue";
import AppIconGraphic from "../__Components__/AppIconGraphic.vue";
import FileGraphic from "../__Components__/FileGraphic.vue";
import FolderGraphic from "../__Components__/FolderGraphic.vue";
import FileThumbnail from "../__Components__/FileThumbnail.vue";
import StartMenuAppIcon from "../__Desktop__/StartMenuAppIcon.vue";

import { Icon } from "@iconify/vue";
import searchIcon from "@iconify-icons/mdi/magnify";
import searchOffIcon from "@iconify-icons/mdi/magnify-close";
import closeIcon from "@iconify-icons/mdi/close";
import allInclusiveIcon from "@iconify-icons/mdi/all-inclusive";
import appsIcon from "@iconify-icons/mdi/apps";
import fileIcon from "@iconify-icons/mdi/file-document";
import storeIcon from "@iconify-icons/mdi/shopping";
import fileSearchIcon from "@iconify-icons/mdi/file-search";
import openInNewIcon from "@iconify-icons/mdi/open-in-new";
import folderOpenIcon from "@iconify-icons/mdi/folder-open-outline";
import playIcon from "@iconify-icons/mdi/play";
import propertiesIcon from "@iconify-icons/mdi/information-outline";
import pinIcon from "@iconify-icons/mdi/pin-outline";
import unpinIcon from "@iconify-icons/mdi/pin-off-outline";
import installIcon from "@iconify-icons/mdi/plus-circle-outline";

type Scope = "all" | "apps" | "files" | "store";

interface FinderFile {
  target: ShortcutTarget;
  size?: number;
  modified?: number;
}

type FinderEntry = { id: string; type: "app"; title: string; subtitle?: string; score: number; app: StartMenuApp } | { id: string; type: "file"; title: string; subtitle?: string; score: number; file: FinderFile } | { id: string; type: "store"; title: string; subtitle?: string; score: number; storeApp: StoreApp };

interface FinderGroup {
  key: string;
  title: string;
  entries: FinderEntry[];
}

interface PreviewFact {
  label: string;
  value: string;
  dot?: string;
}

interface PreviewAction {
  label: string;
  icon: any;
  primary?: boolean;
  run: () => void;
}

interface StorageSearchEntry {
  name: string;
  size?: number;
  modified?: number;
  is_directory: boolean;
}

const MIN_SCORE = 60;
const TOP_HIT_MIN_SCORE = 80;
const COMPACT_WIDTH = 640;
const NARROW_WIDTH = 480;
const FILE_SEARCH_MIN_LENGTH = 2;
const FILE_SEARCH_DEBOUNCE_MS = 300;
const STORAGE_RESULTS_LIMIT = 50;
const RECENT_LIMIT = 8;
const ALL_SCOPE_LIMITS = { apps: 8, files: 8, store: 6 };

const LOCATION_LABELS: Record<ShortcutTarget["location"], string> = {
  storage: "Storage",
  dropzone: "Drop Zone",
  appdrive: "App Drive",
  disksplus: "Disks+",
};

const KIND_LABELS: Record<StartMenuApp["kind"], string> = {
  system: "System",
  enterprise: "Enterprise",
  docker: "App",
  utility: "Utility",
  game: "Game",
};

const STATUS_LABELS: Record<string, string> = {
  running: "Running",
  paused: "Paused",
  exited: "Stopped",
  created: "Created",
  restarting: "Restarting",
};

const EMPTY_MESSAGES: Record<Scope, string> = {
  all: "Start typing to search across HomeDock OS",
  apps: "No apps found",
  files: "Apps and files you open will show up here.",
  store: "All apps are already installed",
};

const scopeOptions = [
  { value: "all", payload: { label: "All", icon: allInclusiveIcon } },
  { value: "apps", payload: { label: "Apps", icon: appsIcon } },
  { value: "files", payload: { label: "Files", icon: fileIcon } },
  { value: "store", payload: { label: "App Store", icon: storeIcon } },
];

const { t, locale } = useI18n();
const desktopStore = useDesktopStore();
const appStore = useAppStore();
const windowStore = useWindowStore();
const fileExplorerStore = useFileExplorerStore();
const uploadingStore = useUploadingStore();
const csrfToken = useCsrfToken();
const { isMobile } = useResponsive();
const { themeClasses } = useTheme();
const { systemApps, enterpriseApps, installedApps, utilityApps, gameApps, allApps, recentApps, appName, launchApp } = useStartMenuApps();

const rootRef = ref<HTMLElement | null>(null);
const listRef = ref<HTMLElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);

const searchQuery = ref("");
const scope = ref<Scope>("all");
const selectedId = ref<string | null>(null);
const rootWidth = ref(Number.POSITIVE_INFINITY);

const dropzoneFiles = ref<FinderFile[]>([]);
const storageResults = ref<FinderFile[]>([]);
const filesSearching = ref(false);
let fileSearchTimer: ReturnType<typeof setTimeout> | null = null;
let fileSearchSeq = 0;
let resizeObserver: ResizeObserver | null = null;

const query = computed(() => searchQuery.value.trim());
const hasQuery = computed(() => query.value.length > 0);
const isCompact = computed(() => rootWidth.value < NARROW_WIDTH);
const showPreview = computed(() => !isMobile.value && rootWidth.value >= COMPACT_WIDTH);

const availableApps = computed(() => appStore.apps.filter((app) => !app.is_installed).sort((a, b) => storeName(a).localeCompare(storeName(b))));

function calculateScore(text: string, needle: string): number {
  if (!text || !needle) return 0;

  const lowerText = text.toLowerCase();
  const lowerQuery = needle.toLowerCase();

  if (lowerText === lowerQuery) return 100;
  if (lowerText.startsWith(lowerQuery)) return 95;

  const escapedQuery = lowerQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`\\b${escapedQuery}\\b`, "i").test(lowerText)) return 90;
  if (lowerText.includes(lowerQuery)) return 85;

  for (const word of lowerText.split(/[\s-_]+/)) {
    if (word.startsWith(lowerQuery)) return 80;
    if (word.includes(lowerQuery)) return 75;
  }

  let textIndex = 0;
  let queryIndex = 0;
  let matches = 0;

  while (textIndex < lowerText.length && queryIndex < lowerQuery.length) {
    if (lowerText[textIndex] === lowerQuery[queryIndex]) {
      matches++;
      queryIndex++;
    }
    textIndex++;
  }

  if (queryIndex === lowerQuery.length) {
    const proximityScore = 1 - (textIndex - matches) / lowerText.length;
    return Math.floor(60 * proximityScore);
  }

  return 0;
}

function storeName(app: StoreApp): string {
  return app.display_name || app.name;
}

function storeImage(app: StoreApp): string {
  return app.picture_path || `docker-icons/${app.name}.jpg`;
}

function fileLocation(target: ShortcutTarget): string {
  return [t(LOCATION_LABELS[target.location]), ...target.path.split("/").filter(Boolean)].join(" / ");
}

function appSubtitle(app: StartMenuApp): string {
  if (app.kind === "docker" && app.dockerApp) return t(STATUS_LABELS[app.dockerApp.status] || "App");
  return t(KIND_LABELS[app.kind]);
}

function appEntry(app: StartMenuApp, score = 0): FinderEntry {
  return { id: `app-${app.key}`, type: "app", title: appName(app), subtitle: appSubtitle(app), score, app };
}

function fileEntry(file: FinderFile, score = 0): FinderEntry {
  const target = file.target;
  return { id: `file-${target.location}-${target.container ?? ""}-${target.diskId ?? ""}-${target.path}/${target.fileName}`, type: "file", title: target.fileName, subtitle: fileLocation(target), score, file };
}

function storeEntry(app: StoreApp, score = 0): FinderEntry {
  return { id: `store-${app.name}`, type: "store", title: storeName(app), subtitle: t(app.category), score, storeApp: app };
}

function splitPath(relativePath: string): { path: string; fileName: string } {
  const parts = relativePath.split("/").filter(Boolean);
  return { fileName: parts.pop() || relativePath, path: parts.join("/") };
}

function recentFile(item: RecentItem): FinderFile {
  return {
    target: { location: item.location, path: item.path, fileName: splitPath(item.name).fileName, isDirectory: item.is_directory, container: item.container, mountIndex: item.mount_index, diskId: item.disk },
  };
}

const recentFileEntries = computed(() =>
  [...fileExplorerStore.recents]
    .sort((a, b) => b.accessed_at - a.accessed_at)
    .slice(0, RECENT_LIMIT)
    .map((item) => fileEntry(recentFile(item))),
);

function scoreApp(app: StartMenuApp): number {
  return Math.max(calculateScore(appName(app), query.value), calculateScore(app.name, query.value), app.description ? calculateScore(app.description, query.value) * 0.8 : 0);
}

const matchedApps = computed(() =>
  allApps.value
    .map((app) => appEntry(app, scoreApp(app)))
    .filter((entry) => entry.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score),
);

const matchedStore = computed(() =>
  availableApps.value
    .map((app) => storeEntry(app, Math.max(calculateScore(storeName(app), query.value), calculateScore(app.category, query.value) * 0.6)))
    .filter((entry) => entry.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score),
);

const matchedFiles = computed(() => {
  const dropzone = dropzoneFiles.value.map((file) => fileEntry(file, calculateScore(file.target.fileName, query.value))).filter((entry) => entry.score >= MIN_SCORE);
  const storage = storageResults.value.map((file) => fileEntry(file, calculateScore(file.target.fileName, query.value)));
  return [...storage, ...dropzone].sort((a, b) => b.score - a.score);
});

function searchGroups(): FinderGroup[] {
  if (scope.value === "apps") return [{ key: "apps", title: "Apps", entries: matchedApps.value }];
  if (scope.value === "files") return [{ key: "files", title: "Files", entries: matchedFiles.value }];
  if (scope.value === "store") return [{ key: "store", title: "App Store", entries: matchedStore.value }];

  const candidates = [matchedApps.value[0], matchedFiles.value[0], matchedStore.value[0]].filter((entry): entry is FinderEntry => Boolean(entry));
  const best = candidates.reduce<FinderEntry | undefined>((current, entry) => (!current || entry.score > current.score ? entry : current), undefined);
  const topHit = best && best.score >= TOP_HIT_MIN_SCORE ? best : undefined;
  const withoutTop = (entries: FinderEntry[]) => entries.filter((entry) => entry.id !== topHit?.id);

  return [
    { key: "top", title: "Top Hit", entries: topHit ? [topHit] : [] },
    { key: "apps", title: "Apps", entries: withoutTop(matchedApps.value).slice(0, ALL_SCOPE_LIMITS.apps) },
    { key: "files", title: "Files", entries: withoutTop(matchedFiles.value).slice(0, ALL_SCOPE_LIMITS.files) },
    { key: "store", title: "App Store", entries: withoutTop(matchedStore.value).slice(0, ALL_SCOPE_LIMITS.store) },
  ];
}

function browseGroups(): FinderGroup[] {
  if (scope.value === "apps") {
    return [
      { key: "enterprise", title: "Enterprise", entries: enterpriseApps.value.map((app) => appEntry(app)) },
      { key: "system", title: "System Apps", entries: systemApps.value.map((app) => appEntry(app)) },
      { key: "installed", title: "Installed Apps", entries: installedApps.value.map((app) => appEntry(app)) },
      { key: "utilities", title: "Utilities", entries: utilityApps.value.map((app) => appEntry(app)) },
      { key: "games", title: "Games", entries: gameApps.value.map((app) => appEntry(app)) },
    ];
  }

  if (scope.value === "files") {
    return [
      { key: "recent-files", title: "Recent Files", entries: recentFileEntries.value },
      { key: "dropzone", title: "Drop Zone", entries: dropzoneFiles.value.map((file) => fileEntry(file)) },
    ];
  }

  if (scope.value === "store") return [{ key: "store", title: "Available in Store", entries: availableApps.value.map((app) => storeEntry(app)) }];

  return [
    { key: "recent-apps", title: "Recent Apps", entries: recentApps.value.slice(0, RECENT_LIMIT).map(({ app }) => appEntry(app)) },
    { key: "recent-files", title: "Recent Files", entries: recentFileEntries.value },
  ];
}

const groups = computed<FinderGroup[]>(() => (hasQuery.value ? searchGroups() : browseGroups()).filter((group) => group.entries.length > 0));

const flatEntries = computed(() => groups.value.flatMap((group) => group.entries));

const selected = computed(() => flatEntries.value.find((entry) => entry.id === selectedId.value) ?? flatEntries.value[0] ?? null);

function formatSize(size: number): string {
  if (size >= 1e9) return `${(size / 1e9).toFixed(1)} GB`;
  if (size >= 1e6) return `${(size / 1e6).toFixed(1)} MB`;
  if (size >= 1e3) return `${(size / 1e3).toFixed(1)} KB`;
  return `${size} B`;
}

function formatDate(seconds: number): string {
  return new Intl.DateTimeFormat(locale.value, { dateStyle: "medium", timeStyle: "short" }).format(new Date(seconds * 1000));
}

function kindLabel(entry: FinderEntry): string {
  if (entry.type === "app") return entry.app.kind === "docker" ? t("Installed Apps") : t(KIND_LABELS[entry.app.kind]);
  if (entry.type === "store") return t("Available in Store");
  if (entry.file.target.isDirectory) return t("Folder");
  if (entry.file.target.location === "dropzone") return t("Encrypted file");

  const extension = thumbnailExtension(entry.file.target.fileName);
  return extension ? extension.toUpperCase() : t("File");
}

const previewDescription = computed(() => {
  const entry = selected.value;
  if (!entry) return "";
  if (entry.type === "store") return entry.storeApp.description;
  if (entry.type === "app" && entry.app.kind !== "docker" && entry.app.description) return t(entry.app.description);
  return "";
});

const previewFacts = computed<PreviewFact[]>(() => {
  const entry = selected.value;
  if (!entry) return [];

  if (entry.type === "app") {
    const docker = entry.app.dockerApp;
    if (!docker) return [{ label: "Type", value: t(KIND_LABELS[entry.app.kind]) }];

    const ports = docker.ports.filter((port) => /^\d/.test(port));
    return [{ label: "Status", value: t(STATUS_LABELS[docker.status] || docker.status), dot: statusDot(docker.status) }, { label: "Image", value: docker.image }, ...(ports.length > 0 ? [{ label: "Ports", value: [...new Set(ports)].join(", ") }] : [])];
  }

  if (entry.type === "store") {
    return [{ label: "Category", value: t(entry.storeApp.category) }, ...(entry.storeApp.version ? [{ label: "Version", value: entry.storeApp.version }] : [])];
  }

  const file = entry.file;
  return [{ label: "Type", value: kindLabel(entry) }, ...(file.size !== undefined && !file.target.isDirectory ? [{ label: "Size", value: formatSize(file.size) }] : []), ...(file.modified ? [{ label: "Modified", value: formatDate(file.modified) }] : []), { label: "Location", value: fileLocation(file.target) }];
});

function statusDot(status: string): string {
  const dots: Record<string, string> = {
    running: themeClasses.value.statusBadgeRunning,
    exited: themeClasses.value.statusBadgeExited,
    paused: themeClasses.value.statusBadgePaused,
    created: themeClasses.value.statusBadgeCreated,
    restarting: themeClasses.value.statusBadgeRestarting,
  };
  return dots[status] || themeClasses.value.statusBadgeCreated;
}

function pinAction(app: StartMenuApp): PreviewAction {
  const pinned = desktopStore.isAppPinned(app.key);
  return { label: t(pinned ? "Unpin from Start" : "Pin to Start"), icon: pinned ? unpinIcon : pinIcon, run: () => desktopStore.togglePinApp(app.key) };
}

function actionsFor(entry: FinderEntry): PreviewAction[] {
  if (entry.type === "store") return [{ label: t("Install"), icon: installIcon, primary: true, run: () => openAppStore(entry.storeApp) }];

  if (entry.type === "file") {
    const isDirectory = entry.file.target.isDirectory;
    return [{ label: t(isDirectory ? "Open" : "Show in File Explorer"), icon: folderOpenIcon, primary: true, run: () => openFile(entry.file) }];
  }

  const app = entry.app;
  const docker = app.dockerApp;

  if (!docker) return [{ label: t("Open"), icon: openInNewIcon, primary: true, run: () => launchApp(app) }, pinAction(app)];

  const properties: PreviewAction = { label: t("Properties"), icon: propertiesIcon, run: () => openProperties(app) };

  if (docker.status === "running") return [{ label: t("Open"), icon: openInNewIcon, primary: true, run: () => launchApp(app) }, properties, pinAction(app)];
  if (docker.status === "exited" || docker.status === "created") return [{ label: t("Start", 2), icon: playIcon, primary: true, run: () => startContainer(docker, csrfToken.value, themeClasses.value.scopeSelector) }, properties, pinAction(app)];

  return [{ ...properties, primary: true }, pinAction(app)];
}

const previewActions = computed(() => (selected.value ? actionsFor(selected.value) : []));

function runPrimary(entry: FinderEntry) {
  actionsFor(entry)
    .find((action) => action.primary)
    ?.run();
}

function handleRowClick(entry: FinderEntry) {
  if (showPreview.value) {
    selectedId.value = entry.id;
    return;
  }

  runPrimary(entry);
}

function openFile(file: FinderFile) {
  windowStore.openFileInApp("fileexplorer", { data: shortcutTargetData(file.target) });
}

function openProperties(app: StartMenuApp) {
  const docker = app.dockerApp;
  if (!docker) return;

  windowStore.openUniqueWindow("properties", docker.id, {
    title: `${docker.display_name || docker.name} - ${t("Properties")}`,
    data: { appId: docker.id },
  });
}

function openAppStore(app: StoreApp) {
  const existingWindow = windowStore.windows.find((w) => w.appId === "installconfig" && w.data?.app?.name === app.name);

  if (existingWindow) {
    windowStore.focusWindow(existingWindow.id);
    existingWindow.isMinimized = false;
    return;
  }

  if (!appStore.apps.some((candidate) => candidate.name === app.name)) {
    message.error(t("App {name} not found", { name: app.name }));
    return;
  }

  windowStore.openUniqueWindow("installconfig", app.name, {
    title: t("Install {name}", { name: storeName(app) }),
    data: { app },
  });
}

function thumbnailRequest(file: FinderFile): ThumbnailRequest | null {
  const target = file.target;
  if (target.isDirectory || !THUMBNAIL_EXTENSIONS.has(thumbnailExtension(target.fileName))) return null;
  if (target.location !== "storage" && target.location !== "dropzone") return null;

  const relativePath = target.path ? `${target.path}/${target.fileName}` : target.fileName;
  const version = `${file.modified ?? 0}-${file.size ?? 0}`;
  return { key: `${target.location}|${relativePath}|${version}`, url: `/api/${target.location}/thumbnail`, params: { file: relativePath, v: version } };
}

function clearSearch() {
  searchQuery.value = "";
  searchInputRef.value?.focus();
}

function scrollSelectedIntoView() {
  nextTick(() => {
    const rows = listRef.value?.querySelectorAll<HTMLElement>("[data-entry-id]") ?? [];
    Array.from(rows)
      .find((row) => row.dataset.entryId === selected.value?.id)
      ?.scrollIntoView({ block: "nearest" });
  });
}

function handleKeyDown(event: KeyboardEvent) {
  const entries = flatEntries.value;

  if (event.key === "Escape" && searchQuery.value) {
    event.preventDefault();
    clearSearch();
    return;
  }

  if (entries.length === 0) return;

  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    const index = entries.findIndex((entry) => entry.id === selected.value?.id);
    const step = event.key === "ArrowDown" ? 1 : -1;
    selectedId.value = entries[Math.min(Math.max(index + step, 0), entries.length - 1)].id;
    scrollSelectedIntoView();
  } else if (event.key === "Enter" && selected.value) {
    event.preventDefault();
    runPrimary(selected.value);
  }
}

async function fetchDropZoneFiles() {
  try {
    const { data } = await axios.get("/api/dropzone/files", { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });
    dropzoneFiles.value = (data.files || []).map((file: { name: string; size?: number; modified?: number; is_directory?: boolean }) => ({ size: file.size, modified: file.modified, target: { location: "dropzone", path: "", fileName: file.name, isDirectory: file.is_directory === true } }));
  } catch (error) {
    console.error("Failed to fetch DropZone files:", error);
  }
}

function searchStorage() {
  if (fileSearchTimer) clearTimeout(fileSearchTimer);

  const seq = ++fileSearchSeq;
  const needle = query.value;
  storageResults.value = [];

  if (needle.length < FILE_SEARCH_MIN_LENGTH || (scope.value !== "all" && scope.value !== "files")) {
    filesSearching.value = false;
    return;
  }

  filesSearching.value = true;
  fileSearchTimer = setTimeout(async () => {
    try {
      const { data } = await axios.get<{ files?: StorageSearchEntry[] }>("/api/storage/search", { params: { query: needle }, headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });
      if (seq !== fileSearchSeq) return;
      storageResults.value = (data.files ?? []).slice(0, STORAGE_RESULTS_LIMIT).map((entry) => ({ size: entry.size, modified: entry.modified, target: { location: "storage", ...splitPath(entry.name), isDirectory: entry.is_directory } }));
    } catch {
      if (seq === fileSearchSeq) storageResults.value = [];
    } finally {
      if (seq === fileSearchSeq) filesSearching.value = false;
    }
  }, FILE_SEARCH_DEBOUNCE_MS);
}

watch([query, scope], () => {
  selectedId.value = null;
  searchStorage();
  if (listRef.value) listRef.value.scrollTop = 0;
});

watch(
  () => uploadingStore.currentlyUploadingAt("dropzone"),
  (current, previous) => {
    if (previous && previous.length > 0 && (!current || current.length === 0)) setTimeout(fetchDropZoneFiles, 500);
  },
);

watch(
  () => uploadingStore.currentlyUploadingAt("storage"),
  (current, previous) => {
    if (previous && previous.length > 0 && (!current || current.length === 0)) setTimeout(searchStorage, 500);
  },
);

onMounted(() => {
  if (rootRef.value) {
    resizeObserver = new ResizeObserver(([entry]) => {
      rootWidth.value = entry.contentRect.width;
    });
    resizeObserver.observe(rootRef.value);
  }

  appStore.loadApps(csrfToken.value).catch((error) => console.error("Failed to load available apps:", error));
  fileExplorerStore.fetchRecents();
  fetchDropZoneFiles();

  if (!isMobile.value) nextTick(() => searchInputRef.value?.focus());
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  if (fileSearchTimer) clearTimeout(fileSearchTimer);
});
</script>

<style scoped>
.finder-scopes {
  overflow-x: auto;
  scrollbar-width: none;
}

.finder-scopes::-webkit-scrollbar {
  display: none;
}

.finder-row {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  gap: 0.625rem;
  border: 0;
  border-radius: 0.5rem;
  padding: 0.3125rem 0.5rem;
  text-align: left;
  cursor: default;
}

.finder-action {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  border: 0;
  border-radius: 0.5rem;
  padding: 0.4375rem 0.875rem;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.finder-preview-enter-active,
.finder-preview-leave-active {
  transition: opacity 0.12s ease;
}

.finder-preview-enter-from,
.finder-preview-leave-to {
  opacity: 0;
}
</style>
