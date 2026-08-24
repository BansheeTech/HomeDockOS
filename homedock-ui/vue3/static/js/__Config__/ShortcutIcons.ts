// homedock-ui/vue3/static/js/__Config__/ShortcutIcons.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import webIcon from "@iconify-icons/mdi/web";
import githubIcon from "@iconify-icons/mdi/github";
import youtubeIcon from "@iconify-icons/mdi/youtube";
import emailIcon from "@iconify-icons/mdi/email";
import chatIcon from "@iconify-icons/mdi/chat";
import musicIcon from "@iconify-icons/mdi/music";
import movieIcon from "@iconify-icons/mdi/movie";
import bankIcon from "@iconify-icons/mdi/bank";
import cloudIcon from "@iconify-icons/mdi/cloud";
import newspaperIcon from "@iconify-icons/mdi/newspaper";
import gamepadIcon from "@iconify-icons/mdi/gamepad-variant";
import serverIcon from "@iconify-icons/mdi/server";
import cameraIcon from "@iconify-icons/mdi/camera";
import codeIcon from "@iconify-icons/mdi/code-braces";
import bookIcon from "@iconify-icons/mdi/book-open-variant";
import starIcon from "@iconify-icons/mdi/star";
import homeIcon from "@iconify-icons/mdi/home";

import { homedockIcon } from "./HomeDockIcon";
import { fileIconFor } from "./FileIcons";

export interface ShortcutPresetIcon {
  id: string;
  icon: any;
  label: string;
}

export const SHORTCUT_PRESET_ICONS: ShortcutPresetIcon[] = [
  { id: "web", icon: webIcon, label: "Website" },
  { id: "github", icon: githubIcon, label: "GitHub" },
  { id: "youtube", icon: youtubeIcon, label: "YouTube" },
  { id: "email", icon: emailIcon, label: "Email" },
  { id: "chat", icon: chatIcon, label: "Chat" },
  { id: "music", icon: musicIcon, label: "Music" },
  { id: "movie", icon: movieIcon, label: "Movies" },
  { id: "camera", icon: cameraIcon, label: "Photos" },
  { id: "bank", icon: bankIcon, label: "Finance" },
  { id: "cloud", icon: cloudIcon, label: "Cloud" },
  { id: "newspaper", icon: newspaperIcon, label: "News" },
  { id: "gamepad", icon: gamepadIcon, label: "Games" },
  { id: "server", icon: serverIcon, label: "Server" },
  { id: "code", icon: codeIcon, label: "Code" },
  { id: "book", icon: bookIcon, label: "Books" },
  { id: "star", icon: starIcon, label: "Important" },
  { id: "home", icon: homeIcon, label: "Home" },
  { id: "homedock", icon: homedockIcon, label: "HomeDock OS" },
];

export function getShortcutPresetIcon(id: string): any {
  return SHORTCUT_PRESET_ICONS.find((preset) => preset.id === id)?.icon || webIcon;
}

export function getShortcutIconUrl(iconValue: string): string {
  return `/api/shortcuts/icon/${iconValue}`;
}

export function getShortcutGlyph(shortcut?: { iconType: string; iconValue: string; target?: { isDirectory: boolean } }): any {
  if (!shortcut) return webIcon;
  if (shortcut.iconType === "file") {
    return fileIconFor(shortcut.iconValue, !!shortcut.target?.isDirectory);
  }
  return getShortcutPresetIcon(shortcut.iconValue);
}
