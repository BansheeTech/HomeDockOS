// homedock-ui/vue3/static/js/__Stores__/useDesktopSyncStore.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { defineStore } from "pinia";
import { computed, ref } from "vue";
import axios from "axios";

import { useCsrfToken } from "../__Composables__/useCsrfToken";
import type { WidgetSize } from "../__Config__/WidgetDefaultDetails";

export type DesktopMode = "desktop" | "mobile";
export type LayoutItems = Record<string, number[]>;

export interface FolderMeta {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  createdAt: number;
}

export interface SystemIconMeta {
  appId: string;
  name: string;
  icon: any;
  moduleName?: string;
}

export interface WidgetMeta {
  instanceId: string;
  type: string;
  size: WidgetSize;
  settings?: Record<string, unknown>;
}

export interface RecentAppEntry {
  id: string;
  at: number;
}

export interface DesktopContent {
  folders: FolderMeta[];
  membership: Record<string, string>;
  systemIcons: SystemIconMeta[];
  removedDefaults: string[];
  widgets: WidgetMeta[];
  pinned: string[];
  recents: RecentAppEntry[];
}

export interface LayoutSeed {
  from: DesktopMode;
  items: LayoutItems;
}

export interface LayoutProvider {
  items: (mode: DesktopMode) => LayoutItems;
  owns: (key: string) => boolean;
}

interface StateResponse {
  rev: number;
  initialized: boolean;
  content: DesktopContent;
  layouts: Partial<Record<DesktopMode, LayoutItems>>;
  seeds: Partial<Record<DesktopMode, LayoutSeed>>;
}

const DEVICE_KEY = "homedock_device_id";
const CONTENT_DEBOUNCE_MS = 300;
const LAYOUT_DEBOUNCE_MS = 500;
export const MAX_RECENT_APPS = 16;

export function appLayoutKey(appName: string): string {
  return `app:${appName}`;
}

function readDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_KEY);
    if (existing && /^[A-Za-z0-9-]{8,64}$/.test(existing)) return existing;
  } catch {
    // Halp!
  }

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const id = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

  try {
    localStorage.setItem(DEVICE_KEY, id);
  } catch {
    // Halp!
  }

  return id;
}

function emptyContent(): DesktopContent {
  return { folders: [], membership: {}, systemIcons: [], removedDefaults: [], widgets: [], pinned: [], recents: [] };
}

function normalizeContent(content: Partial<DesktopContent> | null | undefined): DesktopContent {
  return { ...emptyContent(), ...(content ?? {}) };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function mergeEntries<T>(base: Array<[string, T]>, mine: Array<[string, T]>, theirs: Array<[string, T]>): Array<[string, T]> {
  const baseMap = new Map(base);
  const mineMap = new Map(mine);
  const theirsMap = new Map(theirs);
  const keys = [...theirs.map(([key]) => key), ...mine.map(([key]) => key).filter((key) => !theirsMap.has(key))];
  const merged: Array<[string, T]> = [];

  keys.forEach((key) => {
    const mineValue = mineMap.get(key);
    const value = same(mineValue, baseMap.get(key)) ? theirsMap.get(key) : mineValue;
    if (value !== undefined) merged.push([key, value]);
  });

  return merged;
}

function mergeKeyed<T>(base: T[], mine: T[], theirs: T[], key: (item: T) => string): T[] {
  const entries = (list: T[]) => list.map((item) => [key(item), item] as [string, T]);
  return mergeEntries(entries(base), entries(mine), entries(theirs)).map(([, item]) => item);
}

function mergeRecents(mine: RecentAppEntry[], theirs: RecentAppEntry[]): RecentAppEntry[] {
  const latest = new Map<string, number>();
  [...mine, ...theirs].forEach((entry) => latest.set(entry.id, Math.max(latest.get(entry.id) ?? 0, entry.at)));

  return [...latest]
    .map(([id, at]) => ({ id, at }))
    .sort((a, b) => b.at - a.at)
    .slice(0, MAX_RECENT_APPS);
}

export function mergeContent(base: DesktopContent, mine: DesktopContent, theirs: DesktopContent): DesktopContent {
  const flags = (list: string[]) => list.map((id) => [id, true] as [string, boolean]);

  return {
    folders: mergeKeyed(base.folders, mine.folders, theirs.folders, (f) => f.id),
    membership: Object.fromEntries(mergeEntries(Object.entries(base.membership), Object.entries(mine.membership), Object.entries(theirs.membership))),
    systemIcons: mergeKeyed(base.systemIcons, mine.systemIcons, theirs.systemIcons, (i) => i.appId),
    removedDefaults: mergeEntries(flags(base.removedDefaults), flags(mine.removedDefaults), flags(theirs.removedDefaults)).map(([id]) => id),
    widgets: mergeKeyed(base.widgets, mine.widgets, theirs.widgets, (w) => w.instanceId),
    pinned: mergeEntries(flags(base.pinned), flags(mine.pinned), flags(theirs.pinned)).map(([id]) => id),
    recents: mergeRecents(mine.recents, theirs.recents),
  };
}

export const useDesktopSyncStore = defineStore("DesktopSync", () => {
  const csrfToken = useCsrfToken();

  const deviceId = readDeviceId();
  const mode = ref<DesktopMode>("desktop");
  const loaded = ref(false);
  const initialized = ref(false);
  const rev = ref(0);
  const content = ref<DesktopContent>(emptyContent());
  const layouts = ref<Partial<Record<DesktopMode, LayoutItems>>>({});
  const seeds = ref<Partial<Record<DesktopMode, LayoutSeed>>>({});
  const contentVersion = ref(0);
  const ready = computed(() => loaded.value && contentVersion.value > 0);
  const pendingMobileCommit = ref(false);

  let base: DesktopContent = emptyContent();
  let contentTimer: ReturnType<typeof setTimeout> | null = null;
  let contentInFlight = false;
  let contentQueued = false;
  const layoutTimers: Partial<Record<DesktopMode, ReturnType<typeof setTimeout>>> = {};
  const fitShifted: Partial<Record<DesktopMode, LayoutItems>> = {};
  const providers: LayoutProvider[] = [];
  const contentListeners: Array<(content: DesktopContent) => void> = [];
  let loadPromise: Promise<void> | null = null;
  let resolveLoaded: () => void = () => {};
  const whenLoaded = new Promise<void>((resolve) => (resolveLoaded = resolve));

  const headers = () => ({ "X-HomeDock-CSRF-Token": csrfToken.value });

  function onContentApplied(listener: (content: DesktopContent) => void) {
    contentListeners.push(listener);
  }

  function registerLayoutProvider(provider: LayoutProvider) {
    providers.push(provider);
  }

  function notifyContent() {
    contentListeners.forEach((listener) => listener(content.value));
    contentVersion.value += 1;
  }

  function hasLocalContentChanges() {
    return contentTimer !== null || contentInFlight || !same(content.value, base);
  }

  function load(): Promise<void> {
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
      try {
        const { data } = await axios.get<StateResponse>("/api/desktop-state", { params: { device: deviceId }, headers: headers() });

        rev.value = data.rev;
        initialized.value = data.initialized;
        base = normalizeContent(clone(data.content));
        content.value = clone(base);
        layouts.value = data.layouts ?? {};
        seeds.value = data.seeds ?? {};
      } catch {
        content.value = emptyContent();
      }

      loaded.value = true;
      resolveLoaded();
    })();

    return loadPromise;
  }

  async function refresh() {
    if (!loaded.value) return;

    try {
      const { data } = await axios.get<StateResponse>("/api/desktop-state", { params: { device: deviceId }, headers: headers() });

      if (!layoutTimers.desktop && !layoutTimers.mobile && !same(data.layouts ?? {}, layouts.value)) {
        layouts.value = data.layouts ?? {};
        contentVersion.value += 1;
      }

      if (data.rev === rev.value) return;

      const theirs = normalizeContent(data.content);
      content.value = hasLocalContentChanges() ? mergeContent(base, content.value, theirs) : clone(theirs);
      base = clone(theirs);
      rev.value = data.rev;
      initialized.value = data.initialized;
      notifyContent();

      if (!same(content.value, base)) scheduleContentSave();
    } catch {
      // Halp!
    }
  }

  function updateContent(mutator: (draft: DesktopContent) => void) {
    mutator(content.value);
    scheduleContentSave();
  }

  function scheduleContentSave() {
    if (!loaded.value) return;
    if (contentTimer) clearTimeout(contentTimer);

    contentTimer = setTimeout(() => {
      contentTimer = null;
      pushContent();
    }, CONTENT_DEBOUNCE_MS);
  }

  async function pushContent() {
    if (contentInFlight) {
      contentQueued = true;
      return;
    }

    if (initialized.value && same(content.value, base)) return;

    contentInFlight = true;
    const sent = clone(content.value);

    try {
      const { data } = await axios.post<{ rev: number; content: DesktopContent }>("/api/desktop-state/content", { baseRev: rev.value, content: sent }, { headers: headers() });

      const saved = normalizeContent(data.content);
      rev.value = data.rev;
      base = clone(saved);
      initialized.value = true;

      if (same(content.value, sent) && !same(sent, saved)) {
        content.value = clone(saved);
        notifyContent();
      }
    } catch (error: any) {
      if (error?.response?.status === 409 && error.response.data?.content) {
        const theirs = normalizeContent(error.response.data.content);
        content.value = mergeContent(base, content.value, theirs);
        base = clone(theirs);
        rev.value = error.response.data.rev;
        notifyContent();
        contentQueued = true;
      }
    } finally {
      contentInFlight = false;
    }

    if (contentQueued) {
      contentQueued = false;
      pushContent();
    }
  }

  function collectLayout(targetMode: DesktopMode, onlyMissing: boolean): LayoutItems {
    const current: LayoutItems = {};
    providers.forEach((provider) => Object.assign(current, provider.items(targetMode)));

    const previous = layouts.value[targetMode] ?? {};
    const shifted = fitShifted[targetMode] ?? {};
    const next: LayoutItems = {};

    Object.entries(previous).forEach(([key, cell]) => {
      if (key in current || !providers.some((provider) => provider.owns(key))) next[key] = cell;
    });

    Object.entries(current).forEach(([key, cell]) => {
      if (onlyMissing && key in previous) return;
      next[key] = key in previous && key in shifted && same(shifted[key], cell) ? previous[key] : cell;
    });

    return next;
  }

  function setFitShifted(targetMode: DesktopMode, items: LayoutItems) {
    fitShifted[targetMode] = items;
  }

  function persistLayout(options: { onlyMissing?: boolean; replace?: LayoutItems } = {}) {
    if (!ready.value) return;

    const targetMode = mode.value;
    const next = options.replace ?? collectLayout(targetMode, options.onlyMissing === true);
    const previous = layouts.value[targetMode];

    if (previous && same(previous, next)) return;

    layouts.value = { ...layouts.value, [targetMode]: next };

    const timer = layoutTimers[targetMode];
    if (timer) clearTimeout(timer);

    layoutTimers[targetMode] = setTimeout(() => {
      delete layoutTimers[targetMode];
      axios.post("/api/desktop-state/layout", { device: deviceId, mode: targetMode, items: layouts.value[targetMode] ?? {} }, { headers: headers() }).catch(() => {});
    }, LAYOUT_DEBOUNCE_MS);
  }

  function storedLayout(targetMode: DesktopMode): { items: LayoutItems; fromSeed: boolean; seedFrom?: DesktopMode } {
    const own = layouts.value[targetMode];
    if (own) return { items: own, fromSeed: false };

    const seed = seeds.value[targetMode];
    if (seed) return { items: seed.items, fromSeed: true, seedFrom: seed.from };

    return { items: {}, fromSeed: true };
  }

  function addSeedItems(targetMode: DesktopMode, items: LayoutItems) {
    if (Object.keys(items).length === 0) return;

    const own = layouts.value[targetMode];
    if (own) {
      if (targetMode === mode.value) persistLayout({ replace: { ...items, ...own } });
      return;
    }

    const current = seeds.value[targetMode];
    seeds.value = { ...seeds.value, [targetMode]: { from: current?.from ?? targetMode, items: { ...items, ...(current?.items ?? {}) } } };
  }

  function reset() {
    Object.values(layoutTimers).forEach((timer) => timer && clearTimeout(timer));
    if (contentTimer) clearTimeout(contentTimer);
  }

  return {
    deviceId,
    mode,
    loaded,
    ready,
    initialized,
    content,
    layouts,
    contentVersion,
    pendingMobileCommit,
    whenLoaded,

    load,
    refresh,
    updateContent,
    persistLayout,
    storedLayout,
    setFitShifted,
    addSeedItems,
    onContentApplied,
    registerLayoutProvider,
    notifyContent,
    reset,
  };
});
