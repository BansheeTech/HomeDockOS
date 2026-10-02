// homedock-ui/vue3/static/js/__Config__/AppStoreCategories.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import type { IconifyIcon } from "@iconify/vue";

import appsIcon from "@iconify-icons/mdi/apps";
import aiIcon from "@iconify-icons/mdi/robot-outline";
import devToolsIcon from "@iconify-icons/mdi/toolbox-outline";
import filesIcon from "@iconify-icons/mdi/file-document-outline";
import gamingIcon from "@iconify-icons/mdi/gamepad-variant-outline";
import homeAutomationIcon from "@iconify-icons/mdi/home-automation";
import mediaIcon from "@iconify-icons/mdi/movie-open-outline";
import networkingIcon from "@iconify-icons/mdi/lan";
import socialIcon from "@iconify-icons/mdi/message-text-outline";
import webDevIcon from "@iconify-icons/mdi/web";

interface CategoryStyle {
  icon: IconifyIcon;
  color: string;
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  AI: { icon: aiIcon, color: "#8b5cf6" },
  "Developer Tools": { icon: devToolsIcon, color: "#64748b" },
  "Files & Productivity": { icon: filesIcon, color: "#3b82f6" },
  Gaming: { icon: gamingIcon, color: "#f43f5e" },
  "Home & Automation": { icon: homeAutomationIcon, color: "#f97316" },
  Media: { icon: mediaIcon, color: "#ef4444" },
  Networking: { icon: networkingIcon, color: "#14b8a6" },
  Social: { icon: socialIcon, color: "#22c55e" },
  "Web Development": { icon: webDevIcon, color: "#6366f1" },
};

const FALLBACK_STYLE: CategoryStyle = { icon: appsIcon, color: "#6b7280" };

export function categoryStyle(category: string): CategoryStyle {
  return CATEGORY_STYLES[category] ?? FALLBACK_STYLE;
}
