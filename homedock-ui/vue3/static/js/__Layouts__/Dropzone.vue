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
          <Card title="DropZone" body="Locally encrypted file vault" :mdi_icon="folderKeyIcon" id="dropZoneUp" :collapsible="false">
            <UploadDragger v-model:fileList="fileList" name="file" :multiple="true" :customRequest="customUpload" @change="handleChange" @success="handleSuccess" :showUploadList="true">
              <div class="flex items-center align-center justify-center flex-col">
                <p class="ant-upload-drag-icon">
                  <Icon :icon="folderKeyIcon" class="text-4xl text-gray-600" />
                </p>
                <p class="ant-upload-text">Click or drag files to this area to upload and encrypt its content</p>
                <p class="ant-upload-hint">Support for a single or bulk upload.</p>
              </div>
            </UploadDragger>

            <div class="mt-4">
              <AutoComplete v-model:value="searchQuery" :options="filteredFiles" :class="[themeClasses.scopeSelector]" class="w-full mb-4" @select="handleSelect">
                <InputSearch v-model:value="searchQuery" placeholder="Search files..." class="w-full text-sm" enter-button="Search">
                  <template #prefix>
                    <Icon :icon="folderKeyIcon" class="mx-1 text-stone-400" />
                  </template>
                </InputSearch>
              </AutoComplete>

              <div>
                <div v-if="displayedFiles.length === 0" class="flex justify-center items-center">
                  <Empty description="No encrypted files found" />
                </div>
                <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
                  <div v-for="file in displayedFiles" :key="file" class="flex flex-col items-center justify-center text-center bg-white border border-gray-300 rounded-lg p-2 shadow-sm hover:shadow-md transition">
                    <Icon :icon="fileIcon(file)" class="text-4xl text-gray-600" />
                    <span class="mt-2 text-sm text-gray-800 break-words w-full overflow-hidden text-ellipsis">{{ file }}</span>
                    <div class="mt-2 flex space-x-2">
                      <Button type="primary" @click="downloadFile(file)" size="small">Download</Button>
                      <Button type="danger" @click="deleteFile(file)" size="small">Delete</Button>
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

import { useTheme } from "../__Themes__/ThemeSelector";

import { message, UploadDragger, AutoComplete, InputSearch, Empty } from "ant-design-vue";

import Favicon from "../__Components__/Favicon.vue";
import AeroPlusWallpaper from "../__Components__/AeroPlusWallpaper.vue";
import ScrollBarThemeLoader from "../__Components__/ScrollBarThemeLoader.vue";
import TopComment from "../__Components__/TopComment.vue";
import NetworkOffline from "../__Components__/NetworkOffline.vue";
import Footer from "../__Components__/Footer.vue";
import NavBar from "../__Components__/NavBar.vue";
import MenuBar from "../__Components__/MenuBar.vue";
import Card from "../__Components__/Card.vue";

import folderKeyIcon from "@iconify-icons/mdi/folder-key";

import { Icon } from "@iconify/vue";
import folderIcon from "@iconify-icons/mdi/folder";
import textFileIcon from "@iconify-icons/mdi/file-document";
import imageFileIcon from "@iconify-icons/mdi/file-image";
import videoFileIcon from "@iconify-icons/mdi/file-video";
import audioFileIcon from "@iconify-icons/mdi/file-music";
import zipFileIcon from "@iconify-icons/mdi/folder-zip";
import unknownFileIcon from "@iconify-icons/mdi/file";

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
const files = ref<string[]>([]);
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

// Opciones de autocompletado
const filteredFiles = computed(() => {
  if (!searchQuery.value) return files.value.map((file) => ({ value: file, label: file }));
  return files.value.filter((file) => file.toLowerCase().includes(searchQuery.value.toLowerCase())).map((file) => ({ value: file, label: file }));
});

// Archivos visibles según la búsqueda
const displayedFiles = computed(() => {
  if (!searchQuery.value) return files.value;
  return files.value.filter((file) => file.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

// Manejador al seleccionar un archivo
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

const handleSuccess = () => {
  fetchFiles();
};

onMounted(() => {
  fetchFiles();
});
</script>
<style scoped></style>
