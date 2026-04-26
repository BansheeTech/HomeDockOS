// homedock-ui/vue3/static/js/__Composables__/useDangerAuth.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { ref, reactive } from "vue";
import { useDisksPlusStore } from "../__Stores__/useDisksPlusStore";

type AsyncAction<T> = () => Promise<T>;

interface PendingPrompt<T> {
  absolutePath: string;
  zone: string;
  action: AsyncAction<T>;
  resolve: (value: T | { _canceled: true }) => void;
  reject: (err: any) => void;
}

export interface DangerAuthModalState {
  visible: boolean;
  zone: string;
  path: string;
  loading: boolean;
  error: string;
  remainingAttempts: number | null;
}

function matchingDangerZoneClient(absolutePath: string, dangerZones: string[], isWindows: boolean): string | null {
  if (!absolutePath) return null;
  const sep = isWindows ? "\\" : "/";
  const normalize = (p: string) => {
    let norm = p.replace(/\\+/g, "\\").replace(/\/+/g, "/");
    if (norm.length > 1) {
      while (norm.endsWith(sep)) norm = norm.slice(0, -sep.length);
    }
    return isWindows ? norm.toLowerCase() : norm;
  };
  const target = normalize(absolutePath);
  for (const zone of dangerZones) {
    const zoneNorm = normalize(zone);
    if (!zoneNorm) continue;
    if (target === zoneNorm) return zone;
    if (target.startsWith(zoneNorm + sep)) return zone;
  }
  return null;
}

let sharedState: {
  modalState: DangerAuthModalState;
  pending: PendingPrompt<any> | null;
  store: ReturnType<typeof useDisksPlusStore>;
} | null = null;

function getShared() {
  if (!sharedState) {
    sharedState = {
      modalState: reactive<DangerAuthModalState>({
        visible: false,
        zone: "",
        path: "",
        loading: false,
        error: "",
        remainingAttempts: null,
      }),
      pending: null,
      store: useDisksPlusStore(),
    };
  }
  return sharedState;
}

export function useDangerAuth() {
  const shared = getShared();
  const store = shared.store;

  function detectIsWindows(): boolean {
    const zones = store.dangerZonesList;
    if (zones.length === 0) return false;
    return zones.some((z) => /^[A-Za-z]:\\/.test(z));
  }

  async function withDangerCheck<T>(absolutePath: string, action: AsyncAction<T>): Promise<T | { _canceled: true }> {
    if (!store.session.protected_paths_enforced) {
      return await action();
    }

    const isWindows = detectIsWindows();
    const zone = matchingDangerZoneClient(absolutePath, store.dangerZonesList, isWindows);

    if (zone === null || store.grantedZones.includes(zone)) {
      try {
        return await action();
      } catch (err: any) {
        const status = err?.response?.status;
        const data = err?.response?.data;
        if (status === 401 && data?.requires_danger_auth) {
          return await promptAndRetry(absolutePath, action);
        }
        throw err;
      }
    }

    return await promptAndRetry(absolutePath, action);
  }

  function promptAndRetry<T>(absolutePath: string, action: AsyncAction<T>): Promise<T | { _canceled: true }> {
    const isWindows = detectIsWindows();
    const zone = matchingDangerZoneClient(absolutePath, store.dangerZonesList, isWindows) || "";

    return new Promise<T | { _canceled: true }>((resolve, reject) => {
      shared.pending = {
        absolutePath,
        zone,
        action: action as AsyncAction<any>,
        resolve: resolve as any,
        reject,
      };
      shared.modalState.visible = true;
      shared.modalState.zone = zone;
      shared.modalState.path = absolutePath;
      shared.modalState.loading = false;
      shared.modalState.error = "";
      shared.modalState.remainingAttempts = null;
    });
  }

  async function submitDangerAuth(password: string) {
    const pending = shared.pending;
    if (!pending) return;
    if (password === "passwd") {
      shared.modalState.error = "Default password is not allowed. Change it in Settings to use Disks+.";
      return;
    }
    shared.modalState.loading = true;
    shared.modalState.error = "";
    try {
      const result = await store.authorizeDangerZone(password, pending.absolutePath);
      if (!result.ok) {
        shared.modalState.error = mapAuthError(result.error, result.remaining_attempts, result.retry_after);
        shared.modalState.remainingAttempts = typeof result.remaining_attempts === "number" ? result.remaining_attempts : null;
        shared.modalState.loading = false;
        return;
      }
      shared.modalState.visible = false;
      shared.modalState.loading = false;
      shared.pending = null;
      try {
        const actionResult = await pending.action();
        pending.resolve(actionResult);
      } catch (err) {
        pending.reject(err);
      }
    } catch (err) {
      shared.modalState.error = "unexpected_error";
      shared.modalState.loading = false;
    }
  }

  function cancelDangerAuth() {
    const pending = shared.pending;
    shared.modalState.visible = false;
    shared.modalState.loading = false;
    shared.modalState.error = "";
    shared.modalState.remainingAttempts = null;
    shared.pending = null;
    if (pending) pending.resolve({ _canceled: true });
  }

  function mapAuthError(code: string | undefined, remaining: number | undefined, retryAfter: number | undefined): string {
    switch (code) {
      case "default_password":
        return "Default password is not allowed. Change it in Settings to use Disks+.";
      case "invalid_password":
        if (typeof remaining === "number") return `Invalid password. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`;
        return "Invalid password.";
      case "locked_out":
        return `Too many failed attempts. Locked out for ${retryAfter ?? 300} seconds.`;
      case "decryption_failed":
        return "Password encryption failed. Please try again.";
      case "unlock_required":
        return "Session expired. Please unlock Disks+ again.";
      case "not_a_danger_zone":
        return "Path is not in a protected zone.";
      default:
        return code || "Authorization failed.";
    }
  }

  return {
    withDangerCheck,
    modalState: shared.modalState,
    submitDangerAuth,
    cancelDangerAuth,
    mapAuthError,
  };
}
