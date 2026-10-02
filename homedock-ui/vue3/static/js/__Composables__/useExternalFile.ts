// homedock-ui/vue3/static/js/__Composables__/useExternalFile.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import axios from "axios";

import { useI18n } from "vue-i18n";

import { useCsrfToken } from "./useCsrfToken";
import { useDisksPlusStore } from "../__Stores__/useDisksPlusStore";
import { EDIT_MAX_BYTES, uploadChunked } from "../__Utils__/StorageUpload";

export type ExternalFileSource = "appdrive" | "dropzone" | "storage" | "disksplus";

export interface ExternalFileTarget {
  name: string;
  path?: string;
  source?: ExternalFileSource;
  container?: string;
  mountIndex?: number;
  disk?: string;
}

export interface ExternalBinaryFile extends ExternalFileTarget {
  buffer: ArrayBuffer;
}

export const NEW_FILES_FOLDER = "Documents";

const MAX_NAME_ATTEMPTS = 100;

const SOURCE_NAMES: Record<ExternalFileSource, string> = {
  appdrive: "App Drive",
  storage: "Storage",
  dropzone: "Drop Zone",
  disksplus: "Disks+",
};

const EDITING_LABELS: Record<ExternalFileSource, string> = {
  appdrive: "Editing on App Drive",
  storage: "Editing on Storage",
  dropzone: "Editing on Drop Zone",
  disksplus: "Editing on Disks+",
};

export function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function useExternalFile() {
  const { t } = useI18n();
  const csrfToken = useCsrfToken();
  const disksPlusStore = useDisksPlusStore();

  function editingLabel(source: ExternalFileSource | undefined, fallback: string) {
    return source ? t(EDITING_LABELS[source]) : fallback;
  }

  function savedDescription(target: ExternalFileTarget) {
    return t("Saved to {storage}: {path}", { storage: target.source ? SOURCE_NAMES[target.source] : "", path: target.path || target.name });
  }

  async function listStorageNames(folder: string): Promise<Set<string> | null> {
    try {
      const response = await axios.get("/api/storage/files", {
        params: { path: folder },
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      });
      return new Set((response.data.files ?? []).map((entry: { display_name: string }) => entry.display_name.toLowerCase()));
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  }

  async function saveNewToStorage(requestedName: string, extension: string, blob: Blob, mimeType: string): Promise<ExternalFileTarget> {
    const baseName =
      requestedName
        .replace(/[\\/:*?"<>|]/g, "")
        .trim()
        .replace(new RegExp(`\\.${extension}$`, "i"), "") || t("Untitled");

    const existing = await listStorageNames(NEW_FILES_FOLDER);
    if (existing === null) {
      await axios.post("/api/storage/create-folder", { name: NEW_FILES_FOLDER, path: "" }, { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });
    }

    let name = `${baseName}.${extension}`;
    for (let attempt = 1; existing?.has(name.toLowerCase()); attempt++) {
      if (attempt > MAX_NAME_ATTEMPTS) throw new Error(t("Failed to save file"));
      name = `${baseName} (${attempt}).${extension}`;
    }

    const target: ExternalFileTarget = { name, path: `${NEW_FILES_FOLDER}/${name}`, source: "storage" };
    await saveToSource(target, blob, mimeType);

    return target;
  }

  async function saveToSource(target: ExternalFileTarget, blob: Blob, mimeType: string) {
    const path = target.path || target.name;
    const fileName = path.split("/").pop() || target.name;
    const parent = path.split("/").slice(0, -1).join("/");
    const file = new Blob([blob], { type: mimeType });

    const extra: Record<string, string | number> = {};

    if (target.source === "appdrive") {
      extra.container = target.container || "";
      extra.mount = target.mountIndex ?? 0;
    }

    if (target.source === "disksplus") {
      if (!target.disk) throw new Error(t("Disks+ save failed: missing disk id"));
      extra.disk = target.disk;
    }

    if (file.size > EDIT_MAX_BYTES) {
      await uploadChunked(`/api/${target.source}/upload`, file, fileName, parent, csrfToken.value, {
        extraInitFields: extra,
        onChunkComplete: target.source === "disksplus" ? () => disksPlusStore.slideSession() : undefined,
      });
    } else {
      const formData = new FormData();
      formData.append("file", file, fileName);
      if (parent) formData.append("path", parent);
      for (const [key, value] of Object.entries(extra)) formData.append(key, String(value));

      await axios.post(`/api/${target.source}/edit`, formData, {
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      });
    }

    if (target.source === "disksplus") disksPlusStore.slideSession();
  }

  return { editingLabel, savedDescription, saveToSource, saveNewToStorage };
}
