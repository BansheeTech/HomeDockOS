<!-- homedock-ui/vue3/static/js/__Components__/DropdownActions.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template>
  <Dropdown v-model:open="dropdownVisible" overlayClassName="z-0" :arrow="false" placement="bottomRight" :trigger="['click']">
    <template #overlay>
      <Menu :class="[themeClasses.actionMenu]" class="space-y-1 w-40">
        <div :class="[themeClasses.startAction]" class="flex items-center rounded-md !m-2 px-2 py-0.5 cursor-pointer hover:ring-[1px] transition duration-300" @click="handleStartSelectedApps">
          <span class="flex items-center"> <Icon :icon="playIcon" class="mr-2" /> Start </span>
        </div>
        <div :class="[themeClasses.stopAction]" class="flex items-center rounded-md !m-2 px-2 py-0.5 cursor-pointer hover:ring-[1px] transition duration-300" @click="handleStopSelectedApps">
          <span class="flex items-center"> <Icon :icon="stopIcon" class="mr-2" /> Stop </span>
        </div>
        <div :class="[themeClasses.restartAction]" class="flex items-center rounded-md !m-2 px-2 py-0.5 cursor-pointer hover:ring-[1px] transition duration-300" @click="handleRestartSelectedApps">
          <span class="flex items-center"> <Icon :icon="restartIcon" class="mr-2" /> Restart </span>
        </div>
        <div :class="[themeClasses.hrSelector]"></div>
        <div :class="[themeClasses.pauseAction]" class="flex items-center rounded-md !m-2 px-2 py-0.5 cursor-pointer hover:ring-[1px] transition duration-300" @click="handlePauseSelectedApps">
          <span class="flex items-center"> <Icon :icon="pauseIcon" class="mr-2" /> Pause </span>
        </div>
        <div :class="[themeClasses.unpauseAction]" class="flex items-center rounded-md !m-2 px-2 py-0.5 cursor-pointer hover:ring-[1px] transition duration-300" @click="handleUnpauseSelectedApps">
          <span class="flex items-center"> <Icon :icon="unpauseIcon" class="mr-2" /> Unpause </span>
        </div>
        <div :class="[themeClasses.hrSelector]"></div>
        <Popconfirm v-model:open="popconfirmVisible" overlayClassName="w-56 select-none" :color="themeClasses.uninstallPopconfirm" placement="bottom" ok-text="Yes" cancel-text="Cancel" @confirm="handleConfirm" :getPopupContainer="getPopconfirmContainer">
          <template #title>
            <p :class="[themeClasses.uninstallPopconfirmTextUp]">Uninstall applications?</p>
          </template>
          <template #description>
            <p :class="[themeClasses.uninstallPopconfirmTextDown]">The selected apps will be permanently deleted. Do you want to proceed?</p>
          </template>
          <template #icon>
            <Icon :icon="uninstallIcon" class="text-red-600 animate-pulse" width="20" height="20" />
          </template>
          <div :class="[themeClasses.uninstallAction]" class="flex items-center rounded-md !m-2 px-2 py-0.5 cursor-pointer hover:ring-[1px] transition duration-300">
            <span class="flex items-center"> <Icon :icon="uninstallIcon" class="mr-2" /> Uninstall </span>
          </div>
        </Popconfirm>
        <div :class="[themeClasses.hrSelector]"></div>
        <div :class="[themeClasses.updateAction]" class="flex items-center rounded-md !m-2 px-2 py-0.5 cursor-pointer hover:ring-[1px] transition duration-300" @click="handleUpdateSelectedApps">
          <span class="flex items-center"> <Icon :icon="updateIcon" class="mr-2" /> Update </span>
        </div>
      </Menu>
    </template>
    <Button :class="[themeClasses.actionButton]" class="btn-dropdown flex items-center h-9"><Icon :icon="menu1Icon" class="mr-2" /> Actions <Icon :icon="menu2Icon" class="ml-2" /></Button>
  </Dropdown>
</template>

<script lang="ts" setup>
import { computed, h, ref } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import { AxiosError } from "axios";

import { Dropdown, Menu, Button, Popconfirm } from "ant-design-vue";
import { notifyError } from "../__Components__/Notifications.vue";

import { useSelectedAppsStore } from "../__Stores__/selectedAppsStore";

import { startContainers } from "../__Services__/DockerAPIStartContainerService";
import { stopContainers } from "../__Services__/DockerAPIStopContainerService";
import { restartContainers } from "../__Services__/DockerAPIRestartContainerService";
import { pauseContainers } from "../__Services__/DockerAPIPauseContainerService";
import { unpauseContainers } from "../__Services__/DockerAPIUnpauseContainerService";
import { uninstallContainers } from "../__Services__/DockerAPIUninstallContainerService";
import { updateContainers } from "../__Services__/DockerAPIUpdateContainerService";

import { Icon } from "@iconify/vue";
import playIcon from "@iconify-icons/mdi/play";
import stopIcon from "@iconify-icons/mdi/stop";
import restartIcon from "@iconify-icons/mdi/restart";
import pauseIcon from "@iconify-icons/mdi/cog-pause";
import unpauseIcon from "@iconify-icons/mdi/cog-play";
import uninstallIcon from "@iconify-icons/mdi/delete-alert";
import updateIcon from "@iconify-icons/mdi/shape-circle-plus";
import menu1Icon from "@iconify-icons/mdi/dots-square";
import menu2Icon from "@iconify-icons/mdi/menu-down";

const { themeClasses } = useTheme();

const dropdownVisible = ref(false);
const popconfirmVisible = ref(false);

const store = useSelectedAppsStore();
const selectedApps = computed(() => store.selectedApps);

const props = defineProps<{ csrfToken: string }>();

// Weirdo duplicated Popconfirm behaviour on Dropdown not gonnna send an issue
function getPopconfirmContainer(trigger: HTMLElement): HTMLElement {
  const container = trigger.parentNode;
  if (container instanceof HTMLElement) {
    return container;
  }
  console.warn("Fallback to document.body");
  return document.body;
}

// Start App
async function handleStartSelectedApps() {
  try {
    const appsToProcess = [...selectedApps.value];

    store.clearSelection();
    dropdownVisible.value = false;

    for (const appName of appsToProcess) {
      const app = store.applications.find((app) => app.name === appName);

      if (app?.status !== "exited") {
        continue;
      }

      try {
        store.setProcessing(appName, true);
        await startContainers(store.applications, appName, props.csrfToken);
      } catch (error) {
        if (error instanceof AxiosError) {
          notifyError(error, themeClasses.value.scopeSelector);
        }
      } finally {
        store.setProcessing(appName, false);
      }
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      notifyError(error, themeClasses.value.scopeSelector);
    }
  }
}

// Stop App
async function handleStopSelectedApps() {
  try {
    const appsToProcess = [...selectedApps.value];

    store.clearSelection();
    dropdownVisible.value = false;

    for (const appName of appsToProcess) {
      const app = store.applications.find((app) => app.name === appName);

      if (app?.status !== "running") {
        continue;
      }

      try {
        store.setProcessing(appName, true);
        await stopContainers(store.applications, appName, props.csrfToken);
      } catch (error) {
        if (error instanceof AxiosError) {
          notifyError(error, themeClasses.value.scopeSelector);
        }
      } finally {
        store.setProcessing(appName, false);
      }
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      notifyError(error, themeClasses.value.scopeSelector);
    }
  }
}

// Restart App
async function handleRestartSelectedApps() {
  try {
    const appsToProcess = [...selectedApps.value];

    store.clearSelection();
    dropdownVisible.value = false;

    for (const appName of appsToProcess) {
      try {
        store.setProcessing(appName, true);
        await restartContainers(store.applications, appName, props.csrfToken);
      } catch (error) {
        if (error instanceof AxiosError) {
          notifyError(error, themeClasses.value.scopeSelector);
        }
      } finally {
        store.setProcessing(appName, false);
      }
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      notifyError(error, themeClasses.value.scopeSelector);
    }
  }
}

// Pause App
async function handlePauseSelectedApps() {
  try {
    const appsToProcess = [...selectedApps.value];

    store.clearSelection();
    dropdownVisible.value = false;

    for (const appName of appsToProcess) {
      const app = store.applications.find((app) => app.name === appName);

      if (app?.status !== "running") {
        continue;
      }

      try {
        store.setProcessing(appName, true);
        await pauseContainers(store.applications, appName, props.csrfToken);
      } catch (error) {
        if (error instanceof AxiosError) {
          notifyError(error, themeClasses.value.scopeSelector);
        }
      } finally {
        store.setProcessing(appName, false);
      }
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      notifyError(error, themeClasses.value.scopeSelector);
    }
  }
}

// Unpause App
async function handleUnpauseSelectedApps() {
  try {
    const appsToProcess = [...selectedApps.value];

    store.clearSelection();
    dropdownVisible.value = false;

    for (const appName of appsToProcess) {
      const app = store.applications.find((app) => app.name === appName);

      if (app?.status !== "paused") {
        continue;
      }

      try {
        store.setProcessing(appName, true);
        await unpauseContainers(store.applications, appName, props.csrfToken);
      } catch (error) {
        if (error instanceof AxiosError) {
          notifyError(error, themeClasses.value.scopeSelector);
        }
      } finally {
        store.setProcessing(appName, false);
      }
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      notifyError(error, themeClasses.value.scopeSelector);
    }
  }
}

// Uninstall App
async function handleUninstallSelectedApps() {
  try {
    const appsToProcess = [...selectedApps.value];

    store.clearSelection();
    dropdownVisible.value = false;

    for (const appName of appsToProcess) {
      try {
        store.setProcessing(appName, true);
        await uninstallContainers(store.applications, appName, props.csrfToken);
      } catch (error) {
        if (error instanceof AxiosError) {
          notifyError(error, themeClasses.value.scopeSelector);
        }
      } finally {
        store.setProcessing(appName, false);
      }
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      notifyError(error, themeClasses.value.scopeSelector);
    }
  }
}

// Update App
async function handleUpdateSelectedApps() {
  try {
    const appsToProcess = [...selectedApps.value];

    store.clearSelection();
    dropdownVisible.value = false;

    for (const appName of appsToProcess) {
      try {
        store.setProcessing(appName, true);
        await updateContainers(store.applications, appName, props.csrfToken);
      } catch (error) {
        if (error instanceof AxiosError) {
          notifyError(error, themeClasses.value.scopeSelector);
        }
      } finally {
        store.setProcessing(appName, false);
      }
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      notifyError(error, themeClasses.value.scopeSelector);
    }
  }
}

// Uninstall Popconfirm
function handleConfirm() {
  popconfirmVisible.value = false;
  handleUninstallSelectedApps();
}
</script>

<style>
.ant-dropdown {
  backdrop-filter: blur(100px) saturate(200%);
  -webkit-backdrop-filter: blur(100px) saturate(100%);
  border-radius: 8px !important;
}
</style>
