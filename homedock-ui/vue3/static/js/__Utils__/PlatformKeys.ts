// homedock-ui/vue3/static/js/__Utils__/PlatformKeys.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

const isApplePlatform = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

export const MODIFIER_KEY = isApplePlatform ? "⌘" : "Ctrl";

export function shortcutLabel(key: string): string {
  return isApplePlatform ? `${MODIFIER_KEY}${key}` : `${MODIFIER_KEY}+${key}`;
}
