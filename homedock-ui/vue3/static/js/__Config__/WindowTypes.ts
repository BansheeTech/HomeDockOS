// homedock-ui/vue3/static/js/__Config__/WindowTypes.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import type { Component } from "vue";

export interface SystemApp {
  id: string;
  name: string;
  description: string;
  icon: any;
  component: Component;
  defaultWidth: number;
  defaultHeight: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  resizable: boolean;
  maximizable: boolean;
  minimizable: boolean;
  closeable: boolean;
  category: "system" | "tools" | "settings" | "media" | "utilities";
  showInStartMenu?: boolean;
  showInExplorerApp?: boolean;
  showInMyHomeApp?: boolean;
}
