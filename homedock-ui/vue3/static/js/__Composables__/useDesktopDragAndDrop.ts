// homedock-ui/vue3/static/js/__Composables__/useDesktopDragAndDrop.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { ref, computed, onUnmounted } from "vue";

import { useDesktopStore, type DesktopFolder } from "../__Stores__/desktopStore";

import { useResponsive } from "./useResponsive";

import type { DragItem, Position, GridPosition, DropInfo, UseDragAndDropOptions, UseDragAndDropReturn } from "./desktopDragTypes";
import { getDragItemKey, parseDragItemKey } from "./desktopDragTypes";

export function useDesktopDragAndDrop(options: UseDragAndDropOptions): UseDragAndDropReturn {
  const {
    mode,
    containerId,
    containerRef,
    gridConfig,
    selection,
    dragThreshold = 5,
    folderDropThreshold = 80,
    enableMobileDrag = true,
    onDragStart,
    onDragMove,
    onDragEnd,
    onDropOnFolder,

    onMobileTap,
    onMobileDoubleTap,
    onMobileLongPress,
    longPressDuration = 500,
    doubleTapThreshold = 300,
  } = options;

  const desktopStore = useDesktopStore();
  const { isMobile } = useResponsive();

  // State
  const isDragging = ref(false);
  const hasMoved = ref(false);
  const currentDragItem = ref<DragItem | null>(null);
  const draggedItemsInitialPositions = ref<Map<string, GridPosition>>(new Map());
  const dragStartMousePos = ref<Position>({ x: 0, y: 0 });
  const dragStartIconPos = ref<Position>({ x: 0, y: 0 });

  // Mobile gesture tracking
  let longPressTimer: ReturnType<typeof setTimeout> | null = null;
  let touchStartPos: Position = { x: 0, y: 0 };
  let lastTapTime = 0;
  let lastTapItem: DragItem | null = null;
  let touchGestureMoved = false;
  let currentTouchItem: DragItem | null = null;
  const GESTURE_MOVE_THRESHOLD = 10;

  // Items getters
  const mainDockerApps = computed(() => {
    if (containerId === "desktop") {
      return desktopStore.desktopRootApps;
    } else {
      return desktopStore.getAppsInFolder(containerId);
    }
  });

  const desktopFolders = computed(() => desktopStore.desktopFolders);
  const systemDesktopIcons = computed(() => desktopStore.systemDesktopIcons);

  // Grid Utilities
  function snapToGrid(x: number, y: number): GridPosition {
    const { sizeX, sizeY, padding } = gridConfig.value;

    const col = Math.round((x - padding) / sizeX);
    const row = Math.round((y - padding) / sizeY);

    return {
      x: padding + col * sizeX,
      y: padding + row * sizeY,
      row: Math.max(0, row),
      col: Math.max(0, col),
    };
  }

  function isPositionOccupied(x: number, y: number, excludeAppId?: string, excludeAppIds?: Set<string>, excludeFolderId?: string, excludeFolderIds?: Set<string>, excludeSystemIconId?: string, excludeSystemIconIds?: Set<string>): boolean {
    const { sizeX, sizeY } = gridConfig.value;

    if (containerId === "desktop") {
      const appCollision = mainDockerApps.value.some((app) => {
        if (excludeAppId && app.id === excludeAppId) return false;
        if (excludeAppIds && excludeAppIds.has(app.id)) return false;
        if (app.x === undefined || app.y === undefined) return false;

        const dx = Math.abs(app.x - x);
        const dy = Math.abs(app.y - y);
        return dx < sizeX && dy < sizeY;
      });

      if (appCollision) return true;

      const folderCollision = desktopFolders.value.some((folder) => {
        if (excludeFolderId && folder.id === excludeFolderId) return false;
        if (excludeFolderIds && excludeFolderIds.has(folder.id)) return false;
        if (folder.x === undefined || folder.y === undefined) return false;

        const dx = Math.abs(folder.x - x);
        const dy = Math.abs(folder.y - y);
        return dx < sizeX && dy < sizeY;
      });

      if (folderCollision) return true;

      const systemiconCollision = systemDesktopIcons.value.some((icon) => {
        if (excludeSystemIconId && icon.id === excludeSystemIconId) return false;
        if (excludeSystemIconIds && excludeSystemIconIds.has(icon.id)) return false;
        if (icon.x === undefined || icon.y === undefined) return false;

        const dx = Math.abs(icon.x - x);
        const dy = Math.abs(icon.y - y);
        return dx < sizeX && dy < sizeY;
      });

      return systemiconCollision;
    }

    return false;
  }

  function findNextAvailablePosition(startRow = 0, startCol = 0): GridPosition {
    const { sizeX, sizeY, padding } = gridConfig.value;
    const containerWidth = containerRef.value?.clientWidth || window.innerWidth;
    const maxCols = Math.floor((containerWidth - padding * 2) / sizeX);

    let row = startRow;
    let col = startCol;

    while (true) {
      const x = padding + col * sizeX;
      const y = padding + row * sizeY;

      if (!isPositionOccupied(x, y)) {
        return { x, y, row, col };
      }

      col++;
      if (col >= maxCols) {
        col = 0;
        row++;
      }

      if (row * maxCols + col > 1000) {
        console.warn("Max grid positions reached, placing at default position");
        return { x, y, row, col };
      }
    }
  }

  function checkDropOnFolder(x: number, y: number): DesktopFolder | null {
    for (const folder of desktopFolders.value) {
      if (folder.x === undefined || folder.y === undefined) continue;

      const folderCenterX = folder.x + 50;
      const folderCenterY = folder.y + 65;

      const dx = Math.abs(folderCenterX - x);
      const dy = Math.abs(folderCenterY - y);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < folderDropThreshold) {
        return folder;
      }
    }

    return null;
  }

  // Position Management
  function getItemPosition(item: DragItem): Position | null {
    const { sizeX, sizeY, padding } = gridConfig.value;
    let found: any = null;

    if (item.type === "app") {
      found = mainDockerApps.value.find((a) => a.id === item.id);
    } else if (item.type === "folder") {
      found = desktopFolders.value.find((f) => f.id === item.id);
    } else if (item.type === "systemicon") {
      found = systemDesktopIcons.value.find((s) => s.id === item.id);
    }

    if (!found) return null;

    if (found.x !== undefined && found.y !== undefined) {
      return { x: found.x, y: found.y };
    } else if (found.gridRow !== undefined && found.gridCol !== undefined) {
      return {
        x: padding + found.gridCol * sizeX,
        y: padding + found.gridRow * sizeY,
      };
    }

    return { x: 0, y: 0 };
  }

  function getItemStyle(item: DragItem, extraStyles?: Record<string, any>): Record<string, any> {
    const pos = getItemPosition(item);
    if (!pos) return extraStyles || {};

    return {
      position: "absolute",
      left: `${pos.x}px`,
      top: `${pos.y}px`,
      ...extraStyles,
    };
  }

  function updateItemPosition(item: DragItem, pos: GridPosition): void {
    desktopStore.updateItemPosition(item.type, item.id, pos.x, pos.y, pos.row, pos.col);
  }

  // Drag Lifecycle
  function startDrag(item: DragItem, clientX: number, clientY: number): void {
    if (isMobile.value && !enableMobileDrag) {
      return;
    }

    currentDragItem.value = item;
    isDragging.value = true;
    hasMoved.value = false;

    dragStartMousePos.value = { x: clientX, y: clientY };

    const itemPos = getItemPosition(item);
    if (itemPos) {
      dragStartIconPos.value = { x: itemPos.x, y: itemPos.y };
    }

    draggedItemsInitialPositions.value.clear();

    const allSelected = getSelectedItems();
    const isMultiSelect = allSelected.length > 1 && allSelected.some((i) => i.type === item.type && i.id === item.id);

    if (isMultiSelect) {
      allSelected.forEach((selectedItem) => {
        const pos = getItemPosition(selectedItem);
        if (pos) {
          const key = getDragItemKey(selectedItem);
          draggedItemsInitialPositions.value.set(key, {
            x: pos.x,
            y: pos.y,
            row: 0,
            col: 0,
          });
        }
      });
    } else {
      const pos = getItemPosition(item);
      if (pos) {
        const key = getDragItemKey(item);
        draggedItemsInitialPositions.value.set(key, {
          x: pos.x,
          y: pos.y,
          row: 0,
          col: 0,
        });
      }
    }

    if (mode === "ghost" && item.type === "app") {
      const appIds = isMultiSelect ? allSelected.filter((i) => i.type === "app").map((i) => i.id) : [item.id];
      desktopStore.setDraggedApps(appIds, containerId);
    }

    onDragStart?.(item);
  }

  function getSelectedItems(): DragItem[] {
    const items: DragItem[] = [];
    const sel = selection.value;

    sel.selectedApps.forEach((id) => items.push({ type: "app", id }));
    sel.selectedFolders.forEach((id) => items.push({ type: "folder", id }));
    sel.selectedSystemIcons.forEach((id) => items.push({ type: "systemicon", id }));

    return items;
  }

  function updateDrag(clientX: number, clientY: number): void {
    if (!isDragging.value) return;

    const deltaX = clientX - dragStartMousePos.value.x;
    const deltaY = clientY - dragStartMousePos.value.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > dragThreshold) {
      hasMoved.value = true;

      if (mode === "direct") {
        moveAllDraggedItems(deltaX, deltaY);
      }

      if (currentDragItem.value) {
        onDragMove?.(currentDragItem.value, { x: clientX, y: clientY });
      }
    }
  }

  function moveAllDraggedItems(deltaX: number, deltaY: number): void {
    const containerWidth = containerRef.value?.clientWidth || window.innerWidth;
    const containerHeight = containerRef.value?.clientHeight || window.innerHeight;
    const { iconWidth, iconHeight, padding } = gridConfig.value;

    draggedItemsInitialPositions.value.forEach((initialPos, key) => {
      const item = parseDragItemKey(key);

      let newX = initialPos.x + deltaX;
      let newY = initialPos.y + deltaY;

      newX = Math.max(padding, Math.min(newX, containerWidth - iconWidth - padding));
      newY = Math.max(padding, Math.min(newY, containerHeight - iconHeight - padding));

      updateItemPosition(item, { x: newX, y: newY, row: 0, col: 0 });
    });
  }

  function endDrag(): DropInfo | null {
    if (!currentDragItem.value) {
      isDragging.value = false;
      hasMoved.value = false;
      return null;
    }

    const mainItem = currentDragItem.value;
    let finalPosition: GridPosition | null = null;
    let targetFolder: DesktopFolder | null = null;

    if (hasMoved.value && mode === "direct") {
      if (mainItem.type === "app") {
        const mainPos = getItemPosition(mainItem);
        if (mainPos) {
          targetFolder = checkDropOnFolder(mainPos.x + 50, mainPos.y + 65);

          if (targetFolder) {
            const allSelected = getSelectedItems();
            const appIds = allSelected.length > 1 && allSelected.some((i) => i.type === "app" && i.id === mainItem.id) ? allSelected.filter((i) => i.type === "app").map((i) => i.id) : [mainItem.id];

            onDropOnFolder?.(targetFolder, appIds);
          }
        }
      }

      if (!targetFolder) {
        finalPosition = endDragWithSnapping();
      }
    }

    const dropInfo: DropInfo = {
      item: mainItem,
      finalPosition: finalPosition || { x: 0, y: 0, row: 0, col: 0 },
      targetFolder,
      wasMultiSelect: draggedItemsInitialPositions.value.size > 1,
      allDroppedItems: Array.from(draggedItemsInitialPositions.value.keys()).map(parseDragItemKey),
    };

    if (mode === "ghost") {
      desktopStore.clearDraggedApps();
    }

    currentDragItem.value = null;
    draggedItemsInitialPositions.value.clear();
    isDragging.value = false;
    hasMoved.value = false;

    onDragEnd?.(dropInfo);

    return dropInfo;
  }

  function endDragWithSnapping(): GridPosition | null {
    const mainItem = currentDragItem.value;
    if (!mainItem) return null;

    if (draggedItemsInitialPositions.value.size > 1) {
      return endMultiSelectDrag();
    }

    const mainPos = getItemPosition(mainItem);
    if (!mainPos) return null;

    let snapped = snapToGrid(mainPos.x, mainPos.y);

    let attempts = 0;
    const excludeId = mainItem.type === "app" ? mainItem.id : mainItem.type === "folder" ? mainItem.id : mainItem.type === "systemicon" ? mainItem.id : undefined;

    while (isPositionOccupied(snapped.x, snapped.y, mainItem.type === "app" ? excludeId : undefined, undefined, mainItem.type === "folder" ? excludeId : undefined, undefined, mainItem.type === "systemicon" ? excludeId : undefined) && attempts < 20) {
      const nextPos = findNextAvailablePosition();
      snapped = nextPos;
      attempts++;
    }

    updateItemPosition(mainItem, snapped);
    return snapped;
  }

  function endMultiSelectDrag(): GridPosition | null {
    const mainItem = currentDragItem.value;
    if (!mainItem) return null;

    const mainKey = getDragItemKey(mainItem);
    const mainInitialPos = draggedItemsInitialPositions.value.get(mainKey);
    const mainCurrentPos = getItemPosition(mainItem);

    if (!mainInitialPos || !mainCurrentPos) return null;

    const mainSnapped = snapToGrid(mainCurrentPos.x, mainCurrentPos.y);
    let totalDeltaX = mainSnapped.x - mainInitialPos.x;
    let totalDeltaY = mainSnapped.y - mainInitialPos.y;

    const containerWidth = containerRef.value?.clientWidth || window.innerWidth;
    const containerHeight = containerRef.value?.clientHeight || window.innerHeight;
    const { iconWidth, iconHeight, padding } = gridConfig.value;
    const maxX = containerWidth - iconWidth - padding;
    const maxY = containerHeight - iconHeight - padding;

    draggedItemsInitialPositions.value.forEach((initialPos) => {
      const potentialX = initialPos.x + totalDeltaX;
      const potentialY = initialPos.y + totalDeltaY;

      if (potentialX < padding) {
        totalDeltaX = Math.max(totalDeltaX, padding - initialPos.x);
      }
      if (potentialY < padding) {
        totalDeltaY = Math.max(totalDeltaY, padding - initialPos.y);
      }
      if (potentialX > maxX) {
        totalDeltaX = Math.min(totalDeltaX, maxX - initialPos.x);
      }
      if (potentialY > maxY) {
        totalDeltaY = Math.min(totalDeltaY, maxY - initialPos.y);
      }
    });

    const snappedPositions = new Map<string, GridPosition>();
    draggedItemsInitialPositions.value.forEach((initialPos, key) => {
      const newX = initialPos.x + totalDeltaX;
      const newY = initialPos.y + totalDeltaY;
      snappedPositions.set(key, snapToGrid(newX, newY));
    });

    let hasInternalCollision = false;
    const occupiedPositions = new Set<string>();
    snappedPositions.forEach((pos) => {
      const posKey = `${pos.x},${pos.y}`;
      if (occupiedPositions.has(posKey)) {
        hasInternalCollision = true;
      } else {
        occupiedPositions.add(posKey);
      }
    });

    const excludeAppIds = new Set<string>();
    const excludeFolderIds = new Set<string>();
    const excludeSystemIconIds = new Set<string>();
    draggedItemsInitialPositions.value.forEach((_, key) => {
      const item = parseDragItemKey(key);
      if (item.type === "app") excludeAppIds.add(item.id);
      else if (item.type === "folder") excludeFolderIds.add(item.id);
      else if (item.type === "systemicon") excludeSystemIconIds.add(item.id);
    });

    let hasExternalCollision = false;
    snappedPositions.forEach((pos) => {
      if (isPositionOccupied(pos.x, pos.y, undefined, excludeAppIds, undefined, excludeFolderIds, undefined, excludeSystemIconIds)) {
        hasExternalCollision = true;
      }
    });

    if (hasInternalCollision || hasExternalCollision) {
      snappedPositions.clear();
      draggedItemsInitialPositions.value.forEach((initialPos, key) => {
        snappedPositions.set(key, snapToGrid(initialPos.x, initialPos.y));
      });
    }

    snappedPositions.forEach((pos, key) => {
      const item = parseDragItemKey(key);
      updateItemPosition(item, pos);
    });

    return snappedPositions.get(mainKey) || null;
  }

  function cancelDrag(): void {
    draggedItemsInitialPositions.value.forEach((initialPos, key) => {
      const item = parseDragItemKey(key);
      updateItemPosition(item, initialPos);
    });

    if (mode === "ghost") {
      desktopStore.clearDraggedApps();
    }

    currentDragItem.value = null;
    draggedItemsInitialPositions.value.clear();
    isDragging.value = false;
    hasMoved.value = false;
  }

  // Event Handlers
  let globalMoveHandler: ((e: MouseEvent) => void) | null = null;
  let globalUpHandler: ((e: MouseEvent) => void) | null = null;
  let globalTouchMoveHandler: ((e: TouchEvent) => void) | null = null;
  let globalTouchEndHandler: ((e: TouchEvent) => void) | null = null;

  function handleMouseDown(event: MouseEvent, item: DragItem): void {
    if (event.button !== 0) return;

    event.preventDefault();
    startDrag(item, event.clientX, event.clientY);

    globalMoveHandler = (e: MouseEvent) => updateDrag(e.clientX, e.clientY);
    globalUpHandler = (_e: MouseEvent) => {
      endDrag();
      cleanupMouseListeners();
    };

    document.addEventListener("mousemove", globalMoveHandler);
    document.addEventListener("mouseup", globalUpHandler);
  }

  function handleTouchStart(event: TouchEvent, item: DragItem): void {
    if (event.touches.length !== 1) return;

    const touch = event.touches[0];

    touchStartPos = { x: touch.clientX, y: touch.clientY };
    touchGestureMoved = false;
    currentTouchItem = item;

    startDrag(item, touch.clientX, touch.clientY);

    if (isMobile.value && onMobileLongPress) {
      longPressTimer = setTimeout(() => {
        if (!touchGestureMoved && currentTouchItem) {
          onMobileLongPress(currentTouchItem, event);

          if (navigator.vibrate) {
            navigator.vibrate(50);
          }

          currentTouchItem = null;
          cancelDrag();
        }
      }, longPressDuration);
    }

    globalTouchMoveHandler = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;

      const t = e.touches[0];

      const deltaX = t.clientX - touchStartPos.x;
      const deltaY = t.clientY - touchStartPos.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > GESTURE_MOVE_THRESHOLD) {
        touchGestureMoved = true;

        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
      }

      if (enableMobileDrag && touchGestureMoved) {
        e.preventDefault();
        updateDrag(t.clientX, t.clientY);
      }
    };

    globalTouchEndHandler = (e: TouchEvent) => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }

      if (isMobile.value && !touchGestureMoved && currentTouchItem) {
        const now = Date.now();
        const timeSinceLastTap = now - lastTapTime;
        const isSameItem = lastTapItem && lastTapItem.type === currentTouchItem.type && lastTapItem.id === currentTouchItem.id;

        if (timeSinceLastTap < doubleTapThreshold && isSameItem && onMobileDoubleTap) {
          e.preventDefault();
          onMobileDoubleTap(currentTouchItem, e);
          lastTapTime = 0;
          lastTapItem = null;
        } else {
          if (onMobileTap) {
            onMobileTap(currentTouchItem, e);
          }
          lastTapTime = now;
          lastTapItem = currentTouchItem;
        }
      }

      if (enableMobileDrag) {
        endDrag();
      }

      currentTouchItem = null;
      cleanupTouchListeners();
    };

    document.addEventListener("touchmove", globalTouchMoveHandler, { passive: false });
    document.addEventListener("touchend", globalTouchEndHandler);
    document.addEventListener("touchcancel", globalTouchEndHandler);
  }

  function cleanupMouseListeners(): void {
    if (globalMoveHandler) {
      document.removeEventListener("mousemove", globalMoveHandler);
      globalMoveHandler = null;
    }
    if (globalUpHandler) {
      document.removeEventListener("mouseup", globalUpHandler);
      globalUpHandler = null;
    }
  }

  function cleanupTouchListeners(): void {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    if (globalTouchMoveHandler) {
      document.removeEventListener("touchmove", globalTouchMoveHandler);
      globalTouchMoveHandler = null;
    }
    if (globalTouchEndHandler) {
      document.removeEventListener("touchend", globalTouchEndHandler);
      document.removeEventListener("touchcancel", globalTouchEndHandler);
      globalTouchEndHandler = null;
    }
  }

  // Cleanup
  onUnmounted(() => {
    cleanupMouseListeners();
    cleanupTouchListeners();
  });

  // Return
  return {
    isDragging,
    hasMoved,
    currentDragItem,
    draggedItemsInitialPositions,
    snapToGrid,
    isPositionOccupied,
    findNextAvailablePosition,
    checkDropOnFolder,
    getItemPosition,
    getItemStyle,
    updateItemPosition,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    handleMouseDown,
    handleTouchStart,
  };
}
