<!-- homedock-ui/vue3/static/js/__Desktop__/SystemStatsWidget.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="system-stats-widget" ref="widgetRef">
    <div class="compact-view" :class="[themeClasses.statsWidgetCompactBg, themeClasses.statsWidgetCompactBgHover]" @click="toggleExpanded" :title="isExpanded ? 'Click to collapse' : 'Click to expand'">
      <div class="stat-item">
        <Transition name="icon-fade">
          <Icon :key="cpuIconKey" :icon="cpuIcon" class="stat-icon-bg" :class="themeClasses.statsWidgetIconColor" />
        </Transition>
        <span class="stat-value" :class="[themeClasses.statsWidgetValueColor, cpuValue > 95 ? themeClasses.statsWidgetStatValueDanger : cpuValue > 80 ? themeClasses.statsWidgetStatValueWarning : '']"> {{ cpuValue }}% </span>
      </div>
    </div>

    <Transition name="dropdown">
      <Teleport to="body">
        <div v-if="isExpanded" ref="dropdownRef" class="stats-dropdown border" :class="[themeClasses.statsWidgetDropdownBg, themeClasses.statsWidgetDropdownBorder, themeClasses.statsWidgetDropdownShadow]">
          <div class="stats-header px-6 py-4 rounded-t-lg text-sm font-medium flex items-center space-x-3" :class="themeClasses.topBack">
            <span class="stats-title" :class="themeClasses.notTextUp">System Monitor</span>
          </div>

          <div class="stats-section" :class="themeClasses.statsWidgetSectionBorder">
            <div class="section-label" :class="[themeClasses.statsWidgetSectionLabel, { 'section-toggle': maxVisibleSections < 5 }]" @click="toggleSection('performance')">
              <span>Performance</span>
              <Icon v-if="maxVisibleSections < 5" :icon="chevronDownIcon" class="section-chevron" :class="{ 'section-chevron-collapsed': !isSectionOpen('performance') }" />
            </div>

            <Transition name="section-collapse">
              <div v-if="isSectionOpen('performance')" class="section-content">
                <div v-if="tempValue > 0" class="stat-card">
                  <div class="stat-header">
                    <Icon :icon="tempIcon" class="stat-icon" :class="themeClasses.statsWidgetStatIcon" />
                    <span class="stat-name" :class="themeClasses.statsWidgetStatName">CPU Temp</span>
                    <span class="stat-main-value" :class="[themeClasses.statsWidgetStatValue, tempValue > 85 ? themeClasses.statsWidgetStatValueDanger : tempValue > 70 ? themeClasses.statsWidgetStatValueWarning : '']"> {{ tempValue }}°C </span>
                  </div>
                  <div class="stat-meta" :class="themeClasses.statsWidgetStatMeta">{{ cpuGhz }} GHz</div>
                </div>

                <div class="stat-card">
                  <div class="stat-header">
                    <div class="icon-wrapper">
                      <Transition name="icon-fade">
                        <Icon :key="cpuIconKey" :icon="cpuIcon" class="stat-icon" :class="themeClasses.statsWidgetStatIcon" />
                      </Transition>
                    </div>
                    <span class="stat-name" :class="themeClasses.statsWidgetStatName">CPU Usage</span>
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
            </Transition>
          </div>

          <div class="stats-section" :class="themeClasses.statsWidgetSectionBorder">
            <div class="section-label" :class="[themeClasses.statsWidgetSectionLabel, { 'section-toggle': maxVisibleSections < 5 }]" @click="toggleSection('storage')">
              <span>Storage</span>
              <Icon v-if="maxVisibleSections < 5" :icon="chevronDownIcon" class="section-chevron" :class="{ 'section-chevron-collapsed': !isSectionOpen('storage') }" />
            </div>

            <Transition name="section-collapse">
              <div v-if="isSectionOpen('storage')" class="section-content">
                <div class="disk-carousel-viewport">
                  <TransitionGroup :name="diskSlideDirection">
                    <div v-for="disk in visibleDisks" :key="disk.id" class="stat-card">
                      <div class="stat-header">
                        <Icon :icon="iconForMediaType(disk.media_type)" class="stat-icon" :class="themeClasses.statsWidgetStatIcon" />
                        <span class="stat-name" :class="themeClasses.statsWidgetStatName">{{ disk.label || disk.device }}</span>
                        <span class="stat-main-value" :class="[themeClasses.statsWidgetStatValue, disk.usage_percent > 95 ? themeClasses.statsWidgetStatValueDanger : disk.usage_percent > 80 ? themeClasses.statsWidgetStatValueWarning : '']"> {{ disk.usage_percent }}% </span>
                      </div>
                      <div class="progress-bar" :class="themeClasses.statsWidgetProgressBg">
                        <div class="progress-fill" :class="[disk.usage_percent > 95 ? themeClasses.statsWidgetProgressFillDanger : disk.usage_percent > 80 ? themeClasses.statsWidgetProgressFillWarning : themeClasses.statsWidgetProgressFill]" :style="{ width: disk.usage_percent + '%' }"></div>
                      </div>
                      <div class="stat-meta" :class="themeClasses.statsWidgetStatMeta">{{ disk.total_gb > 900 ? (disk.total_gb / 1024).toFixed(2) + " TB" : disk.total_gb + " GB" }}</div>
                    </div>
                  </TransitionGroup>
                </div>
                <div v-if="allDisksForWidget.length > DISKS_PAGE_SIZE" class="disk-carousel-nav">
                  <button class="disk-carousel-btn" :class="[themeClasses.statsWidgetStatIcon, { 'disk-carousel-btn-disabled': diskPageIndex === 0 }]" :disabled="diskPageIndex === 0" @click="navigateDisks(-1)">
                    <Icon :icon="chevronLeftIcon" class="w-4 h-4" />
                  </button>
                  <span class="disk-carousel-indicator" :class="themeClasses.statsWidgetStatMeta">{{ diskPageIndex + 1 }} / {{ totalDiskPages }}</span>
                  <button class="disk-carousel-btn" :class="[themeClasses.statsWidgetStatIcon, { 'disk-carousel-btn-disabled': diskPageIndex >= totalDiskPages - 1 }]" :disabled="diskPageIndex >= totalDiskPages - 1" @click="navigateDisks(1)">
                    <Icon :icon="chevronRightIcon" class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Transition>
          </div>

          <div class="stats-section" :class="themeClasses.statsWidgetSectionBorder">
            <div class="section-label" :class="[themeClasses.statsWidgetSectionLabel, { 'section-toggle': maxVisibleSections < 5 }]" @click="toggleSection('network')">
              <span>Network</span>
              <Icon v-if="maxVisibleSections < 5" :icon="chevronDownIcon" class="section-chevron" :class="{ 'section-chevron-collapsed': !isSectionOpen('network') }" />
            </div>

            <Transition name="section-collapse">
              <div v-if="isSectionOpen('network')" class="section-content">
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
            </Transition>
          </div>

          <div class="stats-section" :class="themeClasses.statsWidgetSectionBorder">
            <div class="section-label" :class="[themeClasses.statsWidgetSectionLabel, { 'section-toggle': maxVisibleSections < 5 }]" @click="toggleSection('apps')">
              <span>Apps</span>
              <Icon v-if="maxVisibleSections < 5" :icon="chevronDownIcon" class="section-chevron" :class="{ 'section-chevron-collapsed': !isSectionOpen('apps') }" />
            </div>

            <Transition name="section-collapse">
              <div v-if="isSectionOpen('apps')" class="section-content">
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
            </Transition>
          </div>

          <div class="stats-section" :class="themeClasses.statsWidgetSectionBorder">
            <div class="section-label" :class="[themeClasses.statsWidgetSectionLabel, { 'section-toggle': maxVisibleSections < 5 }]" @click="toggleSection('uptime')">
              <span>Uptime</span>
              <Icon v-if="maxVisibleSections < 5" :icon="chevronDownIcon" class="section-chevron" :class="{ 'section-chevron-collapsed': !isSectionOpen('uptime') }" />
            </div>

            <Transition name="section-collapse">
              <div v-if="isSectionOpen('uptime')" class="section-content">
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
            </Transition>
          </div>
        </div>
      </Teleport>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch, TransitionGroup } from "vue";

import { Icon } from "@iconify/vue";
import cpuIconSlow from "@iconify-icons/mdi/speedometer-slow";
import cpuIconMedium from "@iconify-icons/mdi/speedometer-medium";
import cpuIconFast from "@iconify-icons/mdi/speedometer";
import ramIcon from "@iconify-icons/mdi/memory";
import tempIcon from "@iconify-icons/mdi/thermometer";
import diskIcon from "@iconify-icons/mdi/harddisk";
import harddiskPlusIcon from "@iconify-icons/mdi/harddisk-plus";
import externalDiskIcon from "@iconify-icons/mdi/usb-flash-drive";
import discIcon from "@iconify-icons/mdi/disc";
import sdIcon from "@iconify-icons/mdi/sd";
import downloadIcon from "@iconify-icons/mdi/download";
import uploadIcon from "@iconify-icons/mdi/upload";
import containerIcon from "@iconify-icons/mdi/docker";
import appsIcon from "@iconify-icons/mdi/apps";
import uptimeIcon from "@iconify-icons/mdi/clock-outline";
import serverIcon from "@iconify-icons/mdi/server";
import chevronDownIcon from "@iconify-icons/mdi/chevron-down";
import chevronLeftIcon from "@iconify-icons/mdi/chevron-left";
import chevronRightIcon from "@iconify-icons/mdi/chevron-right";

import { useSystemStatsStore } from "../__Stores__/useSystemStatsStore";
import { useDisksPlusStore } from "../__Stores__/useDisksPlusStore";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useTrayManager } from "../__Composables__/useTrayManager";

interface Props {
  csrfToken: string;
  showTemp?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showTemp: true,
});

const { themeClasses } = useTheme();
const trayManager = useTrayManager();

const TRAY_ID = "system-stats-widget";

const systemStatsStore = useSystemStatsStore();
const diskStore = useDisksPlusStore();

const widgetRef = ref<HTMLElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);

const isExpanded = ref(false);

type SectionId = "performance" | "storage" | "network" | "apps" | "uptime";
const ALL_SECTIONS: SectionId[] = ["performance", "storage", "network", "apps", "uptime"];
const openSections = ref<SectionId[]>(["performance"]);
const maxVisibleSections = ref(1);

function updateMaxSections() {
  const h = window.innerHeight;
  if (h >= 900) maxVisibleSections.value = 5;
  else if (h >= 750) maxVisibleSections.value = 3;
  else if (h >= 600) maxVisibleSections.value = 2;
  else maxVisibleSections.value = 1;
}

watch(maxVisibleSections, (max) => {
  if (max >= 5) {
    openSections.value = [...ALL_SECTIONS];
  } else {
    while (openSections.value.length > max) {
      openSections.value.shift();
    }
  }
});

function isSectionOpen(section: SectionId): boolean {
  return openSections.value.includes(section);
}

function toggleSection(section: SectionId) {
  if (maxVisibleSections.value >= 5) return;
  const idx = openSections.value.indexOf(section);
  if (idx !== -1) {
    if (openSections.value.length > 1) {
      openSections.value.splice(idx, 1);
    }
    return;
  }
  if (openSections.value.length >= maxVisibleSections.value) {
    openSections.value.shift();
    setTimeout(() => {
      openSections.value.push(section);
    }, 200);
  } else {
    openSections.value.push(section);
  }
}

function toggleExpanded(e: MouseEvent) {
  e.stopPropagation();
  if (!isExpanded.value) {
    trayManager.openTray(TRAY_ID);
    isExpanded.value = true;
  } else {
    trayManager.closeTray(TRAY_ID);
    isExpanded.value = false;
  }
}

function closeDropdown() {
  trayManager.closeTray(TRAY_ID);
  isExpanded.value = false;
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node;
  if (widgetRef.value && !widgetRef.value.contains(target) && (!dropdownRef.value || !dropdownRef.value.contains(target))) {
    closeDropdown();
  }
}

watch(
  () => trayManager.activeTrayId.value,
  (newTrayId) => {
    if (newTrayId !== TRAY_ID && isExpanded.value) {
      isExpanded.value = false;
    }
  },
);

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  updateMaxSections();
  window.addEventListener("resize", updateMaxSections);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  window.removeEventListener("resize", updateMaxSections);
});

const cpuValue = computed(() => Math.round(parseFloat(systemStatsStore.cpuUsage) || 0));
const cpuCores = computed(() => systemStatsStore.cpuCores);
const cpuGhz = computed(() => systemStatsStore.cpuGhz);

const cpuIcon = computed(() => {
  const usage = cpuValue.value;
  if (usage <= 33) return cpuIconSlow;
  if (usage <= 66) return cpuIconMedium;
  return cpuIconFast;
});

const cpuIconKey = computed(() => {
  const usage = cpuValue.value;
  if (usage <= 33) return "slow";
  if (usage <= 66) return "medium";
  return "fast";
});

const ramValue = computed(() => Math.round(parseFloat(systemStatsStore.ramUsage) || 0));
const totalRam = computed(() => systemStatsStore.totalRam);

const tempValue = computed(() => Math.round(parseFloat(systemStatsStore.cpuTemp) || 0));

const allDisksForWidget = computed(() => {
  return diskStore.allDisks.slice().sort((a, b) => {
    if (a.is_system && !b.is_system) return -1;
    if (!a.is_system && b.is_system) return 1;
    if (a.internal && !b.internal) return -1;
    if (!a.internal && b.internal) return 1;
    return (a.label || a.device).localeCompare(b.label || b.device);
  });
});

const DISKS_PAGE_SIZE = 2;
const diskPageIndex = ref(0);
const diskSlideDirection = ref("disk-slide-right");
const totalDiskPages = computed(() => Math.ceil(allDisksForWidget.value.length / DISKS_PAGE_SIZE));
const visibleDisks = computed(() => {
  if (allDisksForWidget.value.length <= DISKS_PAGE_SIZE) return allDisksForWidget.value;
  const start = diskPageIndex.value * DISKS_PAGE_SIZE;
  return allDisksForWidget.value.slice(start, start + DISKS_PAGE_SIZE);
});

function navigateDisks(delta: number) {
  diskSlideDirection.value = delta > 0 ? "disk-slide-left" : "disk-slide-right";
  diskPageIndex.value += delta;
}

watch(allDisksForWidget, () => {
  if (diskPageIndex.value >= totalDiskPages.value) {
    diskPageIndex.value = Math.max(0, totalDiskPages.value - 1);
  }
});

function iconForMediaType(mediaType: string) {
  switch (mediaType) {
    case "nvme":
      return harddiskPlusIcon;
    case "ssd":
    case "hdd":
      return diskIcon;
    case "usb":
      return externalDiskIcon;
    case "optical":
      return discIcon;
    default:
      return sdIcon;
  }
}

const networkDown = computed(() => systemStatsStore.downloadData);
const networkUp = computed(() => systemStatsStore.uploadData);

const networkDownValue = computed(() => {
  if (typeof networkDown.value === "string") {
    return networkDown.value.split(" ")[0];
  }
  return "0";
});
const networkDownUnit = computed(() => {
  if (typeof networkDown.value === "string") {
    return networkDown.value.split(" ")[1] || "GB";
  }
  return "GB";
});
const networkUpValue = computed(() => {
  if (typeof networkUp.value === "string") {
    return networkUp.value.split(" ")[0];
  }
  return "0";
});
const networkUpUnit = computed(() => {
  if (typeof networkUp.value === "string") {
    return networkUp.value.split(" ")[1] || "GB";
  }
  return "GB";
});

const totalContainers = computed(() => systemStatsStore.totalContainers);
const activeContainers = computed(() => systemStatsStore.activeContainers);

import { useDesktopStore } from "../__Stores__/desktopStore";
const desktopStore = useDesktopStore();
const totalApps = computed(() => desktopStore.mainDockerApps.length.toString());

const systemUptime = computed(() => systemStatsStore.uptimeData);
const homeDockUptime = computed(() => systemStatsStore.startTime);
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

.section-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  border-radius: 4px;
  margin: -0.125rem -0.25rem;
  padding: 0.125rem 0.25rem;
  transition: opacity 0.15s ease;
}

.section-toggle:hover {
  opacity: 0.7;
}

.section-chevron {
  width: 12px;
  height: 12px;
  transition: transform 0.2s ease;
}

.section-chevron-collapsed {
  transform: rotate(-90deg);
}

.section-content {
  overflow: hidden;
}

.section-collapse-enter-active,
.section-collapse-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.section-collapse-enter-from,
.section-collapse-leave-to {
  opacity: 0;
  max-height: 0;
}

.section-collapse-enter-to,
.section-collapse-leave-from {
  opacity: 1;
  max-height: 300px;
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

.icon-wrapper {
  position: relative;
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
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
  transition:
    width 0.3s ease,
    background 0.2s ease;
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

/* Icon Transition Animation */
.icon-fade-enter-active,
.icon-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
}

.icon-fade-enter-from {
  opacity: 0;
}

.icon-fade-leave-to {
  opacity: 0;
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

.disk-carousel-viewport {
  overflow: hidden;
  position: relative;
}

.disk-slide-left-enter-active,
.disk-slide-left-leave-active,
.disk-slide-right-enter-active,
.disk-slide-right-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.disk-slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.disk-slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.disk-slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.disk-slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.disk-slide-left-leave-active,
.disk-slide-right-leave-active {
  position: absolute;
  width: 100%;
}

.disk-carousel-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 4px 0 2px;
}

.disk-carousel-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.15s;
}

.disk-carousel-btn:hover:not(:disabled) {
  opacity: 1;
}

.disk-carousel-btn-disabled {
  opacity: 0.2 !important;
  cursor: default;
}

.disk-carousel-indicator {
  font-size: 0.65rem;
  min-width: 32px;
  text-align: center;
}
</style>
