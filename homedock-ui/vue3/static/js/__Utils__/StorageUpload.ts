// homedock-ui/vue3/static/js/__Utils__/StorageUpload.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import axios from "axios";

export const CHUNK_SIZE = 5 * 1024 * 1024;
export const EDIT_MAX_BYTES = 64 * 1024 * 1024;
const MAX_NAME_ATTEMPTS = 100;

export interface ChunkedUploadOptions {
  extraInitFields?: Record<string, unknown>;
  onProgress?: (loaded: number, total: number) => void;
  onChunkComplete?: () => void;
}

export class UploadRejectedError extends Error {}

export async function uploadChunked(apiBase: string, blob: Blob, fileName: string, folder: string, csrfToken: string, options: ChunkedUploadOptions = {}) {
  const { extraInitFields = {}, onProgress, onChunkComplete } = options;
  const headers = { "X-HomeDock-CSRF-Token": csrfToken };
  const totalChunks = Math.ceil(blob.size / CHUNK_SIZE);

  const init = await axios.post(
    `${apiBase}/init`,
    {
      filename: fileName,
      total_size: blob.size,
      total_chunks: totalChunks,
      target_path: folder,
      ...extraInitFields,
    },
    { headers },
  );

  const uploadId = init.data?.upload_id;
  if (!init.data?.success || !uploadId) throw new UploadRejectedError(init.data?.error || "init_failed");

  let uploadedBytes = 0;
  try {
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, blob.size);
      const chunk = blob.slice(start, end);

      await axios.put(`${apiBase}/chunk?upload_id=${encodeURIComponent(uploadId)}&chunk_index=${i}`, chunk, {
        headers: { ...headers, "Content-Type": "application/octet-stream" },
        onUploadProgress: onProgress ? (event) => onProgress(uploadedBytes + (event.loaded || 0), blob.size) : undefined,
      });
      uploadedBytes += end - start;
      onChunkComplete?.();
    }

    const finalize = await axios.post(`${apiBase}/finalize`, { upload_id: uploadId }, { headers });
    if (!finalize.data?.success) throw new UploadRejectedError(finalize.data?.error || "finalize_failed");

    return finalize.data;
  } catch (err) {
    try {
      await axios.delete(`${apiBase}/abort?upload_id=${encodeURIComponent(uploadId)}`, { headers });
    } catch {}
    throw err;
  }
}

export async function uploadToStorage(blob: Blob, fileName: string, folder: string, csrfToken: string): Promise<string> {
  const data = await uploadChunked("/api/storage/upload", blob, fileName, folder, csrfToken);
  return data.path as string;
}

export async function uniqueStorageName(folder: string, fileName: string, csrfToken: string): Promise<string> {
  let taken = new Set<string>();
  try {
    const response = await axios.get("/api/storage/files", {
      params: { path: folder },
      headers: { "X-HomeDock-CSRF-Token": csrfToken },
    });
    taken = new Set((response.data?.files ?? []).map((file: any) => String(file.display_name || file.name.split("/").pop() || file.name).toLowerCase()));
  } catch (error: any) {
    if (error.response?.status !== 404) throw error;
  }

  if (!taken.has(fileName.toLowerCase())) return fileName;

  const dot = fileName.lastIndexOf(".");
  const base = dot > 0 ? fileName.slice(0, dot) : fileName;
  const extension = dot > 0 ? fileName.slice(dot) : "";

  for (let counter = 1; counter <= MAX_NAME_ATTEMPTS; counter++) {
    const candidate = `${base} (${counter})${extension}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
  throw new Error("Too many files with this name");
}
