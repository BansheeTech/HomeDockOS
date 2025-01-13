<!-- homedock-ui/vue3/static/js/__Components__/AppRender.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template>
  <div class="relative">
    <Transition name="fade">
      <div v-if="isLoading" class="absolute inset-0 flex justify-center items-center z-10">
        <Icon :icon="loadingIcon" class="text-blue-600 animate-spin" width="60" height="60" />
      </div>
    </Transition>

    <Transition name="fade" mode="out-in">
      <template v-if="!isLoading">
        <table v-if="selectedAppsStore.applications.length > 0" :class="['w-full border-collapse rounded-xl transition duration-1000', isLoading ? 'opacity-0 pointer-events-none' : 'opacity-100']">
          <thead>
            <tr>
              <th class="w-2 py-1 px-4 text-left">
                <Checkbox :class="[themeClasses.scopeSelector]" :checked="selectAll" :indeterminate="indeterminate" class="opacity-50 transition duration-300 hover:scale-125 hover:opacity-100" @change="toggleSelectAll" />
              </th>
              <th class="py-1 px-1 text-left text-gray-500 text-[10px] uppercase">Apps</th>
              <th class="py-1 px-4 text-left text-gray-500 text-[10px] uppercase">Access</th>
              <th class="py-1 px-4 text-left text-gray-500 text-[10px] uppercase">CPU Usage</th>
              <th class="py-1 px-4 text-left text-gray-500 text-[10px] uppercase">Status</th>
            </tr>
          </thead>
          <VueDraggable v-model="selectedAppsStore.applications" group="applications" tag="tbody" handle=".drag-handle" item-key="name" @end="onDragEnd" :component-data="{ tag: 'TransitionGroup', name: 'fade' }">
            <TransitionGroup name="fade">
              <tr v-for="record in selectedAppsStore.applications.filter((app) => app.HDRole !== 'dependency')" :key="record.name" :class="[themeClasses.appHolder]" class="w-full transition duration-300 border-b will-change-transform">
                <!-- Checkbox -->
                <td class="w-2 py-4 px-4">
                  <Checkbox :class="[themeClasses.scopeSelector]" class="transition duration-300 hover:scale-125" :checked="record.checked" @change="(e) => handleRowCheck(record.name)" />
                </td>

                <!-- App info -->
                <td class="min-w-80 py-3 px-1">
                  <div class="flex items-center space-x-2">
                    <div :class="['dashboard-image-wrapper', record.service_url && record.status !== 'exited' && record.status !== 'paused' ? 'dashboard-image-wrapper-normal' : 'dashboard-image-wrapper-hostmode']">
                      <Transition v-if="record.isProcessing === true" name="opacity-fade">
                        <div class="absolute inset-0 bg-transparent">
                          <div class="absolute bottom-0 left-0 w-full h-[2px] overflow-hidden">
                            <div :class="[themeClasses.processingBarScope]" class="absolute h-full animate-loading"></div>
                          </div>
                        </div>
                      </Transition>

                      <Transition name="slide-fade" mode="out-in">
                        <a v-if="record.service_url && record.status !== 'exited' && record.status !== 'paused' && record.status !== 'created'" draggable="false" :href="record.service_url" target="_blank" rel="noreferrer" class="group">
                          <div :class="[getContainerClasses(record), themeClasses.iconHolder, record.isProcessing ? 'animate-bounce' : '']">
                            <BaseImage draggable="false" :src="record.image_path" loading="lazy" class="dock-cont-image h-12 w-12 min-w-12 min-h-12 aspect-square" />
                          </div>
                        </a>
                        <div v-else :class="[getContainerClasses(record), themeClasses.iconHolder, record.isProcessing ? 'animate-bounce' : '']">
                          <BaseImage draggable="false" :src="record.image_path" loading="lazy" class="dock-cont-image h-12 w-12 min-w-12 min-h-12 aspect-square" />
                        </div>
                      </Transition>
                    </div>
                    <Icon :class="[themeClasses.draggerHandler]" :icon="dragIcon" class="drag-handle transition duration-300 cursor-pointer" width="20" height="20" />
                    <div>
                      <p :class="[themeClasses.appName]" class="text-xs font-semibold mb-0">{{ record.name }}</p>
                      <p :class="[themeClasses.appRepo]" class="text-xs mb-0" v-html="record.image"></p>
                      <p v-if="record.HDGroup && getDependenciesForGroup(record.HDGroup).length > 0" :class="[themeClasses.depScope]" class="text-[10px] mb-0">
                        <span v-for="(dependency, index) in getDependenciesForGroup(record.HDGroup)" :key="dependency.id">
                          <Icon :icon="depIcon" class="inline-block" width="12" height="12" />
                          {{ dependency.name }}
                          <span v-if="index < getDependenciesForGroup(record.HDGroup).length - 1" class="mr-0.5"></span>
                        </span>
                      </p>
                    </div>
                  </div>
                </td>

                <!-- Access Info -->
                <td class="min-w-52 py-4 px-4">
                  <div>
                    <p :class="[themeClasses.appAccess]" class="text-xs flex items-center">
                      <Icon :icon="accessIcon" class="mr-1 text-gray-500" width="14" height="14" />
                      {{ record.host }}
                    </p>
                    <PortRouter class="relative" :containerId="record.name" :initialPorts="record.ports.join(':')" :csrfToken="csrfToken" @update="(newPorts: string) => (record.ports = newPorts.split(':'))" />
                  </div>
                </td>

                <!-- CPU Usage -->
                <td class="min-w-48 py-4 px-4">
                  <Progress :class="[themeClasses.scopeSelector]" :trailColor="themeClasses.antProgressTrail" :strokeColor="themeClasses.antProgressStroke" :percent="record.usagePercent" :show-info="true" status="active" size="small" />
                </td>

                <!-- Status -->
                <td class="max-w-2 min-w-28 py-4 px-4 rounded-r-xl">
                  <Transition name="status-slide-fade" mode="out-in">
                    <div :key="record.status" :class="`text-[12px] py-1 px-4 text-center rounded-full justify-center flex items-center ${statusColor(record.statusColor)}`">
                      <span>{{ record.status }}</span>
                      <Transition name="opacity-fade" mode="out-in">
                        <span v-if="record.isProcessing === true">
                          <Icon :icon="loadingIcon" class="animate-spin ml-2" />
                        </span>
                      </Transition>
                    </div>
                  </Transition>
                </td>
              </tr>
            </TransitionGroup>
          </VueDraggable>
        </table>
        <div v-else class="flex flex-col justify-center items-center p-3 space-y-1">
          <AnimatedIcon :icons="[iconAnim1, iconAnim2, iconAnim3, iconAnim4, iconAnim3, iconAnim2]" :interval="1000" :iconSize="64" :containerClass="themeClasses.noAppsIcon" class="transition duration-500 hover:-translate-y-2 hover:scale-105" />
          <p :class="[themeClasses.noAppsTextMain]" class="text-sm text-center text-balance">Couldn't find any applications installed.</p>
          <p :class="[themeClasses.noAppsTextMain]" class="text-sm text-center text-balance flex items-center">
            <span>
              Install your first application on the <a :class="[themeClasses.hyperLink, 'inline-flex items-center ml-1']" href="/app-store"><Icon :icon="widgetsOutlineIcon" class="mr-1" />App Store </a>.
            </span>
          </p>
        </div>
      </template>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import { Checkbox, Progress } from "ant-design-vue";

import { VueDraggable } from "vue-draggable-plus";

import { fetchContainers, startContainerPolling, stopContainerPolling } from "../__Services__/DockerAPIFetchContainerData";

import { useSelectedAppsStore } from "../__Stores__/selectedAppsStore";

import { Icon } from "@iconify/vue";
import loadingIcon from "@iconify-icons/mdi/loading";
import dragIcon from "@iconify-icons/mdi/drag";
import accessIcon from "@iconify-icons/mdi/map-marker-distance";
import depIcon from "@iconify-icons/mdi/cube";
import widgetsOutlineIcon from "@iconify-icons/mdi/widgets-outline";
import iconAnim1 from "@iconify-icons/mdi/hexagon-outline";
import iconAnim2 from "@iconify-icons/mdi/hexagon-slice-2";
import iconAnim3 from "@iconify-icons/mdi/hexagon-slice-4";
import iconAnim4 from "@iconify-icons/mdi/hexagon-slice-6";

import BaseImage from "../__Components__/BaseImage.vue";
import PortRouter from "../__Components__/PortRouter.vue";
import AnimatedIcon from "../__Components__/AnimatedIcon.vue";

interface Application {
  id: string;
  name: string;
  image: string;
  host: string;
  ports: string[];
  usagePercent: number;
  status: string;
  statusColor: string;
  image_path: string;
  checked: boolean;
  service_url: string;
  HDGroup: string;
  HDRole?: string;
  isProcessing: boolean;
}

const { themeClasses } = useTheme();
const csrfToken = document.querySelector('meta[name="homedock_csrf_token"]')?.getAttribute("content") || "";
const isLoading = ref(true);
const selectAll = ref(false);
const indeterminate = ref(false);
const ORDER_KEY = "dashboardLocalOrder";

const selectedAppsStore = useSelectedAppsStore(); // Instancia del store

function getContainerClasses(record: Application): string {
  const baseClasses = "aspect-square ring-[1px] flex-shrink-0 relative w-12 h-12 min-w-12 min-h-12 overflow-hidden rounded-xl drop-shadow-md transition-all duration-300 ease-[cubic-bezier(0,1.7,1,1.7)]";

  const statusClasses: Record<string, string> = {
    running: "hover:scale-110 cursor-pointer",
    paused: "brightness-50 cursor-not-allowed hover:scale-95 hover:opacity-75",
    exited: "grayscale brightness-50 cursor-not-allowed hover:scale-95 hover:opacity-75",
    created: "brightness-50 sepia opacity-50 cursor-not-allowed hover:scale-95",
  };

  const portClasses: Record<string, string> = {
    hostmode: "hover:brightness-50 hover:scale-95 hover:rounded-xl cursor-not-allowed hover:opacity-50",
  };

  let combinedClasses = baseClasses;

  if (record.status in statusClasses) {
    combinedClasses += ` ${statusClasses[record.status]}`;
  }

  if (record.ports[0] === "hostmode") {
    combinedClasses += ` ${portClasses.hostmode}`;
  }

  return combinedClasses;
}

function getDependenciesForGroup(group: string): Application[] {
  return selectedAppsStore.applications.filter((app) => app.HDRole === "dependency" && app.HDGroup === group);
}

function saveOrder() {
  const mainAppsOrder = selectedAppsStore.applications.filter((app) => app.HDRole !== "dependency").map((app) => app.name);

  localStorage.setItem(ORDER_KEY, JSON.stringify(mainAppsOrder));
}
function toggleSelectAll(e: { target: { checked: boolean } }) {
  const isChecked = e.target.checked;

  const visibleApps = selectedAppsStore.applications.filter((app) => app.HDRole !== "dependency");

  if (isChecked) {
    const visibleAppNames = visibleApps.map((app) => app.name);
    selectedAppsStore.updateSelection(visibleAppNames);
  } else {
    selectedAppsStore.clearSelection();
  }
}

function onDragEnd() {
  const reorderedApps = [...selectedAppsStore.applications];
  const mainApps = reorderedApps.filter((app) => app.HDRole !== "dependency");
  const dependencies = reorderedApps.filter((app) => app.HDRole === "dependency");

  selectedAppsStore.setApplications([...mainApps, ...dependencies]);

  saveOrder();
}

function updateIndeterminate() {
  const visibleApps = selectedAppsStore.applications.filter((app) => app.HDRole !== "dependency");
  const totalVisible = visibleApps.length;
  const checkedVisibleCount = visibleApps.filter((app) => selectedAppsStore.selectedApps.includes(app.name)).length;

  selectAll.value = checkedVisibleCount === totalVisible && totalVisible > 0;
  indeterminate.value = checkedVisibleCount > 0 && checkedVisibleCount < totalVisible;
}

function handleRowCheck(appName: string) {
  selectedAppsStore.toggleSelection(appName);
  updateIndeterminate();
}

function statusColor(color: string): string {
  const { themeClasses } = useTheme();

  const colorMap: Record<string, { bg: string; text: string }> = {
    success: { bg: themeClasses.value.successBg, text: themeClasses.value.successText },
    warning: { bg: themeClasses.value.warningBg, text: themeClasses.value.warningText },
    info: { bg: themeClasses.value.infoBg, text: themeClasses.value.infoText },
    danger: { bg: themeClasses.value.dangerBg, text: themeClasses.value.dangerText },
    primary: { bg: themeClasses.value.primaryBg, text: themeClasses.value.primaryText },
    dark: { bg: themeClasses.value.darkBg, text: themeClasses.value.darkText },
    default_color: { bg: themeClasses.value.defaultBg, text: themeClasses.value.defaultText },
  };

  const themeColor = colorMap[color] || colorMap.default_color;
  return `${themeColor.bg} ${themeColor.text}`;
}

watch(
  () => selectedAppsStore.selectedApps,
  () => {
    updateIndeterminate();
  },
  { immediate: true }
);

onMounted(async () => {
  isLoading.value = true;
  try {
    await fetchContainers(csrfToken);
  } catch (error) {
    console.error("Error during initial fetch:", error);
  } finally {
    isLoading.value = false;
  }
  startContainerPolling(csrfToken, 3000);
});

onUnmounted(() => {
  stopContainerPolling();
});
</script>

<style scoped>
/* Icon Change */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) rotate(999deg);
}

.slide-fade-leave-from,
.slide-fade-enter-to {
  opacity: 1;
  transform: translateY(0) rotate(0deg);
}

/* Status Change */
.status-slide-fade-enter-active,
.status-slide-fade-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.status-slide-fade-enter-from,
.status-slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.status-slide-fade-leave-from,
.status-slide-fade-enter-to {
  opacity: 1;
  transform: translateY(0);
}

/* Fade Transition */
.fade-move,
.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.fade-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Opacity Fade */
.opacity-fade-enter-active,
.opacity-fade-leave-active {
  transition: opacity 0.5s ease-in-out;
}

.opacity-fade-enter-from,
.opacity-fade-leave-to {
  opacity: 0;
}

.opacity-fade-enter-to,
.opacity-fade-leave-from {
  opacity: 1;
}

/* Styles */
::v-deep(.dark-mode-theme .ant-checkbox-inner) {
  background-color: #292929 !important;
  border: 1px solid #3b3b3b !important;
}

::v-deep(.aero-mode-theme .ant-checkbox-inner) {
  background-color: #29292900 !important;
  border: 1px solid #3b3b3b !important;
}

::v-deep(.dark-mode-theme .ant-progress-text) {
  color: #525259 !important;
}

::v-deep(.aero-mode-theme .ant-progress-text) {
  color: #b0b0b07d !important;
}
</style>
