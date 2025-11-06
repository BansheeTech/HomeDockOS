<!-- homedock-ui/vue3/static/js/__Apps__/AppExplorer.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div class="px-6 md:px-4 py-5 border-b" :class="themeClasses.explorerHeaderBorder">
      <div class="relative flex items-center gap-3">
        <Icon :icon="searchIcon" :class="themeClasses.explorerSearchIcon" class="absolute left-4 w-5 h-5 pointer-events-none" />
        <input ref="searchInputRef" v-model="searchQuery" type="text" placeholder="Search apps, files, and more..." class="flex-1 py-3 pr-4 pl-12 rounded-lg border text-sm outline-none transition-all duration-200" :class="[themeClasses.explorerSearchInput, themeClasses.explorerSearchInputText, themeClasses.explorerSearchInputFocusRing]" @keydown="handleKeyDown" />
        <button v-if="searchQuery" @click="clearSearch" class="absolute right-2 p-2 border-none bg-transparent cursor-pointer rounded transition-all duration-150" :class="[themeClasses.explorerClearButton, themeClasses.explorerClearButtonHover]">
          <Icon :icon="closeIcon" class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div class="flex gap-2 px-6 md:px-4 py-4 border-b overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" :class="themeClasses.explorerHeaderBorder">
      <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" class="flex items-center gap-2 md:gap-1.5 px-4 md:px-3 py-2 rounded-lg border-none text-sm md:text-[0.8125rem] font-medium cursor-pointer transition-all duration-150 whitespace-nowrap max-[480px]:min-w-12 max-[480px]:px-2" :class="activeTab === tab.id ? themeClasses.explorerTabActive : [themeClasses.explorerTabInactive, themeClasses.explorerTabHover]">
        <Icon :icon="tab.icon" class="w-4 h-4 md:w-4 md:h-4" />
        <span class="max-[480px]:hidden">{{ tab.label }}</span>
        <span v-if="tab.count > 0" class="text-xs md:text-[0.6875rem] px-2 md:px-1.5 py-0.5 md:py-0 rounded-full font-semibold" :class="activeTab === tab.id ? themeClasses.explorerTabCountActive : themeClasses.explorerTabCountInactive">
          {{ tab.count }}
        </span>
      </button>
    </div>

    <div class="relative flex-1 overflow-y-auto">
      <div v-if="!searchQuery.trim() && activeTab === 'all'" class="flex flex-col items-center justify-center px-8 py-16 text-center">
        <AnimatedIcon :icons="[magnifyIcon, appsIcon, fileIcon, storeIcon]" :iconSize="64" :interval="2000" :containerClass="'mb-4'" :class="themeClasses.explorerEmptyIcon" />
        <p :class="themeClasses.explorerEmptyText" class="text-base font-medium mb-2 text-balance">Start typing to search across HomeDock OS</p>
        <div class="mt-8 text-left max-w-md" :class="themeClasses.explorerQuickTips">
          <p class="text-sm font-semibold mb-2">Quick tips:</p>
          <ul class="list-none p-0 text-[0.8125rem] leading-relaxed">
            <li class="before:content-['•'] before:mr-2 before:opacity-50">Search for apps, files, or available software</li>
            <li class="before:content-['•'] before:mr-2 before:opacity-50">Use filters to narrow down results</li>
            <li class="before:content-['•'] before:mr-2 before:opacity-50">Select a category above to browse items</li>
          </ul>
        </div>
      </div>

      <div v-else-if="filteredResults.length === 0" class="flex flex-col items-center justify-center px-8 py-16 text-center">
        <Icon :icon="alertCircleIcon" :class="themeClasses.explorerEmptyIcon" class="w-16 h-16 mb-4" />

        <template v-if="searchQuery">
          <p :class="themeClasses.explorerEmptyText" class="text-base font-medium mb-2">No results found for "{{ searchQuery }}"</p>
          <p :class="themeClasses.explorerEmptySubtext" class="text-sm">Try different keywords or check your spelling</p>
        </template>

        <template v-else>
          <p :class="themeClasses.explorerEmptyText" class="text-base font-medium mb-2">{{ getEmptyMessage() }}</p>
          <p :class="themeClasses.explorerEmptySubtext" class="text-sm">{{ getEmptySubtext() }}</p>
        </template>
      </div>

      <div v-else class="px-6 md:px-4 py-4">
        <div v-for="(group, groupIndex) in groupedResults" :key="group.category" class="mb-8 last:mb-0">
          <h3 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-3" :class="themeClasses.explorerGroupHeader">
            <Icon :icon="group.icon" class="w-4 h-4" />
            <span>{{ group.title }}</span>
            <span class="opacity-50 font-normal" :class="themeClasses.explorerGroupCount">({{ group.items.length }})</span>
          </h3>

          <div class="flex flex-col gap-2">
            <div v-for="(item, itemIndex) in group.items" :key="item.id" @click="handleItemClick(item)" @mouseenter="selectedIndex = getGlobalIndex(groupIndex, itemIndex)" class="relative flex items-center gap-4 px-3 py-3 rounded-lg cursor-pointer transition-all duration-150 overflow-hidden" :class="[themeClasses.explorerResultItem, themeClasses.explorerResultItemHover, selectedIndex === getGlobalIndex(groupIndex, itemIndex) ? themeClasses.explorerResultItemSelected : '']">
              <div v-if="item.type === 'file' && downloadProgresses[item.name] !== undefined && downloadProgresses[item.name] < 100" class="absolute inset-0 bg-blue-500/20 transition-all duration-300 ease-out" :style="{ width: `${downloadProgresses[item.name]}%` }" />

              <div class="flex-shrink-0 w-12 h-12 md:w-10 md:h-10 flex items-center justify-center rounded-lg overflow-hidden z-[1]" :class="item.type === 'docker' ? 'bg-transparent p-0' : ''">
                <BaseImage v-if="item.image_path" :src="item.image_path" alt="" class="w-full h-full object-cover" draggable="false" />
                <Icon v-else-if="item.icon" :icon="item.icon" :class="themeClasses.explorerItemIcon" class="w-8 h-8" />
                <Icon v-else :icon="defaultIcon" :class="themeClasses.explorerItemIcon" class="w-8 h-8" />
              </div>

              <div class="flex-1 min-w-0 z-[1]">
                <div class="text-sm font-medium overflow-hidden text-ellipsis whitespace-nowrap" :class="themeClasses.explorerItemName">
                  {{ item.name }}
                </div>
                <div v-if="item.description" class="text-xs mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap" :class="themeClasses.explorerItemDescription">
                  {{ item.description }}
                </div>
                <div v-if="item.size" class="text-xs mt-0.5" :class="themeClasses.explorerItemMeta">
                  {{ formatSize(item.size) }}
                  <span v-if="item.modified"> • {{ getRelativeTime(item.modified) }}</span>
                </div>
                <div v-if="item.type === 'file' && downloadProgresses[item.name] !== undefined && downloadProgresses[item.name] < 100" class="text-xs mt-0.5 font-medium" :class="themeClasses.explorerItemMeta">Downloading... {{ downloadProgresses[item.name] }}%</div>
              </div>

              <div class="flex-shrink-0 px-2 py-1 rounded text-[0.625rem] font-semibold uppercase z-[1]" :class="getBadgeClass(item.type)">
                {{ getTypeBadge(item.type) }}
              </div>

              <div class="flex-shrink-0 z-[1]">
                <button @click.stop="handleItemClick(item)" class="p-2 rounded-md border-none cursor-pointer transition-all duration-150" :class="[themeClasses.explorerActionButton, themeClasses.explorerActionButtonHover]" :title="getActionLabel(item.type)">
                  <Icon :icon="getActionIcon(item.type)" class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <StatusBar :icon="fileSearchIcon" message="Explorer" :info="`${totalItems} ${totalItems === 1 ? 'item' : 'items'} available`" :showHelp="true">
      <template #help>
        <div class="space-y-2.5 max-w-sm">
          <div class="flex items-center gap-2">
            <Icon :icon="fileSearchIcon" :class="['w-5 h-5', themeClasses.statusBarIcon]" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">Explorer</h4>
          </div>

          <div :class="['text-[10px] md:text-xs space-y-2 leading-relaxed', themeClasses.statusBarInfo]">
            <p>Search across all available content in HomeDock OS including system applications, installed applications, available software from the App Store, and encrypted files stored in Drop Zone. Use filters to narrow results by category or search by name to quickly find what you need.</p>
          </div>
        </div>
      </template>
    </StatusBar>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";

import { ref, computed, onMounted, nextTick, watch } from "vue";
import { useDesktopStore, DockerApp } from "../__Stores__/desktopStore";
import { useAppStore } from "../__Stores__/useAppStore";
import { useWindowStore } from "../__Stores__/windowStore";
import { useDropZoneUploadingStore } from "../__Stores__/useDropZoneUploadingStore";
import { useResponsive } from "../__Composables__/useResponsive";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { getExplorerApps, SystemApp } from "../__Config__/WindowDefaultDetails";
import BaseImage from "../__Components__/BaseImage.vue";
import StatusBar from "../__Components__/StatusBar.vue";
import AnimatedIcon from "../__Components__/AnimatedIcon.vue";
import { message, Progress } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import searchIcon from "@iconify-icons/mdi/magnify";
import closeIcon from "@iconify-icons/mdi/close";
import magnifyIcon from "@iconify-icons/mdi/magnify";
import alertCircleIcon from "@iconify-icons/mdi/alert-circle";
import allInclusiveIcon from "@iconify-icons/mdi/all-inclusive";
import appsIcon from "@iconify-icons/mdi/apps";
import fileIcon from "@iconify-icons/mdi/file-document";
import storeIcon from "@iconify-icons/mdi/shopping";
import folderIcon from "@iconify-icons/mdi/folder";
import folderOpenOutlineIcon from "@iconify-icons/mdi/folder-open-outline";
import defaultIcon from "@iconify-icons/mdi/application";
import openInNewIcon from "@iconify-icons/mdi/open-in-new";
import downloadIcon from "@iconify-icons/mdi/download";
import playIcon from "@iconify-icons/mdi/play";
import installIcon from "@iconify-icons/mdi/plus-circle";
import imageFileIcon from "@iconify-icons/mdi/file-image";
import videoFileIcon from "@iconify-icons/mdi/file-video";
import audioFileIcon from "@iconify-icons/mdi/file-music";
import zipFileIcon from "@iconify-icons/mdi/zip-box";
import codeFileIcon from "@iconify-icons/mdi/file-code";
import fileSearchIcon from "@iconify-icons/mdi/file-search";

const desktopStore = useDesktopStore();
const appStore = useAppStore();
const windowStore = useWindowStore();
const uploadStore = useDropZoneUploadingStore();
const { isMobile } = useResponsive();
const { themeClasses } = useTheme();

const searchQuery = ref("");
const activeTab = ref<"all" | "apps" | "files" | "available">("all");
const selectedIndex = ref(0);
const searchInputRef = ref<HTMLInputElement | null>(null);
const dropzoneFiles = ref<any[]>([]);
const isLoadingApps = ref(true);
const downloadProgresses = ref<Record<string, number>>({});

const csrfToken = useCsrfToken();

const tabs = computed(() => {
  const getCount = (tabId: string, totalCount: number) => {
    if (activeTab.value === tabId) {
      if (tabId === "all" && !searchQuery.value.trim()) {
        return totalCount;
      }
      return filteredResults.value.length;
    }
    return totalCount;
  };

  return [
    {
      id: "all" as const,
      label: "All",
      icon: allInclusiveIcon,
      count: getCount("all", totalItems.value),
    },
    {
      id: "apps" as const,
      label: "Apps",
      icon: appsIcon,
      count: getCount("apps", systemApps.value.length + installedDockerApps.value.length),
    },
    {
      id: "files" as const,
      label: "Files",
      icon: fileIcon,
      count: getCount("files", dropzoneFiles.value.length),
    },
    {
      id: "available" as const,
      label: "Available",
      icon: storeIcon,
      count: getCount("available", availableApps.value.length),
    },
  ];
});

interface SearchResult {
  id: string;
  type: "system" | "docker" | "file" | "folder" | "available";
  name: string;
  description?: string;
  icon?: any;
  image_path?: string;
  category: string;
  size?: number;
  modified?: string | number;
  score: number;
  action: () => void;
}

const systemApps = computed(() => {
  return getExplorerApps();
});

const installedDockerApps = computed(() => {
  return desktopStore.mainDockerApps.filter((app) => app.status === "running");
});

const availableApps = computed(() => {
  return appStore.apps.filter((app) => !app.is_installed);
});

const totalItems = computed(() => {
  return systemApps.value.length + installedDockerApps.value.length + dropzoneFiles.value.length + availableApps.value.length;
});

async function fetchDropZoneFiles() {
  try {
    const response = await axios.get("/api/get_files", {
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });
    dropzoneFiles.value = response.data.files || [];
  } catch (error) {
    console.error("Failed to fetch DropZone files:", error);
  }
}

async function loadAvailableApps() {
  try {
    isLoadingApps.value = true;
    await appStore.loadApps(csrfToken.value);
  } catch (error) {
    console.error("Failed to load available apps:", error);
  } finally {
    isLoadingApps.value = false;
  }
}

function calculateScore(text: string, query: string): number {
  if (!text || !query) return 0;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  if (lowerText === lowerQuery) return 100;

  if (lowerText.startsWith(lowerQuery)) return 95;

  const escapedQuery = lowerQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const wordBoundaryRegex = new RegExp(`\\b${escapedQuery}\\b`, "i");
  if (wordBoundaryRegex.test(lowerText)) return 90;

  if (lowerText.includes(lowerQuery)) return 85;

  const words = lowerText.split(/[\s-_]+/);
  for (const word of words) {
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
    const matchRatio = matches / lowerQuery.length;
    const proximityScore = 1 - (textIndex - matches) / lowerText.length;
    return Math.floor(60 * matchRatio * proximityScore);
  }

  if (matches > 0) {
    const partialScore = (matches / lowerQuery.length) * 40;
    return Math.floor(partialScore);
  }

  return 0;
}

const allResults = computed<SearchResult[]>(() => {
  const results: SearchResult[] = [];

  systemApps.value.forEach((app) => {
    results.push({
      id: `system-${app.id}`,
      type: "system",
      name: app.name,
      description: app.description,
      icon: app.icon,
      category: "System Apps",
      score: 0,
      action: () => desktopStore.openSystemApp(app.id),
    });
  });

  installedDockerApps.value.forEach((app) => {
    results.push({
      id: `docker-${app.id}`,
      type: "docker",
      name: app.display_name || app.name,
      description: app.image,
      image_path: app.image_path,
      category: "Installed Apps",
      score: 0,
      action: () => desktopStore.openDockerApp(app),
    });
  });

  dropzoneFiles.value.forEach((file) => {
    const isFolder = file.is_directory === true;
    results.push({
      id: `${isFolder ? "folder" : "file"}-${file.name}`,
      type: isFolder ? "folder" : "file",
      name: file.name,
      description: isFolder ? "Folder" : "Encrypted file",
      icon: isFolder ? folderIcon : getFileIcon(file.name),
      category: "Files",
      size: file.size,
      modified: file.modified,
      score: 0,
      action: () => (isFolder ? openDropZoneFolder(file.name) : downloadFile(file.name)),
    });
  });

  availableApps.value.forEach((app) => {
    results.push({
      id: `available-${app.name}`,
      type: "available",
      name: app.display_name || app.name,
      description: app.category,
      image_path: app.picture_path || `docker-icons/${app.name}.jpg`,
      category: "Available in Store",
      score: 0,
      action: () => openAppStore(app.name),
    });
  });

  return results;
});

const filteredResults = computed<SearchResult[]>(() => {
  const query = searchQuery.value.trim();
  const hasSearchQuery = query.length > 0;

  if (activeTab.value === "all" && !hasSearchQuery) {
    return [];
  }

  let results = [...allResults.value];

  if (activeTab.value !== "all") {
    const typeMap: Record<string, string[]> = {
      apps: ["system", "docker"],
      files: ["file", "folder"],
      available: ["available"],
    };
    const allowedTypes = typeMap[activeTab.value] || [];
    results = results.filter((item) => allowedTypes.includes(item.type));
  }

  if (hasSearchQuery) {
    const MIN_SCORE_THRESHOLD = 60;

    results = results
      .map((item) => {
        const nameScore = calculateScore(item.name, query);
        const descScore = item.description ? calculateScore(item.description, query) : 0;
        const categoryScore = calculateScore(item.category, query);

        const maxScore = Math.max(nameScore, descScore * 0.8, categoryScore * 0.5);

        return {
          ...item,
          score: maxScore,
        };
      })
      .filter((item) => item.score >= MIN_SCORE_THRESHOLD)
      .sort((a, b) => b.score - a.score);
  } else {
    results = results.sort((a, b) => {
      const typePriority: Record<string, number> = {
        system: 0,
        folder: 1,
        file: 2,
        docker: 3,
        available: 4,
      };

      const aPriority = typePriority[a.type] ?? 999;
      const bPriority = typePriority[b.type] ?? 999;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      return a.name.localeCompare(b.name);
    });
  }

  return results;
});

const groupedResults = computed(() => {
  const groups: Record<string, SearchResult[]> = {};

  filteredResults.value.forEach((item) => {
    if (!groups[item.category]) {
      groups[item.category] = [];
    }
    groups[item.category].push(item);
  });

  const categoryIcons: Record<string, any> = {
    "System Apps": appsIcon,
    "Installed Apps": appsIcon,
    Files: fileIcon,
    "Available in Store": storeIcon,
  };

  return Object.keys(groups).map((category) => ({
    category,
    title: category,
    icon: categoryIcons[category] || folderIcon,
    items: groups[category],
  }));
});

function getGlobalIndex(groupIndex: number, itemIndex: number): number {
  let index = 0;
  for (let i = 0; i < groupIndex; i++) {
    index += groupedResults.value[i].items.length;
  }
  return index + itemIndex;
}

function getFileIcon(fileName: string): any {
  const extension = fileName.split(".").pop()?.toLowerCase();
  const iconMap: Record<string, any> = {
    png: imageFileIcon,
    jpg: imageFileIcon,
    jpeg: imageFileIcon,
    gif: imageFileIcon,
    webp: imageFileIcon,
    mp4: videoFileIcon,
    mkv: videoFileIcon,
    mp3: audioFileIcon,
    wav: audioFileIcon,
    zip: zipFileIcon,
    rar: zipFileIcon,
    js: codeFileIcon,
    ts: codeFileIcon,
    py: codeFileIcon,
    vue: codeFileIcon,
  };
  return iconMap[extension || ""] || fileIcon;
}

function formatSize(size: number): string {
  if (size >= 1e9) return (size / 1e9).toFixed(2) + " GB";
  if (size >= 1e6) return (size / 1e6).toFixed(2) + " MB";
  if (size >= 1e3) return (size / 1e3).toFixed(2) + " KB";
  return size + " B";
}

function getRelativeTime(modified: string | number): string {
  if (!modified) return "";
  const now = new Date();
  const date = typeof modified === "number" ? new Date(modified * 1000) : new Date(modified);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
}

function getTypeBadge(type: string): string {
  const labels: Record<string, string> = {
    system: "System",
    docker: "Running",
    file: "File",
    folder: "Folder",
    available: "Available",
  };
  return labels[type] || type;
}

function getBadgeClass(type: string): string {
  const classes: Record<string, string> = {
    system: themeClasses.value.explorerBadgeSystem,
    docker: themeClasses.value.explorerBadgeDocker,
    file: themeClasses.value.explorerBadgeFile,
    folder: themeClasses.value.explorerBadgeFile,
    available: themeClasses.value.explorerBadgeAvailable,
  };
  return classes[type] || "";
}

function getActionIcon(type: string): any {
  const icons: Record<string, any> = {
    system: openInNewIcon,
    docker: playIcon,
    file: downloadIcon,
    folder: folderOpenOutlineIcon,
    available: installIcon,
  };
  return icons[type] || openInNewIcon;
}

function getActionLabel(type: string): string {
  const labels: Record<string, string> = {
    system: "Open",
    docker: "Open",
    file: "Download",
    folder: "Open",
    available: "View in Store",
  };
  return labels[type] || "Open";
}

function handleItemClick(item: SearchResult) {
  item.action();
}

async function downloadFile(fileName: string) {
  if (downloadProgresses.value[fileName] !== undefined && downloadProgresses.value[fileName] < 100 && downloadProgresses.value[fileName] > 0) {
    message.info(`Download for ${fileName} is already in progress.`);
    return;
  }

  try {
    downloadProgresses.value[fileName] = 0;

    const response = await axios.get(`/api/download_file?file=${encodeURIComponent(fileName)}`, {
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      responseType: "blob",
      onDownloadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          downloadProgresses.value[fileName] = percentCompleted;
        }
      },
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    const downloadName = fileName.split("/").pop() || fileName;
    link.setAttribute("download", downloadName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    message.success(`Downloaded ${fileName}`);

    setTimeout(() => {
      delete downloadProgresses.value[fileName];
    }, 1000);
  } catch (error) {
    console.error("Failed to download file:", fileName, error);
    delete downloadProgresses.value[fileName];
    if (axios.isAxiosError(error)) {
      message.error(error.response?.data?.error_message || "Failed to download file. Please try again.");
    } else {
      message.error("Failed to download file. Please try again.");
    }
  }
}

function openDropZoneFolder(folderPath: string) {
  desktopStore.openSystemApp("dropzone");
}

function openAppStore(appName: string) {
  const app = appStore.apps.find((a) => a.name === appName);

  if (!app) {
    message.error(`App ${appName} not found`);
    return;
  }

  const existingWindow = windowStore.windows.find((w) => w.appId === "installconfig" && w.data?.app?.name === app.name);

  if (existingWindow) {
    windowStore.focusWindow(existingWindow.id);
    if (existingWindow.isMinimized) {
      existingWindow.isMinimized = false;
    }
    return;
  }

  windowStore.openWindow("installconfig", {
    title: `Install ${app.display_name || app.name}`,
    data: { app },
    allowMultiple: true,
  });
}

function getEmptyMessage(): string {
  const messages: Record<string, string> = {
    all: "No items available",
    apps: "No apps found",
    files: "No files in Drop Zone",
    available: "All apps are already installed",
  };
  return messages[activeTab.value] || "No items found";
}

function getEmptySubtext(): string {
  const subtexts: Record<string, string> = {
    all: "Start by installing apps or uploading files",
    apps: "Install apps from the App Store to get started",
    files: "Upload files to Drop Zone to see them here",
    available: "Great! All available apps are installed",
  };
  return subtexts[activeTab.value] || "";
}

function clearSearch() {
  searchQuery.value = "";
  selectedIndex.value = 0;
}

function handleKeyDown(e: KeyboardEvent) {
  const maxIndex = filteredResults.value.length - 1;

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      selectedIndex.value = Math.min(selectedIndex.value + 1, maxIndex);
      break;
    case "ArrowUp":
      e.preventDefault();
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
      break;
    case "Enter":
      e.preventDefault();
      if (filteredResults.value[selectedIndex.value]) {
        handleItemClick(filteredResults.value[selectedIndex.value]);
      }
      break;
    case "Escape":
      e.preventDefault();
      clearSearch();
      break;
  }
}

onMounted(async () => {
  await Promise.all([loadAvailableApps(), fetchDropZoneFiles()]);

  if (!isMobile.value) {
    nextTick(() => {
      searchInputRef.value?.focus();
    });
  }
});

watch(
  () => uploadStore.currentlyUploading,
  (current, previous) => {
    if (previous && !current) {
      setTimeout(() => {
        fetchDropZoneFiles();
      }, 500);
    }
  }
);
</script>
