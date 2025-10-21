<!-- homedock-ui/vue3/static/js/__Apps__/AppProperties.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="properties-app flex flex-col h-full overflow-hidden" :class="[themeClasses.scopeSelector]">
    <div class="flex-1 overflow-auto">
      <div v-if="app" class="flex flex-col">
        <div class="hero-section" :class="[themeClasses.aeroExtraScope, themeClasses.appPropsHeroBorder]">
          <div class="hero-gradient"></div>
          <div class="relative flex items-center gap-5 px-6 py-6">
            <div class="app-icon-container" :class="getContainerClasses(app)">
              <BaseImage :src="app.image_path" alt="App Icon" class="app-icon rounded-xl" draggable="false" />
            </div>
            <div class="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
              <h2 class="text-2xl font-bold m-0 leading-tight" :class="[themeClasses.notTextUp]">{{ app.display_name || app.name }}</h2>
              <p class="text-sm opacity-70 m-0 overflow-hidden text-ellipsis whitespace-nowrap" :class="[themeClasses.notTextDown]">{{ app.image }}</p>
              <div :class="[...getStatusClasses(app.statusColor), 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border w-fit']">
                <div :class="[getStatusDotClasses(app.status), 'w-1.5 h-1.5 rounded-full shadow-[0_0_6px_currentColor]', { 'animate-[pulse-success_2s_cubic-bezier(0.4,0,0.6,1)_infinite]': app.status === 'running' }]"></div>
                <span class="text-[11px] font-semibold uppercase tracking-wide">{{ app.status }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-1.5 px-4 py-1.5" :class="[themeClasses.appPropsTabsContainerBg, themeClasses.appPropsTabsContainerBorder]">
          <button class="flex items-center gap-2 px-4 py-2 border-none text-xs font-semibold cursor-pointer transition-all duration-300 relative rounded-lg shadow-sm hover:shadow-md" :class="[themeClasses.appPropsTabButton, themeClasses.appPropsTabButtonBg, activeTab === 'general' ? themeClasses.appPropsTabButtonActiveBorder : themeClasses.appPropsTabButtonBorder, themeClasses.appPropsTabButtonHover, { [themeClasses.appPropsTabButtonActive]: activeTab === 'general' }]" @click="activeTab = 'general'">
            <Icon :icon="infoIcon" width="15" height="15" />
            <span>General</span>
          </button>
          <button class="flex items-center gap-2 px-4 py-2 border-none text-xs font-semibold cursor-pointer transition-all duration-300 relative rounded-lg shadow-sm hover:shadow-md" :class="[themeClasses.appPropsTabButton, themeClasses.appPropsTabButtonBg, activeTab === 'actions' ? themeClasses.appPropsTabButtonActiveBorder : themeClasses.appPropsTabButtonBorder, themeClasses.appPropsTabButtonHover, { [themeClasses.appPropsTabButtonActive]: activeTab === 'actions' }]" @click="activeTab = 'actions'">
            <Icon :icon="cogIcon" width="15" height="15" />
            <span>Actions</span>
          </button>
        </div>

        <div class="p-6">
          <Transition name="tab-fade" mode="out-in">
            <div v-if="activeTab === 'general'" key="general" class="flex flex-col gap-4">
              <div class="grid md:grid-cols-2 grid-cols-1 gap-3">
                <div class="rounded-[10px] px-3.5 py-3 transition-all duration-200" :class="[themeClasses.appPropsUsageCardBg, themeClasses.appPropsUsageCardBorder, themeClasses.appPropsUsageCardBgHover, themeClasses.appPropsUsageCardBorderHover, themeClasses.aeroExtraScope]">
                  <div class="flex items-center gap-2 mb-2.5">
                    <Icon :icon="cpuIcon" width="20" height="20" :class="[themeClasses.appPropsCardHeaderIcon]" />
                    <span class="text-[15px] font-semibold m-0" :class="[themeClasses.appPropsCardHeaderText]">CPU</span>
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <span class="text-xl font-bold leading-none" :class="[themeClasses.appPropsInfoValue]">{{ app.usagePercent }}%</span>
                    <div class="w-full h-1.5 rounded-full overflow-hidden" :class="[themeClasses.appPropsProgressBarBg]">
                      <div class="h-full rounded-full transition-[width] duration-300" :style="{ width: `${app.usagePercent}%` }" :class="app.usagePercent >= 80 ? themeClasses.appPropsProgressBarFillCritical : app.usagePercent >= 50 ? themeClasses.appPropsProgressBarFillWarning : themeClasses.appPropsProgressBarFillNormal"></div>
                    </div>
                  </div>
                </div>

                <div class="rounded-[10px] px-3.5 py-3 transition-all duration-200" :class="[themeClasses.appPropsUsageCardBg, themeClasses.appPropsUsageCardBorder, themeClasses.appPropsUsageCardBgHover, themeClasses.appPropsUsageCardBorderHover, themeClasses.aeroExtraScope]">
                  <div class="flex items-center gap-2 mb-2.5">
                    <Icon :icon="memoryIcon" width="20" height="20" :class="[themeClasses.appPropsCardHeaderIcon]" />
                    <span class="text-[15px] font-semibold m-0" :class="[themeClasses.appPropsCardHeaderText]">RAM</span>
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <span class="text-xl font-bold leading-none" :class="[themeClasses.appPropsInfoValue]">{{ app.memoryUsagePercent }}%</span>
                    <div class="w-full h-1.5 rounded-full overflow-hidden" :class="[themeClasses.appPropsProgressBarBg]">
                      <div class="h-full rounded-full transition-[width] duration-300" :style="{ width: `${app.memoryUsagePercent}%` }" :class="app.memoryUsagePercent >= 80 ? themeClasses.appPropsProgressBarFillCritical : app.memoryUsagePercent >= 50 ? themeClasses.appPropsProgressBarFillWarning : themeClasses.appPropsProgressBarFillNormal"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="rounded-[10px] px-3.5 py-3 transition-all duration-200" :class="[themeClasses.appPropsUsageCardBg, themeClasses.appPropsUsageCardBorder, themeClasses.appPropsUsageCardBgHover, themeClasses.appPropsUsageCardBorderHover, themeClasses.aeroExtraScope]">
                <div class="flex items-center gap-2 mb-2.5">
                  <Icon :icon="networkIcon" width="20" height="20" :class="[themeClasses.appPropsCardHeaderIcon]" />
                  <span class="text-[15px] font-semibold m-0" :class="[themeClasses.appPropsCardHeaderText]">Network</span>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div class="flex items-center gap-2">
                    <Icon :icon="downloadIcon" width="20" height="20" :class="[themeClasses.appPropsCardHeaderIcon]" />
                    <span class="text-sm font-bold" :class="[themeClasses.appPropsInfoValue]">{{ formatBytes(app.networkRxBytes) }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <Icon :icon="uploadIcon" width="20" height="20" :class="[themeClasses.appPropsCardHeaderIcon]" />
                    <span class="text-sm font-bold" :class="[themeClasses.appPropsInfoValue]">{{ formatBytes(app.networkTxBytes) }}</span>
                  </div>
                </div>
              </div>

              <div class="rounded-[10px] px-3.5 py-3 transition-all duration-200" :class="[themeClasses.appPropsUsageCardBg, themeClasses.appPropsUsageCardBorder, themeClasses.appPropsUsageCardBgHover, themeClasses.appPropsUsageCardBorderHover, themeClasses.aeroExtraScope]">
                <div class="flex items-center gap-2 mb-2.5">
                  <Icon :icon="accesPointNetworkIcon" width="20" height="20" :class="[themeClasses.appPropsCardHeaderIcon]" />
                  <span class="text-[15px] font-semibold m-0" :class="[themeClasses.appPropsCardHeaderText]">Access & Ports</span>
                </div>
                <div class="flex flex-col">
                  <div class="flex justify-between items-start gap-4 py-1.5" :class="[themeClasses.appPropsInfoRowBorder]">
                    <span class="text-xs font-medium flex-shrink-0" :class="[themeClasses.appPropsInfoLabel]">Host</span>
                    <span class="text-xs font-medium text-right break-all" :class="[themeClasses.appPropsInfoValue]">{{ app.host }}</span>
                  </div>
                  <div class="flex flex-col items-stretch gap-1.5 py-1.5" :class="[themeClasses.appPropsInfoRowBorder]">
                    <span class="text-xs font-medium flex-shrink-0" :class="[themeClasses.appPropsInfoLabel]">Ports</span>
                    <div class="w-full text-left">
                      <PortRouter :key="app.ports.join(':')" :containerId="app.name" :initialPorts="app.ports.join(':')" @update="handlePortsUpdate" />
                    </div>
                  </div>
                  <div v-if="app.service_url" class="flex items-center gap-4 py-1.5 border-b-0" :class="[themeClasses.appPropsInfoRowBorder]">
                    <a :href="app.service_url" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-xs font-medium transition-colors duration-200 hover:opacity-70" :class="[themeClasses.appPropsInfoLink, themeClasses.appPropsInfoLinkHover]" :title="app.service_url">
                      <span>Access</span>
                      <Icon :icon="openIcon" width="14" height="14" />
                    </a>
                  </div>
                </div>
              </div>

              <div v-if="showConfiguration" class="rounded-[10px] px-3.5 py-3 transition-all duration-200" :class="[themeClasses.appPropsUsageCardBg, themeClasses.appPropsUsageCardBorder, themeClasses.appPropsUsageCardBgHover, themeClasses.appPropsUsageCardBorderHover, themeClasses.aeroExtraScope]">
                <div class="flex items-center gap-2 mb-2.5">
                  <Icon :icon="settingsIcon" width="20" height="20" :class="[themeClasses.appPropsCardHeaderIcon]" />
                  <span class="text-[15px] font-semibold m-0" :class="[themeClasses.appPropsCardHeaderText]">Configuration</span>
                </div>
                <div class="flex flex-col">
                  <div v-if="app.HDGroup" class="flex justify-between items-start gap-4 py-1.5" :class="[themeClasses.appPropsInfoRowBorder]">
                    <span class="text-xs font-medium flex-shrink-0" :class="[themeClasses.appPropsInfoLabel]">Group</span>
                    <span class="text-xs font-medium text-right break-all" :class="[themeClasses.appPropsInfoValue]">{{ app.HDGroup }}</span>
                  </div>
                  <div v-if="app.HDRole === 'dependency'" class="flex justify-between items-start gap-4 py-1.5" :class="[themeClasses.appPropsInfoRowBorder]">
                    <span class="text-xs font-medium flex-shrink-0" :class="[themeClasses.appPropsInfoLabel]">Role</span>
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border" :class="[themeClasses.appPropsBadgeDependency]">Dependency</span>
                  </div>
                  <div v-if="groupContainers.length > 0" class="flex justify-between items-start gap-4 py-1.5" :class="[themeClasses.appPropsInfoRowBorder]">
                    <span class="text-xs font-medium flex-shrink-0" :class="[themeClasses.appPropsInfoLabel]">Group Containers</span>
                    <span class="text-xs font-medium text-right break-all" :class="[themeClasses.appPropsInfoValue]">{{ groupContainers.length + 1 }} containers</span>
                  </div>
                  <div v-if="groupContainers.length > 0" class="flex justify-between items-start gap-4 py-1.5 border-b-0" :class="[themeClasses.appPropsInfoRowBorder]">
                    <span class="text-xs font-medium flex-shrink-0" :class="[themeClasses.appPropsInfoLabel]">Related</span>
                    <div class="flex flex-col gap-0.5 flex-1">
                      <div v-for="container in groupContainers" :key="container.id" class="flex items-center gap-1.5" :class="[themeClasses.appPropsInfoValue]">
                        <Icon :icon="containerIcon" width="12" height="12" />
                        <span class="text-xs">{{ container.name }}</span>
                        <span class="text-[10px] opacity-60">({{ container.status }})</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="activeTab === 'actions'" key="actions" class="flex flex-col gap-4">
              <div class="flex flex-col gap-4">
                <h3 class="text-sm font-semibold uppercase tracking-wide m-0" :class="[themeClasses.appPropsSectionTitle]">Quick Actions</h3>
                <div class="grid md:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] grid-cols-1 gap-3">
                  <button v-if="app.status === 'exited' || app.status === 'created'" class="flex items-center justify-center gap-2.5 px-6 py-4 rounded-[10px] text-sm font-medium cursor-pointer transition-all duration-200 border hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed" :class="[themeClasses.appPropsActionButtonPrimaryBg, themeClasses.appPropsActionButtonPrimaryBorder, themeClasses.appPropsActionButtonPrimaryText, themeClasses.appPropsActionButtonPrimaryBgHover, themeClasses.appPropsActionButtonPrimaryBorderHover, themeClasses.aeroExtraScope]" @click="handleStart" :disabled="isProcessing">
                    <Icon :icon="isStarting ? loadingIcon : playIcon" width="20" height="20" :class="{ 'animate-spin': isStarting }" />
                    <span>Start Application</span>
                  </button>

                  <button v-if="app.status === 'running'" class="flex items-center justify-center gap-2.5 px-6 py-4 rounded-[10px] text-sm font-medium cursor-pointer transition-all duration-200 border hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed" :class="[themeClasses.appPropsActionButtonDangerBg, themeClasses.appPropsActionButtonDangerBorder, themeClasses.appPropsActionButtonDangerText, themeClasses.appPropsActionButtonDangerBgHover, themeClasses.appPropsActionButtonDangerBorderHover, themeClasses.aeroExtraScope]" @click="handleStop" :disabled="isProcessing">
                    <Icon :icon="isStopping ? loadingIcon : stopIcon" width="20" height="20" :class="{ 'animate-spin': isStopping }" />
                    <span>Stop Application</span>
                  </button>

                  <button v-if="app.status === 'paused'" class="flex items-center justify-center gap-2.5 px-6 py-4 rounded-[10px] text-sm font-medium cursor-pointer transition-all duration-200 border hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed" :class="[themeClasses.appPropsActionButtonPrimaryBg, themeClasses.appPropsActionButtonPrimaryBorder, themeClasses.appPropsActionButtonPrimaryText, themeClasses.appPropsActionButtonPrimaryBgHover, themeClasses.appPropsActionButtonPrimaryBorderHover, themeClasses.aeroExtraScope]" @click="handleUnpause" :disabled="isProcessing">
                    <Icon :icon="isUnpausing ? loadingIcon : unpauseIcon" width="20" height="20" :class="{ 'animate-spin': isUnpausing }" />
                    <span>Unpause Application</span>
                  </button>

                  <button v-if="app.status === 'running'" class="flex items-center justify-center gap-2.5 px-6 py-4 rounded-[10px] text-sm font-medium cursor-pointer transition-all duration-200 border hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed" :class="[themeClasses.appPropsActionButtonBg, themeClasses.appPropsActionButtonBorder, themeClasses.appPropsActionButtonText, themeClasses.appPropsActionButtonBgHover, themeClasses.appPropsActionButtonBorderHover, themeClasses.aeroExtraScope]" @click="handleRestart" :disabled="isProcessing">
                    <Icon :icon="isRestarting ? loadingIcon : restartIcon" width="20" height="20" :class="{ 'animate-spin': isRestarting }" />
                    <span>Restart Application</span>
                  </button>

                  <button v-if="app.status === 'running'" class="flex items-center justify-center gap-2.5 px-6 py-4 rounded-[10px] text-sm font-medium cursor-pointer transition-all duration-200 border hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed" :class="[themeClasses.appPropsActionButtonBg, themeClasses.appPropsActionButtonBorder, themeClasses.appPropsActionButtonText, themeClasses.appPropsActionButtonBgHover, themeClasses.appPropsActionButtonBorderHover, themeClasses.aeroExtraScope]" @click="handlePause" :disabled="isProcessing">
                    <Icon :icon="isPausing ? loadingIcon : pauseIcon" width="20" height="20" :class="{ 'animate-spin': isPausing }" />
                    <span>Pause Application</span>
                  </button>
                </div>
              </div>

              <div v-if="app.service_url && app.status === 'running'" class="flex flex-col gap-4">
                <h3 class="text-sm font-semibold uppercase tracking-wide m-0" :class="[themeClasses.appPropsSectionTitle]">Application</h3>
                <div class="flex flex-col gap-2">
                  <button class="flex items-center gap-4 px-5 py-4 rounded-[10px] cursor-pointer transition-all duration-200 text-left border hover:translate-x-1 disabled:opacity-50 disabled:cursor-not-allowed" :class="[themeClasses.appPropsActionListItemBg, themeClasses.appPropsActionListItemBorder, themeClasses.appPropsActionListItemText, themeClasses.appPropsActionListItemBgHover, themeClasses.appPropsActionListItemBorderHover, themeClasses.aeroExtraScope]" @click="handleOpenUrl">
                    <Icon :icon="openIcon" width="20" height="20" />
                    <div class="flex-1 flex flex-col gap-1 min-w-0">
                      <span class="text-sm font-semibold" :class="[themeClasses.appPropsInfoValue]">Open Application</span>
                      <span class="text-xs opacity-70" :class="[themeClasses.appPropsInfoLabel]">Launch app in new tab</span>
                    </div>
                    <Icon :icon="chevronRightIcon" width="16" height="16" :class="[themeClasses.appPropsInfoLabel]" />
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <div v-else class="flex flex-col items-center justify-center h-full gap-4 px-6 py-12">
        <Icon :icon="alertIcon" width="64" height="64" class="opacity-30" />
        <h3 class="text-xl font-semibold m-0" :class="[themeClasses.notTextUp]">No Data Available</h3>
        <p class="text-sm opacity-60 m-0" :class="[themeClasses.notTextDown]">Application data could not be loaded</p>
      </div>
    </div>

    <StatusBar v-if="app" :icon="infoIcon" message="Properties" :info="`Viewing ${app.display_name || app.name}`" :showHelp="true">
      <template #help>
        <div class="space-y-2.5 max-w-sm">
          <div class="flex items-center gap-2">
            <Icon :icon="infoIcon" :class="['w-5 h-5', themeClasses.statusBarIcon]" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">Properties</h4>
          </div>

          <div :class="['text-[10px] md:text-xs space-y-2 leading-relaxed', themeClasses.statusBarInfo]">
            <p>View detailed information about your application including real-time CPU and RAM usage, network traffic (sent/received data), detected port network configuration with editable ports, and grouped applications relationships. The General tab displays resource metrics and configuration details, while the Actions tab provides quick controls to start, stop, restart, pause, or unpause your application.</p>
          </div>
        </div>
      </template>
    </StatusBar>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useDesktopStore } from "../__Stores__/desktopStore";
import type { DockerApp } from "../__Stores__/desktopStore";

import { Icon } from "@iconify/vue";
import playIcon from "@iconify-icons/mdi/play";
import stopIcon from "@iconify-icons/mdi/stop";
import restartIcon from "@iconify-icons/mdi/restart";
import pauseIcon from "@iconify-icons/mdi/pause";
import unpauseIcon from "@iconify-icons/mdi/play-pause";
import openIcon from "@iconify-icons/mdi/open-in-new";
import alertIcon from "@iconify-icons/mdi/alert-circle-outline";
import infoIcon from "@iconify-icons/mdi/information-outline";
import cogIcon from "@iconify-icons/mdi/cog-outline";
import cpuIcon from "@iconify-icons/mdi/cpu-64-bit";
import memoryIcon from "@iconify-icons/mdi/memory";
import networkIcon from "@iconify-icons/mdi/network-outline";
import settingsIcon from "@iconify-icons/mdi/tune";
import loadingIcon from "@iconify-icons/mdi/loading";
import chevronRightIcon from "@iconify-icons/mdi/chevron-right";
import containerIcon from "@iconify-icons/mdi/package-variant-closed";
import downloadIcon from "@iconify-icons/mdi/download";
import uploadIcon from "@iconify-icons/mdi/upload";
import accesPointNetworkIcon from "@iconify-icons/mdi/access-point-network";

import BaseImage from "../__Components__/BaseImage.vue";
import PortRouter from "../__Components__/PortRouter.vue";
import StatusBar from "../__Components__/StatusBar.vue";

import { startContainer, stopContainer, restartContainer, pauseContainer, unpauseContainer } from "../__Services__/DockerActions";

interface Props {
  appId?: string;
  containerName?: string;
  data?: {
    appId?: string;
    containerName?: string;
  };
}

const props = defineProps<Props>();

const { themeClasses } = useTheme();
const desktopStore = useDesktopStore();

const csrfToken = useCsrfToken();

const activeTab = ref("general");

const isProcessing = ref(false);

const isStarting = ref(false);
const isStopping = ref(false);
const isRestarting = ref(false);
const isPausing = ref(false);
const isUnpausing = ref(false);

const app = computed<DockerApp | null>(() => {
  const appId = props.appId || props.containerName || props.data?.appId || props.data?.containerName;

  if (!appId) {
    return null;
  }

  return desktopStore.dockerApps.find((a) => a.id === appId || a.name === appId) || null;
});

const groupContainers = computed<DockerApp[]>(() => {
  if (!app.value?.HDGroup) return [];
  return desktopStore.dockerApps.filter((a) => a.HDGroup === app.value?.HDGroup && a.id !== app.value?.id);
});

const showConfiguration = computed<boolean>(() => {
  return !!(app.value?.HDGroup || app.value?.HDRole || groupContainers.value.length > 0);
});

function getContainerClasses(app: DockerApp): string {
  const statusClasses: Record<string, string> = {
    running: "",
    paused: "brightness-75 opacity-80",
    exited: "grayscale brightness-50 opacity-60",
    created: "brightness-75 sepia opacity-70",
  };

  return statusClasses[app.status] || "";
}

function getStatusClasses(statusColor: string): string[] {
  const colorMap: Record<string, string[]> = {
    success: [themeClasses.value.appPropsStatusSuccessBg, themeClasses.value.appPropsStatusSuccessBorder, themeClasses.value.appPropsStatusSuccessText],
    warning: [themeClasses.value.appPropsStatusWarningBg, themeClasses.value.appPropsStatusWarningBorder, themeClasses.value.appPropsStatusWarningText],
    danger: [themeClasses.value.appPropsStatusDangerBg, themeClasses.value.appPropsStatusDangerBorder, themeClasses.value.appPropsStatusDangerText],
    info: [themeClasses.value.appPropsStatusInfoBg, themeClasses.value.appPropsStatusInfoBorder, themeClasses.value.appPropsStatusInfoText],
    primary: [themeClasses.value.appPropsStatusPrimaryBg, themeClasses.value.appPropsStatusPrimaryBorder, themeClasses.value.appPropsStatusPrimaryText],
    dark: [themeClasses.value.appPropsStatusDarkBg, themeClasses.value.appPropsStatusDarkBorder, themeClasses.value.appPropsStatusDarkText],
  };

  return colorMap[statusColor] || colorMap.dark;
}

function getStatusDotClasses(status: string): string {
  const dotMap: Record<string, string> = {
    running: themeClasses.value.appPropsDotSuccess,
    paused: themeClasses.value.appPropsDotWarning,
    exited: themeClasses.value.appPropsDotDanger,
    created: themeClasses.value.appPropsDotInfo,
  };

  return dotMap[status] || themeClasses.value.appPropsDotDark;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`;
}

function handlePortsUpdate(newPorts: string) {
  if (!app.value) return;

  const portsArray = newPorts.split(":");
  desktopStore.updateDockerApp(app.value.id, {
    ports: portsArray,
    service_url: portsArray.length > 0 && portsArray[0] !== "disabled" && portsArray[0] !== "hostmode" ? `/app/${portsArray[0]}` : null,
  });
}

async function handleStart() {
  if (!app.value || isProcessing.value) return;
  isProcessing.value = true;
  isStarting.value = true;
  try {
    await startContainer(app.value, csrfToken.value, themeClasses.value.scopeSelector);
  } finally {
    isStarting.value = false;
    isProcessing.value = false;
  }
}

async function handleStop() {
  if (!app.value || isProcessing.value) return;
  isProcessing.value = true;
  isStopping.value = true;
  try {
    await stopContainer(app.value, csrfToken.value, themeClasses.value.scopeSelector);
  } finally {
    isStopping.value = false;
    isProcessing.value = false;
  }
}

async function handleRestart() {
  if (!app.value || isProcessing.value) return;
  isProcessing.value = true;
  isRestarting.value = true;
  try {
    await restartContainer(app.value, csrfToken.value, themeClasses.value.scopeSelector);
  } finally {
    isRestarting.value = false;
    isProcessing.value = false;
  }
}

async function handlePause() {
  if (!app.value || isProcessing.value) return;
  isProcessing.value = true;
  isPausing.value = true;
  try {
    await pauseContainer(app.value, csrfToken.value, themeClasses.value.scopeSelector);
  } finally {
    isPausing.value = false;
    isProcessing.value = false;
  }
}

async function handleUnpause() {
  if (!app.value || isProcessing.value) return;
  isProcessing.value = true;
  isUnpausing.value = true;
  try {
    await unpauseContainer(app.value, csrfToken.value, themeClasses.value.scopeSelector);
  } finally {
    isUnpausing.value = false;
    isProcessing.value = false;
  }
}

function handleOpenUrl() {
  if (!app.value?.service_url) return;
  window.open(app.value.service_url, "_blank", "noopener,noreferrer");
}
</script>

<style scoped>
/* Hero Section */
.hero-section {
  position: relative;
  overflow: hidden;
}

.hero-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

/* App Icon Container */
.app-icon-container {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}

.app-icon {
  width: 60px;
  height: 60px;
  object-fit: contain;
}

/* Pulse animation */
@keyframes pulse-success {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Mobile responsive adjustments */
@media (max-width: 768px) {
  .app-icon-container {
    width: 64px;
    height: 64px;
  }

  .app-icon {
    width: 48px;
    height: 48px;
  }
}

/* Tab transition animations - Cross-Fade */
.tab-fade-enter-active {
  transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-fade-leave-active {
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.6, 1);
}

.tab-fade-enter-from,
.tab-fade-leave-to {
  opacity: 0;
}
</style>
