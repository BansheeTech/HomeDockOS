// homedock-ui/vue3/static/js/__Stores__/windowStore.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { defineStore } from "pinia";
import { getAppById } from "../__Config__/WindowDefaultDetails";

export interface WindowState {
  id: string;
  appId: string;
  title: string;
  icon: any;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isMaximized: boolean;
  isMinimized: boolean;
  data?: any;
}

export const useWindowStore = defineStore("window", {
  state: () => ({
    windows: [] as WindowState[],
    activeWindowId: null as string | null,
    nextZIndex: 1000,
  }),

  getters: {
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
    generateUUID(): string {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    },

    sanitizeWindowTitle(title: string): string {
      if (typeof title !== "string") {
        return "Untitled";
      }

      let sanitized = title.trim();

      sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, "");

      sanitized = sanitized.replace(/\s+/g, " ");

      sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-_().áéíóúÁÉÍÓÚñÑüÜ]/g, "");

      sanitized = sanitized.substring(0, 50);

      if (!sanitized || sanitized.length === 0) {
        sanitized = "Untitled";
      }

      return sanitized;
    },

    openWindow(appId: string, options?: Partial<WindowState> & { allowMultiple?: boolean }) {
      if (!options?.allowMultiple) {
        const existing = this.windows.find((w) => {
          if (w.appId !== appId) return false;
          if (appId === "enterprise-window" && options?.data?.module) {
            return w.data?.module === options.data.module;
          }
          return true;
        });
        if (existing) {
          this.focusWindow(existing.id);
          if (existing.isMinimized) {
            existing.isMinimized = false;
          }
          return existing.id;
        }
      }

      const app = getAppById(appId);

      if (!app) {
        console.warn(`App "${appId}" not found in registry. Using default values.`);
      }

      const cascadeOffset = this.windows.length * 30;

      const rawTitle = options?.title || app?.name || appId;
      const sanitizedTitle = this.sanitizeWindowTitle(rawTitle);

      const resolvedIcon = options?.icon || options?.data?.icon || app?.icon || null;

      const newWindow: WindowState = {
        id: this.generateUUID(),
        appId,
        title: sanitizedTitle,
        icon: resolvedIcon,
        x: options?.x ?? Math.min(100 + cascadeOffset, window.innerWidth - 300),
        y: options?.y ?? Math.min(100 + cascadeOffset, window.innerHeight - 300),
        width: options?.width ?? app?.defaultWidth ?? 800,
        height: options?.height ?? app?.defaultHeight ?? 600,
        zIndex: this.nextZIndex++,
        isMaximized: options?.isMaximized ?? false,
        isMinimized: false,
        data: options?.data,
      };

      this.windows.push(newWindow);
      this.focusWindow(newWindow.id);

      return newWindow.id;
    },

    closeWindow(windowId: string) {
      const index = this.windows.findIndex((w) => w.id === windowId);
      if (index === -1) return;

      this.windows.splice(index, 1);

      if (this.activeWindowId === windowId) {
        if (this.windows.length > 0) {
          const topWindow = this.windows.reduce((max, w) => (w.zIndex > max.zIndex ? w : max));
          this.activeWindowId = topWindow.id;
        } else {
          this.activeWindowId = null;
        }
      }
    },

    focusWindow(windowId: string) {
      const index = this.windows.findIndex((w) => w.id === windowId);
      if (index === -1) return;

      this.windows[index] = {
        ...this.windows[index],
        zIndex: this.nextZIndex++,
        isMinimized: false,
      };

      this.activeWindowId = windowId;
    },

    minimizeWindow(windowId: string) {
      const index = this.windows.findIndex((w) => w.id === windowId);
      if (index === -1) return;

      this.windows[index] = {
        ...this.windows[index],
        isMinimized: true,
      };

      if (this.activeWindowId === windowId) {
        const visibleWindows = this.windows.filter((w) => !w.isMinimized);
        if (visibleWindows.length > 0) {
          const topWindow = visibleWindows.reduce((max, w) => (w.zIndex > max.zIndex ? w : max));
          this.activeWindowId = topWindow.id;
        } else {
          this.activeWindowId = null;
        }
      }
    },

    toggleMaximize(windowId: string) {
      const index = this.windows.findIndex((w) => w.id === windowId);
      if (index === -1) return;

      this.windows[index].isMaximized = !this.windows[index].isMaximized;
    },

    maximizeWindow(windowId: string) {
      const window = this.windows.find((w) => w.id === windowId);
      if (!window) return;

      window.isMaximized = true;
    },

    restoreWindow(windowId: string) {
      const window = this.windows.find((w) => w.id === windowId);
      if (!window) return;

      window.isMaximized = false;
    },

    updateWindowPosition(windowId: string, x: number, y: number) {
      const index = this.windows.findIndex((w) => w.id === windowId);
      if (index === -1 || this.windows[index].isMaximized) return;

      const win = this.windows[index];

      const minX = -(win.width - 100);
      const maxX = (typeof window !== "undefined" ? window.innerWidth : 1920) - 100;
      const minY = 0;
      const maxY = (typeof window !== "undefined" ? window.innerHeight : 1080) - 100;

      const newX = Math.max(minX, Math.min(maxX, x));
      const newY = Math.max(minY, Math.min(maxY, y));

      this.windows[index] = {
        ...this.windows[index],
        x: newX,
        y: newY,
      };
    },

    updateWindowSize(windowId: string, width: number, height: number) {
      const index = this.windows.findIndex((w) => w.id === windowId);
      if (index === -1 || this.windows[index].isMaximized) return;

      const minWidth = 400;
      const minHeight = 300;

      const newWidth = Math.max(minWidth, width);
      const newHeight = Math.max(minHeight, height);

      this.windows[index] = {
        ...this.windows[index],
        width: newWidth,
        height: newHeight,
      };
    },

    toggleMinimizeWindow(windowId: string) {
      const window = this.windows.find((w) => w.id === windowId);
      if (!window) return;

      if (window.isMinimized) {
        this.focusWindow(windowId);
      } else if (this.activeWindowId === windowId) {
        this.minimizeWindow(windowId);
      } else {
        this.focusWindow(windowId);
      }
    },

    closeAllWindows() {
      this.windows = [];
      this.activeWindowId = null;
    },

    updateWindowData(windowId: string, data: any) {
      const window = this.windows.find((w) => w.id === windowId);
      if (!window) return;

      window.data = { ...window.data, ...data };
    },

    updateWindowTitle(windowId: string, title: string) {
      const window = this.windows.find((w) => w.id === windowId);
      if (!window) return;

      window.title = this.sanitizeWindowTitle(title);
    },
  },
});
