<!-- src/static/js/__Components__/AppStoreList.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template>
  <div class="mt-4">
    <List v-if="visibleApps.length" :dataSource="visibleApps" :grid="{ gutter: 16, column: 5, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 5 }" itemLayout="horizontal">
      <template #renderItem="{ item }">
        <TransitionGroup name="app-list" tag="div">
          <ListItem :key="item.name">
            <AppStoreAppCard :app="item" @install="openModal" />
          </ListItem>
        </TransitionGroup>
      </template>
    </List>

    <Empty v-else :class="[themeClasses.storeEmptyText]" description="No applications available under this search term"></Empty>

    <Pagination :class="[themeClasses.scopeSelector]" :current="appStore.currentPage" :pageSize="appStore.appsPerPage" :total="appStore.filteredAppsTotal" @change="appStore.setPage" :showSizeChanger="false" :pageSizeOptions="[15, 30, 45]" :responsive="true" :simple="false" class="text-center" />

    <Modal :class="[themeClasses.scopeSelector]" v-model:open="modalStore.isModalVisible" :key="modalStore.selectedApp?.name" wrap-class-name="full-modal" class="rounded-3xl overflow-hidden" :destroyOnClose="true" :footer="null" :centered="true">
      <div class="py-3 lg:px-3 rounded-3xl mx-auto grid grid-cols-1 lg:grid-cols-4 items-start">
        <div class="col-span-1 flex flex-col items-center lg:items-start text-center lg:text-left">
          <BaseImage draggable="false" :src="modalStore.selectedApp?.picture_path || 'docker-icons/notfound.jpg'" alt="App Icon" :class="[themeClasses.storeModalImageBack]" class="w-32 h-32 rounded-2xl shadow-lg transition duration-300 hover:-translate-y-1 md:w-44 md:h-44" />
          <h1 :class="[themeClasses.storeModalAppName]" class="text-2xl font-bold mt-4">{{ modalStore.selectedApp?.name }}</h1>
          <p :class="[themeClasses.storeModalAppType]" class="text-sm">{{ modalStore.selectedApp?.type }}</p>
          <p :class="[themeClasses.storeModalAppCategory]" class="text-sm">{{ modalStore.selectedApp?.category }}</p>

          <span :class="[themeClasses.storeModalSeparator]" class="h-px w-full mt-2"></span>

          <a :href="`https://www.homedock.cloud/apps/${modalStore.selectedApp?.name.toLowerCase()}`" target="_blank">
            <p :class="[themeClasses.storeLicenseScope]" class="text-sm text-xs mt-2 inline-flex items-start">
              <Icon :icon="codeBracesBoxIcon" class="h-3 min-h-3 w-3 min-w-3 mt-0.5 mr-1" />
              <span>License</span>
            </p>
          </a>

          <p v-if="modalStore.selectedApp?.dependencies && modalStore.selectedApp.dependencies.length >= 1" :class="[themeClasses.storeDependenciesScope]" class="text-sm text-xs inline-flex items-start">
            <Icon :icon="cubeIcon" class="h-3 min-h-3 w-3 min-w-3 mt-0.5 mr-1" />
            {{ modalStore.selectedApp?.dependencies.concat().join(", ") }}
          </p>

          <div class="mt-4 flex gap-2">
            <Transition name="button-fade" mode="out-in">
              <!-- Installed -->
              <Button v-if="modalStore.selectedApp?.is_installed" key="installed" :class="[themeClasses.storeButtonInstalled]" class="flex items-center" type="default">
                <Icon :icon="checkBoldIcon" class="mr-1" />
                Installed
              </Button>

              <!-- Installing -->
              <Button v-else-if="installationStore.currentlyInstalling === modalStore.selectedApp?.name" key="installing" :class="[themeClasses.storeButtonInstalling]" class="flex items-center" type="default">
                <Icon :icon="loadingIcon" class="mr-1 animate-spin" />
                Installing...
              </Button>

              <!-- Queued -->
              <Button v-else-if="modalStore.selectedApp?.name && installationStore.queue.includes(modalStore.selectedApp.name)" key="queued" :class="[themeClasses.storeButtonQueued]" class="flex items-center" type="default">
                <Icon :icon="queueIcon" class="mr-1" />
                Queued
              </Button>

              <!-- Install / Default -->
              <Button v-else :class="[themeClasses.storeButtonInstall]" key="install" class="flex items-center" type="primary" @click="installApp(modalStore.selectedApp?.name || '')">
                <Icon :icon="downloadIcon" class="mr-1" />
                Install
              </Button>
            </Transition>

            <a :href="`https://www.homedock.cloud/apps/${modalStore.selectedApp?.name.toLowerCase()}`" target="_blank">
              <Button :class="[themeClasses.storeLinkHDOSButton]" class="flex items-center" type="dashed">
                <Icon :icon="earthIcon" />
              </Button>
            </a>
          </div>

          <Switch v-model:checked="modalStore.isAdvancedMode" @change="modalStore.toggleAdvancedMode" class="mt-2">
            <template #checkedChildren>
              <span class="flex items-center"><Icon :icon="emoticonHappyOutlineIcon" class="h-4 w-4" /><span class="text-transparent">.</span></span>
            </template>
            <template #unCheckedChildren>
              <span class="flex items-center"><Icon :icon="xmlIcon" class="h-4 w-4" /><span class="text-transparent">.</span></span>
            </template>
          </Switch>
        </div>

        <div class="col-span-1 mt-4 lg:mt-0 lg:col-span-3 lg:ml-4 2xl:-ml-4 flex flex-col gap-2">
          <h2 :class="[themeClasses.storeAboutTextScope]" class="text-2xl font-semibold">About {{ modalStore.selectedApp?.name }}</h2>
          <p :class="[themeClasses.storeAboutTextDescScope]">
            {{ modalStore.selectedApp?.description + "." || "No description available" }}
          </p>

          <p v-if="modalStore.selectedApp?.dependencies && modalStore.selectedApp.dependencies.length >= 1" :class="[themeClasses.storeAboutTextDepsScope]" class="text-sm text-xs inline-flex items-start">
            <Icon :icon="cubeIcon" class="h-3 min-h-3 w-3 min-w-3 mt-0.5 mr-1" />
            <span>
              Installing this application will also install the following dependencies: <span class="underline">{{ modalStore.selectedApp?.dependencies.concat().join(", ") }}</span>
            </span>
          </p>

          <Transition name="fade-slide" mode="out-in">
            <div v-if="!modalStore.isAdvancedMode">
              <div v-show="modalStore.userName !== undefined || modalStore.userPassword !== undefined" class="mb-4">
                <h3 :class="[themeClasses.storeRuntimeRenderTextScope]" class="font-semibold text-lg">Access</h3>

                <div v-show="modalStore.userName !== undefined" class="mb-2 flex items-center gap-2">
                  <Input :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :disabled="modalStore.selectedApp?.is_installed" v-model:value="modalStore.userName" placeholder="Username..." class="w-full" />
                </div>

                <div v-show="modalStore.userPassword !== undefined" class="mb-2 flex items-center gap-2">
                  <InputPassword autocomplete="new-password" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :disabled="modalStore.selectedApp?.is_installed" v-model:value="modalStore.userPassword" placeholder="Password..." class="w-full" />
                </div>
              </div>

              <div class="mb-4">
                <h3 :class="[themeClasses.storeRuntimeRenderTextScope]" class="font-semibold text-lg">Ports</h3>
                <div v-for="(port, index) in modalStore.ports" :key="'port-' + index" class="mb-2 flex items-center gap-2">
                  <Input :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :disabled="modalStore.selectedApp?.is_installed" v-model:value="modalStore.ports[index]" placeholder="Format: 8080:80" class="w-full" />
                  <Button :class="[themeClasses.storeLinkHDOSButton]" :disabled="modalStore.selectedApp?.is_installed" type="dashed" @click="modalStore.removePort(index)">
                    <Icon :icon="deleteIcon" />
                  </Button>
                </div>
                <Button :disabled="modalStore.selectedApp?.is_installed" type="primary" @click="modalStore.addPort" class="mt-2">Add Port</Button>
              </div>

              <div class="mb-4">
                <h3 :class="[themeClasses.storeRuntimeRenderTextScope]" class="font-semibold text-lg">Volumes</h3>
                <div v-for="(volume, index) in modalStore.volumes" :key="'volume-' + index" class="mb-2 flex items-center gap-2">
                  <Input :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :disabled="modalStore.selectedApp?.is_installed" v-model:value="modalStore.volumes[index]" placeholder="Format: /path:/path" class="w-full" />
                  <Button :class="[themeClasses.storeLinkHDOSButton]" :disabled="modalStore.selectedApp?.is_installed" type="dashed" @click="modalStore.removeVolume(index)">
                    <Icon :icon="deleteIcon" />
                  </Button>
                </div>
                <Button :disabled="modalStore.selectedApp?.is_installed" type="primary" @click="modalStore.addVolume" class="mt-2">Add Volume</Button>
              </div>

              <div class="mb-4">
                <h3 :class="[themeClasses.storeRuntimeRenderTextScope]" class="font-semibold text-lg">Restart Policy</h3>
                <Select :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :popup-class-name="`${themeClasses.scopeSelector} z-1`" :disabled="modalStore.selectedApp?.is_installed" v-model:value="modalStore.restartPolicy" class="w-full">
                  <SelectOption :class="[themeClasses.scopeSelector]" value="always">Always</SelectOption>
                  <SelectOption :class="[themeClasses.scopeSelector]" value="unless-stopped">Unless Stopped</SelectOption>
                  <SelectOption :class="[themeClasses.scopeSelector]" value="no">No</SelectOption>
                </Select>
              </div>
            </div>
            <textarea v-else :disabled="modalStore.selectedApp?.is_installed" v-model="modalStore.advancedCompose" :class="[themeClasses.hubTextArea]" class="rounded p-2 rounded-lg w-full font-mono h-96 resize-none"></textarea>
          </Transition>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import { useAppStore } from "../__Stores__/useAppStore";
import { useModalStore } from "../__Stores__/useModalStore";
import { useInstallationStore } from "../__Stores__/useInstallationStore";

import { App } from "../__Types__/AppStoreApp";

import { List, ListItem, Empty, Modal, Button, Select, SelectOption, Input, InputPassword, Switch, Pagination } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import downloadIcon from "@iconify-icons/mdi/download";
import checkBoldIcon from "@iconify-icons/mdi/check-bold";
import cubeIcon from "@iconify-icons/mdi/cube";
import xmlIcon from "@iconify-icons/mdi/xml";
import emoticonHappyOutlineIcon from "@iconify-icons/mdi/emoticon-happy-outline";
import deleteIcon from "@iconify-icons/mdi/delete";
import codeBracesBoxIcon from "@iconify-icons/mdi/code-braces-box";
import earthIcon from "@iconify-icons/mdi/earth";
import queueIcon from "@iconify-icons/mdi/queue";
import loadingIcon from "@iconify-icons/mdi/loading";

import AppStoreAppCard from "../__Components__/AppStoreAppCard.vue";
import BaseImage from "../__Components__/BaseImage.vue";

const { themeClasses } = useTheme();

const appStore = useAppStore();
const modalStore = useModalStore();
const installationStore = useInstallationStore();

const visibleApps = computed(() => appStore.filteredApps);
const csrfToken = document.querySelector('meta[name="homedock_csrf_token"]')?.getAttribute("content") || "";

const openModal = (app: App) => {
  const selectedAppFromStore = appStore.apps.find((a) => a.name === app.name) || app;
  modalStore.openModal(selectedAppFromStore, csrfToken || "");
};

const installApp = (containerName: string) => {
  if (!containerName) {
    console.error("Cannot install app: container name is undefined");
    return;
  }
  if (!csrfToken) {
    console.error("Cannot install app: CSRF token is missing");
    return;
  }
  modalStore.installApp(containerName, csrfToken);
};

watch(
  () => appStore.apps,
  () => {
    if (modalStore.selectedApp) {
      const updatedApp = appStore.apps.find((app) => app.name === modalStore.selectedApp?.name);
      if (updatedApp) {
        modalStore.selectedApp = { ...modalStore.selectedApp, ...updatedApp };
      }
    }
  },
  { deep: true, immediate: true }
);
</script>

<style scoped>
textarea {
  outline: 1px solid rgba(129, 129, 129, 0.281);
}

textarea:disabled {
  color: rgb(64, 64, 64) !important;
  user-select: none !important;
}

/* Transitions > Modal Button Status */
.button-fade-enter-active,
.button-fade-leave-active {
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
}

.button-fade-enter-from {
  opacity: 0;
}

.button-fade-enter-to {
  opacity: 1;
}

.button-fade-leave-from {
  opacity: 1;
}

.button-fade-leave-to {
  opacity: 0;
}

/* Transitions > Install Switch Mode */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: scale(0.98);
}

.fade-slide-enter-to {
  opacity: 1;
  transform: scale(1);
}

.fade-slide-leave-from {
  opacity: 1;
  transform: scale(1);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

/* Transitions > App Card Moving */
.app-list-enter-active,
.app-list-leave-active {
  transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
  overflow: hidden;
}

.app-list-enter-from {
  max-height: 0;
  opacity: 0;
  transform: scale(1);
}

.app-list-enter-to {
  max-height: 195px;
  opacity: 1;
  transform: scale(1);
}

.app-list-leave-from {
  max-height: 195px;
  opacity: 1;
  transform: scale(1);
}

.app-list-leave-to {
  max-height: 0;
  opacity: 0;
  transform: scale(1);
}

/* Ant D Styles Overrides */
:deep(.ant-list-item) {
  padding-left: 0px !important;
  padding-right: 0px !important;
}

:global(.full-modal .ant-modal) {
  margin-top: 15px !important;
  margin-bottom: 15px !important;
}

:global(.full-modal .ant-modal) {
  margin-top: 15px !important;
  margin-bottom: 15px !important;
  backdrop-filter: blur(100px) saturate(200%) !important;
  -webkit-backdrop-filter: blur(100px) saturate(200%) !important;
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

:global(.dark-mode-theme.ant-select-dropdown) {
  background-color: rgb(39, 39, 42) !important;
}

:global(.aero-mode-theme.ant-select-dropdown) {
  background-color: rgba(39, 39, 42, 0) !important;
  backdrop-filter: blur(100px) saturate(200%) !important;
  -webkit-backdrop-filter: blur(100px) saturate(200%) !important;
}

:global(.dark-mode-theme .ant-select-item-group) {
  color: rgb(161, 161, 170) !important;
}

:global(.aero-mode-theme .ant-select-item-group) {
  color: rgb(161, 161, 170) !important;
}

::v-deep(.dark-mode-theme .ant-select-selector) {
  background-color: rgb(31, 31, 31) !important;
  color: white !important;
  box-shadow: 0 0 0 1000px rgb(39, 39, 42) inset !important;
  border: 1px solid rgb(64, 64, 64) !important;
}

::v-deep(.aero-mode-theme .ant-select-selector) {
  background-color: rgba(31, 31, 31, 0) !important;
  color: white !important;
  box-shadow: 0 0 0 1000px rgba(255, 255, 255, 0) inset !important;
  border: 1px solid rgb(64, 64, 64, 50%) !important;
}

::v-deep(.dark-mode-theme .ant-select-item-option) {
  background-color: rgb(31, 31, 31) !important;
  color: white !important;
  box-shadow: 0 0 0 1000px rgb(39, 39, 42) inset !important;
  border: 1px solid rgb(64, 64, 64) !important;
}

::v-deep(.aero-mode-theme .ant-select-item-option) {
  background-color: rgb(31, 31, 31) !important;
  color: white !important;
  box-shadow: 0 0 0 1000px rgb(39, 39, 42) inset !important;
  border: 1px solid rgb(64, 64, 64) !important;
}

/* Extra Ant D Styles Overrides */
:global(.dark-mode-theme input) {
  background-color: rgb(39, 39, 42) !important;
  color: rgb(255, 255, 255) !important;
}

:global(.aero-mode-theme input) {
  background-color: rgba(0, 0, 0, 0) !important;
  color: rgb(255, 255, 255) !important;
}

:global(.white-mode-theme input::placeholder) {
  color: rgb(210, 210, 210) !important;
}

:global(.dark-mode-theme input::placeholder) {
  color: rgb(100, 100, 100) !important;
}

:global(.aero-mode-theme input::placeholder) {
  color: rgb(177, 177, 177) !important;
}

:global(.dark-mode-theme input:disabled) {
  color: rgb(66, 66, 66) !important;
  border: 1px solid rgb(53, 53, 53) !important;
}

:global(.aero-mode-theme input:disabled) {
  color: rgb(66, 66, 66) !important;
  border: 1px solid rgb(53, 53, 53, 0.5) !important;
}

::v-deep(.dark-mode-theme .ant-input-disabled) {
  color: rgb(66, 66, 66) !important;
  border: 0px solid rgb(53, 53, 53) !important;
}

::v-deep(.aero-mode-theme .ant-input-disabled) {
  color: rgb(66, 66, 66) !important;
  border: 1px solid rgb(53, 53, 53, 0.5) !important;
}

::v-deep(.dark-mode-theme .ant-pagination-item) {
  background-color: rgb(36, 36, 36) !important;
  color: rgb(255, 255, 255) !important;
}
::v-deep(.aero-mode-theme .ant-pagination-item) {
  background-color: rgba(36, 36, 36, 0.2) !important;
  color: rgb(255, 255, 255) !important;
}

::v-deep(.dark-mode-theme.ant-pagination .ant-pagination-item a) {
  color: white !important;
}

::v-deep(.aero-mode-theme.ant-pagination .ant-pagination-item a) {
  color: white !important;
}

::v-deep(.dark-mode-theme.ant-pagination .ant-pagination-item-link) {
  color: rgb(119, 119, 119) !important;
}

::v-deep(.aero-mode-theme.ant-pagination .ant-pagination-item-link) {
  color: rgb(119, 119, 119, 0.75) !important;
}

::v-deep(.dark-mode-theme.ant-pagination .ant-pagination-item-ellipsis) {
  color: rgb(119, 119, 119) !important;
}

::v-deep(.aero-mode-theme.ant-pagination .ant-pagination-item-ellipsis) {
  color: rgb(119, 119, 119, 0.75) !important;
}

:global(.dark-mode-theme .ant-input-password) {
  border: 1px solid rgb(53, 53, 53) !important;
}

:global(.dark-mode-theme .ant-input-password:hover) {
  border: 1px solid rgb(53, 53, 53) !important;
}

:global(.dark-mode-theme .ant-input-password:hover) {
  border: 1px solid rgb(78, 143, 255) !important;
}

:global(.aero-mode-theme .ant-input-password:hover) {
  border: 1px solid rgb(78, 143, 255) !important;
}

:global(.dark-mode-theme .ant-select-disabled .ant-select-selector) {
  color: rgb(66, 66, 66) !important;
  border: 1px solid rgb(53, 53, 53) !important;
}

:global(.aero-mode-theme .ant-select-disabled .ant-select-selector) {
  color: rgb(66, 66, 66) !important;
  border: 1px solid rgb(53, 53, 53) !important;
}

:global(.dark-mode-theme button:disabled) {
  color: rgb(66, 66, 66) !important;
  border: 1px solid rgb(53, 53, 53) !important;
}

:global(.aero-mode-theme button:disabled) {
  color: rgb(66, 66, 66) !important;
  border: 1px solid rgb(53, 53, 53, 0.5) !important;
}

:global(.white-mode-theme input:autofill) {
  background-color: transparent !important;
  box-shadow: 0 0 0 1000px rgb(255, 255, 255) inset !important;
  -webkit-text-fill-color: #000000 !important;
}

:global(.dark-mode-theme input:autofill) {
  background-color: transparent !important;
  box-shadow: 0 0 0 1000px rgb(39, 39, 42) inset !important;
  -webkit-text-fill-color: #fff !important;
}

:global(.aero-mode-theme input:autofill) {
  background-color: transparent !important;
  box-shadow: 0 0 0 1000px rgb(39, 39, 42) inset !important;
  -webkit-text-fill-color: #fff !important;
}

:global(.white-mode-theme input:autofill:hover) {
  box-shadow: 0 0 0 1000px rgb(255, 255, 255) inset !important;
}

:global(.dark-mode-theme input:autofill:hover) {
  box-shadow: 0 0 0 1000px rgb(39, 39, 42) inset !important;
}

:global(.aero-mode-theme input:autofill:hover) {
  box-shadow: 0 0 0 1000px rgb(39, 39, 42) inset !important;
}

:global(.ant-input-password) {
  background-color: rgba(0, 0, 0, 0) !important;
}

/* Media Queries Modal */
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
