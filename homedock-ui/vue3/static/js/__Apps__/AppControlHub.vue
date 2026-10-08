<!-- homedock-ui/vue3/static/js/__Apps__/AppControlHub.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div ref="containerRef" class="control-hub flex flex-col h-full overflow-hidden outline-hidden" tabindex="-1" @keydown="handleKeydown">
    <div :class="[themeClasses.fileExplorerToolbar]" class="flex items-center gap-1.5 px-2 py-1.5 border-b flex-shrink-0">
      <button v-if="!isMobileLayout" @click="railExpanded = !railExpanded" :class="[themeClasses.fileExplorerSidebarItem]" class="flex items-center justify-center w-7 h-7 rounded-md border-0 bg-transparent cursor-pointer flex-shrink-0" :title="$t('Toggle navigation')">
        <Icon :icon="menuIcon" class="w-4 h-4" />
      </button>

      <h1 v-if="!isMobileLayout" :class="[themeClasses.windowTitleTextFocused]" class="text-xs font-semibold truncate px-1">{{ $t(activeTabLabel) }}</h1>

      <div v-if="showSearch" class="relative flex items-center min-w-0" :class="isMobileLayout ? 'flex-1' : 'w-44 ml-auto'">
        <Icon :icon="searchIcon" :class="[themeClasses.explorerSearchIcon]" class="absolute left-2 w-3.5 h-3.5 pointer-events-none" />
        <input v-model="searchQuery" type="text" :placeholder="$t('Search apps...')" :class="[themeClasses.explorerSearchInput, themeClasses.explorerSearchInputText, themeClasses.explorerSearchInputFocusRing]" class="w-full h-7 pl-7 pr-6 rounded-md border text-xs outline-hidden transition-all duration-150" />
        <button v-if="searchQuery" @click="searchQuery = ''" :class="[themeClasses.explorerClearButton, themeClasses.explorerClearButtonHover]" class="absolute right-1 flex items-center justify-center w-5 h-5 rounded border-0 bg-transparent cursor-pointer">
          <Icon :icon="closeIcon" class="w-3 h-3" />
        </button>
      </div>

      <button @click="refreshContainers" :disabled="isRefreshing" :class="[themeClasses.appPropsActionButtonBg, themeClasses.appPropsActionButtonBorder, themeClasses.appPropsActionButtonText, themeClasses.appPropsActionButtonBgHover, showSearch ? '' : 'ml-auto', isRefreshing ? 'opacity-60 cursor-default' : 'cursor-pointer']" class="flex items-center gap-1.5 h-7 px-2 rounded-md transition-colors duration-150 flex-shrink-0" :title="$t('Refresh')">
        <Icon :icon="refreshIcon" class="w-3.5 h-3.5" :class="{ 'animate-spin': isRefreshing }" />
        <span v-if="!isMobileLayout" class="text-[11px] font-medium whitespace-nowrap">{{ $t("Refresh") }}</span>
      </button>
    </div>

    <div class="flex flex-1 min-h-0">
      <nav :class="[themeClasses.fileExplorerSidebar, railCollapsed ? 'w-12' : 'w-44']" class="flex flex-col gap-1 flex-shrink-0 border-r p-1.5 transition-[width] duration-200 overflow-hidden">
        <button v-for="tab in tabs" :key="tab.id" @click="setTab(tab.id)" :class="[activeTab === tab.id ? themeClasses.fileExplorerSidebarItemActive : themeClasses.fileExplorerSidebarItem, railCollapsed ? 'justify-center' : '']" class="flex items-center gap-2.5 px-2 py-2 rounded-md border-0 bg-transparent cursor-pointer text-left" :title="$t(tab.label)">
          <AppIconGraphic :icon="tab.icon" :color="tab.color" :size="NAV_TILE_SIZE" />
          <span v-if="!railCollapsed" class="text-xs font-medium truncate">{{ $t(tab.label) }}</span>
        </button>
      </nav>

      <div class="flex-1 min-w-0 min-h-0 flex flex-col">
        <div v-if="isStale" :class="[themeClasses.appPropsDependencyWarningBg, themeClasses.appPropsDependencyWarningBorder]" class="flex items-center gap-2 px-2.5 py-1 border-b flex-shrink-0">
          <Icon :icon="alertIcon" :class="[themeClasses.appPropsDependencyWarningIcon]" class="w-3.5 h-3.5 flex-shrink-0" />
          <span :class="[themeClasses.appPropsDependencyWarningText]" class="text-[11px] truncate">{{ $t("Unable to retrieve data") }}</span>
        </div>

        <div v-if="isLoading && activeTab !== 'performance'" class="flex flex-col items-center justify-center flex-1 gap-3">
          <div class="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin"></div>
          <span :class="[themeClasses.windowPlaceholderText]" class="text-sm">{{ $t("Loading containers...") }}</span>
        </div>

        <div v-else-if="hasLoadFailed && activeTab !== 'performance'" class="flex flex-col items-center justify-center flex-1 gap-3 px-6 text-center">
          <Icon :icon="alertIcon" :class="[themeClasses.windowPlaceholderText]" class="w-12 h-12 opacity-50" />
          <h3 :class="[themeClasses.windowTitleTextFocused]" class="text-base font-semibold">{{ $t("Unable to retrieve data") }}</h3>
          <p :class="[themeClasses.windowPlaceholderText]" class="text-xs max-w-sm">{{ $t("Unable to communicate with HomeDock OS. Please check your internet connection.") }}</p>
        </div>

        <div v-else-if="!allApps.length && activeTab !== 'performance'" class="flex flex-col items-center justify-center flex-1 px-4">
          <div :class="[themeClasses.windowBorder]" class="p-8 rounded-2xl border bg-white/5 text-center max-w-md">
            <Icon :icon="emptyIcon" :class="[themeClasses.windowPlaceholderText]" class="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 :class="[themeClasses.windowTitleTextFocused]" class="text-lg font-semibold mb-2">{{ $t("No apps installed") }}</h3>
            <p :class="[themeClasses.windowPlaceholderText]" class="text-sm mb-6">{{ $t("Get started by installing your first application") }}</p>
            <button @click="openAppStore" :class="[themeClasses.settingsIconBgBlue]" class="px-6 py-3 rounded-xl text-white font-medium flex items-center gap-2 mx-auto hover:scale-105 transition-transform duration-200 shadow-lg cursor-pointer">
              <Icon :icon="storeIcon" class="w-5 h-5" />
              <span>{{ $t("Browse App Store") }}</span>
            </button>
          </div>
        </div>

        <ControlHubProcesses v-else-if="activeTab === 'processes'" :apps="mainApps" :dependencies="dependencyApps" :rates="networkRates" :search="searchQuery" :selected-name="selectedName" :layout="layout" v-model:sort-key="sortKey" v-model:sort-direction="sortDirection" :total-ram-gb="totalRamGb" :system-cpu="systemStats.cpuUsage" :system-ram="systemStats.ramUsage" @select="selectApp" @open="openProperties" @context="openContextMenu" />

        <ControlHubPerformance v-else-if="activeTab === 'performance'" :total-rates="totalRates" :total-traffic="totalTraffic" :host-rates="hostRates" :history="metricHistory" :stacked="layout === 'compact'" />

        <ControlHubTable v-else-if="activeTab === 'history'" :columns="historyColumns" :rows="filteredMainApps" :selected-name="selectedName" default-sort-key="received" empty-label="No matching apps" @select="selectApp" @open="openProperties" @context="openContextMenu" />

        <ControlHubTable v-else-if="activeTab === 'dependencies'" :columns="dependencyColumns" :rows="filteredDependencyApps" :selected-name="selectedName" :dependency-of="dependencyOf" default-sort-key="name" default-sort-direction="asc" empty-label="No dependency containers" @select="selectApp" @open="openProperties" @context="openContextMenu" />

        <ControlHubDetails v-else :rows="filteredAllApps" :history="containerHistory" :total-ram-gb="totalRamGb" :selected-name="selectedName" :layout="layout" empty-label="No matching apps" @select="selectApp" @open="openProperties" @context="openContextMenu" />
      </div>
    </div>

    <StatusBar :icon="nutIcon" :message="statusBarMessage" :info="statusBarInfo" :showHelp="true">
      <template #help>
        <div class="space-y-2.5 max-w-sm">
          <div class="flex items-center gap-2">
            <StatusBarHelpIcon :icon="nutIcon" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">{{ $t("Control Hub") }}</h4>
          </div>

          <div :class="['text-[10px] md:text-xs md:leading-4 space-y-2 leading-relaxed', themeClasses.statusBarInfo]">
            <p>{{ $t("Monitor and manage all your installed applications from a single interface. Sort by any column, right-click a row for actions, and expand an app to see its dependency containers.") }}</p>
            <p>{{ $t("Performance shows live system graphs, App history shows network totals since each container started, and Details lists every container with its technical data.") }}</p>
          </div>
        </div>
      </template>
    </StatusBar>

    <input ref="importInputRef" type="file" accept=".yml,.yaml" class="hidden" @change="handleImportFile" />

    <ContextMenu :items="contextMenuItems" :visible="contextMenu.visible" :x="contextMenu.x" :y="contextMenu.y" @close="closeContextMenu" />
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";

import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useDialog } from "../__Composables__/useDialog";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { formatBytes, formatUptime, parseDockerDate, useContainerHistory, useMetricHistory, useNetworkRates } from "../__Composables__/useControlHub";

import { useDesktopStore } from "../__Stores__/desktopStore";
import { useSelectedAppsStore } from "../__Stores__/selectedAppsStore";
import { useWindowStore } from "../__Stores__/windowStore";
import { useAppQuickActions } from "../__Composables__/useAppQuickActions";
import { useSystemStatsStore } from "../__Stores__/useSystemStatsStore";

import { fetchContainers } from "../__Services__/DockerAPIFetchContainerData";
import { startContainer, stopContainer, restartContainer, pauseContainer, unpauseContainer, uninstallContainer, updateContainer } from "../__Services__/DockerActions";

import { message } from "ant-design-vue";

import StatusBar from "../__Components__/StatusBar.vue";
import StatusBarHelpIcon from "../__Components__/StatusBarHelpIcon.vue";
import ContextMenu, { type ContextMenuItem } from "../__Components__/ContextMenu.vue";
import ControlHubProcesses from "../__Components__/ControlHubProcesses.vue";
import ControlHubPerformance from "../__Components__/ControlHubPerformance.vue";
import ControlHubTable, { type TableColumn } from "../__Components__/ControlHubTable.vue";
import ControlHubDetails from "../__Components__/ControlHubDetails.vue";
import AppIconGraphic from "../__Components__/AppIconGraphic.vue";

import { Icon } from "@iconify/vue";
import nutIcon from "@iconify-icons/mdi/nut";
import menuIcon from "@iconify-icons/mdi/menu";
import searchIcon from "@iconify-icons/mdi/magnify";
import closeIcon from "@iconify-icons/mdi/close";
import storeIcon from "@iconify-icons/mdi/store";
import emptyIcon from "@iconify-icons/mdi/package-variant-closed";
import alertIcon from "@iconify-icons/mdi/alert-circle-outline";
import processesIcon from "@iconify-icons/mdi/apps";
import performanceIcon from "@iconify-icons/mdi/speedometer";
import historyIcon from "@iconify-icons/mdi/history";
import dependenciesIcon from "@iconify-icons/mdi/cube-outline";
import detailsIcon from "@iconify-icons/mdi/table";
import openIcon from "@iconify-icons/mdi/open-in-new";
import playIcon from "@iconify-icons/mdi/play";
import stopIcon from "@iconify-icons/mdi/stop";
import refreshIcon from "@iconify-icons/mdi/refresh";
import restartIcon from "@iconify-icons/mdi/restart";
import pauseIcon from "@iconify-icons/mdi/pause";
import unpauseIcon from "@iconify-icons/mdi/play-pause";
import exportIcon from "@iconify-icons/mdi/export-variant";
import importIcon from "@iconify-icons/mdi/import";
import updateIcon from "@iconify-icons/mdi/arrow-up-circle";
import propertiesIcon from "@iconify-icons/mdi/information-outline";
import uninstallIcon from "@iconify-icons/mdi/trash-can-outline";

const TAB_STORAGE_KEY = "controlHubTab";
const SORT_STORAGE_KEY = "controlHubSort";
const MOBILE_ENTER_THRESHOLD = 600;
const MOBILE_EXIT_THRESHOLD = 680;
const RAIL_EXPAND_THRESHOLD = 920;

const { t } = useI18n();
const { themeClasses } = useTheme();
const { confirm } = useDialog();

const desktopStore = useDesktopStore();
const selectedAppsStore = useSelectedAppsStore();
const windowStore = useWindowStore();
const { quickActionsFor } = useAppQuickActions();
const props = defineProps<{
  _windowId?: string;
  selectedApp?: string;
}>();

const systemStats = useSystemStatsStore();
const csrfToken = useCsrfToken();

const containerRef = ref<HTMLElement | null>(null);
const importInputRef = ref<HTMLInputElement | null>(null);

const containerWidth = ref(0);
const isMobileLayout = ref(false);
const railExpanded = ref(true);

const searchQuery = ref("");
const isRefreshing = ref(false);
const selectedName = ref("");
const importTarget = ref<any>(null);

const NAV_TILE_SIZE = 18;

const tabs = [
  { id: "performance", label: "Performance", icon: performanceIcon, color: "#16a34a" },
  { id: "processes", label: "Processes", icon: processesIcon, color: "#2563eb" },
  { id: "history", label: "App history", icon: historyIcon, color: "#d97706" },
  { id: "dependencies", label: "Dependencies", icon: dependenciesIcon, color: "#0d9488" },
  { id: "details", label: "Details", icon: detailsIcon, color: "#475569" },
];

const activeTab = ref(readStoredTab());
const sortKey = ref(readStoredSort().key);
const sortDirection = ref<"asc" | "desc">(readStoredSort().direction);

function readStoredTab(): string {
  try {
    const stored = localStorage.getItem(TAB_STORAGE_KEY);
    return tabs.some((tab) => tab.id === stored) ? (stored as string) : "processes";
  } catch {
    return "processes";
  }
}

function readStoredSort(): { key: string; direction: "asc" | "desc" } {
  try {
    const stored = JSON.parse(localStorage.getItem(SORT_STORAGE_KEY) || "null");
    if (stored?.key) return { key: String(stored.key), direction: stored.direction === "asc" ? "asc" : "desc" };
  } catch {
    // Halp!
  }
  return { key: "cpu", direction: "desc" };
}

function setTab(id: string) {
  activeTab.value = id;
  try {
    localStorage.setItem(TAB_STORAGE_KEY, id);
  } catch {
    // Halp!
  }
}

watch([sortKey, sortDirection], () => {
  try {
    localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify({ key: sortKey.value, direction: sortDirection.value }));
  } catch {
    // Halp!
  }
});

const isLoading = computed(() => !selectedAppsStore.loaded);
const hasLoadFailed = computed(() => selectedAppsStore.fetchFailed && !selectedAppsStore.loaded);
const isStale = computed(() => selectedAppsStore.fetchFailed && selectedAppsStore.loaded);

const allApps = computed(() => desktopStore.dockerApps);
const mainApps = computed(() => allApps.value.filter((app: any) => app.HDRole !== "dependency"));
const dependencyApps = computed(() => allApps.value.filter((app: any) => app.HDRole === "dependency"));

function mainOfGroup(app: any): any | null {
  if (app.HDRole !== "dependency" || !app.HDGroup) return null;
  return mainApps.value.find((main: any) => main.HDGroup === app.HDGroup) || null;
}

function dependencyOf(app: any): string {
  const main = mainOfGroup(app);
  if (!main) return "";
  return main.display_name || main.name;
}

const networkRates = useNetworkRates(allApps as any);
const containerHistory = useContainerHistory(allApps as any);

const totalRates = computed(() => Object.values(networkRates.value).reduce((accumulator, rate) => ({ rx: accumulator.rx + (rate?.rx || 0), tx: accumulator.tx + (rate?.tx || 0) }), { rx: 0, tx: 0 }));

const totalTraffic = computed(() => allApps.value.reduce((accumulator: { rx: number; tx: number }, app: any) => ({ rx: accumulator.rx + (app.networkRxBytes || 0), tx: accumulator.tx + (app.networkTxBytes || 0) }), { rx: 0, tx: 0 }));

const diskRates = computed(() => {
  const [read, write] = String(systemStats.diskIo).split("*");
  return { read: Number(read) || 0, write: Number(write) || 0 };
});

const hostRates = computed(() => {
  const [rx, tx] = String(systemStats.netIo).split("*");
  return { rx: Number(rx) || 0, tx: Number(tx) || 0 };
});

const loadAverages = computed(() => {
  const [one, five, fifteen] = String(systemStats.loadAverage).split("*");
  return { one: Number(one) || 0, five: Number(five) || 0, fifteen: Number(fifteen) || 0 };
});

const metricHistory = useMetricHistory(() => ({
  cpu: Number(systemStats.cpuUsage) || 0,
  memory: Number(systemStats.ramUsage) || 0,
  disk: diskRates.value.read,
  diskWrite: diskRates.value.write,
  network: hostRates.value.rx,
  networkUp: hostRates.value.tx,
  containerNetwork: totalRates.value.rx,
  containerNetworkUp: totalRates.value.tx,
  load: loadAverages.value.one,
  temperature: Number(systemStats.cpuTemp) || 0,
}));

const railCollapsed = computed(() => isMobileLayout.value || !railExpanded.value);

const contentWidth = computed(() => {
  if (containerWidth.value === 0) return 0;
  return containerWidth.value - (railCollapsed.value ? 48 : 176);
});

const layout = computed<"wide" | "medium" | "compact">(() => {
  if (contentWidth.value === 0) return "wide";
  if (contentWidth.value < 520) return "compact";
  if (contentWidth.value < 720) return "medium";
  return "wide";
});

const totalRamGb = computed(() => Number(systemStats.totalRam) || 0);
const activeTabLabel = computed(() => tabs.find((tab) => tab.id === activeTab.value)?.label || "Processes");
const showSearch = computed(() => activeTab.value !== "performance");

function matchesSearch(app: any): boolean {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return true;
  return (app.display_name || app.name).toLowerCase().includes(query) || app.name.toLowerCase().includes(query) || (app.image || "").toLowerCase().includes(query);
}

const filteredMainApps = computed(() => mainApps.value.filter(matchesSearch));
const filteredDependencyApps = computed(() => dependencyApps.value.filter(matchesSearch));
const filteredAllApps = computed(() => allApps.value.filter(matchesSearch));

const historyColumns = computed<TableColumn[]>(() => [
  { key: "name", label: "Name", width: "minmax(0, 1fr)", text: (app) => app.display_name || app.name, sort: (app) => (app.display_name || app.name).toLowerCase() },
  { key: "uptime", label: "Up time", width: layout.value === "compact" ? "84px" : "116px", align: "right", text: (app) => formatUptime(app.startedAt), sort: (app) => -parseDockerDate(app.startedAt) },
  { key: "received", label: "Received", width: layout.value === "compact" ? "76px" : "104px", align: "right", text: (app) => formatBytes(app.networkRxBytes || 0), sort: (app) => app.networkRxBytes || 0, heat: (app) => app.networkRxBytes || 0, heatMax: 5 * 1024 * 1024 * 1024 },
  { key: "sent", label: "Sent", width: layout.value === "compact" ? "76px" : "104px", align: "right", text: (app) => formatBytes(app.networkTxBytes || 0), sort: (app) => app.networkTxBytes || 0, heat: (app) => app.networkTxBytes || 0, heatMax: 5 * 1024 * 1024 * 1024 },
]);

const dependencyColumns = computed<TableColumn[]>(() => {
  const columns: TableColumn[] = [
    { key: "name", label: "Name", width: "minmax(0, 1fr)", text: (app) => app.name, sort: (app) => app.name.toLowerCase() },
    { key: "status", label: "Status", width: layout.value === "compact" ? "88px" : "104px", text: () => "", sort: (app) => app.status },
  ];

  if (layout.value !== "compact") {
    columns.push({ key: "group", label: "Group", width: "minmax(0, 0.7fr)", text: (app) => app.HDGroup || "—", sort: (app) => app.HDGroup || "" });
  }

  columns.push({ key: "cpu", label: "CPU", width: "68px", align: "right", text: (app) => `${Number(app.usagePercent) || 0}%`, sort: (app) => Number(app.usagePercent) || 0, heat: (app) => Number(app.usagePercent) || 0 });
  columns.push({ key: "memory", label: "Memory", width: "82px", align: "right", text: (app) => memoryText(app), sort: (app) => Number(app.memoryUsagePercent) || 0, heat: (app) => Number(app.memoryUsagePercent) || 0 });

  return columns;
});

function memoryText(app: any): string {
  const bytes = Number(app.memoryUsageBytes) || 0;
  if (bytes > 0) return formatBytes(bytes, bytes >= 1024 * 1024 * 1024 ? 2 : 0);

  const percent = Number(app.memoryUsagePercent) || 0;
  if (totalRamGb.value > 0 && percent > 0) return formatBytes((percent / 100) * totalRamGb.value * 1024 * 1024 * 1024, 0);
  return `${percent}%`;
}

const runningApps = computed(() => allApps.value.filter((app: any) => app.status === "running"));
const selectedApp = computed(() => allApps.value.find((app: any) => app.name === selectedName.value) || null);
const canEndTask = computed(() => Boolean(selectedApp.value && selectedApp.value.status !== "exited"));

const statusBarMessage = computed(() => {
  if (selectedApp.value) return `${selectedApp.value.display_name || selectedApp.value.name} — ${t(selectedApp.value.status)}`;
  return t("Control Hub");
});

const statusBarInfo = computed(() => {
  if (!allApps.value.length) return t("No apps installed");
  return `${t("Running")} ${runningApps.value.length}/${allApps.value.length} • ${t("CPU")} ${systemStats.cpuUsage}% • ${t("RAM")} ${systemStats.ramUsage}%`;
});

function selectApp(app: any) {
  selectedName.value = selectedName.value === app.name ? "" : app.name;
}

function openProperties(app: any) {
  windowStore.openUniqueWindow("properties", app.id, {
    title: `${app.HDRole === "dependency" ? app.name : app.display_name || app.name} - ${t("Properties")}`,
    data: { appId: app.id },
  });
}

function openAppStore() {
  desktopStore.openSystemApp("appstore");
}

async function refreshContainers() {
  if (isRefreshing.value) return;

  isRefreshing.value = true;

  try {
    await fetchContainers(csrfToken.value);
  } catch {
    // Halp!
  } finally {
    isRefreshing.value = false;
  }
}

async function endTask() {
  const app = selectedApp.value;
  if (!app || app.status === "exited") return;
  await stopContainer(app as any, csrfToken.value, themeClasses.value.scopeSelector);
}

function handleKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;
  if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

  if (event.key === "Delete" && canEndTask.value) {
    event.preventDefault();
    endTask();
    return;
  }

  if (event.key === "Escape") {
    selectedName.value = "";
    return;
  }

  if (event.key === "F5") {
    event.preventDefault();
    refreshContainers();
  }
}

const contextMenu = ref({ visible: false, x: 0, y: 0 });
const contextMenuApp = ref<any>(null);

function openContextMenu(payload: { app: any; x: number; y: number }) {
  selectedName.value = payload.app.name;
  contextMenuApp.value = payload.app;
  contextMenu.value = { visible: true, x: payload.x, y: payload.y };
}

function closeContextMenu() {
  contextMenu.value.visible = false;
  contextMenuApp.value = null;
}

const contextMenuItems = computed<ContextMenuItem[]>(() => {
  const app = contextMenuApp.value;
  if (!app) return [];

  const isRunning = app.status === "running";
  const isExited = app.status === "exited";
  const isPaused = app.status === "paused";
  const isRestarting = app.status === "restarting";

  const isDependency = Boolean(dependencyOf(app));

  const items: ContextMenuItem[] = [];

  if (isRunning && app.service_url && !isDependency) {
    items.push({ label: "Open", icon: openIcon, action: () => desktopStore.launchDockerApp(app) });
    items.push({ divider: true });
  }

  if (isRestarting) {
    items.push({
      label: "Force Stop",
      icon: stopIcon,
      action: async () => await stopContainer(app, csrfToken.value, themeClasses.value.scopeSelector, true),
    });
  } else {
    items.push({
      label: isRunning ? "End task" : t("Start", 2),
      icon: isRunning ? stopIcon : playIcon,
      action: async () => {
        if (isRunning) await stopContainer(app, csrfToken.value, themeClasses.value.scopeSelector);
        else await startContainer(app, csrfToken.value, themeClasses.value.scopeSelector);
      },
      disabled: isPaused,
    });
  }

  items.push({
    label: "Restart",
    icon: restartIcon,
    action: async () => await restartContainer(app, csrfToken.value, themeClasses.value.scopeSelector),
    disabled: isExited || isRestarting,
  });

  if (!isDependency) {
    items.push({
      label: isPaused ? "Unpause" : "Pause",
      icon: isPaused ? unpauseIcon : pauseIcon,
      action: async () => {
        if (isPaused) await unpauseContainer(app, csrfToken.value, themeClasses.value.scopeSelector);
        else await pauseContainer(app, csrfToken.value, themeClasses.value.scopeSelector);
      },
      disabled: isExited || isRestarting,
    });
  }

  items.push({ divider: true });

  items.push(quickActionsFor(app, { parent: mainOfGroup(app), controlHub: false, editConfig: true }));

  if (!isDependency) {
    items.push({ divider: true });

    items.push({ label: "Export Config", icon: exportIcon, action: () => handleExport(app) });
    items.push({ label: "Import Config", icon: importIcon, action: () => triggerImport(app) });
  }

  if (!isDependency) {
    items.push({ divider: true });

    items.push({ label: "Update", icon: updateIcon, action: async () => await updateContainer(app, csrfToken.value, themeClasses.value.scopeSelector) });
  }

  items.push({ divider: true });

  items.push({ label: "Properties", icon: propertiesIcon, action: () => openProperties(app) });

  if (!isDependency) {
    items.push({ divider: true });

    items.push({
      label: "Uninstall",
      icon: uninstallIcon,
      action: () => {
        confirm({
          title: t("Confirm Uninstall"),
          content: t("Are you sure you want to uninstall {name}? This action cannot be undone.", { name: app.display_name || app.name }),
          okText: t("Uninstall"),
          cancelText: t("Cancel"),
          onOk: async () => await uninstallContainer(app, csrfToken.value, themeClasses.value.scopeSelector),
        });
      },
    });
  }

  return items;
});

async function handleExport(app: any) {
  try {
    const response = await axios.get("/api/get-compose-info", {
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      params: { containerName: app.name },
    });

    const content = response.data?.data?.ymlContent;
    if (!content || !content.trim()) return;

    const blob = new Blob([content], { type: "text/yaml;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.setAttribute("href", url);
    link.setAttribute("download", `${app.name}.yml`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    message.success(t("Configuration exported successfully"));
  } catch {
    message.error(t("Failed to export configuration"));
  }
}

function triggerImport(app: any) {
  importTarget.value = app;
  importInputRef.value?.click();
}

async function handleImportFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  const app = importTarget.value;

  input.value = "";
  importTarget.value = null;

  if (!file || !app) return;

  const formData = new FormData();
  formData.append("compose_file", file);
  formData.append("container_name", app.name);
  formData.append("homedock_csrf_token", csrfToken.value);

  try {
    const response = await fetch("/api/upload_compose_file", {
      method: "POST",
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      body: formData,
    });

    if (!response.ok) throw new Error("Upload failed");
    message.success(t("Configuration imported successfully"));
  } catch {
    message.error(t("Failed to import configuration"));
  }
}

let resizeObserver: ResizeObserver | null = null;

function updateLayout(width: number) {
  if (width <= 0) return;

  const previousWidth = containerWidth.value;
  containerWidth.value = width;

  if (!isMobileLayout.value && width < MOBILE_ENTER_THRESHOLD) isMobileLayout.value = true;
  else if (isMobileLayout.value && width > MOBILE_EXIT_THRESHOLD) isMobileLayout.value = false;

  // Only follow the width when it crosses the threshold, so the toggle stays the user's
  if (previousWidth === 0) railExpanded.value = width >= RAIL_EXPAND_THRESHOLD;
  else if (previousWidth >= RAIL_EXPAND_THRESHOLD && width < RAIL_EXPAND_THRESHOLD) railExpanded.value = false;
  else if (previousWidth < RAIL_EXPAND_THRESHOLD && width >= RAIL_EXPAND_THRESHOLD) railExpanded.value = true;
}

function revealApp(name: string) {
  if (!name) return;

  selectedName.value = name;
  setTab("processes");
  containerRef.value?.focus();
}

function handleIncomingApp(event: Event) {
  const detail = (event as CustomEvent).detail as { selectedApp?: string } | undefined;
  if (detail?.selectedApp) revealApp(detail.selectedApp);
}

onMounted(() => {
  if (props.selectedApp) revealApp(props.selectedApp);

  if (props._windowId) {
    window.addEventListener(`homedock:open-file-${props._windowId}`, handleIncomingApp as EventListener);
  }

  if (!containerRef.value) return;

  updateLayout(containerRef.value.offsetWidth);

  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) updateLayout(entry.contentRect.width);
  });

  resizeObserver.observe(containerRef.value);
});

onUnmounted(() => {
  if (props._windowId) {
    window.removeEventListener(`homedock:open-file-${props._windowId}`, handleIncomingApp as EventListener);
  }

  if (resizeObserver) resizeObserver.disconnect();
});
</script>

<style scoped>
.control-hub :deep(input::-webkit-search-cancel-button) {
  display: none;
}
</style>
