// homedock-ui/vue3/static/js/__Composables__/useDesktopDragGhost.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { ref, computed, type ComputedRef, type CSSProperties } from "vue";
import type { DockerApp } from "../__Stores__/desktopStore";
import type { Position, UseDragGhostOptions, UseDragGhostReturn } from "./desktopDragTypes";

export function useDesktopDragGhost(options: UseDragGhostOptions = {}): UseDragGhostReturn {
  const { zIndex = 10000 } = options;

  // State
  const isVisible = ref(false);
  const position = ref<Position>({ x: 0, y: 0 });
  const items = ref<DockerApp[]>([]);

  // Computed Style
  const ghostStyle = computed<CSSProperties>(() => ({
    position: "fixed",
    left: `${position.value.x}px`,
    top: `${position.value.y}px`,
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
    zIndex,
  }));

  // Methods
  function show(apps: DockerApp[], pos: Position): void {
    items.value = apps;
    position.value = { x: pos.x, y: pos.y };
    isVisible.value = true;
  }

  function updatePosition(pos: Position): void {
    position.value = { x: pos.x, y: pos.y };
  }

  function hide(): void {
    isVisible.value = false;
    items.value = [];
  }

  // Return
  return {
    isVisible,
    position,
    items,
    ghostStyle,
    show,
    updatePosition,
    hide,
  };
}
