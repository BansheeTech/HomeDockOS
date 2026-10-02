// homedock-ui/vue3/static/js/__Stores__/useWidgetsStore.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { defineStore } from "pinia";
import { ref, computed } from "vue";

import { useDesktopSyncStore, type DesktopContent, type DesktopMode, type LayoutItems } from "./useDesktopSyncStore";
import { getWidgetDims, getWidgetDefinition, type WidgetSize } from "../__Config__/WidgetDefaultDetails";

// HDOS00078
export interface WidgetInstance {
  instanceId: string;
  type: string;
  gridRow: number;
  gridCol: number;
  size: WidgetSize;
  mobileRow?: number;
  mobileCol?: number;
  mobilePage?: number;
  settings?: Record<string, unknown>;
}

export interface WidgetRect {
  row: number;
  col: number;
  rows: number;
  cols: number;
}

export const WIDGET_MAX_INSTANCES = 100;

function generateInstanceId(): string {
  return `widget-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

export const useWidgetsStore = defineStore("WidgetsStore", () => {
  const sync = useDesktopSyncStore();

  const instances = ref<WidgetInstance[]>([]);
  const loaded = ref(false);

  function instanceRect(instance: WidgetInstance): WidgetRect {
    const dims = getWidgetDims(instance.type, instance.size);
    return { row: instance.gridRow, col: instance.gridCol, rows: dims.rows, cols: dims.cols };
  }

  const occupiedCells = computed<Set<string>>(() => {
    const cells = new Set<string>();
    instances.value.forEach((instance) => {
      const rect = instanceRect(instance);
      for (let r = rect.row; r < rect.row + rect.rows; r++) {
        for (let c = rect.col; c < rect.col + rect.cols; c++) {
          cells.add(`${r},${c}`);
        }
      }
    });
    return cells;
  });

  function getInstance(instanceId: string): WidgetInstance | undefined {
    return instances.value.find((i) => i.instanceId === instanceId);
  }

  function applyContent(content: DesktopContent) {
    const previous = new Map(instances.value.map((instance) => [instance.instanceId, instance]));

    instances.value = content.widgets
      .filter((meta) => getWidgetDefinition(meta.type))
      .map((meta) => {
        const existing = previous.get(meta.instanceId);

        return {
          ...meta,
          gridRow: existing?.gridRow ?? 0,
          gridCol: existing?.gridCol ?? 0,
          mobileRow: existing?.mobileRow,
          mobileCol: existing?.mobileCol,
          mobilePage: existing?.mobilePage,
        };
      });

    loaded.value = true;
  }

  function layoutItems(mode: DesktopMode): LayoutItems {
    const items: LayoutItems = {};

    instances.value.forEach((instance) => {
      if (mode === "desktop") {
        items[instance.instanceId] = [instance.gridRow, instance.gridCol];
      } else if (instance.mobileRow !== undefined && instance.mobileCol !== undefined) {
        items[instance.instanceId] = [instance.mobilePage ?? 0, instance.mobileRow, instance.mobileCol];
      }
    });

    return items;
  }

  sync.onContentApplied(applyContent);
  sync.registerLayoutProvider({ items: layoutItems, owns: (key) => key.startsWith("widget-") });

  function persist() {
    sync.updateContent((draft) => {
      draft.widgets = instances.value.map((instance) => ({ instanceId: instance.instanceId, type: instance.type, size: instance.size, ...(instance.settings && { settings: instance.settings }) }));
    });
    sync.persistLayout();
  }

  function add(type: string, gridRow: number, gridCol: number, size?: WidgetSize): WidgetInstance | null {
    const def = getWidgetDefinition(type);
    if (!def || instances.value.length >= WIDGET_MAX_INSTANCES) return null;

    const instance: WidgetInstance = {
      instanceId: generateInstanceId(),
      type,
      gridRow,
      gridCol,
      size: size && def.sizes[size] ? size : def.defaultSize,
    };

    instances.value.push(instance);
    persist();

    return instance;
  }

  function move(instanceId: string, gridRow: number, gridCol: number) {
    const instance = getInstance(instanceId);
    if (!instance) return;

    instance.gridRow = gridRow;
    instance.gridCol = gridCol;
    persist();
  }

  function resize(instanceId: string, size: WidgetSize, gridRow?: number, gridCol?: number) {
    const instance = getInstance(instanceId);
    if (!instance || !getWidgetDefinition(instance.type)?.sizes[size]) return;

    instance.size = size;
    if (gridRow !== undefined) instance.gridRow = gridRow;
    if (gridCol !== undefined) instance.gridCol = gridCol;
    persist();
  }

  function setMobilePosition(instanceId: string, pos: { row: number; col: number; page: number } | null) {
    const instance = getInstance(instanceId);
    if (!instance) return;

    if (pos) {
      instance.mobileRow = pos.row;
      instance.mobileCol = pos.col;
      instance.mobilePage = pos.page;
    } else {
      instance.mobileRow = undefined;
      instance.mobileCol = undefined;
      instance.mobilePage = undefined;
    }
    persist();
  }

  function remove(instanceId: string) {
    const index = instances.value.findIndex((i) => i.instanceId === instanceId);
    if (index === -1) return;

    instances.value.splice(index, 1);
    persist();
  }

  function updateSettings(instanceId: string, settings: Record<string, unknown>) {
    const instance = getInstance(instanceId);
    if (!instance) return;

    instance.settings = { ...instance.settings, ...settings };
    persist();
  }

  return {
    instances,
    loaded,
    occupiedCells,

    instanceRect,
    getInstance,

    applyContent,
    add,
    move,
    resize,
    setMobilePosition,
    remove,
    updateSettings,
  };
});
