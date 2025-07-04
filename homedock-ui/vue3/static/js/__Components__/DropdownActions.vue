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

        <div :class="['transition-all duration-300 ease-out relative overflow-hidden flex items-center rounded-md !m-2 px-2 py-0.5 cursor-pointer hover:ring-[1px] group', uninstallConfirmState === 0 ? themeClasses.uninstallAction : '', uninstallConfirmState === 1 ? themeClasses.uninstallAction + ' saturate-200 animate-pulse' : '', uninstallConfirmState === 2 ? themeClasses.uninstallAction + ' saturate-200 scale-110 animate-pulse py-1.5' : '']" @click="handleUninstallClick()">
          <div class="flex items-center justify-center whitespace-nowrap will-change-transform">
            <Icon :icon="uninstallIcon" :class="['transition-transform duration-300 flex-shrink-0 mr-2', uninstallConfirmState ? 'group-hover:rotate-12' : '', uninstallConfirmState >= 1 ? 'animate-pulse' : '']" />
            <span class="text-sm font-medium transition-all duration-300 overflow-hidden">
              <Transition name="text-fade" mode="out-in">
                <span :key="uninstallConfirmState">
                  {{ getUninstallButtonText() }}
                </span>
              </Transition>
            </span>
          </div>
        </div>
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
import { computed, ref, onUnmounted } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import { AxiosError } from "axios";

import { Dropdown, Menu, Button } from "ant-design-vue";
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
const uninstallConfirmState = ref(0);
let uninstallConfirmTimeout: NodeJS.Timeout | null = null;

const store = useSelectedAppsStore();
const selectedApps = computed(() => store.selectedApps);

const props = defineProps<{ csrfToken: string }>();

const getUninstallButtonText = () => {
  switch (uninstallConfirmState.value) {
    case 0:
      return "Uninstall";
    case 1:
      return "Confirm?";
    case 2:
      return "Are you sure?!";
    default:
      return "Uninstall";
  }
};

const handleUninstallClick = () => {
  if (uninstallConfirmState.value === 0) {
    startUninstallConfirmation();
  } else if (uninstallConfirmState.value === 1) {
    proceedToFinalConfirmation();
  } else if (uninstallConfirmState.value === 2) {
    confirmUninstall();
  }
};

const startUninstallConfirmation = () => {
  if (selectedApps.value.length === 0) {
    return;
  }

  if (uninstallConfirmTimeout) {
    clearTimeout(uninstallConfirmTimeout);
  }

  uninstallConfirmState.value = 1;

  uninstallConfirmTimeout = setTimeout(() => {
    cancelUninstallConfirmation();
  }, 3500);
};

const proceedToFinalConfirmation = () => {
  if (uninstallConfirmTimeout) {
    clearTimeout(uninstallConfirmTimeout);
  }

  uninstallConfirmState.value = 2;

  uninstallConfirmTimeout = setTimeout(() => {
    cancelUninstallConfirmation();
  }, 2000);
};

const cancelUninstallConfirmation = () => {
  uninstallConfirmState.value = 0;
  if (uninstallConfirmTimeout) {
    clearTimeout(uninstallConfirmTimeout);
    uninstallConfirmTimeout = null;
  }
};

const confirmUninstall = async () => {
  if (uninstallConfirmTimeout) {
    clearTimeout(uninstallConfirmTimeout);
    uninstallConfirmTimeout = null;
  }

  uninstallConfirmState.value = 0;
  await handleUninstallSelectedApps();
};

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

onUnmounted(() => {
  if (uninstallConfirmTimeout) {
    clearTimeout(uninstallConfirmTimeout);
  }
});
</script>

<style>
.ant-dropdown {
  backdrop-filter: blur(100px) saturate(200%);
  -webkit-backdrop-filter: blur(100px) saturate(100%);
  border-radius: 8px !important;
}

.text-fade-enter-active,
.text-fade-leave-active {
  transition: opacity 0.1s ease;
}

.text-fade-enter-from,
.text-fade-leave-to {
  opacity: 0;
}
</style>
