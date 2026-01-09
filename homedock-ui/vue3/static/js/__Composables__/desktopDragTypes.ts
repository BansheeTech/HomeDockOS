// homedock-ui/vue3/static/js/__Composables__/desktopDragTypes.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import type { Ref, ComputedRef } from "vue";
import type { CSSProperties } from "vue";
import type { DockerApp, DesktopFolder } from "../__Stores__/desktopStore";

// Core Types
export type DragItemType = "app" | "folder" | "systemicon";
export type DragMode = "direct" | "ghost";

export interface DragItem {
  type: DragItemType;
  id: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface GridPosition extends Position {
  row: number;
  col: number;
  page?: number;
}

// Grid Configuration
export interface GridConfig {
  sizeX: number;
  sizeY: number;
  padding: number;
  iconWidth: number;
  iconHeight: number;
  columns?: number;
}

export const DEFAULT_GRID_CONFIG: GridConfig = {
  sizeX: 110,
  sizeY: 125,
  padding: 16,
  iconWidth: 100,
  iconHeight: 130,
};

// Selection State
export interface SelectionState {
  selectedApp: string | null;
  selectedFolder: string | null;
  selectedSystemIcon: string | null;
  selectedApps: Set<string>;
  selectedFolders: Set<string>;
  selectedSystemIcons: Set<string>;
}

export function createEmptySelectionState(): SelectionState {
  return {
    selectedApp: null,
    selectedFolder: null,
    selectedSystemIcon: null,
    selectedApps: new Set(),
    selectedFolders: new Set(),
    selectedSystemIcons: new Set(),
  };
}

// Box Selection
export interface BoxSelection {
  isSelecting: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export function createEmptyBoxSelection(): BoxSelection {
  return {
    isSelecting: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  };
}

// Drag State
export interface DragState {
  isDragging: boolean;
  hasMoved: boolean;
  currentItem: DragItem | null;
  startMousePosition: Position;
  currentMousePosition: Position;
  startIconPosition: Position;
}

export function createEmptyDragState(): DragState {
  return {
    isDragging: false,
    hasMoved: false,
    currentItem: null,
    startMousePosition: { x: 0, y: 0 },
    currentMousePosition: { x: 0, y: 0 },
    startIconPosition: { x: 0, y: 0 },
  };
}

// Drop Information
export interface DropInfo {
  item: DragItem;
  finalPosition: GridPosition;
  targetFolder: DesktopFolder | null;
  wasMultiSelect: boolean;
  allDroppedItems?: DragItem[];
}

// Composable Options
export interface UseDragSelectionOptions {
  containerRef: Ref<HTMLElement | null>;
  gridConfig: Ref<GridConfig>;
  enableBoxSelection?: boolean;
  enableMultiSelect?: boolean;
  onSelectionChange?: (state: SelectionState) => void;
}

export interface UseDragAndDropOptions {
  mode: DragMode;
  containerId: string;
  containerRef: Ref<HTMLElement | null>;
  gridConfig: Ref<GridConfig>;
  selection: Ref<SelectionState>;
  dragThreshold?: number;
  folderDropThreshold?: number;

  enableMobileDrag?: boolean;
  onDragStart?: (item: DragItem) => void;
  onDragMove?: (item: DragItem, position: Position) => void;
  onDragEnd?: (dropInfo: DropInfo) => void;
  onDropOnFolder?: (folder: DesktopFolder, appIds: string[]) => void;

  onMobileTap?: (item: DragItem, e: TouchEvent) => void;
  onMobileDoubleTap?: (item: DragItem, e: TouchEvent) => void;
  onMobileLongPress?: (item: DragItem, e: TouchEvent) => void;
  longPressDuration?: number;
  doubleTapThreshold?: number;
}

export interface UseDragGhostOptions {
  zIndex?: number;
}

// Composable Return Types
export interface UseDragSelectionReturn {
  selectedApp: Ref<string | null>;
  selectedApps: Ref<Set<string>>;
  selectedFolder: Ref<string | null>;
  selectedFolders: Ref<Set<string>>;
  selectedSystemIcon: Ref<string | null>;
  selectedSystemIcons: Ref<Set<string>>;
  isSelectingArea: Ref<boolean>;
  selectionBox: Ref<{ startX: number; startY: number; currentX: number; currentY: number }>;
  selection: ComputedRef<SelectionState>;
  boxSelection: ComputedRef<BoxSelection>;
  selectionBoxStyle: ComputedRef<CSSProperties>;
  selectItem: (item: DragItem, options?: { ctrl?: boolean }) => void;
  clearSelection: () => void;
  clearSelectionByType: (type: DragItemType) => void;
  isSelected: (item: DragItem) => boolean;
  getSelectedItems: () => DragItem[];
  getSelectedItemsByType: (type: DragItemType) => string[];
  startBoxSelection: (x: number, y: number) => void;
  updateBoxSelection: (x: number, y: number) => void;
  endBoxSelection: (items: Array<{ item: DragItem; x: number; y: number }>) => void;
  handleItemClick: (item: DragItem, event: MouseEvent) => void;
  handleContainerMouseDown: (event: MouseEvent) => void;
}

export interface UseDragAndDropReturn {
  isDragging: Ref<boolean>;
  hasMoved: Ref<boolean>;
  currentDragItem: Ref<DragItem | null>;
  draggedItemsInitialPositions: Ref<Map<string, GridPosition>>;
  snapToGrid: (x: number, y: number) => GridPosition;
  isPositionOccupied: (x: number, y: number, excludeAppId?: string, excludeAppIds?: Set<string>, excludeFolderId?: string, excludeFolderIds?: Set<string>, excludeSystemIconId?: string, excludeSystemIconIds?: Set<string>) => boolean;
  findNextAvailablePosition: (startRow?: number, startCol?: number) => GridPosition;
  checkDropOnFolder: (x: number, y: number) => DesktopFolder | null;
  getItemPosition: (item: DragItem) => Position | null;
  getItemStyle: (item: DragItem, extraStyles?: CSSProperties) => CSSProperties;
  updateItemPosition: (item: DragItem, pos: GridPosition) => void;
  startDrag: (item: DragItem, clientX: number, clientY: number) => void;
  updateDrag: (clientX: number, clientY: number) => void;
  endDrag: () => DropInfo | null;
  cancelDrag: () => void;
  handleMouseDown: (event: MouseEvent, item: DragItem) => void;
  handleTouchStart: (event: TouchEvent, item: DragItem) => void;
}

export interface UseDragGhostReturn {
  isVisible: Ref<boolean>;
  position: Ref<Position>;
  items: Ref<DockerApp[]>;
  show: (apps: DockerApp[], position: Position) => void;
  updatePosition: (position: Position) => void;
  hide: () => void;
  ghostStyle: ComputedRef<CSSProperties>;
}

// Utility Functions
export function getDragItemKey(item: DragItem): string {
  return `${item.type}:${item.id}`;
}

export function parseDragItemKey(key: string): DragItem {
  const [type, id] = key.split(":");
  return { type: type as DragItemType, id };
}

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export function rectsIntersect(a: Rect, b: Rect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}
