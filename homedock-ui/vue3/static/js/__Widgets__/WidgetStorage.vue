<!-- homedock-ui/vue3/static/js/__Widgets__/WidgetStorage.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="w-full h-full flex flex-col px-4 py-3">
    <span v-if="size === 'm'" class="text-[10px] font-semibold uppercase tracking-[0.12em] shrink-0" :class="themeClasses.desktopWidgetMeta">{{ $t("Storage") }}</span>

    <div class="flex-1 flex flex-col justify-evenly gap-2">
      <div v-for="disk in displayedDisks" :key="disk.key" class="flex flex-col gap-1.5">
        <div class="flex items-end justify-between gap-2">
          <div class="flex flex-col min-w-0 leading-tight">
            <span class="text-xs font-medium truncate" :class="themeClasses.desktopWidgetText">{{ disk.label }}</span>
            <span class="text-[10px] tabular-nums" :class="themeClasses.desktopWidgetMeta">{{ disk.detail }}</span>
          </div>
          <span class="text-xl font-semibold tabular-nums tracking-tight leading-none shrink-0" :class="percentClass(disk.percent)">{{ disk.percent }}<span class="text-xs font-medium">%</span></span>
        </div>
        <div class="h-[7px] rounded-full overflow-hidden" :class="themeClasses.statsWidgetProgressBg">
          <div class="h-full rounded-full transition-all duration-500" :class="barClass(disk.percent)" :style="{ width: `${Math.min(100, Math.max(0, disk.percent))}%` }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useDisksPlusStore } from "../__Stores__/useDisksPlusStore";
import type { WidgetInstance } from "../__Stores__/useWidgetsStore";
import type { WidgetSize } from "../__Config__/WidgetDefaultDetails";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  instance: WidgetInstance;
  size: WidgetSize;
}>();

const { themeClasses } = useTheme();
const { t } = useI18n();
const disksStore = useDisksPlusStore();

interface DiskRow {
  key: string;
  label: string;
  percent: number;
  detail: string;
}

function formatGb(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)} TB` : `${Math.round(value)} GB`;
}

function percentClass(percent: number): string {
  if (percent >= 90) return themeClasses.value.statsWidgetStatValueDanger;
  if (percent >= 75) return themeClasses.value.statsWidgetStatValueWarning;
  return themeClasses.value.desktopWidgetTitle;
}

function barClass(percent: number): string {
  if (percent >= 90) return themeClasses.value.statsWidgetProgressFillDanger;
  if (percent >= 75) return themeClasses.value.statsWidgetProgressFillWarning;
  return themeClasses.value.statsWidgetProgressFill;
}

const displayedDisks = computed<DiskRow[]>(() => {
  const rows: DiskRow[] = [];

  const os = disksStore.osDisk;
  if (os) {
    rows.push({
      key: "system",
      label: t("System Disk"),
      percent: Math.round(os.usage_percent),
      detail: `${formatGb(os.used_gb)} / ${formatGb(os.total_gb)}`,
    });
  }

  const external = disksStore.trackedExternalDisk;
  if (external && disksStore.isTrackedExternalDiskActive) {
    rows.push({
      key: "external",
      label: external.label?.trim() || external.device,
      percent: Math.round(external.usage_percent),
      detail: `${formatGb(external.used_gb)} / ${formatGb(external.total_gb)}`,
    });
  }

  return props.size === "s" ? rows.slice(0, 1) : rows;
});
</script>
