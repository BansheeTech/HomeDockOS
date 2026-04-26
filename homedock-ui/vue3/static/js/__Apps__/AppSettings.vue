<!-- homedock-ui/vue3/static/js/__Apps__/AppSettings.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="app-settings flex flex-col h-full overflow-hidden">
    <div class="flex-1 overflow-auto px-4 pb-4">
      <form @submit.prevent="handleSubmit" enctype="multipart/form-data">
        <div ref="segmentedContainerRef" class="settings-segmented-container" @mousedown="onSegmentedDrag">
          <Segmented v-model:value="activeKey" :options="segmentedOptions" :class="themeClasses.scopeSelector" class="settings-segmented mt-2">
            <template #label="{ payload }">
              <div class="flex items-center justify-center gap-1.5 px-1 py-1">
                <Icon :icon="payload.icon" class="w-4 h-4 flex-shrink-0" />
                <span>{{ payload.label }}</span>
              </div>
            </template>
          </Segmented>
        </div>

        <div ref="tabWrapperRef" class="tab-wrapper">
          <Transition enter-active-class="transition-opacity duration-200 ease-out" leave-active-class="transition-opacity duration-200 ease-in" enter-from-class="opacity-0" leave-to-class="opacity-0" mode="out-in" appear @before-leave="onBeforeLeave" @enter="onEnter">
            <div v-if="activeKey === '1'" key="1" class="tab-content">
              <SettingsTabUser v-model="formData.user" />
            </div>
            <div v-else-if="activeKey === '2'" key="2" class="tab-content">
              <SettingsTabSystem v-model="formData.system" />
            </div>
            <div v-else-if="activeKey === '3'" key="3" class="tab-content">
              <SettingsTabStorage v-model="formData.storage" />
            </div>
            <div v-else-if="activeKey === '4'" key="4" class="tab-content">
              <SettingsTabTheme ref="themeTabRef" v-model="formData.theme" />
            </div>
          </Transition>
        </div>

        <div class="flex mt-4 gap-3">
          <button type="button" id="cancelButton" class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border" :class="[themeClasses.appPropsActionButtonBg, themeClasses.appPropsActionButtonBorder, themeClasses.appPropsActionButtonText, themeClasses.appPropsActionButtonBgHover, themeClasses.appPropsActionButtonBorderHover]" @click="handleCancel">
            <Icon :icon="arrowLeftIcon" width="15" height="15" />
            Cancel
          </button>
          <button :disabled="!isFormValid || savingLoading" class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border" :class="isFormValid ? [themeClasses.appPropsActionButtonPrimaryBg, themeClasses.appPropsActionButtonPrimaryBorder, themeClasses.appPropsActionButtonPrimaryText, themeClasses.appPropsActionButtonPrimaryBgHover, themeClasses.appPropsActionButtonPrimaryBorderHover] : 'save-btn-disabled'" type="submit">
            <Icon v-if="savingLoading" :icon="loadingIcon" width="15" height="15" class="animate-spin" />
            <Icon v-else :icon="contentSaveIcon" width="15" height="15" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>

    <StatusBar :icon="settingsIcon" message="Settings" :info="`Theme: ${themeDisplayName}`" :showHelp="true">
      <template #help>
        <div class="space-y-2.5 max-w-sm">
          <div class="flex items-center gap-2">
            <Icon :icon="settingsIcon" :class="['w-5 h-5', themeClasses.statusBarIcon]" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">Settings</h4>
          </div>

          <div :class="['text-[10px] md:text-xs space-y-2 leading-relaxed', themeClasses.statusBarInfo]">
            <p>Configure your HomeDock OS settings including user account, system behavior, storage preferences, and interface themes. You can customize your username and password, adjust system ports, manage external storage drives, and personalize your visual experience. All settings are encrypted before being saved, ensuring maximum security even when not using HTTPS.</p>
          </div>
        </div>
      </template>
    </StatusBar>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";

import { computed, inject, reactive, ref, watch, nextTick, onBeforeUnmount } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { encryptForServer } from "../__Utils__/CryptoClient";

import { Segmented } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import accountIcon from "@iconify-icons/mdi/account";
import consoleIcon from "@iconify-icons/mdi/console";
import sdIcon from "@iconify-icons/mdi/sd";
import compareIcon from "@iconify-icons/mdi/compare";
import arrowLeftIcon from "@iconify-icons/mdi/arrow-left";
import contentSaveIcon from "@iconify-icons/mdi/content-save";
import loadingIcon from "@iconify-icons/mdi/loading";
import settingsIcon from "@iconify-icons/mdi/tune";

import SettingsTabUser from "../__Components__/SettingsTabUser.vue";
import SettingsTabSystem from "../__Components__/SettingsTabSystem.vue";
import SettingsTabStorage from "../__Components__/SettingsTabStorage.vue";
import SettingsTabTheme from "../__Components__/SettingsTabTheme.vue";
import StatusBar from "../__Components__/StatusBar.vue";

import { notifyError, notifySuccess, notifyWarning } from "../__Components__/Notifications.vue";

import { useWindowStore } from "../__Stores__/windowStore";
import { useDisksPlusStore } from "../__Stores__/useDisksPlusStore";

import type { ThemeData } from "../__Types__/ThemeData";
import type { SettingsData } from "../__Types__/SettingsData";

const themeData = inject<ThemeData | null>("data-theme", null);
const updateTheme = inject<(newTheme: Partial<ThemeData>) => void>("update-theme");
const updateCsrfToken = inject<(newToken: string) => void>("update-csrf-token");
const updateSettings = inject<(newSettings: Partial<SettingsData>) => void>("update-settings");
const settingsData = inject<SettingsData | null>("data-settings", null);

const csrfToken = useCsrfToken();

if (!themeData) throw new Error("Theme data is missing!");
if (!settingsData) throw new Error("Settings data is missing!");

const { themeClasses } = useTheme();
const windowStore = useWindowStore();
const disksPlusStore = useDisksPlusStore();

const activeKey = ref("1");
const segmentedOptions = [
  { value: "1", payload: { label: "User", icon: accountIcon } },
  { value: "2", payload: { label: "System", icon: consoleIcon } },
  { value: "3", payload: { label: "Storage", icon: sdIcon } },
  { value: "4", payload: { label: "Theme", icon: compareIcon } },
];
const savingLoading = ref<boolean>(false);
const themeTabRef = ref<any>(null);

const segmentedContainerRef = ref<HTMLElement | null>(null);
const tabWrapperRef = ref<HTMLElement | null>(null);
let tabObserver: ResizeObserver | null = null;

const onBeforeLeave = () => {
  const wrapper = tabWrapperRef.value;
  if (!wrapper) return;
  tabObserver?.disconnect();
  wrapper.style.height = wrapper.offsetHeight + "px";
};

const onEnter = (el: Element) => {
  const wrapper = tabWrapperRef.value;
  if (!wrapper) return;
  const htmlEl = el as HTMLElement;
  tabObserver?.disconnect();
  tabObserver = new ResizeObserver(() => {
    wrapper.style.height = htmlEl.offsetHeight + "px";
  });
  tabObserver.observe(htmlEl);
};

const onSegmentedDrag = (e: MouseEvent) => {
  const el = segmentedContainerRef.value;
  if (!el || el.scrollWidth <= el.clientWidth) return;
  const startX = e.pageX;
  const startScroll = el.scrollLeft;
  const onMove = (ev: MouseEvent) => {
    el.scrollLeft = startScroll - (ev.pageX - startX);
  };
  const onUp = () => {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
  };
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
};

watch(activeKey, (val) => {
  nextTick(() => {
    const container = segmentedContainerRef.value;
    if (!container || container.scrollWidth <= container.clientWidth) return;
    const items = container.querySelectorAll<HTMLElement>(".ant-segmented-item");
    const idx = segmentedOptions.findIndex((o) => o.value === val);
    const target = items[idx];
    if (!target) return;
    const left = target.offsetLeft - (container.clientWidth - target.offsetWidth) / 2;
    container.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  });
});

const themeDisplayName = computed(() => {
  const themeMap: Record<string, string> = {
    default: "Default",
    noir: "Noir",
    aeroplus: "Aero+",
  };
  return themeMap[formData.theme.selected_theme || "default"] || "Default";
});

const isFormValid = computed(() => {
  const userValid = !(!formData.user.user_name || !/^[a-zA-Z0-9]+$/.test(formData.user.user_name) || formData.user.user_name.length > 30 || (formData.user.change_password && ((formData.user.password?.length ?? 0) < 6 || formData.user.password !== formData.user.confirm_password)));
  const systemValid = !isNaN(formData.system.run_port ?? 0) && (formData.system.run_port ?? 0) >= 80 && (formData.system.run_port ?? 0) <= 65535;
  return userValid && systemValid;
});

interface UserFormData {
  user_name?: string;
  change_password?: boolean;
  password?: string;
  confirm_password?: string;
}

interface SystemFormData {
  run_port?: number;
  dynamic_dns?: string;
  run_on_development?: boolean;
  delete_old_image_containers_after_update?: boolean;
  delete_old_image_containers_after_uninstall?: boolean;
  delete_internal_data_volumes?: boolean;
  local_dns?: boolean;
  disable_usage_data?: boolean;
  reverse_proxy?: boolean;
}

interface StorageFormData {
  default_external_drive?: string;
  require_protected_paths_password?: boolean;
  disksplus_session_timeout_minutes?: number;
}

const originalTheme = {
  selected_theme: themeData!.selected_theme,
  selected_back: themeData!.selected_back,
};

const formData = reactive({
  user: {
    user_name: settingsData.user_name,
    change_password: false,
    password: "",
    confirm_password: "",
  } as UserFormData,

  system: {
    run_port: settingsData.run_port,
    dynamic_dns: settingsData.dynamic_dns,
    run_on_development: settingsData.run_on_development,
    disable_usage_data: settingsData.disable_usage_data,
    delete_old_image_containers_after_update: settingsData.delete_old_image_containers_after_update,
    delete_old_image_containers_after_uninstall: settingsData.delete_old_image_containers_after_uninstall,
    delete_internal_data_volumes: settingsData.delete_internal_data_volumes,
    local_dns: settingsData.local_dns,
    reverse_proxy: settingsData.reverse_proxy,
  } as SystemFormData,

  storage: {
    default_external_drive: settingsData.default_external_drive,
    require_protected_paths_password: settingsData.require_protected_paths_password,
    disksplus_session_timeout_minutes: settingsData.disksplus_session_timeout_minutes,
  } as StorageFormData,

  theme: {
    selected_theme: themeData.selected_theme,
    selected_back: themeData.selected_back,
  } as Partial<ThemeData>,
});

onBeforeUnmount(() => {
  tabObserver?.disconnect();
  if (updateTheme && (formData.theme.selected_theme !== originalTheme.selected_theme || formData.theme.selected_back !== originalTheme.selected_back)) {
    updateTheme({
      selected_theme: originalTheme.selected_theme,
      selected_back: originalTheme.selected_back,
    });
  }
});

const handleSubmit = async () => {
  if (savingLoading.value) return;
  savingLoading.value = true;

  if (themeTabRef.value?.hasPendingWallpaper()) {
    try {
      const uploaded = await themeTabRef.value.uploadPendingWallpaper();
      if (!uploaded) {
        notifyWarning("Failed to upload wallpaper", themeClasses.value.scopeSelector);
        savingLoading.value = false;
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error: any) {
      notifyWarning("Failed to upload wallpaper: " + (error.message || "Unknown error"), themeClasses.value.scopeSelector);
      savingLoading.value = false;
      return;
    }
  }

  const usernameChanged = formData.user.user_name !== settingsData.user_name;

  const encryptedPayload = await encryptForServer(
    {
      user: formData.user,
      system: formData.system,
      storage: formData.storage,
      theme: formData.theme,
    },
    csrfToken.value,
  );

  try {
    const response = await axios.post(
      "/api/save_settings",
      { encrypted_data: encryptedPayload },
      {
        headers: {
          "Content-Type": "application/json",
          "X-HomeDock-CSRF-Token": csrfToken.value,
        },
      },
    );

    if (response.data.csrf_token && updateCsrfToken) {
      updateCsrfToken(response.data.csrf_token);
    }

    if (usernameChanged) {
      notifySuccess("Settings saved successfully!", "Your settings were securely encrypted before being saved to ensure their safety. Reloading HomeDock OS because username changed...", themeClasses.value.scopeSelector);

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      notifySuccess("Settings saved successfully!", "Your settings were securely encrypted before being saved to ensure their safety.", themeClasses.value.scopeSelector);

      originalTheme.selected_theme = formData.theme.selected_theme || "";
      originalTheme.selected_back = formData.theme.selected_back || "";

      if (updateSettings) {
        updateSettings({
          user_name: formData.user.user_name,
          run_port: formData.system.run_port,
          dynamic_dns: formData.system.dynamic_dns,
          local_dns: formData.system.local_dns,
          run_on_development: formData.system.run_on_development,
          disable_usage_data: formData.system.disable_usage_data,
          delete_old_image_containers_after_update: formData.system.delete_old_image_containers_after_update,
          delete_old_image_containers_after_uninstall: formData.system.delete_old_image_containers_after_uninstall,
          delete_internal_data_volumes: formData.system.delete_internal_data_volumes,
          reverse_proxy: formData.system.reverse_proxy,
          default_external_drive: formData.storage.default_external_drive,
          require_protected_paths_password: formData.storage.require_protected_paths_password,
          disksplus_session_timeout_minutes: formData.storage.disksplus_session_timeout_minutes,
        });
      }

      disksPlusStore.fetchStatus();

      savingLoading.value = false;
    }
  } catch (error: any) {
    notifyError(error, themeClasses.value.scopeSelector);
    savingLoading.value = false;
  }
};

const handleCancel = () => {
  if (themeTabRef.value?.hasPendingWallpaper()) {
    themeTabRef.value.clearPendingWallpaper();
  }

  const settingsWindow = windowStore.windows.find((w) => w.appId === "settings");
  if (settingsWindow) {
    windowStore.closeWindow(settingsWindow.id);
  }
};
</script>

<style scoped>
.app-settings {
  background: transparent;
}

.tab-wrapper {
  overflow: hidden;
  transition: height 0.2s ease;
}

.save-btn-disabled {
  border-color: #85858587 !important;
  background-color: #740a0a !important;
  color: #ffffff !important;
  text-decoration: line-through !important;
  cursor: not-allowed !important;
}

/* Segmented: scrollable wrapper */
.settings-segmented-container {
  overflow-x: auto;
  scrollbar-width: none;
  margin-bottom: 1rem;
  margin-top: 0.5rem;
}

.settings-segmented-container::-webkit-scrollbar {
  display: none;
}
</style>
