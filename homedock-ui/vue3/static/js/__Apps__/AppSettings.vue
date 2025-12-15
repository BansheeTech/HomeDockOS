<!-- homedock-ui/vue3/static/js/__Apps__/AppSettings.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="app-settings flex flex-col h-full overflow-hidden">
    <div class="flex-1 overflow-auto px-4 pb-4">
      <form @submit.prevent="handleSubmit" enctype="multipart/form-data">
        <Tabs v-model:activeKey="activeKey" :animated="false" :destroyInactiveTabPane="false" :tabBarGutter="32">
          <template #moreIcon>
            <Icon :class="[themeClasses.upperTabText]" :icon="viewMoreIcon" size="18px" />
          </template>

          <TabPane key="1">
            <template #tab>
              <span class="text-slate-800 flex items-center">
                <Icon :class="[themeClasses.upperTabText]" :icon="accountIcon" size="18px" class="mr-1" />
                <span :class="[themeClasses.upperTabText]">User Settings</span>
              </span>
            </template>
            <Transition name="fade-slide" appear>
              <div v-if="activeKey === '1'" class="tab-content">
                <SettingsTabUser v-model="formData.user" />
              </div>
            </Transition>
          </TabPane>

          <TabPane key="2">
            <template #tab>
              <span class="text-slate-800 flex items-center">
                <Icon :class="[themeClasses.upperTabText]" :icon="consoleIcon" size="18px" class="mr-1" />
                <span :class="[themeClasses.upperTabText]">System Settings</span>
              </span>
            </template>
            <Transition name="fade-slide" appear>
              <div v-if="activeKey === '2'" class="tab-content">
                <SettingsTabSystem v-model="formData.system" />
              </div>
            </Transition>
          </TabPane>

          <TabPane key="3">
            <template #tab>
              <span class="text-slate-800 flex items-center">
                <Icon :class="[themeClasses.upperTabText]" :icon="sdIcon" size="18px" class="mr-1" />
                <span :class="[themeClasses.upperTabText]">Storage Settings</span>
              </span>
            </template>
            <Transition name="fade-slide" appear>
              <div v-if="activeKey === '3'" class="tab-content">
                <SettingsTabStorage v-model="formData.storage" :validDrives="validDrives" />
              </div>
            </Transition>
          </TabPane>

          <TabPane key="4">
            <template #tab>
              <span class="text-slate-800 flex items-center">
                <Icon :class="[themeClasses.upperTabText]" :icon="compareIcon" size="18px" class="mr-1" />
                <span :class="[themeClasses.upperTabText]">Theme Settings</span>
              </span>
            </template>
            <Transition name="fade-slide" appear>
              <div v-if="activeKey === '4'" class="tab-content">
                <SettingsTabTheme ref="themeTabRef" v-model="formData.theme" />
              </div>
            </Transition>
          </TabPane>
        </Tabs>

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

import { computed, inject, reactive, ref, onBeforeUnmount } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { encryptForServer } from "../__Utils__/CryptoClient";

import { Tabs, TabPane } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import accountIcon from "@iconify-icons/mdi/account";
import consoleIcon from "@iconify-icons/mdi/console";
import sdIcon from "@iconify-icons/mdi/sd";
import compareIcon from "@iconify-icons/mdi/compare";
import arrowLeftIcon from "@iconify-icons/mdi/arrow-left";
import contentSaveIcon from "@iconify-icons/mdi/content-save";
import viewMoreIcon from "@iconify-icons/mdi/unfold-more-vertical";
import loadingIcon from "@iconify-icons/mdi/loading";
import settingsIcon from "@iconify-icons/mdi/tune";

import SettingsTabUser from "../__Components__/SettingsTabUser.vue";
import SettingsTabSystem from "../__Components__/SettingsTabSystem.vue";
import SettingsTabStorage from "../__Components__/SettingsTabStorage.vue";
import SettingsTabTheme from "../__Components__/SettingsTabTheme.vue";
import StatusBar from "../__Components__/StatusBar.vue";

import { notifyError, notifySuccess, notifyWarning } from "../__Components__/Notifications.vue";

import { useWindowStore } from "../__Stores__/windowStore";
import { useSystemStatsStore } from "../__Stores__/useSystemStatsStore";

const themeData = inject<{ selectedTheme: string; selectedBack: string }>("data-theme");
const updateTheme = inject<(newTheme: { selectedTheme?: string; selectedBack?: string }) => void>("update-theme");
const updateCsrfToken = inject<(newToken: string) => void>("update-csrf-token");
const updateSettings = inject<(newSettings: any) => void>("update-settings");
const settingsData = inject<{
  userName: string;
  runPort: number;
  dynamicDNS: string;
  localDNS: boolean;
  runOnDev: boolean;
  disableUsageData: boolean;
  deleteImageOnUpdate: boolean;
  deleteImageOnUninstall: boolean;
  deleteInternalDataVolumes: boolean;
  defaultExternalDrive: string;
  validDrives: string[];
}>("data-settings");
const dashboardData = inject<any>("data-dashboard");

const csrfToken = useCsrfToken();

if (!themeData) throw new Error("Theme data is missing!");
if (!settingsData) throw new Error("Settings data is missing!");

const { themeClasses } = useTheme();
const windowStore = useWindowStore();
const systemStatsStore = useSystemStatsStore();

const activeKey = ref("1");
const savingLoading = ref<boolean>(false);
const themeTabRef = ref<any>(null);

const validDrives = computed(() => {
  return settingsData?.validDrives || [];
});

const themeDisplayName = computed(() => {
  const themeMap: Record<string, string> = {
    default: "Default",
    noir: "Noir",
    aeroplus: "Aero+",
  };
  return themeMap[formData.theme.selectedTheme || "default"] || "Default";
});

const isFormValid = computed(() => {
  const userValid = !(!formData.user.username || !/^[a-zA-Z0-9]+$/.test(formData.user.username) || formData.user.username.length > 30 || (formData.user.changePassword && ((formData.user.password?.length ?? 0) < 6 || formData.user.password !== formData.user.confirmPassword)));
  const systemValid = !isNaN(formData.system.runPort ?? 0) && (formData.system.runPort ?? 0) >= 80 && (formData.system.runPort ?? 0) <= 65535;
  return userValid && systemValid;
});

interface UserData {
  username?: string;
  changePassword?: boolean;
  password?: string;
  confirmPassword?: string;
}

interface SystemData {
  runPort?: number;
  hostname?: string;
  developmentMode?: boolean;
  deleteOldImages?: boolean;
  deleteOldImagesUninstall?: boolean;
  deleteVolumesUninstall?: boolean;
  localDNS?: boolean;
  disableUsageData?: boolean;
}

interface StorageData {
  externalDrive?: string;
  validDrives?: string[];
}

interface ThemeData {
  selectedTheme?: string;
  selectedBack?: string;
}

const originalTheme = {
  selectedTheme: themeData!.selectedTheme,
  selectedBack: themeData!.selectedBack,
};

const formData = reactive({
  user: {
    username: settingsData.userName,
    changePassword: false,
    password: "",
    confirmPassword: "",
  } as UserData,

  system: {
    runPort: settingsData.runPort,
    hostname: settingsData.dynamicDNS,
    developmentMode: settingsData.runOnDev,
    disableUsageData: settingsData.disableUsageData,
    deleteOldImages: settingsData.deleteImageOnUpdate,
    deleteOldImagesUninstall: settingsData.deleteImageOnUninstall,
    deleteVolumesUninstall: settingsData.deleteInternalDataVolumes,
    localDNS: settingsData.localDNS,
  } as SystemData,

  storage: {
    externalDrive: settingsData.defaultExternalDrive,
  } as StorageData,

  theme: {
    selectedTheme: themeData.selectedTheme,
    selectedBack: themeData.selectedBack,
  } as ThemeData,
});

onBeforeUnmount(() => {
  if (updateTheme && (formData.theme.selectedTheme !== originalTheme.selectedTheme || formData.theme.selectedBack !== originalTheme.selectedBack)) {
    updateTheme({
      selectedTheme: originalTheme.selectedTheme,
      selectedBack: originalTheme.selectedBack,
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

  const usernameChanged = formData.user.username !== settingsData.userName;

  const encryptedPayload = await encryptForServer(
    {
      user: formData.user,
      system: formData.system,
      storage: formData.storage,
      theme: formData.theme,
    },
    csrfToken.value
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
      }
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

      originalTheme.selectedTheme = formData.theme.selectedTheme || "";
      originalTheme.selectedBack = formData.theme.selectedBack || "";

      if (updateSettings) {
        updateSettings({
          userName: formData.user.username,
          runPort: formData.system.runPort,
          dynamicDNS: formData.system.hostname,
          localDNS: formData.system.localDNS,
          runOnDev: formData.system.developmentMode,
          disableUsageData: formData.system.disableUsageData,
          deleteImageOnUpdate: formData.system.deleteOldImages,
          deleteImageOnUninstall: formData.system.deleteOldImagesUninstall,
          deleteInternalDataVolumes: formData.system.deleteVolumesUninstall,
          defaultExternalDrive: formData.storage.externalDrive,
        });
      }

      systemStatsStore.externalDefaultDisk = formData.storage.externalDrive || "disabled";

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

/* Transition for tabs */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.5s, transform 0.5s;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.save-btn-disabled {
  border-color: #85858587 !important;
  background-color: #740a0a !important;
  color: #ffffff !important;
  text-decoration: line-through !important;
  cursor: not-allowed !important;
}
</style>
