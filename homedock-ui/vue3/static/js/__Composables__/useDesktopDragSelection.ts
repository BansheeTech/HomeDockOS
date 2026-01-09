// homedock-ui/vue3/static/js/__Composables__/useDesktopDragSelection.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { ref, computed, watch, onUnmounted, type CSSProperties } from "vue";

import type { DragItem, DragItemType, SelectionState, BoxSelection, UseDragSelectionOptions, UseDragSelectionReturn, Rect } from "./desktopDragTypes";

import { rectsIntersect } from "./desktopDragTypes";

export function useDesktopDragSelection(options: UseDragSelectionOptions): UseDragSelectionReturn {
  const { containerRef, gridConfig, enableBoxSelection = true, enableMultiSelect = true, onSelectionChange } = options;

  // State
  const selectedApp = ref<string | null>(null);
  const selectedFolder = ref<string | null>(null);
  const selectedSystemIcon = ref<string | null>(null);

  const selectedApps = ref<Set<string>>(new Set());
  const selectedFolders = ref<Set<string>>(new Set());
  const selectedSystemIcons = ref<Set<string>>(new Set());

  const isSelectingArea = ref(false);
  const selectionBox = ref({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });

  const selection = computed<SelectionState>(() => ({
    selectedApp: selectedApp.value,
    selectedFolder: selectedFolder.value,
    selectedSystemIcon: selectedSystemIcon.value,
    selectedApps: selectedApps.value,
    selectedFolders: selectedFolders.value,
    selectedSystemIcons: selectedSystemIcons.value,
  }));

  const boxSelection = computed<BoxSelection>(() => ({
    isSelecting: isSelectingArea.value,
    startX: selectionBox.value.startX,
    startY: selectionBox.value.startY,
    currentX: selectionBox.value.currentX,
    currentY: selectionBox.value.currentY,
  }));

  let isBoxSelectionActive = false;

  // Selection Box Style
  const selectionBoxStyle = computed<CSSProperties>(() => {
    if (!isSelectingArea.value) {
      return { display: "none" };
    }

    const x = Math.min(selectionBox.value.startX, selectionBox.value.currentX);
    const y = Math.min(selectionBox.value.startY, selectionBox.value.currentY);
    const width = Math.abs(selectionBox.value.currentX - selectionBox.value.startX);
    const height = Math.abs(selectionBox.value.currentY - selectionBox.value.startY);

    return {
      position: "absolute",
      left: `${x}px`,
      top: `${y}px`,
      width: `${width}px`,
      height: `${height}px`,
      pointerEvents: "none",
      zIndex: 100,
    };
  });

  // Notify on selection change
  watch(
    selection,
    (newState) => {
      if (onSelectionChange) {
        onSelectionChange(newState);
      }
    },
    { deep: true }
  );

  // Selection Methods
  function selectItem(item: DragItem, opts?: { ctrl?: boolean }): void {
    const isCtrl = opts?.ctrl ?? false;

    if (isCtrl && enableMultiSelect) {
      toggleItemInMultiSelection(item);
    } else {
      clearAllSelections();
      setSingleSelection(item);
    }
  }

  function toggleItemInMultiSelection(item: DragItem): void {
    const set = getMultiSelectionSet(item.type);
    if (set.has(item.id)) {
      set.delete(item.id);
    } else {
      set.add(item.id);
    }
    clearSingleSelection(item.type);
  }

  function setSingleSelection(item: DragItem): void {
    switch (item.type) {
      case "app":
        selectedApp.value = item.id;
        break;
      case "folder":
        selectedFolder.value = item.id;
        break;
      case "systemicon":
        selectedSystemIcon.value = item.id;
        break;
    }
  }

  function getMultiSelectionSet(type: DragItemType): Set<string> {
    switch (type) {
      case "app":
        return selectedApps.value;
      case "folder":
        return selectedFolders.value;
      case "systemicon":
        return selectedSystemIcons.value;
    }
  }

  function clearSingleSelection(type: DragItemType): void {
    switch (type) {
      case "app":
        selectedApp.value = null;
        break;
      case "folder":
        selectedFolder.value = null;
        break;
      case "systemicon":
        selectedSystemIcon.value = null;
        break;
    }
  }

  function clearAllSelections(): void {
    selectedApp.value = null;
    selectedApps.value.clear();
    selectedFolder.value = null;
    selectedFolders.value.clear();
    selectedSystemIcon.value = null;
    selectedSystemIcons.value.clear();
  }

  function clearSelection(): void {
    clearAllSelections();
  }

  function clearSelectionByType(type: DragItemType): void {
    switch (type) {
      case "app":
        selectedApp.value = null;
        selectedApps.value.clear();
        break;
      case "folder":
        selectedFolder.value = null;
        selectedFolders.value.clear();
        break;
      case "systemicon":
        selectedSystemIcon.value = null;
        selectedSystemIcons.value.clear();
        break;
    }
  }

  function isSelected(item: DragItem): boolean {
    switch (item.type) {
      case "app":
        return selectedApp.value === item.id || selectedApps.value.has(item.id);
      case "folder":
        return selectedFolder.value === item.id || selectedFolders.value.has(item.id);
      case "systemicon":
        return selectedSystemIcon.value === item.id || selectedSystemIcons.value.has(item.id);
    }
  }

  function getSelectedItems(): DragItem[] {
    const items: DragItem[] = [];

    if (selectedApp.value) {
      items.push({ type: "app", id: selectedApp.value });
    }
    selectedApps.value.forEach((id) => {
      if (id !== selectedApp.value) {
        items.push({ type: "app", id });
      }
    });

    if (selectedFolder.value) {
      items.push({ type: "folder", id: selectedFolder.value });
    }
    selectedFolders.value.forEach((id) => {
      if (id !== selectedFolder.value) {
        items.push({ type: "folder", id });
      }
    });

    if (selectedSystemIcon.value) {
      items.push({ type: "systemicon", id: selectedSystemIcon.value });
    }
    selectedSystemIcons.value.forEach((id) => {
      if (id !== selectedSystemIcon.value) {
        items.push({ type: "systemicon", id });
      }
    });

    return items;
  }

  function getSelectedItemsByType(type: DragItemType): string[] {
    const ids: string[] = [];

    switch (type) {
      case "app":
        if (selectedApp.value) ids.push(selectedApp.value);
        selectedApps.value.forEach((id) => {
          if (!ids.includes(id)) ids.push(id);
        });
        break;
      case "folder":
        if (selectedFolder.value) ids.push(selectedFolder.value);
        selectedFolders.value.forEach((id) => {
          if (!ids.includes(id)) ids.push(id);
        });
        break;
      case "systemicon":
        if (selectedSystemIcon.value) ids.push(selectedSystemIcon.value);
        selectedSystemIcons.value.forEach((id) => {
          if (!ids.includes(id)) ids.push(id);
        });
        break;
    }

    return ids;
  }

  // Box Selection Methods
  function startBoxSelection(x: number, y: number): void {
    if (!enableBoxSelection) return;

    isSelectingArea.value = true;
    selectionBox.value.startX = x;
    selectionBox.value.startY = y;
    selectionBox.value.currentX = x;
    selectionBox.value.currentY = y;

    clearAllSelections();

    isBoxSelectionActive = true;
    document.addEventListener("mousemove", handleGlobalMouseMove);
    document.addEventListener("mouseup", handleGlobalMouseUp);
  }

  function updateBoxSelection(x: number, y: number): void {
    if (!isSelectingArea.value) return;

    selectionBox.value.currentX = x;
    selectionBox.value.currentY = y;
  }

  function endBoxSelection(items: Array<{ item: DragItem; x: number; y: number }>): void {
    if (!isSelectingArea.value) return;

    const boxRect = getBoxRect();

    items.forEach(({ item, x, y }) => {
      const itemRect: Rect = {
        left: x,
        top: y,
        right: x + gridConfig.value.iconWidth,
        bottom: y + gridConfig.value.iconHeight,
      };

      if (rectsIntersect(boxRect, itemRect)) {
        getMultiSelectionSet(item.type).add(item.id);
      }
    });

    isSelectingArea.value = false;
    cleanupBoxSelectionListeners();
  }

  function getBoxRect(): Rect {
    const x = Math.min(boxSelection.value.startX, boxSelection.value.currentX);
    const y = Math.min(boxSelection.value.startY, boxSelection.value.currentY);
    const width = Math.abs(boxSelection.value.currentX - boxSelection.value.startX);
    const height = Math.abs(boxSelection.value.currentY - boxSelection.value.startY);

    return {
      left: x,
      top: y,
      right: x + width,
      bottom: y + height,
    };
  }

  function handleGlobalMouseMove(e: MouseEvent): void {
    if (!isSelectingArea.value || !containerRef.value) return;

    const containerRect = containerRef.value.getBoundingClientRect();
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;

    updateBoxSelection(x, y);
  }

  function handleGlobalMouseUp(_e: MouseEvent): void {
    if (!isSelectingArea.value) return;

    isSelectingArea.value = false;
    cleanupBoxSelectionListeners();
  }

  function cleanupBoxSelectionListeners(): void {
    if (isBoxSelectionActive) {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
      isBoxSelectionActive = false;
    }
  }

  // Event Handlers
  function handleItemClick(item: DragItem, event: MouseEvent): void {
    const isCtrl = event.ctrlKey || event.metaKey;
    selectItem(item, { ctrl: isCtrl });
  }

  function handleContainerMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return;

    const target = event.target as HTMLElement;
    if (!target.classList.contains("desktop-icons-container") && !target.classList.contains("folder-apps-grid")) {
      return;
    }

    if (!containerRef.value) return;

    const containerRect = containerRef.value.getBoundingClientRect();
    const x = event.clientX - containerRect.left;
    const y = event.clientY - containerRect.top;

    startBoxSelection(x, y);
  }

  // Cleanup
  onUnmounted(() => {
    cleanupBoxSelectionListeners();
  });

  // Return
  return {
    selectedApp,
    selectedApps,
    selectedFolder,
    selectedFolders,
    selectedSystemIcon,
    selectedSystemIcons,
    isSelectingArea,
    selectionBox,
    selection,
    boxSelection,
    selectionBoxStyle,
    selectItem,
    clearSelection,
    clearSelectionByType,
    isSelected,
    getSelectedItems,
    getSelectedItemsByType,
    startBoxSelection,
    updateBoxSelection,
    endBoxSelection,
    handleItemClick,
    handleContainerMouseDown,
  };
}
