<!-- homedock-ui/vue3/static/js/__Components__/UploadIndicator.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Transition name="taskbar-item">
    <div v-if="isUploading" class="upload-indicator-wrapper" ref="indicatorRef">
      <div class="upload-indicator" :class="[themeClasses.uploadIndicatorBg, themeClasses.uploadIndicatorIcon, themeClasses.uploadIndicatorBgHover, themeClasses.uploadIndicatorIconHover]" @click="toggleDropdown">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
          <rect width="24" height="24" fill="none" />
          <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.3">
            <path stroke-dasharray="2 4" stroke-dashoffset="6" d="M12 21c-4.97 0 -9 -4.03 -9 -9c0 -4.97 4.03 -9 9 -9">
              <animate attributeName="stroke-dashoffset" dur="0.6s" repeatCount="indefinite" values="6;0" />
            </path>
            <path stroke-dasharray="32" stroke-dashoffset="32" d="M12 3c4.97 0 9 4.03 9 9c0 4.97 -4.03 9 -9 9">
              <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.1s" dur="0.4s" values="32;0" />
            </path>
            <path stroke-dasharray="10" stroke-dashoffset="10" d="M12 16v-7.5">
              <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.5s" dur="0.2s" values="10;0" />
            </path>
            <path stroke-dasharray="6" stroke-dashoffset="6" d="M12 8.5l3.5 3.5M12 8.5l-3.5 3.5">
              <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.7s" dur="0.2s" values="6;0" />
            </path>
          </g>
        </svg>
      </div>

      <Transition name="dropdown">
        <div v-if="isExpanded" class="upload-dropdown border" :class="[themeClasses.uploadDropdownBg, themeClasses.uploadDropdownBorder, themeClasses.uploadDropdownShadow]">
          <div class="dropdown-header px-6 py-4 rounded-t-lg text-sm font-medium flex items-center space-x-3" :class="themeClasses.topBack">
            <span class="dropdown-title" :class="themeClasses.notTextUp">Uploading Files</span>
          </div>

          <div v-if="uploadStore.currentlyUploading.length > 0" class="upload-section" :class="themeClasses.uploadSectionBorder">
            <div class="section-label" :class="themeClasses.uploadSectionLabel">Currently Uploading ({{ uploadStore.currentlyUploading.length }})</div>
            <div class="file-list">
              <div v-for="file in uploadStore.currentlyUploading" class="file-item" :class="themeClasses.uploadFileItemUploading" :key="`uploading-${file.uid}`">
                <Icon :icon="fileIcon(file.name)" class="file-icon" :class="themeClasses.uploadFileIcon" />
                <div class="file-info">
                  <span class="file-name" :class="themeClasses.uploadFileName">{{ file.name }}</span>
                  <div class="progress-bar" :class="themeClasses.uploadProgressBg">
                    <div class="progress-fill" :class="themeClasses.uploadProgressFill" :style="{ width: `${uploadStore.uploadProgress[file.uid] || 0}%` }"></div>
                  </div>
                </div>
                <span class="progress-text" :class="themeClasses.uploadProgressText">{{ uploadStore.uploadProgress[file.uid] || 0 }}%</span>
              </div>
            </div>
          </div>

          <div v-if="uploadStore.queue.length > 0" class="upload-section" :class="themeClasses.uploadSectionBorder">
            <div class="section-label" :class="themeClasses.uploadSectionLabel">In Queue ({{ uploadStore.queue.length }})</div>
            <div class="file-list">
              <div v-for="(file, index) in visibleQueue" :key="`queue-${index}-${file.uid}`" class="file-item" :class="[themeClasses.uploadFileItemBg, themeClasses.uploadFileItemBgHover]">
                <Icon :icon="fileIcon(file.name)" class="file-icon" :class="themeClasses.uploadFileIcon" />
                <span class="file-name" :class="themeClasses.uploadFileName">{{ file.name }}</span>
                <span class="file-size" :class="themeClasses.uploadFileSize">{{ formatSize(file.size) }}</span>
              </div>
              <div v-if="remainingCount > 0" class="more-files" :class="themeClasses.uploadMoreFiles">And {{ remainingCount }} more...</div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useDropZoneUploadingStore } from "../__Stores__/useDropZoneUploadingStore";
import { useTheme } from "../__Themes__/ThemeSelector";

import { Icon } from "@iconify/vue";
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

const uploadStore = useDropZoneUploadingStore();
const { themeClasses } = useTheme();
const indicatorRef = ref<HTMLElement | null>(null);
const isExpanded = ref(false);

const MAX_VISIBLE = 5;

const isUploading = computed(() => uploadStore.isUploading);

const visibleQueue = computed(() => {
  const uploadingCount = uploadStore.currentlyUploading.length;
  const maxToShow = Math.max(0, MAX_VISIBLE - uploadingCount);
  return uploadStore.queue.slice(0, maxToShow);
});

const remainingCount = computed(() => {
  const uploadingCount = uploadStore.currentlyUploading.length;
  const maxToShow = Math.max(0, MAX_VISIBLE - uploadingCount);
  return Math.max(0, uploadStore.queue.length - maxToShow);
});

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

function fileIcon(fileName: string) {
  if (fileName.endsWith("/")) {
    return folderIcon;
  }
  const extension = fileName.split(".").pop()?.toLowerCase();
  return fileIconsMap[extension || "unknown"] || unknownFileIcon;
}

function formatSize(size: number): string {
  if (size >= 1e9) return (size / 1e9).toFixed(2) + " GB";
  if (size >= 1e6) return (size / 1e6).toFixed(2) + " MB";
  if (size >= 1e3) return (size / 1e3).toFixed(2) + " KB";
  return size + " B";
}

function toggleDropdown(e: MouseEvent) {
  e.stopPropagation();
  isExpanded.value = !isExpanded.value;
}

function closeDropdown() {
  isExpanded.value = false;
}

function handleClickOutside(event: MouseEvent) {
  if (indicatorRef.value && !indicatorRef.value.contains(event.target as Node)) {
    closeDropdown();
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.upload-indicator-wrapper {
  position: relative;
  user-select: none;
}

.upload-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  transition: all 0.15s ease;
  cursor: pointer;
}

/* Dropdown */
.upload-dropdown {
  position: fixed;
  right: 1rem;
  left: auto;
  bottom: 4rem;
  border-radius: 12px;
  width: 280px;
  z-index: 9999;
  overflow: hidden;
}

.dropdown-header {
  padding: 0.75rem 0.875rem;
}

.dropdown-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.upload-section {
  padding: 0.75rem 0.875rem;
}

.upload-section:last-child {
  border-bottom: none;
}

.section-label {
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 0.5rem;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem;
  border-radius: 6px;
  transition: background 0.15s ease;
}

.file-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-name {
  font-size: 0.75rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.file-size {
  font-size: 0.625rem;
  opacity: 0.7;
  flex-shrink: 0;
  white-space: nowrap;
  margin-left: 0.5rem;
}

.progress-bar {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 2px;
}

.progress-text {
  font-size: 0.625rem;
  font-weight: 600;
  flex-shrink: 0;
  min-width: 35px;
  text-align: right;
}

.more-files {
  font-size: 0.7rem;
  text-align: center;
  padding: 0.25rem;
  font-style: italic;
}

/* Dropdown Animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Taskbar item transitions */
.taskbar-item-enter-active,
.taskbar-item-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.taskbar-item-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(10px);
}

.taskbar-item-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(10px);
}
</style>
