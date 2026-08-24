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

export const FILE_ICONS: Record<string, any> = {
  folder: folderIcon,
  txt: textFileIcon,
  md: textFileIcon,
  pdf: pdfFileIcon,
  png: imageFileIcon,
  jpg: imageFileIcon,
  jpeg: imageFileIcon,
  gif: imageFileIcon,
  webp: imageFileIcon,
  mp4: videoFileIcon,
  mkv: videoFileIcon,
  avi: videoFileIcon,
  mp3: audioFileIcon,
  wav: audioFileIcon,
  flac: audioFileIcon,
  zip: zipFileIcon,
  rar: zipFileIcon,
  "7z": zipFileIcon,
  tar: zipFileIcon,
  gz: zipFileIcon,
  doc: wordFileIcon,
  docx: wordFileIcon,
  xls: excelFileIcon,
  xlsx: excelFileIcon,
  csv: excelFileIcon,
  ppt: powerpointFileIcon,
  pptx: powerpointFileIcon,
  js: codeFileIcon,
  ts: codeFileIcon,
  py: codeFileIcon,
  java: codeFileIcon,
  cpp: codeFileIcon,
  c: codeFileIcon,
  h: codeFileIcon,
  html: codeFileIcon,
  css: codeFileIcon,
  json: codeFileIcon,
  xml: codeFileIcon,
  sh: codeFileIcon,
  sql: codeFileIcon,
};

export const UNKNOWN_FILE_ICON = unknownFileIcon;
export const FOLDER_ICON = folderIcon;

export function fileIconFor(name: string, isDirectory = false): any {
  if (isDirectory) return folderIcon;

  const extension = name.split(".").pop()?.toLowerCase() || "";
  return FILE_ICONS[extension] || unknownFileIcon;
}
