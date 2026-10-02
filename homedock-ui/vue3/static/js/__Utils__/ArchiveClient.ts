// homedock-ui/vue3/static/js/__Utils__/ArchiveClient.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import axios from "axios";

export type ArchiveSource = "storage" | "dropzone" | "appdrive" | "disksplus";

export interface ArchiveLocation {
  source: ArchiveSource;
  container?: string;
  mount?: number;
  disk?: string;
}

export interface ArchiveGuard {
  absolutePath: string;
  scope?: string;
}

export interface ArchiveFileRef {
  name: string;
  path: string;
  location: ArchiveLocation;
  guard?: ArchiveGuard;
}

export type ArchiveSkipReason = "unsafe_path" | "reserved_name" | "invalid_name" | "duplicate" | "conflict" | "link" | "special_file" | "suspicious_ratio" | "encrypted_unsupported";

export interface ArchiveEntry {
  path: string;
  name: string;
  is_dir: boolean;
  size: number;
  compressed_size: number;
  modified: number | null;
  encrypted: boolean;
  skip: ArchiveSkipReason | null;
}

export interface ArchiveListing {
  kind: "zip" | "tar";
  name: string;
  size: number;
  encrypted: boolean;
  encryption: null | "zipcrypto" | "aes";
  entries: ArchiveEntry[];
  total_size: number;
  total_compressed: number;
  skipped: number;
}

export type ArchiveJobKind = "extract" | "compress";
export type ArchiveJobState = "running" | "done" | "error" | "canceled";

export interface ArchiveJobResult {
  name: string;
  path: string;
  is_dir: boolean;
  skipped: number;
}

export interface ArchiveJobStatus {
  id: string;
  kind: ArchiveJobKind;
  state: ArchiveJobState;
  processed_bytes: number;
  total_bytes: number;
  processed_files: number;
  total_files: number;
  current: string | null;
  result: ArchiveJobResult | null;
  error: string | null;
}

const ARCHIVE_SUFFIXES = [".tar.gz", ".tgz", ".tar", ".zip"];

export const MAX_ARCHIVE_PASSWORD_LENGTH = 64;
export const MAX_UNLOCK_PASSWORD_LENGTH = 1024;

export function isArchiveName(name: string): boolean {
  const lower = name.toLowerCase();
  return ARCHIVE_SUFFIXES.some((suffix) => lower.endsWith(suffix));
}

export function isZipName(name: string): boolean {
  return name.toLowerCase().endsWith(".zip");
}

export async function normalizeBinaryError(error: any): Promise<any> {
  const data = error?.response?.data;
  try {
    if (data instanceof Blob) error.response.data = JSON.parse(await data.text());
    else if (data instanceof ArrayBuffer) error.response.data = JSON.parse(new TextDecoder().decode(data));
  } catch {}
  return error;
}

function headers(csrfToken: string) {
  return { "X-HomeDock-CSRF-Token": csrfToken };
}

export async function listArchive(file: ArchiveFileRef, csrfToken: string, password?: string): Promise<ArchiveListing> {
  const response = await axios.post("/api/archive/list", { location: file.location, path: file.path, password: password || undefined }, { headers: headers(csrfToken) });
  return response.data;
}

export async function readArchiveEntry(file: ArchiveFileRef, entry: string, csrfToken: string, password?: string): Promise<ArrayBuffer> {
  try {
    const response = await axios.post("/api/archive/entry", { location: file.location, path: file.path, entry, password: password || undefined }, { headers: headers(csrfToken), responseType: "arraybuffer" });
    return response.data;
  } catch (error) {
    throw await normalizeBinaryError(error);
  }
}

export async function startExtract(file: ArchiveFileRef, csrfToken: string, entries?: string[] | null, password?: string): Promise<string> {
  const response = await axios.post("/api/archive/extract", { location: file.location, path: file.path, entries: entries?.length ? entries : null, password: password || undefined }, { headers: headers(csrfToken) });
  return response.data.job_id;
}

export async function startCompress(location: ArchiveLocation, folder: string, names: string[], csrfToken: string, password?: string): Promise<string> {
  const response = await axios.post("/api/archive/compress", { location, folder, names, password: password || undefined }, { headers: headers(csrfToken) });
  return response.data.job_id;
}

export async function fetchArchiveJob(id: string, csrfToken: string): Promise<ArchiveJobStatus> {
  const response = await axios.get("/api/archive/job", { params: { id }, headers: headers(csrfToken) });
  return response.data;
}

export async function cancelArchiveJob(id: string, csrfToken: string): Promise<void> {
  await axios.post("/api/archive/cancel", { id }, { headers: headers(csrfToken) });
}

export function parentFolder(path: string): string {
  const parts = path.split("/").filter(Boolean);
  parts.pop();
  return parts.join("/");
}

export function baseName(path: string): string {
  return path.split("/").filter(Boolean).pop() || path;
}

export function sameLocation(a: ArchiveLocation, b: ArchiveLocation): boolean {
  return a.source === b.source && (a.container || "") === (b.container || "") && (a.mount ?? 0) === (b.mount ?? 0) && (a.disk || "") === (b.disk || "");
}

export const ARCHIVE_ERROR_MESSAGES: Record<string, string> = {
  not_an_archive: "This file isn't a valid archive.",
  unsupported_format: "This archive format isn't supported. Zipfile opens ZIP and TAR archives.",
  unsupported_location: "Archives can't be opened from this location.",
  password_required: "Enter the archive password to continue.",
  wrong_password: "The password is incorrect.",
  too_many_entries: "This archive has more than 50,000 items.",
  too_large: "This archive is too large to extract here.",
  insufficient_space: "There isn't enough free space to extract this archive.",
  suspicious_ratio: "This archive expands to a suspicious size and was blocked to protect your server.",
  overlapping_entries: "This archive is malformed and was blocked to protect your server.",
  corrupt_archive: "This archive is damaged and can't be read.",
  invalid_selection: "Some of the selected items aren't in the archive.",
  not_found: "The archive no longer exists.",
  busy: "Two archive tasks are already running. Try again when one finishes.",
  unlock_required: "This location is locked. Unlock it in File Explorer and try again.",
  invalid_path: "This path isn't valid.",
  timeout: "The archive took too long to process and was stopped.",
  io_error: "The disk reported an error while writing the files.",
  security_violation: "This path goes through a link and was blocked to protect your server.",
  read_only: "This location is read-only.",
  password_too_long: "The password can't be longer than 64 characters.",
  canceled: "Canceled.",
};

export function archiveErrorCode(error: any): string {
  const data = error?.response?.data;
  if (error?.response?.status === 403 && typeof data?.error === "string" && data.error.toLowerCase().includes("read-only")) return "read_only";
  if (data && typeof data === "object" && typeof data.error === "string") return data.error;
  return "unknown";
}

export function archiveErrorMessage(code: string): string {
  return ARCHIVE_ERROR_MESSAGES[code] || "Something went wrong with this archive.";
}
