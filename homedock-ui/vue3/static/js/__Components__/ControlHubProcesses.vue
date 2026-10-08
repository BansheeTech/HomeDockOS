<!-- homedock-ui/vue3/static/js/__Components__/ControlHubProcesses.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="flex flex-col h-full min-h-0">
    <div :class="[themeClasses.fileExplorerToolbar]" class="grid items-stretch border-b flex-shrink-0" :style="{ gridTemplateColumns: gridTemplate }">
      <button v-for="column in columns" :key="column.key" @click="toggleSort(column.key)" :class="[themeClasses.tableTextUp, sortKey === column.key ? themeClasses.appPropsTabButtonActive : '']" class="group flex flex-col justify-center gap-0.5 h-9 px-2.5 border-0 bg-transparent cursor-pointer transition-colors duration-150 hover:opacity-100 opacity-90" :style="{ alignItems: column.align === 'right' ? 'flex-end' : 'flex-start' }">
        <span class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide leading-none">
          <Icon v-if="labelIcon(column.label)" :icon="labelIcon(column.label)!" class="w-3 h-3 flex-shrink-0 opacity-70" />
          <span class="truncate">{{ $t(column.label) }}</span>
          <Icon v-if="sortKey === column.key" :icon="sortDirection === 'asc' ? sortAscIcon : sortDescIcon" class="w-3 h-3 flex-shrink-0" />
        </span>
        <span :class="[themeClasses.tableTextInner]" class="text-[10px] font-bold leading-none opacity-70">{{ column.summary() }}</span>
      </button>
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
      <div v-if="!groups.length" class="flex flex-col items-center justify-center h-full gap-2 py-10">
        <Icon :icon="emptyIcon" :class="[themeClasses.explorerEmptyIcon]" class="w-10 h-10" />
        <p :class="[themeClasses.explorerEmptySubtext]" class="text-xs">{{ $t("No matching apps") }}</p>
      </div>

      <template v-for="group in groups" :key="group.id">
        <button @click="toggleGroup(group.id)" :class="[themeClasses.explorerGroupHeader]" class="w-full flex items-center gap-2 px-2 py-1.5 border-l-2 border-transparent bg-transparent cursor-pointer text-left">
          <span class="flex items-center justify-center w-4 h-4 flex-shrink-0">
            <Icon :icon="collapsedGroups.has(group.id) ? chevronRightIcon : chevronDownIcon" class="w-3.5 h-3.5" />
          </span>
          <Icon v-if="labelIcon(group.label)" :icon="labelIcon(group.label)!" class="w-5 h-5 flex-shrink-0 opacity-70" />
          <span class="text-[10px] font-semibold uppercase tracking-wide">{{ $t(group.label) }}</span>
          <span :class="[themeClasses.explorerGroupCount]" class="text-[10px] font-medium">({{ group.rows.length }})</span>
        </button>

        <template v-if="!collapsedGroups.has(group.id)">
          <template v-for="row in group.rows" :key="row.app.name">
            <div class="grid items-center cursor-default select-none transition-colors duration-100 border-l-2" :class="[selectedName === row.app.name ? [themeClasses.explorerResultItemSelected, '!border-l-blue-500'] : [themeClasses.storeRowHover, 'border-l-transparent']]" :style="{ gridTemplateColumns: gridTemplate }" @click="emit('select', row.app)" @dblclick="emit('open', row.app)" @contextmenu.prevent="emit('context', { app: row.app, x: $event.clientX, y: $event.clientY })" @touchstart="startLongPress($event, row.app)" @touchmove="cancelLongPress" @touchend="cancelLongPress" @touchcancel="cancelLongPress">
              <div class="flex items-center gap-2 px-2 py-1.5 min-w-0">
                <button v-if="row.children.length" @click.stop="toggleExpand(row.app.name)" :class="[themeClasses.windowPlaceholderText]" class="flex items-center justify-center w-4 h-4 flex-shrink-0 border-0 bg-transparent cursor-pointer p-0">
                  <Icon :icon="collapsedApps.has(row.app.name) ? chevronRightIcon : chevronDownIcon" class="w-3.5 h-3.5" />
                </button>
                <span v-else class="w-4 flex-shrink-0"></span>

                <span class="relative flex-shrink-0">
                  <AppIconGraphic :image-src="row.app.image_path" :size="20" />
                  <span v-if="layout === 'compact'" :class="[statusDot(row.app.status)]" class="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-1 ring-black/20"></span>
                </span>

                <span :class="[themeClasses.windowTitleTextFocused]" class="text-xs truncate">{{ row.app.display_name || row.app.name }}</span>

                <Icon v-if="row.app.isProcessing" :icon="loadingIcon" :class="[themeClasses.windowPlaceholderText]" class="w-3 h-3 flex-shrink-0 animate-spin" />
                <Icon v-else-if="row.app.has_update" :icon="updateIcon" :class="[themeClasses.appPropsUpdateBadgeIcon]" class="w-3 h-3 flex-shrink-0" />
              </div>

              <div v-if="layout !== 'compact'" class="flex items-center gap-1.5 px-2.5 min-w-0">
                <span :class="[statusDot(row.app.status)]" class="w-1.5 h-1.5 rounded-full flex-shrink-0"></span>
                <span :class="[themeClasses.tableTextInner]" class="text-[11px] capitalize truncate">{{ $t(row.app.status) }}</span>
              </div>

              <div class="flex items-center justify-end h-full px-2.5 text-[11px] font-medium tabular-nums" :class="[themeClasses.appPropsInfoValue]" :style="heatStyle(row.cpu)">{{ formatPercent(row.cpu) }}</div>

              <div class="flex items-center justify-end h-full px-2.5 text-[11px] font-medium tabular-nums" :class="[themeClasses.appPropsInfoValue]" :style="heatStyle(row.memoryPercent)">{{ memoryLabel(row) }}</div>

              <template v-if="layout === 'wide'">
                <div class="flex items-center justify-end h-full px-2.5 text-[11px] font-medium tabular-nums" :class="[themeClasses.appPropsInfoValue]" :style="heatStyle(row.rx, RATE_SCALE)">{{ formatRate(row.rx) }}</div>
                <div class="flex items-center justify-end h-full px-2.5 text-[11px] font-medium tabular-nums" :class="[themeClasses.appPropsInfoValue]" :style="heatStyle(row.tx, RATE_SCALE)">{{ formatRate(row.tx) }}</div>
              </template>
            </div>

            <template v-if="!collapsedApps.has(row.app.name)">
              <div v-for="child in row.children" :key="child.app.name" class="grid items-center cursor-default select-none transition-colors duration-100 border-l-2" :class="[selectedName === child.app.name ? [themeClasses.explorerResultItemSelected, '!border-l-blue-500'] : [themeClasses.storeRowHover, 'border-l-transparent']]" :style="{ gridTemplateColumns: gridTemplate }" @click="emit('select', child.app)" @dblclick="emit('open', child.app)" @contextmenu.prevent="emit('context', { app: child.app, x: $event.clientX, y: $event.clientY })" @touchstart="startLongPress($event, child.app)" @touchmove="cancelLongPress" @touchend="cancelLongPress" @touchcancel="cancelLongPress">
                <div class="flex items-center gap-2 pl-9 pr-2 py-1.5 min-w-0">
                  <Icon :icon="dependencyIcon" :class="[themeClasses.windowPlaceholderText]" class="w-3.5 h-3.5 flex-shrink-0" />

                  <span class="relative flex-shrink-0" :title="$t('Dependency of {name}', { name: row.app.display_name || row.app.name })">
                    <AppIconGraphic :image-src="child.app.image_path" :size="20" />
                    <Icon :icon="dependencyBadgeIcon" :class="[themeClasses.hubDependencyBadge]" class="absolute -top-1 -right-1 w-3 h-3 rounded-full p-px ring-1" />
                  </span>
                  <span :class="[themeClasses.tableTextInner]" class="text-xs truncate">{{ child.app.name }}</span>
                </div>

                <div v-if="layout !== 'compact'" class="flex items-center gap-1.5 px-2.5 min-w-0">
                  <span :class="[statusDot(child.app.status)]" class="w-1.5 h-1.5 rounded-full flex-shrink-0"></span>
                  <span :class="[themeClasses.tableTextInner]" class="text-[11px] capitalize truncate">{{ $t(child.app.status) }}</span>
                </div>

                <div class="flex items-center justify-end h-full px-2.5 text-[11px] tabular-nums" :class="[themeClasses.tableTextInner]" :style="heatStyle(child.cpu)">{{ formatPercent(child.cpu) }}</div>

                <div class="flex items-center justify-end h-full px-2.5 text-[11px] tabular-nums" :class="[themeClasses.tableTextInner]" :style="heatStyle(child.memoryPercent)">{{ memoryLabel(child) }}</div>

                <template v-if="layout === 'wide'">
                  <div class="flex items-center justify-end h-full px-2.5 text-[11px] tabular-nums" :class="[themeClasses.tableTextInner]" :style="heatStyle(child.rx, RATE_SCALE)">{{ formatRate(child.rx) }}</div>
                  <div class="flex items-center justify-end h-full px-2.5 text-[11px] tabular-nums" :class="[themeClasses.tableTextInner]" :style="heatStyle(child.tx, RATE_SCALE)">{{ formatRate(child.tx) }}</div>
                </template>
              </div>
            </template>
          </template>
        </template>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { formatBytes, formatPercent, formatRate, heatStyle, labelIcon, statusDotClass, type NetworkRate } from "../__Composables__/useControlHub";

import AppIconGraphic from "./AppIconGraphic.vue";

import { Icon } from "@iconify/vue";
import chevronDownIcon from "@iconify-icons/mdi/chevron-down";
import chevronRightIcon from "@iconify-icons/mdi/chevron-right";
import sortAscIcon from "@iconify-icons/mdi/menu-up";
import sortDescIcon from "@iconify-icons/mdi/menu-down";
import loadingIcon from "@iconify-icons/mdi/loading";
import updateIcon from "@iconify-icons/mdi/arrow-up-circle";
import emptyIcon from "@iconify-icons/mdi/magnify-close";
import dependencyIcon from "@iconify-icons/mdi/subdirectory-arrow-right";
import dependencyBadgeIcon from "@iconify-icons/mdi/cube-outline";

const RATE_SCALE = 2 * 1024 * 1024;

interface Props {
  apps: any[];
  dependencies: any[];
  rates: Record<string, NetworkRate>;
  search: string;
  selectedName: string;
  layout: "wide" | "medium" | "compact";
  sortKey: string;
  sortDirection: "asc" | "desc";
  totalRamGb: number;
  systemCpu: string;
  systemRam: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  select: [app: any];
  open: [app: any];
  context: [payload: { app: any; x: number; y: number }];
  "update:sortKey": [key: string];
  "update:sortDirection": [direction: "asc" | "desc"];
}>();

const { themeClasses } = useTheme();

const collapsedApps = ref<Set<string>>(new Set());
const collapsedGroups = ref<Set<string>>(new Set());

watch(
  () => props.selectedName,
  (name) => {
    if (!name) return;

    const dependency = props.dependencies.find((app) => app.name === name);
    if (!dependency?.HDGroup) return;

    const parent = props.apps.find((app) => app.HDGroup === dependency.HDGroup);
    if (!parent || !collapsedApps.value.has(parent.name)) return;

    const next = new Set(collapsedApps.value);
    next.delete(parent.name);
    collapsedApps.value = next;
  },
  { immediate: true },
);

const STATUS_PRIORITY: Record<string, number> = { running: 1, restarting: 2, paused: 3, created: 4, exited: 5 };

const gridTemplate = computed(() => {
  if (props.layout === "compact") return "minmax(0, 1fr) 58px 68px";
  if (props.layout === "medium") return "minmax(0, 1fr) 88px 64px 76px";
  return "minmax(0, 1fr) 96px 72px 86px 92px 92px";
});

const totalRates = computed(() => {
  return Object.values(props.rates || {}).reduce((accumulator, rate) => ({ rx: accumulator.rx + (rate?.rx || 0), tx: accumulator.tx + (rate?.tx || 0) }), { rx: 0, tx: 0 });
});

const columns = computed(() => {
  const list: Array<{ key: string; label: string; align: string; summary: () => string }> = [{ key: "name", label: "Name", align: "left", summary: () => "" }];

  if (props.layout !== "compact") list.push({ key: "status", label: "Status", align: "left", summary: () => "" });

  list.push({ key: "cpu", label: "CPU", align: "right", summary: () => `${props.systemCpu}%` });
  list.push({ key: "memory", label: "Memory", align: "right", summary: () => `${props.systemRam}%` });

  if (props.layout === "wide") {
    list.push({ key: "rx", label: "Download", align: "right", summary: () => formatRate(totalRates.value.rx) });
    list.push({ key: "tx", label: "Upload", align: "right", summary: () => formatRate(totalRates.value.tx) });
  }

  return list;
});

function decorate(app: any) {
  const rate = props.rates?.[app.name] || { rx: 0, tx: 0 };
  return {
    app,
    cpu: Number(app.usagePercent) || 0,
    memoryPercent: Number(app.memoryUsagePercent) || 0,
    memoryBytes: Number(app.memoryUsageBytes) || 0,
    rx: rate.rx,
    tx: rate.tx,
  };
}

function matchesSearch(app: any): boolean {
  const query = props.search.trim().toLowerCase();
  if (!query) return true;
  return (app.display_name || app.name).toLowerCase().includes(query) || app.name.toLowerCase().includes(query) || (app.image || "").toLowerCase().includes(query);
}

const rows = computed(() => {
  const decorated = props.apps.filter(matchesSearch).map((app) => {
    const children = props.dependencies.filter((dependency) => dependency.HDGroup && dependency.HDGroup === app.HDGroup).map(decorate);
    return { ...decorate(app), children };
  });

  const direction = props.sortDirection === "asc" ? 1 : -1;

  return decorated.sort((a, b) => {
    switch (props.sortKey) {
      case "status":
        return ((STATUS_PRIORITY[a.app.status] || 99) - (STATUS_PRIORITY[b.app.status] || 99)) * direction;
      case "cpu":
        return (a.cpu - b.cpu) * direction;
      case "memory":
        return (a.memoryPercent - b.memoryPercent) * direction;
      case "rx":
        return (a.rx - b.rx) * direction;
      case "tx":
        return (a.tx - b.tx) * direction;
      default:
        return (a.app.display_name || a.app.name).localeCompare(b.app.display_name || b.app.name) * direction;
    }
  });
});

const groups = computed(() => {
  const foreground = rows.value.filter((row) => Boolean(row.app.service_url));
  const background = rows.value.filter((row) => !row.app.service_url);

  return [
    { id: "apps", label: "Apps", rows: foreground },
    { id: "background", label: "Background processes", rows: background },
  ].filter((group) => group.rows.length > 0);
});

function memoryLabel(row: { memoryBytes: number; memoryPercent: number }): string {
  if (row.memoryBytes > 0) return formatBytes(row.memoryBytes, row.memoryBytes >= 1024 * 1024 * 1024 ? 2 : 0);
  if (props.totalRamGb > 0 && row.memoryPercent > 0) return formatBytes((row.memoryPercent / 100) * props.totalRamGb * 1024 * 1024 * 1024, 0);
  return formatPercent(row.memoryPercent);
}

function statusDot(status: string): string {
  return statusDotClass(status, themeClasses.value);
}

function toggleSort(key: string) {
  if (props.sortKey === key) {
    emit("update:sortDirection", props.sortDirection === "asc" ? "desc" : "asc");
    return;
  }
  emit("update:sortKey", key);
  emit("update:sortDirection", key === "name" || key === "status" ? "asc" : "desc");
}

function toggleExpand(name: string) {
  const next = new Set(collapsedApps.value);
  next.has(name) ? next.delete(name) : next.add(name);
  collapsedApps.value = next;
}

function toggleGroup(id: string) {
  const next = new Set(collapsedGroups.value);
  next.has(id) ? next.delete(id) : next.add(id);
  collapsedGroups.value = next;
}

let longPressTimer: ReturnType<typeof setTimeout> | null = null;

function startLongPress(event: TouchEvent, app: any) {
  cancelLongPress();
  const touch = event.touches[0];
  if (!touch) return;

  emit("select", app);

  longPressTimer = setTimeout(() => {
    emit("context", { app, x: touch.clientX, y: touch.clientY });
  }, 500);
}

function cancelLongPress() {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}
</script>
