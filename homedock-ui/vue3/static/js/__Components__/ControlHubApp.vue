<!-- homedock-ui/vue3/static/js/__Components__/ControlHubApp.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div :class="[themeClasses.hubContMainer]" class="relative flex-1 border rounded-2xl p-3 shadow-sm transition-shadow duration-300 hover:shadow-lg">
    <div class="app-header flex items-center space-x-4">
      <BaseImage draggable="false" :src="appIcon" :alt="app.name" :class="[themeClasses.hubIconHolder]" class="app-icon w-12 h-12 rounded-xl drop-shadow-md ring-[1px]" />

      <div class="flex flex-col justify-center overflow-hidden">
        <h3 :class="[themeClasses.hubCardTextAppName]" class="font-semibold text-xs truncate">
          {{ app.display_name || app.name }}
        </h3>
        <h4 :class="[themeClasses.hubCardTextRepo]" class="font-normal text-xs truncate ellipsis">
          {{ app.image }}
        </h4>
      </div>
    </div>

    <hr :class="[themeClasses.hubSeparator]" class="border-0 h-px mt-3 bg-gray-200" />

    <div class="button-container grid grid-cols-2 gap-2 mt-3">
      <!-- Export -->
      <Button :class="[themeClasses.storeLinkHDOSButton]" ref="exportButton" @click="handleExport(app.name)" type="dashed" size="small" block class="flex items-center justify-center !rounded-xl py-1 transition-all duration-300">
        <Icon :icon="exportVariantIcon" class="mr-1 h-3 w-3" />
        <span>Export</span>
      </Button>

      <!-- Import -->
      <Upload :custom-request="handleCustomRequest" v-model:file-list="fileList" accept="yml" :maxCount="1" :showUploadList="false" :headers="uploadHeaders">
        <Button :class="[themeClasses.storeLinkHDOSButton]" type="dashed" size="small" class="w-full flex items-center justify-center !rounded-xl py-1 transition-all duration-300">
          <Icon :icon="linkVariantIcon" class="mr-1 h-3 w-3" />
          <span>Import</span>
        </Button>
      </Upload>

      <!-- Edit -->
      <Button ref="editButton" @click="showEditModal(app.name)" type="primary" size="small" block class="flex items-center justify-center !rounded-xl py-1 transition-all duration-300">
        <Icon :icon="codeBracesIcon" class="mr-1 h-3 w-3" />
        <span>Edit</span>
      </Button>

      <!-- Logs -->
      <Button ref="logsButton" @click="showLogsModal(app.name)" type="primary" size="small" block class="flex items-center justify-center !rounded-xl py-1 transition-all duration-300">
        <Icon :icon="scriptTextIcon" class="mr-1 h-3 w-3" />
        <span>Logs</span>
      </Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";

import { ref } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useWindowStore } from "../__Stores__/windowStore";

import { Button, Upload } from "ant-design-vue";
import { message } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import exportVariantIcon from "@iconify-icons/mdi/export-variant";
import codeBracesIcon from "@iconify-icons/mdi/code-braces";
import scriptTextIcon from "@iconify-icons/mdi/script-text";
import linkVariantIcon from "@iconify-icons/mdi/link-variant";

import BaseImage from "../__Components__/BaseImage.vue";

const props = defineProps({
  app: {
    type: Object,
    required: true,
  },
});

const fallbackIcon = "docker-icons/notfound.jpg";
const appIcon = props.app.image_path || fallbackIcon;
const fileList = ref([]);

const csrfToken = document.querySelector('meta[name="homedock_csrf_token"]')?.getAttribute("content") || "";
const uploadHeaders = { "X-HomeDock-CSRF-Token": csrfToken };

const { themeClasses } = useTheme();
const windowStore = useWindowStore();

const showEditModal = (containerName: string) => {
  windowStore.openWindow("edit", {
    title: `${props.app.display_name || containerName} - Edit Config`,
    data: { appName: containerName },
    allowMultiple: true,
  });
};

const showLogsModal = (containerName: string) => {
  windowStore.openWindow("logs", {
    title: `${props.app.display_name || containerName} - Logs`,
    data: { appName: containerName },
    allowMultiple: true,
  });
};

const handleExport = async (containerName: string) => {
  try {
    const response = await axios.get(`/api/get-compose-info`, {
      headers: {
        "X-HomeDock-CSRF-Token": csrfToken,
      },
      params: {
        containerName,
      },
    });

    if (response.data?.data?.ymlContent && response.data.data.ymlContent.trim() !== "") {
      exportYMLFile(response.data.data.ymlContent, `${containerName}.yml`);
    }
  } catch (error) {
    message.error("Failed to fetch configuration for export.");
  }
};

const exportYMLFile = (data: string, filename: string) => {
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
};

const handleCustomRequest = async ({ file, onSuccess, onError }: any) => {
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
      message.success(`${file.name} uploaded succesfully for ${props.app.display_name || props.app.name} application.`);
    } else {
      throw new Error("Upload failed");
    }
  } catch (error) {
    onError(error);
    message.error(`${file.name} upload failed.`);
  }
};
</script>

<style scoped>
.app-icon {
  transition: all 300ms cubic-bezier(0, 1.7, 1, 1.7);
  cursor: pointer;
}

.app-icon:hover {
  scale: 1.2;
  border-radius: 24px;
}

::v-deep(.ant-upload) {
  width: 100%;
}

textarea {
  outline: 1px solid rgba(129, 129, 129, 0.281);
}

@media (min-width: 1200px) {
  :global(.full-modal .ant-modal) {
    width: 63% !important;
  }
}

@media (max-width: 1199px) and (min-width: 768px) {
  :global(.full-modal .ant-modal) {
    width: 80% !important;
  }
}

@media (max-width: 767px) {
  :global(.full-modal .ant-modal) {
    width: 95% !important;
  }
}
</style>
