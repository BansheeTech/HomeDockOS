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
            <UploadDragger v-model:fileList="fileList" name="file" :multiple="true" :customRequest="customUpload" @change="handleChange" @success="handleSuccess" :showUploadList="true">
              <div class="flex items-center align-center justify-center flex-col">
                <p class="ant-upload-drag-icon">
                  <AnimatedIcon :icons="[cubeIcon, shieldLockIcon]" :iconSize="64" :interval="2000" class="text-4xl text-gray-600" />
                </p>
                <p class="ant-upload-text px-4">Click or drag files to this area to upload and encrypt its content</p>
                <p class="ant-upload-hint px-4">Maximum file size allowed per file is 1GB</p>
              </div>
            </UploadDragger>

            <div class="mt-4">
              <AutoComplete v-model:value="searchQuery" :options="filteredFiles" :class="[themeClasses.scopeSelector]" class="w-full mb-4" @select="handleSelect">
                <InputSearch v-model:value="searchQuery" placeholder="Search files..." class="w-full text-sm" enter-button="Search">
                  <template #prefix>
                    <Icon :icon="cubeIcon" class="mx-1 text-stone-400" />
                  </template>
                </InputSearch>
              </AutoComplete>
              <div>
                <div v-if="displayedFiles.length === 0" class="flex justify-center items-center">
                  <Empty description="No encrypted files found" />
                </div>
                <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
                  <div v-for="file in displayedFiles" :key="file.name" class="relative flex flex-col items-center justify-center text-center bg-white border !border-[#d9d9d9] rounded-lg p-4 shadow-sm hover:shadow-md transition">
                    <Icon :icon="fileIcon(file.name)" class="h-12 w-12 min-h-12 min-w-12 text-gray-600" />
                    <span class="mt-2 text-xs text-gray-800 break-words w-full overflow-hidden text-ellipsis">{{ file.name }}</span>
                    <span class="bg-gray-200 px-2 rounded-full text-[10px] text-gray-500 mt-1">{{ formatSize(file.size) }}</span>
                    <div class="mt-2 flex space-x-2">
                      <Button type="primary" @click="downloadFile(file.name)" size="small"><Icon :icon="arrowDownThickIcon" /></Button>
                      <Button type="dashed" @click="deleteFile(file.name)" size="small" class="hover:!text-red-500 hover:!border-red-500"><Icon :icon="closeIcon" /></Button>
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

import { FileEntry } from "../__Types__/DropZoneFileEntry";

import axios from "axios";

import { useTheme } from "../__Themes__/ThemeSelector";

import { message, UploadDragger, AutoComplete, InputSearch, Empty, Button } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import cubeIcon from "@iconify-icons/mdi/cube";
import folderIcon from "@iconify-icons/mdi/folder";
import textFileIcon from "@iconify-icons/mdi/file-document";
import imageFileIcon from "@iconify-icons/mdi/file-image";
import videoFileIcon from "@iconify-icons/mdi/file-video";
import audioFileIcon from "@iconify-icons/mdi/file-music";
import zipFileIcon from "@iconify-icons/mdi/folder-zip";
import unknownFileIcon from "@iconify-icons/mdi/file";
import arrowDownThickIcon from "@iconify-icons/mdi/arrow-down-thick";
import closeIcon from "@iconify-icons/mdi/close";
import shieldLockIcon from "@iconify-icons/mdi/shield-lock";

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
    return folderIcon; // Carpeta
  }
  const extension = fileName.split(".").pop()?.toLowerCase();
  return fileIconsMap[extension || "unknown"] || unknownFileIcon;
};

const fileIconsMap: Record<string, any> = {
  folder: folderIcon,
  txt: textFileIcon,
  md: textFileIcon,
  doc: textFileIcon,
  docx: textFileIcon,
  pdf: textFileIcon,
  png: imageFileIcon,
  jpg: imageFileIcon,
  jpeg: imageFileIcon,
  gif: imageFileIcon,
  mp4: videoFileIcon,
  mkv: videoFileIcon,
  mp3: audioFileIcon,
  wav: audioFileIcon,
  zip: zipFileIcon,
  rar: zipFileIcon,
};

const csrfToken = ref<string>(document.querySelector('meta[name="homedock_csrf_token"]')?.getAttribute("content") || "");

const { themeClasses } = useTheme();

const activePath = ref("/dropzone");

const files = ref<FileEntry[]>([]);
const searchQuery = ref<string>("");
const fileList = ref([]);

const customUpload = async (options: any) => {
  const { file, onSuccess, onError } = options;
  try {
    await uploadFile(file);
    fileList.value = fileList.value.filter((f: any) => f.uid !== file.uid);
    onSuccess(null, file);
    console.log("Custom upload successful:", file);
    fetchFiles();
  } catch (error) {
    onError(error);
    console.error("Custom upload error:", error);
  }
};

const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const response = await axios.post("/api/upload_file", formData, {
      headers: {
        "X-HomeDock-CSRF-Token": csrfToken.value,
      },
    });
    if (response.data.success) {
      console.log("File uploaded successfully:", response.data);
      fetchFiles();
    } else {
      console.error("Error during file upload:", response.data.error);
    }
  } catch (error) {
    console.error("Upload error:", error);
  }
};

const downloadFile = async (fileName: string) => {
  try {
    const response = await axios.get(`/api/download_file?file=${encodeURIComponent(fileName)}`, {
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error downloading file:", error);
    message.error("Failed to download file. Please try again.");
  }
};

const deleteFile = async (fileName: string) => {
  try {
    const response = await axios.post("/api/delete_file", { file: fileName }, { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });

    if (response.data.success) {
      message.success(response.data.message);
      fetchFiles(); // Actualizar la lista de archivos
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
  console.log("Upload Change:", info);
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

onMounted(() => {
  fetchFiles();
});
</script>
<style scoped></style>
