<!-- homedock-ui/vue3/static/js/__Layouts__/Dropzone.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template>
  <Favicon />
  <AeroPlusWallpaper />
  <ScrollBarThemeLoader />
  <TopComment />
  <NetworkOffline />
  <div class="flex flex-col min-h-screen">
    <header class="top-0 left-0 z-10">
      <NavBar />
    </header>
    <div class="h-24"></div>
    <div class="flex flex-1 overflow-hidden">
      <aside class="hidden lg:block relative">
        <MenuBar :activePath />
      </aside>
      <div :class="[themeClasses.back]" class="flex flex-col flex-1 pl-4 pt-3 pr-4 max-w-full overflow-x-hidden">
        <main class="flex-1 overflow-auto max-w-full holder">
          <Card title="Drop Zone" body="Locally encrypted file vault" :mdi_icon="cubeIcon" id="dropZoneUp" :collapsible="false">
            <UploadDragger :class="[themeClasses.dropZoneDragHolder, themeClasses.scopeSelector]" v-model:fileList="fileList" name="file" :multiple="true" :customRequest="customUpload" @change="handleChange" @success="handleSuccess" :showUploadList="true">
              <div class="flex items-center align-center justify-center flex-col">
                <p class="ant-upload-drag-icon">
                  <AnimatedIcon :icons="[cubeIcon, shieldLockIcon]" :iconSize="64" :interval="2000" :class="[themeClasses.dropZoneDragIcon]" class="text-4xl" />
                </p>
                <p :class="[themeClasses.dropZoneDragUpText]" class="ant-upload-text px-4 text-balance">Click or drag files to this area to upload and encrypt its content</p>
                <p :class="[themeClasses.dropZoneDragDownText]" class="ant-upload-hint px-4 text-balance">Maximum file size allowed per file is 1GB</p>
                <p v-if="totalSize != '0 B'" class="text-xs mt-2">
                  <strong :class="[themeClasses.dropZoneTotalSizeScope]" class="rounded-full px-4 py-0.5 ml-2"> {{ totalSize }} total in {{ files.length }} {{ files.length === 1 ? "file" : "files" }} </strong>
                </p>
              </div>
            </UploadDragger>

            <div class="mt-2 space-y-2">
              <div class="flex flex-col lg:flex-row gap-2 items-start lg:items-center justify-between">
                <div class="flex-1 min-w-0 w-full lg:w-auto">
                  <AutoComplete v-model:value="searchQuery" :options="filteredFiles" :popup-class-name="`${themeClasses.scopeSelector} z-0`" class="w-full" @select="handleSelect">
                    <InputSearch v-model:value="searchQuery" placeholder="Search files..." :class="[themeClasses.scopeSelector]" class="w-full text-sm" enter-button="Search">
                      <template #prefix>
                        <Icon :icon="cubeIcon" :class="[themeClasses.dropZoneInputIcon]" class="mx-1" />
                      </template>
                    </InputSearch>
                  </AutoComplete>
                </div>

                <div class="flex items-center gap-2 mt-0.5 w-full lg:w-auto lg:flex-shrink-0">
                  <div :class="[themeClasses.dropZoneViewToggle]" class="flex rounded-md border overflow-hidden h-8 flex-1 lg:flex-none">
                    <button @click="setViewMode('grid')" :class="['px-3 py-1 text-sm transition-colors h-full flex items-center justify-center flex-1', viewMode === 'grid' ? themeClasses.dropZoneViewButtonActive : themeClasses.dropZoneViewButtonInactive]" title="Grid View">
                      <Icon :icon="gridIcon" class="w-4 h-4" />
                    </button>
                    <button @click="setViewMode('list')" :class="['px-3 py-1 text-sm transition-colors h-full flex items-center justify-center flex-1', viewMode === 'list' ? themeClasses.dropZoneViewButtonActive : themeClasses.dropZoneViewButtonInactive]" title="List View">
                      <Icon :icon="listIcon" class="w-4 h-4" />
                    </button>
                  </div>

                  <Select v-model:value="sortBy" :class="[themeClasses.scopeSelector, themeClasses.dropZoneSortSelect]" class="h-8 flex-1 lg:flex-none rounded-md lg:w-auto min-w-[140px] transition duration-150" :popup-class-name="`${themeClasses.scopeSelector} z-0`" :show-search="false">
                    <template #suffixIcon>
                      <Icon :icon="axisArrowIcon" class="w-4 h-4" />
                    </template>
                    <SelectOption value="name">Sort by Name</SelectOption>
                    <SelectOption value="size">Sort by Size</SelectOption>
                    <SelectOption value="date">Sort by Date</SelectOption>
                  </Select>

                  <button @click="toggleSortDirection" :class="[themeClasses.dropZoneSortButton]" class="px-2 py-1 border rounded-md transition-colors h-8 flex items-center justify-center flex-shrink-0" :title="sortDirection === 'asc' ? 'Sort Ascending' : 'Sort Descending'">
                    <Icon :icon="sortDirection === 'asc' ? sortAscIcon : sortDescIcon" class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div class="flex items-center justify-start text-[10px]">
                <span :class="[themeClasses.dropZoneFilesCount]">
                  {{ displayedFiles.length }} {{ displayedFiles.length === 1 ? "file" : "files" }}
                  <span v-if="searchQuery" class="ml-0.5">(filtered from {{ files.length }} total)</span>
                </span>
              </div>

              <div>
                <div v-if="displayedFiles.length === 0" class="flex justify-center items-center py-8">
                  <Empty :class="[themeClasses.dropZoneEmptyText]" :description="searchQuery ? 'No encrypted files found matching your search' : 'No encrypted files found'" />
                </div>

                <!-- Grid View -->
                <transition name="layout-switch" mode="out-in" appear>
                  <div v-if="viewMode === 'grid'" key="grid-view" class="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
                    <transition-group name="file-reorder" tag="div" class="contents">
                      <div v-for="file in sortedFiles" :key="file.name" :class="[themeClasses.dropZoneFileDisplayer]" class="relative flex flex-col items-center justify-center text-center border border-dashed rounded-lg p-4 shadow-sm hover:shadow-md group transition duration-300">
                        <span v-if="isNewFile(file)" :class="[themeClasses.dropZoneNewBadge]" class="absolute left-2 top-2 text-[8px] px-1 py-0.5 rounded-full font-bold z-10">NEW</span>

                        <div class="absolute right-2 top-2 flex items-center gap-1">
                          <Icon v-if="loadingStates[file.name]" :icon="loadingIcon" :class="[themeClasses.dropZoneLockIcon]" class="transition duration-300 animate-spin h-4 w-4 min-h-4 min-w-4" />
                          <Icon :icon="fileStates[file.name] ? lockOpenIcon : lockIcon" :class="[themeClasses.dropZoneLockIcon]" class="transition duration-300 h-4 w-4 min-h-4 min-w-4" />
                        </div>

                        <Icon :icon="fileIcon(file.name)" :class="[themeClasses.dropZoneFileIcon]" class="h-12 w-12 min-h-12 min-w-12 transition duration-300 group-hover:scale-110" />

                        <div class="mt-2 w-full">
                          <span :class="[themeClasses.dropZoneFileText]" class="text-xs break-words w-full overflow-hidden text-ellipsis block text-center" :title="file.name">
                            {{ file.name }}
                          </span>
                          <div class="flex items-center justify-center gap-1 mt-1">
                            <span :class="[themeClasses.dropZoneFileSize]" class="px-1 rounded-full text-[10px]">
                              {{ formatSize(file.size) }}
                            </span>
                            <span v-if="file.modified" :class="[themeClasses.dropZoneFileSize]" class="px-1 rounded-full text-[10px]" :title="getFullDateString(file.modified)">
                              {{ getRelativeTime(file.modified) }}
                            </span>
                          </div>
                        </div>

                        <div class="absolute -bottom-1 left-0 right-0 px-1">
                          <Progress v-if="downloadProgresses[file.name] !== undefined && downloadProgresses[file.name] < 100" :percent="downloadProgresses[file.name]" :class="[themeClasses.scopeSelector, 'a-download-bottom-progress']" :show-info="false" :size="2" status="active" class="h-1 rounded-full" />
                        </div>

                        <div class="mt-3 flex justify-center">
                          <div :class="['transition-all duration-300 ease-out', deleteConfirmStates[file.name] ? 'w-full flex justify-center' : 'flex space-x-2']">
                            <Button
                              v-show="!deleteConfirmStates[file.name]"
                              type="primary"
                              @click="downloadFile(file.name)"
                              size="small"
                              :title="`Download ${file.name}`"
                              class="transition-all duration-300 ease-out"
                              :class="{
                                'opacity-0 scale-95 pointer-events-none': deleteConfirmStates[file.name],
                                'opacity-100 scale-100': !deleteConfirmStates[file.name],
                              }"
                            >
                              <Icon :icon="arrowDownThickIcon" />
                            </Button>

                            <Button type="dashed" @click="deleteConfirmStates[file.name] ? confirmDelete(file.name) : startDeleteConfirmation(file.name)" size="small" :class="[themeClasses.dropZoneDeleteIcon, 'transition-all duration-300 ease-out transform-gpu relative overflow-hidden', deleteConfirmStates[file.name] ? 'min-w-20 border-red-500 text-white px-2' : 'w-8 px-2']" :title="deleteConfirmStates[file.name] ? `Confirm delete ${file.name}` : `Delete ${file.name}`" :danger="deleteConfirmStates[file.name]">
                              <div class="flex items-center justify-center whitespace-nowrap">
                                <Icon :icon="closeIcon" :class="['transition-transform duration-300 flex-shrink-0 w-4 h-4', deleteConfirmStates[file.name] ? 'rotate-0' : 'group-hover:rotate-90']" />
                                <span :class="['text-xs font-medium transition-all duration-300 overflow-hidden', deleteConfirmStates[file.name] ? 'opacity-100 max-w-20 ml-1.5' : 'opacity-0 max-w-0 ml-0']"> Delete? </span>
                              </div>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </transition-group>
                  </div>

                  <!-- List View -->
                  <div v-else key="list-view" class="space-y-2">
                    <transition-group name="file-reorder" tag="div" class="space-y-2">
                      <div v-for="file in sortedFiles" :key="file.name" :class="[themeClasses.dropZoneFileDisplayer]" class="relative flex items-center gap-4 p-3 border border-dashed rounded-lg hover:shadow-md group transition duration-300">
                        <span v-if="isNewFile(file)" :class="[themeClasses.dropZoneNewBadge]" class="absolute left-2 top-2 text-[8px] px-1 py-0.5 rounded-full font-bold z-10">NEW</span>

                        <Icon :icon="fileIcon(file.name)" :class="[themeClasses.dropZoneFileIcon]" class="h-8 w-8 min-h-8 min-w-8 flex-shrink-0" />

                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2">
                            <span :class="[themeClasses.dropZoneFileText]" class="text-sm font-medium truncate" :title="file.name">
                              {{ file.name }}
                            </span>
                            <div class="flex items-center gap-1">
                              <Icon v-if="loadingStates[file.name]" :icon="loadingIcon" :class="[themeClasses.dropZoneLockIcon]" class="transition duration-300 animate-spin h-3 w-3" />
                              <Icon :icon="fileStates[file.name] ? lockOpenIcon : lockIcon" :class="[themeClasses.dropZoneLockIcon]" class="transition duration-300 h-3 w-3" />
                            </div>
                          </div>
                          <div class="flex items-center gap-2 mt-1 text-xs">
                            <span :class="[themeClasses.dropZoneFileSize]" class="px-1 rounded-full text-[10px]">{{ formatSize(file.size) }}</span>
                            <span v-if="file.modified" :class="[themeClasses.dropZoneFileSize]" class="px-1 rounded-full text-[10px]" :title="getFullDateString(file.modified)">
                              {{ getRelativeTime(file.modified) }}
                            </span>
                          </div>

                          <div v-if="downloadProgresses[file.name] !== undefined && downloadProgresses[file.name] < 100" class="absolute -bottom-1 left-0 right-0 px-1">
                            <Progress :percent="downloadProgresses[file.name]" :class="[themeClasses.scopeSelector, 'a-download-bottom-progress']" :show-info="false" :size="2" status="active" class="h-1 rounded-full" />
                          </div>
                        </div>

                        <div class="flex items-center gap-2 flex-shrink-0">
                          <Button
                            v-show="!deleteConfirmStates[file.name]"
                            type="primary"
                            @click="downloadFile(file.name)"
                            size="small"
                            :title="`Download ${file.name}`"
                            class="transition-all duration-300 ease-out"
                            :class="{
                              'opacity-0 scale-95 pointer-events-none': deleteConfirmStates[file.name],
                              'opacity-100 scale-100': !deleteConfirmStates[file.name],
                            }"
                          >
                            <Icon :icon="arrowDownThickIcon" />
                          </Button>

                          <Button type="dashed" @click="deleteConfirmStates[file.name] ? confirmDelete(file.name) : startDeleteConfirmation(file.name)" size="small" :class="[themeClasses.dropZoneDeleteIcon, 'transition-all duration-300 ease-out transform-gpu relative overflow-hidden', deleteConfirmStates[file.name] ? 'min-w-20 border-red-500 text-white px-3' : 'w-8 px-2']" :title="deleteConfirmStates[file.name] ? `Confirm delete ${file.name}` : `Delete ${file.name}`" :danger="deleteConfirmStates[file.name]">
                            <div class="flex items-center justify-center gap-1 whitespace-nowrap">
                              <Icon :icon="closeIcon" :class="['transition-transform duration-300 flex-shrink-0 w-4 h-4', deleteConfirmStates[file.name] ? 'rotate-0' : 'group-hover:rotate-90']" />
                              <span :class="['text-xs font-medium transition-all duration-300', deleteConfirmStates[file.name] ? 'opacity-100 ml-0' : 'opacity-0 w-0 -ml-1']"> Confirm </span>
                            </div>
                          </Button>
                        </div>
                      </div>
                    </transition-group>
                  </div>
                </transition>
              </div>
            </div>
          </Card>
        </main>
        <Footer></Footer>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from "vue";
import axios from "axios";
import { FileEntry } from "../__Types__/DropZoneFileEntry";
import { useTheme } from "../__Themes__/ThemeSelector";
import { message, UploadDragger, AutoComplete, InputSearch, Empty, Button, Progress, Select, SelectOption } from "ant-design-vue";
import { Icon } from "@iconify/vue";

import cubeIcon from "@iconify-icons/mdi/cube";
import folderIcon from "@iconify-icons/mdi/folder";
import textFileIcon from "@iconify-icons/mdi/file-document";
import imageFileIcon from "@iconify-icons/mdi/file-image";
import videoFileIcon from "@iconify-icons/mdi/file-video";
import audioFileIcon from "@iconify-icons/mdi/file-music";
import zipFileIcon from "@iconify-icons/mdi/zip-box";
import excelFileIcon from "@iconify-icons/mdi/file-excel";
import powerpointFileIcon from "@iconify-icons/mdi/file-powerpoint";
import wordFileIcon from "@iconify-icons/mdi/file-word";
import codeFileIcon from "@iconify-icons/mdi/file-code";
import unknownFileIcon from "@iconify-icons/mdi/file";
import arrowDownThickIcon from "@iconify-icons/mdi/arrow-down-thick";
import closeIcon from "@iconify-icons/mdi/close";
import shieldLockIcon from "@iconify-icons/mdi/shield-lock";
import lockIcon from "@iconify-icons/mdi/lock";
import lockOpenIcon from "@iconify-icons/mdi/lock-open-alert";
import loadingIcon from "@iconify-icons/mdi/loading";
import gridIcon from "@iconify-icons/mdi/view-grid";
import listIcon from "@iconify-icons/mdi/view-list";
import sortAscIcon from "@iconify-icons/mdi/sort-ascending";
import sortDescIcon from "@iconify-icons/mdi/sort-descending";
import alertIcon from "@iconify-icons/mdi/alert";
import axisArrowIcon from "@iconify-icons/mdi/axis-arrow";

import AnimatedIcon from "../__Components__/AnimatedIcon.vue";
import Favicon from "../__Components__/Favicon.vue";
import AeroPlusWallpaper from "../__Components__/AeroPlusWallpaper.vue";
import ScrollBarThemeLoader from "../__Components__/ScrollBarThemeLoader.vue";
import TopComment from "../__Components__/TopComment.vue";
import NetworkOffline from "../__Components__/NetworkOffline.vue";
import Footer from "../__Components__/Footer.vue";
import NavBar from "../__Components__/NavBar.vue";
import MenuBar from "../__Components__/MenuBar.vue";
import Card from "../__Components__/Card.vue";

const fileIcon = (fileName: string) => {
  if (fileName.endsWith("/")) {
    return folderIcon;
  }
  const extension = fileName.split(".").pop()?.toLowerCase();
  return fileIconsMap[extension || "unknown"] || unknownFileIcon;
};

const fileIconsMap: Record<string, any> = {
  folder: folderIcon,
  txt: textFileIcon,
  md: textFileIcon,
  pdf: textFileIcon,
  png: imageFileIcon,
  jpg: imageFileIcon,
  jpeg: imageFileIcon,
  gif: imageFileIcon,
  psd: imageFileIcon,
  webp: imageFileIcon,
  mp4: videoFileIcon,
  mkv: videoFileIcon,
  mp3: audioFileIcon,
  wav: audioFileIcon,
  flac: audioFileIcon,
  zip: zipFileIcon,
  rar: zipFileIcon,
  doc: wordFileIcon,
  docx: wordFileIcon,
  pptx: powerpointFileIcon,
  ppt: powerpointFileIcon,
  ppsx: powerpointFileIcon,
  pps: powerpointFileIcon,
  xlsx: excelFileIcon,
  xls: excelFileIcon,
  csv: excelFileIcon,
  exe: codeFileIcon,
  app: codeFileIcon,
  sh: codeFileIcon,
  js: codeFileIcon,
  ts: codeFileIcon,
  py: codeFileIcon,
  c: codeFileIcon,
  cpp: codeFileIcon,
  h: codeFileIcon,
  hpp: codeFileIcon,
  cs: codeFileIcon,
  java: codeFileIcon,
  php: codeFileIcon,
  html: codeFileIcon,
  css: codeFileIcon,
  json: codeFileIcon,
  xml: codeFileIcon,
  sql: codeFileIcon,
  rs: codeFileIcon,
};

const csrfToken = ref<string>(document.querySelector('meta[name="homedock_csrf_token"]')?.getAttribute("content") || "");
const { themeClasses } = useTheme();
const activePath = ref("/drop-zone");

const files = ref<FileEntry[]>([]);
const searchQuery = ref<string>("");
const fileList = ref([]);
const fileStates = ref<Record<string, boolean>>({});
const loadingStates = ref<Record<string, boolean>>({});
const downloadProgresses = ref<Record<string, number>>({});
const deleteConfirmStates = ref<Record<string, boolean>>({});
let deleteConfirmTimeout: Record<string, NodeJS.Timeout> = {};

interface UploadFile extends File {
  uid: string;
}

const uploadQueue = ref<
  Array<{
    file: UploadFile;
    onProgress?: (event: { percent: number }) => void;
    onSuccess?: (result: any, file: UploadFile) => void;
    onError?: (error: any) => void;
  }>
>([]);
const activeUploads = ref(0);
const maxConcurrent = 3;

const viewMode = ref<"grid" | "list">("grid");
const sortBy = ref<"name" | "size" | "date">("name");
const sortDirection = ref<"asc" | "desc">("asc");

const loadPreferences = () => {
  try {
    const saved = localStorage.getItem("dropzoneStatus");
    if (saved) {
      const prefs = JSON.parse(saved);
      viewMode.value = prefs.viewMode || "grid";
      sortBy.value = prefs.sortBy || "name";
      sortDirection.value = prefs.sortDirection || "asc";
    }
  } catch (error) {
    console.warn("Failed to load dropzone preferences:", error);
  }
};

const savePreferences = () => {
  try {
    const prefs = {
      viewMode: viewMode.value,
      sortBy: sortBy.value,
      sortDirection: sortDirection.value,
    };
    localStorage.setItem("dropzoneStatus", JSON.stringify(prefs));
  } catch (error) {
    console.warn("Failed to save dropzone preferences:", error);
  }
};

watch([viewMode, sortBy, sortDirection], () => {
  savePreferences();
});

const setViewMode = (mode: "grid" | "list") => {
  viewMode.value = mode;
};

const toggleSortDirection = () => {
  sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
};

const getRelativeTime = (modified: string | number) => {
  if (!modified) return "";

  const now = new Date();
  const date = typeof modified === "number" ? new Date(modified * 1000) : new Date(modified);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 30) return "Now";
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
};

const getFullDateString = (modified: string | number) => {
  if (!modified) return "";
  const date = typeof modified === "number" ? new Date(modified * 1000) : new Date(modified);
  return date.toLocaleString();
};

const processQueue = async () => {
  if (activeUploads.value >= maxConcurrent || uploadQueue.value.length === 0) return;

  const nextUpload = uploadQueue.value.shift();
  if (!nextUpload) return;

  activeUploads.value++;

  try {
    await uploadFile(nextUpload.file, nextUpload.onProgress);
    fileList.value = fileList.value.filter((f: any) => f.uid !== nextUpload.file.uid);
    if (nextUpload.onSuccess) nextUpload.onSuccess(null, nextUpload.file);
  } catch (error) {
    if (nextUpload.onError) nextUpload.onError(error);
  } finally {
    activeUploads.value--;
    processQueue();
  }
};

const customUpload = async ({ file, onSuccess, onError, onProgress }: any) => {
  uploadQueue.value.push({
    file: file as UploadFile,
    onProgress,
    onSuccess,
    onError,
  });
  processQueue();
};

const isNewFile = (file: FileEntry) => {
  if (!file.modified) return false;

  const now = new Date();
  const date = typeof file.modified === "number" ? new Date(file.modified * 1000) : new Date(file.modified);
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  return diffInHours < 1;
};

const uploadFile = async (file: File, onProgress?: (event: { percent: number }) => void) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axios.post("/api/upload_file", formData, {
      headers: {
        "X-HomeDock-CSRF-Token": csrfToken.value,
      },
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress({ percent });
        }
      },
    });

    if (!response.data.success) {
      message.error(response.data.error.value || "Upload failed");
      console.error("Error during file upload:", response.data.error);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 413) {
        message.error("The selected file is larger than 1GB.");
      } else {
        message.error(error.response?.data?.error_message || `Unexpected error occurred: ${error.message}`);
      }
    } else {
      message.error("An unknown error occurred. Please try again.");
    }
    console.error("Upload error:", error);
  }
};

const downloadFile = async (fileName: string) => {
  if (downloadProgresses.value[fileName] !== undefined && downloadProgresses.value[fileName] < 100 && downloadProgresses.value[fileName] > 0) {
    message.info(`Download for ${fileName} is already in progress.`);
    return;
  }

  try {
    fileStates.value[fileName] = true;
    loadingStates.value[fileName] = true;
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
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    setTimeout(() => {
      fileStates.value[fileName] = false;
      loadingStates.value[fileName] = false;
    }, 1000);
  } catch (error) {
    console.error("Error downloading file:", error);
    message.error("Failed to download file. Please try again.");
    delete downloadProgresses.value[fileName];
    loadingStates.value[fileName] = false;
    fileStates.value[fileName] = false;
  }
};

const startDeleteConfirmation = (fileName: string) => {
  if (deleteConfirmTimeout[fileName]) {
    clearTimeout(deleteConfirmTimeout[fileName]);
  }

  deleteConfirmStates.value[fileName] = true;

  deleteConfirmTimeout[fileName] = setTimeout(() => {
    cancelDeleteConfirmation(fileName);
  }, 3000);
};

const cancelDeleteConfirmation = (fileName: string) => {
  deleteConfirmStates.value[fileName] = false;
  if (deleteConfirmTimeout[fileName]) {
    clearTimeout(deleteConfirmTimeout[fileName]);
    delete deleteConfirmTimeout[fileName];
  }
};

const confirmDelete = async (fileName: string) => {
  if (deleteConfirmTimeout[fileName]) {
    clearTimeout(deleteConfirmTimeout[fileName]);
    delete deleteConfirmTimeout[fileName];
  }

  deleteConfirmStates.value[fileName] = false;

  await deleteFile(fileName);
};

const deleteFile = async (fileName: string) => {
  try {
    const response = await axios.post("/api/delete_file", { file: fileName }, { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });

    if (response.data.success) {
      message.success(response.data.message);
      fetchFiles();
    } else {
      message.error(response.data.error || "Failed to delete file");
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    message.error("Failed to delete file. Please try again.");
  }
};

const fetchFiles = async () => {
  try {
    const response = await axios.get("/api/get_files", {
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });

    files.value = response.data.files || [];
  } catch (error) {
    console.error("Error fetching files:", error);
    message.error("Failed to fetch files. Please try again.");
  }
};

const filteredFiles = computed(() => {
  if (!searchQuery.value) {
    return files.value.map((file) => ({ value: file.name, label: file.name }));
  }
  return files.value.filter((file) => file.name.toLowerCase().includes(searchQuery.value.toLowerCase())).map((file) => ({ value: file.name, label: file.name }));
});

const displayedFiles = computed(() => {
  if (!searchQuery.value) return files.value;
  return files.value.filter((file) => file.name.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

const sortedFiles = computed(() => {
  const sorted = [...displayedFiles.value].sort((a, b) => {
    let comparison = 0;

    switch (sortBy.value) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "size":
        comparison = a.size - b.size;
        break;
      case "date":
        if (!a.modified && !b.modified) comparison = 0;
        else if (!a.modified) comparison = 1;
        else if (!b.modified) comparison = -1;
        else {
          const aTime = typeof a.modified === "number" ? a.modified : new Date(a.modified).getTime() / 1000;
          const bTime = typeof b.modified === "number" ? b.modified : new Date(b.modified).getTime() / 1000;
          comparison = aTime - bTime;
        }
        break;
    }

    return sortDirection.value === "asc" ? comparison : -comparison;
  });

  return sorted;
});

const totalSize = computed(() => {
  return formatSize(files.value.reduce((acc, file) => acc + file.size, 0));
});

const handleSelect = (value: string | number | { value: string | number }) => {
  const selectedValue = typeof value === "object" ? value.value : value;
  searchQuery.value = selectedValue.toString();
  message.info(`Selected: ${selectedValue}`);
};

const handleChange = (info: any) => {
  if (info.file.status === "done") {
    message.success(`${info.file.name} uploaded successfully`);
  } else if (info.file.status === "error") {
    message.error(`${info.file.name} upload failed.`);
  }
};

function formatSize(size: string | number) {
  const numSize = typeof size === "number" ? size : parseFloat(size);
  if (numSize >= 1e9) return (numSize / 1e9).toFixed(2) + " GBs";
  if (numSize >= 1e6) return (numSize / 1e6).toFixed(2) + " MBs";
  if (numSize >= 1e3) return (numSize / 1e3).toFixed(2) + " KBs";
  return numSize + " B";
}

const handleSuccess = () => {
  fetchFiles();
};

const cleanupTimeouts = () => {
  Object.values(deleteConfirmTimeout).forEach((timeout) => {
    clearTimeout(timeout);
  });
  deleteConfirmTimeout = {};
};

onMounted(() => {
  loadPreferences();
  fetchFiles();
});
</script>

<style scoped>
/* Grid-List Transition */
.layout-switch-enter-active {
  transition: all 0.25s ease-out;
}

.layout-switch-leave-active {
  transition: all 0.2s ease-in;
}

.layout-switch-enter-from {
  opacity: 0;
  transform: scale(0.98);
}

.layout-switch-leave-to {
  opacity: 0;
  transform: scale(1.02);
}

/* Smooth button transitions sin fragmentación */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.transform-gpu {
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
}

/* File Reorder Transition */
.file-reorder-enter-active {
  transition: all 0.3s ease-out;
}

.file-reorder-leave-active {
  transition: all 0.2s ease-in;
}

.file-reorder-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.file-reorder-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.file-reorder-move {
  transition: transform 0.3s ease;
}

/* AntD Vue Overrides */
:global(.dark-mode-theme.ant-select-dropdown) {
  background-color: rgb(39, 39, 42) !important;
}

:global(.aero-mode-theme.ant-select-dropdown) {
  background-color: rgba(0, 0, 0, 0) !important;
  backdrop-filter: blur(100px) saturate(200%) !important;
  -webkit-backdrop-filter: blur(100px) saturate(100%) !important;
}

:global(.dark-mode-theme .ant-select-item) {
  color: rgb(128, 128, 128) !important;
}

:global(.aero-mode-theme .ant-select-item) {
  color: rgba(255, 255, 255, 0.501) !important;
}

:global(.dark-mode-theme .ant-select-item-group) {
  color: rgb(255, 255, 255) !important;
}

:global(.aero-mode-theme .ant-select-item-group) {
  color: rgb(255, 255, 255) !important;
}

::v-deep(.dark-mode-theme input) {
  background-color: rgb(39, 39, 42) !important;
  color: rgb(255, 255, 255) !important;
}

::v-deep(.aero-mode-theme input) {
  background-color: rgba(0, 0, 0, 0) !important;
  color: rgb(255, 255, 255) !important;
}

::v-deep(.white-mode-theme input::placeholder) {
  color: rgb(210, 210, 210) !important;
}

::v-deep(.dark-mode-theme input::placeholder) {
  color: rgb(100, 100, 100) !important;
}

::v-deep(.aero-mode-theme input::placeholder) {
  color: rgb(177, 177, 177) !important;
}

::v-deep(.white-mode-theme input:autofill) {
  background-color: transparent !important;
  box-shadow: 0 0 0 1000px rgb(255, 255, 255) inset !important;
  -webkit-text-fill-color: #000000 !important;
}

::v-deep(.dark-mode-theme input:autofill) {
  background-color: transparent !important;
  box-shadow: 0 0 0 1000px rgb(39, 39, 42) inset !important;
  -webkit-text-fill-color: #fff !important;
}

::v-deep(.aero-mode-theme input:autofill) {
  background-color: transparent !important;
  box-shadow: 0 0 0 1000px rgb(39, 39, 42) inset !important;
  -webkit-text-fill-color: #fff !important;
}

::v-deep(.white-mode-theme input:autofill:hover) {
  box-shadow: 0 0 0 1000px rgb(255, 255, 255) inset !important;
}

::v-deep(.dark-mode-theme input:autofill:hover) {
  box-shadow: 0 0 0 1000px rgb(39, 39, 42) inset !important;
}

::v-deep(.aero-mode-theme input:autofill:hover) {
  box-shadow: 0 0 0 1000px rgb(39, 39, 42) inset !important;
}

::v-deep(.dark-mode-theme .ant-input-affix-wrapper) {
  background-color: rgb(39, 39, 42) !important;
  border: 1px solid rgb(61, 61, 61) !important;
}

::v-deep(.aero-mode-theme .ant-input-affix-wrapper) {
  background-color: rgba(0, 0, 0, 0.1) !important;
  border: 1px solid rgba(62, 62, 62, 0.489) !important;
}

::v-deep(.dark-mode-theme .ant-input-affix-wrapper:hover) {
  border: 1px solid rgb(24, 119, 255) !important;
}

::v-deep(.aero-mode-theme .ant-input-affix-wrapper:hover) {
  border: 1px solid rgb(24, 119, 255) !important;
}

:global(.dark-mode-theme .ant-upload-list-item.ant-upload-list-item-uploading) {
  color: white !important;
}

:global(.aero-mode-theme .ant-upload-list-item.ant-upload-list-item-uploading) {
  color: white !important;
}

:global(.dark-mode-theme .anticon.anticon-delete) {
  color: rgb(184, 20, 20) !important;
}

:global(.aero-mode-theme .anticon.anticon-delete) {
  color: rgb(184, 20, 20) !important;
}

/* BG Upload Progress scopeSelector Default */
:global(.ant-upload-list-item-progress .ant-progress-bg) {
  height: 2px !important;
}

/* BG Upload Progress scopeSelector Uploading */
:global(.white-mode-theme .ant-upload-list-item-progress .ant-progress-bg) {
  background: rgb(0, 212, 92) !important;
}

:global(.dark-mode-theme .ant-upload-list-item-progress .ant-progress-bg) {
  background: rgb(0, 113, 49) !important;
}

:global(.aero-mode-theme .ant-upload-list-item-progress .ant-progress-bg) {
  background: linear-gradient(90deg, rgba(0, 255, 175, 0.55), rgba(50, 255, 180, 0.4), rgba(24, 160, 88, 0.25)) !important;
}

/* BG Upload Progress scopeSelector Success Uploading */
:global(.white-mode-theme .ant-progress-status-success .ant-progress-bg) {
  background: rgb(0, 112, 255) !important;
}

:global(.dark-mode-theme .ant-progress-status-success .ant-progress-bg) {
  background: rgb(0, 90, 220) !important;
}

:global(.aero-mode-theme .ant-progress-status-success .ant-progress-bg) {
  background: linear-gradient(90deg, rgba(0, 120, 255, 0.55), rgba(0, 190, 255, 0.4), rgba(24, 160, 255, 0.25)) !important;
}

/* BG Download Progress scopeSelector Downloading */
:global(.white-mode-theme.a-download-bottom-progress .ant-progress-bg) {
  background: rgb(0, 212, 92) !important;
}

:global(.dark-mode-theme.a-download-bottom-progress .ant-progress-bg) {
  background: rgb(0, 113, 49) !important;
}

:global(.aero-mode-theme.a-download-bottom-progress .ant-progress-bg) {
  background: linear-gradient(90deg, rgba(0, 255, 175, 0.55), rgba(50, 255, 180, 0.4), rgba(24, 160, 88, 0.25)) !important;
}

/* Custom styles for select and modal */
::v-deep(.dark-mode-theme select) {
  background-color: rgb(39, 39, 42) !important;
  color: rgb(255, 255, 255) !important;
  border-color: rgb(61, 61, 61) !important;
}

::v-deep(.aero-mode-theme select) {
  background-color: rgba(0, 0, 0, 0.1) !important;
  color: rgb(255, 255, 255) !important;
  border-color: rgba(62, 62, 62, 0.489) !important;
}

::v-deep(.dark-mode-theme select:focus) {
  border-color: rgb(24, 119, 255) !important;
  box-shadow: 0 0 0 2px rgba(24, 119, 255, 0.2) !important;
}

::v-deep(.aero-mode-theme select:focus) {
  border-color: rgb(24, 119, 255) !important;
  box-shadow: 0 0 0 2px rgba(24, 119, 255, 0.2) !important;
}

::v-deep(.dark-mode-theme .ant-select-selector) {
  background-color: rgba(31, 31, 31, 0) !important;
  color: white !important;
  box-shadow: 0 0 0 1000px rgb(39, 39, 42) inset !important;
  border: 1px solid rgb(64, 64, 64) !important;
}

::v-deep(.aero-mode-theme .ant-select-selector) {
  background-color: transparent !important;
  color: white !important;
  box-shadow: 0 0 0 1000px rgba(0, 0, 0, 0.1) inset !important;
  border: 1px solid rgb(64, 64, 64, 0.5) !important;
}

::v-deep(.dark-mode-theme .ant-select-item-option) {
  background-color: rgb(31, 31, 31) !important;
  color: white !important;
  box-shadow: 0 0 0 1000px rgb(39, 39, 42) inset !important;
  border: 1px solid rgb(64, 64, 64) !important;
}

::v-deep(.dark-mode-theme .ant-select-arrow) {
  color: rgb(115, 115, 115) !important;
}

::v-deep(.dark-mode-theme .ant-select-selection-item) {
  color: rgb(115, 115, 115) !important;
}

::v-deep(.aero-mode-theme .ant-select-arrow) {
  color: rgb(115, 115, 115) !important;
}

::v-deep(.aero-mode-theme .ant-select-selection-item) {
  color: rgb(115, 115, 115) !important;
}

:global(.aero-mode-theme .ant-select-item-option-selected) {
  background-color: rgba(43, 43, 43, 0.218) !important;
}
</style>
