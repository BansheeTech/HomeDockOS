<!-- homedock-ui/vue3/static/js/__Components__/AppStoreAppCard.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template>
  <div :class="[themeClasses.storeContMainer]" class="app-grid-item relative flex-1 border rounded-2xl p-3 shadow-sm transition-shadow duration-300 hover:shadow-lg group">
    <div class="app-header flex items-center gap-3 relative">
      <BaseImage @click="onInstall(app)" draggable="false" :src="app.picture_path || 'default-image-path.png'" alt="App Icon" class="app-icon w-12 h-12 rounded-xl drop-shadow-md ring-[1px] ring-gray-500/10" />
      <Icon v-if="installationStore.currentlyInstalling === app.name" :icon="loadingIcon" :class="[themeClasses.storeIconLoadingInstalling]" class="absolute rounded-full top-1 left-1 w-10 h-10 text-current animate-spin" />

      <div class="flex flex-col overflow-hidden w-full">
        <h3 :class="[themeClasses.storeCardTextAppName]" class="app-name font-semibold text-xs">
          {{ app.name }}
        </h3>
        <div class="relative">
          <h4 :class="[themeClasses.storeTypeScope]" class="app-docker_image font-normal truncate text-xs will-change-transform transition duration-500 group-hover:opacity-0 group-hover:-translate-y-2">
            {{ app.type }}
          </h4>
          <h5 :class="[themeClasses.storeCardTextRepo]" class="app-type font-normal text-xs absolute top-0 left-0 right-0 opacity-0 will-change-transform transition duration-500 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 truncate ellipsis">
            {{ app.docker_image }}
          </h5>
        </div>
      </div>
    </div>

    <hr :class="[themeClasses.storeSeparator]" class="border-0 h-px mt-2" />

    <div :class="[themeClasses.storeDescription]" class="app-shortdesc flex items-center leading-3 py-2 px-2 h-14 text-[12px] mt-2 text-balance rounded-xl">
      {{ app.description }}
    </div>

    <div v-if="isNew(app)" class="app-new-badge absolute top-2 left-11 p-1 rounded-3xl bg-blue-500 border-[1px] border-gray-100 animate-bounce">
      <span class="flex items-center"><Icon :icon="newBoxIcon" class="text-current text-white" /></span>
    </div>

    <Transition name="button-fade" mode="out-in">
      <!-- Installed -->
      <Button v-if="app.is_installed" key="installed" type="default" size="small" block :class="[themeClasses.storeCardInstalled]" class="app-installed items-center mt-2 !text-center !rounded-2xl px-2 py-1 flex items-center justify-center" @click="onInstall(app)">
        <Icon :icon="checkBoldIcon" class="mr-1 text-current" />
        Installed
      </Button>

      <!-- Installing -->
      <Button v-else-if="installationStore.currentlyInstalling === app.name" key="installing" type="default" size="small" block :class="[themeClasses.storeCardInstalling]" class="app-installing items-center mt-2 !text-center !rounded-2xl px-2 py-1 flex items-center justify-center" @click="onInstall(app)">
        <Icon :icon="loadingIcon" class="mr-1 text-current animate-spin" />
        Installing...
      </Button>

      <!-- Queued -->
      <Button v-else-if="installationStore.queue.includes(app.name)" key="queued" type="default" size="small" block :class="[themeClasses.storeCardQueued]" class="app-queued items-center mt-2 !text-center !rounded-2xl px-2 py-1 flex items-center justify-center" @click="onInstall(app)">
        <Icon :icon="queueIcon" class="mr-1 text-current" />
        Queued
      </Button>

      <!-- Install / Default -->
      <Button v-else type="primary" size="small" block key="install" :class="[themeClasses.storeCardInstall]" class="app-install items-center mt-2 !text-center !rounded-2xl px-2 py-1 flex items-center justify-center" @click="onInstall(app)">
        <Icon :icon="chevronDoubleDownIcon" class="mr-1 text-current" />
        Install
      </Button>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { useTheme } from "../__Themes__/ThemeSelector";

import { useInstallationStore } from "../__Stores__/useInstallationStore";

import { Button } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import newBoxIcon from "@iconify-icons/mdi/new-box";
import checkBoldIcon from "@iconify-icons/mdi/check-bold";
import chevronDoubleDownIcon from "@iconify-icons/mdi/chevron-double-down";
import loadingIcon from "@iconify-icons/mdi/loading";
import queueIcon from "@iconify-icons/mdi/queue";

import { App } from "../__Types__/AppStoreApp";

import BaseImage from "../__Components__/BaseImage.vue";

const { themeClasses } = useTheme();

const installationStore = useInstallationStore();

const props = defineProps<{
  app: App;
  onInstall: (app: App) => void;
}>();

const isNew = (app: App) => {
  if (!app.is_new) return false;

  if (typeof app.new_until === "boolean") {
    return app.new_until;
  }

  if (typeof app.new_until === "string") {
    const today = new Date().toISOString().slice(0, 10);
    return new Date(app.new_until) >= new Date(today);
  }

  return false;
};
</script>

<style scoped>
/* Transitions */
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

.app-icon {
  transition: all 300ms cubic-bezier(0, 1.7, 1, 1.7);
  cursor: pointer;
}

.app-icon:hover {
  scale: 1.2;
  border-radius: 24px;
}

.app-install,
.app-installed,
.app-installing,
.app-queued {
  transition: all 300ms cubic-bezier(0, 1.7, 1, 1.7);
}

.app-install:hover,
.app-installed:hover,
.app-installing:hover,
.app-queued:hover {
  letter-spacing: 0.1em !important;
}
</style>
