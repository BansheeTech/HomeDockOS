<!-- homedock-ui/vue3/static/js/__Apps__/AppSystemLogs.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="app-systemlogs flex flex-col h-full overflow-hidden">
    <div class="flex-1 overflow-auto p-4">
      <div class="mb-6">
        <SectionHeader title="Login Attempts" description="In-depth recent login attempts" :icon="accountAlertIcon" />
        <LoginAttempts />
      </div>

      <EnterpriseSlotRenderer module="SystemLogs2PDF" />

      <div class="system-metrics-grid gap-x-4">
        <div>
          <SectionHeader title="CPU Temperature" description="In-depth CPU insights" :icon="thermometerLowIcon" />
          <ChartDetails apiEndpoint="/api/system-logs/serve_temperature" :csrfToken="csrfToken" :streamLines="3" :streamData="['avg', 'max', 'min']" :streamStyle="['solid', 'dashed', 'dashed']" :streamBorderWidth="[3, 1, 1]" leftLegend="°c" :streamFill="[1]" />
        </div>

        <div>
          <SectionHeader title="CPU Usage" description="In-depth CPU insights" :icon="speedometerMediumIcon" />
          <ChartDetails apiEndpoint="/api/system-logs/serve_cpu_usage" :csrfToken="csrfToken" :streamLines="3" :streamData="['avg', 'max', 'min']" :streamStyle="['solid', 'dashed', 'dashed']" :streamBorderWidth="[3, 1, 1]" leftLegend="%" :streamFill="[1]" />
        </div>

        <div>
          <SectionHeader title="RAM Usage" description="In-depth RAM insights" :icon="memoryIcon" />
          <ChartDetails apiEndpoint="/api/system-logs/serve_ram_usage" :csrfToken="csrfToken" :streamLines="3" :streamData="['avg', 'max', 'min']" :streamStyle="['solid', 'dashed', 'dashed']" :streamBorderWidth="[3, 1, 1]" leftLegend="%" :streamFill="[1]" />
        </div>

        <div>
          <SectionHeader title="Network Usage" description="In-depth network insights" :icon="networkStrength2Icon" />
          <ChartDetails apiEndpoint="/api/system-logs/serve_network_usage" :csrfToken="csrfToken" :streamLines="2" :streamData="['download', 'upload']" :streamStyle="['solid', 'dashed']" :streamBorderWidth="[3, 1]" leftLegend="GBs" :streamFill="[1]" />
        </div>

        <div>
          <SectionHeader title="System Disk Usage" description="In-depth System Disk insights" :icon="microSdIcon" />
          <ChartDetails apiEndpoint="/api/system-logs/serve_disk_usage" :csrfToken="csrfToken" :streamLines="1" :streamData="['avg']" :streamStyle="['solid']" leftLegend="%" :streamFill="[1]" />
        </div>

        <div v-if="!externalDiskDisabled">
          <SectionHeader title="External Disk Usage" description="In-depth external disk insights" :icon="hardDiskIcon" />
          <ChartDetails apiEndpoint="/api/system-logs/serve_external_disk_usage" :csrfToken="csrfToken" :streamData="['avg']" :streamStyle="['solid']" leftLegend="%" :streamFill="[1]" />
        </div>
      </div>
    </div>

    <StatusBar :icon="chartTimelineVariantIcon" message="System Logs" info="Logs retained for 48 hours" :showHelp="true">
      <template #help>
        <div class="space-y-2.5 max-w-sm">
          <div class="flex items-center gap-2">
            <Icon :icon="chartTimelineVariantIcon" :class="['w-5 h-5', themeClasses.statusBarIcon]" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">System Logs</h4>
          </div>

          <div :class="['text-[10px] md:text-xs space-y-2 leading-relaxed', themeClasses.statusBarInfo]">
            <p>Track login attempts and system performance metrics over time. Login logs are fully relational and searchable by IP, username, or status. HomeDock OS includes Shield Mode, a proprietary security feature that detects coordinated attacks and activates progressive lockout measures to prevent brute-force attempts while keeping legitimate access available.</p>
          </div>
        </div>
      </template>
    </StatusBar>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useSystemStatsStore } from "../__Stores__/useSystemStatsStore";

import SectionHeader from "../__Components__/SectionHeader.vue";
import LoginAttempts from "../__Components__/LoginAttempts.vue";
import ChartDetails from "../__Components__/ChartDetails.vue";
import StatusBar from "../__Components__/StatusBar.vue";
import EnterpriseSlotRenderer from "../__Components__/EnterpriseSlotRenderer.vue";

import { Icon } from "@iconify/vue";
import thermometerLowIcon from "@iconify-icons/mdi/thermometer-low";
import speedometerMediumIcon from "@iconify-icons/mdi/speedometer-medium";
import memoryIcon from "@iconify-icons/mdi/memory";
import networkStrength2Icon from "@iconify-icons/mdi/network-strength-2";
import microSdIcon from "@iconify-icons/mdi/micro-sd";
import hardDiskIcon from "@iconify-icons/mdi/harddisk";
import accountAlertIcon from "@iconify-icons/mdi/account-alert";
import chartTimelineVariantIcon from "@iconify-icons/mdi/chart-timeline-variant";

const csrfToken = useCsrfToken();
const systemStatsStore = useSystemStatsStore();

const { themeClasses } = useTheme();

const externalDiskDisabled = computed(() => {
  const externalDisk = systemStatsStore.externalDefaultDisk;
  const externalTotal = systemStatsStore.externalDiskTotal;

  if (!externalDisk || externalDisk === "disabled") {
    return true;
  }

  if (!externalTotal || externalTotal === "0") {
    return true;
  }

  return false;
});
</script>

<style scoped>
/* System Metrics Grid  */
.system-metrics-grid {
  display: grid;
  grid-template-columns: 1fr;
}

.system-metrics-grid > div {
  min-width: 0;
}

@container window (min-width: 900px) {
  .system-metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
