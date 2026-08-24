<!-- homedock-ui/vue3/static/js/__Widgets__/WidgetSystem.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="w-full h-full flex flex-col px-4 py-3">
    <span class="text-[10px] font-semibold uppercase tracking-[0.12em] shrink-0" :class="themeClasses.desktopWidgetMeta">{{ $t("System") }}</span>

    <div v-if="size === 'l'" class="flex-1 flex items-center justify-evenly">
      <div v-for="stat in stats" :key="stat.label" class="flex flex-col items-center gap-1.5">
        <div class="relative w-[92px] h-[92px]">
          <svg viewBox="0 0 36 36" class="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" stroke-width="2.75" stroke-opacity="0.12" :class="themeClasses.desktopWidgetText" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" :stroke-dasharray="`${ringDash(stat.percent)} 97.4`" :class="valueClass(stat)" class="transition-all duration-700 ease-out" />
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span class="text-lg font-semibold tabular-nums tracking-tight" :class="valueClass(stat)">{{ stat.display }}</span>
          </div>
        </div>
        <span class="text-[11px] font-medium" :class="themeClasses.desktopWidgetText">{{ $t(stat.label) }}</span>
      </div>
    </div>

    <div v-else class="flex-1 flex flex-col justify-evenly">
      <div v-for="stat in stats" :key="stat.label" class="flex items-center gap-2.5">
        <svg viewBox="0 0 36 36" class="w-8 h-8 shrink-0 -rotate-90">
          <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" stroke-width="4" stroke-opacity="0.12" :class="themeClasses.desktopWidgetText" />
          <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" :stroke-dasharray="`${ringDash(stat.percent, 94.2)} 94.2`" :class="valueClass(stat)" class="transition-all duration-700 ease-out" />
        </svg>
        <span class="flex-1 text-xs font-medium truncate" :class="themeClasses.desktopWidgetText">{{ $t(stat.label) }}</span>
        <span class="text-base font-semibold tabular-nums tracking-tight" :class="valueClass(stat)">{{ stat.display }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useSystemStatsStore } from "../__Stores__/useSystemStatsStore";
import type { WidgetInstance } from "../__Stores__/useWidgetsStore";
import type { WidgetSize } from "../__Config__/WidgetDefaultDetails";

defineProps<{
  instance: WidgetInstance;
  size: WidgetSize;
}>();

const { themeClasses } = useTheme();
const statsStore = useSystemStatsStore();

interface StatRow {
  label: string;
  display: string;
  percent: number;
  warning: boolean;
  danger: boolean;
  unavailable?: boolean;
}

const tempValue = computed(() => Math.round(parseFloat(statsStore.cpuTemp) || 0));

const stats = computed<StatRow[]>(() => {
  const cpu = Math.round(parseFloat(statsStore.cpuUsage) || 0);
  const ram = Math.round(parseFloat(statsStore.ramUsage) || 0);
  const temp = tempValue.value;
  const noTemp = temp <= 0;

  return [
    { label: "CPU", display: `${cpu}%`, percent: cpu, warning: cpu >= 75, danger: cpu >= 90 },
    { label: "RAM", display: `${ram}%`, percent: ram, warning: ram >= 75, danger: ram >= 90 },
    { label: "Temp", display: noTemp ? "N/A" : temp === 69 ? "Nicer" : `${temp}°`, percent: noTemp ? 0 : temp, warning: !noTemp && temp >= 70 && temp !== 69, danger: !noTemp && temp >= 85, unavailable: noTemp },
  ];
});

function ringDash(percent: number, circumference = 97.4): number {
  return (Math.min(100, Math.max(0, percent)) / 100) * circumference;
}

function valueClass(stat: StatRow): string {
  if (stat.unavailable) return themeClasses.value.desktopWidgetMeta;
  if (stat.danger) return themeClasses.value.statsWidgetStatValueDanger;
  if (stat.warning) return themeClasses.value.statsWidgetStatValueWarning;
  return themeClasses.value.desktopWidgetAccent;
}
</script>
