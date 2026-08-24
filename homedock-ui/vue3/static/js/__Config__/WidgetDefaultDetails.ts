// homedock-ui/vue3/static/js/__Config__/WidgetDefaultDetails.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { defineAsyncComponent, type Component } from "vue";

import clockOutlineIcon from "@iconify-icons/mdi/clock-outline";
import chartLineIcon from "@iconify-icons/mdi/chart-line";
import harddiskIcon from "@iconify-icons/mdi/harddisk";
import calendarMonthIcon from "@iconify-icons/mdi/calendar-month";
import swapVerticalIcon from "@iconify-icons/mdi/swap-vertical";
import noteTextOutlineIcon from "@iconify-icons/mdi/note-text-outline";
import playCircleOutlineIcon from "@iconify-icons/mdi/play-circle-outline";
import linkVariantIcon from "@iconify-icons/mdi/link-variant";

// HDOS00078
export type WidgetSize = "s" | "m" | "l";

export interface WidgetDefinition {
  id: string;
  name: string;
  icon: any;
  sizes: Partial<Record<WidgetSize, { cols: number; rows: number }>>;
  defaultSize: WidgetSize;
  component: Component;
}

const WidgetClock = defineAsyncComponent(() => import("../__Widgets__/WidgetClock.vue"));
const WidgetSystem = defineAsyncComponent(() => import("../__Widgets__/WidgetSystem.vue"));
const WidgetStorage = defineAsyncComponent(() => import("../__Widgets__/WidgetStorage.vue"));
const WidgetNetwork = defineAsyncComponent(() => import("../__Widgets__/WidgetNetwork.vue"));
const WidgetNotes = defineAsyncComponent(() => import("../__Widgets__/WidgetNotes.vue"));
const WidgetCalendar = defineAsyncComponent(() => import("../__Widgets__/WidgetCalendar.vue"));
const WidgetMedia = defineAsyncComponent(() => import("../__Widgets__/WidgetMedia.vue"));
const WidgetShortcut = defineAsyncComponent(() => import("../__Widgets__/WidgetShortcut.vue"));

const registry: WidgetDefinition[] = [
  {
    id: "clock",
    name: "Clock",
    icon: clockOutlineIcon,
    sizes: {
      s: { cols: 2, rows: 1 },
      m: { cols: 2, rows: 2 },
    },
    defaultSize: "s",
    component: WidgetClock,
  },
  {
    id: "system-stats",
    name: "System",
    icon: chartLineIcon,
    sizes: {
      m: { cols: 2, rows: 2 },
      l: { cols: 4, rows: 2 },
    },
    defaultSize: "m",
    component: WidgetSystem,
  },
  {
    id: "storage",
    name: "Storage",
    icon: harddiskIcon,
    sizes: {
      s: { cols: 2, rows: 1 },
      m: { cols: 2, rows: 2 },
    },
    defaultSize: "m",
    component: WidgetStorage,
  },
  {
    id: "notes",
    name: "Notes",
    icon: noteTextOutlineIcon,
    sizes: {
      s: { cols: 2, rows: 1 },
      m: { cols: 2, rows: 2 },
    },
    defaultSize: "m",
    component: WidgetNotes,
  },
  {
    id: "network",
    name: "Network",
    icon: swapVerticalIcon,
    sizes: {
      s: { cols: 2, rows: 1 },
      m: { cols: 2, rows: 2 },
    },
    defaultSize: "s",
    component: WidgetNetwork,
  },
  {
    id: "calendar",
    name: "Calendar",
    icon: calendarMonthIcon,
    sizes: {
      m: { cols: 2, rows: 2 },
      l: { cols: 4, rows: 2 },
    },
    defaultSize: "m",
    component: WidgetCalendar,
  },
  {
    id: "media",
    name: "Media",
    icon: playCircleOutlineIcon,
    sizes: {
      s: { cols: 2, rows: 1 },
      m: { cols: 2, rows: 2 },
    },
    defaultSize: "m",
    component: WidgetMedia,
  },
  {
    id: "shortcut",
    name: "Shortcut",
    icon: linkVariantIcon,
    sizes: {
      s: { cols: 2, rows: 1 },
    },
    defaultSize: "s",
    component: WidgetShortcut,
  },
];

export const DESKTOP_WIDGETS: WidgetDefinition[] = registry;

export function registerWidget(def: WidgetDefinition): void {
  if (registry.some((w) => w.id === def.id)) return;
  registry.push(def);
}

export function getWidgetDefinition(type: string): WidgetDefinition | undefined {
  return registry.find((w) => w.id === type);
}

export function getWidgetDims(type: string, size: WidgetSize): { cols: number; rows: number } {
  const def = getWidgetDefinition(type);
  return def?.sizes[size] || def?.sizes[def.defaultSize] || { cols: 2, rows: 2 };
}
