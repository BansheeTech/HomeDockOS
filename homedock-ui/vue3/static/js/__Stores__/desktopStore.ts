// homedock-ui/vue3/static/js/__Stores__/desktopStore.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import axios from "axios";

import { defineStore } from "pinia";
import { useWindowStore } from "./windowStore";
import { useAppUpdateMarksStore } from "./useAppUpdateMarksStore";
import { useDesktopSyncStore, appLayoutKey, MAX_RECENT_APPS, type DesktopContent, type DesktopMode, type LayoutItems, type SystemIconMeta } from "./useDesktopSyncStore";
import { appExists, getAppById } from "../__Config__/WindowDefaultDetails";
import { appWindowsAvailable, isLocalNetworkHost, buildDirectPortUrl } from "../__Composables__/useAppSubdomain";
import { DESKTOP_GRID } from "../__Composables__/desktopLayoutFit";

import type { FileExplorerLocation } from "./useFileExplorerStore";

const DEFAULT_ICON_IDS = ["apphome", "fileexplorer"];
const LEGACY_KEYS = ["homedock_icon_positions", "homedock_desktop_folders", "homedock_system_icon_positions", "homedock_system_icons_list", "homedock_removed_default_icons"];

type LegacyPosition = { x?: number; y?: number; gridRow?: number; gridCol?: number; page?: number; folderId?: string | null };

let enterpriseResolver: ((meta: SystemIconMeta) => boolean) | null = null;
let legacyAppPositions: Record<string, LegacyPosition> | null = null;
let syncWired = false;

function readLegacy<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function legacyCell(mode: DesktopMode, position: LegacyPosition | undefined): number[] | null {
  if (!position || position.gridRow === undefined || position.gridCol === undefined) return null;
  return mode === "desktop" ? [position.gridRow, position.gridCol] : [position.page ?? 0, position.gridRow, position.gridCol];
}

function layoutCell(mode: DesktopMode, item: { x?: number; y?: number; gridRow?: number; gridCol?: number; page?: number }): number[] | null {
  if (mode === "desktop") {
    if (item.x === undefined || item.y === undefined) return null;
    return [Math.max(0, Math.round((item.y - DESKTOP_GRID.padding) / DESKTOP_GRID.sizeY)), Math.max(0, Math.round((item.x - DESKTOP_GRID.padding) / DESKTOP_GRID.sizeX))];
  }

  if (item.gridRow === undefined || item.gridCol === undefined) return null;
  return [item.page ?? 0, item.gridRow, item.gridCol];
}

function positionOf(item: { x?: number; y?: number; gridRow?: number; gridCol?: number; page?: number } | undefined) {
  return { x: item?.x, y: item?.y, gridRow: item?.gridRow, gridCol: item?.gridCol, page: item?.page };
}

export interface DockerApp {
  id: string;
  name: string;
  slug?: string;
  display_name?: string;
  image: string;
  image_path: string;
  status: "running" | "exited" | "paused" | "created" | "restarting" | "removing" | "dead";
  statusColor: string;
  service_url: string | null;
  host: string;
  ports: string[];
  usagePercent: number;
  memoryUsagePercent: number;
  memoryUsageBytes?: number;
  memoryLimitBytes?: number;
  networkRxBytes: number;
  networkTxBytes: number;
  startedAt?: string;
  HDGroup: string;
  HDRole?: string;
  checked: boolean;
  isProcessing: boolean;
  has_update?: boolean;
  recently_updated?: boolean;

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

export function isFolderableIcon(icon: Pick<SystemDesktopIcon, "appId" | "shortcut">): boolean {
  if (icon.shortcut) return true;

  const category = getAppById(icon.appId)?.category;
  return category === "utilities" || category === "games";
}

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
    arrivingIconId: null as string | null,
    dockerApps: [] as DockerApp[],
    desktopFolders: [] as DesktopFolder[],
    systemDesktopIcons: [] as SystemDesktopIcon[],
    appViewModes: {} as Record<string, "window" | "tab" | "port">,
    appViewSchemes: {} as Record<string, "http" | "https">,
    subdomainCertificate: { ssl: false, selfSigned: false, coversApps: false },
    desktopLayout: "grid" as "grid" | "list",
    iconSize: "medium" as "small" | "medium" | "large",
    draggedAppIds: [] as string[],
    dragSourceFolderId: null as string | null,
    shortcutsLoaded: false,
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

    getSystemIconsInFolder: (state) => (folderId: string) => {
      return state.systemDesktopIcons.filter((icon) => icon.folderId === folderId);
    },

    getFolderById: (state) => (folderId: string) => {
      return state.desktopFolders.find((folder) => folder.id === folderId);
    },

    dependencyDockerApps: (state) => state.dockerApps.filter((app) => app.HDRole === "dependency"),

    stoppedDependenciesByGroup: (state) => {
      const groups: Record<string, string[]> = {};

      for (const app of state.dockerApps) {
        if (app.HDRole !== "dependency" || !app.HDGroup || app.status === "running") continue;
        if (!groups[app.HDGroup]) groups[app.HDGroup] = [];
        groups[app.HDGroup].push(app.name);
      }

      return groups;
    },

    pinnedApps: () => useDesktopSyncStore().content.pinned,

    recentApps: () => useDesktopSyncStore().content.recents,

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

    async loadCertificateTrust(csrfToken: string) {
      try {
        const { data } = await axios.get<{ ssl: boolean; self_signed: boolean; covers_apps: boolean }>("/api/subdomain-diagnostics", {
          headers: { "X-HomeDock-CSRF-Token": csrfToken },
        });

        this.subdomainCertificate = { ssl: Boolean(data?.ssl), selfSigned: Boolean(data?.self_signed), coversApps: Boolean(data?.covers_apps) };
      } catch {
        this.subdomainCertificate = { ssl: false, selfSigned: false, coversApps: false };
      }
    },

    launchDockerApp(app: DockerApp) {
      if (!app.service_url) return;

      this.markUpdateSeen(app);

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

      this.addToRecent(appLayoutKey(app.name));
    },

    loadDockerApps(apps: DockerApp[]) {
      const sync = useDesktopSyncStore();
      const marks = useAppUpdateMarksStore();
      const previous = new Map(this.dockerApps.map((app) => [app.name, app]));

      this.resolveLegacyApps(apps);

      this.dockerApps = apps.map((app) => ({
        ...app,
        recently_updated: marks.isUnseen(app),
        ...positionOf(previous.get(app.name)),
        folderId: sync.content.membership[appLayoutKey(app.name)] ?? null,
      }));

      this.syncFolderItems();
    },

    resolveLegacyApps(apps: DockerApp[]) {
      if (!legacyAppPositions || apps.length === 0) return;

      const sync = useDesktopSyncStore();
      const legacy = legacyAppPositions;
      const folderIds = new Set(sync.content.folders.map((folder) => folder.id));
      const seed: LayoutItems = {};

      legacyAppPositions = null;

      sync.updateContent((draft) => {
        apps.forEach((app) => {
          const position = legacy[app.id];
          if (!position) return;

          const key = appLayoutKey(app.name);
          if (position.folderId && folderIds.has(position.folderId)) {
            draft.membership[key] = position.folderId;
            return;
          }

          const cell = legacyCell(sync.mode, position);
          if (cell) seed[key] = cell;
        });
      });

      sync.addSeedItems(sync.mode, seed);
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

    markUpdateSeen(app: DockerApp) {
      const current = this.dockerApps.find((a) => a.name === app.name) ?? app;

      if (useAppUpdateMarksStore().markSeen(current)) {
        this.updateDockerAppByName(app.name, { recently_updated: false });
      }
    },

    addToRecent(appId: string) {
      const sync = useDesktopSyncStore();
      if (!sync.loaded) return;

      const at = Math.floor(Date.now() / 1000);

      sync.updateContent((draft) => {
        draft.recents = [{ id: appId, at }, ...draft.recents.filter((entry) => entry.id !== appId)].slice(0, MAX_RECENT_APPS);
      });
    },

    removeFromRecent(appId: string) {
      useDesktopSyncStore().updateContent((draft) => {
        draft.recents = draft.recents.filter((entry) => entry.id !== appId);
      });
    },

    togglePinApp(appId: string) {
      useDesktopSyncStore().updateContent((draft) => {
        draft.pinned = draft.pinned.includes(appId) ? draft.pinned.filter((id) => id !== appId) : [...draft.pinned, appId];
      });
    },

    movePinnedApp(appId: string, targetId: string) {
      useDesktopSyncStore().updateContent((draft) => {
        const from = draft.pinned.indexOf(appId);
        const to = draft.pinned.indexOf(targetId);
        if (from === -1 || to === -1 || from === to) return;

        const pinned = [...draft.pinned];
        pinned.splice(from, 1);
        pinned.splice(to, 0, appId);
        draft.pinned = pinned;
      });
    },

    isAppPinned(appId: string): boolean {
      return this.pinnedApps.includes(appId);
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
      ["homedock_recent_apps", "homedock_pinned_apps"].forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch {
          // Halp!
        }
      });
      this.loadDesktopPreferences();
      this.initializeSystemIcons();
    },

    initializeSystemIcons() {
      const sync = useDesktopSyncStore();
      const { systemIcons, removedDefaults } = sync.content;
      const previous = new Map(this.systemDesktopIcons.map((icon) => [icon.id, icon]));
      const existingShortcuts = this.systemDesktopIcons.filter((icon) => icon.shortcut);

      const defaults: SystemIconMeta[] = [
        { appId: "apphome", name: "My Home", icon: "homedock:logo" },
        { appId: "fileexplorer", name: "File Explorer", icon: "mdi:folder-multiple" },
      ];

      const visible = [
        ...defaults.filter((meta) => !removedDefaults.includes(meta.appId)),
        ...systemIcons.filter((meta) => {
          if (DEFAULT_ICON_IDS.includes(meta.appId)) return false;
          if (meta.appId.startsWith("enterprise-")) return enterpriseResolver !== null && enterpriseResolver(meta);
          return appExists(meta.appId);
        }),
      ];

      this.systemDesktopIcons = visible.map((meta) => {
        const id = `system-icon-${meta.appId}`;

        return {
          id,
          appId: meta.appId,
          name: meta.name,
          icon: meta.icon,
          isPermanent: false,
          folderId: isFolderableIcon(meta) ? (sync.content.membership[id] ?? null) : null,
          ...(meta.moduleName && { moduleName: meta.moduleName }),
          ...positionOf(previous.get(id)),
        };
      });

      this.systemDesktopIcons.push(...existingShortcuts);
    },

    setEnterpriseResolver(resolver: (meta: SystemIconMeta) => boolean) {
      enterpriseResolver = resolver;
      this.initializeSystemIcons();
    },

    wireDesktopSync() {
      if (syncWired) return;
      syncWired = true;

      const sync = useDesktopSyncStore();

      sync.onContentApplied((content) => this.applyContent(content));

      sync.registerLayoutProvider({
        items: (mode) => this.layoutItems(mode),
        owns: (key) => {
          if (key in sync.content.membership || key.startsWith("folder-")) return true;
          if (key.startsWith("shortcut-")) return this.shortcutsLoaded;
          if (!key.startsWith("system-icon-")) return false;

          const appId = key.slice("system-icon-".length);
          if (DEFAULT_ICON_IDS.includes(appId)) return sync.content.removedDefaults.includes(appId);
          return !sync.content.systemIcons.some((meta) => meta.appId === appId);
        },
      });
    },

    async loadDesktopState() {
      const sync = useDesktopSyncStore();

      this.wireDesktopSync();
      await sync.load();

      if (!sync.initialized) {
        this.importLegacyLocalState();
      }

      sync.notifyContent();
    },

    importLegacyLocalState() {
      const sync = useDesktopSyncStore();
      const mode = sync.mode;

      const folders = readLegacy<DesktopFolder[]>("homedock_desktop_folders", []);
      const iconsList = readLegacy<SystemIconMeta[]>("homedock_system_icons_list", []);
      const removed = readLegacy<string[]>("homedock_removed_default_icons", []);
      const iconPositions = readLegacy<Record<string, LegacyPosition>>("homedock_system_icon_positions", {});
      const appPositions = readLegacy<Record<string, LegacyPosition>>("homedock_icon_positions", {});

      const validFolders = Array.isArray(folders) ? folders.filter((folder) => folder && typeof folder.id === "string") : [];
      const folderIds = new Set(validFolders.map((folder) => folder.id));
      const seed: LayoutItems = {};

      sync.updateContent((draft) => {
        validFolders.forEach((folder) => {
          if (draft.folders.some((existing) => existing.id === folder.id)) return;
          draft.folders.push({ id: folder.id, name: this.sanitizeFolderName(folder.name || "New Folder"), color: folder.color, icon: folder.icon, createdAt: folder.createdAt ?? Date.now() });

          const cell = legacyCell(mode, folder);
          if (cell) seed[folder.id] = cell;
        });

        (Array.isArray(iconsList) ? iconsList : []).forEach((meta) => {
          if (!meta?.appId || DEFAULT_ICON_IDS.includes(meta.appId) || draft.systemIcons.some((existing) => existing.appId === meta.appId)) return;
          draft.systemIcons.push({ appId: meta.appId, name: meta.name, icon: meta.icon, ...(meta.moduleName && { moduleName: meta.moduleName }) });
        });

        draft.removedDefaults = DEFAULT_ICON_IDS.filter((id) => Array.isArray(removed) && removed.includes(id));

        Object.entries(iconPositions || {}).forEach(([id, position]) => {
          if (id.startsWith("shortcut-") && position?.folderId && folderIds.has(position.folderId)) {
            draft.membership[id] = position.folderId;
            return;
          }

          const cell = legacyCell(mode, position);
          if (cell) seed[id] = cell;
        });
      });

      legacyAppPositions = appPositions && typeof appPositions === "object" ? appPositions : null;
      sync.addSeedItems(mode, seed);
      this.resolveLegacyApps(this.dockerApps);

      LEGACY_KEYS.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch {
          // Halp!
        }
      });
    },

    applyContent(content: DesktopContent) {
      const previousFolders = new Map(this.desktopFolders.map((folder) => [folder.id, folder]));

      this.desktopFolders = content.folders.map((meta) => ({
        ...meta,
        name: this.sanitizeFolderName(meta.name || "New Folder"),
        items: [],
        ...positionOf(previousFolders.get(meta.id)),
      }));

      this.dockerApps.forEach((app) => {
        app.folderId = content.membership[appLayoutKey(app.name)] ?? null;
      });

      this.systemDesktopIcons.forEach((icon) => {
        if (icon.shortcut) icon.folderId = content.membership[icon.id] ?? null;
      });

      this.initializeSystemIcons();
      this.syncFolderItems();
    },

    layoutItems(mode: DesktopMode): LayoutItems {
      const items: LayoutItems = {};
      const put = (key: string, item: { x?: number; y?: number; gridRow?: number; gridCol?: number; page?: number }) => {
        const cell = layoutCell(mode, item);
        if (cell) items[key] = cell;
      };

      this.desktopRootApps.forEach((app) => put(appLayoutKey(app.name), app));
      this.desktopFolders.forEach((folder) => put(folder.id, folder));
      this.desktopRootSystemIcons.forEach((icon) => put(icon.id, icon));

      return items;
    },

    persistLayout() {
      useDesktopSyncStore().persistLayout();
    },

    buildShortcutIcon(shortcut: any): SystemDesktopIcon {
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
        folderId: useDesktopSyncStore().content.membership[`shortcut-${shortcut.id}`] ?? null,
      };
    },

    async loadShortcuts(csrfToken: string) {
      try {
        const response = await axios.get("/api/shortcuts", {
          headers: { "X-HomeDock-CSRF-Token": csrfToken },
        });

        const previous = new Map(this.systemDesktopIcons.filter((icon) => icon.shortcut).map((icon) => [icon.id, icon]));

        this.systemDesktopIcons = this.systemDesktopIcons.filter((icon) => !icon.shortcut);
        (response.data.shortcuts || []).forEach((shortcut: any) => {
          const icon = this.buildShortcutIcon(shortcut);
          this.systemDesktopIcons.push({ ...icon, ...positionOf(previous.get(icon.id)) });
        });

        this.shortcutsLoaded = true;
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
          this.systemDesktopIcons.push(this.buildShortcutIcon(response.data.shortcut));
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
          const rebuilt = this.buildShortcutIcon(response.data.shortcut);
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
          this.removeSystemIconFromFolder(this.systemDesktopIcons[index].id);
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
      this.persistLayout();
    },

    isSystemIconOnDesktop(appId: string): boolean {
      return this.systemDesktopIcons.some((icon) => icon.appId === appId);
    },

    addSystemIconToDesktop(appId: string, name: string, icon: any, moduleName?: string): boolean {
      if (this.isSystemIconOnDesktop(appId)) {
        return false;
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

      useDesktopSyncStore().updateContent((draft) => {
        if (DEFAULT_ICON_IDS.includes(appId)) {
          draft.removedDefaults = draft.removedDefaults.filter((id) => id !== appId);
        } else if (!draft.systemIcons.some((meta) => meta.appId === appId)) {
          draft.systemIcons.push({ appId, name, icon, ...(moduleName && { moduleName }) });
        }
      });

      return true;
    },

    removeSystemIconFromDesktop(appId: string): boolean {
      const index = this.systemDesktopIcons.findIndex((icon) => icon.appId === appId && !icon.isPermanent);
      if (index === -1) {
        return false;
      }

      this.removeSystemIconFromFolder(this.systemDesktopIcons[index].id);
      this.systemDesktopIcons.splice(index, 1);

      useDesktopSyncStore().updateContent((draft) => {
        if (DEFAULT_ICON_IDS.includes(appId)) {
          if (!draft.removedDefaults.includes(appId)) draft.removedDefaults.push(appId);
        } else {
          draft.systemIcons = draft.systemIcons.filter((meta) => meta.appId !== appId);
        }
      });

      this.persistLayout();
      return true;
    },

    updateItemPosition(type: DesktopItemType, id: string, x: number, y: number, gridRow?: number, gridCol?: number, page?: number) {
      let item: { x?: number; y?: number; gridRow?: number; gridCol?: number; page?: number } | undefined;

      switch (type) {
        case "app":
          item = this.dockerApps.find((a) => a.id === id);
          break;
        case "folder":
          item = this.desktopFolders.find((f) => f.id === id);
          break;
        case "systemicon":
          item = this.systemDesktopIcons.find((i) => i.id === id);
          break;
      }

      if (item) {
        item.x = x;
        item.y = y;
        if (gridRow !== undefined) item.gridRow = gridRow;
        if (gridCol !== undefined) item.gridCol = gridCol;
        if (page !== undefined) item.page = page;
        this.persistLayout();
      }
    },

    saveIconPositions() {
      this.persistLayout();
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

      const sync = useDesktopSyncStore();
      const current = sync.layouts[sync.mode] ?? {};
      sync.persistLayout({ replace: Object.fromEntries(Object.entries(current).filter(([key]) => key.startsWith("widget-"))) });
      sync.contentVersion += 1;
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

      [...folder.items].forEach((itemId) => this.removeItemFromFolder(itemId));

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

      useDesktopSyncStore().updateContent((draft) => {
        draft.membership[appLayoutKey(app.name)] = folderId;
      });
      this.persistLayout();
    },

    isFolderableIconId(iconId: string): boolean {
      const icon = this.systemDesktopIcons.find((i) => i.id === iconId);
      return Boolean(icon && isFolderableIcon(icon));
    },

    addItemToFolder(itemId: string, folderId: string) {
      if (this.systemDesktopIcons.some((icon) => icon.id === itemId)) {
        this.addSystemIconToFolder(itemId, folderId);
      } else {
        this.addAppToFolder(itemId, folderId);
      }
    },

    removeItemFromFolder(itemId: string) {
      if (this.systemDesktopIcons.some((icon) => icon.id === itemId)) {
        this.removeSystemIconFromFolder(itemId);
      } else {
        this.removeAppFromFolder(itemId);
      }
    },

    addSystemIconToFolder(iconId: string, folderId: string) {
      const icon = this.systemDesktopIcons.find((i) => i.id === iconId && isFolderableIcon(i));
      const folder = this.desktopFolders.find((f) => f.id === folderId);

      if (!icon || !folder) return;

      if (icon.folderId) {
        this.removeSystemIconFromFolder(iconId);
      }

      icon.folderId = folderId;
      if (!folder.items.includes(iconId)) {
        folder.items.push(iconId);
      }

      icon.x = undefined;
      icon.y = undefined;
      icon.gridRow = undefined;
      icon.gridCol = undefined;

      useDesktopSyncStore().updateContent((draft) => {
        draft.membership[iconId] = folderId;
      });
      this.persistLayout();
    },

    removeSystemIconFromFolder(iconId: string) {
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

      useDesktopSyncStore().updateContent((draft) => {
        delete draft.membership[iconId];
      });
      this.persistLayout();
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

      useDesktopSyncStore().updateContent((draft) => {
        delete draft.membership[appLayoutKey(app.name)];
      });
      this.persistLayout();
    },

    saveFolders() {
      const folders = this.desktopFolders.map((folder) => ({ id: folder.id, name: folder.name, createdAt: folder.createdAt, ...(folder.color && { color: folder.color }), ...(folder.icon && { icon: folder.icon }) }));
      const folderIds = new Set(folders.map((folder) => folder.id));

      useDesktopSyncStore().updateContent((draft) => {
        draft.folders = folders;
        Object.keys(draft.membership).forEach((key) => {
          if (!folderIds.has(draft.membership[key])) delete draft.membership[key];
        });
      });
      this.persistLayout();
    },

    syncFolderItems() {
      this.desktopFolders.forEach((folder) => {
        folder.items = [];
      });

      this.systemDesktopIcons.forEach((icon) => {
        if (icon.folderId) {
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
