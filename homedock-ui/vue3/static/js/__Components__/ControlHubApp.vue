<!-- src/static/js/__Components__/ControlHubApp.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template>
  <div :class="[themeClasses.hubContMainer]" class="relative flex-1 border rounded-2xl p-3 shadow-sm transition-shadow duration-300 hover:shadow-lg">
    <div class="app-header flex items-center space-x-4">
      <BaseImage draggable="false" :src="appIcon" alt="App Icon" class="app-icon w-12 h-12 rounded-xl drop-shadow-md ring-[1px] ring-gray-500/10" />

      <div class="flex flex-col justify-center overflow-hidden">
        <h3 :class="[themeClasses.hubCardTextAppName]" class="font-semibold text-xs truncate">
          {{ app.name }}
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
    <Modal :class="[themeClasses.scopeSelector]" :maskClosable="!isRecreating" :keyboard="!isRecreating" :closable="!isRecreating" v-model:open="editModalOpen" class="rounded-3xl overflow-hidden" :destroyOnClose="true" :footer="null" :centered="true" wrap-class-name="full-modal">
      <div class="app-details flex items-center space-x-4">
        <BaseImage draggable="false" :src="appIcon" alt="App Icon" class="app-icon w-12 h-12 rounded-xl drop-shadow-md ring-[1px] ring-gray-500/10" />
        <div class="flex flex-col justify-center">
          <p :class="[themeClasses.hubCardTextAppName]" class="app-name font-bold text-xs">{{ app.name }} config</p>
          <p :class="[themeClasses.hubCardTextRepo]" class="app-docker-image text-xs">{{ app.image }}</p>
        </div>
      </div>
      <hr :class="[themeClasses.hubSeparator]" class="border-0 h-px mt-4" />
      <textarea :class="[themeClasses.hubTextArea]" class="mt-4 rounded-lg w-full font-mono h-96 resize-none" v-model="composeInfo"></textarea>
      <div class="space-x-2 mt-2 flex">
        <Button @click="saveCompose" type="primary" class="bg-blue-600 hover:!bg-blue-800 py-1 px-4 flex items-center"> <Icon :icon="contentSaveIcon" class="mb-0.5 mr-1 h-3 w-3 min-w-3 min-h-3" /><span>Save</span></Button>
        <Button @click="handleRecreateConfirm" :loading="isRecreating" type="primary" class="bg-indigo-600 hover:!bg-indigo-800 py-1 px-4 flex items-center">
          <Icon :icon="arrowURightBottomBoldIcon" class="mb-0.5 mr-1 h-3 w-3 min-w-3 min-h-3" />
          <span>{{ buttonText }}</span>
        </Button>
      </div>
    </Modal>

    <Modal :class="[themeClasses.scopeSelector]" v-model:open="logsModalOpen" class="rounded-3xl overflow-hidden" :destroyOnClose="true" :footer="null" :centered="true" wrap-class-name="full-modal">
      <div class="app-details flex items-center space-x-4">
        <BaseImage draggable="false" :src="appIcon" alt="App Icon" class="app-icon w-12 h-12 rounded-xl drop-shadow-md ring-[1px] ring-gray-500/10" />
        <div class="flex flex-col justify-center">
          <p :class="[themeClasses.hubCardTextAppName]" class="app-name font-bold text-xs">{{ app.name }} logs</p>
          <p :class="[themeClasses.hubCardTextRepo]" class="app-docker-image text-xs">{{ app.image }}</p>
        </div>
      </div>
      <hr :class="[themeClasses.hubSeparator]" class="border-0 h-px mt-4" />
      <textarea :class="[themeClasses.hubTextArea]" class="mt-4 rounded-lg w-full font-mono h-96 resize-none" v-model="containerLogs" readonly></textarea>
      <Switch v-model:checked="autoRefresh" @change="handleAutoRefresh" class="mt-2">
        <template #checkedChildren>
          <span class="flex items-center"><Icon :icon="spinIcon" class="mr-1 animate-spin" /> <span class="text-transparent">.</span></span>
        </template>
        <template #unCheckedChildren>
          <span class="flex items-center">Refresh</span>
        </template>
      </Switch>
    </Modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import axios from "axios";

import { Button, Modal, Upload, Switch, theme } from "ant-design-vue";
import { message } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import exportVariantIcon from "@iconify-icons/mdi/export-variant";
import codeBracesIcon from "@iconify-icons/mdi/code-braces";
import scriptTextIcon from "@iconify-icons/mdi/script-text";
import linkVariantIcon from "@iconify-icons/mdi/link-variant";
import contentSaveIcon from "@iconify-icons/mdi/content-save";
import arrowURightBottomBoldIcon from "@iconify-icons/mdi/arrow-u-right-bottom-bold";
import spinIcon from "@iconify-icons/mdi/loading";

import BaseImage from "../__Components__/BaseImage.vue";

type CheckedType = boolean | string | number;

const props = defineProps({
  app: {
    type: Object,
    required: true,
  },
});

const fallbackIcon = "docker-icons/notfound.jpg";
const editModalOpen = ref(false);
const logsModalOpen = ref(false);
const composeInfo = ref("");
const containerLogs = ref("");
const appIcon = props.app.name ? `docker-icons/${props.app.name}.jpg` : fallbackIcon;
const fileList = ref([]);
const isRecreating = ref(false);
const buttonText = ref("Save and Recreate");
const autoRefresh = ref(false);
const refreshInterval = ref() || 3000;

const csrfToken = document.querySelector('meta[name="homedock_csrf_token"]')?.getAttribute("content") || "";
const uploadHeaders = { "X-HomeDock-CSRF-Token": csrfToken };

const { themeClasses } = useTheme();

const showEditModal = async (containerName: string) => {
  await fetchComposeInfo(containerName);
  editModalOpen.value = true;
};

const showLogsModal = async (containerName: string) => {
  await fetchContainerLogs(containerName);
  logsModalOpen.value = true;
};

const handleAutoRefresh = (checked: CheckedType, e: Event) => {
  const isChecked = typeof checked === "boolean" ? checked : checked === "true";

  if (isChecked) {
    refreshInterval.value = setInterval(() => {
      fetchContainerLogs(props.app.name);
    }, 3000);
  } else {
    clearInterval(refreshInterval.value);
    refreshInterval.value = null;
  }
};

const fetchComposeInfo = async (containerName: string) => {
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
      composeInfo.value = response.data.data.ymlContent;
    } else {
      composeInfo.value = "No content found for this application.";
    }
  } catch (error) {
    console.error("Error fetching application info:", error);
    composeInfo.value = "Failed to fetch application information.";
  }
};

const saveCompose = async () => {
  try {
    const response = await axios.post("/api/update-yml-config", {
      containerName: props.app.name,
      ymlContent: composeInfo.value,
      homedock_csrf_token: csrfToken,
    });

    console.log(response);

    if (response.data.success) {
      message.success("Configuration saved successfully!");
    } else {
      message.error("Failed to save the configuration. Please check the YML format.");
    }
  } catch (error) {
    console.error("Error saving compose:", error);
    const errorMessage = (error as any).response?.data?.message || "Unknown error";
    message.error(`Error: ${errorMessage}`);
  }
};

const handleRecreateConfirm = () => {
  if (buttonText.value === "Click again to confirm") {
    recreateContainer();
  } else {
    buttonText.value = "Click again to confirm";
  }
};

const recreateContainer = async () => {
  console.log("Starting container recreation...");
  isRecreating.value = true;

  try {
    const updateResponse = await axios.post("/api/update-yml-config", {
      containerName: props.app.name,
      ymlContent: composeInfo.value,
      homedock_csrf_token: csrfToken,
    });

    console.log("Update YML Response:", updateResponse);

    if (updateResponse.data.success) {
      buttonText.value = "Recreating...";
      const recreateResponse = await axios.post("/api/recreate-container", {
        container_name: props.app.name,
        yml_content: composeInfo.value,
        homedock_csrf_token: csrfToken,
      });

      console.log("Recreate Response:", recreateResponse);

      if (recreateResponse.data.message) {
        message.success("Application recreated successfully!");
        buttonText.value = "Save and Recreate";
      } else {
        message.error("Failed to recreate the application.");
      }
    } else {
      message.error("Failed to update the configuration file.");
    }
  } catch (error) {
    console.error("Error during application recreation:", error);
    message.error("An error occurred. Please check the logs.");
  } finally {
    isRecreating.value = false;
  }
};

const handleExport = async (containerName: string) => {
  try {
    await fetchComposeInfo(containerName);

    if (composeInfo.value.trim() !== "") {
      exportYMLFile(composeInfo.value, `${containerName}.yml`);
    } else {
      console.error("No compose configuration available to export.");
    }
  } catch (error) {
    console.error("Error exporting compose configuration:", error);
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

const fetchContainerLogs = async (containerName: string) => {
  try {
    const response = await axios.get(`/api/view-container-logs`, {
      headers: {
        "X-HomeDock-CSRF-Token": csrfToken,
      },
      params: {
        containerName,
      },
    });

    if (response.data?.logs && response.data.logs.trim() !== "") {
      containerLogs.value = response.data.logs;
    } else {
      containerLogs.value = "No logs found for this application.";
    }
  } catch (error) {
    console.error("Error fetching application logs:", error);
    containerLogs.value = "Failed to fetch logs for this application.";
  }
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
      message.success(`${file.name} uploaded succesfully for ${props.app.name} application.`);
    } else {
      throw new Error("Upload failed");
    }
  } catch (error) {
    console.error("Upload error:", error);
    onError(error);
    message.error(`${file.name} upload failed.`);
  }
};

watch(logsModalOpen, (isOpen) => {
  if (!isOpen && refreshInterval.value) {
    clearInterval(refreshInterval.value);
    refreshInterval.value = null;
    autoRefresh.value = false;
  }
});
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

:global(.full-modal .ant-modal) {
  margin-top: 15px !important;
  margin-bottom: 15px !important;
  backdrop-filter: blur(100px) saturate(200%) !important;
  -webkit-backdrop-filter: blur(100px) saturate(200%) !important;
}

:global(.full-modal .ant-modal-content) {
  display: flex;
  flex-direction: column;
}

:global(.full-modal .ant-modal-body) {
  flex: 1;
}

:global(.ant-modal) {
  width: 100% !important;
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

:global(.dark-mode-theme .ant-modal-content) {
  background-color: rgb(39, 39, 42) !important;
}

:global(.aero-mode-theme .ant-modal-content) {
  background-color: rgba(0, 0, 0, 0) !important;
}

:global(.white-mode-theme .ant-modal-close) {
  color: #747474 !important;
  background-color: transparent !important;
}

:global(.dark-mode-theme .ant-modal-close) {
  color: #626262 !important;
  background-color: transparent !important;
}

:global(.aero-mode-theme .ant-modal-close) {
  color: #b5b5b5 !important;
  background-color: transparent !important;
}
</style>
