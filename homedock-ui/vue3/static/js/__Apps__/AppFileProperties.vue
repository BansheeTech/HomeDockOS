<!-- homedock-ui/vue3/static/js/__Apps__/AppFileProperties.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="fileproperties-app flex flex-col h-full overflow-hidden" :class="[themeClasses.scopeSelector]">
    <div class="flex-1 overflow-auto">
      <div v-if="fileData" class="flex flex-col">
        <div class="hero-section" :class="[themeClasses.aeroExtraScope, themeClasses.appPropsHeroBorder]">
          <div class="hero-gradient"></div>
          <div class="relative flex items-center gap-4 px-4 py-3">
            <div class="file-icon-container">
              <Icon :icon="fileIcon" width="48" height="48" :class="[themeClasses.appPropsCardHeaderIcon]" />
            </div>
            <div class="flex-1 flex flex-col justify-center gap-1 min-w-0">
              <h2 class="text-xl font-bold m-0 leading-tight truncate" :class="[themeClasses.notTextUp]">{{ displayName }}</h2>
              <p class="text-sm opacity-70 m-0" :class="[themeClasses.notTextDown]">{{ fileTypeLabel }}</p>
            </div>
          </div>
        </div>

        <div class="flex gap-1.5 px-4 py-1.5" :class="[themeClasses.appPropsTabsContainerBg, themeClasses.appPropsTabsContainerBorder]">
          <button class="flex items-center gap-2 px-4 py-2 border-none text-xs font-semibold cursor-pointer transition-all duration-300 relative rounded-lg shadow-sm hover:shadow-md" :class="[themeClasses.appPropsTabButton, themeClasses.appPropsTabButtonBg, activeTab === 'general' ? themeClasses.appPropsTabButtonActiveBorder : themeClasses.appPropsTabButtonBorder, themeClasses.appPropsTabButtonHover, { [themeClasses.appPropsTabButtonActive]: activeTab === 'general' }]" @click="activeTab = 'general'">
            <Icon :icon="infoIcon" width="15" height="15" />
            <span>General</span>
          </button>
          <button class="flex items-center gap-2 px-4 py-2 border-none text-xs font-semibold cursor-pointer transition-all duration-300 relative rounded-lg shadow-sm hover:shadow-md" :class="[themeClasses.appPropsTabButton, themeClasses.appPropsTabButtonBg, activeTab === 'security' ? themeClasses.appPropsTabButtonActiveBorder : themeClasses.appPropsTabButtonBorder, themeClasses.appPropsTabButtonHover, { [themeClasses.appPropsTabButtonActive]: activeTab === 'security' }]" @click="activeTab = 'security'">
            <Icon :icon="shieldIcon" width="15" height="15" />
            <span>Security</span>
          </button>
        </div>

        <div class="p-4">
          <Transition name="tab-fade" mode="out-in">
            <div v-if="activeTab === 'general'" key="general" class="flex flex-col gap-4">
              <div class="rounded-[10px] px-3.5 py-3 transition-all duration-200" :class="[themeClasses.appPropsUsageCardBg, themeClasses.appPropsUsageCardBorder, themeClasses.appPropsUsageCardBgHover, themeClasses.appPropsUsageCardBorderHover, themeClasses.aeroExtraScope]">
                <div class="flex items-center gap-2 mb-2.5">
                  <Icon :icon="fileDocumentIcon" width="20" height="20" :class="[themeClasses.appPropsCardHeaderIcon]" />
                  <span class="text-[15px] font-semibold m-0" :class="[themeClasses.appPropsCardHeaderText]">File Information</span>
                </div>
                <div class="flex flex-col">
                  <div class="flex justify-between items-start gap-4 py-1.5" :class="[themeClasses.appPropsInfoRowBorder]">
                    <span class="text-xs font-medium flex-shrink-0" :class="[themeClasses.appPropsInfoLabel]">Name</span>
                    <span class="text-xs font-medium text-right break-all" :class="[themeClasses.appPropsInfoValue]">{{ fileData.name }}</span>
                  </div>
                  <div class="flex justify-between items-start gap-4 py-1.5" :class="[themeClasses.appPropsInfoRowBorder]">
                    <span class="text-xs font-medium flex-shrink-0" :class="[themeClasses.appPropsInfoLabel]">Type</span>
                    <span class="text-xs font-medium text-right" :class="[themeClasses.appPropsInfoValue]">{{ fileTypeLabel }}</span>
                  </div>
                  <div class="flex justify-between items-start gap-4 py-1.5" :class="[themeClasses.appPropsInfoRowBorder]">
                    <span class="text-xs font-medium flex-shrink-0" :class="[themeClasses.appPropsInfoLabel]">Location</span>
                    <span class="text-xs font-medium text-right" :class="[themeClasses.appPropsInfoValue]">{{ locationLabel }}</span>
                  </div>
                  <div v-if="filePath" class="flex justify-between items-start gap-4 py-1.5" :class="[themeClasses.appPropsInfoRowBorder]">
                    <span class="text-xs font-medium flex-shrink-0" :class="[themeClasses.appPropsInfoLabel]">Path</span>
                    <span class="text-xs font-medium text-right break-all" :class="[themeClasses.appPropsInfoValue]">{{ filePath || "/" }}</span>
                  </div>
                  <div v-if="containerName" class="flex justify-between items-start gap-4 py-1.5" :class="[themeClasses.appPropsInfoRowBorder]">
                    <span class="text-xs font-medium flex-shrink-0" :class="[themeClasses.appPropsInfoLabel]">Container</span>
                    <span class="text-xs font-medium text-right" :class="[themeClasses.appPropsInfoValue]">{{ containerName }}</span>
                  </div>
                </div>
              </div>

              <div class="rounded-[10px] px-3.5 py-3 transition-all duration-200" :class="[themeClasses.appPropsUsageCardBg, themeClasses.appPropsUsageCardBorder, themeClasses.appPropsUsageCardBgHover, themeClasses.appPropsUsageCardBorderHover, themeClasses.aeroExtraScope]">
                <div class="flex items-center gap-2 mb-2.5">
                  <Icon :icon="chartIcon" width="20" height="20" :class="[themeClasses.appPropsCardHeaderIcon]" />
                  <span class="text-[15px] font-semibold m-0" :class="[themeClasses.appPropsCardHeaderText]">Size & Date</span>
                </div>
                <div class="flex flex-col">
                  <div class="flex justify-between items-start gap-4 py-1.5" :class="[themeClasses.appPropsInfoRowBorder]">
                    <span class="text-xs font-medium flex-shrink-0" :class="[themeClasses.appPropsInfoLabel]">Size</span>
                    <span class="text-xs font-medium text-right" :class="[themeClasses.appPropsInfoValue]">{{ formattedSize }}</span>
                  </div>
                  <div class="flex justify-between items-start gap-4 py-1.5" :class="[themeClasses.appPropsInfoRowBorder]">
                    <span class="text-xs font-medium flex-shrink-0" :class="[themeClasses.appPropsInfoLabel]">Modified</span>
                    <div class="flex flex-col items-end gap-0.5">
                      <span class="text-xs font-medium text-right" :class="[themeClasses.appPropsInfoValue]">{{ formattedDate }}</span>
                      <span class="text-[10px] opacity-60" :class="[themeClasses.appPropsInfoLabel]">{{ relativeTime }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="activeTab === 'security'" key="security" class="flex flex-col gap-4">
              <div class="rounded-[10px] px-3.5 py-3 transition-all duration-200" :class="[themeClasses.appPropsUsageCardBg, themeClasses.appPropsUsageCardBorder, themeClasses.appPropsUsageCardBgHover, themeClasses.appPropsUsageCardBorderHover, themeClasses.aeroExtraScope]">
                <div class="flex items-center gap-2 mb-2.5">
                  <Icon :icon="shieldLockIcon" width="20" height="20" :class="[themeClasses.appPropsCardHeaderIcon]" />
                  <span class="text-[15px] font-semibold m-0" :class="[themeClasses.appPropsCardHeaderText]">Encryption Status</span>
                </div>
                <div class="flex flex-col">
                  <div class="flex items-center gap-3 py-2">
                    <div class="flex items-center justify-center w-10 h-10 rounded-full" :class="isEncrypted ? 'bg-emerald-500/20' : 'bg-gray-500/20'">
                      <Icon :icon="isEncrypted ? lockIcon : lockOpenIcon" width="20" height="20" :class="isEncrypted ? 'text-emerald-500' : 'text-gray-400'" />
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-sm font-semibold" :class="[themeClasses.appPropsInfoValue]">{{ isEncrypted ? "Encrypted" : "Not Encrypted" }}</span>
                      <span class="text-[10px] opacity-60" :class="[themeClasses.appPropsInfoLabel]">{{ isEncrypted ? "This file is stored in the encrypted Drop Zone" : "This file is stored without encryption" }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="isEncrypted" class="rounded-[10px] px-3.5 py-3 transition-all duration-200" :class="[themeClasses.appPropsUsageCardBg, themeClasses.appPropsUsageCardBorder, themeClasses.appPropsUsageCardBgHover, themeClasses.appPropsUsageCardBorderHover, themeClasses.aeroExtraScope]">
                <div class="flex items-center gap-2 mb-2.5">
                  <Icon :icon="keyIcon" width="20" height="20" :class="[themeClasses.appPropsCardHeaderIcon]" />
                  <span class="text-[15px] font-semibold m-0" :class="[themeClasses.appPropsCardHeaderText]">Encryption Details</span>
                </div>
                <div class="flex flex-col">
                  <div class="flex justify-between items-start gap-4 py-1.5" :class="[themeClasses.appPropsInfoRowBorder]">
                    <span class="text-xs font-medium flex-shrink-0" :class="[themeClasses.appPropsInfoLabel]">Algorithm</span>
                    <span class="text-xs font-medium text-right" :class="[themeClasses.appPropsInfoValue]">AES-256-GCM</span>
                  </div>
                  <div class="flex justify-between items-start gap-4 py-1.5" :class="[themeClasses.appPropsInfoRowBorder]">
                    <span class="text-xs font-medium flex-shrink-0" :class="[themeClasses.appPropsInfoLabel]">Key Derivation</span>
                    <span class="text-xs font-medium text-right" :class="[themeClasses.appPropsInfoValue]">PBKDF2</span>
                  </div>
                  <div class="flex justify-between items-start gap-4 py-1.5 border-b-0">
                    <span class="text-xs font-medium flex-shrink-0" :class="[themeClasses.appPropsInfoLabel]">Storage</span>
                    <span class="text-xs font-medium text-right" :class="[themeClasses.appPropsInfoValue]">Drop Zone</span>
                  </div>
                </div>
              </div>

              <div v-if="location === 'appdrive'" class="rounded-[10px] px-3.5 py-3 transition-all duration-200" :class="[themeClasses.appPropsUsageCardBg, themeClasses.appPropsUsageCardBorder, themeClasses.appPropsUsageCardBgHover, themeClasses.appPropsUsageCardBorderHover, themeClasses.aeroExtraScope]">
                <div class="flex items-center gap-2 mb-2.5">
                  <Icon :icon="containerIcon" width="20" height="20" :class="[themeClasses.appPropsCardHeaderIcon]" />
                  <span class="text-[15px] font-semibold m-0" :class="[themeClasses.appPropsCardHeaderText]">Container Access</span>
                </div>
                <div class="flex flex-col">
                  <div class="flex items-center gap-3 py-2">
                    <div class="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/20">
                      <Icon :icon="dockerIcon" width="20" height="20" class="text-blue-400" />
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-sm font-semibold" :class="[themeClasses.appPropsInfoValue]">Container Volume</span>
                      <span class="text-[10px] opacity-60" :class="[themeClasses.appPropsInfoLabel]">This file is mounted from a Docker container</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <div v-else class="flex flex-col items-center justify-center h-full gap-4 px-6 py-12">
        <Icon :icon="alertIcon" width="64" height="64" class="opacity-30" />
        <h3 class="text-xl font-semibold m-0" :class="[themeClasses.notTextUp]">No File Selected</h3>
        <p class="text-sm opacity-60 m-0" :class="[themeClasses.notTextDown]">File data could not be loaded</p>
      </div>
    </div>

    <StatusBar v-if="fileData" :icon="infoIcon" message="File Properties" :info="truncatedDisplayName" :showHelp="true">
      <template #help>
        <div class="space-y-2.5 max-w-sm">
          <div class="flex items-center gap-2">
            <Icon :icon="infoIcon" :class="['w-5 h-5', themeClasses.statusBarIcon]" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">File Properties</h4>
          </div>

          <div :class="['text-[10px] md:text-xs space-y-2 leading-relaxed', themeClasses.statusBarInfo]">
            <p>View detailed information about your file or folder including name, type, size, location, and modification date. The Security tab shows encryption status. Files stored in the Drop Zone are protected with AES-256-GCM encryption.</p>
          </div>
        </div>
      </template>
    </StatusBar>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import { Icon } from "@iconify/vue";

import infoIcon from "@iconify-icons/mdi/information-outline";
import shieldIcon from "@iconify-icons/mdi/shield-outline";
import shieldLockIcon from "@iconify-icons/mdi/shield-lock";
import lockIcon from "@iconify-icons/mdi/lock";
import lockOpenIcon from "@iconify-icons/mdi/lock-open-alert";
import keyIcon from "@iconify-icons/mdi/key-outline";
import alertIcon from "@iconify-icons/mdi/alert-circle-outline";
import fileDocumentIcon from "@iconify-icons/mdi/file-document";
import chartIcon from "@iconify-icons/mdi/chart-box-outline";
import containerIcon from "@iconify-icons/mdi/package-variant-closed";
import dockerIcon from "@iconify-icons/mdi/docker";
import folderIcon from "@iconify-icons/mdi/folder";
import defaultFileIcon from "@iconify-icons/mdi/file";
import imageIcon from "@iconify-icons/mdi/file-image";
import videoIcon from "@iconify-icons/mdi/file-video";
import musicIcon from "@iconify-icons/mdi/file-music";
import pdfIcon from "@iconify-icons/mdi/file-pdf-box";
import codeIcon from "@iconify-icons/mdi/file-code";
import zipIcon from "@iconify-icons/mdi/zip-box";
import textIcon from "@iconify-icons/mdi/file-document";

import StatusBar from "../__Components__/StatusBar.vue";

interface FileData {
  name: string;
  display_name?: string;
  size: number;
  modified: number;
  is_directory: boolean;
}

interface Props {
  file?: FileData;
  location?: string;
  path?: string;
  container?: string;
}

const props = defineProps<Props>();

const { themeClasses } = useTheme();

const activeTab = ref("general");

const fileData = computed(() => props.file || null);
const location = computed(() => props.location || "storage");
const filePath = computed(() => props.path || "");
const containerName = computed(() => props.container || "");

const displayName = computed(() => {
  if (!fileData.value) return "";
  return fileData.value.display_name || fileData.value.name;
});

const truncatedDisplayName = computed(() => {
  const name = displayName.value;
  if (name.length <= 28) return name;
  return name.substring(0, 25) + "...";
});

const isEncrypted = computed(() => location.value === "dropzone");

const fileExtension = computed(() => {
  if (!fileData.value || fileData.value.is_directory) return "";
  const parts = fileData.value.name.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() || "" : "";
});

const fileTypeLabel = computed(() => {
  if (!fileData.value) return "";
  if (fileData.value.is_directory) return "Folder";

  const ext = fileExtension.value;
  const typeMap: Record<string, string> = {
    pdf: "PDF Document",
    doc: "Word Document",
    docx: "Word Document",
    xls: "Excel Spreadsheet",
    xlsx: "Excel Spreadsheet",
    ppt: "PowerPoint Presentation",
    pptx: "PowerPoint Presentation",
    txt: "Text File",
    md: "Markdown File",
    json: "JSON File",
    xml: "XML File",
    html: "HTML File",
    css: "CSS File",
    js: "JavaScript File",
    ts: "TypeScript File",
    vue: "Vue Component",
    py: "Python File",
    go: "Go File",
    rs: "Rust File",
    java: "Java File",
    c: "C File",
    cpp: "C++ File",
    h: "Header File",
    jpg: "JPEG Image",
    jpeg: "JPEG Image",
    png: "PNG Image",
    gif: "GIF Image",
    webp: "WebP Image",
    svg: "SVG Image",
    ico: "Icon File",
    bmp: "Bitmap Image",
    mp4: "MP4 Video",
    webm: "WebM Video",
    mov: "QuickTime Video",
    avi: "AVI Video",
    mkv: "MKV Video",
    mp3: "MP3 Audio",
    wav: "WAV Audio",
    flac: "FLAC Audio",
    ogg: "OGG Audio",
    m4a: "M4A Audio",
    zip: "ZIP Archive",
    rar: "RAR Archive",
    "7z": "7-Zip Archive",
    tar: "TAR Archive",
    gz: "GZip Archive",
    log: "Log File",
    cfg: "Config File",
    ini: "INI File",
    env: "Environment File",
    yml: "YAML File",
    yaml: "YAML File",
    sql: "SQL File",
    db: "Database File",
    sqlite: "SQLite Database",
  };

  return typeMap[ext] || `${ext.toUpperCase()} File`;
});

const fileIcon = computed(() => {
  if (!fileData.value) return defaultFileIcon;
  if (fileData.value.is_directory) return folderIcon;

  const ext = fileExtension.value;
  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg", "ico", "bmp"];
  const videoExts = ["mp4", "webm", "mov", "avi", "mkv"];
  const audioExts = ["mp3", "wav", "flac", "ogg", "m4a"];
  const codeExts = ["js", "ts", "vue", "py", "go", "rs", "java", "c", "cpp", "h", "html", "css", "json", "xml"];
  const archiveExts = ["zip", "rar", "7z", "tar", "gz"];

  if (ext === "pdf") return pdfIcon;
  if (imageExts.includes(ext)) return imageIcon;
  if (videoExts.includes(ext)) return videoIcon;
  if (audioExts.includes(ext)) return musicIcon;
  if (codeExts.includes(ext)) return codeIcon;
  if (archiveExts.includes(ext)) return zipIcon;
  if (["txt", "md", "log", "doc", "docx"].includes(ext)) return textIcon;

  return defaultFileIcon;
});

const locationLabel = computed(() => {
  const labels: Record<string, string> = {
    storage: "Storage",
    dropzone: "Drop Zone (Encrypted)",
    appdrive: "App Drive",
    favorites: "Favorites",
    recents: "Recents",
    systemapps: "System Apps",
    utilities: "Utilities",
  };
  return labels[location.value] || location.value;
});

const formattedSize = computed(() => {
  if (!fileData.value) return "0 B";
  const bytes = fileData.value.size;
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
});

const formattedDate = computed(() => {
  if (!fileData.value?.modified) return "Unknown";

  const timestamp = fileData.value.modified * 1000;
  const date = new Date(timestamp);

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
});

const relativeTime = computed(() => {
  if (!fileData.value?.modified) return "";

  const now = Date.now();
  const modified = fileData.value.modified * 1000;
  const diff = now - modified;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days !== 1 ? "s" : ""} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? "s" : ""} ago`;

  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? "s" : ""} ago`;
});
</script>

<style scoped>
/* Hero Section */
.hero-section {
  position: relative;
  overflow: hidden;
}

.hero-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

/* File Icon Container */
.file-icon-container {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

/* Tab transition animations - Cross-Fade */
.tab-fade-enter-active {
  transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-fade-leave-active {
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.6, 1);
}

.tab-fade-enter-from,
.tab-fade-leave-to {
  opacity: 0;
}
</style>
