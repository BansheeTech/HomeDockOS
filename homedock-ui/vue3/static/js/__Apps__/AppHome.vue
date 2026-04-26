<!-- homedock-ui/vue3/static/js/__Apps__/AppHome.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div ref="containerRef" class="flex-1 overflow-y-auto px-4 py-4">
      <div class="mb-8">
        <h3 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-3" :class="themeClasses.explorerGroupHeader">
          <Icon :icon="harddiskIcon" class="w-4 h-4" />
          <span>My Devices</span>
        </h3>

        <div class="grid gap-4 mb-4" :class="gridColsClass">
          <div class="flex flex-col gap-3 p-4 rounded-xl border" :class="[themeClasses.windowBorder, themeClasses.statHolder]">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 flex items-center justify-center rounded-lg flex-shrink-0" :class="themeClasses.iconHolder">
                <Icon :icon="cloudIcon" class="w-8 h-8" :class="themeClasses.explorerItemIcon" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-semibold" :class="themeClasses.statInnerText">{{ diskStore.osDisk?.label || "OS Disk" }}</h3>
                <p class="text-xs" :class="themeClasses.statSubtleText">{{ osDiskSubtitle }}</p>
              </div>
              <div class="flex items-center gap-2">
                <div class="text-lg font-bold" :class="themeClasses.statInnerText">{{ diskStore.osDisk?.usage_percent ?? 0 }}%</div>
                <button v-if="diskStore.osDisk" @click="openDiskInExplorer(diskStore.osDisk)" class="p-1 rounded-md transition-colors opacity-40 hover:opacity-100" :class="themeClasses.explorerResultItemHover" title="Open in File Explorer">
                  <Icon :icon="openInNewIcon" class="w-4 h-4" :class="themeClasses.explorerItemIcon" />
                </button>
              </div>
            </div>
            <div class="relative w-full h-2 rounded-full overflow-hidden" :class="themeClasses.processingBarScope">
              <div class="absolute inset-0 h-full bg-blue-500 transition-all duration-150" :style="{ width: (diskStore.osDisk?.usage_percent ?? 0) + '%' }"></div>
              <div class="absolute inset-0 h-full bg-green-500 transition-all duration-150" :style="{ width: encryptedStoragePercentage + '%' }"></div>
            </div>
            <div class="flex justify-between text-xs" :class="themeClasses.statSubtleText">
              <span>{{ formatDiskSize(diskStore.osDisk?.used_gb ?? 0) }} used</span>
              <span>{{ formatDiskSize(diskStore.osDisk?.total_gb ?? 0) }} total</span>
            </div>
            <div @click="openStorage" class="flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all hover:bg-opacity-50" :class="[themeClasses.windowBorder]" style="margin-top: -0.25rem">
              <div class="flex items-center gap-2">
                <Icon :icon="folderIcon" class="w-4 h-4" :class="themeClasses.explorerItemIcon" />
                <span class="text-xs font-medium" :class="themeClasses.statInnerText">Storage: {{ storageInfo.usedFormatted }}</span>
              </div>
              <span class="text-xs" :class="themeClasses.statSubtleText">{{ storageInfo.fileCount }} {{ storageInfo.fileCount === 1 ? "file" : "files" }} • {{ storageInfo.folderCount }} {{ storageInfo.folderCount === 1 ? "folder" : "folders" }}</span>
            </div>
            <div @click="openDropZone" class="flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all hover:bg-opacity-50" :class="[themeClasses.windowBorder]" style="margin-top: -0.5rem">
              <div class="flex items-center gap-2">
                <Icon :icon="lockIcon" class="w-4 h-4" :class="themeClasses.explorerItemIcon" />
                <span class="text-xs font-medium" :class="themeClasses.statInnerText">Encrypted: {{ encryptedStorageInfo.usedFormatted }}</span>
              </div>
              <span class="text-xs" :class="themeClasses.statSubtleText">{{ encryptedStorageInfo.fileCount }} {{ encryptedStorageInfo.fileCount === 1 ? "file" : "files" }} • {{ encryptedStorageInfo.folderCount }} {{ encryptedStorageInfo.folderCount === 1 ? "folder" : "folders" }}</span>
            </div>
          </div>

          <div v-for="disk in disksForHome" :key="disk.id" class="flex flex-col gap-3 p-4 rounded-xl border" :class="[themeClasses.windowBorder, themeClasses.statHolder]">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 flex items-center justify-center rounded-lg flex-shrink-0">
                <Icon :icon="iconForMediaType(disk.media_type)" class="w-8 h-8" :class="themeClasses.explorerItemIcon" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5">
                  <h3 class="text-sm font-semibold truncate" :class="themeClasses.statInnerText">{{ disk.label || disk.device }}</h3>
                  <Icon v-if="disk.device === externalDefaultDisk" :icon="pinIcon" class="w-3 h-3 flex-shrink-0 opacity-70" :class="themeClasses.explorerItemIcon" title="Tracked external disk" />
                </div>
                <p class="text-xs" :class="themeClasses.statSubtleText">{{ subtitleForDisk(disk) }}</p>
              </div>
              <div class="flex items-center gap-2">
                <div class="text-lg font-bold" :class="themeClasses.statInnerText">{{ disk.usage_percent }}%</div>
                <button @click="openDiskInExplorer(disk)" class="p-1 rounded-md transition-colors opacity-40 hover:opacity-100" :class="themeClasses.explorerResultItemHover" title="Open in File Explorer">
                  <Icon :icon="openInNewIcon" class="w-4 h-4" :class="themeClasses.explorerItemIcon" />
                </button>
              </div>
            </div>
            <div class="w-full h-2 rounded-full overflow-hidden" :class="themeClasses.processingBarScope">
              <div class="h-full bg-green-500 transition-all duration-150" :style="{ width: disk.usage_percent + '%' }"></div>
            </div>
            <div class="flex justify-between text-xs" :class="themeClasses.statSubtleText">
              <span>{{ formatDiskSize(disk.used_gb) }} used</span>
              <span>{{ formatDiskSize(disk.total_gb) }} total</span>
            </div>
          </div>
        </div>
      </div>

      <div class="mb-8">
        <h3 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-3" :class="themeClasses.explorerGroupHeader">
          <Icon :icon="serverIcon" class="w-4 h-4" />
          <span>System Overview</span>
        </h3>

        <div class="grid gap-4" :class="gridColsClass">
          <div class="flex flex-col gap-3 p-4 rounded-xl border" :class="[themeClasses.windowBorder, themeClasses.statHolder]">
            <div class="flex items-center gap-2 mb-1">
              <Icon :icon="cpuIcon" class="w-4 h-4" :class="themeClasses.explorerItemIcon" />
              <h3 class="text-xs font-semibold uppercase tracking-wide" :class="themeClasses.statInnerText">Performance</h3>
            </div>

            <div class="space-y-1">
              <div class="flex items-center justify-between text-xs">
                <span :class="themeClasses.statSubtleText">CPU</span>
                <span class="font-semibold" :class="themeClasses.statInnerText">{{ cpuValue }}%</span>
              </div>
              <div class="w-full h-1.5 rounded-full overflow-hidden" :class="themeClasses.processingBarScope">
                <div class="h-full bg-blue-500 transition-all duration-150" :style="{ width: cpuValue + '%' }"></div>
              </div>
              <div class="text-[10px]" :class="themeClasses.statSubtleText">{{ cpuInfoText }}</div>
            </div>

            <div class="space-y-1">
              <div class="flex items-center justify-between text-xs">
                <span :class="themeClasses.statSubtleText">Memory</span>
                <span class="font-semibold" :class="themeClasses.statInnerText">{{ ramValue }}%</span>
              </div>
              <div class="w-full h-1.5 rounded-full overflow-hidden" :class="themeClasses.processingBarScope">
                <div class="h-full bg-purple-500 transition-all duration-150" :style="{ width: ramValue + '%' }"></div>
              </div>
              <div class="text-[10px]" :class="themeClasses.statSubtleText">{{ totalRam }} GB total</div>
            </div>
          </div>

          <div class="flex flex-col gap-3 p-4 rounded-xl border" :class="[themeClasses.windowBorder, themeClasses.statHolder]">
            <div class="flex items-center gap-2 mb-1">
              <Icon :icon="downloadIcon" class="w-4 h-4" :class="themeClasses.explorerItemIcon" />
              <h3 class="text-xs font-semibold uppercase tracking-wide" :class="themeClasses.statInnerText">Network</h3>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1 p-2 rounded-lg border" :class="themeClasses.windowBorder">
                <div class="flex items-center gap-1.5">
                  <Icon :icon="downloadIcon" class="w-3 h-3" :class="themeClasses.explorerItemIcon" />
                  <span class="text-[10px] font-medium" :class="themeClasses.statSubtleText">Download</span>
                </div>
                <div class="text-sm font-bold" :class="themeClasses.statInnerText">
                  {{ networkDownValue }} <span class="text-[10px] font-normal" :class="themeClasses.statSubtleText">{{ networkDownUnit }}</span>
                </div>
              </div>

              <div class="flex flex-col gap-1 p-2 rounded-lg border" :class="themeClasses.windowBorder">
                <div class="flex items-center gap-1.5">
                  <Icon :icon="uploadIcon" class="w-3 h-3" :class="themeClasses.explorerItemIcon" />
                  <span class="text-[10px] font-medium" :class="themeClasses.statSubtleText">Upload</span>
                </div>
                <div class="text-sm font-bold" :class="themeClasses.statInnerText">
                  {{ networkUpValue }} <span class="text-[10px] font-normal" :class="themeClasses.statSubtleText">{{ networkUpUnit }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-3 p-4 rounded-xl border transition-all duration-150" :class="[themeClasses.windowBorder, themeClasses.statHolder]">
            <div class="flex items-center gap-2 mb-1">
              <Icon :icon="serverIcon" class="w-4 h-4" :class="themeClasses.explorerItemIcon" />
              <h3 class="text-xs font-semibold uppercase tracking-wide" :class="themeClasses.statInnerText">System Health</h3>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1 p-2 rounded-lg border" :class="themeClasses.windowBorder">
                <div class="flex items-center gap-1.5">
                  <Icon :icon="uptimeIcon" class="w-3 h-3" :class="themeClasses.explorerItemIcon" />
                  <span class="text-[10px] font-medium" :class="themeClasses.statSubtleText">System</span>
                </div>
                <div class="text-xs font-bold" :class="themeClasses.statInnerText">{{ systemUptime }}</div>
              </div>

              <div class="flex flex-col gap-1 p-2 rounded-lg border" :class="themeClasses.windowBorder">
                <div class="flex items-center gap-1.5">
                  <Icon :icon="homeIcon" class="w-3 h-3" :class="themeClasses.explorerItemIcon" />
                  <span class="text-[10px] font-medium" :class="themeClasses.statSubtleText">HomeDock OS</span>
                </div>
                <div class="text-xs font-bold" :class="themeClasses.statInnerText">{{ homeDockUptime }}</div>
              </div>
            </div>

            <div class="flex items-center justify-between p-2 rounded-lg border" :class="themeClasses.windowBorder">
              <div class="flex items-center gap-1.5">
                <Icon :icon="containerIcon" class="w-3 h-3" :class="themeClasses.explorerItemIcon" />
                <span class="text-[10px] font-medium" :class="themeClasses.statSubtleText">Installed Applications</span>
              </div>
              <span class="text-xs font-bold" :class="themeClasses.statInnerText">{{ activeContainers }} / {{ totalContainers }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="mb-6">
        <h3 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-3" :class="themeClasses.explorerGroupHeader">
          <Icon :icon="appsIcon" class="w-4 h-4" />
          <span>System Applications</span>
        </h3>

        <div class="app-launchpad-grid" :style="launchpadGridStyle">
          <div v-for="app in systemApps" :key="app.id" @click="app.id !== 'apphome' && openApp(app)" class="app-launchpad-item group" :class="app.id !== 'apphome' ? 'cursor-pointer' : 'opacity-40 cursor-default'">
            <div class="app-launchpad-icon" :class="[themeClasses.iconHolder, themeClasses.explorerResultItemHover]">
              <Icon :icon="app.icon" class="w-7 h-7" :class="themeClasses.explorerItemIcon" />
            </div>
            <span class="app-launchpad-name" :class="themeClasses.explorerItemName">{{ app.name }}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-3" :class="themeClasses.explorerGroupHeader">
          <Icon :icon="toolboxOutlineIcon" class="w-4 h-4" />
          <span>Utilities</span>
        </h3>

        <div class="app-launchpad-grid" :style="launchpadGridStyle">
          <div v-for="util in utilitiesApps" :key="util.id" @click="openApp(util)" class="app-launchpad-item group cursor-pointer">
            <div class="app-launchpad-icon" :class="[themeClasses.iconHolder, themeClasses.explorerResultItemHover]">
              <Icon :icon="util.icon" class="w-7 h-7" :class="themeClasses.explorerItemIcon" />
            </div>
            <span class="app-launchpad-name" :class="themeClasses.explorerItemName">{{ util.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <StatusBar :icon="cloudIcon" message="My Home" :info="`CPU ${cpuValue}% • RAM ${ramValue}% • ${activeContainers}/${totalContainers} apps`" :showHelp="true">
      <template #help>
        <div class="space-y-2.5 max-w-sm">
          <div class="flex items-center gap-2">
            <Icon :icon="cloudIcon" :class="['w-5 h-5', themeClasses.statusBarIcon]" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">My Home</h4>
          </div>

          <div :class="['text-[10px] md:text-xs space-y-2 leading-relaxed', themeClasses.statusBarInfo]">
            <p>My Home is your central hub for accessing system information and applications. Monitor storage, performance, network activity, and system health at a glance.</p>
            <p><strong>Storage:</strong> OS Disk shows total disk usage (blue bar) with encrypted data overlay (green bar). Click encrypted info to access Drop Zone.</p>
            <p><strong>System Overview:</strong> Real-time performance metrics, network statistics, and system health indicators help you keep track of your HomeDock OS.</p>
          </div>
        </div>
      </template>
    </StatusBar>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";

import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useDesktopStore } from "../__Stores__/desktopStore";
import { useWindowStore } from "../__Stores__/windowStore";
import { useDropZoneStore } from "../__Stores__/useDropZoneStore";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { getExplorerApps } from "../__Config__/WindowDefaultDetails";

import { useSystemStatsStore } from "../__Stores__/useSystemStatsStore";
import { useDisksPlusStore } from "../__Stores__/useDisksPlusStore";

import type { DiskData } from "../__Types__/DiskData";

import StatusBar from "../__Components__/StatusBar.vue";

import { Icon } from "@iconify/vue";
import cloudIcon from "@iconify-icons/mdi/cloud";
import usbFlashIcon from "@iconify-icons/mdi/usb-flash-drive";
import harddiskPlusIcon from "@iconify-icons/mdi/harddisk-plus";
import discIcon from "@iconify-icons/mdi/disc";
import sdIcon from "@iconify-icons/mdi/sd";
import lockIcon from "@iconify-icons/mdi/lock";
import folderIcon from "@iconify-icons/mdi/folder";
import harddiskIcon from "@iconify-icons/mdi/harddisk";
import pinIcon from "@iconify-icons/mdi/pin";
import appsIcon from "@iconify-icons/mdi/apps";
import toolboxOutlineIcon from "@iconify-icons/mdi/toolbox-outline";

import homeIcon from "@iconify-icons/mdi/home";
import cpuIcon from "@iconify-icons/mdi/speedometer";
import downloadIcon from "@iconify-icons/mdi/download";
import uploadIcon from "@iconify-icons/mdi/upload";
import containerIcon from "@iconify-icons/mdi/docker";
import uptimeIcon from "@iconify-icons/mdi/clock-outline";
import serverIcon from "@iconify-icons/mdi/server";
import openInNewIcon from "@iconify-icons/mdi/open-in-new";

import { UTILITIES_APPS } from "../__Config__/UtilitiesDefaultDetails";

const { themeClasses } = useTheme();
const desktopStore = useDesktopStore();
const windowStore = useWindowStore();
const dropZoneStore = useDropZoneStore();
const systemStatsStore = useSystemStatsStore();
const diskStore = useDisksPlusStore();
const csrfToken = useCsrfToken();

interface EncryptedStorageInfo {
  used: number;
  usedFormatted: string;
  fileCount: number;
  folderCount: number;
}

const storageInfo = ref<EncryptedStorageInfo>({
  used: 0,
  usedFormatted: "0 B",
  fileCount: 0,
  folderCount: 0,
});

const encryptedStorageInfo = ref<EncryptedStorageInfo>({
  used: 0,
  usedFormatted: "0 B",
  fileCount: 0,
  folderCount: 0,
});

const containerRef = ref<HTMLElement | null>(null);
const containerWidth = ref(0);

const gridColsClass = computed(() => {
  const totalCards = 1 + disksForHome.value.length;
  if (containerWidth.value < 600 || totalCards <= 1) {
    return "grid-cols-1";
  }
  return "grid-cols-2";
});

const LAUNCHPAD_MIN_CELL = 88;

const launchpadGridStyle = computed(() => {
  const width = containerWidth.value || 400;
  const cols = Math.max(2, Math.floor(width / LAUNCHPAD_MIN_CELL));
  return { gridTemplateColumns: `repeat(${cols}, 1fr)` };
});

const cpuValue = computed(() => Math.round(parseFloat(systemStatsStore.cpuUsage) || 0));
const cpuCores = computed(() => systemStatsStore.cpuCores);
const cpuGhz = computed(() => systemStatsStore.cpuGhz);

const cpuInfoText = computed(() => {
  const ghz = parseFloat(cpuGhz.value as string) || 0;
  if (ghz > 0) {
    return `${cpuCores.value} cores @ ${cpuGhz.value} GHz`;
  }
  return `${cpuCores.value} cores`;
});

const ramValue = computed(() => Math.round(parseFloat(systemStatsStore.ramUsage) || 0));
const totalRam = computed(() => systemStatsStore.totalRam);

const tempValue = computed(() => Math.round(parseFloat(systemStatsStore.cpuTemp) || 0));

const externalDefaultDisk = computed(() => diskStore.trackedExternalDevice);

const osDiskSubtitle = computed(() => {
  const disk = diskStore.osDisk;
  if (!disk) return "System Disk";
  const bits: string[] = [];
  if (disk.media_type) bits.push(disk.media_type.toUpperCase());
  bits.push("System Disk");
  return bits.join(" · ");
});

function iconForMediaType(mediaType: string) {
  switch (mediaType) {
    case "nvme":
      return harddiskPlusIcon;
    case "ssd":
      return harddiskIcon;
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

const disksForHome = computed<DiskData[]>(() => {
  const disks = diskStore.otherDisks.filter((d) => !d.is_system);
  const trackedDevice = externalDefaultDisk.value;
  disks.sort((a, b) => {
    if (a.device === trackedDevice && b.device !== trackedDevice) return -1;
    if (b.device === trackedDevice && a.device !== trackedDevice) return 1;
    if (a.internal && !b.internal) return -1;
    if (!a.internal && b.internal) return 1;
    return (a.label || a.device).localeCompare(b.label || b.device);
  });
  return disks;
});

function subtitleForDisk(disk: DiskData): string {
  const bits: string[] = [];
  if (disk.media_type) bits.push(disk.media_type.toUpperCase());
  if (disk.internal) bits.push("Internal");
  else if (disk.removable) bits.push("Removable");
  return bits.join(" · ") || "Disk";
}

function formatDiskSize(gb: number): string {
  if (!gb || gb <= 0) return "";
  if (gb >= 1024) return `${(gb / 1024).toFixed(1)} TB`;
  return `${gb.toFixed(0)} GB`;
}

const osDiskTotalBytes = computed(() => (diskStore.osDisk?.total_gb ?? 0) * 1073741824);

const storagePercentage = computed(() => {
  if (osDiskTotalBytes.value === 0) return 0;
  return Math.round((storageInfo.value.used / osDiskTotalBytes.value) * 100 * 100) / 100;
});

const encryptedStoragePercentage = computed(() => {
  if (osDiskTotalBytes.value === 0) return 0;
  return Math.round((encryptedStorageInfo.value.used / osDiskTotalBytes.value) * 100 * 100) / 100;
});

const networkDown = computed(() => systemStatsStore.downloadData);
const networkUp = computed(() => systemStatsStore.uploadData);

const networkDownValue = computed(() => {
  const val = networkDown.value;
  if (typeof val === "string") {
    return val.split(" ")[0];
  }
  return "0";
});

const networkDownUnit = computed(() => {
  const val = networkDown.value;
  if (typeof val === "string") {
    return val.split(" ")[1] || "GB";
  }
  return "GB";
});

const networkUpValue = computed(() => {
  const val = networkUp.value;
  if (typeof val === "string") {
    return val.split(" ")[0];
  }
  return "0";
});

const networkUpUnit = computed(() => {
  const val = networkUp.value;
  if (typeof val === "string") {
    return val.split(" ")[1] || "GB";
  }
  return "GB";
});

const totalContainers = computed(() => systemStatsStore.totalContainers);
const activeContainers = computed(() => systemStatsStore.activeContainers);

const systemUptime = computed(() => systemStatsStore.uptimeData);
const homeDockUptime = computed(() => systemStatsStore.startTime);

const systemApps = computed(() => {
  return getExplorerApps();
});

const utilitiesApps = computed(() => {
  return UTILITIES_APPS;
});

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

async function fetchStorageInfo() {
  try {
    const response = await axios.get("/api/storage/files", {
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });

    if (response.data.files && Array.isArray(response.data.files)) {
      const totalUsed = response.data.files.reduce((sum: number, file: any) => sum + (file.size || 0), 0);

      const files = response.data.files.filter((item: any) => !item.is_directory);
      const folders = response.data.files.filter((item: any) => item.is_directory);

      storageInfo.value = {
        used: totalUsed,
        usedFormatted: formatBytes(totalUsed),
        fileCount: files.length,
        folderCount: folders.length,
      };
    }
  } catch (error) {
    console.error("Failed to fetch storage info:", error);
  }
}

async function fetchEncryptedStorageInfo() {
  try {
    const response = await axios.get("/api/dropzone/files", {
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });

    if (response.data.files && Array.isArray(response.data.files)) {
      const totalUsed = response.data.files.reduce((sum: number, file: any) => sum + (file.size || 0), 0);

      const files = response.data.files.filter((item: any) => !item.is_directory);
      const folders = response.data.files.filter((item: any) => item.is_directory);

      encryptedStorageInfo.value = {
        used: totalUsed,
        usedFormatted: formatBytes(totalUsed),
        fileCount: files.length,
        folderCount: folders.length,
      };
    }
  } catch (error) {
    console.error("Failed to fetch encrypted storage info:", error);
  }
}

function openApp(app: any) {
  desktopStore.openSystemApp(app.id);
}

function openStorage() {
  windowStore.openWindow("fileexplorer", {
    data: { initialLocation: "storage" },
  });
}

function openDropZone() {
  windowStore.openWindow("fileexplorer", {
    data: { initialLocation: "dropzone" },
  });
}

function openDiskInExplorer(disk: DiskData) {
  windowStore.openWindow("fileexplorer", {
    data: { initialLocation: "disksplus", initialDiskId: disk.id },
  });
}

watch(
  () => dropZoneStore.lastUpdate,
  () => {
    fetchEncryptedStorageInfo();
  },
);

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  fetchStorageInfo();
  fetchEncryptedStorageInfo();

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
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});
</script>

<style scoped>
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

.app-launchpad-icon {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  transition: all 0.15s ease;
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
