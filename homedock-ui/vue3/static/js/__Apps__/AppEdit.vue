<!-- homedock-ui/vue3/static/js/__Apps__/AppEdit.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="app-edit flex flex-col h-full overflow-hidden" style="container-type: inline-size; container-name: window">
    <div :class="[themeClasses.fileExplorerToolbar]" class="edit-toolbar flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 border-b flex-shrink-0">
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <div class="relative flex-shrink-0">
          <AppIconGraphic :image-src="app?.image_path" :size="32" />
          <span :class="[isRunning ? 'bg-green-500' : 'bg-gray-400']" class="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-1 ring-black/20"></span>
        </div>

        <div class="flex flex-col min-w-0 flex-1">
          <span :class="[themeClasses.windowText]" class="text-sm font-semibold leading-tight truncate">{{ displayName }}</span>
          <span :class="[themeClasses.fileExplorerSidebarSectionTitle]" class="text-[11px] leading-tight truncate">{{ $t("Docker Compose configuration") }}</span>
        </div>
      </div>

      <div class="edit-actions flex items-center gap-2 flex-shrink-0">
        <button @click="revertChanges" :disabled="!isDirty || isBusy" :class="[themeClasses.dropZoneSortButton]" class="edit-action edit-action-square h-7 w-7 rounded transition-colors flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:pointer-events-none cursor-pointer disabled:cursor-default" :title="$t('Revert')">
          <Icon :icon="undoIcon" class="w-4 h-4" />
        </button>

        <button @click="saveCompose" :disabled="!isDirty || isBusy" :class="[themeClasses.dropZoneSortButton]" class="edit-action h-7 px-2.5 rounded transition-colors flex items-center justify-center gap-1.5 text-xs disabled:opacity-40 disabled:pointer-events-none cursor-pointer disabled:cursor-default" :title="$t('Save')">
          <Icon :icon="isSaving ? loadingIcon : contentSaveIcon" :class="{ 'animate-spin': isSaving }" class="w-4 h-4 flex-shrink-0" />
          <span class="truncate">{{ $t("Save") }}</span>
        </button>

        <button @click="handleRecreateConfirm" :disabled="state !== 'ready' || isBusy" :class="[isConfirmingRecreate ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700']" class="edit-action edit-action-primary h-7 px-3 rounded text-xs font-medium text-white border-0 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer disabled:cursor-default" :title="$t(recreateLabel)">
          <Icon :icon="isRecreating ? loadingIcon : arrowURightBottomBoldIcon" :class="{ 'animate-spin': isRecreating }" class="w-3.5 h-3.5 flex-shrink-0" />
          <span class="truncate">{{ $t(recreateLabel) }}</span>
        </button>
      </div>
    </div>

    <div class="relative flex-1 min-h-0 flex overflow-hidden">
      <div v-if="state !== 'ready'" class="flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center">
        <template v-if="state === 'loading'">
          <Icon :icon="loadingIcon" :class="[themeClasses.fileExplorerSidebarSectionTitle]" class="w-6 h-6 animate-spin" />
          <p :class="[themeClasses.fileExplorerSidebarSectionTitle]" class="m-0 text-xs">{{ $t("Loading configuration...") }}</p>
        </template>
        <template v-else>
          <Icon :icon="state === 'error' ? alertIcon : fileHiddenIcon" :class="[themeClasses.fileExplorerSidebarSectionTitle]" class="w-8 h-8 opacity-50" />
          <p :class="[themeClasses.windowText]" class="m-0 text-sm opacity-80">{{ state === "error" ? $t("Failed to fetch application information.") : $t("No content found for this application.") }}</p>
          <button @click="fetchComposeInfo" :class="[themeClasses.dropZoneSortButton]" class="mt-1 h-7 px-3 rounded transition-colors flex items-center gap-1.5 text-xs cursor-pointer">
            <Icon :icon="refreshIcon" class="w-4 h-4" />
            <span>{{ $t("Refresh") }}</span>
          </button>
        </template>
      </div>

      <ComposeEditor v-else v-model="composeInfo" class="flex-1 min-w-0" @cursor="cursor = $event" @save="saveCompose" />
    </div>

    <StatusBar :icon="isDirty ? pencilIcon : codeBracesIcon" :message="isDirty ? $t('Modified') : $t('Edit Config')" :info="statusInfo" :showHelp="true">
      <template #help>
        <div class="space-y-2.5 max-w-sm">
          <div class="flex items-center gap-2">
            <StatusBarHelpIcon :icon="codeBracesIcon" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">{{ $t("Edit Config") }}</h4>
          </div>

          <div :class="['text-[10px] md:text-xs md:leading-4 space-y-2 leading-relaxed', themeClasses.statusBarInfo]">
            <p>{{ $t("Modify your application's configuration directly. You can save changes to update the configuration file, or use Save and Recreate to apply changes immediately by stopping and recreating the container with the new settings. All changes are validated before being applied to ensure proper YAML formatting.") }}</p>
          </div>
        </div>
      </template>
    </StatusBar>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";

import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";

import { Icon } from "@iconify/vue";
import contentSaveIcon from "@iconify-icons/mdi/content-save";
import arrowURightBottomBoldIcon from "@iconify-icons/mdi/arrow-u-right-bottom-bold";
import codeBracesIcon from "@iconify-icons/mdi/code-braces";
import undoIcon from "@iconify-icons/mdi/undo-variant";
import loadingIcon from "@iconify-icons/mdi/loading";
import refreshIcon from "@iconify-icons/mdi/refresh";
import alertIcon from "@iconify-icons/mdi/alert-circle-outline";
import fileHiddenIcon from "@iconify-icons/mdi/file-hidden";
import pencilIcon from "@iconify-icons/mdi/pencil";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useDesktopStore } from "../__Stores__/desktopStore";

import AppIconGraphic from "../__Components__/AppIconGraphic.vue";
import StatusBar from "../__Components__/StatusBar.vue";
import StatusBarHelpIcon from "../__Components__/StatusBarHelpIcon.vue";
import ComposeEditor, { type ComposeCursor } from "../__Components__/ComposeEditor.vue";

import { notifyError, notifySuccess, notifyWarning } from "../__Components__/Notifications.vue";

interface Props {
  appName?: string;
  data?: {
    appName?: string;
  };
}

type EditorState = "loading" | "ready" | "empty" | "error";

const RECREATE_LABEL = "Save and Recreate";
const CONFIRM_LABEL = "Click again to confirm";
const CONFIRM_TIMEOUT_MS = 3000;

const props = defineProps<Props>();
const { t } = useI18n();
const { themeClasses } = useTheme();
const desktopStore = useDesktopStore();
const csrfToken = useCsrfToken();

const appName = computed(() => props.appName || props.data?.appName || "Unknown");
const app = computed(() => desktopStore.mainDockerApps.find((entry) => entry.name === appName.value));
const displayName = computed(() => app.value?.display_name || appName.value);
const isRunning = computed(() => app.value?.status === "running");

const state = ref<EditorState>("loading");
const composeInfo = ref("");
const savedContent = ref("");
const isSaving = ref(false);
const isRecreating = ref(false);
const recreateLabel = ref(RECREATE_LABEL);
const cursor = ref<ComposeCursor>({ line: 1, column: 1 });

let confirmTimer: ReturnType<typeof setTimeout> | null = null;

const isDirty = computed(() => state.value === "ready" && composeInfo.value !== savedContent.value);
const isBusy = computed(() => isSaving.value || isRecreating.value);
const isConfirmingRecreate = computed(() => recreateLabel.value === CONFIRM_LABEL);

const statusInfo = computed(() => {
  if (state.value !== "ready") return `${t("Editing")} ${displayName.value}`;
  return `${t("Ln")} ${cursor.value.line}, ${t("Col")} ${cursor.value.column} · YAML`;
});

const fetchComposeInfo = async () => {
  state.value = "loading";

  try {
    const response = await axios.get(`/api/get-compose-info`, {
      headers: {
        "X-HomeDock-CSRF-Token": csrfToken.value,
      },
      params: {
        containerName: appName.value,
      },
    });

    const content = response.data?.data?.ymlContent;
    if (content && content.trim() !== "") {
      composeInfo.value = content;
      savedContent.value = content;
      cursor.value = { line: 1, column: 1 };
      state.value = "ready";
    } else {
      state.value = "empty";
    }
  } catch (error) {
    state.value = "error";
  }
};

async function writeCompose(): Promise<boolean> {
  const response = await axios.post("/api/update-yml-config", {
    containerName: appName.value,
    ymlContent: composeInfo.value,
    homedock_csrf_token: csrfToken.value,
  });

  if (response.data.success) {
    savedContent.value = composeInfo.value;
    return true;
  }

  return false;
}

const saveCompose = async () => {
  if (!isDirty.value || isBusy.value) return;
  isSaving.value = true;

  try {
    if (await writeCompose()) {
      notifySuccess(t("Configuration saved successfully!"), undefined, themeClasses.value.scopeSelector);
    } else {
      notifyWarning(t("Failed to save the configuration. Please check the YML format."), themeClasses.value.scopeSelector);
    }
  } catch (error: any) {
    if (error.response) {
      notifyError(error, themeClasses.value.scopeSelector);
    } else {
      notifyWarning(t("Unknown error occurred while saving configuration"), themeClasses.value.scopeSelector);
    }
  } finally {
    isSaving.value = false;
  }
};

function revertChanges() {
  if (!isDirty.value || isBusy.value) return;
  composeInfo.value = savedContent.value;
}

function resetRecreateLabel() {
  if (confirmTimer) {
    clearTimeout(confirmTimer);
    confirmTimer = null;
  }
  recreateLabel.value = RECREATE_LABEL;
}

const handleRecreateConfirm = () => {
  if (isConfirmingRecreate.value) {
    resetRecreateLabel();
    recreateContainer();
    return;
  }

  recreateLabel.value = CONFIRM_LABEL;
  confirmTimer = setTimeout(resetRecreateLabel, CONFIRM_TIMEOUT_MS);
};

const recreateContainer = async () => {
  isRecreating.value = true;
  recreateLabel.value = "Recreating...";

  try {
    if (!(await writeCompose())) {
      notifyWarning(t("Failed to update the configuration file."), themeClasses.value.scopeSelector);
      return;
    }

    try {
      const recreateResponse = await axios.post("/api/recreate-container", {
        container_name: appName.value,
        yml_content: composeInfo.value,
        homedock_csrf_token: csrfToken.value,
      });

      if (recreateResponse.data.message) {
        notifySuccess(t("Application recreated successfully!"), undefined, themeClasses.value.scopeSelector);
      } else {
        notifyWarning(t("Failed to recreate the application."), themeClasses.value.scopeSelector);
      }
    } catch (recreateError: any) {
      if (recreateError.response?.status === 400 && recreateError.response?.data?.messages) {
        notifyWarning(recreateError.response.data.messages.map((m: any) => t(m.key, m.params || {})).join("\n"), themeClasses.value.scopeSelector, 10);
      } else if (recreateError.response) {
        notifyError(recreateError, themeClasses.value.scopeSelector);
      } else {
        notifyWarning(t("Failed to recreate the application."), themeClasses.value.scopeSelector);
      }
    }
  } catch (error: any) {
    if (error.response) {
      notifyError(error, themeClasses.value.scopeSelector);
    } else {
      notifyWarning(t("An error occurred. Please check the logs."), themeClasses.value.scopeSelector);
    }
  } finally {
    isRecreating.value = false;
    recreateLabel.value = RECREATE_LABEL;
  }
};

onMounted(() => {
  fetchComposeInfo();
});

onBeforeUnmount(() => {
  if (confirmTimer) clearTimeout(confirmTimer);
});
</script>

<style scoped>
.app-edit {
  background: inherit;
}

@container window (max-width: 560px) {
  .edit-actions {
    flex-basis: 100%;
  }

  .edit-action {
    height: 2.25rem;
    font-size: 0.8125rem;
  }

  .edit-action-square {
    width: 2.25rem;
  }

  .edit-action:not(.edit-action-square) {
    flex: 1 1 0;
    min-width: 0;
  }

  .edit-action-primary {
    flex-grow: 1.6;
  }
}
</style>
