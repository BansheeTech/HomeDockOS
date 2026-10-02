// homedock-ui/vue3/static/js/__Composables__/useDesktopLayoutSync.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { computed, onMounted, onUnmounted, watch, type Ref } from "vue";

import { useDesktopStore } from "../__Stores__/desktopStore";
import { useWidgetsStore } from "../__Stores__/useWidgetsStore";
import { useDesktopSyncStore, appLayoutKey, type LayoutItems } from "../__Stores__/useDesktopSyncStore";
import { getWidgetDims } from "../__Config__/WidgetDefaultDetails";
import { DESKTOP_GRID, fitDesktopLayout, mobileToDesktopItems, desktopToMobileItems, type FitEntry } from "./desktopLayoutFit";

type Positioned = { x?: number; y?: number; gridRow?: number; gridCol?: number; page?: number };

const RESIZE_DEBOUNCE_MS = 150;

export function useDesktopLayoutSync(options: { containerRef: Ref<HTMLElement | null>; isMobile: Ref<boolean>; isBusy: () => boolean }) {
  const desktopStore = useDesktopStore();
  const widgetsStore = useWidgetsStore();
  const sync = useDesktopSyncStore();

  let resizeTimer: ReturnType<typeof setTimeout> | null = null;

  const rootEntries = computed(() => [...desktopStore.desktopRootSystemIcons.map((icon) => ({ key: icon.id, item: icon as Positioned })), ...desktopStore.desktopFolders.map((folder) => ({ key: folder.id, item: folder as Positioned })), ...desktopStore.desktopRootApps.map((app) => ({ key: appLayoutKey(app.name), item: app as Positioned }))]);

  const signature = computed(() => [...rootEntries.value.map((entry) => entry.key), ...widgetsStore.instances.map((w) => `${w.instanceId}:${w.size}`)].join("|"));

  function assign(item: Positioned, next: Positioned) {
    (Object.keys(next) as Array<keyof Positioned>).forEach((field) => {
      if (item[field] !== next[field]) item[field] = next[field];
    });
  }

  function desktopBounds() {
    const width = options.containerRef.value?.clientWidth || window.innerWidth;
    const height = options.containerRef.value?.clientHeight || window.innerHeight;

    return {
      cols: Math.max(1, Math.floor((width - DESKTOP_GRID.padding * 2) / DESKTOP_GRID.sizeX)),
      rows: Math.max(1, Math.floor((height - DESKTOP_GRID.padding * 2) / DESKTOP_GRID.sizeY)),
      iconCols: Math.max(1, Math.round((width - DESKTOP_GRID.iconWidth - DESKTOP_GRID.padding * 2) / DESKTOP_GRID.sizeX) + 1),
      iconRows: Math.max(1, Math.round((height - DESKTOP_GRID.iconHeight - DESKTOP_GRID.padding * 2) / DESKTOP_GRID.sizeY) + 1),
    };
  }

  function missingFrom(layout: LayoutItems | undefined, keys: string[]) {
    return !layout || keys.some((key) => !(key in layout));
  }

  function applyDesktop() {
    const stored = sync.storedLayout("desktop");
    const items = stored.seedFrom === "mobile" ? mobileToDesktopItems(stored.items) : stored.items;

    const entries: FitEntry[] = [
      ...widgetsStore.instances.map((widget) => {
        const dims = getWidgetDims(widget.type, widget.size);
        return { key: widget.instanceId, cols: dims.cols, rows: dims.rows, widget: true };
      }),
      ...rootEntries.value.map((entry) => ({ key: entry.key, cols: 1, rows: 1, widget: false })),
    ];

    const placed = fitDesktopLayout(entries, items, desktopBounds());

    const shifted: LayoutItems = {};
    if (!stored.fromSeed) {
      placed.forEach((cell, key) => {
        const saved = items[key];
        if (saved && (saved[0] !== cell[0] || saved[1] !== cell[1])) shifted[key] = [cell[0], cell[1]];
      });
    }
    sync.setFitShifted("desktop", shifted);

    rootEntries.value.forEach(({ key, item }) => {
      const cell = placed.get(key);
      if (!cell) return;
      assign(item, { x: DESKTOP_GRID.padding + cell[1] * DESKTOP_GRID.sizeX, y: DESKTOP_GRID.padding + cell[0] * DESKTOP_GRID.sizeY, gridRow: cell[0], gridCol: cell[1], page: undefined });
    });

    widgetsStore.instances.forEach((widget) => {
      const cell = placed.get(widget.instanceId);
      if (!cell) return;
      if (widget.gridRow !== cell[0]) widget.gridRow = cell[0];
      if (widget.gridCol !== cell[1]) widget.gridCol = cell[1];
    });

    if (stored.fromSeed) {
      sync.persistLayout();
    } else if (
      missingFrom(
        sync.layouts.desktop,
        entries.map((entry) => entry.key),
      )
    ) {
      sync.persistLayout({ onlyMissing: true });
    }
  }

  function applyMobile() {
    const stored = sync.storedLayout("mobile");
    const items = stored.seedFrom === "desktop" ? desktopToMobileItems(stored.items) : stored.items;

    rootEntries.value.forEach(({ key, item }) => {
      const cell = items[key];
      assign(item, cell ? { x: undefined, y: undefined, page: cell[0], gridRow: cell[1], gridCol: cell[2] } : { x: undefined, y: undefined, page: undefined, gridRow: undefined, gridCol: undefined });
    });

    widgetsStore.instances.forEach((widget) => {
      const cell = items[widget.instanceId];
      widget.mobilePage = cell?.[0];
      widget.mobileRow = cell?.[1];
      widget.mobileCol = cell?.[2];
    });

    const keys = [...rootEntries.value.map((entry) => entry.key), ...widgetsStore.instances.map((widget) => widget.instanceId)];
    if (stored.fromSeed || missingFrom(sync.layouts.mobile, keys)) {
      sync.pendingMobileCommit = true;
    }
  }

  function apply() {
    if (!sync.ready || options.isBusy()) return;

    if (options.isMobile.value) {
      applyMobile();
    } else {
      applyDesktop();
    }
  }

  function handleResize() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeTimer = null;
      if (!options.isMobile.value) apply();
    }, RESIZE_DEBOUNCE_MS);
  }

  function handleVisibility() {
    if (document.visibilityState === "visible") sync.refresh();
  }

  watch(
    options.isMobile,
    (mobile) => {
      sync.mode = mobile ? "mobile" : "desktop";
    },
    { immediate: true },
  );

  watch([() => sync.contentVersion, options.isMobile, signature], apply, { flush: "post" });

  onMounted(() => {
    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibility);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", handleResize);
    document.removeEventListener("visibilitychange", handleVisibility);
    if (resizeTimer) clearTimeout(resizeTimer);
  });

  return { apply };
}
