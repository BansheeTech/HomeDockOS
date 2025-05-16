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
                  <strong :class="[themeClasses.dropZoneTotalSizeScope]" class="rounded-full px-4 py-0.5 ml-2">{{ totalSize }} total</strong>
                </p>
              </div>
            </UploadDragger>
            <div class="mt-4">
              <AutoComplete v-model:value="searchQuery" :options="filteredFiles" :popup-class-name="`${themeClasses.scopeSelector} z-0`" class="w-full mb-4" @select="handleSelect">
                <InputSearch v-model:value="searchQuery" placeholder="Search files..." :class="[themeClasses.scopeSelector]" class="w-full text-sm" enter-button="Search">
                  <template #prefix>
                    <Icon :icon="cubeIcon" :class="[themeClasses.dropZoneInputIcon]" class="mx-1" />
                  </template>
                </InputSearch>
              </AutoComplete>
              <div>
                <div v-if="displayedFiles.length === 0" class="flex justify-center items-center">
                  <Empty :class="[themeClasses.dropZoneEmptyText]" description="No encrypted files found" />
                </div>
                <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
                  <div v-for="file in displayedFiles" :key="file.name" :class="[themeClasses.dropZoneFileDisplayer]" class="relative flex flex-col items-center justify-center text-center border border-dashed rounded-lg p-4 shadow-sm hover:shadow-md group transition duration-300">
                    <Icon :icon="fileStates[file.name] ? lockOpenIcon : lockIcon" :class="[themeClasses.dropZoneLockIcon]" class="absolute right-2 top-2 transition duration-300 h-4 w-4 min-h-4 min-w-4" />
                    <Icon v-if="loadingStates[file.name]" :icon="loadingIcon" :class="[themeClasses.dropZoneLockIcon]" class="absolute right-7 top-2 transition duration-300 animate-spin h-4 w-4 min-h-4 min-w-4" />
                    <Icon :icon="fileIcon(file.name)" :class="[themeClasses.dropZoneFileIcon]" class="h-12 w-12 min-h-12 min-w-12 transition duration-300 group-hover:scale-110" />
                    <span :class="[themeClasses.dropZoneFileText]" class="mt-2 text-xs break-words w-full overflow-hidden text-ellipsis">{{ file.name }}</span>
                    <span :class="[themeClasses.dropZoneFileSize]" class="px-2 rounded-full text-[10px] mt-1">{{ formatSize(file.size) }}</span>

                    <div class="absolute -bottom-1 left-0 right-0 px-1">
                      <Progress v-if="downloadProgresses[file.name] !== undefined && downloadProgresses[file.name] < 100" :percent="downloadProgresses[file.name]" :class="[themeClasses.scopeSelector, 'a-download-bottom-progress']" :show-info="false" :size="2" status="active" class="h-1 rounded-full" />
                    </div>

                    <div class="mt-2 flex space-x-2">
                      <Button type="primary" @click="downloadFile(file.name)" size="small"><Icon :icon="arrowDownThickIcon" /></Button>
                      <Button type="dashed" @click="deleteFile(file.name)" size="small" :class="[themeClasses.dropZoneDeleteIcon]"><Icon :icon="closeIcon" class="transition duration-300 group-hover:rotate-90" /></Button>
                    </div>
                  </div>
                </div>
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
import { computed, onMounted, ref } from "vue";

import axios from "axios";

import { FileEntry } from "../__Types__/DropZoneFileEntry";

import { useTheme } from "../__Themes__/ThemeSelector";

import { message, UploadDragger, AutoComplete, InputSearch, Empty, Button, Progress } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import cubeIcon from "@iconify-icons/mdi/cube";
import folderIcon from "@iconify-icons/mdi/folder";

// Begin file icons
import textFileIcon from "@iconify-icons/mdi/file-document";
import imageFileIcon from "@iconify-icons/mdi/file-image";
import videoFileIcon from "@iconify-icons/mdi/file-video";
import audioFileIcon from "@iconify-icons/mdi/file-music";
import zipFileIcon from "@iconify-icons/mdi/folder-zip";
import excelFileIcon from "@iconify-icons/mdi/file-excel";
import powerpointFileIcon from "@iconify-icons/mdi/file-powerpoint";
import wordFileIcon from "@iconify-icons/mdi/file-word";
import codeFileIcon from "@iconify-icons/mdi/file-code";
import unknownFileIcon from "@iconify-icons/mdi/file";
// End file icons

import arrowDownThickIcon from "@iconify-icons/mdi/arrow-down-thick";
import closeIcon from "@iconify-icons/mdi/close";
import shieldLockIcon from "@iconify-icons/mdi/shield-lock";
import lockIcon from "@iconify-icons/mdi/lock";
import lockOpenIcon from "@iconify-icons/mdi/lock-open-alert";
import loadingIcon from "@iconify-icons/mdi/loading";

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

const customUpload = async ({ file, onSuccess, onError, onProgress }: any) => {
  try {
    await uploadFile(file, onProgress);
    fileList.value = fileList.value.filter((f: any) => f.uid !== file.uid);
    onSuccess(null, file);
  } catch (error) {
    onError(error);
  }
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

const totalSize = computed(() => {
  return formatSize(files.value.reduce((acc, file) => acc + file.size, 0));
});

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

onMounted(() => {
  fetchFiles();
});
</script>

<style scoped>
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
</style>
