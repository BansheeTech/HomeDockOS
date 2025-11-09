<!-- homedock-ui/vue3/static/js/__Components__/AppListItem.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div :class="[themeClasses.windowBorder]" class="app-list-item group flex items-center gap-4 p-4 border rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200">
    <!-- App Icon -->
    <div class="flex-shrink-0">
      <BaseImage draggable="false" :src="appIcon" :alt="app.display_name || app.name" :class="[themeClasses.hubIconHolder]" class="w-12 h-12 rounded-lg shadow-md ring-1 transition-transform duration-300 group-hover:scale-110" />
    </div>

    <!-- App Info -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-1">
        <h3 :class="[themeClasses.windowTitleTextFocused]" class="text-sm font-semibold truncate">
          {{ app.display_name || app.name }}
        </h3>
      </div>
      <p :class="[themeClasses.windowPlaceholderText]" class="text-xs truncate">
        {{ app.image }}
      </p>
    </div>

    <!-- Actions Menu -->
    <div class="flex-shrink-0 ml-auto">
      <Dropdown :trigger="['click']" placement="bottomRight">
        <button :class="[themeClasses.windowBorder, themeClasses.windowPlaceholderText]" class="p-2 rounded-lg border bg-white/5 hover:bg-white/10 transition-all duration-200 flex items-center justify-center" title="Actions">
          <Icon :icon="dotsVerticalIcon" class="w-5 h-5" />
        </button>
        <template #overlay>
          <div :class="[themeClasses.contextMenuBg, themeClasses.contextMenuBorder, themeClasses.contextMenuShadow]" class="min-w-[200px] rounded-lg p-1">
            <!-- Edit -->
            <div @click="handleEdit" :class="[themeClasses.contextMenuItem, themeClasses.contextMenuItemBgHover, themeClasses.contextMenuItemTextHover]" class="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all duration-150 text-sm">
              <Icon :icon="editIcon" :class="[themeClasses.contextMenuIcon]" class="w-4 h-4 flex-shrink-0" />
              <span>Edit Config</span>
            </div>

            <!-- Logs -->
            <div @click="handleLogs" :class="[themeClasses.contextMenuItem, themeClasses.contextMenuItemBgHover, themeClasses.contextMenuItemTextHover]" class="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all duration-150 text-sm">
              <Icon :icon="logsIcon" :class="[themeClasses.contextMenuIcon]" class="w-4 h-4 flex-shrink-0" />
              <span>View Logs</span>
            </div>

            <!-- Divider -->
            <div class="my-1">
              <div :class="[themeClasses.contextMenuDivider]" class="h-px mx-2"></div>
            </div>

            <!-- Export -->
            <div @click="handleExport" :class="[themeClasses.contextMenuItem, themeClasses.contextMenuItemBgHover, themeClasses.contextMenuItemTextHover]" class="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all duration-150 text-sm">
              <Icon :icon="exportIcon" :class="[themeClasses.contextMenuIcon]" class="w-4 h-4 flex-shrink-0" />
              <span>Export Config</span>
            </div>

            <!-- Import -->
            <Upload :custom-request="handleCustomRequest" v-model:file-list="fileList" accept="yml" :maxCount="1" :showUploadList="false" :headers="uploadHeaders" class="block w-full">
              <div :class="[themeClasses.contextMenuItem, themeClasses.contextMenuItemBgHover, themeClasses.contextMenuItemTextHover]" class="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all duration-150 text-sm w-full">
                <Icon :icon="importIcon" :class="[themeClasses.contextMenuIcon]" class="w-4 h-4 flex-shrink-0" />
                <span>Import Config</span>
              </div>
            </Upload>
          </div>
        </template>
      </Dropdown>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import axios from "axios";
import { Icon } from "@iconify/vue";
import { Dropdown, Upload, message } from "ant-design-vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useWindowStore } from "../__Stores__/windowStore";
import BaseImage from "./BaseImage.vue";

import dotsVerticalIcon from "@iconify-icons/mdi/dots-vertical";
import exportIcon from "@iconify-icons/mdi/export-variant";
import importIcon from "@iconify-icons/mdi/import";
import editIcon from "@iconify-icons/mdi/pencil";
import logsIcon from "@iconify-icons/mdi/text-box-outline";

interface App {
  name: string;
  display_name?: string;
  image: string;
  image_path?: string;
  status: string;
  hasUpdate?: boolean;
  ports?: any[];
}

const props = defineProps<{
  app: App;
}>();

const { themeClasses } = useTheme();
const windowStore = useWindowStore();

const fileList = ref([]);
const fallbackIcon = "docker-icons/notfound.jpg";
const appIcon = props.app.image_path || fallbackIcon;

const csrfToken = document.querySelector('meta[name="homedock_csrf_token"]')?.getAttribute("content") || "";
const uploadHeaders = { "X-HomeDock-CSRF-Token": csrfToken };

function handleEdit() {
  windowStore.openWindow("edit", {
    title: `${props.app.display_name || props.app.name} - Edit Config`,
    data: { appName: props.app.name },
    allowMultiple: true,
  });
}

function handleLogs() {
  windowStore.openWindow("logs", {
    title: `${props.app.display_name || props.app.name} - Logs`,
    data: { appName: props.app.name },
    allowMultiple: true,
  });
}

async function handleExport() {
  try {
    const response = await axios.get(`/api/get-compose-info`, {
      headers: {
        "X-HomeDock-CSRF-Token": csrfToken,
      },
      params: {
        containerName: props.app.name,
      },
    });

    if (response.data?.data?.ymlContent && response.data.data.ymlContent.trim() !== "") {
      exportYMLFile(response.data.data.ymlContent, `${props.app.name}.yml`);
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

async function handleCustomRequest({ file, onSuccess, onError }: any) {
  const formData = new FormData();
  formData.append("compose_file", file);
  formData.append("container_name", props.app.name);
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
</script>

<style scoped>
::v-deep(.ant-upload) {
  display: block !important;
  width: 100% !important;
}

::v-deep(.ant-upload-select) {
  display: block !important;
  width: 100% !important;
}
</style>
