<!-- src/static/js/__Components__/StatsLoad.vue -->
<!-- Copyright © 2023-2025 Banshee -->
<!-- https://www.banshee.pro -->

<template>
  <div class="flex flex-col">
    <div class="flex mb-2 justify-between items-start overflow-x-auto">
      <Stats v-if="Number(cpuTemp) !== 0" :showProgressBar="true" :title="'CPU Temp'" :progressText="cpuGhz" :progressTextSecond="'GHz'" :value="cpuTemp" :nValue="'c'" :mdi_icon="StatsIconThermal" />
      <Stats :showProgressBar="true" :title="'CPU Usage'" :progressText="cpuCores" :progressTextSecond="'core'" :value="cpuUsage" :nValue="'%'" :mdi_icon="StatsIconSpeed" />
      <Stats :showProgressBar="true" :title="'RAM Usage'" :progressText="totalRam" :progressTextSecond="'GBs'" :value="ramUsage" :nValue="'%'" :mdi_icon="StatsIconMemory" />
      <Stats :showProgressBar="true" :title="'System'" :progressText="hardDiskTotal" :progressTextSecond="'GBs'" :value="hardDiskUsage" :nValue="'%'" :mdi_icon="StatsIconMicroSD" />
      <Stats v-if="externalDefaultDisk !== 'disabled'" :showProgressBar="true" :title="'External'" :progressText="(Number(externalDiskTotal) / 1024).toFixed(2)" :progressTextSecond="'TBs'" :value="externalDiskUsage" :nValue="'%'" :mdi_icon="StatsIconHardDisk" />
      <Stats :showProgressBar="false" :title="interfaceName" :value="downloadData" :nValue="'GBs'" :nValue2="'GBs'" :downText="uploadData" :mdi_icon="StatsIconNetwork" />
      <Stats :title="'Apps'" :value="totalContainers" :nValue="'total'" :nValue2="' running'" :downText="activeContainers" :mdi_icon="StatsIconDotsSquare" />
      <Stats :title="'Uptime'" :value="uptimeData" :nValue="'h'" :nValue2="'h'" :downText="startTime" :mdi_icon="StatsIconClockOutline" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, PropType } from "vue";

import Stats from "../__Components__/Stats.vue";

import StatsIconThermal from "@iconify-icons/mdi/thermometer-low";
import StatsIconSpeed from "@iconify-icons/mdi/speedometer-medium";
import StatsIconMemory from "@iconify-icons/mdi/memory";
import StatsIconMicroSD from "@iconify-icons/mdi/micro-sd";
import StatsIconHardDisk from "@iconify-icons/mdi/harddisk";
import StatsIconNetwork from "@iconify-icons/mdi/network-strength-2";
import StatsIconDotsSquare from "@iconify-icons/mdi/dots-square";
import StatsIconClockOutline from "@iconify-icons/mdi/clock-outline";

import { useCpuTempUpdater } from "../__Services__/DashboardCPUTemp";
import { useCpuUsageUpdater } from "../__Services__/DashboardCPUUsage";
import { useRamUsageUpdater } from "../__Services__/DashboardRAMUsage";
import { useHardDiskUsageUpdater } from "../__Services__/DashboardHardDiskUsage";
import { useExternalDiskUsageUpdater } from "../__Services__/DashboardExternalDiskUsage";
import { useNetworkDataUpdater } from "../__Services__/DashboardNetworkUsage";
import { useContainersDataUpdater } from "../__Services__/DashboardContainersUsage";
import { useUptimeUpdater } from "../__Services__/DashboardUptimeUsage";

const props = defineProps({
  csrfToken: {
    type: String as PropType<string>,
    required: true,
  },
});

const initialData = inject<{
  cpuTemp: string;
  cpuGhz: string;
  cpuUsage: string;
  cpuCores: string;
  ramUsage: string;
  totalRam: string;
  hardDiskUsage: string;
  hardDiskTotal: string;
  externalDefaultDisk: string;
  externalDiskUsage: string;
  externalDiskTotal: string;
  interfaceName: string;
  downloadData: string;
  uploadData: string;
  totalContainers: string;
  activeContainers: string;
  uptimeData: string;
  startTime: string;
}>("data-initial");

if (!initialData) {
  throw new Error("Initial data is missing!");
}

const dynCpuTemp = useCpuTempUpdater(props.csrfToken, 3000, initialData.cpuTemp);
const cpuTemp = computed(() => dynCpuTemp.value || initialData.cpuTemp);
const cpuGhz = ref(initialData.cpuGhz);

const dynCpuUsage = useCpuUsageUpdater(props.csrfToken, 3000, initialData.cpuUsage);
const cpuUsage = computed(() => dynCpuUsage.value || initialData.cpuUsage);
const cpuCores = ref(initialData.cpuCores);

const dynRamUsage = useRamUsageUpdater(props.csrfToken, 3000, initialData.ramUsage);
const ramUsage = computed(() => dynRamUsage.value || initialData.ramUsage);
const totalRam = ref(initialData.totalRam);

const dynHardDiskUsage = useHardDiskUsageUpdater(props.csrfToken, 3000, initialData.hardDiskUsage);
const hardDiskUsage = computed(() => dynHardDiskUsage.value || initialData.hardDiskUsage);
const hardDiskTotal = ref(initialData.hardDiskTotal);

const externalDefaultDisk = ref(initialData.externalDefaultDisk);
const dynExternalDiskUsage = useExternalDiskUsageUpdater(props.csrfToken, 3000, initialData.externalDiskUsage);
const externalDiskUsage = computed(() => dynExternalDiskUsage.value || initialData.externalDiskUsage);
const externalDiskTotal = ref(initialData.externalDiskTotal);

const interfaceName = ref(initialData.interfaceName);
const { downloadData: dynDownloadData, uploadData: dynUploadData } = useNetworkDataUpdater(props.csrfToken, 3000, initialData.downloadData, initialData.uploadData);
const downloadData = computed(() => dynDownloadData.value || initialData.downloadData);
const uploadData = computed(() => dynUploadData.value || initialData.uploadData);

const { totalContainers: dynTotalContainers, activeContainers: dynActiveContainers } = useContainersDataUpdater(props.csrfToken, 3000, initialData.totalContainers, initialData.activeContainers);
const totalContainers = computed(() => dynTotalContainers.value || initialData.totalContainers);
const activeContainers = computed(() => dynActiveContainers.value || initialData.activeContainers);

const { systemUptime: dynSystemUptime, homeDockUptime: dynHomeDockUptime } = useUptimeUpdater(props.csrfToken, 3000, initialData.uptimeData, initialData.startTime);
const uptimeData = computed(() => dynSystemUptime.value || initialData.uptimeData);
const startTime = computed(() => dynHomeDockUptime.value || initialData.startTime);
</script>
