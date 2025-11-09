<!-- homedock-ui/vue3/static/js/__Apps__/AppControlHub.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div ref="containerRef" class="flex flex-col h-full overflow-hidden">
    <div class="flex-1 overflow-y-auto overflow-x-hidden px-4 pt-4 pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/15">
      <div class="mb-4">
        <AutoComplete v-model:value="searchQuery" :options="searchOptions" :popup-class-name="`${themeClasses.scopeSelector}`" class="w-full" @select="handleSearchSelect">
          <template #option="{ label, imagePath, status }">
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-2 flex-shrink-0">
                <div
                  class="w-2 h-2 rounded-full"
                  :class="{
                    'bg-green-500': status === 'running',
                    'bg-gray-400': status !== 'running' && status !== 'paused',
                    'bg-yellow-500': status === 'paused',
                  }"
                />
                <BaseImage draggable="false" :src="imagePath" :alt="label" class="w-6 h-6 rounded" />
              </div>
              <span class="truncate">{{ label }}</span>
            </div>
          </template>
          <InputSearch v-model:value="searchQuery" placeholder="Search apps..." class="w-full text-sm" enter-button="Search">
            <template #prefix>
              <Icon :icon="nutIcon" :class="[themeClasses.dropZoneInputIcon]" class="mx-1" />
            </template>
          </InputSearch>
        </AutoComplete>
      </div>
      <Transition enter-active-class="transition-opacity duration-250 ease-out" leave-active-class="transition-opacity duration-250 ease-in" enter-from-class="opacity-0" leave-to-class="opacity-0" mode="out-in">
        <div v-if="isLoading" class="flex justify-center items-center h-64">
          <Icon :icon="loadingIcon" :class="[themeClasses.windowLoadingIcon]" class="animate-spin" width="48" height="48" />
        </div>

        <div v-else-if="sortedApps.length === 0" class="flex flex-col items-center justify-center h-64">
          <div :class="[themeClasses.windowBorder]" class="p-8 rounded-2xl border bg-white/5 text-center max-w-md">
            <Icon :icon="emptyIcon" :class="[themeClasses.windowPlaceholderText]" class="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 :class="[themeClasses.windowTitleTextFocused]" class="text-lg font-semibold mb-2">No apps installed</h3>
            <p :class="[themeClasses.windowPlaceholderText]" class="text-sm mb-6">Get started by installing your first application</p>
            <button @click="openAppStore" :class="[themeClasses.settingsIconBgBlue]" class="px-6 py-3 rounded-xl text-white font-medium flex items-center gap-2 mx-auto hover:scale-105 transition-transform duration-200 shadow-lg">
              <Icon :icon="storeIcon" class="w-5 h-5" />
              <span>Browse App Store</span>
            </button>
          </div>
        </div>

        <div v-else class="space-y-2">
          <TransitionGroup enter-active-class="transition-all duration-250 ease-out" leave-active-class="transition-all duration-250 ease-in absolute w-full pointer-events-none" enter-from-class="opacity-0 translate-y-2" leave-to-class="opacity-0 -translate-y-2" move-class="transition-transform duration-250 ease-out">
            <div v-for="app in sortedApps" :key="app.name" :class="[themeClasses.windowBorder, themeClasses.explorerResultItem, themeClasses.explorerResultItemHover]" class="rounded-lg border overflow-hidden transition-all duration-200">
              <div @click="toggleExpand(app.name)" class="flex items-center gap-4 px-4 py-4 cursor-pointer transition-all duration-150">
                <div class="flex items-center gap-3 flex-shrink-0">
                  <div
                    class="w-2 h-2 rounded-full flex-shrink-0"
                    :class="{
                      'bg-green-500': app.status === 'running',
                      'bg-gray-400': app.status !== 'running' && app.status !== 'paused',
                      'bg-yellow-500': app.status === 'paused',
                    }"
                  />
                  <BaseImage draggable="false" :src="app.image_path || fallbackIcon" :alt="app.display_name || app.name" :class="[themeClasses.hubIconHolder]" class="w-10 h-10 rounded-lg shadow-sm ring-1" />
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <h3 :class="[themeClasses.windowTitleTextFocused]" class="text-sm font-medium truncate">
                      {{ app.display_name || app.name }}
                    </h3>
                    <div v-if="app.has_update" :class="[themeClasses.appPropsUpdateBadgeBg, themeClasses.appPropsUpdateBadgeBorder]" class="flex items-center gap-1 px-2 py-0.5 rounded-md border flex-shrink-0">
                      <Icon :icon="updateIcon" :class="[themeClasses.appPropsUpdateBadgeIcon]" class="w-3 h-3" />
                      <span :class="[themeClasses.appPropsUpdateBadgeText]" class="text-[10px] font-semibold">Update</span>
                    </div>
                  </div>
                  <p :class="[themeClasses.windowPlaceholderText]" class="text-xs mt-0.5 capitalize">
                    {{ app.status }}
                  </p>
                </div>

                <div v-if="app.status === 'running' && showMetrics" class="flex items-center gap-1.5 flex-shrink-0 mr-2">
                  <div class="flex items-center gap-1 px-1.5 py-0.5 rounded-md" :class="[themeClasses.windowBorder, themeClasses.explorerResultItem]">
                    <Icon :icon="cpuIcon" :class="[themeClasses.appPropsCardHeaderIcon]" class="w-3 h-3" />
                    <span :class="[themeClasses.appPropsInfoValue]" class="text-[10px] font-semibold min-w-[28px]">{{ getCPU(app) }}</span>
                  </div>

                  <div class="flex items-center gap-1 px-1.5 py-0.5 rounded-md" :class="[themeClasses.windowBorder, themeClasses.explorerResultItem]">
                    <Icon :icon="memoryIcon" :class="[themeClasses.appPropsCardHeaderIcon]" class="w-3 h-3" />
                    <span :class="[themeClasses.appPropsInfoValue]" class="text-[10px] font-semibold min-w-[32px]">{{ getRAM(app) }}</span>
                  </div>

                  <div class="flex items-center gap-1 px-1.5 py-0.5 rounded-md" :class="[themeClasses.windowBorder, themeClasses.explorerResultItem]">
                    <Icon :icon="downloadIcon" :class="[themeClasses.appPropsCardHeaderIcon]" class="w-3 h-3" />
                    <span :class="[themeClasses.appPropsInfoValue]" class="text-[9px] font-semibold min-w-[40px]">{{ formatBytes(app.networkRxBytes || 0) }}</span>
                  </div>

                  <div class="flex items-center gap-1 px-1.5 py-0.5 rounded-md" :class="[themeClasses.windowBorder, themeClasses.explorerResultItem]">
                    <Icon :icon="uploadIcon" :class="[themeClasses.appPropsCardHeaderIcon]" class="w-3 h-3" />
                    <span :class="[themeClasses.appPropsInfoValue]" class="text-[9px] font-semibold min-w-[40px]">{{ formatBytes(app.networkTxBytes || 0) }}</span>
                  </div>
                </div>

                <div class="flex-shrink-0">
                  <Icon :icon="expandedApps.has(app.name) ? chevronUpIcon : chevronDownIcon" :class="[themeClasses.windowPlaceholderText]" class="w-5 h-5 transition-transform duration-200" />
                </div>
              </div>

              <Transition enter-active-class="transition-all duration-200 ease-out" leave-active-class="transition-all duration-200 ease-in" enter-from-class="max-h-0 opacity-0" enter-to-class="max-h-96 opacity-100" leave-from-class="max-h-96 opacity-100" leave-to-class="max-h-0 opacity-0">
                <div v-if="expandedApps.has(app.name)" class="overflow-hidden">
                  <div class="px-4 pb-4 space-y-2">
                    <div class="grid grid-cols-2 gap-1.5">
                      <button @click="handleEdit(app)" :class="[themeClasses.windowBorder, themeClasses.explorerActionButton, themeClasses.explorerActionButtonHover]" class="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all duration-150 text-[11px]">
                        <Icon :icon="editIcon" class="w-3.5 h-3.5" />
                        <span>Edit Config</span>
                      </button>
                      <button @click="handleLogs(app)" :class="[themeClasses.windowBorder, themeClasses.explorerActionButton, themeClasses.explorerActionButtonHover]" class="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all duration-150 text-[11px]">
                        <Icon :icon="logsIcon" class="w-3.5 h-3.5" />
                        <span>View Logs</span>
                      </button>
                      <button @click="handleExport(app)" :class="[themeClasses.windowBorder, themeClasses.explorerActionButton, themeClasses.explorerActionButtonHover]" class="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all duration-150 text-[11px]">
                        <Icon :icon="exportIcon" class="w-3.5 h-3.5" />
                        <span>Export Config</span>
                      </button>
                      <div class="relative">
                        <Upload :custom-request="(options) => handleImport(app, options)" v-model:file-list="fileList" accept=".yml,.yaml" :maxCount="1" :showUploadList="false" :headers="uploadHeaders">
                          <button :class="[themeClasses.windowBorder, themeClasses.explorerActionButton, themeClasses.explorerActionButtonHover]" class="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all duration-150 text-[11px]">
                            <Icon :icon="importIcon" class="w-3.5 h-3.5" />
                            <span>Import Config</span>
                          </button>
                        </Upload>
                      </div>
                    </div>

                    <div v-if="app.status === 'running'" class="rounded-lg px-3 py-2.5 space-y-2.5 transition-all duration-200" :class="[themeClasses.appPropsUsageCardBg, themeClasses.appPropsUsageCardBorder, themeClasses.aeroExtraScope]">
                      <div class="space-y-2 pt-0">
                        <div class="space-y-1">
                          <div class="flex items-center justify-between">
                            <div class="flex items-center gap-1.5">
                              <Icon :icon="cpuIcon" width="12" height="12" :class="[themeClasses.appPropsCardHeaderIcon]" />
                              <span class="text-[10px] font-semibold" :class="[themeClasses.appPropsCardHeaderText]">CPU</span>
                            </div>
                            <span class="text-[11px] font-bold" :class="[themeClasses.appPropsInfoValue]">{{ getCPU(app) }}</span>
                          </div>
                          <div class="w-full h-1 rounded-full overflow-hidden" :class="[themeClasses.appPropsProgressBarBg]">
                            <div class="h-full rounded-full transition-[width] duration-300" :style="{ width: `${app.usagePercent || 0}%` }" :class="(app.usagePercent || 0) >= 80 ? themeClasses.appPropsProgressBarFillCritical : (app.usagePercent || 0) >= 50 ? themeClasses.appPropsProgressBarFillWarning : themeClasses.appPropsProgressBarFillNormal"></div>
                          </div>
                        </div>

                        <div class="space-y-1">
                          <div class="flex items-center justify-between">
                            <div class="flex items-center gap-1">
                              <Icon :icon="memoryIcon" width="12" height="12" :class="[themeClasses.appPropsCardHeaderIcon]" />
                              <span class="text-[10px] font-semibold" :class="[themeClasses.appPropsCardHeaderText]">RAM</span>
                            </div>
                            <span class="text-[11px] font-bold" :class="[themeClasses.appPropsInfoValue]">{{ getRAM(app) }}</span>
                          </div>
                          <div class="w-full h-1 rounded-full overflow-hidden" :class="[themeClasses.appPropsProgressBarBg]">
                            <div class="h-full rounded-full transition-[width] duration-300" :style="{ width: `${app.memoryUsagePercent || 0}%` }" :class="(app.memoryUsagePercent || 0) >= 80 ? themeClasses.appPropsProgressBarFillCritical : (app.memoryUsagePercent || 0) >= 50 ? themeClasses.appPropsProgressBarFillWarning : themeClasses.appPropsProgressBarFillNormal"></div>
                          </div>
                        </div>

                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-1">
                            <Icon :icon="downloadIcon" width="12" height="12" :class="[themeClasses.appPropsCardHeaderIcon]" />
                            <span class="text-[10px] font-semibold" :class="[themeClasses.appPropsCardHeaderText]">Download</span>
                          </div>
                          <span class="text-[11px] font-bold" :class="[themeClasses.appPropsInfoValue]">{{ formatBytes(app.networkRxBytes || 0) }}</span>
                        </div>

                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-1">
                            <Icon :icon="uploadIcon" width="12" height="12" :class="[themeClasses.appPropsCardHeaderIcon]" />
                            <span class="text-[10px] font-semibold" :class="[themeClasses.appPropsCardHeaderText]">Upload</span>
                          </div>
                          <span class="text-[11px] font-bold" :class="[themeClasses.appPropsInfoValue]">{{ formatBytes(app.networkTxBytes || 0) }}</span>
                        </div>

                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-1">
                            <Icon :icon="containerIcon" width="12" height="12" :class="[themeClasses.appPropsCardHeaderIcon]" />
                            <span class="text-[10px] font-semibold" :class="[themeClasses.appPropsCardHeaderText]">Image</span>
                          </div>
                          <div class="text-[9px] font-medium font-mono leading-none" :class="[themeClasses.appPropsInfoValue]">{{ getImageName(app) }}</div>
                        </div>

                        <div v-if="getImageTag(app)" class="flex items-center justify-between">
                          <div class="flex items-center gap-1">
                            <Icon :icon="containerIcon" width="12" height="12" :class="[themeClasses.appPropsCardHeaderIcon]" />
                            <span class="text-[10px] font-semibold" :class="[themeClasses.appPropsCardHeaderText]">Tag</span>
                          </div>
                          <div class="text-[9px] font-medium font-mono leading-none" :class="[themeClasses.appPropsInfoValue]">{{ getImageTag(app) }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </TransitionGroup>
        </div>
      </Transition>
    </div>

    <StatusBar :icon="nutIcon" message="Control Hub" :info="statusBarInfo" :showHelp="true">
      <template #help>
        <div class="space-y-2.5 max-w-sm">
          <div class="flex items-center gap-2">
            <Icon :icon="nutIcon" :class="['w-5 h-5', themeClasses.statusBarIcon]" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">Control Hub</h4>
          </div>

          <div :class="['text-[10px] md:text-xs space-y-2 leading-relaxed', themeClasses.statusBarInfo]">
            <p>Monitor and manage all your installed applications from a single interface. Click on any app to view detailed metrics and access management options.</p>
            <p><strong>Running apps</strong> show CPU and RAM usage. <strong>Stopped apps</strong> show last activity status.</p>
          </div>
        </div>
      </template>
    </StatusBar>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";

import { computed, ref, onMounted, onUnmounted } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import { useDesktopStore } from "../__Stores__/desktopStore";
import { useWindowStore } from "../__Stores__/windowStore";
import { AutoComplete, Upload, message } from "ant-design-vue";
import { InputSearch } from "ant-design-vue";

import BaseImage from "../__Components__/BaseImage.vue";
import StatusBar from "../__Components__/StatusBar.vue";

import { Icon } from "@iconify/vue";
import nutIcon from "@iconify-icons/mdi/nut";
import loadingIcon from "@iconify-icons/mdi/loading";
import emptyIcon from "@iconify-icons/mdi/package-variant-closed";
import storeIcon from "@iconify-icons/mdi/store";
import chevronDownIcon from "@iconify-icons/mdi/chevron-down";
import chevronUpIcon from "@iconify-icons/mdi/chevron-up";
import editIcon from "@iconify-icons/mdi/pencil";
import logsIcon from "@iconify-icons/mdi/text-box-outline";
import exportIcon from "@iconify-icons/mdi/export-variant";
import importIcon from "@iconify-icons/mdi/import";
import cpuIcon from "@iconify-icons/mdi/cpu-64-bit";
import memoryIcon from "@iconify-icons/mdi/memory";
import updateIcon from "@iconify-icons/mdi/arrow-up-circle";
import downloadIcon from "@iconify-icons/mdi/download";
import uploadIcon from "@iconify-icons/mdi/upload";
import containerIcon from "@iconify-icons/mdi/package-variant-closed";

const { themeClasses } = useTheme();
const desktopStore = useDesktopStore();
const windowStore = useWindowStore();

const fallbackIcon = "docker-icons/notfound.jpg";
const csrfToken = document.querySelector('meta[name="homedock_csrf_token"]')?.getAttribute("content") || "";
const uploadHeaders = { "X-HomeDock-CSRF-Token": csrfToken };

const apps = computed(() => desktopStore.mainDockerApps.filter((app: any) => app.HDRole !== "dependency"));
const runningAppsCount = computed(() => apps.value.filter((app: any) => app.status === "running").length);
const isLoading = computed(() => false);

const containerRef = ref<HTMLElement | null>(null);
const containerWidth = ref(0);
const showMetrics = computed(() => containerWidth.value >= 750);

const searchQuery = ref("");
const fileList = ref([]);

const searchOptions = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();

  let filtered = [...apps.value];

  if (query) {
    filtered = filtered.filter((app: any) => (app.display_name || app.name).toLowerCase().includes(query) || app.name.toLowerCase().includes(query));
  }

  const sorted = filtered.sort((a: any, b: any) => {
    const statusPriority: Record<string, number> = {
      running: 1,
      paused: 2,
      created: 3,
      exited: 4,
    };

    const priorityA = statusPriority[a.status] || 999;
    const priorityB = statusPriority[b.status] || 999;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    return (a.display_name || a.name).localeCompare(b.display_name || b.name);
  });

  return sorted.map((app: any) => ({
    value: app.name,
    label: app.display_name || app.name,
    imagePath: app.image_path || fallbackIcon,
    status: app.status,
  }));
});

function handleSearchSelect(value: string | number | { value: string | number; label: string }, option?: any) {
  const appName = typeof value === "object" ? String(value.value) : String(value);
  const app = apps.value.find((a: any) => a.name === appName);
  if (app) {
    expandedApps.value.add(app.name);
  }
}

const expandedApps = ref<Set<string>>(new Set());

function toggleExpand(appName: string) {
  if (expandedApps.value.has(appName)) {
    expandedApps.value.delete(appName);
  } else {
    expandedApps.value.add(appName);
  }
}

const sortedApps = computed(() => {
  let filtered = [...apps.value];

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter((app: any) => (app.display_name || app.name).toLowerCase().includes(query) || app.name.toLowerCase().includes(query) || app.image?.toLowerCase().includes(query));
  }

  return filtered.sort((a: any, b: any) => {
    const statusPriority: Record<string, number> = {
      running: 1,
      paused: 2,
      created: 3,
      exited: 4,
    };

    const priorityA = statusPriority[a.status] || 999;
    const priorityB = statusPriority[b.status] || 999;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    return (a.display_name || a.name).localeCompare(b.display_name || b.name);
  });
});

const totalCPU = computed(() => {
  const runningApps = apps.value.filter((app: any) => app.status === "running");
  const total = runningApps.reduce((sum: number, app: any) => {
    const cpu = app.usagePercent || 0;
    return sum + cpu;
  }, 0);
  return Math.round(total * 10) / 10;
});

const totalRAM = computed(() => {
  const runningApps = apps.value.filter((app: any) => app.status === "running");
  const total = runningApps.reduce((sum: number, app: any) => {
    const ram = app.memoryUsagePercent || 0;
    return sum + ram;
  }, 0);
  return Math.round(total * 10) / 10;
});

const statusBarInfo = computed(() => {
  if (runningAppsCount.value === 0) {
    return "No apps running";
  }
  return `Total CPU ${totalCPU.value}% • Total RAM ${totalRAM.value}%`;
});

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + " " + sizes[i];
}

function getCPU(app: any): string {
  const cpu = app.usagePercent || 0;
  return cpu > 0 ? `${Math.round(cpu * 10) / 10}%` : "0%";
}

function getRAM(app: any): string {
  const ram = app.memoryUsagePercent || 0;
  return ram > 0 ? `${Math.round(ram * 10) / 10}%` : "0%";
}

function getImageName(app: any): string {
  if (!app.image) return "Unknown";
  const imageParts = app.image.split(":");
  return imageParts[0] || app.image;
}

function getImageTag(app: any): string {
  if (!app.image) return "";
  const imageParts = app.image.split(":");
  return imageParts.length > 1 ? imageParts[1] : "";
}

function handleEdit(app: any) {
  windowStore.openWindow("edit", {
    title: `${app.display_name || app.name} - Edit Config`,
    data: { appName: app.name },
    allowMultiple: true,
  });
}

function handleLogs(app: any) {
  windowStore.openWindow("logs", {
    title: `${app.display_name || app.name} - Logs`,
    data: { appName: app.name },
    allowMultiple: true,
  });
}

async function handleExport(app: any) {
  try {
    const response = await axios.get(`/api/get-compose-info`, {
      headers: {
        "X-HomeDock-CSRF-Token": csrfToken,
      },
      params: {
        containerName: app.name,
      },
    });

    if (response.data?.data?.ymlContent && response.data.data.ymlContent.trim() !== "") {
      exportYMLFile(response.data.data.ymlContent, `${app.name}.yml`);
      message.success(`Configuration exported successfully`);
    }
  } catch (error) {
    message.error("Failed to export configuration");
  }
}

function exportYMLFile(data: string, filename: string) {
  const blob = new Blob([data], { type: "text/yaml;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

async function handleImport(app: any, { file, onSuccess, onError }: any) {
  const formData = new FormData();
  formData.append("compose_file", file);
  formData.append("container_name", app.name);
  formData.append("homedock_csrf_token", csrfToken || "");

  try {
    const response = await fetch("/api/upload_compose_file", {
      method: "POST",
      headers: {
        "X-HomeDock-CSRF-Token": csrfToken || "",
      },
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      onSuccess(data, file);
      message.success(`Configuration imported successfully`);
    } else {
      throw new Error("Upload failed");
    }
  } catch (error) {
    onError(error);
    message.error(`Failed to import configuration`);
  }
}

function openAppStore() {
  desktopStore.openSystemApp("appstore");
}

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.offsetWidth;

    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerWidth.value = entry.contentRect.width;
      }
    });

    resizeObserver.observe(containerRef.value);
  }
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});
</script>

<style scoped>
/* Upload button styles */
:deep(.ant-upload) {
  display: block !important;
  width: 100% !important;
}

:deep(.ant-upload-select) {
  display: block !important;
  width: 100% !important;
}

:deep(.ant-upload-select button) {
  width: 100% !important;
}

/* Autocomplete dropdown styles */
:deep(.ant-select-dropdown) {
  padding: 0.5rem !important;
  border-radius: 0.75rem !important;
  backdrop-filter: blur(12px) !important;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3) !important;
}

:deep(.ant-select-item) {
  border-radius: 0.5rem !important;
  padding: 0.625rem 0.75rem !important;
  margin-bottom: 0.25rem !important;
  transition: all 0.15s ease !important;
}

:deep(.ant-select-item:last-child) {
  margin-bottom: 0 !important;
}

:deep(.ant-select-item-option-active) {
  transform: translateX(2px) !important;
}

:deep(.ant-select-item-option-selected) {
  font-weight: 500 !important;
}
</style>
