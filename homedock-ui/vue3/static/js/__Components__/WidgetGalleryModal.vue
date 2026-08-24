<!-- homedock-ui/vue3/static/js/__Components__/WidgetGalleryModal.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <AppDialog :visible="visible" type="info" title="Add Widget" :icon="widgetsOutlineIcon" :width="480" :footer="false" @update:visible="emit('update:visible', $event)">
    <div v-if="visible" class="grid grid-cols-2 gap-3">
      <button v-for="entry in previews" :key="entry.def.id" type="button" class="group flex flex-col rounded-xl border overflow-hidden text-left transition-all cursor-pointer hover:shadow-md" :class="[themeClasses.windowInputBg, themeClasses.windowBorder]" @click="handleAdd(entry.def)">
        <div class="w-full h-[104px] flex items-center justify-center overflow-hidden" :class="themeClasses.widgetPreviewBg">
          <div class="pointer-events-none transition-transform duration-200 group-hover:scale-[1.04]" :style="previewDims(entry.def)">
            <DesktopWidgetFrame :instance="entry.instance" bare />
          </div>
        </div>
        <div class="flex items-center justify-between gap-2 px-3 py-2.5 w-full">
          <span class="text-sm font-medium truncate" :class="themeClasses.windowText">{{ $t(entry.def.name) }}</span>
          <div class="flex items-center gap-1 shrink-0">
            <span v-for="size in sizeKeys(entry.def)" :key="size" class="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold uppercase" :class="[themeClasses.desktopWidgetControlBg, themeClasses.desktopWidgetMeta]" :title="$t(sizeLabel(size))">{{ size }}</span>
          </div>
        </div>
      </button>
    </div>
  </AppDialog>
</template>

<script lang="ts" setup>
import widgetsOutlineIcon from "@iconify-icons/mdi/widgets-outline";

import AppDialog from "./AppDialog.vue";
import DesktopWidgetFrame from "../__Desktop__/DesktopWidgetFrame.vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { DESKTOP_WIDGETS, getWidgetDims, type WidgetDefinition, type WidgetSize } from "../__Config__/WidgetDefaultDetails";

import type { WidgetInstance } from "../__Stores__/useWidgetsStore";

defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  add: [widget: WidgetDefinition];
}>();

const { themeClasses } = useTheme();

const DESIGN_CELL_X = 110;
const DESIGN_CELL_Y = 125;
const CELL_GUTTER = 10;
const PREVIEW_MAX_W = 168;
const PREVIEW_MAX_H = 88;

const previews = DESKTOP_WIDGETS.map((def) => ({
  def,
  instance: {
    instanceId: `preview-${def.id}`,
    type: def.id,
    gridRow: 0,
    gridCol: 0,
    size: def.defaultSize,
  } as WidgetInstance,
}));

function previewDims(def: WidgetDefinition): Record<string, string> {
  const dims = getWidgetDims(def.id, def.defaultSize);
  const w = dims.cols * DESIGN_CELL_X - CELL_GUTTER;
  const h = dims.rows * DESIGN_CELL_Y - CELL_GUTTER;
  const scale = Math.min(PREVIEW_MAX_W / w, PREVIEW_MAX_H / h);
  return { width: `${Math.round(w * scale)}px`, height: `${Math.round(h * scale)}px` };
}

function sizeKeys(def: WidgetDefinition): WidgetSize[] {
  return Object.keys(def.sizes) as WidgetSize[];
}

function sizeLabel(size: WidgetSize): string {
  return size === "s" ? "Small" : size === "m" ? "Medium" : "Large";
}

function handleAdd(widget: WidgetDefinition) {
  emit("add", widget);
  emit("update:visible", false);
}
</script>
