<!-- homedock-ui/vue3/static/js/__Components__/UnifiedUploadIndicator.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Transition name="taskbar-item">
    <div v-if="isUploading" class="upload-indicator-wrapper" ref="indicatorRef">
      <div class="upload-indicator" :class="[themeClasses.uploadIndicatorBg, themeClasses.uploadIndicatorIcon, themeClasses.uploadIndicatorBgHover, themeClasses.uploadIndicatorIconHover]" @click="toggle">
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
        <Icon :icon="badgeIcon" class="badge-icon" />
      </div>

      <TrayPanel :open="isOpen" :anchor="indicatorRef" :title="title" :subtitle="queue.length ? $t('In Queue ({n})', { n: queue.length }) : undefined" :icon="badgeIcon" icon-color="#0ea5e9" @close="close">
        <TraySection v-if="currentlyUploading.length > 0" :title="$t('Currently Uploading ({n})', { n: currentlyUploading.length })">
          <TrayRow v-for="file in currentlyUploading" :key="`uploading-${file.uid}`" :title="file.name" highlighted>
            <template #leading>
              <span :class="[themeClasses.storeInfoBar]" class="flex items-center justify-center w-7 h-7 rounded-[7px] border flex-shrink-0">
                <Icon :icon="fileIcon(file.name)" :class="[themeClasses.storeCardSubtitle]" class="w-4 h-4" />
              </span>
            </template>
            <template #subtitle>
              <span :class="[themeClasses.storeInfoBarDivider]" class="block h-1 mt-1 rounded-full overflow-hidden">
                <span class="block h-full rounded-full bg-blue-500 transition-[width] duration-300 ease-out" :style="{ width: `${progress[file.uid] || 0}%` }"></span>
              </span>
            </template>
            <template #trailing>
              <span :class="[themeClasses.storeCardSubtitle]" class="flex-shrink-0 min-w-[34px] text-right text-[11px] font-semibold tabular-nums">{{ progress[file.uid] || 0 }}%</span>
            </template>
          </TrayRow>
        </TraySection>

        <TraySection v-if="queue.length > 0" :title="$t('Queued')">
          <TrayRow v-for="(file, index) in visibleQueue" :key="`queue-${index}-${file.uid}`" :title="file.name">
            <template #leading>
              <span :class="[themeClasses.storeInfoBar]" class="flex items-center justify-center w-7 h-7 rounded-[7px] border flex-shrink-0">
                <Icon :icon="fileIcon(file.name)" :class="[themeClasses.storeCardSubtitle]" class="w-4 h-4" />
              </span>
            </template>
            <template #trailing>
              <span :class="[themeClasses.storeCardSubtitle]" class="flex-shrink-0 text-[11px] tabular-nums">{{ formatSize(file.size) }}</span>
            </template>
          </TrayRow>
          <p v-if="remainingCount > 0" :class="[themeClasses.storeCardSubtitle]" class="m-0 px-1.5 pt-1 text-[11px]">{{ $t("And {n} more...", { n: remainingCount }) }}</p>
        </TraySection>
      </TrayPanel>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";

import { useUploadingStore, type UploadLocation } from "../__Stores__/useUploadingStore";

import { useTheme } from "../__Themes__/ThemeSelector";

import { useTrayPanel } from "../__Composables__/useTrayManager";

import TrayPanel from "./TrayPanel.vue";
import TraySection from "./TraySection.vue";
import TrayRow from "./TrayRow.vue";

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

const props = defineProps<{
  location: UploadLocation;
  title: string;
  badgeIcon: any;
  trayId: string;
}>();

const uploadStore = useUploadingStore();
const { themeClasses } = useTheme();
const { isOpen, toggle, close } = useTrayPanel(() => props.trayId);

const indicatorRef = ref<HTMLElement | null>(null);

const MAX_VISIBLE = 5;

const isUploading = computed(() => uploadStore.isUploadingAt(props.location));
const currentlyUploading = computed(() => uploadStore.currentlyUploadingAt(props.location));
const queue = computed(() => uploadStore.queueAt(props.location));
const progress = computed(() => uploadStore.uploadProgressAt(props.location));

const visibleQueue = computed(() => {
  const uploadingCount = currentlyUploading.value.length;
  const maxToShow = Math.max(0, MAX_VISIBLE - uploadingCount);
  return queue.value.slice(0, maxToShow);
});

const remainingCount = computed(() => {
  const uploadingCount = currentlyUploading.value.length;
  const maxToShow = Math.max(0, MAX_VISIBLE - uploadingCount);
  return Math.max(0, queue.value.length - maxToShow);
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
  position: relative;
}

.badge-icon {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  opacity: 0.8;
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
