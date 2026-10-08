<!-- homedock-ui/vue3/static/js/__Components__/ControlHubDetails.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
    <div v-if="!cards.length" class="flex flex-col items-center justify-center h-full gap-2 py-10">
      <Icon :icon="emptyIcon" :class="[themeClasses.explorerEmptyIcon]" class="w-10 h-10" />
      <p :class="[themeClasses.explorerEmptySubtext]" class="text-xs">{{ $t(emptyLabel) }}</p>
    </div>

    <div v-else class="grid gap-3 p-3" :style="{ gridTemplateColumns: compact ? 'minmax(0, 1fr)' : 'repeat(auto-fill, minmax(300px, 1fr))' }">
      <article v-for="{ app, members } in cards" :key="app.name" :class="[themeClasses.appPropsUsageCardBg, themeClasses.appPropsUsageCardBorder, themeClasses.aeroExtraScope, selectedName === app.name ? 'card-selected' : '']" class="detail-card flex flex-col gap-3 p-3.5 rounded-2xl cursor-default select-none min-w-0" @click="select(app)" @dblclick="emit('open', app)" @contextmenu.prevent="emit('context', { app, x: $event.clientX, y: $event.clientY })" @touchstart.passive="startLongPress($event, app)" @touchmove="cancelLongPress" @touchend="cancelLongPress" @touchcancel="cancelLongPress">
        <header class="flex items-center gap-3 min-w-0">
          <AppIconGraphic :image-src="app.image_path" :size="36" />

          <span class="flex flex-col flex-1 min-w-0">
            <span class="flex items-center gap-1.5 min-w-0">
              <span :class="[themeClasses.windowTitleTextFocused]" class="text-[13px] font-semibold truncate">{{ title(app) }}</span>
              <span v-if="members.length" :class="[themeClasses.hubDependencyBadge]" class="flex items-center gap-0.5 h-4 pl-0.5 pr-1.5 rounded-full flex-shrink-0" :title="$t('Dependencies')">
                <Icon :icon="dependencyBadgeIcon" class="w-3 h-3" />
                <span class="text-[10px] font-semibold tabular-nums leading-none">{{ members.length }}</span>
              </span>
              <Icon v-if="app.has_update" :icon="updateIcon" :class="[themeClasses.appPropsUpdateBadgeIcon]" class="w-3.5 h-3.5 flex-shrink-0" :title="$t('Update')" />
            </span>
            <span :class="[themeClasses.appPropsInfoLabel]" class="text-[11px] truncate" :title="app.image">{{ app.image || app.name }}</span>
          </span>

          <span class="status-pill flex items-center gap-1.5 h-5 px-2 rounded-full flex-shrink-0">
            <span :class="[statusDotClass(app.status, themeClasses)]" class="w-1.5 h-1.5 rounded-full"></span>
            <span :class="[themeClasses.appPropsInfoValue]" class="text-[10px] font-medium capitalize leading-none">{{ $t(app.status) }}</span>
          </span>
        </header>

        <div class="grid grid-cols-2 gap-2">
          <div v-for="metric in metrics(app)" :key="metric.label" class="metric-tile flex flex-col gap-1.5 px-2.5 pt-2 pb-1.5 rounded-xl min-w-0">
            <span class="flex items-baseline justify-between gap-2 min-w-0">
              <span :class="[themeClasses.appPropsInfoLabel]" class="text-[11px]">{{ $t(metric.label) }}</span>
              <span :class="[themeClasses.appPropsInfoValue]" class="text-[13px] font-semibold tabular-nums truncate">{{ metric.value }}</span>
            </span>
            <span class="block h-7">
              <ControlHubGraph :values="metric.series" :capacity="HISTORY_CAPACITY" :max="metric.max" :color="metric.color" :line-width="1.25" />
            </span>
          </div>
        </div>

        <dl class="m-0 grid grid-cols-3 gap-2">
          <div class="flex flex-col gap-0.5 min-w-0">
            <dt :class="[themeClasses.appPropsInfoLabel]" class="text-[10px]">{{ $t("Up time") }}</dt>
            <dd :class="[themeClasses.appPropsInfoValue]" class="m-0 text-xs font-medium tabular-nums truncate">{{ formatUptime(app.startedAt) }}</dd>
          </div>

          <div class="flex flex-col gap-0.5 min-w-0">
            <dt :class="[themeClasses.appPropsInfoLabel]" class="text-[10px]">{{ $t("Ports") }}</dt>
            <dd :class="[themeClasses.appPropsInfoValue]" class="m-0 text-xs font-medium tabular-nums truncate" :title="portsText(app)">{{ portsText(app) }}</dd>
          </div>

          <div class="flex flex-col gap-0.5 min-w-0">
            <dt :class="[themeClasses.appPropsInfoLabel]" class="text-[10px]">{{ $t("Container ID") }}</dt>
            <dd class="m-0 min-w-0">
              <button @click.stop="copyId(app)" :class="[themeClasses.appPropsInfoValue]" class="copy-value flex items-center gap-1 max-w-full border-0 bg-transparent p-0 cursor-pointer text-xs font-medium tabular-nums outline-hidden rounded focus-visible:ring-2 focus-visible:ring-blue-500/60" :title="$t('Copy')">
                <span class="truncate">{{ app.id || "—" }}</span>
                <Icon :icon="copiedName === app.name ? checkIcon : copyIcon" class="copy-icon w-3 h-3 flex-shrink-0" :class="copiedName === app.name ? 'text-green-500' : ''" />
              </button>
            </dd>
          </div>
        </dl>

        <div v-if="members.length" class="metric-tile flex flex-col p-1 rounded-xl">
          <div v-for="member in members" :key="member.name" :class="[selectedName === member.name ? 'member-selected' : '']" class="member-row flex items-center gap-2.5 h-8 px-2 rounded-lg min-w-0" :title="$t('Dependency of {name}', { name: title(app) })" @click.stop="select(member)" @dblclick.stop="emit('open', member)" @contextmenu.stop.prevent="emit('context', { app: member, x: $event.clientX, y: $event.clientY })" @touchstart.stop.passive="startLongPress($event, member)" @touchmove="cancelLongPress" @touchend="cancelLongPress" @touchcancel="cancelLongPress">
            <span class="relative flex-shrink-0">
              <AppIconGraphic :image-src="member.image_path" :size="20" />
              <Icon :icon="dependencyBadgeIcon" :class="[themeClasses.hubDependencyBadge]" class="absolute -top-1 -right-1 w-3 h-3 rounded-full p-px ring-1" />
            </span>
            <span :class="[themeClasses.appPropsInfoValue]" class="text-xs truncate flex-1 min-w-0">{{ member.name }}</span>
            <span :class="[statusDotClass(member.status, themeClasses)]" class="w-1.5 h-1.5 rounded-full flex-shrink-0" :title="$t(member.status)"></span>
            <span :class="[themeClasses.appPropsInfoLabel]" class="text-[11px] tabular-nums text-right w-10 flex-shrink-0">{{ formatPercent(member.usagePercent) }}</span>
            <span :class="[themeClasses.appPropsInfoLabel]" class="text-[11px] tabular-nums text-right w-14 flex-shrink-0">{{ memoryText(member) }}</span>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { useTheme } from "../__Themes__/ThemeSelector";
import { METRIC_COLORS, formatBytes, formatPercent, formatUptime, statusDotClass, type ContainerSeries } from "../__Composables__/useControlHub";

import AppIconGraphic from "./AppIconGraphic.vue";
import ControlHubGraph from "./ControlHubGraph.vue";

import { Icon } from "@iconify/vue";
import emptyIcon from "@iconify-icons/mdi/magnify-close";
import dependencyBadgeIcon from "@iconify-icons/mdi/cube-outline";
import updateIcon from "@iconify-icons/mdi/arrow-up-circle";
import copyIcon from "@iconify-icons/mdi/content-copy";
import checkIcon from "@iconify-icons/mdi/check";

const HISTORY_CAPACITY = 45;

interface Props {
  rows: any[];
  history: Record<string, ContainerSeries>;
  totalRamGb?: number;
  selectedName: string;
  layout?: "wide" | "medium" | "compact";
  emptyLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  totalRamGb: 0,
  layout: "wide",
  emptyLabel: "No matching apps",
});

const emit = defineEmits<{
  select: [app: any];
  open: [app: any];
  context: [payload: { app: any; x: number; y: number }];
}>();

const { t } = useI18n();
const { themeClasses } = useTheme();

const copiedName = ref("");

const compact = computed(() => props.layout === "compact");

function isDependency(app: any): boolean {
  return app.HDRole === "dependency";
}

function title(app: any): string {
  return isDependency(app) ? app.name : app.display_name || app.name;
}

function byTitle(a: any, b: any): number {
  return title(a).localeCompare(title(b), undefined, { sensitivity: "base" });
}

function membersOf(lead: any): any[] {
  if (!lead.HDGroup) return [];
  return props.rows.filter((app) => isDependency(app) && app.HDGroup === lead.HDGroup).sort(byTitle);
}

const cards = computed(() =>
  props.rows
    .filter((app) => !isDependency(app))
    .sort(byTitle)
    .map((lead) => ({ app: lead, members: membersOf(lead) })),
);

function select(app: any) {
  if (longPressFired) {
    longPressFired = false;
    return;
  }
  if (props.selectedName !== app.name) emit("select", app);
}

function graphMax(series: number[]): number {
  const peak = Math.max(0, ...series);
  return Math.min(100, Math.max(5, peak * 1.25));
}

function memoryText(app: any): string {
  const bytes = Number(app.memoryUsageBytes) || 0;
  if (bytes > 0) return formatBytes(bytes, bytes >= 1024 * 1024 * 1024 ? 2 : 0);

  const percent = Number(app.memoryUsagePercent) || 0;
  if (props.totalRamGb > 0 && percent > 0) return formatBytes((percent / 100) * props.totalRamGb * 1024 * 1024 * 1024, 0);
  return formatPercent(percent);
}

function metrics(app: any) {
  const series = props.history[app.name] || { cpu: [], memory: [] };

  return [
    { label: "CPU", value: formatPercent(Number(app.usagePercent) || 0), series: series.cpu, max: graphMax(series.cpu), color: METRIC_COLORS.cpu },
    { label: "Memory", value: memoryText(app), series: series.memory, max: graphMax(series.memory), color: METRIC_COLORS.memory },
  ];
}

function portsText(app: any): string {
  const allPorts: string[] = app.ports || [];
  if (allPorts.includes("hostmode")) return t("Host network");
  const ports = allPorts.filter((port) => port && port !== "disabled");
  return ports.length ? ports.join(", ") : "—";
}

let copiedTimer: ReturnType<typeof setTimeout> | null = null;

async function copyId(app: any) {
  if (!app.id) return;

  try {
    await navigator.clipboard.writeText(app.id);
    copiedName.value = app.name;
    if (copiedTimer) clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => (copiedName.value = ""), 1500);
  } catch {
    copiedName.value = "";
  }
}

let longPressTimer: ReturnType<typeof setTimeout> | null = null;
let longPressFired = false;

function startLongPress(event: TouchEvent, app: any) {
  cancelLongPress();
  longPressFired = false;
  const touch = event.touches[0];
  if (!touch) return;

  longPressTimer = setTimeout(() => {
    longPressFired = true;
    emit("context", { app, x: touch.clientX, y: touch.clientY });
  }, 500);
}

function cancelLongPress() {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}

onUnmounted(() => {
  if (copiedTimer) clearTimeout(copiedTimer);
  cancelLongPress();
});
</script>

<style scoped>
.detail-card {
  transition: box-shadow 0.15s ease;
}

.card-selected {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.55);
}

.member-row:hover {
  background-color: rgba(127, 127, 127, 0.08);
}

.member-selected,
.member-selected:hover {
  background-color: rgba(59, 130, 246, 0.14);
}

.status-pill,
.metric-tile {
  background-color: rgba(127, 127, 127, 0.08);
}

.copy-icon {
  opacity: 0.4;
  transition: opacity 0.15s ease;
}

.copy-value:hover .copy-icon,
.copy-value:focus-visible .copy-icon {
  opacity: 1;
}
</style>
