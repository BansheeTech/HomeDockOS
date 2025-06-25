<!-- homedock-ui/vue3/static/js/__Layouts__/Settings.vue -->
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
        <MenuBar :activePath="activePath" />
      </aside>
      <div :class="[themeClasses.back]" class="flex flex-col flex-1 pl-4 pt-3 pr-4 max-w-full overflow-x-hidden">
        <main class="flex-1 overflow-auto holder">
          <Card id="settingsCard" title="Settings" body="Modify your Settings" :mdi_icon="settingsIcon" :collapsible="false">
            <form @submit.prevent="handleSubmit" enctype="multipart/form-data">
              <Tabs v-model:activeKey="activeKey" :animated="false" :destroyInactiveTabPane="false">
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
                      <SettingsTabStorage v-model="formData.storage" :validDrives="settingsData.validDrives" />
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
                      <SettingsTabTheme v-model="formData.theme" />
                    </div>
                  </Transition>
                </TabPane>
              </Tabs>

              <div class="flex mt-4">
                <Button id="cancelButton" class="flex items-center" type="default" danger @click="handleCancel"> <Icon :icon="arrowLeftIcon" size="15px" class="mr-1" /> Cancel </Button>
                <Button :disabled="!isFormValid" class="ml-4 flex items-center" type="primary" htmlType="submit">
                  <template v-if="savingLoading">
                    <Icon :icon="loadingIcon" size="15px" class="mr-1 animate-spin" key="loading" />
                  </template>
                  <template v-else>
                    <Icon :icon="contentSaveIcon" size="15px" class="mr-1" key="save" />
                  </template>
                  <span>Save Settings</span>
                </Button>
              </div>
            </form>
          </Card>
        </main>
        <Footer></Footer>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, reactive, ref } from "vue";

import axios from "axios";
import forge from "node-forge";

import { useTheme } from "../__Themes__/ThemeSelector";

import { Tabs, TabPane, Button } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import settingsIcon from "@iconify-icons/mdi/tune";
import accountIcon from "@iconify-icons/mdi/account";
import consoleIcon from "@iconify-icons/mdi/console";
import sdIcon from "@iconify-icons/mdi/sd";
import compareIcon from "@iconify-icons/mdi/compare";
import arrowLeftIcon from "@iconify-icons/mdi/arrow-left";
import contentSaveIcon from "@iconify-icons/mdi/content-save";
import viewMoreIcon from "@iconify-icons/mdi/unfold-more-vertical";
import loadingIcon from "@iconify-icons/mdi/loading";

import Favicon from "../__Components__/Favicon.vue";
import AeroPlusWallpaper from "../__Components__/AeroPlusWallpaper.vue";
import ScrollBarThemeLoader from "../__Components__/ScrollBarThemeLoader.vue";
import TopComment from "../__Components__/TopComment.vue";
import NetworkOffline from "../__Components__/NetworkOffline.vue";
import Footer from "../__Components__/Footer.vue";
import NavBar from "../__Components__/NavBar.vue";
import MenuBar from "../__Components__/MenuBar.vue";
import Card from "../__Components__/Card.vue";
import SettingsTabUser from "../__Components__/SettingsTabUser.vue";
import SettingsTabSystem from "../__Components__/SettingsTabSystem.vue";
import SettingsTabStorage from "../__Components__/SettingsTabStorage.vue";
import SettingsTabTheme from "../__Components__/SettingsTabTheme.vue";

import { notifyError, notifySuccess } from "../__Components__/Notifications.vue";

const csrfToken = ref<string>(document.querySelector('meta[name="homedock_csrf_token"]')?.getAttribute("content") || "");

const { themeClasses } = useTheme();

const activePath = ref("/settings");
const activeKey = ref("1");
const publicKey = ref<string>("");
const savingLoading = ref<boolean>(false);

const fetchPublicKey = async () => {
  try {
    const response = await axios.get("/api/pksend", {
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });
    publicKey.value = response.data.public_key;
  } catch (error) {
    console.error("Error fetching public key:", error);
  }
};

const encryptData = (data: any): string => {
  const rsa = forge.pki.publicKeyFromPem(publicKey.value);
  const jsonData = JSON.stringify(data);
  return forge.util.encode64(
    rsa.encrypt(jsonData, "RSA-OAEP", {
      md: forge.md.sha256.create(),
      mgf1: { md: forge.md.sha256.create() },
    })
  );
};

const isFormValid = computed(() => {
  const userValid = !(!formData.user.username || !/^[a-zA-Z0-9]+$/.test(formData.user.username) || formData.user.username.length > 30 || (formData.user.changePassword && ((formData.user.password?.length ?? 0) < 6 || formData.user.password !== formData.user.confirmPassword)));
  const systemValid = !isNaN(formData.system.runPort ?? 0) && (formData.system.runPort ?? 0) >= 80 && (formData.system.runPort ?? 0) <= 65535;
  return userValid && systemValid;
});

// Flask Data Injection
const themeData = inject<{
  selectedTheme: string;
  selectedBack: string;
}>("data-theme");

const commonData = inject<{
  version: string;
}>("data-common");

const settingsData = inject<{
  userName: string;
  runPort: number;
  dynamicDNS: string;
  localDNS: boolean;
  runOnDev: boolean;
  disableUsageData: boolean;
  deleteImageOnUpdate: boolean;
  deleteImageOnUninstall: boolean;
  defaultExternalDrive: string;
  validDrives: string[];
}>("data-settings");

if (!themeData) {
  throw new Error("Theme data is missing!");
}

if (!commonData) {
  throw new Error("Common data is missing!");
}

if (!settingsData) {
  throw new Error("Settings data is missing!");
}

// UserData Interface > SettingsTabUser.vue
interface UserData {
  username?: string;
  changePassword?: boolean;
  password?: string;
  confirmPassword?: string;
}

// UserData Interface > SettingsTabSystem.vue
interface SystemData {
  runPort?: number;
  hostname?: string;
  developmentMode?: boolean;
  deleteOldImages?: boolean;
  deleteOldImagesUninstall?: boolean;
  localDNS?: boolean;
}

// StorageData Interface > SettingsTabStorage.vue
interface StorageData {
  externalDrive?: string;
  validDrives?: string[];
}

// ThemeData Interface > SettingsTabTheme.vue
interface ThemeData {
  selectedTheme?: string;
  selectedBack?: string;
}

// Data Bindings Declaration
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

const handleSubmit = async () => {
  if (savingLoading.value) return;
  savingLoading.value = true;

  if (!publicKey.value) await fetchPublicKey();

  const encryptedPayload = encryptData({
    user: formData.user,
    system: formData.system,
    storage: formData.storage,
    theme: formData.theme,
  });

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

    if (response.data.csrf_token) {
      csrfToken.value = response.data.csrf_token;
    }

    notifySuccess("Settings saved successfully!", "Your settings were securely encrypted before being saved to ensure their safety.", themeClasses.value.scopeSelector);
  } catch (error: any) {
    if (error.response) {
      notifyError(error || "An unexpected server error occurred", themeClasses.value.scopeSelector);
    } else if (error.request) {
      notifyError(error || "An unexpected server error occurred", themeClasses.value.scopeSelector);
    } else {
      notifyError(error || "An unexpected server error occurred", themeClasses.value.scopeSelector);
    }
  } finally {
    savingLoading.value = false;
  }
};

const handleCancel = () => {
  window.location.href = "/dashboard";
};
</script>

<style scoped>
/* Transition Option Selector */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.5s, transform 0.5s;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Child Styles */
::v-deep(.dark-mode-theme .ant-checkbox-inner) {
  background-color: #292929 !important;
  border: 1px solid #3b3b3b !important;
}

::v-deep(.aero-mode-theme .ant-checkbox-inner) {
  background-color: #00000000 !important;
  border: 1px solid #3b3b3b !important;
}

::v-deep(.white-mode-theme .ant-form-item-control-input-content) {
  background-color: rgb(255, 255, 255) !important;
  color: rgb(31, 31, 31) !important;
}

::v-deep(.dark-mode-theme input) {
  background-color: rgb(39, 39, 42) !important;
  color: rgb(255, 255, 255) !important;
}

::v-deep(.aero-mode-theme input) {
  background-color: transparent !important;
  color: rgb(255, 255, 255) !important;
}

::v-deep(.white-mode-theme input::placeholder) {
  color: rgb(210, 210, 210) !important;
}

::v-deep(.dark-mode-theme input::placeholder) {
  color: rgb(100, 100, 100) !important;
}

::v-deep(.aero-mode-theme input::placeholder) {
  color: rgb(100, 100, 100) !important;
}

::v-deep(.white-mode-theme input:autofill) {
  background-color: transparent !important;
  box-shadow: 0 0 0 1000px rgb(255, 255, 255) inset !important;
  -webkit-text-fill-color: #000000 !important;
}

::v-deep(.dark-mode-theme input:autofill) {
  background-color: transparent !important;
  box-shadow: 0 0 0 1000px rgb(0, 0, 0) inset !important;
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
  box-shadow: 0 0 0 1000px rgba(0, 0, 0, 0) inset !important;
}

::v-deep(.dark-mode-theme .ant-select-selector) {
  background-color: rgba(31, 31, 31, 0) !important;
  color: white !important;
  box-shadow: 0 0 0 1000px rgb(39, 39, 42) inset !important;
  border: 1px solid rgb(64, 64, 64) !important;
}

::v-deep(.aero-mode-theme .ant-select-selector) {
  background-color: transparent !important;
  color: white !important;
  box-shadow: 0 0 0 1000px rgba(0, 0, 0, 0.1) inset !important;
  border: 1px solid rgb(64, 64, 64, 0.5) !important;
}

::v-deep(.dark-mode-theme .ant-select-item-option) {
  background-color: rgb(31, 31, 31) !important;
  color: white !important;
  box-shadow: 0 0 0 1000px rgb(39, 39, 42) inset !important;
  border: 1px solid rgb(64, 64, 64) !important;
}

::v-deep(.ant-btn-primary:disabled) {
  border-color: #85858587 !important;
  background-color: #740a0a !important;
  color: #ffffff !important;
  text-decoration: line-through !important;
  transition: ease-in-out 0.3s !important;
}
</style>
