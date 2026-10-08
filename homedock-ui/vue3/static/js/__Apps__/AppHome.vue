<!-- homedock-ui/vue3/static/js/__Apps__/AppHome.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div ref="containerRef" class="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4">
      <section class="home-section">
        <h2 :class="[themeClasses.storeModalAppName]" class="home-section-title">{{ $t("Folders") }}</h2>
        <div class="folder-grid">
          <button v-for="folder in storageFolders" :key="folder" type="button" class="folder-tile" @click="openStorageFolder(folder)">
            <FolderGraphic :emblem="specialFolderIcons[folder]" :emblem-key="folder" :size="60" />
            <span :class="[themeClasses.explorerItemName]" class="folder-name">{{ $t(folder) }}</span>
          </button>
        </div>
      </section>

      <section class="home-section">
        <h2 :class="[themeClasses.storeModalAppName, themeClasses.storeListSeparator]" class="home-section-title home-section-divided">{{ $t("Devices and drives") }}</h2>
        <div class="card-grid">
          <button v-for="drive in drives" :key="drive.key" type="button" :class="[themeClasses.appPropsUsageCardBg, themeClasses.appPropsUsageCardBorder, themeClasses.aeroExtraScope]" class="home-card" :title="$t('Open in File Explorer')" @click="openDrive(drive.disk)">
            <span class="flex items-center gap-3 min-w-0">
              <AppIconGraphic :icon="drive.icon" :color="drive.color" :size="40" />
              <span class="flex flex-col flex-1 min-w-0 text-left">
                <span class="flex items-center gap-1.5 min-w-0">
                  <span :class="[themeClasses.windowTitleTextFocused]" class="text-[13px] font-semibold truncate">{{ drive.name }}</span>
                  <Icon v-if="drive.tracked" :icon="pinIcon" :class="[themeClasses.appPropsInfoLabel]" class="w-3 h-3 flex-shrink-0" :title="$t('Tracked external disk')" />
                </span>
                <span :class="[themeClasses.appPropsInfoLabel]" class="text-[11px] truncate">{{ drive.subtitle }}</span>
              </span>
              <span :class="[themeClasses.appPropsInfoValue]" class="text-[13px] font-semibold tabular-nums flex-shrink-0">{{ drive.percent }}%</span>
            </span>
            <span class="usage-track">
              <span class="usage-fill" :class="drive.percent >= FULL_THRESHOLD ? 'usage-fill-full' : ''" :style="{ width: `${drive.percent}%` }"></span>
            </span>
            <span :class="[themeClasses.appPropsInfoLabel]" class="text-[11px] tabular-nums text-left">{{ $t("{free} free of {total}", { free: drive.free, total: drive.total }) }}</span>
          </button>
        </div>
      </section>

      <section class="home-section">
        <h2 :class="[themeClasses.storeModalAppName, themeClasses.storeListSeparator]" class="home-section-title home-section-divided">{{ $t("Locations") }}</h2>
        <div class="card-grid">
          <button v-for="location in locations" :key="location.key" type="button" :class="[themeClasses.appPropsUsageCardBg, themeClasses.appPropsUsageCardBorder, themeClasses.aeroExtraScope]" class="home-card" :disabled="location.disabled" @click="location.open()">
            <span class="flex items-center gap-3 min-w-0">
              <AppIconGraphic :icon="location.icon" :color="location.color" :size="40" />
              <span class="flex flex-col flex-1 min-w-0 text-left">
                <span :class="[themeClasses.windowTitleTextFocused]" class="text-[13px] font-semibold truncate">{{ $t(location.name) }}</span>
                <span :class="[themeClasses.appPropsInfoLabel]" class="text-[11px] truncate">{{ location.subtitle }}</span>
              </span>
              <Icon v-if="location.locked" :icon="lockIcon" :class="[themeClasses.appPropsInfoLabel]" class="w-3.5 h-3.5 flex-shrink-0" />
            </span>
          </button>
        </div>
      </section>

      <section v-for="group in appGroups" :key="group.title" class="home-section">
        <h2 :class="[themeClasses.storeModalAppName, themeClasses.storeListSeparator]" class="home-section-title home-section-divided">{{ $t(group.title) }}</h2>
        <div class="app-launchpad-grid" :style="launchpadGridStyle">
          <div v-for="app in group.apps" :key="app.id" @click="app.id !== 'apphome' && openApp(app)" class="app-launchpad-item group cursor-pointer">
            <AppIconGraphic :icon="app.icon" :color="app.color" :size="52" class="app-launchpad-icon" />
            <span class="app-launchpad-name" :class="themeClasses.explorerItemName">{{ $t(app.name) }}</span>
          </div>
        </div>
      </section>

      <section v-if="recentFiles.length" class="home-section">
        <h2 :class="[themeClasses.storeModalAppName, themeClasses.storeListSeparator]" class="home-section-title home-section-divided">{{ $t("Recent Files") }}</h2>
        <div class="recent-grid">
          <button v-for="item in recentFiles" :key="recentKey(item)" type="button" class="recent-row" @click="openRecent(item)" @contextmenu.stop.prevent="openRecentMenu($event, item)">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center">
              <FolderGraphic v-if="item.is_directory" :size="30" />
              <FileGraphic v-else :name="baseName(item.name)" :size="30" />
            </span>
            <span class="flex flex-col flex-1 min-w-0 text-left">
              <span :class="[themeClasses.windowTitleTextFocused]" class="text-[13px] font-medium truncate">{{ baseName(item.name) }}</span>
              <span :class="[themeClasses.appPropsInfoLabel]" class="text-[11px] truncate">{{ relativeTime(item.accessed_at) }} · {{ recentLocation(item) }}</span>
            </span>
          </button>
        </div>
      </section>
    </div>

    <ContextMenu :visible="menu.visible" :x="menu.x" :y="menu.y" :items="menu.items" @close="menu.visible = false" />

    <StatusBar :icon="homedockIcon" :message="$t('My Home')" :info="`${$t('CPU')} ${cpuValue}% • ${$t('RAM')} ${ramValue}% • ${activeContainers}/${totalContainers} ${$t('apps')}`" :showHelp="true">
      <template #help>
        <div class="space-y-2.5 max-w-sm">
          <div class="flex items-center gap-2">
            <StatusBarHelpIcon :icon="homedockIcon" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">{{ $t("My Home") }}</h4>
          </div>

          <div :class="['text-[10px] md:text-xs md:leading-4 space-y-2 leading-relaxed', themeClasses.statusBarInfo]">
            <p>{{ $t("My Home is the front door to your server: your folders, your drives and every app, one click away.") }}</p>
            <p>
              <strong>{{ $t("Devices and drives") }}:</strong> {{ $t("Every disk HomeDock OS can see and how much room it has left. The bar turns red once a disk is 90% full.") }}
            </p>
            <p>
              <strong>{{ $t("Locations") }}:</strong> {{ $t("Storage holds your files, the Drop Zone keeps them encrypted, and App Drive opens the volumes of your apps.") }}
            </p>
          </div>
        </div>
      </template>
    </StatusBar>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";

import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useDesktopStore } from "../__Stores__/desktopStore";
import { useWindowStore } from "../__Stores__/windowStore";
import { useDropZoneStore } from "../__Stores__/useDropZoneStore";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { getFinderApps } from "../__Config__/WindowDefaultDetails";
import { SPECIAL_FOLDER_ICONS as specialFolderIcons } from "../__Config__/FileIcons";

import { useSystemStatsStore } from "../__Stores__/useSystemStatsStore";
import { useDisksPlusStore } from "../__Stores__/useDisksPlusStore";

import type { DiskData } from "../__Types__/DiskData";

import StatusBar from "../__Components__/StatusBar.vue";
import StatusBarHelpIcon from "../__Components__/StatusBarHelpIcon.vue";
import AppIconGraphic from "../__Components__/AppIconGraphic.vue";
import FolderGraphic from "../__Components__/FolderGraphic.vue";
import FileGraphic from "../__Components__/FileGraphic.vue";
import ContextMenu, { type ContextMenuItem } from "../__Components__/ContextMenu.vue";
import { shortcutTargetData } from "../__Stores__/desktopStore";
import { useFileExplorerStore, type RecentItem } from "../__Stores__/useFileExplorerStore";
import folderOpenIcon from "@iconify-icons/mdi/folder-open";
import historyRemoveIcon from "@iconify-icons/mdi/history";
import { homedockIcon } from "../__Config__/HomeDockIcon";

import { Icon } from "@iconify/vue";
import usbFlashIcon from "@iconify-icons/mdi/usb-flash-drive";
import harddiskPlusIcon from "@iconify-icons/mdi/harddisk-plus";
import discIcon from "@iconify-icons/mdi/disc";
import sdIcon from "@iconify-icons/mdi/sd";
import lockIcon from "@iconify-icons/mdi/lock";
import folderIcon from "@iconify-icons/mdi/folder";
import harddiskIcon from "@iconify-icons/mdi/harddisk";
import pinIcon from "@iconify-icons/mdi/pin";
import cubeIcon from "@iconify-icons/mdi/cube";
import cubeScanIcon from "@iconify-icons/mdi/cube-scan";

import { UTILITIES_APPS } from "../__Config__/UtilitiesDefaultDetails";
import { GAMES_APPS } from "../__Config__/GamesDefaultDetails";

const { t, locale } = useI18n();
const { themeClasses } = useTheme();
const desktopStore = useDesktopStore();
const fileExplorerStore = useFileExplorerStore();
const windowStore = useWindowStore();
const dropZoneStore = useDropZoneStore();
const systemStatsStore = useSystemStatsStore();
const diskStore = useDisksPlusStore();
const csrfToken = useCsrfToken();

const FOLDER_ORDER = ["Documents", "Photos", "Music", "Videos", "Downloads", "Archives", "Sources", "Notes"];
const FULL_THRESHOLD = 90;
const SYSTEM_DISK_COLOR = "#475569";
const DISK_COLOR = "#64748b";
const REMOVABLE_DISK_COLOR = "#0891b2";
const RECENT_LIMIT = 8;

const LOCATION_LABELS: Record<RecentItem["location"], string> = {
  storage: "Storage",
  dropzone: "Drop Zone",
  appdrive: "App Drive",
  disksplus: "Disks+",
};

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

interface LocationSummary {
  size: number;
  folders: number;
  files: number;
}

interface AppDriveContainer {
  name: string;
  has_external?: boolean;
}

interface DriveCard {
  key: string;
  disk: DiskData;
  name: string;
  subtitle: string;
  icon: any;
  color: string;
  percent: number;
  free: string;
  total: string;
  tracked: boolean;
}

interface LocationCard {
  key: string;
  name: string;
  subtitle: string;
  icon: any;
  color: string;
  locked?: boolean;
  disabled?: boolean;
  open: () => void;
}

const storageSummary = ref<LocationSummary>({ size: 0, folders: 0, files: 0 });
const dropZoneSummary = ref<LocationSummary>({ size: 0, folders: 0, files: 0 });
const storageFolderNames = ref<string[]>([]);
const appDriveContainers = ref<AppDriveContainer[]>([]);

const containerRef = ref<HTMLElement | null>(null);
const containerWidth = ref(0);

const LAUNCHPAD_MIN_CELL = 88;

const launchpadGridStyle = computed(() => {
  const width = containerWidth.value || 400;
  const cols = Math.max(2, Math.floor(width / LAUNCHPAD_MIN_CELL));
  return { gridTemplateColumns: `repeat(${cols}, 1fr)` };
});

const cpuValue = computed(() => Math.round(parseFloat(systemStatsStore.cpuUsage) || 0));
const ramValue = computed(() => Math.round(parseFloat(systemStatsStore.ramUsage) || 0));
const totalContainers = computed(() => systemStatsStore.totalContainers);
const activeContainers = computed(() => systemStatsStore.activeContainers);

const storageFolders = computed(() => {
  const present = new Set(storageFolderNames.value);
  return FOLDER_ORDER.filter((folder) => present.size === 0 || present.has(folder));
});

function iconForMediaType(mediaType: string) {
  switch (mediaType) {
    case "nvme":
      return harddiskPlusIcon;
    case "ssd":
    case "hdd":
      return harddiskIcon;
    case "usb":
      return usbFlashIcon;
    case "optical":
      return discIcon;
    default:
      return sdIcon;
  }
}

function formatGb(gb: number): string {
  const value = Math.max(0, gb || 0);
  if (value >= 1024) return `${(value / 1024).toFixed(1)} TB`;
  if (value >= 10) return `${value.toFixed(0)} GB`;
  return `${value.toFixed(1)} GB`;
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  return `${Math.round((bytes / Math.pow(k, i)) * 10) / 10} ${sizes[i]}`;
}

function diskSubtitle(disk: DiskData): string {
  const bits: string[] = [];
  if (disk.media_type) bits.push(disk.media_type.toUpperCase());
  if (disk.is_system) bits.push(t("System Disk"));
  else if (disk.internal) bits.push(t("Internal"));
  else if (disk.removable) bits.push(t("Removable"));
  return bits.join(" · ") || t("Disk");
}

function driveCard(disk: DiskData, isSystem: boolean): DriveCard {
  return {
    key: disk.id,
    disk,
    name: isSystem ? disk.label || t("System Disk") : disk.label || disk.device,
    subtitle: diskSubtitle({ ...disk, is_system: isSystem }),
    icon: iconForMediaType(disk.media_type),
    color: isSystem ? SYSTEM_DISK_COLOR : disk.removable && !disk.internal ? REMOVABLE_DISK_COLOR : DISK_COLOR,
    percent: Math.round(disk.usage_percent || 0),
    free: formatGb(disk.free_gb ?? disk.total_gb - disk.used_gb),
    total: formatGb(disk.total_gb),
    tracked: disk.device === diskStore.trackedExternalDevice,
  };
}

const drives = computed<DriveCard[]>(() => {
  const tracked = diskStore.trackedExternalDevice;
  const others = diskStore.otherDisks
    .filter((disk) => !disk.is_system)
    .sort((a, b) => {
      if (a.device === tracked && b.device !== tracked) return -1;
      if (b.device === tracked && a.device !== tracked) return 1;
      if (a.internal && !b.internal) return -1;
      if (!a.internal && b.internal) return 1;
      return (a.label || a.device).localeCompare(b.label || b.device);
    });
  const cards = others.map((disk) => driveCard(disk, false));
  if (diskStore.osDisk) cards.unshift(driveCard(diskStore.osDisk, true));
  return cards;
});

function summaryText(summary: LocationSummary): string {
  const count = summary.folders === 1 ? `1 ${t("folder")}` : `${summary.folders} ${t("folders")}`;
  return `${formatBytes(summary.size)} · ${count}`;
}

const firstAppDriveContainer = computed(() => [...appDriveContainers.value].sort((a, b) => a.name.localeCompare(b.name))[0]?.name || "");

const locations = computed<LocationCard[]>(() => [
  {
    key: "storage",
    name: "Storage",
    subtitle: summaryText(storageSummary.value),
    icon: folderIcon,
    color: "#0ea5e9",
    open: () => openFileExplorer({ initialLocation: "storage" }),
  },
  {
    key: "dropzone",
    name: "Drop Zone",
    subtitle: `${t("Encrypted")} · ${formatBytes(dropZoneSummary.value.size)}`,
    icon: cubeIcon,
    color: "#16a34a",
    open: () => openFileExplorer({ initialLocation: "dropzone" }),
  },
  {
    key: "appdrive",
    name: "App Drive",
    subtitle: `${appDriveContainers.value.length} ${t("apps")}`,
    icon: cubeScanIcon,
    color: "#d97706",
    locked: appDriveContainers.value.some((container) => container.has_external),
    disabled: !firstAppDriveContainer.value,
    open: () => openFileExplorer({ initialLocation: "appdrive", initialContainer: firstAppDriveContainer.value }),
  },
]);

const appGroups = computed(() => [
  { title: "System Applications", apps: getFinderApps() },
  { title: "Utilities", apps: UTILITIES_APPS },
  { title: "Games", apps: GAMES_APPS },
]);

function summarize(files: any[]): LocationSummary {
  return {
    size: files.reduce((sum, file) => sum + (file.size || 0), 0),
    folders: files.filter((item) => item.is_directory).length,
    files: files.filter((item) => !item.is_directory).length,
  };
}

async function fetchStorageInfo() {
  try {
    const response = await axios.get("/api/storage/files", { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });
    const files = Array.isArray(response.data?.files) ? response.data.files : [];
    storageSummary.value = summarize(files);
    storageFolderNames.value = files.filter((item: any) => item.is_directory).map((item: any) => item.name);
  } catch (error) {
    console.error("Failed to fetch storage info:", error);
  }
}

async function fetchDropZoneInfo() {
  try {
    const response = await axios.get("/api/dropzone/files", { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });
    dropZoneSummary.value = summarize(Array.isArray(response.data?.files) ? response.data.files : []);
  } catch (error) {
    console.error("Failed to fetch encrypted storage info:", error);
  }
}

async function fetchAppDriveContainers() {
  try {
    const response = await axios.get("/api/appdrive/containers", { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });
    appDriveContainers.value = Array.isArray(response.data?.containers) ? response.data.containers : [];
  } catch (error) {
    console.error("Failed to fetch App Drive containers:", error);
  }
}

function openApp(app: any) {
  desktopStore.openSystemApp(app.id);
}

function openFileExplorer(data: Record<string, unknown>) {
  windowStore.openFileInApp("fileexplorer", { data });
}

function openStorageFolder(folder: string) {
  openFileExplorer({ initialLocation: "storage", initialPath: folder });
}

function openDrive(disk: DiskData) {
  openFileExplorer({ initialLocation: "disksplus", initialDiskId: disk.id });
}

const recentFiles = computed(() => [...fileExplorerStore.recents].sort((a, b) => b.accessed_at - a.accessed_at).slice(0, RECENT_LIMIT));

const menu = ref<{ visible: boolean; x: number; y: number; items: ContextMenuItem[] }>({ visible: false, x: 0, y: 0, items: [] });

function baseName(path: string): string {
  return path.split("/").filter(Boolean).pop() || path;
}

function recentKey(item: RecentItem): string {
  return `${item.location}-${item.container ?? ""}-${item.disk ?? ""}-${item.name}`;
}

function relativeTime(at: number): string {
  const seconds = Math.round(at - Date.now() / 1000);
  const format = new Intl.RelativeTimeFormat(locale.value, { numeric: "auto" });

  for (const [unit, length] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= length) return format.format(Math.round(seconds / length), unit);
  }

  return format.format(0, "second");
}

function recentLocation(item: RecentItem): string {
  const parts = [t(LOCATION_LABELS[item.location])];
  if (item.container) parts.push(item.container);
  const folder = baseName(item.path || "");
  if (folder) parts.push(folder);
  return parts.join(" › ");
}

function openRecent(item: RecentItem) {
  openFileExplorer(
    shortcutTargetData({
      location: item.location,
      path: item.path,
      fileName: baseName(item.name),
      isDirectory: item.is_directory,
      container: item.container,
      mountIndex: item.mount_index,
      diskId: item.disk,
    }),
  );
}

function openRecentMenu(event: MouseEvent, item: RecentItem) {
  menu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    items: [{ label: "Open", icon: folderOpenIcon, action: () => openRecent(item) }, { divider: true }, { label: "Remove from Recents", icon: historyRemoveIcon, action: () => fileExplorerStore.removeFromRecents({ location: item.location, path: item.path, name: item.name }) }],
  };
}

watch(
  () => dropZoneStore.lastUpdate,
  () => {
    fetchDropZoneInfo();
  },
);

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  fetchStorageInfo();
  fetchDropZoneInfo();
  fetchAppDriveContainers();
  fileExplorerStore.fetchRecents();

  if (containerRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerWidth.value = entry.contentRect.width;
      }
    });
    resizeObserver.observe(containerRef.value);
    containerWidth.value = containerRef.value.clientWidth;
  }
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});
</script>

<style scoped>
.home-section-title {
  margin: 0 0 0.625rem;
  padding-top: 1rem;
  font-size: 15px;
  font-weight: 700;
}

.home-section-divided {
  margin-top: 1.25rem;
  padding-top: 0.875rem;
  border-top-width: 1px;
}

.folder-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
  gap: 0.25rem;
}

.folder-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 0.25rem 0.5rem;
  border: 0;
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.folder-tile:hover {
  background-color: rgba(127, 127, 127, 0.08);
}

.folder-tile:active {
  background-color: rgba(127, 127, 127, 0.14);
}

.folder-name {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 500;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 0.75rem;
}

.home-card {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  min-width: 0;
  padding: 0.875rem;
  border-radius: 1rem;
  cursor: pointer;
  transition: box-shadow 0.15s ease;
}

.home-card:hover:not(:disabled) {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.45);
}

.home-card:disabled {
  cursor: default;
  opacity: 0.6;
}

.usage-track {
  display: block;
  height: 6px;
  border-radius: 9999px;
  overflow: hidden;
  background-color: rgba(127, 127, 127, 0.16);
}

.usage-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background-color: #3b82f6;
  transition:
    width 0.4s ease,
    background-color 0.3s ease;
}

.usage-fill-full {
  background-color: #ef4444;
}

.recent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.125rem 0.5rem;
}

.recent-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-width: 0;
  padding: 0.375rem 0.5rem;
  border: 0;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.recent-row:hover {
  background-color: rgba(127, 127, 127, 0.08);
}

.recent-row:active {
  background-color: rgba(127, 127, 127, 0.14);
}

.app-launchpad-grid {
  display: grid;
  gap: 0.5rem;
}

.app-launchpad-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0;
  border-radius: 12px;
  transition: transform 0.15s ease;
}

.app-launchpad-item:active {
  transform: scale(0.92);
}

.app-launchpad-item .app-launchpad-icon {
  transition:
    transform 0.15s ease,
    filter 0.5s ease,
    opacity 0.5s ease;
}

.app-launchpad-item.cursor-pointer:hover .app-launchpad-icon {
  transform: scale(1.06);
}

.app-launchpad-name {
  font-size: 0.6rem;
  font-weight: 500;
  text-align: center;
  line-height: 1.2;
  max-width: 72px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
