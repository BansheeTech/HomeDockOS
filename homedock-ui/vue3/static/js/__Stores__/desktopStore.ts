// homedock-ui/vue3/static/js/__Stores__/desktopStore.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { defineStore } from "pinia";
import { useWindowStore } from "./windowStore";

export interface DockerApp {
  id: string;
  name: string;
  display_name?: string;
  image: string;
  image_path: string;
  status: "running" | "exited" | "paused" | "created";
  statusColor: string;
  service_url: string | null;
  host: string;
  ports: string[];
  usagePercent: number;
  memoryUsagePercent: number;
  networkRxBytes: number;
  networkTxBytes: number;
  HDGroup: string;
  HDRole?: string;
  checked: boolean;
  isProcessing: boolean;
  has_update?: boolean;

  x?: number;
  y?: number;
  gridRow?: number;
  gridCol?: number;
  page?: number;

  folderId?: string | null;
}

export interface DesktopFolder {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  items: string[];

  x?: number;
  y?: number;
  gridRow?: number;
  gridCol?: number;
  page?: number;
  createdAt: number;
}

export interface SystemDesktopIcon {
  id: string;
  appId: string;
  name: string;
  icon: any;
  x?: number;
  y?: number;
  gridRow?: number;
  gridCol?: number;
  page?: number;
  isPermanent?: boolean;
}

export const useDesktopStore = defineStore("desktop", {
  state: () => ({
    startMenuOpen: false,
    dockerApps: [] as DockerApp[],
    desktopFolders: [] as DesktopFolder[],
    systemDesktopIcons: [] as SystemDesktopIcon[],
    recentApps: [] as string[],
    pinnedApps: [] as string[],
    desktopLayout: "grid" as "grid" | "list",
    iconSize: "medium" as "small" | "medium" | "large",
    draggedAppIds: [] as string[],
  }),

  getters: {
    runningDockerApps: (state) => state.dockerApps.filter((app) => app.status === "running"),

    stoppedDockerApps: (state) => state.dockerApps.filter((app) => app.status === "exited"),

    mainDockerApps: (state) => state.dockerApps.filter((app) => app.HDRole !== "dependency"),

    desktopRootApps: (state) => state.dockerApps.filter((app) => app.HDRole !== "dependency" && !app.folderId),

    getAppsInFolder: (state) => (folderId: string) => {
      return state.dockerApps.filter((app) => app.folderId === folderId && app.HDRole !== "dependency");
    },

    getFolderById: (state) => (folderId: string) => {
      return state.desktopFolders.find((folder) => folder.id === folderId);
    },

    dependencyDockerApps: (state) => state.dockerApps.filter((app) => app.HDRole === "dependency"),

    totalDockerApps: (state) => state.dockerApps.length,

    eDockerAppsCount: (state) => state.dockerApps.filter((app) => app.status === "running").length,
  },

  actions: {
    toggleStartMenu() {
      this.startMenuOpen = !this.startMenuOpen;
    },

    openStartMenu() {
      this.startMenuOpen = true;
    },

    closeStartMenu() {
      this.startMenuOpen = false;
    },

    openSystemApp(appId: string) {
      const windowStore = useWindowStore();
      windowStore.openWindow(appId);
      this.closeStartMenu();
      this.addToRecent(appId);
    },

    openDockerApp(app: DockerApp) {
      if (app.service_url && app.status === "running") {
        window.open(app.service_url, "_blank", "noopener,noreferrer");
      } else {
        const windowStore = useWindowStore();
        windowStore.openWindow("properties", {
          title: `${app.display_name || app.name} - Properties`,
          data: { appId: app.id },
          allowMultiple: true,
        });
      }

      this.addToRecent(`docker:${app.id}`);
    },

    loadDockerApps(apps: DockerApp[]) {
      const savedPositions = this.loadIconPositions();

      this.dockerApps = apps.map((app) => {
        const savedPos = savedPositions[app.id];
        return {
          ...app,
          x: savedPos?.x,
          y: savedPos?.y,
          gridRow: savedPos?.gridRow,
          gridCol: savedPos?.gridCol,
          page: savedPos?.page,
          folderId: savedPos?.folderId,
        };
      });

      this.syncFolderItems();
    },

    updateDockerApp(appId: string, updates: Partial<DockerApp>) {
      const app = this.dockerApps.find((a) => a.id === appId);
      if (app) {
        Object.assign(app, updates);
      }
    },

    updateDockerAppByName(appName: string, updates: Partial<DockerApp>) {
      const app = this.dockerApps.find((a) => a.name === appName);
      if (app) {
        Object.assign(app, updates);
      }
    },

    addToRecent(appId: string) {
      this.recentApps = this.recentApps.filter((id) => id !== appId);

      this.recentApps.unshift(appId);

      this.recentApps = this.recentApps.slice(0, 10);

      this.saveRecentApps();
    },

    saveRecentApps() {
      try {
        localStorage.setItem("homedock_recent_apps", JSON.stringify(this.recentApps));
      } catch (error) {
        console.error("Error saving recent apps:", error);
      }
    },

    loadRecentApps() {
      try {
        const stored = localStorage.getItem("homedock_recent_apps");
        if (stored) {
          this.recentApps = JSON.parse(stored);
        }
      } catch (error) {
        console.error("Error loading recent apps:", error);
        this.recentApps = [];
      }
    },

    togglePinApp(appId: string) {
      const index = this.pinnedApps.indexOf(appId);

      if (index !== -1) {
        this.pinnedApps.splice(index, 1);
      } else {
        this.pinnedApps.push(appId);
      }

      this.savePinnedApps();
    },

    isAppPinned(appId: string): boolean {
      return this.pinnedApps.includes(appId);
    },

    savePinnedApps() {
      try {
        localStorage.setItem("homedock_pinned_apps", JSON.stringify(this.pinnedApps));
      } catch (error) {
        console.error("Error saving pinned apps:", error);
      }
    },

    loadPinnedApps() {
      try {
        const stored = localStorage.getItem("homedock_pinned_apps");
        if (stored) {
          this.pinnedApps = JSON.parse(stored);
        }
      } catch (error) {
        console.error("Error loading pinned apps:", error);
        this.pinnedApps = [];
      }
    },

    setDesktopLayout(layout: "grid" | "list") {
      this.desktopLayout = layout;
      localStorage.setItem("homedock_desktop_layout", layout);
    },

    setIconSize(size: "small" | "medium" | "large") {
      this.iconSize = size;
      localStorage.setItem("homedock_icon_size", size);
    },

    loadDesktopPreferences() {
      try {
        const layout = localStorage.getItem("homedock_desktop_layout");
        if (layout === "grid" || layout === "list") {
          this.desktopLayout = layout;
        }

        const iconSize = localStorage.getItem("homedock_icon_size");
        if (iconSize === "small" || iconSize === "medium" || iconSize === "large") {
          this.iconSize = iconSize;
        }
      } catch (error) {
        console.error("Error loading desktop preferences:", error);
      }
    },

    initialize() {
      this.loadRecentApps();
      this.loadPinnedApps();
      this.loadDesktopPreferences();
      this.initializeSystemIcons();
    },

    initializeSystemIcons() {
      const savedPositions = this.loadSystemIconPositions();

      const appHomeIcon: SystemDesktopIcon = {
        id: "system-icon-apphome",
        appId: "apphome",
        name: "My Home",
        icon: "mdi:cloud",
        isPermanent: true,
        ...savedPositions["system-icon-apphome"],
      };

      this.systemDesktopIcons = [appHomeIcon];
    },

    updateSystemIconPosition(iconId: string, x: number, y: number, gridRow?: number, gridCol?: number, page?: number) {
      const icon = this.systemDesktopIcons.find((i) => i.id === iconId);
      if (icon) {
        icon.x = x;
        icon.y = y;
        if (gridRow !== undefined) icon.gridRow = gridRow;
        if (gridCol !== undefined) icon.gridCol = gridCol;
        if (page !== undefined) icon.page = page;

        this.saveSystemIconPositions();
      }
    },

    saveSystemIconPositions() {
      try {
        const positions: Record<string, { x?: number; y?: number; gridRow?: number; gridCol?: number; page?: number }> = {};

        this.systemDesktopIcons.forEach((icon) => {
          if (icon.x !== undefined || icon.y !== undefined || icon.gridRow !== undefined || icon.gridCol !== undefined || icon.page !== undefined) {
            positions[icon.id] = {
              x: icon.x,
              y: icon.y,
              gridRow: icon.gridRow,
              gridCol: icon.gridCol,
              page: icon.page,
            };
          }
        });

        localStorage.setItem("homedock_system_icon_positions", JSON.stringify(positions));
      } catch (error) {
        console.error("Error saving system icon positions:", error);
      }
    },

    loadSystemIconPositions(): Record<string, { x?: number; y?: number; gridRow?: number; gridCol?: number; page?: number }> {
      try {
        const stored = localStorage.getItem("homedock_system_icon_positions");
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.error("Error loading system icon positions:", error);
      }
      return {};
    },

    updateIconPosition(appId: string, x: number, y: number, gridRow?: number, gridCol?: number, page?: number) {
      const app = this.dockerApps.find((a) => a.id === appId);
      if (app) {
        app.x = x;
        app.y = y;
        if (gridRow !== undefined) app.gridRow = gridRow;
        if (gridCol !== undefined) app.gridCol = gridCol;
        if (page !== undefined) app.page = page;

        this.saveIconPositions();
      }
    },

    saveIconPositions() {
      try {
        const positions: Record<string, { x?: number; y?: number; gridRow?: number; gridCol?: number; page?: number; folderId?: string | null }> = {};

        this.dockerApps.forEach((app) => {
          if (app.x !== undefined || app.y !== undefined || app.gridRow !== undefined || app.gridCol !== undefined || app.page !== undefined || app.folderId) {
            positions[app.id] = {
              x: app.x,
              y: app.y,
              gridRow: app.gridRow,
              gridCol: app.gridCol,
              page: app.page,
              folderId: app.folderId,
            };
          }
        });

        localStorage.setItem("homedock_icon_positions", JSON.stringify(positions));
      } catch (error) {
        console.error("Error saving icon positions:", error);
      }
    },

    loadIconPositions(): Record<string, { x?: number; y?: number; gridRow?: number; gridCol?: number; page?: number; folderId?: string | null }> {
      try {
        const stored = localStorage.getItem("homedock_icon_positions");
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.error("Error loading icon positions:", error);
      }
      return {};
    },

    resetIconPositions() {
      this.dockerApps.forEach((app) => {
        if (!app.folderId) {
          app.x = undefined;
          app.y = undefined;
          app.gridRow = undefined;
          app.gridCol = undefined;
          app.page = undefined;
        }
      });

      this.desktopFolders.forEach((folder) => {
        folder.x = undefined;
        folder.y = undefined;
        folder.gridRow = undefined;
        folder.gridCol = undefined;
        folder.page = undefined;
      });

      this.systemDesktopIcons.forEach((icon) => {
        icon.x = undefined;
        icon.y = undefined;
        icon.gridRow = undefined;
        icon.gridCol = undefined;
        icon.page = undefined;
      });

      this.saveIconPositions();
      this.saveFolders();
      this.saveSystemIconPositions();
    },

    generateFolderId(): string {
      return `folder-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    },

    sanitizeFolderName(name: string): string {
      if (typeof name !== "string") {
        return "New Folder";
      }

      let sanitized = name.trim();

      sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, "");

      sanitized = sanitized.replace(/\s+/g, " ");

      sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-_()áéíóúÁÉÍÓÚñÑüÜ]/g, "");

      sanitized = sanitized.substring(0, 20);

      if (!sanitized || sanitized.length === 0) {
        sanitized = "New Folder";
      }

      return sanitized;
    },

    createFolder(name: string = "New Folder", x?: number, y?: number, gridRow?: number, gridCol?: number): DesktopFolder {
      const sanitizedName = this.sanitizeFolderName(name);

      const folder: DesktopFolder = {
        id: this.generateFolderId(),
        name: sanitizedName,
        color: "#3b82f6",
        items: [],
        x,
        y,
        gridRow,
        gridCol,
        createdAt: Date.now(),
      };

      this.desktopFolders.push(folder);
      this.saveFolders();

      return folder;
    },

    deleteFolder(folderId: string) {
      const folder = this.desktopFolders.find((f) => f.id === folderId);
      if (!folder) return;

      folder.items.forEach((appId) => {
        this.removeAppFromFolder(appId);
      });

      const windowStore = useWindowStore();
      const folderWindows = windowStore.windows.filter((w) => w.appId === "folder-view" && w.data?.folderId === folderId);
      folderWindows.forEach((w) => windowStore.closeWindow(w.id));

      const index = this.desktopFolders.findIndex((f) => f.id === folderId);
      if (index !== -1) {
        this.desktopFolders.splice(index, 1);
      }

      this.saveFolders();
    },

    renameFolder(folderId: string, newName: string) {
      const folder = this.desktopFolders.find((f) => f.id === folderId);
      if (folder) {
        folder.name = this.sanitizeFolderName(newName);
        this.saveFolders();
      }
    },

    updateFolderColor(folderId: string, color: string) {
      const folder = this.desktopFolders.find((f) => f.id === folderId);
      if (folder) {
        folder.color = color;
        this.saveFolders();
      }
    },

    addAppToFolder(appId: string, folderId: string) {
      const app = this.dockerApps.find((a) => a.id === appId);
      const folder = this.desktopFolders.find((f) => f.id === folderId);

      if (!app || !folder) return;

      if (app.folderId) {
        this.removeAppFromFolder(appId);
      }

      app.folderId = folderId;
      if (!folder.items.includes(appId)) {
        folder.items.push(appId);
      }

      this.saveFolders();
      this.saveIconPositions();
    },

    removeAppFromFolder(appId: string) {
      const app = this.dockerApps.find((a) => a.id === appId);
      if (!app || !app.folderId) return;

      const folder = this.desktopFolders.find((f) => f.id === app.folderId);
      if (folder) {
        folder.items = folder.items.filter((id) => id !== appId);
      }

      app.folderId = null;

      app.x = undefined;
      app.y = undefined;
      app.gridRow = undefined;
      app.gridCol = undefined;

      this.saveFolders();
      this.saveIconPositions();
    },

    updateFolderPosition(folderId: string, x: number, y: number, gridRow?: number, gridCol?: number, page?: number) {
      const folder = this.desktopFolders.find((f) => f.id === folderId);
      if (folder) {
        folder.x = x;
        folder.y = y;
        if (gridRow !== undefined) folder.gridRow = gridRow;
        if (gridCol !== undefined) folder.gridCol = gridCol;
        if (page !== undefined) folder.page = page;

        this.saveFolders();
      }
    },

    saveFolders() {
      try {
        localStorage.setItem("homedock_desktop_folders", JSON.stringify(this.desktopFolders));
      } catch (error) {
        console.error("Error saving folders:", error);
      }
    },

    loadFolders() {
      try {
        const stored = localStorage.getItem("homedock_desktop_folders");
        if (stored) {
          const folders = JSON.parse(stored);

          this.desktopFolders = folders.map((folder: DesktopFolder) => ({
            ...folder,
            name: this.sanitizeFolderName(folder.name || "New Folder"),
          }));
        }
      } catch (error) {
        console.error("Error loading folders:", error);
        this.desktopFolders = [];
      }
    },

    syncFolderItems() {
      this.desktopFolders.forEach((folder) => {
        folder.items = [];
      });

      this.dockerApps.forEach((app) => {
        if (app.folderId) {
          const folder = this.desktopFolders.find((f) => f.id === app.folderId);
          if (folder && !folder.items.includes(app.id)) {
            folder.items.push(app.id);
          }
        }
      });

      this.saveFolders();
    },

    openFolder(folderId: string) {
      const folder = this.desktopFolders.find((f) => f.id === folderId);
      if (!folder) return;

      const windowStore = useWindowStore();
      windowStore.openWindow("folder-view", {
        title: folder.name,
        data: { folderId: folder.id },
        allowMultiple: true,
      });
    },

    setDraggedApps(appIds: string[]) {
      this.draggedAppIds = appIds;
    },

    clearDraggedApps() {
      this.draggedAppIds = [];
    },

    reset() {
      this.startMenuOpen = false;
      this.dockerApps = [];
      this.desktopFolders = [];
      this.recentApps = [];
      this.pinnedApps = [];
      this.desktopLayout = "grid";
      this.iconSize = "medium";
      this.draggedAppIds = [];

      localStorage.removeItem("homedock_recent_apps");
      localStorage.removeItem("homedock_pinned_apps");
      localStorage.removeItem("homedock_desktop_layout");
      localStorage.removeItem("homedock_icon_size");
      localStorage.removeItem("homedock_icon_positions");
      localStorage.removeItem("homedock_desktop_folders");
    },
  },
});
