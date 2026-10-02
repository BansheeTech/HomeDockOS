// homedock-ui/vue3/static/js/__Utils__/ArchiveLocal.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { BlobReader, ZipReader, configure, ERR_ENCRYPTED, ERR_INVALID_PASSWORD, ERR_UNSUPPORTED_ENCRYPTION, type Entry, type FileEntry } from "@zip.js/zip.js";

import type { ArchiveEntry, ArchiveListing } from "./ArchiveClient";

configure({ useWebWorkers: false });

export const MAX_PREVIEW_BYTES = 256 * 1024 * 1024;
const MAX_ENTRIES = 50000;
const SUSPICIOUS_RATIO = 1000;
const RATIO_MIN_BYTES = 1024 * 1024;

export class LocalArchiveError extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

function normalizedPath(raw: string): string | null {
  const unified = raw.replace(/\\/g, "/");
  if (unified.startsWith("/") || /^[a-zA-Z]:/.test(unified) || unified.includes("\0")) return null;
  const parts = unified.split("/").filter((part) => part && part !== ".");
  if (parts.some((part) => part === "..")) return null;
  return parts.join("/");
}

export interface LocalArchive {
  listing: ArchiveListing;
  read: (entryPath: string, password?: string) => Promise<ArrayBuffer>;
  checkPassword: (password: string) => Promise<void>;
  close: () => Promise<void>;
}

function passwordErrorCode(error: any): string {
  const text = String(error?.message || error);
  if (text === ERR_INVALID_PASSWORD) return "wrong_password";
  if (text === ERR_ENCRYPTED) return "password_required";
  if (text === ERR_UNSUPPORTED_ENCRYPTION) return "unsupported_format";
  return "corrupt_archive";
}

export async function openLocalArchive(file: File): Promise<LocalArchive> {
  const reader = new ZipReader(new BlobReader(file));
  let rawEntries: Entry[];
  try {
    rawEntries = await reader.getEntries();
  } catch {
    await reader.close().catch(() => {});
    throw new LocalArchiveError("not_an_archive");
  }
  if (rawEntries.length > MAX_ENTRIES) {
    await reader.close().catch(() => {});
    throw new LocalArchiveError("too_many_entries");
  }

  const files = new Map<string, FileEntry>();
  const entries = new Map<string, ArchiveEntry>();
  const seen = new Set<string>();
  let skipped = 0;

  const ensureParents = (path: string) => {
    const parts = path.split("/");
    for (let depth = 1; depth < parts.length; depth++) {
      const folder = parts.slice(0, depth).join("/");
      if (!entries.has(folder)) entries.set(folder, { path: folder, name: parts[depth - 1], is_dir: true, size: 0, compressed_size: 0, modified: null, encrypted: false, skip: null });
    }
  };

  for (const raw of rawEntries) {
    const path = normalizedPath(raw.filename);
    const name = raw.filename.replace(/\\/g, "/").split("/").filter(Boolean).pop() || raw.filename;
    const modified = raw.lastModDate instanceof Date && !isNaN(raw.lastModDate.getTime()) ? Math.floor(raw.lastModDate.getTime() / 1000) : null;

    if (path === null || path === "") {
      skipped++;
      entries.set(`\u0000${raw.filename}`, { path: raw.filename, name, is_dir: raw.directory, size: raw.uncompressedSize, compressed_size: raw.compressedSize, modified, encrypted: raw.encrypted, skip: "unsafe_path" });
      continue;
    }

    const key = path.toLowerCase();
    if (seen.has(key) && !raw.directory) {
      skipped++;
      continue;
    }
    seen.add(key);
    ensureParents(path);

    let skip: ArchiveEntry["skip"] = null;
    if (raw.symlink) skip = "link";
    else if (!raw.directory && raw.uncompressedSize > RATIO_MIN_BYTES && raw.uncompressedSize / Math.max(1, raw.compressedSize) > SUSPICIOUS_RATIO) skip = "suspicious_ratio";
    if (skip) skipped++;

    entries.set(path, { path, name: path.split("/").pop() || path, is_dir: raw.directory, size: raw.directory ? 0 : raw.uncompressedSize, compressed_size: raw.directory ? 0 : raw.compressedSize, modified, encrypted: raw.encrypted, skip });
    if (!raw.directory && !skip) files.set(path, raw as FileEntry);
  }

  const list = Array.from(entries.values());
  const encryptedEntries = rawEntries.filter((entry) => entry.encrypted);

  const listing: ArchiveListing = {
    kind: "zip",
    name: file.name,
    size: file.size,
    encrypted: encryptedEntries.length > 0,
    encryption: encryptedEntries.length === 0 ? null : encryptedEntries.every((entry) => entry.zipCrypto) ? "zipcrypto" : "aes",
    entries: list,
    total_size: list.reduce((sum, entry) => sum + (entry.is_dir ? 0 : entry.size), 0),
    total_compressed: list.reduce((sum, entry) => sum + (entry.is_dir ? 0 : entry.compressed_size), 0),
    skipped,
  };

  const read = async (entryPath: string, password?: string): Promise<ArrayBuffer> => {
    const entry = files.get(entryPath);
    if (!entry) throw new LocalArchiveError("invalid_selection");
    if (entry.uncompressedSize > MAX_PREVIEW_BYTES) throw new LocalArchiveError("too_large");
    if (entry.encrypted && !password) throw new LocalArchiveError("password_required");

    const chunks: Uint8Array[] = [];
    let total = 0;
    const controller = new AbortController();
    const sink = new WritableStream<Uint8Array>({
      write(chunk) {
        total += chunk.byteLength;
        if (total > MAX_PREVIEW_BYTES || total > entry.uncompressedSize) {
          controller.abort();
          throw new LocalArchiveError(total > MAX_PREVIEW_BYTES ? "too_large" : "corrupt_archive");
        }
        chunks.push(chunk);
      },
    });

    try {
      await entry.getData(sink, { password: password || undefined, signal: controller.signal });
    } catch (error: any) {
      if (error instanceof LocalArchiveError) throw error;
      if (controller.signal.aborted) throw new LocalArchiveError(total > MAX_PREVIEW_BYTES ? "too_large" : "corrupt_archive");
      throw new LocalArchiveError(passwordErrorCode(error));
    }

    const output = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      output.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return output.buffer;
  };

  const checkPassword = async (password: string): Promise<void> => {
    const probe = Array.from(files.values()).filter((entry) => entry.encrypted)[0];
    if (!probe) return;
    try {
      await probe.getData(new WritableStream<Uint8Array>(), { password, checkPasswordOnly: true });
    } catch (error) {
      throw new LocalArchiveError(passwordErrorCode(error));
    }
  };

  return { listing, read, checkPassword, close: () => reader.close() };
}
