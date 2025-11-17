<!-- homedock-ui/vue3/static/js/__Apps__/AppEdit.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="app-edit flex flex-col h-full overflow-hidden">
    <div class="flex-1 overflow-hidden p-4 flex flex-col">
      <div class="app-details flex items-center space-x-4 mb-4">
        <BaseImage draggable="false" :src="appIcon" alt="App Icon" class="app-icon w-12 h-12 min-w-12 min-h-12 rounded-xl drop-shadow-md ring-[1px] ring-gray-500/10" />
        <div class="flex flex-col justify-center">
          <p :class="[themeClasses.hubCardTextAppName]" class="app-name font-bold text-sm">{{ displayName }} config</p>
          <p :class="[themeClasses.hubCardTextRepo]" class="app-docker-image text-xs">Docker Compose configuration</p>
        </div>
      </div>

      <hr :class="[themeClasses.hubSeparator]" class="border-0 h-px mb-4" />

      <textarea :class="[themeClasses.hubTextArea]" class="flex-1 rounded-lg w-full font-mono text-xs resize-none p-3" v-model="composeInfo" placeholder="Loading configuration..."></textarea>

      <div class="space-x-2 mt-3 flex">
        <Button @click="saveCompose" type="primary" size="small" class="bg-blue-600 hover:!bg-blue-800 py-1 px-4 flex items-center">
          <Icon :icon="contentSaveIcon" class="mb-0.5 mr-1 h-3 w-3 min-w-3 min-h-3" />
          <span>Save</span>
        </Button>
        <Button @click="handleRecreateConfirm" :disabled="isRecreating" type="primary" size="small" class="bg-indigo-600 hover:!bg-indigo-800 py-1 px-4 flex items-center">
          <Icon :icon="arrowURightBottomBoldIcon" class="mb-0.5 mr-1 h-3 w-3 min-w-3 min-h-3" />
          <span>{{ buttonText }}</span>
        </Button>
      </div>
    </div>

    <StatusBar :icon="codeBracesIcon" message="Edit Config" :info="`Editing ${displayName}`" :showHelp="true">
      <template #help>
        <div class="space-y-2.5 max-w-sm">
          <div class="flex items-center gap-2">
            <Icon :icon="codeBracesIcon" :class="['w-5 h-5', themeClasses.statusBarIcon]" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">Edit Config</h4>
          </div>

          <div :class="['text-[10px] md:text-xs space-y-2 leading-relaxed', themeClasses.statusBarInfo]">
            <p>Modify your application's configuration directly. You can save changes to update the configuration file, or use Save and Recreate to apply changes immediately by stopping and recreating the container with the new settings. All changes are validated before being applied to ensure proper YAML formatting.</p>
          </div>
        </div>
      </template>
    </StatusBar>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";

import { ref, onMounted, computed } from "vue";
import { Button } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import contentSaveIcon from "@iconify-icons/mdi/content-save";
import arrowURightBottomBoldIcon from "@iconify-icons/mdi/arrow-u-right-bottom-bold";
import codeBracesIcon from "@iconify-icons/mdi/code-braces";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useDesktopStore } from "../__Stores__/desktopStore";

import BaseImage from "../__Components__/BaseImage.vue";
import StatusBar from "../__Components__/StatusBar.vue";

import { notifyError, notifySuccess, notifyWarning } from "../__Components__/Notifications.vue";

interface Props {
  appName?: string;
  data?: {
    appName?: string;
  };
}

const props = defineProps<Props>();
const { themeClasses } = useTheme();
const desktopStore = useDesktopStore();

const appName = computed(() => props.appName || props.data?.appName || "Unknown");
const displayName = computed(() => {
  const app = desktopStore.mainDockerApps.find((a) => a.name === appName.value);
  return app?.display_name || appName.value;
});

const composeInfo = ref("");
const isRecreating = ref(false);
const buttonText = ref("Save and Recreate");

const csrfToken = useCsrfToken();
const fallbackIcon = "docker-icons/notfound.jpg";
const appIcon = computed(() => {
  const app = desktopStore.mainDockerApps.find((a) => a.name === appName.value);
  return app?.image_path || fallbackIcon;
});

const fetchComposeInfo = async () => {
  try {
    const response = await axios.get(`/api/get-compose-info`, {
      headers: {
        "X-HomeDock-CSRF-Token": csrfToken.value,
      },
      params: {
        containerName: appName.value,
      },
    });

    if (response.data?.data?.ymlContent && response.data.data.ymlContent.trim() !== "") {
      composeInfo.value = response.data.data.ymlContent;
    } else {
      composeInfo.value = "No content found for this application.";
    }
  } catch (error) {
    composeInfo.value = "Failed to fetch application information.";
  }
};

const saveCompose = async () => {
  try {
    const response = await axios.post("/api/update-yml-config", {
      containerName: appName.value,
      ymlContent: composeInfo.value,
      homedock_csrf_token: csrfToken.value,
    });

    if (response.data.success) {
      notifySuccess("Configuration saved successfully!", undefined, themeClasses.value.scopeSelector);
    } else {
      notifyWarning("Failed to save the configuration. Please check the YML format.", themeClasses.value.scopeSelector);
    }
  } catch (error: any) {
    if (error.response) {
      notifyError(error, themeClasses.value.scopeSelector);
    } else {
      notifyWarning("Unknown error occurred while saving configuration", themeClasses.value.scopeSelector);
    }
  }
};

const handleRecreateConfirm = () => {
  if (buttonText.value === "Click again to confirm") {
    recreateContainer();
  } else {
    buttonText.value = "Click again to confirm";
    setTimeout(() => {
      if (buttonText.value === "Click again to confirm") {
        buttonText.value = "Save and Recreate";
      }
    }, 3000);
  }
};

const recreateContainer = async () => {
  isRecreating.value = true;

  try {
    const updateResponse = await axios.post("/api/update-yml-config", {
      containerName: appName.value,
      ymlContent: composeInfo.value,
      homedock_csrf_token: csrfToken.value,
    });

    if (updateResponse.data.success) {
      buttonText.value = "Recreating...";

      try {
        const recreateResponse = await axios.post("/api/recreate-container", {
          container_name: appName.value,
          yml_content: composeInfo.value,
          homedock_csrf_token: csrfToken.value,
        });

        if (recreateResponse.data.message) {
          notifySuccess("Application recreated successfully!", undefined, themeClasses.value.scopeSelector);
          buttonText.value = "Save and Recreate";
        } else {
          notifyWarning("Failed to recreate the application.", themeClasses.value.scopeSelector);
          buttonText.value = "Save and Recreate";
        }
      } catch (recreateError: any) {
        if (recreateError.response?.status === 400 && recreateError.response?.data?.message) {
          notifyWarning(recreateError.response.data.message, themeClasses.value.scopeSelector, 10);
        } else if (recreateError.response) {
          notifyError(recreateError, themeClasses.value.scopeSelector);
        } else {
          notifyWarning("Failed to recreate the application.", themeClasses.value.scopeSelector);
        }
        buttonText.value = "Save and Recreate";
      }
    } else {
      notifyWarning("Failed to update the configuration file.", themeClasses.value.scopeSelector);
      buttonText.value = "Save and Recreate";
    }
  } catch (error: any) {
    if (error.response) {
      notifyError(error, themeClasses.value.scopeSelector);
    } else {
      notifyWarning("An error occurred. Please check the logs.", themeClasses.value.scopeSelector);
    }
    buttonText.value = "Save and Recreate";
  } finally {
    isRecreating.value = false;
  }
};

onMounted(() => {
  fetchComposeInfo();
});
</script>

<style scoped>
textarea {
  outline: 1px solid rgba(129, 129, 129, 0.281);
}

textarea:focus {
  outline: 2px solid rgba(59, 130, 246, 0.5);
}

:deep(.ant-btn-primary[disabled]) {
  background-color: rgb(79 70 229) !important;
  border-color: transparent !important;
  opacity: 0.6;
}

:deep(.ant-btn-primary[disabled]:hover) {
  background-color: rgb(79 70 229) !important;
}
</style>
