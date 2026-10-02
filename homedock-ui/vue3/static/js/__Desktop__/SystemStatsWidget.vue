<!-- homedock-ui/vue3/static/js/__Desktop__/SystemStatsWidget.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="system-stats-widget" ref="widgetRef">
    <div class="compact-view" :class="[themeClasses.statsWidgetCompactBg, themeClasses.statsWidgetCompactBgHover]" @click="toggle" :title="isOpen ? $t('Click to collapse') : $t('Click to expand')">
      <div class="stat-item">
        <Transition name="icon-fade">
          <Icon :key="cpuIconKey" :icon="cpuIcon" class="stat-icon-bg" :class="themeClasses.statsWidgetIconColor" />
        </Transition>
        <span class="stat-value" :class="[themeClasses.statsWidgetValueColor, cpuValue > 95 ? themeClasses.statsWidgetStatValueDanger : cpuValue > 80 ? themeClasses.statsWidgetStatValueWarning : '']"> {{ cpuValue }}% </span>
      </div>
    </div>

    <TrayPanel :open="isOpen" :anchor="widgetRef" :title="$t('System Monitor')" :subtitle="`CPU ${cpuValue}% · RAM ${ramValue}%`" :icon="cpuIcon" icon-color="#059669" @close="close">
      <TraySection :title="$t('Performance')" :collapsible="maxVisibleSections < 5" :expanded="isSectionOpen('performance')" @toggle="toggleSection('performance')">
        <Transition name="section-collapse">
          <div v-if="isSectionOpen('performance')" class="section-content">
            <div :class="[themeClasses.storeInfoBar]" class="stat-group rounded-xl border">
              <div v-if="tempValue > 0" class="stat-card">
                <div class="stat-header">
                  <Icon :icon="tempIcon" class="stat-icon" :class="themeClasses.storeCardSubtitle" />
                  <span class="stat-name" :class="themeClasses.storeModalAppName">{{ $t("CPU Temp") }}</span>
                  <span class="stat-main-value" :class="tempValue > 85 ? themeClasses.statsWidgetStatValueDanger : tempValue > 70 ? themeClasses.statsWidgetStatValueWarning : themeClasses.storeModalAppName">{{ tempDisplay }}</span>
                </div>
                <div class="stat-meta" :class="themeClasses.storeCardSubtitle">{{ cpuGhz }} GHz</div>
              </div>

              <div class="stat-card">
                <div class="stat-header">
                  <div class="icon-wrapper">
                    <Transition name="icon-fade">
                      <Icon :key="cpuIconKey" :icon="cpuIcon" class="stat-icon" :class="themeClasses.storeCardSubtitle" />
                    </Transition>
                  </div>
                  <span class="stat-name" :class="themeClasses.storeModalAppName">{{ $t("CPU Usage") }}</span>
                  <span class="stat-main-value" :class="cpuValue > 95 ? themeClasses.statsWidgetStatValueDanger : cpuValue > 80 ? themeClasses.statsWidgetStatValueWarning : themeClasses.storeModalAppName">{{ cpuValue }}%</span>
                </div>
                <div class="progress-bar" :class="themeClasses.storeInfoBarDivider">
                  <div class="progress-fill" :class="cpuValue > 95 ? themeClasses.statsWidgetProgressFillDanger : cpuValue > 80 ? themeClasses.statsWidgetProgressFillWarning : themeClasses.statsWidgetProgressFill" :style="{ width: cpuValue + '%' }"></div>
                </div>
                <div class="stat-meta" :class="themeClasses.storeCardSubtitle">{{ cpuCores }} {{ $t("cores") }}</div>
              </div>

              <div class="stat-card">
                <div class="stat-header">
                  <Icon :icon="ramIcon" class="stat-icon" :class="themeClasses.storeCardSubtitle" />
                  <span class="stat-name" :class="themeClasses.storeModalAppName">{{ $t("Memory") }}</span>
                  <span class="stat-main-value" :class="ramValue > 95 ? themeClasses.statsWidgetStatValueDanger : ramValue > 80 ? themeClasses.statsWidgetStatValueWarning : themeClasses.storeModalAppName">{{ ramValue }}%</span>
                </div>
                <div class="progress-bar" :class="themeClasses.storeInfoBarDivider">
                  <div class="progress-fill" :class="ramValue > 95 ? themeClasses.statsWidgetProgressFillDanger : ramValue > 80 ? themeClasses.statsWidgetProgressFillWarning : themeClasses.statsWidgetProgressFill" :style="{ width: ramValue + '%' }"></div>
                </div>
                <div class="stat-meta" :class="themeClasses.storeCardSubtitle">{{ totalRam }} {{ $t("GB total") }}</div>
              </div>
            </div>
          </div>
        </Transition>
      </TraySection>

      <TraySection :title="$t('Storage')" :collapsible="maxVisibleSections < 5" :expanded="isSectionOpen('storage')" @toggle="toggleSection('storage')">
        <template v-if="allDisksForWidget.length > DISKS_PAGE_SIZE" #accessory>
          <span class="flex items-center gap-0.5 normal-case tracking-normal" @click.stop>
            <button type="button" class="disk-carousel-btn" :class="{ 'disk-carousel-btn-disabled': diskPageIndex === 0 }" :disabled="diskPageIndex === 0" :aria-label="$t('Previous')" @click="navigateDisks(-1)">
              <Icon :icon="chevronLeftIcon" class="w-3.5 h-3.5" />
            </button>
            <span class="text-[10px] font-medium tabular-nums">{{ diskPageIndex + 1 }}/{{ totalDiskPages }}</span>
            <button type="button" class="disk-carousel-btn" :class="{ 'disk-carousel-btn-disabled': diskPageIndex >= totalDiskPages - 1 }" :disabled="diskPageIndex >= totalDiskPages - 1" :aria-label="$t('Next')" @click="navigateDisks(1)">
              <Icon :icon="chevronRightIcon" class="w-3.5 h-3.5" />
            </button>
          </span>
        </template>
        <Transition name="section-collapse">
          <div v-if="isSectionOpen('storage')" class="section-content">
            <div :class="[themeClasses.storeInfoBar]" class="stat-group disk-carousel-viewport rounded-xl border">
              <TransitionGroup :name="diskSlideDirection">
                <div v-for="disk in visibleDisks" :key="disk.id" class="stat-card">
                  <div class="stat-header">
                    <Icon :icon="iconForMediaType(disk.media_type)" class="stat-icon" :class="themeClasses.storeCardSubtitle" />
                    <span class="stat-name truncate" :class="themeClasses.storeModalAppName">{{ disk.label || disk.device }}</span>
                    <span class="stat-main-value" :class="disk.usage_percent > 95 ? themeClasses.statsWidgetStatValueDanger : disk.usage_percent > 80 ? themeClasses.statsWidgetStatValueWarning : themeClasses.storeModalAppName">{{ disk.usage_percent }}%</span>
                  </div>
                  <div class="progress-bar" :class="themeClasses.storeInfoBarDivider">
                    <div class="progress-fill" :class="disk.usage_percent > 95 ? themeClasses.statsWidgetProgressFillDanger : disk.usage_percent > 80 ? themeClasses.statsWidgetProgressFillWarning : themeClasses.statsWidgetProgressFill" :style="{ width: disk.usage_percent + '%' }"></div>
                  </div>
                  <div class="stat-meta" :class="themeClasses.storeCardSubtitle">{{ disk.total_gb > 900 ? (disk.total_gb / 1024).toFixed(2) + " TB" : disk.total_gb + " GB" }}</div>
                </div>
              </TransitionGroup>
            </div>
          </div>
        </Transition>
      </TraySection>

      <TraySection :title="$t('Network')" :collapsible="maxVisibleSections < 5" :expanded="isSectionOpen('network')" @toggle="toggleSection('network')">
        <Transition name="section-collapse">
          <div v-if="isSectionOpen('network')" class="section-content">
            <div class="stat-grid">
              <div :class="[themeClasses.storeInfoBar]" class="stat-mini rounded-xl border">
                <Icon :icon="downloadIcon" class="stat-icon-small text-blue-500" />
                <div class="stat-mini-content">
                  <div class="stat-mini-label" :class="themeClasses.storeCardSubtitle">{{ $t("Download") }}</div>
                  <div class="stat-mini-value" :class="themeClasses.storeModalAppName">
                    {{ networkDownValue }} <span class="stat-unit" :class="themeClasses.storeCardSubtitle">{{ networkDownUnit }}</span>
                  </div>
                </div>
              </div>
              <div :class="[themeClasses.storeInfoBar]" class="stat-mini rounded-xl border">
                <Icon :icon="uploadIcon" class="stat-icon-small text-green-500" />
                <div class="stat-mini-content">
                  <div class="stat-mini-label" :class="themeClasses.storeCardSubtitle">{{ $t("Upload") }}</div>
                  <div class="stat-mini-value" :class="themeClasses.storeModalAppName">
                    {{ networkUpValue }} <span class="stat-unit" :class="themeClasses.storeCardSubtitle">{{ networkUpUnit }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </TraySection>

      <TraySection :title="$t('Apps')" :collapsible="maxVisibleSections < 5" :expanded="isSectionOpen('apps')" @toggle="toggleSection('apps')">
        <Transition name="section-collapse">
          <div v-if="isSectionOpen('apps')" class="section-content">
            <div class="stat-grid">
              <div :class="[themeClasses.storeInfoBar]" class="stat-mini rounded-xl border">
                <Icon :icon="appsIcon" class="stat-icon-small text-violet-500" />
                <div class="stat-mini-content">
                  <div class="stat-mini-label" :class="themeClasses.storeCardSubtitle">{{ $t("Installed") }}</div>
                  <div class="stat-mini-value" :class="themeClasses.storeModalAppName">{{ totalApps }}</div>
                </div>
              </div>
              <div :class="[themeClasses.storeInfoBar]" class="stat-mini rounded-xl border">
                <Icon :icon="containerIcon" class="stat-icon-small text-sky-500" />
                <div class="stat-mini-content">
                  <div class="stat-mini-label" :class="themeClasses.storeCardSubtitle">{{ $t("Active") }}</div>
                  <div class="stat-mini-value" :class="themeClasses.storeModalAppName">
                    {{ activeContainers }} <span class="stat-unit" :class="themeClasses.storeCardSubtitle">/ {{ totalContainers }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </TraySection>

      <TraySection :title="$t('Uptime')" :collapsible="maxVisibleSections < 5" :expanded="isSectionOpen('uptime')" @toggle="toggleSection('uptime')">
        <Transition name="section-collapse">
          <div v-if="isSectionOpen('uptime')" class="section-content">
            <div class="stat-grid">
              <div :class="[themeClasses.storeInfoBar]" class="stat-mini rounded-xl border">
                <Icon :icon="serverIcon" class="stat-icon-small text-amber-500" />
                <div class="stat-mini-content">
                  <div class="stat-mini-label" :class="themeClasses.storeCardSubtitle">{{ $t("System") }}</div>
                  <div class="stat-mini-value small" :class="themeClasses.storeModalAppName">{{ systemUptime }}</div>
                </div>
              </div>
              <div :class="[themeClasses.storeInfoBar]" class="stat-mini rounded-xl border">
                <Icon :icon="uptimeIcon" class="stat-icon-small text-amber-500" />
                <div class="stat-mini-content">
                  <div class="stat-mini-label" :class="themeClasses.storeCardSubtitle">HomeDock OS</div>
                  <div class="stat-mini-value small" :class="themeClasses.storeModalAppName">{{ homeDockUptime }}</div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </TraySection>
    </TrayPanel>
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
import chevronLeftIcon from "@iconify-icons/mdi/chevron-left";
import chevronRightIcon from "@iconify-icons/mdi/chevron-right";

import TrayPanel from "../__Components__/TrayPanel.vue";
import TraySection from "../__Components__/TraySection.vue";

import { useSystemStatsStore } from "../__Stores__/useSystemStatsStore";
import { useDisksPlusStore } from "../__Stores__/useDisksPlusStore";
import { useDesktopStore } from "../__Stores__/desktopStore";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useTrayPanel } from "../__Composables__/useTrayManager";

interface Props {
  csrfToken: string;
  showTemp?: boolean;
}

withDefaults(defineProps<Props>(), {
  showTemp: true,
});

const { themeClasses } = useTheme();
const { isOpen, toggle, close } = useTrayPanel("system-stats-widget");

const systemStatsStore = useSystemStatsStore();
const diskStore = useDisksPlusStore();
const desktopStore = useDesktopStore();

const widgetRef = ref<HTMLElement | null>(null);

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

onMounted(() => {
  updateMaxSections();
  window.addEventListener("resize", updateMaxSections);
});

onUnmounted(() => {
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

const tempDisplay = computed(() => (tempValue.value === 69 ? "Nicer" : `${tempValue.value}°C`));

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

.section-content {
  overflow: hidden;
  padding: 0 0.375rem;
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

.stat-group {
  display: flex;
  flex-direction: column;
  padding: 0.25rem 0.75rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.5rem 0;
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.stat-name {
  font-size: 0.75rem;
  font-weight: 500;
  flex: 1;
  min-width: 0;
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
  height: 4px;
  border-radius: 9999px;
  overflow: hidden;
  margin-left: 1.5rem;
}

.progress-fill {
  height: 100%;
  border-radius: 9999px;
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
  gap: 0.5rem;
  padding: 0.5rem 0.625rem;
}

.stat-icon-small {
  width: 14px;
  height: 14px;
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
  font-size: 0.625rem;
  font-weight: 500;
}

.stat-mini-value {
  font-size: 0.75rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.stat-mini-value.small {
  font-size: 0.6875rem;
}

.stat-unit {
  font-size: 0.625rem;
  font-weight: 500;
}

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
  left: 0.75rem;
  right: 0.75rem;
}

.disk-carousel-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 9999px;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.15s;
}

.disk-carousel-btn:hover:not(:disabled) {
  opacity: 1;
}

.disk-carousel-btn-disabled {
  opacity: 0.25 !important;
  cursor: default;
}

@media (max-width: 768px) {
  .compact-view {
    padding: 0.25rem 0.375rem;
  }
}
</style>
