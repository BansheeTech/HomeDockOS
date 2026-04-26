// homedock-ui/vue3/static/js/__Stores__/useDisksPlusStore.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import axios from "axios";
import { defineStore } from "pinia";
import { ref, computed, inject, watch } from "vue";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { encryptForServer } from "../__Utils__/CryptoClient";
import { registerSSERef } from "./useSSEStore";

import type { DiskData } from "../__Types__/DiskData";
import type { SettingsData } from "../__Types__/SettingsData";

export interface DiskInfo {
  id: string;
  device: string;
  mountpoint: string;
  label: string;
  fstype: string;
  opts?: string;
  total: number;
  used: number;
  free: number;
  percent: number;
  media_type: string;
  removable: boolean;
  internal: boolean;
}

export interface DisksPlusSession {
  unlocked: boolean;
  remaining_seconds: number;
  ttl_seconds: number;
  granted_zones: string[];
  docker_limited: boolean;
  protected_paths_enforced: boolean;
}

const STATUS_SYNC_INTERVAL_MS = 30000;
const CLIENT_TICK_INTERVAL_MS = 1000;

export const useDisksPlusStore = defineStore("DisksPlusStore", () => {
  const csrfToken = useCsrfToken();
  const initialDisks = inject<DiskData[] | null>("data-disks", null);
  const settingsData = inject<SettingsData | null>("data-settings", null);

  const dashboardDisks = ref<DiskData[]>(initialDisks || []);

  const sseSystemDiskUsage = ref(String(initialDisks?.find((d) => d.is_system)?.usage_percent ?? "0"));
  const sseExternalDiskUsage = ref(String(initialDisks?.find((d) => !d.is_system && d.device === (settingsData?.default_external_drive || ""))?.usage_percent ?? "0"));
  const sseDisksSummary = ref("[]");
  registerSSERef("disk_usage", sseSystemDiskUsage);
  registerSSERef("external_disk_usage", sseExternalDiskUsage);
  registerSSERef("disks_summary", sseDisksSummary);

  function applyUsageToDisk(device: string | undefined, usage: number) {
    if (!device) return;
    const disk = dashboardDisks.value.find((d) => (device === "__system__" ? d.is_system : d.device === device));
    if (!disk || isNaN(usage) || disk.total_gb <= 0) return;
    disk.usage_percent = usage;
    disk.used_gb = (disk.total_gb * usage) / 100;
    disk.free_gb = disk.total_gb - disk.used_gb;
  }

  watch(sseSystemDiskUsage, (val) => {
    applyUsageToDisk("__system__", parseFloat(val));
  });

  watch(sseExternalDiskUsage, (val) => {
    const tracked = settingsData?.default_external_drive;
    if (tracked && tracked !== "disabled") {
      applyUsageToDisk(tracked, parseFloat(val));
    }
  });

  watch(sseDisksSummary, (val) => {
    try {
      const parsed: DiskData[] = JSON.parse(val);
      if (Array.isArray(parsed) && parsed.length > 0) {
        dashboardDisks.value = parsed;
      }
    } catch {}
  });

  const trackedExternalDevice = computed<string>(() => {
    return settingsData?.default_external_drive || "disabled";
  });

  const allDisks = computed<DiskData[]>(() => dashboardDisks.value);

  const osDisk = computed<DiskData | null>(() => {
    return allDisks.value.find((d) => d.is_system) || null;
  });

  const otherDisks = computed<DiskData[]>(() => {
    return allDisks.value.filter((d) => !d.is_system);
  });

  const trackedExternalDisk = computed<DiskData | null>(() => {
    const device = trackedExternalDevice.value;
    if (!device || device === "disabled") return null;
    return otherDisks.value.find((d) => d.device === device) || null;
  });

  const isTrackedExternalDiskActive = computed<boolean>(() => {
    return !!trackedExternalDisk.value && trackedExternalDisk.value.total_gb > 0;
  });

  function diskLabel(device: string | null | undefined): string {
    if (!device || device === "disabled") return "";
    const match = allDisks.value.find((d) => d.device === device);
    return match?.label?.trim() || match?.device || device;
  }

  const session = ref<DisksPlusSession>({
    unlocked: false,
    remaining_seconds: 0,
    ttl_seconds: 600,
    granted_zones: [],
    docker_limited: false,
    protected_paths_enforced: true,
  });
  const disks = ref<DiskInfo[]>([]);
  const selectedDisk = ref<string | null>(null);
  const dangerZonesList = ref<string[]>([]);
  const isLoadingDisks = ref(false);

  const unlocked = computed(() => session.value.unlocked);
  const grantedZones = computed(() => session.value.granted_zones);
  const dockerLimited = computed(() => session.value.docker_limited);
  const selectedDiskInfo = computed(() => disks.value.find((d) => d.id === selectedDisk.value) || null);

  let abortController: AbortController | null = null;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  let reconnectDelay = 0;
  let statusSyncTimer: ReturnType<typeof setInterval> | null = null;
  let clientTickTimer: ReturnType<typeof setInterval> | null = null;

  function slideSession() {
    if (session.value.unlocked && session.value.ttl_seconds > 0) {
      session.value.remaining_seconds = session.value.ttl_seconds;
    }
  }

  function clearLocalState() {
    session.value = { unlocked: false, remaining_seconds: 0, ttl_seconds: session.value.ttl_seconds, granted_zones: [], docker_limited: session.value.docker_limited, protected_paths_enforced: session.value.protected_paths_enforced };
    disks.value = [];
    selectedDisk.value = null;
    stopClientTick();
    stopStatusSync();
    stopEventStream();
  }

  function applySessionPayload(payload: any) {
    if (!payload) return;
    session.value = {
      unlocked: !!payload.unlocked,
      remaining_seconds: Number(payload.remaining_seconds ?? 0),
      ttl_seconds: Number(payload.ttl_seconds ?? session.value.ttl_seconds),
      granted_zones: Array.isArray(payload.granted_zones) ? payload.granted_zones : [],
      docker_limited: !!payload.docker_limited,
      protected_paths_enforced: payload.protected_paths_enforced ?? session.value.protected_paths_enforced,
    };
    if (!session.value.unlocked) {
      disks.value = [];
      selectedDisk.value = null;
      stopEventStream();
    }
  }

  function startClientTick() {
    if (clientTickTimer !== null) return;
    clientTickTimer = setInterval(() => {
      if (session.value.ttl_seconds === 0) return;
      if (session.value.remaining_seconds > 0) {
        session.value.remaining_seconds = Math.max(0, session.value.remaining_seconds - 1);
      }
      if (session.value.remaining_seconds === 0 && session.value.unlocked) {
        clearLocalState();
      }
    }, CLIENT_TICK_INTERVAL_MS);
  }

  function stopClientTick() {
    if (clientTickTimer !== null) {
      clearInterval(clientTickTimer);
      clientTickTimer = null;
    }
  }

  function startStatusSync() {
    if (statusSyncTimer !== null) return;
    statusSyncTimer = setInterval(() => {
      if (session.value.unlocked) fetchStatus();
    }, STATUS_SYNC_INTERVAL_MS);
  }

  function stopStatusSync() {
    if (statusSyncTimer !== null) {
      clearInterval(statusSyncTimer);
      statusSyncTimer = null;
    }
  }

  async function fetchStatus() {
    try {
      const response = await axios.get("/api/disksplus/status", {
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      });
      applySessionPayload(response.data);
      if (session.value.unlocked) {
        startClientTick();
        startStatusSync();
      } else {
        stopClientTick();
      }
    } catch {
      applySessionPayload({ unlocked: false, remaining_seconds: 0, ttl_seconds: session.value.ttl_seconds, granted_zones: [] });
    }
  }

  async function fetchDangerZones() {
    try {
      const response = await axios.get("/api/disksplus/danger-zones", {
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      });
      dangerZonesList.value = Array.isArray(response.data?.zones) ? response.data.zones : [];
    } catch {
      dangerZonesList.value = [];
    }
  }

  async function unlock(password: string): Promise<{ ok: boolean; error?: string; remaining_attempts?: number; retry_after?: number }> {
    try {
      const encrypted = await encryptForServer({ password }, csrfToken.value);
      const response = await axios.post("/api/disksplus/unlock", { encrypted_data: encrypted }, { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });
      applySessionPayload(response.data);
      if (session.value.unlocked) {
        startClientTick();
        startStatusSync();
        await Promise.all([fetchDangerZones(), fetchDisks()]);
        startEventStream();
      }
      return { ok: true };
    } catch (err: any) {
      const data = err?.response?.data || {};
      return {
        ok: false,
        error: data.error || "unknown_error",
        remaining_attempts: data.remaining_attempts,
        retry_after: data.retry_after,
      };
    }
  }

  async function lock(): Promise<void> {
    try {
      await axios.post("/api/disksplus/lock", {}, { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });
    } catch {}
    clearLocalState();
  }

  function syncDashboardDisks() {
    if (disks.value.length === 0) return;
    const GB = 1073741824;
    const osMount = dashboardDisks.value.find((d) => d.is_system)?.mountpoint;
    dashboardDisks.value = disks.value.map((d) => ({
      id: d.id,
      device: d.device,
      mountpoint: d.mountpoint,
      label: d.label,
      fstype: d.fstype,
      total_gb: +(d.total / GB).toFixed(2),
      used_gb: +(d.used / GB).toFixed(2),
      free_gb: +(d.free / GB).toFixed(2),
      usage_percent: d.percent,
      media_type: d.media_type,
      removable: d.removable,
      internal: d.internal,
      is_system: d.mountpoint === osMount || d.mountpoint === "/",
    }));
  }

  async function fetchDisks() {
    if (!session.value.unlocked) return;
    isLoadingDisks.value = true;
    try {
      const response = await axios.get("/api/disksplus/disks", {
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      });
      disks.value = Array.isArray(response.data?.disks) ? response.data.disks : [];
      syncDashboardDisks();
    } catch (err: any) {
      disks.value = [];
      if (err?.response?.status === 401) {
        clearLocalState();
      }
    } finally {
      isLoadingDisks.value = false;
    }
  }

  async function authorizeDangerZone(password: string, path: string): Promise<{ ok: boolean; error?: string; remaining_attempts?: number; retry_after?: number; granted_zone?: string }> {
    try {
      const encrypted = await encryptForServer({ password, path }, csrfToken.value);
      const response = await axios.post("/api/disksplus/danger-auth", { encrypted_data: encrypted }, { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });
      applySessionPayload(response.data);
      return { ok: true, granted_zone: response.data?.granted_zone };
    } catch (err: any) {
      const data = err?.response?.data || {};
      return {
        ok: false,
        error: data.error || "unknown_error",
        remaining_attempts: data.remaining_attempts,
        retry_after: data.retry_after,
      };
    }
  }

  function selectDisk(diskId: string | null) {
    selectedDisk.value = diskId;
  }

  function startEventStream() {
    if (abortController || !session.value.unlocked) return;
    abortController = new AbortController();

    const connect = () => {
      if (!abortController) return;
      const signal = abortController.signal;
      let lastIndex = 0;
      let buffer = "";

      axios
        .get("/api/disksplus/events", {
          headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
          signal,
          responseType: "text",
          onDownloadProgress: (progressEvent) => {
            const responseText = (progressEvent.event?.target as XMLHttpRequest)?.responseText;
            if (!responseText) return;
            const newData = responseText.substring(lastIndex);
            lastIndex = responseText.length;
            const combined = buffer + newData;
            const parts = combined.split("\n\n");
            buffer = parts.pop()!;
            for (const part of parts) {
              if (!part.trim()) continue;
              let event = "message";
              let data = "";
              for (const line of part.split("\n")) {
                if (line.startsWith("event: ")) event = line.slice(7);
                else if (line.startsWith("data: ")) data = line.slice(6);
              }
              if (event === "change" && data) {
                try {
                  const payload = JSON.parse(data);
                  handleChangeEvent(payload);
                } catch {}
              }
            }
          },
        })
        .then(() => {
          reconnectDelay = 0;
          if (!signal.aborted && session.value.unlocked) connect();
        })
        .catch(() => {
          if (signal.aborted) return;
          if (!session.value.unlocked) return;
          reconnectDelay = Math.min((reconnectDelay || 1500) * 2, 60000);
          const jitter = reconnectDelay * (0.5 + Math.random() * 0.5);
          reconnectTimeout = setTimeout(connect, jitter);
        });
    };

    connect();
  }

  function stopEventStream() {
    if (reconnectTimeout !== null) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    reconnectDelay = 0;
  }

  function handleChangeEvent(payload: { added?: Array<{ device: string; mountpoint: string }>; removed?: Array<{ device: string; mountpoint: string }>; timestamp?: number }) {
    const removedMountpoints = new Set((payload.removed || []).map((r) => r.mountpoint));
    const previouslySelected = selectedDiskInfo.value;
    fetchDisks().then(() => {
      if (previouslySelected && removedMountpoints.has(previouslySelected.mountpoint)) {
        selectedDisk.value = null;
      }
    });
  }

  return {
    allDisks,
    osDisk,
    otherDisks,
    trackedExternalDevice,
    trackedExternalDisk,
    isTrackedExternalDiskActive,
    diskLabel,

    session,
    disks,
    selectedDisk,
    dangerZonesList,
    isLoadingDisks,

    unlocked,
    grantedZones,
    dockerLimited,
    selectedDiskInfo,

    fetchStatus,
    unlock,
    lock,
    fetchDangerZones,
    fetchDisks,
    authorizeDangerZone,
    selectDisk,
    clearLocalState,
    startEventStream,
    stopEventStream,
    slideSession,
  };
});
