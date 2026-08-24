<!-- homedock-ui/vue3/static/js/__Widgets__/WidgetNetwork.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div v-if="size === 'm'" class="relative w-full h-full flex flex-col px-4 py-3">
    <svg v-if="downLine" viewBox="0 0 100 100" preserveAspectRatio="none" class="pointer-events-none absolute inset-0 w-full h-full">
      <defs>
        <linearGradient :id="`${gradientId}-up`" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100">
          <stop offset="0" :stop-color="UPLOAD_COLOR" stop-opacity="0.3" />
          <stop offset="1" :stop-color="UPLOAD_COLOR" stop-opacity="0" />
        </linearGradient>
        <linearGradient :id="`${gradientId}-down`" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100">
          <stop offset="0" :stop-color="DOWNLOAD_COLOR" stop-opacity="0.3" />
          <stop offset="1" :stop-color="DOWNLOAD_COLOR" stop-opacity="0" />
        </linearGradient>
      </defs>
      <g :style="{ color: UPLOAD_COLOR }">
        <path :d="upArea" :fill="`url(#${gradientId}-up)`" stroke="none" />
        <path :d="upLine" fill="none" stroke="currentColor" stroke-width="1.5" stroke-opacity="0.55" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
      </g>
      <g :style="{ color: DOWNLOAD_COLOR }">
        <path :d="downArea" :fill="`url(#${gradientId}-down)`" stroke="none" />
        <path :d="downLine" fill="none" stroke="currentColor" stroke-width="1.5" stroke-opacity="0.55" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
      </g>
    </svg>

    <div class="relative flex items-baseline justify-between gap-2 shrink-0">
      <span class="text-[10px] font-semibold uppercase tracking-[0.12em]" :class="themeClasses.desktopWidgetMeta">{{ $t("Network") }}</span>
      <span class="text-[10px] truncate" :class="themeClasses.desktopWidgetMeta">{{ interfaceName }}</span>
    </div>

    <div class="relative flex-1 flex flex-col justify-evenly">
      <div v-for="stat in stats" :key="stat.label" class="flex flex-col gap-0.5">
        <div class="flex items-center gap-1.5">
          <Icon :icon="stat.icon" class="w-3.5 h-3.5" :style="{ color: stat.color }" />
          <span class="text-[11px] font-medium" :class="themeClasses.desktopWidgetText">{{ $t(stat.label) }}</span>
        </div>
        <div class="flex items-baseline gap-1 pl-5">
          <span class="text-2xl font-semibold tabular-nums tracking-tight leading-none" :class="themeClasses.desktopWidgetTitle">{{ stat.value }}</span>
          <span class="text-xs font-medium" :class="themeClasses.desktopWidgetMeta">{{ stat.unit }}</span>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="w-full h-full flex items-center px-4 py-3">
    <div v-for="(stat, index) in stats" :key="stat.label" class="flex-1 min-w-0 flex items-center">
      <div v-if="index > 0" class="w-px h-8 shrink-0 mx-2" :class="themeClasses.desktopWidgetDivider"></div>
      <div class="flex-1 min-w-0 flex flex-col items-center gap-1">
        <div class="flex items-center gap-1">
          <Icon :icon="stat.icon" class="w-3 h-3" :style="{ color: stat.color }" />
          <span class="text-[9px] font-semibold uppercase tracking-wide" :class="themeClasses.desktopWidgetMeta">{{ $t(stat.label) }}</span>
        </div>
        <div class="flex items-baseline gap-0.5">
          <span class="text-lg font-semibold tabular-nums tracking-tight leading-none" :class="themeClasses.desktopWidgetTitle">{{ stat.value }}</span>
          <span class="text-[10px] font-medium" :class="themeClasses.desktopWidgetMeta">{{ stat.unit }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { Icon } from "@iconify/vue";

import arrowDownIcon from "@iconify-icons/mdi/arrow-down";
import arrowUpIcon from "@iconify-icons/mdi/arrow-up";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useSystemStatsStore } from "../__Stores__/useSystemStatsStore";
import type { WidgetInstance } from "../__Stores__/useWidgetsStore";
import type { WidgetSize } from "../__Config__/WidgetDefaultDetails";

const props = defineProps<{
  instance: WidgetInstance;
  size: WidgetSize;
}>();

const gradientId = computed(() => `net-${props.instance.instanceId}`);

const { themeClasses } = useTheme();
const statsStore = useSystemStatsStore();

const interfaceName = computed(() => statsStore.interfaceName);

const DOWNLOAD_COLOR = "rgb(100, 181, 34)";
const UPLOAD_COLOR = "rgb(217, 153, 137)";

interface NetStat {
  label: string;
  icon: any;
  value: string;
  unit: string;
  color: string;
}

function splitVolume(raw: string): { value: string; unit: string } {
  const parts = (raw || "").split(" ");
  return { value: parts[0] || "0", unit: parts[1] || "GB" };
}

const HISTORY_SIZE = 60;

const SAMPLE_MS = 3000;

const downHistory = ref<number[]>([]);
const upHistory = ref<number[]>([]);

let sampler: ReturnType<typeof setInterval> | null = null;

let lastDownTotal: number | null = null;
let lastUpTotal: number | null = null;

function sample() {
  const downTotal = parseFloat(statsStore.downloadData) || 0;
  const upTotal = parseFloat(statsStore.uploadData) || 0;

  if (lastDownTotal !== null && lastUpTotal !== null) {
    downHistory.value = [...downHistory.value.slice(-(HISTORY_SIZE - 1)), Math.max(0, downTotal - lastDownTotal)];
    upHistory.value = [...upHistory.value.slice(-(HISTORY_SIZE - 1)), Math.max(0, upTotal - lastUpTotal)];
  }

  lastDownTotal = downTotal;
  lastUpTotal = upTotal;
}

const SMOOTH_RADIUS = 2;

function smoothSeries(history: number[]): number[] {
  return history.map((_, i) => {
    const start = Math.max(0, i - SMOOTH_RADIUS);
    const end = Math.min(history.length, i + SMOOTH_RADIUS + 1);
    let sum = 0;
    for (let j = start; j < end; j++) sum += history[j];
    return sum / (end - start);
  });
}

const downSeries = computed(() => smoothSeries(downHistory.value));
const upSeries = computed(() => smoothSeries(upHistory.value));

const seriesMax = computed(() => Math.max(0, ...downSeries.value, ...upSeries.value) || 1);

function toCoords(values: number[]): Array<[number, number]> {
  if (values.length < 2) return [];

  const step = 100 / (HISTORY_SIZE - 1);
  const offset = 100 - (values.length - 1) * step;

  return values.map((v, i) => [offset + i * step, 97 - (v / seriesMax.value) * 94]);
}

function linePath(pts: Array<[number, number]>): string {
  if (pts.length < 2) return "";

  const n = pts.length;
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);

  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) slopes.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));

  const tangents: number[] = new Array(n);
  tangents[0] = slopes[0];
  tangents[n - 1] = slopes[n - 2];
  for (let i = 1; i < n - 1; i++) tangents[i] = slopes[i - 1] * slopes[i] <= 0 ? 0 : (slopes[i - 1] + slopes[i]) / 2;

  for (let i = 0; i < n - 1; i++) {
    if (slopes[i] === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      continue;
    }
    const a = tangents[i] / slopes[i];
    const b = tangents[i + 1] / slopes[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      tangents[i] = t * a * slopes[i];
      tangents[i + 1] = t * b * slopes[i];
    }
  }

  const fmt = (v: number) => v.toFixed(2);
  let d = `M ${fmt(xs[0])},${fmt(ys[0])}`;

  for (let i = 0; i < n - 1; i++) {
    const h = xs[i + 1] - xs[i];
    d += ` C ${fmt(xs[i] + h / 3)},${fmt(ys[i] + (tangents[i] * h) / 3)} ${fmt(xs[i + 1] - h / 3)},${fmt(ys[i + 1] - (tangents[i + 1] * h) / 3)} ${fmt(xs[i + 1])},${fmt(ys[i + 1])}`;
  }

  return d;
}

function areaPath(pts: Array<[number, number]>, line: string): string {
  if (!line) return "";

  return `${line} L ${pts[pts.length - 1][0].toFixed(2)},100 L ${pts[0][0].toFixed(2)},100 Z`;
}

const downPoints = computed(() => toCoords(downSeries.value));
const upPoints = computed(() => toCoords(upSeries.value));

const downLine = computed(() => linePath(downPoints.value));
const upLine = computed(() => linePath(upPoints.value));

const downArea = computed(() => areaPath(downPoints.value, downLine.value));
const upArea = computed(() => areaPath(upPoints.value, upLine.value));

const stats = computed<NetStat[]>(() => {
  const down = splitVolume(statsStore.downloadData);
  const up = splitVolume(statsStore.uploadData);

  return [
    { label: "Download", icon: arrowDownIcon, value: down.value, unit: down.unit, color: DOWNLOAD_COLOR },
    { label: "Upload", icon: arrowUpIcon, value: up.value, unit: up.unit, color: UPLOAD_COLOR },
  ];
});

onMounted(() => {
  sample();
  sampler = setInterval(sample, SAMPLE_MS);
});

onUnmounted(() => {
  if (sampler) clearInterval(sampler);
});
</script>
