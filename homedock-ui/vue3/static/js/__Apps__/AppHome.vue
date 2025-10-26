<!-- homedock-ui/vue3/static/js/__Apps__/AppHome.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div ref="containerRef" class="flex-1 overflow-y-auto px-6 py-6">
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
                <h3 class="text-sm font-semibold" :class="themeClasses.statInnerText">Cloud Storage</h3>
                <p class="text-xs" :class="themeClasses.statSubtleText">System disk</p>
              </div>
              <div class="text-right">
                <div class="text-lg font-bold" :class="themeClasses.statInnerText">{{ systemDiskInfo.percentage }}%</div>
              </div>
            </div>
            <div class="relative w-full h-2 rounded-full overflow-hidden" :class="themeClasses.processingBarScope">
              <div class="absolute inset-0 h-full bg-blue-500 transition-all duration-150" :style="{ width: systemDiskInfo.percentage + '%' }"></div>
              <div class="absolute inset-0 h-full bg-green-500 transition-all duration-150" :style="{ width: encryptedStoragePercentage + '%' }"></div>
            </div>
            <div class="flex justify-between text-xs" :class="themeClasses.statSubtleText">
              <span>{{ systemDiskInfo.usedFormatted }} used</span>
              <span>{{ systemDiskInfo.totalFormatted }} total</span>
            </div>
            <div @click="openDropZone" class="flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all hover:bg-opacity-50" :class="[themeClasses.windowBorder]" style="margin-top: -0.25rem">
              <div class="flex items-center gap-2">
                <Icon :icon="lockIcon" class="w-4 h-4" :class="themeClasses.explorerItemIcon" />
                <span class="text-xs font-medium" :class="themeClasses.statInnerText">Encrypted: {{ encryptedStorageInfo.usedFormatted }}</span>
              </div>
              <span class="text-xs" :class="themeClasses.statSubtleText">{{ encryptedStorageInfo.fileCount }} files</span>
            </div>
          </div>

          <div v-if="externalDiskAvailable" class="flex flex-col gap-3 p-4 rounded-xl border" :class="[themeClasses.windowBorder, themeClasses.statHolder]">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 flex items-center justify-center rounded-lg flex-shrink-0">
                <Icon :icon="externalDiskIcon" class="w-8 h-8" :class="themeClasses.explorerItemIcon" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-semibold" :class="themeClasses.statInnerText">External Storage</h3>
                <p class="text-xs" :class="themeClasses.statSubtleText">External disk</p>
              </div>
              <div class="text-right">
                <div class="text-lg font-bold" :class="themeClasses.statInnerText">{{ externalDiskInfo.percentage }}%</div>
              </div>
            </div>
            <div class="w-full h-2 rounded-full overflow-hidden" :class="themeClasses.processingBarScope">
              <div class="h-full bg-green-500 transition-all duration-150" :style="{ width: externalDiskInfo.percentage + '%' }"></div>
            </div>
            <div class="flex justify-between text-xs" :class="themeClasses.statSubtleText">
              <span>{{ externalDiskInfo.usedFormatted }} used</span>
              <span>{{ externalDiskInfo.totalFormatted }} total</span>
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

      <div>
        <h3 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-3" :class="themeClasses.explorerGroupHeader">
          <Icon :icon="appsIcon" class="w-4 h-4" />
          <span>System Applications</span>
        </h3>

        <div class="flex flex-col gap-2">
          <div v-for="app in systemApps" :key="app.id" @click="openApp(app)" @dblclick="openApp(app)" class="group flex items-center gap-4 px-3 py-3 rounded-lg cursor-pointer transition-all duration-150" :class="[themeClasses.explorerResultItem, themeClasses.explorerResultItemHover]">
            <div class="flex-shrink-0 w-12 h-12 md:w-10 md:h-10 flex items-center justify-center rounded-lg overflow-hidden">
              <Icon :icon="app.icon" class="w-8 h-8" :class="themeClasses.explorerItemIcon" />
            </div>

            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium overflow-hidden text-ellipsis whitespace-nowrap" :class="themeClasses.explorerItemName">
                {{ app.name }}
              </div>
              <div class="text-xs mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap" :class="themeClasses.explorerItemDescription">
                {{ app.description }}
              </div>
            </div>

            <div class="flex-shrink-0">
              <button @click.stop="openApp(app)" class="p-2 rounded-md border-none cursor-pointer transition-all duration-150" :class="[themeClasses.explorerActionButton, themeClasses.explorerActionButtonHover]" title="Open">
                <Icon :icon="chevronRightIcon" class="w-4 h-4" />
              </button>
            </div>
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
            <p><strong>Storage:</strong> Cloud Storage shows total disk usage (blue bar) with encrypted data overlay (green bar). Click encrypted info to access Drop Zone.</p>
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
import { useDropZoneStore } from "../__Stores__/useDropZoneStore";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { getStandaloneApps } from "../__Config__/WindowDefaultDetails";

import { useSystemStatsStore } from "../__Stores__/useSystemStatsStore";

import StatusBar from "../__Components__/StatusBar.vue";

import { Icon } from "@iconify/vue";
import cloudIcon from "@iconify-icons/mdi/cloud";
import externalDiskIcon from "@iconify-icons/mdi/usb-flash-drive";
import lockIcon from "@iconify-icons/mdi/lock";
import harddiskIcon from "@iconify-icons/mdi/harddisk";
import appsIcon from "@iconify-icons/mdi/apps";
import chevronRightIcon from "@iconify-icons/mdi/chevron-right";
import homeIcon from "@iconify-icons/mdi/home";
import cpuIcon from "@iconify-icons/mdi/speedometer";
import downloadIcon from "@iconify-icons/mdi/download";
import uploadIcon from "@iconify-icons/mdi/upload";
import containerIcon from "@iconify-icons/mdi/docker";
import uptimeIcon from "@iconify-icons/mdi/clock-outline";
import serverIcon from "@iconify-icons/mdi/server";

const { themeClasses } = useTheme();
const desktopStore = useDesktopStore();
const dropZoneStore = useDropZoneStore();
const systemStatsStore = useSystemStatsStore();
const csrfToken = useCsrfToken();

interface DiskInfo {
  used: number;
  total: number;
  usedFormatted: string;
  totalFormatted: string;
  percentage: number;
}

interface EncryptedStorageInfo {
  used: number;
  usedFormatted: string;
  fileCount: number;
}

const systemDiskInfo = ref<DiskInfo>({
  used: 0,
  total: 0,
  usedFormatted: "0 GB",
  totalFormatted: "0 GB",
  percentage: 0,
});

const externalDiskInfo = ref<DiskInfo>({
  used: 0,
  total: 0,
  usedFormatted: "0 GB",
  totalFormatted: "0 GB",
  percentage: 0,
});

const encryptedStorageInfo = ref<EncryptedStorageInfo>({
  used: 0,
  usedFormatted: "0 B",
  fileCount: 0,
});

const containerRef = ref<HTMLElement | null>(null);
const containerWidth = ref(0);

const gridColsClass = computed(() => {
  if (containerWidth.value < 600 || !externalDiskAvailable.value) {
    return "grid-cols-1";
  }
  return "grid-cols-2";
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

const diskValue = computed(() => Math.round(parseFloat(systemStatsStore.hardDiskUsage) || 0));
const hardDiskTotal = computed(() => systemStatsStore.hardDiskTotal);

const externalDefaultDisk = computed(() => systemStatsStore.externalDefaultDisk);
const externalDiskValue = computed(() => Math.round(parseFloat(systemStatsStore.externalDiskUsage) || 0));
const externalDiskTotal = computed(() => systemStatsStore.externalDiskTotal);

const externalDiskAvailable = computed(() => {
  return externalDefaultDisk.value !== "disabled" && externalDiskValue.value > 0;
});

const encryptedStoragePercentage = computed(() => {
  if (systemDiskInfo.value.total === 0) return 0;
  return Math.round((encryptedStorageInfo.value.used / systemDiskInfo.value.total) * 100 * 100) / 100;
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
  return getStandaloneApps();
});

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function updateSystemDiskInfo() {
  const totalGB = parseFloat(hardDiskTotal.value as string) || 0;
  const totalBytes = totalGB * 1073741824; // bytes
  const usedBytes = (totalBytes * diskValue.value) / 100;

  systemDiskInfo.value = {
    used: usedBytes,
    total: totalBytes,
    usedFormatted: formatBytes(usedBytes),
    totalFormatted: formatBytes(totalBytes),
    percentage: diskValue.value,
  };
}

function updateExternalDiskInfo() {
  const totalGB = parseFloat(externalDiskTotal.value as string) || 0;
  const totalBytes = totalGB * 1073741824;
  const usedBytes = (totalBytes * externalDiskValue.value) / 100;

  externalDiskInfo.value = {
    used: usedBytes,
    total: totalBytes,
    usedFormatted: formatBytes(usedBytes),
    totalFormatted: totalGB > 900 ? `${(totalGB / 1024).toFixed(2)} TB` : `${totalGB} GB`,
    percentage: externalDiskValue.value,
  };
}

async function fetchEncryptedStorageInfo() {
  try {
    const response = await axios.get("/api/get_files", {
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });

    if (response.data.files && Array.isArray(response.data.files)) {
      const totalUsed = response.data.files.reduce((sum: number, file: any) => sum + (file.size || 0), 0);

      encryptedStorageInfo.value = {
        used: totalUsed,
        usedFormatted: formatBytes(totalUsed),
        fileCount: response.data.files.length,
      };
    }
  } catch (error) {
    console.error("Failed to fetch encrypted storage info:", error);
  }
}

function openApp(app: any) {
  desktopStore.openSystemApp(app.id);
}

function openDropZone() {
  desktopStore.openSystemApp("dropzone");
}

watch([diskValue, hardDiskTotal], () => {
  updateSystemDiskInfo();
});

watch([externalDiskValue, externalDiskTotal], () => {
  updateExternalDiskInfo();
});

watch(
  () => dropZoneStore.lastUpdate,
  () => {
    fetchEncryptedStorageInfo();
  }
);

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  updateSystemDiskInfo();
  updateExternalDiskInfo();
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
