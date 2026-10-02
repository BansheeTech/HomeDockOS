// homedock-ui/vue3/static/js/__Config__/FileIcons.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import folderIcon from "@iconify-icons/mdi/folder";
import textFileIcon from "@iconify-icons/mdi/file-document";
import pdfFileIcon from "@iconify-icons/mdi/file-pdf-box";
import imageFileIcon from "@iconify-icons/mdi/file-image";
import videoFileIcon from "@iconify-icons/mdi/file-video";
import audioFileIcon from "@iconify-icons/mdi/file-music";
import zipFileIcon from "@iconify-icons/mdi/zip-box";
import excelFileIcon from "@iconify-icons/mdi/file-excel";
import powerpointFileIcon from "@iconify-icons/mdi/file-powerpoint";
import wordFileIcon from "@iconify-icons/mdi/file-word";
import codeFileIcon from "@iconify-icons/mdi/file-code";
import unknownFileIcon from "@iconify-icons/mdi/file";

import textGlyph from "@iconify-icons/mdi/text-long";
import pdfGlyph from "@iconify-icons/mdi/text-box";
import imageGlyph from "@iconify-icons/mdi/image";
import videoGlyph from "@iconify-icons/mdi/movie-open";
import audioGlyph from "@iconify-icons/mdi/music-note";
import archiveGlyph from "@iconify-icons/mdi/archive";
import wordGlyph from "@iconify-icons/mdi/format-text";
import sheetGlyph from "@iconify-icons/mdi/table";
import slidesGlyph from "@iconify-icons/mdi/presentation";
import codeGlyph from "@iconify-icons/mdi/code-braces";

import notebookIcon from "@iconify-icons/mdi/notebook";
import codeJsonIcon from "@iconify-icons/mdi/code-json";
import fileDocumentMultipleIcon from "@iconify-icons/mdi/file-document-multiple";
import imageMultipleIcon from "@iconify-icons/mdi/image-multiple";
import videoBoxIcon from "@iconify-icons/mdi/video-box";
import musicBoxMultipleIcon from "@iconify-icons/mdi/music-box-multiple";
import downloadBoxIcon from "@iconify-icons/mdi/download-box";

export const SPECIAL_FOLDER_ICONS: Record<string, any> = {
  Notes: notebookIcon,
  Sources: codeJsonIcon,
  Documents: fileDocumentMultipleIcon,
  Photos: imageMultipleIcon,
  Videos: videoBoxIcon,
  Music: musicBoxMultipleIcon,
  Downloads: downloadBoxIcon,
  Archives: zipFileIcon,
};

export interface FileKind {
  icon: any;
  glyph: any;
  color: string;
  extensions: string[];
}

const FILE_KINDS: FileKind[] = [
  { icon: textFileIcon, glyph: textGlyph, color: "#64748b", extensions: ["txt", "md", "log", "rtf"] },
  { icon: pdfFileIcon, glyph: pdfGlyph, color: "#dc2626", extensions: ["pdf"] },
  { icon: imageFileIcon, glyph: imageGlyph, color: "#0d9488", extensions: ["png", "jpg", "jpeg", "gif", "webp", "avif", "bmp", "svg", "ico", "tif", "tiff", "heic", "psd"] },
  { icon: videoFileIcon, glyph: videoGlyph, color: "#7c3aed", extensions: ["mp4", "mkv", "avi", "mov", "webm", "m4v", "wmv"] },
  { icon: audioFileIcon, glyph: audioGlyph, color: "#db2777", extensions: ["mp3", "wav", "flac", "ogg", "m4a", "aac", "opus"] },
  { icon: zipFileIcon, glyph: archiveGlyph, color: "#d97706", extensions: ["zip", "rar", "7z", "tar", "gz", "bz2", "xz", "tgz"] },
  { icon: wordFileIcon, glyph: wordGlyph, color: "#2563eb", extensions: ["doc", "docx", "odt"] },
  { icon: excelFileIcon, glyph: sheetGlyph, color: "#16a34a", extensions: ["xls", "xlsx", "csv", "ods"] },
  { icon: powerpointFileIcon, glyph: slidesGlyph, color: "#ea580c", extensions: ["ppt", "pptx", "odp"] },
  { icon: codeFileIcon, glyph: codeGlyph, color: "#0284c7", extensions: ["js", "ts", "py", "java", "cpp", "c", "h", "html", "css", "json", "xml", "sh", "sql", "yml", "yaml", "toml", "vue", "go", "rs", "php"] },
];

const UNKNOWN_KIND: FileKind = { icon: unknownFileIcon, glyph: null, color: "#94a3b8", extensions: [] };

const KINDS_BY_EXTENSION = new Map(FILE_KINDS.flatMap((kind) => kind.extensions.map((extension) => [extension, kind] as const)));

export const FILE_ICONS: Record<string, any> = {
  folder: folderIcon,
  ...Object.fromEntries([...KINDS_BY_EXTENSION].map(([extension, kind]) => [extension, kind.icon])),
};

export const UNKNOWN_FILE_ICON = unknownFileIcon;
export const FOLDER_ICON = folderIcon;

export function fileExtension(name: string): string {
  const base = name.split("/").pop() || name;
  const dot = base.lastIndexOf(".");
  return dot > 0 ? base.slice(dot + 1).toLowerCase() : "";
}

export function fileKindFor(name: string): FileKind {
  return KINDS_BY_EXTENSION.get(fileExtension(name)) || UNKNOWN_KIND;
}

export function fileIconFor(name: string, isDirectory = false): any {
  if (isDirectory) return folderIcon;

  return fileKindFor(name).icon;
}
