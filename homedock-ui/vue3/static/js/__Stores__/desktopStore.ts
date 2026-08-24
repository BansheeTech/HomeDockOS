// homedock-ui/vue3/static/js/__Stores__/desktopStore.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import axios from "axios";

import { defineStore } from "pinia";
import { useWindowStore } from "./windowStore";
import { appExists } from "../__Config__/WindowDefaultDetails";
import { appWindowsAvailable, isLocalNetworkHost, buildDirectPortUrl } from "../__Composables__/useAppSubdomain";

import type { FileExplorerLocation } from "./useFileExplorerStore";

export interface DockerApp {
  id: string;
  name: string;
  slug?: string;
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

export const SHORTCUT_LOCATIONS = ["storage", "dropzone", "appdrive", "disksplus"] as const satisfies readonly FileExplorerLocation[];

export type ShortcutLocation = (typeof SHORTCUT_LOCATIONS)[number];

export function isShortcutLocation(value: string): value is ShortcutLocation {
  return (SHORTCUT_LOCATIONS as readonly string[]).includes(value);
}

export interface ShortcutTarget {
  location: ShortcutLocation;
  path: string;
  fileName: string;
  isDirectory: boolean;
  container?: string;
  mountIndex?: number;
  diskId?: string;
}

export interface ShortcutData {
  shortcutId: string;
  type: "url" | "file";
  url: string;
  iconType: "preset" | "image" | "file";
  iconValue: string;
  target?: ShortcutTarget;
}

export interface ShortcutPayload {
  name: string;
  url: string;
  icon_type: "preset" | "image";
  icon_value: string;
}

export interface FileShortcutPayload {
  name: string;
  type: "file";
  target: {
    location: ShortcutLocation;
    path: string;
    file_name: string;
    is_directory: boolean;
    container?: string;
    mount_index?: number;
    disk_id?: string;
  };
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
  moduleName?: string;
  shortcut?: ShortcutData;
  folderId?: string | null;
}

export type DesktopItemType = "app" | "folder" | "systemicon";

export function shortcutTargetData(target: ShortcutTarget, shortcutId?: string): Record<string, unknown> {
  const relativePath = target.path ? `${target.path}/${target.fileName}` : target.fileName;

  return {
    initialShortcutId: shortcutId,
    initialLocation: target.location,
    initialPath: target.isDirectory ? relativePath : target.path,
    initialFileName: target.isDirectory ? undefined : relativePath,
    initialContainer: target.container,
    initialMountIndex: target.mountIndex,
    initialDiskId: target.diskId,
  };
}

export const useDesktopStore = defineStore("desktop", {
  state: () => ({
    startMenuOpen: false,
    dockerApps: [] as DockerApp[],
    desktopFolders: [] as DesktopFolder[],
    systemDesktopIcons: [] as SystemDesktopIcon[],
    recentApps: [] as string[],
    pinnedApps: [] as string[],
    appViewModes: {} as Record<string, "window" | "tab" | "port">,
    appViewSchemes: {} as Record<string, "http" | "https">,
    subdomainCertificate: { ssl: false, selfSigned: false, coversApps: false },
    desktopLayout: "grid" as "grid" | "list",
    iconSize: "medium" as "small" | "medium" | "large",
    draggedAppIds: [] as string[],
    dragSourceFolderId: null as string | null,
  }),

  getters: {
    // HDOS00116
    certificateBlocksAppWindows: (state) => state.subdomainCertificate.ssl && (state.subdomainCertificate.selfSigned || !state.subdomainCertificate.coversApps),

    runningDockerApps: (state) => state.dockerApps.filter((app) => app.status === "running"),

    stoppedDockerApps: (state) => state.dockerApps.filter((app) => app.status === "exited"),

    mainDockerApps: (state) => state.dockerApps.filter((app) => app.HDRole !== "dependency"),

    desktopRootApps: (state) => state.dockerApps.filter((app) => app.HDRole !== "dependency" && !app.folderId),

    getAppsInFolder: (state) => (folderId: string) => {
      return state.dockerApps.filter((app) => app.folderId === folderId && app.HDRole !== "dependency");
    },

    desktopRootSystemIcons: (state) => state.systemDesktopIcons.filter((icon) => !icon.folderId),

    getShortcutsInFolder: (state) => (folderId: string) => {
      return state.systemDesktopIcons.filter((icon) => icon.shortcut && icon.folderId === folderId);
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

      if (appId.startsWith("shortcut-")) {
        const shortcut = this.systemDesktopIcons.find((icon) => icon.appId === appId)?.shortcut;

        if (shortcut?.type === "file" && shortcut.target) {
          windowStore.openFileInApp("fileexplorer", { data: shortcutTargetData(shortcut.target, shortcut.shortcutId) });
        } else if (shortcut) {
          window.open(shortcut.url, "_blank", "noopener,noreferrer");
        }

        this.closeStartMenu();
        return;
      }

      if (appId.startsWith("enterprise-")) {
        const systemIcon = this.systemDesktopIcons.find((icon) => icon.appId === appId);
        if (systemIcon?.moduleName) {
          windowStore.openWindow("enterprise-window", {
            title: systemIcon.name,
            data: { module: systemIcon.moduleName, icon: systemIcon.icon },
          });
          this.closeStartMenu();
          this.addToRecent(appId);
          return;
        }
      }

      windowStore.openWindow(appId);
      this.closeStartMenu();
      this.addToRecent(appId);
    },

    async loadAppViewModes(csrfToken: string) {
      try {
        const { data } = await axios.get<{ modes: Record<string, "window" | "tab" | "port">; schemes: Record<string, "http" | "https"> }>("/api/app-view-mode", {
          headers: { "X-HomeDock-CSRF-Token": csrfToken },
        });

        this.appViewModes = data?.modes ?? {};
        this.appViewSchemes = data?.schemes ?? {};
      } catch {
        // Halp!
      }
    },

    async loadCertificateTrust() {
      try {
        const { data } = await axios.get<{ ssl: boolean; self_signed: boolean; covers_apps: boolean }>("/api/subdomain-diagnostics");

        this.subdomainCertificate = { ssl: Boolean(data?.ssl), selfSigned: Boolean(data?.self_signed), coversApps: Boolean(data?.covers_apps) };
      } catch {
        this.subdomainCertificate = { ssl: false, selfSigned: false, coversApps: false };
      }
    },

    launchDockerApp(app: DockerApp) {
      if (!app.service_url) return;

      const mode = this.appViewModes[app.name] ?? "window";

      // HDOS00115
      if (mode === "port" && isLocalNetworkHost()) {
        const port = app.ports?.find((value) => value && value !== "disabled" && value !== "hostmode");

        if (port) {
          // HDOS00118
          const scheme = this.appViewSchemes[app.name] ?? "http";

          window.open(buildDirectPortUrl(port, scheme), "_blank", "noopener,noreferrer");
          return;
        }
      }

      if (mode === "tab" || !appWindowsAvailable(this.certificateBlocksAppWindows)) {
        window.open(app.service_url, "_blank", "noopener,noreferrer");
        return;
      }

      this.openDockerWindow(app);
    },

    // HDOS00119
    openDockerWindow(app: DockerApp) {
      const windowStore = useWindowStore();

      windowStore.openUniqueWindow("docker-view", app.name, {
        title: app.display_name || app.name,
        icon: app.image_path,
        data: { appName: app.name },
      });
    },

    openDockerApp(app: DockerApp) {
      if (app.service_url && app.status === "running") {
        this.launchDockerApp(app);
      } else {
        const windowStore = useWindowStore();
        windowStore.openUniqueWindow("properties", app.id, {
          title: `${app.display_name || app.name} - Properties`,
          data: { appId: app.id },
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
      const additionalIcons = this.loadSystemIconsList();
      const removedDefaultIcons = this.loadRemovedDefaultIcons();

      const existingShortcuts = this.systemDesktopIcons.filter((icon) => icon.shortcut);

      const defaultIcons: SystemDesktopIcon[] = [];

      if (!removedDefaultIcons.includes("apphome")) {
        defaultIcons.push({
          id: "system-icon-apphome",
          appId: "apphome",
          name: "My Home",
          icon: "homedock:logo",
          isPermanent: false,
          ...savedPositions["system-icon-apphome"],
        });
      }

      if (!removedDefaultIcons.includes("fileexplorer")) {
        defaultIcons.push({
          id: "system-icon-fileexplorer",
          appId: "fileexplorer",
          name: "File Explorer",
          icon: "mdi:folder-multiple",
          isPermanent: false,
          ...savedPositions["system-icon-fileexplorer"],
        });
      }

      this.systemDesktopIcons = defaultIcons;

      let needsCleanup = false;
      additionalIcons.forEach((iconData) => {
        if (iconData.appId !== "apphome" && iconData.appId !== "fileexplorer") {
          const isEnterpriseModule = iconData.appId.startsWith("enterprise-");

          if (isEnterpriseModule) {
            return;
          }

          if (!appExists(iconData.appId)) {
            needsCleanup = true;
            return;
          }

          const icon: SystemDesktopIcon = {
            id: `system-icon-${iconData.appId}`,
            appId: iconData.appId,
            name: iconData.name,
            icon: iconData.icon,
            isPermanent: false,
            ...(iconData.moduleName && { moduleName: iconData.moduleName }),
            ...savedPositions[`system-icon-${iconData.appId}`],
          };
          this.systemDesktopIcons.push(icon);
        }
      });

      if (needsCleanup) {
        this.saveSystemIconsList();
      }

      this.systemDesktopIcons.push(...existingShortcuts);
    },

    buildShortcutIcon(shortcut: any, savedPositions: Record<string, { x?: number; y?: number; gridRow?: number; gridCol?: number; page?: number }>): SystemDesktopIcon {
      const isFile = shortcut.type === "file" && shortcut.target;

      const data: ShortcutData = isFile
        ? {
            shortcutId: shortcut.id,
            type: "file",
            url: "",
            iconType: "file",
            iconValue: shortcut.target.file_name || "",
            target: {
              location: shortcut.target.location,
              path: shortcut.target.path || "",
              fileName: shortcut.target.file_name || "",
              isDirectory: !!shortcut.target.is_directory,
              container: shortcut.target.container,
              mountIndex: shortcut.target.mount_index,
              diskId: shortcut.target.disk_id,
            },
          }
        : {
            shortcutId: shortcut.id,
            type: "url",
            url: shortcut.url,
            iconType: shortcut.icon_type,
            iconValue: shortcut.icon_value,
          };

      return {
        id: `shortcut-${shortcut.id}`,
        appId: `shortcut-${shortcut.id}`,
        name: shortcut.name,
        icon: "shortcut",
        isPermanent: false,
        shortcut: data,
        ...savedPositions[`shortcut-${shortcut.id}`],
      };
    },

    async loadShortcuts(csrfToken: string) {
      try {
        const response = await axios.get("/api/shortcuts", {
          headers: { "X-HomeDock-CSRF-Token": csrfToken },
        });

        const savedPositions = this.loadSystemIconPositions();

        this.systemDesktopIcons = this.systemDesktopIcons.filter((icon) => !icon.shortcut);
        (response.data.shortcuts || []).forEach((shortcut: any) => {
          this.systemDesktopIcons.push(this.buildShortcutIcon(shortcut, savedPositions));
        });

        this.syncFolderItems();
      } catch (error) {
        console.error("Error loading shortcuts:", error);
      }
    },

    async addShortcut(payload: ShortcutPayload | FileShortcutPayload, csrfToken: string): Promise<boolean> {
      try {
        const response = await axios.post("/api/shortcuts/add", payload, {
          headers: { "X-HomeDock-CSRF-Token": csrfToken },
        });

        if (response.data.shortcut) {
          this.systemDesktopIcons.push(this.buildShortcutIcon(response.data.shortcut, {}));
        }
        return true;
      } catch (error) {
        console.error("Error adding shortcut:", error);
        return false;
      }
    },

    async updateShortcut(shortcutId: string, payload: ShortcutPayload, csrfToken: string): Promise<boolean> {
      try {
        const response = await axios.post(
          "/api/shortcuts/update",
          { id: shortcutId, ...payload },
          {
            headers: { "X-HomeDock-CSRF-Token": csrfToken },
          },
        );

        const icon = this.systemDesktopIcons.find((i) => i.shortcut?.shortcutId === shortcutId);
        if (icon && response.data.shortcut) {
          const rebuilt = this.buildShortcutIcon(response.data.shortcut, {});
          icon.name = rebuilt.name;
          icon.shortcut = rebuilt.shortcut;
        }
        return true;
      } catch (error) {
        console.error("Error updating shortcut:", error);
        return false;
      }
    },

    async removeShortcut(shortcutId: string, csrfToken: string): Promise<boolean> {
      try {
        await axios.post(
          "/api/shortcuts/remove",
          { id: shortcutId },
          {
            headers: { "X-HomeDock-CSRF-Token": csrfToken },
          },
        );

        const index = this.systemDesktopIcons.findIndex((i) => i.shortcut?.shortcutId === shortcutId);
        if (index !== -1) {
          this.removeShortcutFromFolder(this.systemDesktopIcons[index].id);
          this.systemDesktopIcons.splice(index, 1);
        }
        this.saveSystemIconPositions();
        return true;
      } catch (error) {
        console.error("Error removing shortcut:", error);
        return false;
      }
    },

    saveSystemIconPositions() {
      try {
        const positions: Record<string, { x?: number; y?: number; gridRow?: number; gridCol?: number; page?: number; folderId?: string | null }> = {};

        this.systemDesktopIcons.forEach((icon) => {
          if (icon.x !== undefined || icon.y !== undefined || icon.gridRow !== undefined || icon.gridCol !== undefined || icon.page !== undefined || icon.folderId) {
            positions[icon.id] = {
              x: icon.x,
              y: icon.y,
              gridRow: icon.gridRow,
              gridCol: icon.gridCol,
              page: icon.page,
              folderId: icon.folderId,
            };
          }
        });

        localStorage.setItem("homedock_system_icon_positions", JSON.stringify(positions));
      } catch (error) {
        console.error("Error saving system icon positions:", error);
      }
    },

    loadSystemIconPositions(): Record<string, { x?: number; y?: number; gridRow?: number; gridCol?: number; page?: number; folderId?: string | null }> {
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

    saveSystemIconsList() {
      try {
        const icons = this.systemDesktopIcons
          .filter((icon) => !icon.isPermanent && !icon.shortcut)
          .map((icon) => ({
            appId: icon.appId,
            name: icon.name,
            icon: icon.icon,
            ...(icon.moduleName && { moduleName: icon.moduleName }),
          }));
        localStorage.setItem("homedock_system_icons_list", JSON.stringify(icons));
      } catch (error) {
        console.error("Error saving system icons list:", error);
      }
    },

    loadSystemIconsList(): Array<{ appId: string; name: string; icon: any; moduleName?: string }> {
      try {
        const stored = localStorage.getItem("homedock_system_icons_list");
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.error("Error loading system icons list:", error);
      }
      return [];
    },

    saveRemovedDefaultIcons(removedIds: string[]) {
      try {
        localStorage.setItem("homedock_removed_default_icons", JSON.stringify(removedIds));
      } catch (error) {
        console.error("Error saving removed default icons:", error);
      }
    },

    loadRemovedDefaultIcons(): string[] {
      try {
        const stored = localStorage.getItem("homedock_removed_default_icons");
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.error("Error loading removed default icons:", error);
      }
      return [];
    },

    isSystemIconOnDesktop(appId: string): boolean {
      return this.systemDesktopIcons.some((icon) => icon.appId === appId);
    },

    addSystemIconToDesktop(appId: string, name: string, icon: any, moduleName?: string): boolean {
      if (this.isSystemIconOnDesktop(appId)) {
        return false;
      }

      const defaultIconIds = ["apphome", "fileexplorer"];
      if (defaultIconIds.includes(appId)) {
        const removedDefaults = this.loadRemovedDefaultIcons();
        const index = removedDefaults.indexOf(appId);
        if (index !== -1) {
          removedDefaults.splice(index, 1);
          this.saveRemovedDefaultIcons(removedDefaults);
        }
      }

      const newIcon: SystemDesktopIcon = {
        id: `system-icon-${appId}`,
        appId,
        name,
        icon,
        isPermanent: false,
        ...(moduleName && { moduleName }),
      };

      this.systemDesktopIcons.push(newIcon);
      this.saveSystemIconsList();
      return true;
    },

    removeSystemIconFromDesktop(appId: string): boolean {
      const index = this.systemDesktopIcons.findIndex((icon) => icon.appId === appId && !icon.isPermanent);
      if (index === -1) {
        return false;
      }

      this.systemDesktopIcons.splice(index, 1);

      const defaultIconIds = ["apphome", "fileexplorer"];
      if (defaultIconIds.includes(appId)) {
        const removedDefaults = this.loadRemovedDefaultIcons();
        if (!removedDefaults.includes(appId)) {
          removedDefaults.push(appId);
          this.saveRemovedDefaultIcons(removedDefaults);
        }
      }

      this.saveSystemIconsList();
      this.saveSystemIconPositions();
      return true;
    },

    updateItemPosition(type: DesktopItemType, id: string, x: number, y: number, gridRow?: number, gridCol?: number, page?: number) {
      let item: { x?: number; y?: number; gridRow?: number; gridCol?: number; page?: number } | undefined;
      let saveFunc: (() => void) | undefined;

      switch (type) {
        case "app":
          item = this.dockerApps.find((a) => a.id === id);
          saveFunc = () => this.saveIconPositions();
          break;
        case "folder":
          item = this.desktopFolders.find((f) => f.id === id);
          saveFunc = () => this.saveFolders();
          break;
        case "systemicon":
          item = this.systemDesktopIcons.find((i) => i.id === id);
          saveFunc = () => this.saveSystemIconPositions();
          break;
      }

      if (item) {
        item.x = x;
        item.y = y;
        if (gridRow !== undefined) item.gridRow = gridRow;
        if (gridCol !== undefined) item.gridCol = gridCol;
        if (page !== undefined) item.page = page;
        saveFunc?.();
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

      sanitized = sanitized.replace(/[^\p{L}\p{N}\p{M}\s\-_()]/gu, "");

      sanitized = sanitized.substring(0, 32);

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

      folder.items.forEach((itemId) => {
        if (itemId.startsWith("shortcut-")) {
          this.removeShortcutFromFolder(itemId);
        } else {
          this.removeAppFromFolder(itemId);
        }
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

    updateFolderIcon(folderId: string, icon: string) {
      const folder = this.desktopFolders.find((f) => f.id === folderId);
      if (folder) {
        folder.icon = icon || undefined;
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

    addShortcutToFolder(iconId: string, folderId: string) {
      const icon = this.systemDesktopIcons.find((i) => i.id === iconId && i.shortcut);
      const folder = this.desktopFolders.find((f) => f.id === folderId);

      if (!icon || !folder) return;

      if (icon.folderId) {
        this.removeShortcutFromFolder(iconId);
      }

      icon.folderId = folderId;
      if (!folder.items.includes(iconId)) {
        folder.items.push(iconId);
      }

      icon.x = undefined;
      icon.y = undefined;
      icon.gridRow = undefined;
      icon.gridCol = undefined;

      this.saveFolders();
      this.saveSystemIconPositions();
    },

    removeShortcutFromFolder(iconId: string) {
      const icon = this.systemDesktopIcons.find((i) => i.id === iconId);
      if (!icon || !icon.folderId) return;

      const folder = this.desktopFolders.find((f) => f.id === icon.folderId);
      if (folder) {
        folder.items = folder.items.filter((id) => id !== iconId);
      }

      icon.folderId = null;

      icon.x = undefined;
      icon.y = undefined;
      icon.gridRow = undefined;
      icon.gridCol = undefined;

      this.saveFolders();
      this.saveSystemIconPositions();
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

      this.systemDesktopIcons.forEach((icon) => {
        if (icon.shortcut && icon.folderId) {
          const folder = this.desktopFolders.find((f) => f.id === icon.folderId);
          if (folder && !folder.items.includes(icon.id)) {
            folder.items.push(icon.id);
          }
        }
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
      windowStore.openUniqueWindow("folder-view", folder.id, {
        title: folder.name,
        data: { folderId: folder.id },
      });
    },

    setDraggedApps(appIds: string[], sourceFolderId: string | null = null) {
      this.draggedAppIds = appIds;
      this.dragSourceFolderId = sourceFolderId;
    },

    clearDraggedApps() {
      this.draggedAppIds = [];
      this.dragSourceFolderId = null;
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
      this.dragSourceFolderId = null;

      localStorage.removeItem("homedock_recent_apps");
      localStorage.removeItem("homedock_pinned_apps");
      localStorage.removeItem("homedock_desktop_layout");
      localStorage.removeItem("homedock_icon_size");
      localStorage.removeItem("homedock_icon_positions");
      localStorage.removeItem("homedock_desktop_folders");
    },
  },
});
