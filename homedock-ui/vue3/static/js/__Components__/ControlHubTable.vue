<!-- homedock-ui/vue3/static/js/__Components__/ControlHubTable.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="flex flex-col h-full min-h-0 overflow-x-auto">
    <div class="flex flex-col h-full min-h-0" :style="{ minWidth: minWidth }">
      <div :class="[themeClasses.fileExplorerToolbar]" class="grid items-stretch border-b flex-shrink-0" :style="{ gridTemplateColumns: gridTemplate }">
        <button v-for="column in columns" :key="column.key" @click="toggleSort(column.key)" :class="[themeClasses.tableTextUp, sortKey === column.key ? themeClasses.appPropsTabButtonActive : '']" class="flex items-center gap-1 h-9 px-2.5 border-0 bg-transparent cursor-pointer transition-colors duration-150" :style="{ justifyContent: column.align === 'right' ? 'flex-end' : 'flex-start' }">
          <Icon v-if="labelIcon(column.label)" :icon="labelIcon(column.label)!" class="w-3 h-3 flex-shrink-0 opacity-70" />
          <span class="text-[10px] font-semibold uppercase tracking-wide leading-none truncate">{{ $t(column.label) }}</span>
          <Icon v-if="sortKey === column.key" :icon="sortDirection === 'asc' ? sortAscIcon : sortDescIcon" class="w-3 h-3 flex-shrink-0" />
        </button>
      </div>

      <div class="flex-1 min-h-0 overflow-y-auto">
        <div v-if="!sortedRows.length" class="flex flex-col items-center justify-center h-full gap-2 py-10">
          <Icon :icon="emptyIcon" :class="[themeClasses.explorerEmptyIcon]" class="w-10 h-10" />
          <p :class="[themeClasses.explorerEmptySubtext]" class="text-xs">{{ $t(emptyLabel) }}</p>
        </div>

        <div v-for="app in sortedRows" :key="app.name" class="grid items-center cursor-default select-none transition-colors duration-100 border-l-2" :class="[selectedName === app.name ? [themeClasses.explorerResultItemSelected, '!border-l-blue-500'] : [themeClasses.storeRowHover, 'border-l-transparent']]" :style="{ gridTemplateColumns: gridTemplate }" @click="emit('select', app)" @dblclick="emit('open', app)" @contextmenu.prevent="emit('context', { app, x: $event.clientX, y: $event.clientY })" @touchstart="startLongPress($event, app)" @touchmove="cancelLongPress" @touchend="cancelLongPress" @touchcancel="cancelLongPress">
          <div v-for="column in columns" :key="column.key" class="flex items-center h-full px-2.5 py-1.5 min-w-0 gap-2" :style="[column.heat ? heatStyle(column.heat(app), column.heatMax || 100) : {}, { justifyContent: column.align === 'right' ? 'flex-end' : 'flex-start' }]">
            <template v-if="column.key === 'name'">
              <span class="relative flex-shrink-0" :title="parentName(app) ? $t('Dependency of {name}', { name: parentName(app) }) : ''">
                <AppIconGraphic :image-src="app.image_path" :size="20" />
                <Icon v-if="parentName(app)" :icon="dependencyBadgeIcon" :class="[themeClasses.hubDependencyBadge]" class="absolute -top-1 -right-1 w-3 h-3 rounded-full p-px ring-1" />
              </span>

              <span :class="[themeClasses.windowTitleTextFocused]" class="text-xs truncate" :title="column.text(app)">{{ column.text(app) }}</span>
            </template>

            <template v-else-if="column.key === 'status'">
              <span :class="[statusDot(app.status)]" class="w-1.5 h-1.5 rounded-full flex-shrink-0"></span>
              <span :class="[themeClasses.tableTextInner]" class="text-[11px] capitalize truncate">{{ $t(app.status) }}</span>
            </template>

            <span v-else :class="[themeClasses.appPropsInfoValue, column.mono ? 'font-mono text-[10px] select-text' : 'text-[11px]']" class="truncate tabular-nums" :title="column.text(app)" @dblclick.stop>{{ column.text(app) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { heatStyle, labelIcon, statusDotClass } from "../__Composables__/useControlHub";

import AppIconGraphic from "./AppIconGraphic.vue";

import { Icon } from "@iconify/vue";
import sortAscIcon from "@iconify-icons/mdi/menu-up";
import sortDescIcon from "@iconify-icons/mdi/menu-down";
import emptyIcon from "@iconify-icons/mdi/magnify-close";
import dependencyBadgeIcon from "@iconify-icons/mdi/cube-outline";

export interface TableColumn {
  key: string;
  label: string;
  width: string;
  align?: "left" | "right";
  text: (app: any) => string;
  sort?: (app: any) => number | string;
  heat?: (app: any) => number;
  heatMax?: number;
  mono?: boolean;
}


interface Props {
  columns: TableColumn[];
  rows: any[];
  selectedName: string;
  defaultSortKey: string;
  defaultSortDirection?: "asc" | "desc";
  minWidth?: string;
  emptyLabel?: string;
  dependencyOf?: (app: any) => string;
}

const props = withDefaults(defineProps<Props>(), {
  defaultSortDirection: "desc",
  minWidth: "0",
  emptyLabel: "No matching apps",
  dependencyOf: undefined,
});

const emit = defineEmits<{
  select: [app: any];
  open: [app: any];
  context: [payload: { app: any; x: number; y: number }];
}>();

const { themeClasses } = useTheme();

const sortKey = ref(props.defaultSortKey);
const sortDirection = ref<"asc" | "desc">(props.defaultSortDirection);

const gridTemplate = computed(() => props.columns.map((column) => column.width).join(" "));

const sortedRows = computed(() => {
  const column = props.columns.find((entry) => entry.key === sortKey.value);
  const direction = sortDirection.value === "asc" ? 1 : -1;
  const resolve = column?.sort || ((app: any) => (app.display_name || app.name).toLowerCase());

  return [...props.rows].sort((a, b) => {
    const left = resolve(a);
    const right = resolve(b);
    if (typeof left === "number" && typeof right === "number") return (left - right) * direction;
    return String(left).localeCompare(String(right)) * direction;
  });
});

function parentName(app: any): string {
  return props.dependencyOf?.(app) || "";
}

function statusDot(status: string): string {
  return statusDotClass(status, themeClasses.value);
}

function toggleSort(key: string) {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
    return;
  }
  sortKey.value = key;
  sortDirection.value = key === "name" || key === "status" ? "asc" : "desc";
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
