<!-- homedock-ui/vue3/static/js/__Components__/ControlHubPerformance.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="flex h-full min-h-0" :class="stacked ? 'flex-col' : 'flex-row'">
    <div v-if="stacked" :class="[themeClasses.fileExplorerSidebar]" class="flex w-full flex-shrink-0 border-b">
      <button v-for="metric in metrics" :key="metric.key" @click="selected = metric.key" :class="[themeClasses.fileExplorerSidebarItem]" class="flex flex-1 min-w-0 flex-col items-center gap-1 px-1 pt-2 pb-1.5 -mb-px border-b-2 bg-transparent cursor-pointer text-center transition-colors duration-150" :style="{ borderBottomColor: selected === metric.key ? metric.color : 'transparent' }" :title="$t(metric.label)">
        <Icon v-if="labelIcon(metric.label)" :icon="labelIcon(metric.label)!" class="w-4 h-4 flex-shrink-0 transition-opacity duration-150" :class="selected === metric.key ? 'opacity-100' : 'opacity-50'" :style="{ color: metric.color }" />
        <span class="max-w-full text-[10px] leading-none tabular-nums truncate" :class="selected === metric.key ? 'font-semibold' : 'font-normal opacity-60'">{{ metric.headline }}</span>
      </button>
    </div>

    <div v-else :class="[themeClasses.fileExplorerSidebar]" class="flex flex-col overflow-y-auto border-r w-[188px] flex-shrink-0 py-1">
      <button v-for="metric in metrics" :key="metric.key" @click="selected = metric.key" :class="[themeClasses.fileExplorerSidebarItem]" class="flex w-full items-center gap-2.5 pl-2 pr-3 py-2 border-l-2 bg-transparent cursor-pointer text-left transition-colors duration-150" :style="{ borderLeftColor: selected === metric.key ? metric.color : 'transparent', backgroundColor: selected === metric.key ? 'rgba(127,127,127,0.12)' : undefined }">
        <div class="w-11 h-8 flex-shrink-0 overflow-hidden" :style="{ backgroundColor: 'rgba(127,127,127,0.08)' }">
          <ControlHubGraph :values="history[metric.graphKey || metric.key] || []" :capacity="CAPACITY" :max="metric.graphMax" :color="metric.color" :line-width="1" />
        </div>
        <div class="flex flex-col min-w-0 gap-0.5">
          <span class="flex items-center gap-1.5 text-[11px] leading-none min-w-0" :class="selected === metric.key ? 'font-semibold' : 'font-medium'">
            <Icon v-if="labelIcon(metric.label)" :icon="labelIcon(metric.label)!" class="w-3 h-3 flex-shrink-0 transition-opacity duration-150" :class="selected === metric.key ? 'opacity-100' : 'opacity-50'" :style="{ color: metric.color }" />
            <span class="truncate">{{ $t(metric.label) }}</span>
          </span>
          <span class="text-[10px] leading-none opacity-60 truncate tabular-nums">{{ metric.headline }}</span>
        </div>
      </button>
    </div>

    <div class="flex-1 min-w-0 min-h-0 overflow-y-auto p-3 sm:p-4">
      <div class="flex items-start justify-between gap-3 mb-3">
        <div class="min-w-0">
          <h2 :class="[themeClasses.windowTitleTextFocused]" class="flex items-center gap-2 text-lg font-semibold leading-tight min-w-0">
            <Icon v-if="labelIcon(active.label)" :icon="labelIcon(active.label)!" class="w-4 h-4 flex-shrink-0" :style="{ color: active.color }" />
            <span class="truncate">{{ $t(active.label) }}</span>
          </h2>
          <p :class="[themeClasses.windowPlaceholderText]" class="text-[11px] mt-0.5 truncate">{{ active.subtitle }}</p>
        </div>
        <div class="text-right flex-shrink-0">
          <div class="text-2xl font-bold leading-none tabular-nums" :style="{ color: active.color }">{{ active.headline }}</div>
          <div :class="[themeClasses.windowPlaceholderText]" class="text-[10px] mt-1">{{ $t(active.headlineLabel) }}</div>
        </div>
      </div>

      <div class="relative w-full rounded-md overflow-hidden border" :class="[themeClasses.windowBorder]" :style="{ height: stacked ? '160px' : '220px', backgroundColor: 'rgba(127,127,127,0.05)' }">
        <ControlHubGraph :values="history[active.graphKey || active.key] || []" :capacity="CAPACITY" :max="active.graphMax" :color="active.color" grid />
        <ControlHubGraph v-if="active.overlay" class="absolute inset-0" :values="history[active.overlay.key] || []" :capacity="CAPACITY" :max="active.graphMax" :color="active.overlay.color" :line-width="1" />

        <span :class="[themeClasses.windowPlaceholderText]" class="absolute top-1 left-2 text-[10px] pointer-events-none">{{ $t(active.axisLabel) }}</span>
        <span :class="[themeClasses.windowPlaceholderText]" class="absolute top-1 right-2 text-[10px] pointer-events-none">{{ active.axisMax }}</span>
        <span :class="[themeClasses.windowPlaceholderText]" class="absolute bottom-1 left-2 text-[10px] pointer-events-none">{{ $t("60 seconds") }}</span>
        <span :class="[themeClasses.windowPlaceholderText]" class="absolute bottom-1 right-2 text-[10px] pointer-events-none">0</span>
      </div>

      <div v-if="active.legend" class="flex items-center gap-4 mt-2">
        <div v-for="entry in active.legend" :key="entry.label" class="flex items-center gap-1.5">
          <span class="w-3 h-0.5 rounded-full" :style="{ backgroundColor: entry.color }"></span>
          <span :class="[themeClasses.windowPlaceholderText]" class="text-[10px]">{{ $t(entry.label) }}</span>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
        <div v-for="stat in active.stats" :key="stat.label" class="rounded-lg px-3 py-2 border" :class="[themeClasses.appPropsUsageCardBg, themeClasses.appPropsUsageCardBorder, themeClasses.aeroExtraScope]">
          <div :class="[themeClasses.appPropsInfoLabel]" class="text-[10px] font-medium truncate">{{ $t(stat.label) }}</div>
          <div :class="[themeClasses.appPropsInfoValue]" class="text-sm font-bold mt-0.5 truncate tabular-nums">{{ stat.value }}</div>
        </div>
      </div>

      <div v-if="active.key === 'network'" class="flex items-center gap-2.5 mt-3">
        <Switch v-model:checked="containersOnly" name="ControlHubNetworkScope" id="ControlHubNetworkScope" />
        <span :class="[themeClasses.appPropsInfoLabel]" class="text-xs font-medium">{{ $t("Containers only") }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useSystemStatsStore } from "../__Stores__/useSystemStatsStore";
import { METRIC_COLORS, formatBytes, formatRate, labelIcon } from "../__Composables__/useControlHub";

import ControlHubGraph from "./ControlHubGraph.vue";

import { Icon } from "@iconify/vue";
import { Switch } from "ant-design-vue";

const CAPACITY = 60;
const MIN_NETWORK_SCALE = 64 * 1024;
const MIN_DISK_SCALE = 1024 * 1024;
const NETWORK_SCOPE_STORAGE_KEY = "controlHubNetworkScope";

interface Props {
  totalRates: { rx: number; tx: number };
  totalTraffic: { rx: number; tx: number };
  hostRates: { rx: number; tx: number };
  history: Record<string, number[]>;
  stacked: boolean;
}

interface Metric {
  key: string;
  graphKey?: string;
  label: string;
  color: string;
  graphMax: number;
  axisLabel: string;
  axisMax: string;
  headline: string;
  headlineLabel: string;
  subtitle: string;
  stats: { label: string; value: string }[];
  overlay?: { key: string; color: string };
  legend?: { color: string; label: string }[];
}

const props = defineProps<Props>();

const { t } = useI18n();
const { themeClasses } = useTheme();
const systemStats = useSystemStatsStore();

const selected = ref("cpu");

const containersOnly = ref(readStoredContainersOnly());

function readStoredContainersOnly(): boolean {
  try {
    return localStorage.getItem(NETWORK_SCOPE_STORAGE_KEY) === "containers";
  } catch {
    return false;
  }
}

watch(containersOnly, (value) => {
  try {
    localStorage.setItem(NETWORK_SCOPE_STORAGE_KEY, value ? "containers" : "host");
  } catch {
    // Halp!
  }
});

const networkKeys = computed(() => (containersOnly.value ? { down: "containerNetwork", up: "containerNetworkUp" } : { down: "network", up: "networkUp" }));

const networkRates = computed(() => (containersOnly.value ? props.totalRates : props.hostRates));

const networkScale = computed(() => {
  const series = [...(props.history[networkKeys.value.down] || []), ...(props.history[networkKeys.value.up] || [])];
  const peak = series.length ? Math.max(...series) : 0;
  return Math.max(MIN_NETWORK_SCALE, peak * 1.25);
});

const diskRates = computed(() => {
  const [read, write] = String(systemStats.diskIo).split("*");
  return { read: Number(read) || 0, write: Number(write) || 0 };
});

const diskScale = computed(() => {
  const series = [...(props.history.disk || []), ...(props.history.diskWrite || [])];
  const peak = series.length ? Math.max(...series) : 0;
  return Math.max(MIN_DISK_SCALE, peak * 1.25);
});

const loadAverages = computed(() => {
  const [one, five, fifteen] = String(systemStats.loadAverage).split("*");
  return { one: Number(one) || 0, five: Number(five) || 0, fifteen: Number(fifteen) || 0 };
});

const loadScale = computed(() => {
  const peak = (props.history.load || []).length ? Math.max(...props.history.load) : 0;
  return Math.max(Number(systemStats.cpuCores) || 1, peak * 1.25);
});

const totalRamGb = computed(() => Number(systemStats.totalRam) || 0);
const usedRamGb = computed(() => (totalRamGb.value * (Number(systemStats.ramUsage) || 0)) / 100);

const tempValue = computed(() => Math.round(parseFloat(String(systemStats.cpuTemp)) || 0));
const hasTemperature = computed(() => tempValue.value > 0);

const metrics = computed<Metric[]>(() =>
  [
    {
      key: "cpu",
      label: "CPU",
      color: METRIC_COLORS.cpu,
      graphMax: 100,
      axisLabel: "% Utilization",
      axisMax: "100%",
      headline: `${systemStats.cpuUsage}%`,
      headlineLabel: "Utilization",
      subtitle: Number(systemStats.cpuGhz) > 0 ? `${systemStats.cpuCores} ${t("cores")} @ ${systemStats.cpuGhz} GHz` : `${systemStats.cpuCores} ${t("cores")}`,
      stats: [{ label: "Utilization", value: `${systemStats.cpuUsage}%` }, { label: "Cores", value: String(systemStats.cpuCores) }, ...(hasTemperature.value ? [{ label: "Temperature", value: `${systemStats.cpuTemp} °C` }] : []), { label: "Up time", value: String(systemStats.uptimeData) }],
    },
    {
      key: "memory",
      label: "Memory",
      color: METRIC_COLORS.memory,
      graphMax: 100,
      axisLabel: "Memory usage",
      axisMax: `${totalRamGb.value} GB`,
      headline: `${systemStats.ramUsage}%`,
      headlineLabel: "In use",
      subtitle: `${totalRamGb.value} ${t("GB total")}`,
      stats: [
        { label: "In use", value: `${usedRamGb.value.toFixed(1)} GB` },
        { label: "Available", value: `${Math.max(0, totalRamGb.value - usedRamGb.value).toFixed(1)} GB` },
        { label: "Total", value: `${totalRamGb.value} GB` },
        { label: "Running", value: `${systemStats.activeContainers} / ${systemStats.totalContainers}` },
      ],
    },
    {
      key: "disk",
      label: "Disk",
      color: METRIC_COLORS.disk,
      graphMax: diskScale.value,
      axisLabel: "Throughput",
      axisMax: formatRate(diskScale.value),
      headline: formatRate(diskRates.value.read + diskRates.value.write),
      headlineLabel: "Activity",
      subtitle: t("System storage"),
      overlay: { key: "diskWrite", color: METRIC_COLORS.diskWrite },
      legend: [
        { color: METRIC_COLORS.disk, label: "Read" },
        { color: METRIC_COLORS.diskWrite, label: "Write" },
      ],
      stats: [
        { label: "Read", value: formatRate(diskRates.value.read) },
        { label: "Write", value: formatRate(diskRates.value.write) },
        { label: "Used", value: `${systemStats.diskUsage}%` },
        { label: "Free", value: `${Math.max(0, 100 - (Number(systemStats.diskUsage) || 0)).toFixed(1)}%` },
      ],
    },
    {
      key: "network",
      graphKey: networkKeys.value.down,
      label: "Network",
      color: METRIC_COLORS.network,
      graphMax: networkScale.value,
      axisLabel: "Throughput",
      axisMax: formatRate(networkScale.value),
      headline: formatRate(networkRates.value.rx),
      headlineLabel: "Download",
      subtitle: containersOnly.value ? t("Container traffic") : String(systemStats.interfaceName),
      overlay: { key: networkKeys.value.up, color: METRIC_COLORS.temperature },
      legend: [
        { color: METRIC_COLORS.network, label: "Download" },
        { color: METRIC_COLORS.temperature, label: "Upload" },
      ],
      stats: [
        { label: "Download", value: formatRate(networkRates.value.rx) },
        { label: "Upload", value: formatRate(networkRates.value.tx) },
        { label: "Received", value: containersOnly.value ? formatBytes(props.totalTraffic.rx) : `${systemStats.downloadData} GB` },
        { label: "Sent", value: containersOnly.value ? formatBytes(props.totalTraffic.tx) : `${systemStats.uploadData} GB` },
      ],
    },
    {
      key: "load",
      label: "Load",
      color: METRIC_COLORS.load,
      graphMax: loadScale.value,
      axisLabel: "Load average",
      axisMax: loadScale.value.toFixed(1),
      headline: loadAverages.value.one.toFixed(2),
      headlineLabel: "1 minute",
      subtitle: t("System load"),
      stats: [
        { label: "1 minute", value: loadAverages.value.one.toFixed(2) },
        { label: "5 minutes", value: loadAverages.value.five.toFixed(2) },
        { label: "15 minutes", value: loadAverages.value.fifteen.toFixed(2) },
        { label: "Cores", value: String(systemStats.cpuCores) },
      ],
    },
    {
      key: "temperature",
      label: "Temperature",
      color: METRIC_COLORS.temperature,
      graphMax: 100,
      axisLabel: "Degrees",
      axisMax: "100 °C",
      headline: `${systemStats.cpuTemp} °C`,
      headlineLabel: "CPU package",
      subtitle: t("CPU thermal sensor"),
      stats: [
        { label: "Temperature", value: `${systemStats.cpuTemp} °C` },
        { label: "Utilization", value: `${systemStats.cpuUsage}%` },
        { label: "Cores", value: String(systemStats.cpuCores) },
        { label: "HomeDock OS", value: String(systemStats.startTime) },
      ],
    },
  ].filter((metric) => metric.key !== "temperature" || hasTemperature.value),
);

watch(hasTemperature, (available) => {
  if (!available && selected.value === "temperature") selected.value = "cpu";
});

const active = computed(() => metrics.value.find((metric) => metric.key === selected.value) || metrics.value[0]);
</script>
