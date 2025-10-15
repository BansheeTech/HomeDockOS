<!-- homedock-ui/vue3/static/js/__Desktop__/SystemStatsWidget.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="system-stats-widget" ref="widgetRef">
    <div class="compact-view" :class="[themeClasses.statsWidgetCompactBg, themeClasses.statsWidgetCompactBgHover]" @click="toggleExpanded" :title="isExpanded ? 'Click to collapse' : 'Click to expand'">
      <div class="stat-item">
        <Icon :icon="cpuIcon" class="stat-icon-bg" :class="themeClasses.statsWidgetIconColor" />
        <span class="stat-value" :class="[themeClasses.statsWidgetValueColor, cpuValue > 95 ? themeClasses.statsWidgetStatValueDanger : cpuValue > 80 ? themeClasses.statsWidgetStatValueWarning : '']"> {{ cpuValue }}% </span>
      </div>
    </div>

    <Transition name="dropdown">
      <div v-if="isExpanded" class="stats-dropdown border" :class="[themeClasses.statsWidgetDropdownBg, themeClasses.statsWidgetDropdownBorder, themeClasses.statsWidgetDropdownShadow]">
        <div class="stats-header px-6 py-4 rounded-t-lg text-sm font-medium flex items-center space-x-3" :class="themeClasses.topBack">
          <span class="stats-title" :class="themeClasses.notTextUp">System Monitor</span>
        </div>

        <div class="stats-section" :class="themeClasses.statsWidgetSectionBorder">
          <div class="section-label" :class="themeClasses.statsWidgetSectionLabel">Performance</div>

          <div v-if="tempValue > 0" class="stat-card">
            <div class="stat-header">
              <Icon :icon="tempIcon" class="stat-icon" :class="themeClasses.statsWidgetStatIcon" />
              <span class="stat-name" :class="themeClasses.statsWidgetStatName">CPU Temperature</span>
              <span class="stat-main-value" :class="[themeClasses.statsWidgetStatValue, tempValue > 85 ? themeClasses.statsWidgetStatValueDanger : tempValue > 70 ? themeClasses.statsWidgetStatValueWarning : '']"> {{ tempValue }}°C </span>
            </div>
            <div class="stat-meta" :class="themeClasses.statsWidgetStatMeta">{{ cpuGhz }} GHz</div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <Icon :icon="cpuIcon" class="stat-icon" :class="themeClasses.statsWidgetStatIcon" />
              <span class="stat-name" :class="themeClasses.statsWidgetStatName">CPU</span>
              <span class="stat-main-value" :class="[themeClasses.statsWidgetStatValue, cpuValue > 95 ? themeClasses.statsWidgetStatValueDanger : cpuValue > 80 ? themeClasses.statsWidgetStatValueWarning : '']"> {{ cpuValue }}% </span>
            </div>
            <div class="progress-bar" :class="themeClasses.statsWidgetProgressBg">
              <div class="progress-fill" :class="[cpuValue > 95 ? themeClasses.statsWidgetProgressFillDanger : cpuValue > 80 ? themeClasses.statsWidgetProgressFillWarning : themeClasses.statsWidgetProgressFill]" :style="{ width: cpuValue + '%' }"></div>
            </div>
            <div class="stat-meta" :class="themeClasses.statsWidgetStatMeta">{{ cpuCores }} cores</div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <Icon :icon="ramIcon" class="stat-icon" :class="themeClasses.statsWidgetStatIcon" />
              <span class="stat-name" :class="themeClasses.statsWidgetStatName">Memory</span>
              <span class="stat-main-value" :class="[themeClasses.statsWidgetStatValue, ramValue > 95 ? themeClasses.statsWidgetStatValueDanger : ramValue > 80 ? themeClasses.statsWidgetStatValueWarning : '']"> {{ ramValue }}% </span>
            </div>
            <div class="progress-bar" :class="themeClasses.statsWidgetProgressBg">
              <div class="progress-fill" :class="[ramValue > 95 ? themeClasses.statsWidgetProgressFillDanger : ramValue > 80 ? themeClasses.statsWidgetProgressFillWarning : themeClasses.statsWidgetProgressFill]" :style="{ width: ramValue + '%' }"></div>
            </div>
            <div class="stat-meta" :class="themeClasses.statsWidgetStatMeta">{{ totalRam }} GB total</div>
          </div>
        </div>

        <div class="stats-section" :class="themeClasses.statsWidgetSectionBorder">
          <div class="section-label" :class="themeClasses.statsWidgetSectionLabel">Storage</div>

          <div class="stat-card">
            <div class="stat-header">
              <Icon :icon="diskIcon" class="stat-icon" :class="themeClasses.statsWidgetStatIcon" />
              <span class="stat-name" :class="themeClasses.statsWidgetStatName">System</span>
              <span class="stat-main-value" :class="[themeClasses.statsWidgetStatValue, diskValue > 95 ? themeClasses.statsWidgetStatValueDanger : diskValue > 80 ? themeClasses.statsWidgetStatValueWarning : '']"> {{ diskValue }}% </span>
            </div>
            <div class="progress-bar" :class="themeClasses.statsWidgetProgressBg">
              <div class="progress-fill" :class="[diskValue > 95 ? themeClasses.statsWidgetProgressFillDanger : diskValue > 80 ? themeClasses.statsWidgetProgressFillWarning : themeClasses.statsWidgetProgressFill]" :style="{ width: diskValue + '%' }"></div>
            </div>
            <div class="stat-meta" :class="themeClasses.statsWidgetStatMeta">{{ hardDiskTotal }} GB</div>
          </div>

          <div v-if="externalDefaultDisk !== 'disabled' && externalDiskValue > 0" class="stat-card">
            <div class="stat-header">
              <Icon :icon="externalDiskIcon" class="stat-icon" :class="themeClasses.statsWidgetStatIcon" />
              <span class="stat-name" :class="themeClasses.statsWidgetStatName">External</span>
              <span class="stat-main-value" :class="[themeClasses.statsWidgetStatValue, externalDiskValue > 95 ? themeClasses.statsWidgetStatValueDanger : externalDiskValue > 80 ? themeClasses.statsWidgetStatValueWarning : '']"> {{ externalDiskValue }}% </span>
            </div>
            <div class="progress-bar" :class="themeClasses.statsWidgetProgressBg">
              <div class="progress-fill" :class="[externalDiskValue > 95 ? themeClasses.statsWidgetProgressFillDanger : externalDiskValue > 80 ? themeClasses.statsWidgetProgressFillWarning : themeClasses.statsWidgetProgressFill]" :style="{ width: externalDiskValue + '%' }"></div>
            </div>
            <div class="stat-meta" :class="themeClasses.statsWidgetStatMeta">{{ formattedExternalDiskTotal }} {{ diskUnit }}</div>
          </div>
        </div>

        <div class="stats-section" :class="themeClasses.statsWidgetSectionBorder">
          <div class="section-label" :class="themeClasses.statsWidgetSectionLabel">Network</div>
          <div class="stat-grid">
            <div class="stat-mini" :class="[themeClasses.statsWidgetMiniCardBg, themeClasses.statsWidgetMiniCardBgHover]">
              <Icon :icon="downloadIcon" class="stat-icon-small" :class="themeClasses.statsWidgetMiniIconColor" />
              <div class="stat-mini-content">
                <div class="stat-mini-label" :class="themeClasses.statsWidgetMiniLabelColor">Download</div>
                <div class="stat-mini-value" :class="themeClasses.statsWidgetMiniValueColor">
                  {{ networkDownValue }} <span class="stat-unit" :class="themeClasses.statsWidgetUnitColor">{{ networkDownUnit }}</span>
                </div>
              </div>
            </div>
            <div class="stat-mini" :class="[themeClasses.statsWidgetMiniCardBg, themeClasses.statsWidgetMiniCardBgHover]">
              <Icon :icon="uploadIcon" class="stat-icon-small" :class="themeClasses.statsWidgetMiniIconColor" />
              <div class="stat-mini-content">
                <div class="stat-mini-label" :class="themeClasses.statsWidgetMiniLabelColor">Upload</div>
                <div class="stat-mini-value" :class="themeClasses.statsWidgetMiniValueColor">
                  {{ networkUpValue }} <span class="stat-unit" :class="themeClasses.statsWidgetUnitColor">{{ networkUpUnit }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="stats-section" :class="themeClasses.statsWidgetSectionBorder">
          <div class="section-label" :class="themeClasses.statsWidgetSectionLabel">Apps</div>
          <div class="stat-grid">
            <div class="stat-mini" :class="[themeClasses.statsWidgetMiniCardBg, themeClasses.statsWidgetMiniCardBgHover]">
              <Icon :icon="appsIcon" class="stat-icon-small" :class="themeClasses.statsWidgetMiniIconColor" />
              <div class="stat-mini-content">
                <div class="stat-mini-label" :class="themeClasses.statsWidgetMiniLabelColor">Installed</div>
                <div class="stat-mini-value" :class="themeClasses.statsWidgetMiniValueColor">{{ totalApps }}</div>
              </div>
            </div>
            <div class="stat-mini" :class="[themeClasses.statsWidgetMiniCardBg, themeClasses.statsWidgetMiniCardBgHover]">
              <Icon :icon="containerIcon" class="stat-icon-small" :class="themeClasses.statsWidgetMiniIconColor" />
              <div class="stat-mini-content">
                <div class="stat-mini-label" :class="themeClasses.statsWidgetMiniLabelColor">Active</div>
                <div class="stat-mini-value" :class="themeClasses.statsWidgetMiniValueColor">
                  {{ activeContainers }} <span class="stat-unit" :class="themeClasses.statsWidgetUnitColor">/ {{ totalContainers }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="stats-section" :class="themeClasses.statsWidgetSectionBorder">
          <div class="section-label" :class="themeClasses.statsWidgetSectionLabel">Uptime</div>
          <div class="stat-grid">
            <div class="stat-mini" :class="[themeClasses.statsWidgetMiniCardBg, themeClasses.statsWidgetMiniCardBgHover]">
              <Icon :icon="serverIcon" class="stat-icon-small" :class="themeClasses.statsWidgetMiniIconColor" />
              <div class="stat-mini-content">
                <div class="stat-mini-label" :class="themeClasses.statsWidgetMiniLabelColor">System</div>
                <div class="stat-mini-value small" :class="themeClasses.statsWidgetMiniValueColor">{{ systemUptime }}</div>
              </div>
            </div>
            <div class="stat-mini" :class="[themeClasses.statsWidgetMiniCardBg, themeClasses.statsWidgetMiniCardBgHover]">
              <Icon :icon="uptimeIcon" class="stat-icon-small" :class="themeClasses.statsWidgetMiniIconColor" />
              <div class="stat-mini-content">
                <div class="stat-mini-label" :class="themeClasses.statsWidgetMiniLabelColor">HomeDock OS</div>
                <div class="stat-mini-value small" :class="themeClasses.statsWidgetMiniValueColor">{{ homeDockUptime }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, inject, onMounted, onUnmounted } from "vue";

import { Icon } from "@iconify/vue";
import cpuIcon from "@iconify-icons/mdi/speedometer";
import ramIcon from "@iconify-icons/mdi/memory";
import tempIcon from "@iconify-icons/mdi/thermometer";
import diskIcon from "@iconify-icons/mdi/harddisk";
import externalDiskIcon from "@iconify-icons/mdi/usb-flash-drive";
import downloadIcon from "@iconify-icons/mdi/download";
import uploadIcon from "@iconify-icons/mdi/upload";
import containerIcon from "@iconify-icons/mdi/docker";
import appsIcon from "@iconify-icons/mdi/apps";
import uptimeIcon from "@iconify-icons/mdi/clock-outline";
import serverIcon from "@iconify-icons/mdi/server";

import { useCpuTempUpdater } from "../__Services__/DashboardCPUTemp";
import { useCpuUsageUpdater } from "../__Services__/DashboardCPUUsage";
import { useRamUsageUpdater } from "../__Services__/DashboardRAMUsage";
import { useHardDiskUsageUpdater } from "../__Services__/DashboardHardDiskUsage";
import { useExternalDiskUsageUpdater } from "../__Services__/DashboardExternalDiskUsage";
import { useNetworkDataUpdater } from "../__Services__/DashboardNetworkUsage";
import { useContainersDataUpdater } from "../__Services__/DashboardContainersUsage";
import { useUptimeUpdater } from "../__Services__/DashboardUptimeUsage";
import { useTheme } from "../__Themes__/ThemeSelector";

interface Props {
  csrfToken: string;
  showTemp?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showTemp: true,
});

const { themeClasses } = useTheme();

const dashboardData = inject<{
  cpuTemp?: string;
  cpuGhz?: string;
  cpuUsage?: string;
  cpuCores?: string;
  ramUsage?: string;
  totalRam?: string;
  hardDiskUsage?: string;
  hardDiskTotal?: string;
  externalDefaultDisk?: string;
  externalDiskUsage?: string;
  externalDiskTotal?: string;
  interfaceName?: string;
  downloadData?: string;
  uploadData?: string;
  totalContainers?: string;
  activeContainers?: string;
  uptimeData?: string;
  startTime?: string;
}>("data-dashboard");

const widgetRef = ref<HTMLElement | null>(null);

const isExpanded = ref(false);

function toggleExpanded(e: MouseEvent) {
  e.stopPropagation();
  isExpanded.value = !isExpanded.value;
}

function closeDropdown() {
  isExpanded.value = false;
}

function handleClickOutside(event: MouseEvent) {
  if (widgetRef.value && !widgetRef.value.contains(event.target as Node)) {
    closeDropdown();
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

const dynCpuUsage = useCpuUsageUpdater(props.csrfToken, 3000, dashboardData?.cpuUsage || "0");
const cpuUsage = computed(() => dynCpuUsage.value || dashboardData?.cpuUsage || "0");
const cpuValue = computed(() => Math.round(parseFloat(cpuUsage.value) || 0));
const cpuCores = ref(dashboardData?.cpuCores || "0");
const cpuGhz = ref(dashboardData?.cpuGhz || "0");

const dynRamUsage = useRamUsageUpdater(props.csrfToken, 3000, dashboardData?.ramUsage || "0");
const ramUsage = computed(() => dynRamUsage.value || dashboardData?.ramUsage || "0");
const ramValue = computed(() => Math.round(parseFloat(ramUsage.value) || 0));
const totalRam = ref(dashboardData?.totalRam || "0");

const dynCpuTemp = useCpuTempUpdater(props.csrfToken, 3000, dashboardData?.cpuTemp || "0");
const cpuTemp = computed(() => dynCpuTemp.value || dashboardData?.cpuTemp || "0");
const tempValue = computed(() => Math.round(parseFloat(cpuTemp.value) || 0));

const dynDiskUsage = useHardDiskUsageUpdater(props.csrfToken, 3000, dashboardData?.hardDiskUsage || "0");
const diskUsage = computed(() => dynDiskUsage.value || dashboardData?.hardDiskUsage || "0");
const diskValue = computed(() => Math.round(parseFloat(diskUsage.value) || 0));
const hardDiskTotal = ref(dashboardData?.hardDiskTotal || "0");

const externalDefaultDisk = ref(dashboardData?.externalDefaultDisk || "disabled");
const dynExternalDiskUsage = useExternalDiskUsageUpdater(props.csrfToken, 3000, dashboardData?.externalDiskUsage || "0");
const externalDiskUsage = computed(() => dynExternalDiskUsage.value || dashboardData?.externalDiskUsage || "0");
const externalDiskValue = computed(() => Math.round(parseFloat(externalDiskUsage.value) || 0));
const externalDiskTotal = ref(dashboardData?.externalDiskTotal || "0");
const formattedExternalDiskTotal = computed(() => {
  const totalGB = Number(externalDiskTotal.value);
  if (isNaN(totalGB)) return "0";
  return totalGB > 900 ? (totalGB / 1024).toFixed(2) : totalGB.toString();
});
const diskUnit = computed(() => {
  const totalGB = Number(externalDiskTotal.value);
  return totalGB > 900 ? "TB" : "GB";
});

const interfaceName = ref(dashboardData?.interfaceName || "Network");
const { downloadData: dynDownloadData, uploadData: dynUploadData } = useNetworkDataUpdater(props.csrfToken, 3000, dashboardData?.downloadData || "0 GB", dashboardData?.uploadData || "0 GB");
const networkDown = computed(() => dynDownloadData.value || dashboardData?.downloadData || "0 GB");
const networkUp = computed(() => dynUploadData.value || dashboardData?.uploadData || "0 GB");

const networkDownValue = computed(() => networkDown.value.split(" ")[0]);
const networkDownUnit = computed(() => networkDown.value.split(" ")[1] || "GB");
const networkUpValue = computed(() => networkUp.value.split(" ")[0]);
const networkUpUnit = computed(() => networkUp.value.split(" ")[1] || "GB");

const { totalContainers: dynTotalContainers, activeContainers: dynActiveContainers } = useContainersDataUpdater(props.csrfToken, 3000, dashboardData?.totalContainers || "0", dashboardData?.activeContainers || "0");
const totalContainers = computed(() => dynTotalContainers.value || dashboardData?.totalContainers || "0");
const activeContainers = computed(() => dynActiveContainers.value || dashboardData?.activeContainers || "0");

import { useDesktopStore } from "../__Stores__/desktopStore";
const desktopStore = useDesktopStore();
const totalApps = computed(() => desktopStore.mainDockerApps.length.toString());

const { systemUptime: dynSystemUptime, homeDockUptime: dynHomeDockUptime } = useUptimeUpdater(props.csrfToken, 3000, dashboardData?.uptimeData || "0d 0h", dashboardData?.startTime || "0d 0h");
const systemUptime = computed(() => dynSystemUptime.value || dashboardData?.uptimeData || "0d 0h");
const homeDockUptime = computed(() => dynHomeDockUptime.value || dashboardData?.startTime || "0d 0h");
</script>

<style scoped>
.system-stats-widget {
  position: relative;
  user-select: none;
}

.compact-view {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 8px;
  transition: all 0.15s ease;
  cursor: pointer;
}

.stat-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}

.stat-icon-bg {
  width: 18px;
  height: 18px;
  transition: all 0.2s ease;
}

.stat-value {
  position: absolute;
  font-size: 0.5rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.compact-view:hover .stat-icon-bg {
  opacity: 0.2;
}

.compact-view:hover .stat-value {
  opacity: 1;
}

.stats-dropdown {
  position: fixed;
  right: 1rem;
  left: auto;
  bottom: 4rem;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
  border-radius: 12px;
  width: 280px;
  z-index: 9999;
  overflow: hidden;
}

.stats-header {
  padding: 0.75rem 0.875rem;
}

.stats-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stats-section {
  padding: 0.75rem 0.875rem;
}

.stats-section:last-child {
  border-bottom: none;
}

.section-label {
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 0.5rem;
}

/* Stat Cards */
.stat-card {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.5rem 0;
}

.stat-card:not(:last-child) {
  margin-bottom: 0.375rem;
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-name {
  font-size: 0.7rem;
  font-weight: 500;
  flex: 1;
}

.stat-main-value {
  font-size: 0.8rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.stat-meta {
  font-size: 0.625rem;
  padding-left: 1.5rem;
}

.stat-icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}

.progress-bar {
  height: 3px;
  border-radius: 2px;
  overflow: hidden;
  margin-left: 1.5rem;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease, background 0.2s ease;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.stat-mini {
  display: flex;
  align-items: flex-start;
  gap: 0.375rem;
  padding: 0.4rem;
  border-radius: 6px;
  transition: background 0.15s ease;
}

.stat-icon-small {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.stat-mini-content {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
  min-width: 0;
}

.stat-mini-label {
  font-size: 0.6rem;
  font-weight: 500;
}

.stat-mini-value {
  font-size: 0.7rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.stat-mini-value.small {
  font-size: 0.65rem;
}

.stat-mini-badge {
  font-size: 0.6rem;
  font-weight: 500;
}

.stat-unit {
  font-size: 0.6rem;
  font-weight: 500;
}

@keyframes pulse-danger {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Dropdown Animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .compact-view {
    padding: 0.25rem 0.375rem;
  }

  .compact-view .stat-item {
    gap: 0.25rem;
  }

  .stats-dropdown {
    width: 240px;
  }

  .compact-view .stat-icon {
    width: 12px;
    height: 12px;
  }

  .compact-view .stat-value {
    font-size: 0.675rem;
  }

  .stats-header {
    padding: 0.5rem 0.625rem;
  }

  .stats-title {
    font-size: 0.675rem;
  }

  .stats-section {
    padding: 0.5rem 0.625rem;
  }

  .section-label {
    font-size: 0.575rem;
    margin-bottom: 0.375rem;
  }

  .stat-card {
    padding: 0.375rem 0;
  }

  .stat-card:not(:last-child) {
    margin-bottom: 0.25rem;
  }

  .stat-icon {
    width: 13px;
    height: 13px;
  }

  .stat-name {
    font-size: 0.65rem;
  }

  .stat-main-value {
    font-size: 0.75rem;
  }

  .stat-meta {
    font-size: 0.575rem;
    padding-left: 1.375rem;
  }

  .progress-bar {
    margin-left: 1.375rem;
    height: 2.5px;
  }

  .stat-grid {
    gap: 0.375rem;
  }

  .stat-mini {
    padding: 0.3rem;
  }

  .stat-icon-small {
    width: 11px;
    height: 11px;
  }

  .stat-mini-label {
    font-size: 0.55rem;
  }

  .stat-mini-value {
    font-size: 0.65rem;
  }

  .stat-mini-value.small {
    font-size: 0.6rem;
  }

  .stat-mini-badge {
    font-size: 0.55rem;
  }

  .stat-unit {
    font-size: 0.575rem;
  }
}
</style>
