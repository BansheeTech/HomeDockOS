// homedock-ui/vue3/static/js/__Stores__/windowStore.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { defineStore } from "pinia";
import { WindowManagerStore } from "@prism-wm/core";
import type { WindowState as PrismWindowState } from "@prism-wm/core";
import type { IconifyIcon } from "@iconify/vue";
import { getAppById } from "../__Config__/WindowDefaultDetails";
import { t } from "../__Languages__";

export function isImageIcon(icon: unknown): icon is string {
  return typeof icon === "string" && icon.includes("/");
}

export type WindowState = Omit<PrismWindowState, "icon" | "data"> & {
  icon: string | IconifyIcon | null;
  data?: Record<string, unknown> & { app?: { name?: string } };
};

export interface PreSnapBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type SnapPreviewSide = "left" | "right" | null;

const core = new WindowManagerStore({
  resolveApp: (appId) => getAppById(appId),
  translate: (appId) => {
    const app = getAppById(appId);
    return app?.name ? t(app.name) : appId;
  },

  onBeforeClose: (win) => {
    if (!win) return true;
    return window.dispatchEvent(new CustomEvent(`homedock:request-close-${win.id}`, { cancelable: true }));
  },
});

const useWindowStoreBase = defineStore("window", {
  state: () => ({
    windows: [] as WindowState[],
    activeWindowId: null as string | null,
    nextZIndex: 1000,
    snapPreview: null as SnapPreviewSide,
    preSnapBounds: {} as Record<string, PreSnapBounds>,
  }),

  getters: {
    appWindows: (state) => state.windows.filter((w) => w.kind !== "dialog"),

    hasOpenDialog: (state) => state.windows.some((w) => w.kind === "dialog" && !w.isClosing),

    openWindows: (state) => state.windows.filter((w) => !w.isMinimized),
    minimizedWindows: (state) => state.windows.filter((w) => w.isMinimized),

    activeWindow: (state) => state.windows.find((w) => w.id === state.activeWindowId) || null,
    getWindowById: (state) => (windowId: string) => {
      return state.windows.find((w) => w.id === windowId) || null;
    },

    isAppOpen: (state) => (appId: string) => {
      return state.windows.some((w) => w.appId === appId);
    },
  },

  actions: {
    openWindow(appId: string, options?: Partial<WindowState> & { allowMultiple?: boolean }) {
      const icon = options?.icon || (options?.data as { icon?: unknown } | undefined)?.icon || getAppById(appId)?.icon || null;

      return core.openWindow(appId, {
        ...options,
        icon,
        title: options?.title || undefined,
      });
    },

    openUniqueWindow(appId: string, uniqueKey: unknown, options?: Partial<WindowState> & { allowMultiple?: boolean }) {
      const existing = core.windows.find((w) => w.appId === appId && !w.isClosing && (w.data as { __uniqueKey?: unknown } | undefined)?.__uniqueKey === uniqueKey);

      if (existing) {
        core.focusWindow(existing.id);
        return existing.id;
      }

      return this.openWindow(appId, {
        ...options,
        allowMultiple: true,
        data: { ...(options?.data ?? {}), __uniqueKey: uniqueKey },
      });
    },

    requestClose(windowId: string) {
      return core.requestClose(windowId);
    },

    closeWindow(windowId: string) {
      core.closeWindow(windowId);
    },

    focusWindow(windowId: string) {
      core.focusWindow(windowId);
    },

    minimizeWindow(windowId: string) {
      core.minimizeWindow(windowId);
    },

    toggleMaximize(windowId: string) {
      core.toggleMaximize(windowId);
    },

    maximizeWindow(windowId: string) {
      core.maximizeWindow(windowId);
    },

    restoreWindow(windowId: string) {
      core.restoreWindow(windowId);
    },

    updateWindowPosition(windowId: string, x: number, y: number) {
      core.updateWindowPosition(windowId, x, y);
    },

    updateWindowSize(windowId: string, width: number, height: number) {
      core.updateWindowSize(windowId, width, height);
    },

    toggleMinimizeWindow(windowId: string) {
      core.toggleMinimizeWindow(windowId);
    },

    requestCloseAll() {
      return core.requestCloseAll();
    },

    closeAllWindows() {
      core.closeAllWindows();
    },

    updateWindowData(windowId: string, data: any) {
      core.updateWindowData(windowId, data);
    },

    updateWindowTitle(windowId: string, title: string) {
      core.updateWindowTitle(windowId, title);
    },

    setSnapPreview(side: SnapPreviewSide) {
      core.setSnapPreview(side);
    },

    snapWindow(windowId: string, side: "left" | "right", taskbarHeight: number) {
      core.snapWindow(windowId, side, taskbarHeight);
    },

    unSnapWindow(windowId: string) {
      core.unSnapWindow(windowId);
    },

    clearSnapPreview() {
      core.clearSnapPreview();
    },

    openFileInApp(appId: string, options?: Partial<WindowState> & { allowMultiple?: boolean }) {
      const existingWindow = core.windows.find((w) => w.appId === appId);

      if (existingWindow) {
        core.focusWindow(existingWindow.id);

        const event = new CustomEvent(`homedock:open-file-${existingWindow.id}`, {
          detail: options?.data,
        });
        window.dispatchEvent(event);

        return existingWindow.id;
      }

      return this.openWindow(appId, options);
    },
  },
});

let boundStore: ReturnType<typeof useWindowStoreBase> | null = null;
let unbind: (() => void) | null = null;

function bindMirror(store: ReturnType<typeof useWindowStoreBase>) {
  if (boundStore === store) return;
  unbind?.();
  boundStore = store;

  const sync = () => {
    const s = core.getState();
    store.$patch((state) => {
      state.windows = s.windows as WindowState[];
      state.activeWindowId = s.activeWindowId;
      state.nextZIndex = s.nextZIndex;
      state.snapPreview = s.snapPreview;
      state.preSnapBounds = { ...s.preSnapBounds };
    });
  };

  unbind = core.subscribe(sync);
  sync();
}

export const useWindowStore = Object.assign((...args: Parameters<typeof useWindowStoreBase>) => {
  const store = useWindowStoreBase(...args);
  bindMirror(store);
  return store;
}, useWindowStoreBase) as typeof useWindowStoreBase;

export function getPrismStore() {
  return core;
}
