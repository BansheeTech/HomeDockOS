<!-- homedock-ui/vue3/static/js/__Desktop__/MobileDesktopPages.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="mobile-desktop-pages-wrapper">
    <div ref="pagesContainerRef" class="desktop-pages-container" @scroll="handlePageScroll" @touchstart="handlePageTouchStart" @touchmove="handlePageTouchMove" @touchend="handlePageTouchEnd">
      <div v-for="(pageItems, pageIndex) in iconsByPage" :key="`page-${pageIndex}`" class="desktop-page" :data-page="pageIndex">
        <TransitionGroup name="icon-appear">
          <div v-for="item in pageItems.filter((i: any) => i.type === 'systemicon')" :key="item.id" :class="['desktop-mobile-icon group flex flex-col items-center justify-center gap-0.5 cursor-pointer px-1 rounded-lg select-none outline-none border overflow-hidden', isWiggleMode ? 'touch-none' : 'touch-pan-x', selectedSystemIcon === item.id ? [themeClasses.desktopIconBgSelected, themeClasses.desktopIconBorderSelected, themeClasses.desktopIconShadowSelected] : ['border-transparent', 'shadow-[0_0_0_1px_transparent]'], isDragging && draggedItemId === item.id ? 'icon-dragging' : '', isWiggleMode && draggedItemId !== item.id ? 'icon-wiggle' : '', !isDragging || draggedItemId !== item.id ? 'transition-[left,top,background,transform,border,box-shadow] duration-[400ms,400ms,150ms,200ms,0ms,0ms] ease-[ease,ease,ease,ease,ease,ease]' : '']" :style="getIconStyle(item, pageIndex)" @touchstart="handleTouchStart($event, item)" @touchmove="handleTouchMove($event, item)" @touchend="handleTouchEnd($event, item)" :title="item.name">
            <div :class="['relative w-16 h-16 shrink-0 flex items-center justify-center rounded-2xl overflow-hidden transition-[background,transform,border-color] duration-[150ms,200ms,0ms] ease-[ease,ease,ease] pointer-events-none border', themeClasses.desktopIconContainerBg, themeClasses.desktopIconContainerScaleHover, selectedSystemIcon === item.id ? [themeClasses.desktopIconContainerBgSelected, themeClasses.desktopIconContainerBorderSelected] : ['border-transparent', themeClasses.desktopIconContainerBgHover]]">
              <template v-if="(item as any).shortcut">
                <Transition name="icon-switch" mode="out-in">
                  <BaseImage v-if="(item as any).shortcut.iconType === 'image'" :key="`image:${(item as any).shortcut.iconValue}`" :src="getShortcutIconUrl((item as any).shortcut.iconValue)" class="w-12 h-12 object-contain pointer-events-none rounded-xl" alt="" draggable="false" />
                  <div v-else :key="`preset:${(item as any).shortcut.iconValue}`" :class="['w-full h-full flex items-center justify-center rounded-lg', themeClasses.iconHolder]">
                    <Icon :icon="getShortcutGlyph((item as any).shortcut)" class="w-10 h-10 pointer-events-none" :class="themeClasses.explorerItemIcon" />
                  </div>
                </Transition>
                <div class="absolute bottom-1 left-1 w-4 h-4 rounded bg-white border border-black/10 shadow-sm flex items-center justify-center z-[3] pointer-events-none">
                  <Icon :icon="arrowTopRightIcon" class="w-3 h-3 text-blue-600" />
                </div>
              </template>
              <div v-else :class="['w-full h-full flex items-center justify-center rounded-lg', themeClasses.iconHolder]">
                <Icon :icon="getSystemIconObject(item)" class="w-10 h-10 pointer-events-none" :class="themeClasses.explorerItemIcon" />
              </div>
            </div>
            <span :class="[themeClasses.desktopIconText, 'text-xs text-center w-full overflow-hidden text-ellipsis whitespace-nowrap pointer-events-none font-medium']" style="line-height: 1.125rem">{{ item.name }}</span>
          </div>
        </TransitionGroup>

        <TransitionGroup name="icon-appear">
          <div v-for="item in pageItems.filter((i: any) => i.type === 'app')" :key="item.id" :class="['desktop-mobile-icon group flex flex-col items-center justify-center gap-0.5 cursor-pointer px-1 rounded-lg select-none outline-none border overflow-hidden', isWiggleMode ? 'touch-none' : 'touch-pan-x', !(selectedApp === item.id || selectedApps.has(item.id)) && ['border-transparent', 'shadow-[0_0_0_1px_transparent]'], (selectedApp === item.id || selectedApps.has(item.id)) && [themeClasses.desktopIconBgSelected, themeClasses.desktopIconBorderSelected, themeClasses.desktopIconShadowSelected], isDragging && draggedItemId === item.id ? 'icon-dragging' : '', isWiggleMode && draggedItemId !== item.id ? 'icon-wiggle' : '', !isDragging || draggedItemId !== item.id ? 'transition-[left,top,background,transform,border,box-shadow] duration-[400ms,400ms,150ms,200ms,0ms,0ms] ease-[ease,ease,ease,ease,ease,ease]' : '']" :style="getIconStyle(item, pageIndex)" @touchstart="handleTouchStart($event, item)" @touchmove="handleTouchMove($event, item)" @touchend="handleTouchEnd($event, item)" :title="`${(item as any).display_name || item.name} (${getAppStatus(item)})`">
            <div :class="['relative w-16 h-16 shrink-0 flex items-center justify-center rounded-2xl overflow-hidden transition-[background,transform,border-color] duration-[150ms,200ms,0ms] ease-[ease,ease,ease] pointer-events-none border', themeClasses.desktopIconContainerBg, themeClasses.desktopIconContainerScaleHover, !(selectedApp === item.id || selectedApps.has(item.id)) && ['border-transparent', themeClasses.desktopIconContainerBgHover], (selectedApp === item.id || selectedApps.has(item.id)) && [themeClasses.desktopIconContainerBgSelected, themeClasses.desktopIconContainerBorderSelected], getContainerClasses(item)]">
              <BaseImage :src="getAppImagePath(item)" class="w-12 h-12 object-contain pointer-events-none rounded-xl" alt="" draggable="false" />
              <Transition name="loading-overlay-fade">
                <div v-if="isAppProcessing(item)" class="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl pointer-events-none z-[2]">
                  <div class="w-8 h-8 rounded-full border-[3px] border-white/30 border-t-blue-500 animate-spin shadow-lg"></div>
                </div>
              </Transition>
              <PortScanningOverlay :visible="getAppStatus(item) === 'running' && isPortScanning(item) && !isAppProcessing(item)" />
              <div :class="['absolute bottom-1 right-1 w-3 h-3 rounded-full z-[3] pointer-events-none transition-all duration-200', getStatusBadgeClass(getAppStatus(item)), themeClasses.desktopStatusBadgeBorder, getAppStatus(item) === 'running' && 'status-pulse']"></div>
            </div>
            <span :class="[themeClasses.desktopIconText, 'text-xs text-center w-full overflow-hidden text-ellipsis whitespace-nowrap pointer-events-none font-medium']" style="line-height: 1.125rem">{{ (item as any).display_name || item.name }}</span>
          </div>
        </TransitionGroup>

        <TransitionGroup name="icon-appear">
          <DesktopFolderIcon v-for="item in pageItems.filter((i: any) => i.type === 'folder')" :key="item.id" :folder="getAsFolder(item)" :is-selected="selectedFolder === item.id" :is-dragging="draggedFolder === item.id" :is-wiggle-mode="isWiggleMode && draggedFolder !== item.id" :style="getIconStyle(item, pageIndex)" @touchstart="(e: TouchEvent) => handleTouchStart(e, item)" @touchmove="(e: TouchEvent) => handleTouchMove(e, item)" @touchend="(e: TouchEvent) => handleTouchEnd(e, item)" @click="handleFolderClick" @dblclick="handleFolderDoubleClick" @contextmenu="handleFolderContextMenu" />
        </TransitionGroup>
      </div>

      <TransitionGroup name="widget-appear" move-class="widget-move-none">
        <div v-for="w in placedMobileWidgets" :key="w.instance.instanceId" :class="['absolute z-[1] select-none outline-none', isWiggleMode ? 'touch-none' : 'touch-pan-x', draggedMobileWidget === w.instance.instanceId && mobileWidgetHasMoved ? 'widget-dragging' : 'transition-[left,top,transform] duration-[400ms] ease-[ease]', isWiggleMode && draggedMobileWidget !== w.instance.instanceId ? 'icon-wiggle' : '']" :style="getMobileWidgetStyle(w)" @touchstart="handleWidgetTouchStart($event, w)" @touchmove="handleWidgetTouchMove($event)" @touchend="handleWidgetTouchEnd($event)">
          <DesktopWidgetFrame :instance="w.instance" />
        </div>
      </TransitionGroup>
    </div>

    <PageIndicator :current-page="currentPage" :total-pages="totalPages" :scroll-progress="scrollProgress" @page-change="goToPage" />

    <Transition name="wiggle-overlay-fade">
      <div v-if="isWiggleMode" class="wiggle-mode-overlay">
        <button class="wiggle-done-button" :class="themeClasses.wiggleDoneButton" @click="exitWiggleMode">Done</button>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";

import { useDesktopStore, type DockerApp, type DesktopFolder, type SystemDesktopIcon } from "../__Stores__/desktopStore";
import { useWidgetsStore, type WidgetInstance } from "../__Stores__/useWidgetsStore";
import { getWidgetDims } from "../__Config__/WidgetDefaultDetails";

import { useWindowStore } from "../__Stores__/windowStore";
import { useResponsive } from "../__Composables__/useResponsive";
import { useTheme } from "../__Themes__/ThemeSelector";

import BaseImage from "../__Components__/BaseImage.vue";
import PortScanningOverlay from "../__Components__/PortScanningOverlay.vue";

import { getShortcutGlyph, getShortcutIconUrl } from "../__Config__/ShortcutIcons";
import DesktopFolderIcon from "./DesktopFolderIcon.vue";
import DesktopWidgetFrame from "./DesktopWidgetFrame.vue";
import PageIndicator from "./PageIndicator.vue";

import { Icon } from "@iconify/vue";
import arrowTopRightIcon from "@iconify-icons/mdi/arrow-top-right";
import cloudIcon from "@iconify-icons/mdi/cloud";
import { homedockIcon } from "../__Config__/HomeDockIcon";
import fileSearchIcon from "@iconify-icons/mdi/file-search";
import widgetsOutlineIcon from "@iconify-icons/mdi/widgets-outline";
import cubeScanIcon from "@iconify-icons/mdi/cube-scan";
import packageVariantIcon from "@iconify-icons/mdi/package-variant";
import cubeIcon from "@iconify-icons/mdi/cube";
import nutIcon from "@iconify-icons/mdi/nut";
import chartTimelineVariantIcon from "@iconify-icons/mdi/chart-timeline-variant";
import tuneIcon from "@iconify-icons/mdi/tune";
import cloudQuestionIcon from "@iconify-icons/mdi/cloud-question";
import toolboxOutlineIcon from "@iconify-icons/mdi/toolbox-outline";
import folderMultipleIcon from "@iconify-icons/mdi/folder-multiple";

interface Props {
  selectedApp: string | null;
  selectedApps: Set<string>;
  selectedFolder: string | null;
  draggedApp: string | null;
  draggedFolder: string | null;
  selectedSystemIcon?: string | null;
  draggedSystemIcon?: string | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "update:selectedApp", value: string | null): void;
  (e: "update:selectedApps", value: Set<string>): void;
  (e: "update:selectedFolder", value: string | null): void;
  (e: "update:selectedSystemIcon", value: string | null): void;
  (e: "update:draggedApp", value: string | null): void;
  (e: "update:draggedFolder", value: string | null): void;
  (e: "update:draggedSystemIcon", value: string | null): void;
  (e: "update:isWiggleMode", value: boolean): void;
  (e: "click", app: DockerApp, event?: MouseEvent): void;
  (e: "dblclick", app: DockerApp): void;
  (e: "contextmenu", event: MouseEvent, app: DockerApp): void;
  (e: "desktopContextmenu", event: MouseEvent): void;
  (e: "closeContextMenu"): void;
  (e: "folderClick", folder: DesktopFolder, event?: MouseEvent): void;
  (e: "folderDblclick", folder: DesktopFolder): void;
  (e: "folderContextmenu", event: MouseEvent, folder: DesktopFolder): void;
  (e: "systemiconContextmenu", event: MouseEvent, systemicon: SystemDesktopIcon): void;
  (e: "widgetContextmenu", event: MouseEvent, widget: WidgetInstance): void;
}>();

const desktopStore = useDesktopStore();
const widgetsStore = useWidgetsStore();
const windowStore = useWindowStore();
const { windowWidth, windowHeight, isPortrait, isLandscape, isMobile } = useResponsive();
const { themeClasses } = useTheme();

const pagesContainerRef = ref<HTMLDivElement | null>(null);

const currentPage = ref(0);
const scrollProgress = ref(0);
const isScrolling = ref(false);
let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
let scrollProgressFrame: number | null = null;

const isDragging = ref(false);
const hasMoved = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const dragCurrentX = ref(0);
const dragCurrentY = ref(0);
const dragStartIconX = ref(0);
const dragStartIconY = ref(0);
const dragStartPage = ref(0);
const dragStartGridIndex = ref(0);
const currentTouchItem = ref<any>(null);
const draggedItemId = ref<string | null>(null);

const isWiggleMode = ref(false);

let longPressTimer: ReturnType<typeof setTimeout> | null = null;
let wiggleModeTimer: ReturnType<typeof setTimeout> | null = null;
const isLongPressing = ref(false);
const contextMenuShown = ref(false);
const LONG_PRESS_DURATION = 500;
const WIGGLE_MODE_DURATION = 1500;

let lastTapTime = 0;
let lastTapX = 0;
let lastTapY = 0;
const DOUBLE_TAP_THRESHOLD = 300;
const DOUBLE_TAP_DISTANCE = 30;

const MOVE_THRESHOLD = 10;
const HORIZONTAL_ANGLE_THRESHOLD = 30;

const edgeDragThreshold = 50;
let edgeDragTimer: ReturnType<typeof setTimeout> | null = null;
const EDGE_DRAG_DELAY = 800;

const isDesktopLongPress = ref(false);
let desktopLongPressTimer: ReturnType<typeof setTimeout> | null = null;

const MOBILE_PADDING = 16;
const PAGE_INDICATOR_CLEARANCE = 32;

const WIDGET_CELL_INSET = 5;
const GRID_SIZE_X = ref(85);
const GRID_SIZE_Y = ref(100);

const mainDockerApps = computed(() => desktopStore.desktopRootApps);
const desktopFolders = computed(() => desktopStore.desktopFolders);
const systemDesktopIcons = computed(() => desktopStore.desktopRootSystemIcons);

const gridColumns = computed(() => {
  return isPortrait.value ? 4 : 6;
});

const gridRows = computed(() => {
  const containerHeight = pagesContainerRef.value?.clientHeight || windowHeight.value;
  const availableHeight = containerHeight - MOBILE_PADDING * 2 - PAGE_INDICATOR_CLEARANCE;
  return Math.max(1, Math.floor(availableHeight / GRID_SIZE_Y.value));
});

const iconsPerPage = computed(() => {
  return gridColumns.value * gridRows.value;
});

const iconsByPage = computed(() => {
  const container = pagesContainerRef.value;
  const pageWidth = container?.clientWidth || windowWidth.value;

  const systemicons = systemDesktopIcons.value.map((s) => ({ ...s, type: "systemicon" as const }));
  const folders = desktopFolders.value.map((f) => ({ ...f, type: "folder" as const }));
  const apps = mainDockerApps.value.map((a) => ({ ...a, type: "app" as const }));
  const allItems = [...systemicons, ...folders, ...apps];

  if (allItems.length === 0) return [[]];

  const itemsWithPage = allItems.map((item) => {
    let pageIndex = 0;

    if (item.x !== undefined) {
      pageIndex = Math.floor(item.x / pageWidth);
    } else if (item.gridRow !== undefined && item.gridCol !== undefined) {
      const globalIndex = item.gridRow * gridColumns.value + item.gridCol;
      pageIndex = Math.floor(globalIndex / iconsPerPage.value);
    }

    return { ...item, pageIndex };
  });

  const maxPage = Math.max(0, ...itemsWithPage.map((item) => item.pageIndex), ...placedMobileWidgets.value.map((w) => w.page));

  const pages: Array<Array<(typeof allItems)[0]>> = [];
  for (let i = 0; i <= maxPage; i++) {
    const pageItems = itemsWithPage.filter((item) => item.pageIndex === i).map(({ pageIndex, ...item }) => item);
    pages.push(pageItems);
  }

  if (isDragging.value || draggedMobileWidget.value !== null) {
    const minPages = Math.max(1, currentPage.value + 1);
    while (pages.length < minPages) {
      pages.push([]);
    }
  } else {
    const widgetPages = new Set(placedMobileWidgets.value.map((w) => w.page));
    while (pages.length > 1 && pages[pages.length - 1].length === 0 && !widgetPages.has(pages.length - 1)) {
      pages.pop();
    }
    if (pages.length === 0) {
      pages.push([]);
    }
  }

  return pages;
});

const totalPages = computed(() => {
  return Math.max(1, iconsByPage.value.length);
});

interface PlacedMobileWidget {
  instance: WidgetInstance;
  row: number;
  col: number;
  page: number;
  cols: number;
  rows: number;
}

const placedMobileWidgets = computed<PlacedMobileWidget[]>(() => {
  return widgetsStore.instances
    .filter((instance) => instance.mobileRow !== undefined && instance.mobileCol !== undefined)
    .map((instance) => {
      const dims = getWidgetDims(instance.type, instance.size);
      const col = Math.max(0, Math.min(instance.mobileCol!, gridColumns.value - dims.cols));
      const row = Math.max(0, Math.min(instance.mobileRow!, Math.max(0, gridRows.value - dims.rows)));
      return { instance, row, col, page: instance.mobilePage ?? 0, cols: dims.cols, rows: dims.rows };
    });
});

function widgetCellsForPage(pageIndex: number, excludeId?: string): Set<string> {
  const cells = new Set<string>();
  placedMobileWidgets.value.forEach((w) => {
    if (w.page !== pageIndex || w.instance.instanceId === excludeId) return;
    for (let r = w.row; r < w.row + w.rows; r++) {
      for (let c = w.col; c < w.col + w.cols; c++) {
        cells.add(`${r},${c}`);
      }
    }
  });
  return cells;
}

function iconCellsForPage(pageIndex: number): Set<string> {
  const cells = new Set<string>();
  const container = pagesContainerRef.value;
  if (!container) return cells;

  const pageWidth = container.clientWidth;
  const allItems: Array<{ x?: number; y?: number }> = [...systemDesktopIcons.value, ...desktopFolders.value, ...mainDockerApps.value];

  allItems.forEach((item) => {
    if (item.x === undefined || item.y === undefined) return;
    if (Math.floor(item.x / pageWidth) !== pageIndex) return;

    const left = (item.x % pageWidth) - MOBILE_PADDING;
    const top = item.y - MOBILE_PADDING;
    const firstCol = Math.max(0, Math.floor(left / GRID_SIZE_X.value));
    const lastCol = Math.max(firstCol, Math.floor((left + GRID_SIZE_X.value - 1) / GRID_SIZE_X.value));
    const firstRow = Math.max(0, Math.floor(top / GRID_SIZE_Y.value));
    const lastRow = Math.max(firstRow, Math.floor((top + GRID_SIZE_Y.value - 1) / GRID_SIZE_Y.value));

    for (let r = firstRow; r <= lastRow; r++) {
      for (let c = firstCol; c <= lastCol; c++) {
        cells.add(`${r},${c}`);
      }
    }
  });

  return cells;
}

function isMobileWidgetRectFree(pageIndex: number, row: number, col: number, cols: number, rows: number, excludeId?: string): boolean {
  if (row < 0 || col < 0 || col + cols > gridColumns.value || row + rows > gridRows.value) return false;

  const iconCells = iconCellsForPage(pageIndex);
  const widgetCells = widgetCellsForPage(pageIndex, excludeId);

  for (let r = row; r < row + rows; r++) {
    for (let c = col; c < col + cols; c++) {
      const key = `${r},${c}`;
      if (iconCells.has(key) || widgetCells.has(key)) return false;
    }
  }

  return true;
}

function assignMobileWidgetPositions() {
  const rootItems: Array<{ x?: number }> = [...systemDesktopIcons.value, ...desktopFolders.value, ...mainDockerApps.value];
  if (rootItems.some((item) => item.x === undefined)) return;

  widgetsStore.instances.forEach((instance) => {
    if (instance.mobileRow === undefined || instance.mobileCol === undefined) return;

    const dims = getWidgetDims(instance.type, instance.size);
    const col = Math.max(0, Math.min(instance.mobileCol, gridColumns.value - dims.cols));
    const row = Math.max(0, Math.min(instance.mobileRow, Math.max(0, gridRows.value - dims.rows)));

    if (!isMobileWidgetRectFree(instance.mobilePage ?? 0, row, col, dims.cols, dims.rows, instance.instanceId)) {
      widgetsStore.setMobilePosition(instance.instanceId, null);
    }
  });

  widgetsStore.instances.forEach((instance) => {
    if (instance.mobileRow !== undefined && instance.mobileCol !== undefined) return;

    const dims = getWidgetDims(instance.type, instance.size);
    let found = false;

    for (let page = 0; page <= totalPages.value && !found; page++) {
      for (let row = 0; row <= gridRows.value - dims.rows && !found; row++) {
        for (let col = 0; col <= gridColumns.value - dims.cols && !found; col++) {
          if (isMobileWidgetRectFree(page, row, col, dims.cols, dims.rows)) {
            widgetsStore.setMobilePosition(instance.instanceId, { row, col, page });
            found = true;
          }
        }
      }
    }
  });
}

const draggedMobileWidget = ref<string | null>(null);
const mobileWidgetHasMoved = ref(false);
const mobileWidgetDragPos = ref({ x: 0, y: 0 });
let mobileWidgetTouch = { startX: 0, startY: 0, startLeft: 0, startTop: 0, originPage: 0, placed: null as PlacedMobileWidget | null };
let widgetLongPressTimer: ReturnType<typeof setTimeout> | null = null;
let widgetWiggleTimer: ReturnType<typeof setTimeout> | null = null;
let widgetEdgeTimer: ReturnType<typeof setTimeout> | null = null;

function getMobileWidgetStyle(w: PlacedMobileWidget): Record<string, string> {
  const pageWidth = pagesContainerRef.value?.clientWidth || windowWidth.value;
  const width = w.cols * GRID_SIZE_X.value - 10;
  const height = w.rows * GRID_SIZE_Y.value - 10;

  const isDraggingThis = draggedMobileWidget.value === w.instance.instanceId && mobileWidgetHasMoved.value;
  const left = (isDraggingThis ? mobileWidgetTouch.originPage * pageWidth + mobileWidgetDragPos.value.x : w.page * pageWidth + MOBILE_PADDING + w.col * GRID_SIZE_X.value) + WIDGET_CELL_INSET;
  const top = (isDraggingThis ? mobileWidgetDragPos.value.y : MOBILE_PADDING + w.row * GRID_SIZE_Y.value) + WIDGET_CELL_INSET;

  return { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` };
}

function clearWidgetTimers() {
  if (widgetLongPressTimer) {
    clearTimeout(widgetLongPressTimer);
    widgetLongPressTimer = null;
  }
  if (widgetWiggleTimer) {
    clearTimeout(widgetWiggleTimer);
    widgetWiggleTimer = null;
  }
  if (widgetEdgeTimer) {
    clearTimeout(widgetEdgeTimer);
    widgetEdgeTimer = null;
  }
}

function beginMobileWidgetDrag(w: PlacedMobileWidget) {
  const container = pagesContainerRef.value;
  if (container) {
    currentPage.value = Math.round(container.scrollLeft / container.clientWidth);
  }

  draggedMobileWidget.value = w.instance.instanceId;
  mobileWidgetDragPos.value = { x: mobileWidgetTouch.startLeft, y: mobileWidgetTouch.startTop };
}

function handleWidgetTouchStart(e: TouchEvent, w: PlacedMobileWidget) {
  if (e.touches.length > 1) return;

  const touch = e.touches[0];

  mobileWidgetTouch = {
    startX: touch.clientX,
    startY: touch.clientY,
    startLeft: MOBILE_PADDING + w.col * GRID_SIZE_X.value,
    startTop: MOBILE_PADDING + w.row * GRID_SIZE_Y.value,
    originPage: w.page,
    placed: w,
  };
  mobileWidgetHasMoved.value = false;

  if (isWiggleMode.value) {
    beginMobileWidgetDrag(w);
    return;
  }

  widgetLongPressTimer = setTimeout(() => {
    if (mobileWidgetHasMoved.value || !mobileWidgetTouch.placed) return;

    emit("widgetContextmenu", new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: touch.clientX, clientY: touch.clientY }), w.instance);

    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    widgetWiggleTimer = setTimeout(() => {
      if (mobileWidgetHasMoved.value || !mobileWidgetTouch.placed) return;

      emit("closeContextMenu");
      enterWiggleMode();
      beginMobileWidgetDrag(w);

      if (navigator.vibrate) {
        navigator.vibrate([30, 50, 30]);
      }
    }, WIGGLE_MODE_DURATION - LONG_PRESS_DURATION);
  }, LONG_PRESS_DURATION);
}

function handleWidgetTouchMove(e: TouchEvent) {
  if (e.touches.length > 1) return;
  if (!mobileWidgetTouch.placed) return;

  const touch = e.touches[0];
  const deltaX = touch.clientX - mobileWidgetTouch.startX;
  const deltaY = touch.clientY - mobileWidgetTouch.startY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  if (distance > MOVE_THRESHOLD) {
    mobileWidgetHasMoved.value = true;

    if (widgetLongPressTimer) {
      clearTimeout(widgetLongPressTimer);
      widgetLongPressTimer = null;
    }
    if (widgetWiggleTimer) {
      clearTimeout(widgetWiggleTimer);
      widgetWiggleTimer = null;
    }
  }

  if (!draggedMobileWidget.value || !mobileWidgetHasMoved.value) return;

  e.preventDefault();

  const container = pagesContainerRef.value;
  if (!container) return;

  const containerRect = container.getBoundingClientRect();
  const touchX = touch.clientX - containerRect.left;

  const isNearLeftEdge = touchX < edgeDragThreshold;
  const isNearRightEdge = touchX > containerRect.width - edgeDragThreshold;
  const pageWidth = container.clientWidth;

  if (isNearLeftEdge && currentPage.value > 0) {
    if (!widgetEdgeTimer) {
      widgetEdgeTimer = setTimeout(() => {
        goToPageInstant(currentPage.value - 1);
        mobileWidgetTouch.startX += pageWidth;
        widgetEdgeTimer = null;
      }, EDGE_DRAG_DELAY);
    }
  } else if (isNearRightEdge) {
    if (!widgetEdgeTimer) {
      widgetEdgeTimer = setTimeout(() => {
        const newPage = currentPage.value + 1;

        if (newPage < totalPages.value) {
          goToPageInstant(newPage);
        } else {
          currentPage.value = newPage;
          container.scrollTo({ left: newPage * pageWidth, behavior: "auto" });
        }

        mobileWidgetTouch.startX -= pageWidth;
        widgetEdgeTimer = null;
      }, EDGE_DRAG_DELAY);
    }
  } else if (widgetEdgeTimer) {
    clearTimeout(widgetEdgeTimer);
    widgetEdgeTimer = null;
  }

  const w = mobileWidgetTouch.placed;
  const height = w.rows * GRID_SIZE_Y.value - 10;

  mobileWidgetDragPos.value = {
    x: Math.round(mobileWidgetTouch.startLeft + (touch.clientX - mobileWidgetTouch.startX)),
    y: Math.round(Math.max(MOBILE_PADDING, Math.min(mobileWidgetTouch.startTop + deltaY, containerRect.height - height - MOBILE_PADDING))),
  };
}

function handleWidgetTouchEnd(e: TouchEvent) {
  clearWidgetTimers();

  const w = mobileWidgetTouch.placed;

  if (draggedMobileWidget.value && mobileWidgetHasMoved.value && w) {
    const pageWidth = pagesContainerRef.value?.clientWidth || windowWidth.value;
    const localX = mobileWidgetDragPos.value.x - (currentPage.value - mobileWidgetTouch.originPage) * pageWidth;

    const col = Math.round((localX - MOBILE_PADDING) / GRID_SIZE_X.value);
    const row = Math.round((mobileWidgetDragPos.value.y - MOBILE_PADDING) / GRID_SIZE_Y.value);
    const clampedCol = Math.max(0, Math.min(col, gridColumns.value - w.cols));
    const clampedRow = Math.max(0, Math.min(row, gridRows.value - w.rows));
    const page = currentPage.value;

    if (isMobileWidgetRectFree(page, clampedRow, clampedCol, w.cols, w.rows, w.instance.instanceId)) {
      widgetsStore.setMobilePosition(w.instance.instanceId, { row: clampedRow, col: clampedCol, page });
    }
  } else if (isWiggleMode.value && !mobileWidgetHasMoved.value && w) {
    const touch = e.changedTouches[0];
    emit("widgetContextmenu", new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: touch.clientX, clientY: touch.clientY }), w.instance);
  }

  draggedMobileWidget.value = null;
  mobileWidgetHasMoved.value = false;
  mobileWidgetTouch.placed = null;
}

function getIconStyle(item: any, pageIndex: number): Record<string, string> {
  const container = pagesContainerRef.value;
  const pageWidth = container?.clientWidth || windowWidth.value;

  const cellHeight = `${GRID_SIZE_Y.value - 4}px`;

  if (isDragging.value && draggedItemId.value === item.id) {
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const relativeX = dragCurrentX.value - containerRect.left;
      const relativeY = dragCurrentY.value - containerRect.top;

      const deltaX = relativeX - (dragStartX.value - containerRect.left);
      const deltaY = relativeY - (dragStartY.value - containerRect.top);

      return {
        position: "absolute",
        left: `${dragStartIconX.value + deltaX}px`,
        top: `${dragStartIconY.value + deltaY}px`,
        width: `${GRID_SIZE_X.value}px`,
        height: cellHeight,
        zIndex: "1000",
      };
    }
  }

  if (item.x !== undefined && item.y !== undefined) {
    const localX = item.x % pageWidth;
    const localY = item.y;

    return {
      position: "absolute",
      left: `${localX}px`,
      top: `${localY}px`,
      width: `${GRID_SIZE_X.value}px`,
      height: cellHeight,
    };
  }

  if (item.gridRow !== undefined && item.gridCol !== undefined) {
    const left = MOBILE_PADDING + item.gridCol * GRID_SIZE_X.value;
    const top = MOBILE_PADDING + item.gridRow * GRID_SIZE_Y.value;

    return {
      position: "absolute",
      left: `${left}px`,
      top: `${top}px`,
      width: `${GRID_SIZE_X.value}px`,
      height: cellHeight,
    };
  }

  return {
    position: "absolute",
    opacity: "0",
    pointerEvents: "none",
    left: "0",
    top: "0",
    width: `${GRID_SIZE_X.value}px`,
    height: cellHeight,
  };
}

function calculateGridPosition(touchX: number, touchY: number, pageIndex: number): { col: number; row: number; globalIndex: number } {
  const container = pagesContainerRef.value;
  if (!container) return { col: 0, row: 0, globalIndex: 0 };

  const pageWidth = container.clientWidth;
  const scrollLeft = container.scrollLeft;
  const pageOffset = pageIndex * pageWidth;

  const relativeX = touchX + scrollLeft - pageOffset;
  const relativeY = touchY;

  let col = Math.floor((relativeX - MOBILE_PADDING) / GRID_SIZE_X.value);
  let row = Math.floor((relativeY - MOBILE_PADDING) / GRID_SIZE_Y.value);

  col = Math.max(0, Math.min(col, gridColumns.value - 1));
  row = Math.max(0, Math.min(row, gridRows.value - 1));

  const globalIndex = row * gridColumns.value + col;

  return { col, row, globalIndex };
}

function snapToGrid(x: number, y: number, pageIndex: number): { x: number; y: number; row: number; col: number; page: number } {
  const container = pagesContainerRef.value;
  if (!container) return { x: 0, y: 0, row: 0, col: 0, page: 0 };

  const col = Math.round((x - MOBILE_PADDING) / GRID_SIZE_X.value);
  const row = Math.round((y - MOBILE_PADDING) / GRID_SIZE_Y.value);

  const clampedCol = Math.max(0, Math.min(col, gridColumns.value - 1));
  const clampedRow = Math.max(0, Math.min(row, gridRows.value - 1));

  const snappedX = MOBILE_PADDING + clampedCol * GRID_SIZE_X.value;
  const snappedY = MOBILE_PADDING + clampedRow * GRID_SIZE_Y.value;

  return {
    x: snappedX,
    y: snappedY,
    row: clampedRow,
    col: clampedCol,
    page: pageIndex,
  };
}

function isPositionOccupied(x: number, y: number, pageIndex: number, excludeId?: string): boolean {
  const container = pagesContainerRef.value;
  if (!container) return false;

  const cellCol = Math.round((x - MOBILE_PADDING) / GRID_SIZE_X.value);
  const cellRow = Math.round((y - MOBILE_PADDING) / GRID_SIZE_Y.value);
  if (widgetCellsForPage(pageIndex).has(`${cellRow},${cellCol}`)) return true;

  const pageWidth = container.clientWidth;

  const systemicons = systemDesktopIcons.value.map((s) => ({ ...s, type: "systemicon" as const }));
  const folders = desktopFolders.value.map((f) => ({ ...f, type: "folder" as const }));
  const apps = mainDockerApps.value.map((a) => ({ ...a, type: "app" as const }));
  const allItems = [...systemicons, ...folders, ...apps];

  return allItems.some((item) => {
    if (excludeId && item.id === excludeId) return false;

    if (item.x === undefined || item.y === undefined) return false;

    const itemPage = Math.floor(item.x / pageWidth);

    if (itemPage !== pageIndex) return false;

    const itemLocalX = item.x % pageWidth;
    const itemLocalY = item.y;

    const dx = Math.abs(itemLocalX - x);
    const dy = Math.abs(itemLocalY - y);

    return dx < 20 && dy < 20;
  });
}

function findNextAvailablePosition(pageIndex: number, preferredRow?: number, preferredCol?: number, excludeId?: string): { x: number; y: number; row: number; col: number } | null {
  if (preferredRow !== undefined && preferredCol !== undefined) {
    const preferredX = MOBILE_PADDING + preferredCol * GRID_SIZE_X.value;
    const preferredY = MOBILE_PADDING + preferredRow * GRID_SIZE_Y.value;

    if (!isPositionOccupied(preferredX, preferredY, pageIndex, excludeId)) {
      return { x: preferredX, y: preferredY, row: preferredRow, col: preferredCol };
    }

    const maxRadius = Math.max(gridColumns.value, gridRows.value);

    for (let radius = 1; radius <= maxRadius; radius++) {
      const positions = [];

      for (let col = preferredCol; col <= Math.min(gridColumns.value - 1, preferredCol + radius); col++) {
        for (let row = Math.max(0, preferredRow - radius); row <= Math.min(gridRows.value - 1, preferredRow + radius); row++) {
          if (col >= 0 && col < gridColumns.value && row >= 0 && row < gridRows.value) {
            positions.push({ row, col });
          }
        }
      }

      for (const pos of positions) {
        const x = MOBILE_PADDING + pos.col * GRID_SIZE_X.value;
        const y = MOBILE_PADDING + pos.row * GRID_SIZE_Y.value;

        if (!isPositionOccupied(x, y, pageIndex, excludeId)) {
          return { x, y, row: pos.row, col: pos.col };
        }
      }
    }
  }

  for (let row = 0; row < gridRows.value; row++) {
    for (let col = 0; col < gridColumns.value; col++) {
      const x = MOBILE_PADDING + col * GRID_SIZE_X.value;
      const y = MOBILE_PADDING + row * GRID_SIZE_Y.value;

      if (!isPositionOccupied(x, y, pageIndex, excludeId)) {
        return { x, y, row, col };
      }
    }
  }

  return null;
}

function checkDropOnFolder(x: number, y: number, pageIndex: number): DesktopFolder | null {
  const HOVER_THRESHOLD = 60;
  const container = pagesContainerRef.value;
  if (!container) return null;

  const pageWidth = container.clientWidth;

  const globalX = pageIndex * pageWidth + x;

  for (const folder of desktopFolders.value) {
    if (folder.x === undefined || folder.y === undefined) continue;

    const dx = Math.abs(folder.x - globalX);
    const dy = Math.abs(folder.y - y);
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < HOVER_THRESHOLD) {
      return folder;
    }
  }

  return null;
}

function reorderIcons(draggedItem: any, targetPageIndex: number, targetGridIndex: number) {
  const sourcePage = dragStartPage.value;
  const sourceIndex = dragStartGridIndex.value;

  if (sourcePage === targetPageIndex && sourceIndex === targetGridIndex) {
    return;
  }

  const pages = [...iconsByPage.value.map((page) => [...page])];

  const sourcePageItems = pages[sourcePage];
  const itemToMove = sourcePageItems.splice(sourceIndex, 1)[0];

  if (sourcePage !== targetPageIndex) {
    const targetPageItems = pages[targetPageIndex];
    targetPageItems.splice(targetGridIndex, 0, itemToMove);
  } else {
    sourcePageItems.splice(targetGridIndex, 0, itemToMove);
  }
}

function getStatusBadgeClass(status: string): string {
  const statusClasses: Record<string, string> = {
    running: themeClasses.value.statusBadgeRunning,
    exited: themeClasses.value.statusBadgeExited,
    paused: themeClasses.value.statusBadgePaused,
    created: themeClasses.value.statusBadgeCreated,
    restarting: themeClasses.value.statusBadgeRestarting,
  };
  return statusClasses[status] || themeClasses.value.statusBadgeCreated;
}

function isPortScanning(item: any): boolean {
  const ports = item.ports;
  if (!ports || ports.length === 0) return false;
  if (ports.includes("disabled")) return true;
  if (ports.includes("hostmode")) return false;
  const unique = new Set(ports);
  return unique.size !== ports.length;
}

function getContainerClasses(app: any): string {
  const statusClasses: Record<string, string> = {
    running: "",
    paused: "brightness-50 opacity-75",
    exited: "grayscale brightness-50 opacity-75",
    created: "brightness-50 sepia opacity-50",
  };
  return statusClasses[app.status] || "";
}

function getSystemIconObject(icon: any) {
  if (typeof icon.icon === "object" && icon.icon !== null) {
    return icon.icon;
  }

  const iconMap: Record<string, any> = {
    "mdi:cloud": cloudIcon,
    "homedock:logo": homedockIcon,
    "mdi:file-search": fileSearchIcon,
    "mdi:folder-multiple": folderMultipleIcon,
    "mdi:widgets-outline": widgetsOutlineIcon,
    "mdi:cube-scan": cubeScanIcon,
    "mdi:package-variant": packageVariantIcon,
    "mdi:cube": cubeIcon,
    "mdi:nut": nutIcon,
    "mdi:chart-timeline-variant": chartTimelineVariantIcon,
    "mdi:tune": tuneIcon,
    "mdi:cloud-question": cloudQuestionIcon,
    "mdi:toolbox-outline": toolboxOutlineIcon,
  };
  return iconMap[icon.icon] || cloudIcon;
}

function updateScrollProgress() {
  scrollProgressFrame = null;

  const container = pagesContainerRef.value;
  if (!container) return;

  const pageWidth = container.clientWidth;
  if (pageWidth <= 0) return;

  scrollProgress.value = container.scrollLeft / pageWidth;
}

function handlePageScroll() {
  const container = pagesContainerRef.value;
  if (!container) return;

  if (scrollProgressFrame === null) {
    scrollProgressFrame = requestAnimationFrame(updateScrollProgress);
  }

  isScrolling.value = true;

  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }

  scrollTimeout = setTimeout(() => {
    const pageWidth = container.clientWidth;
    const scrollLeft = container.scrollLeft;
    const newPage = Math.round(scrollLeft / pageWidth);

    if (newPage !== currentPage.value && newPage >= 0 && newPage < totalPages.value) {
      currentPage.value = newPage;
    }

    updateScrollProgress();

    isScrolling.value = false;
  }, 150);
}

function goToPage(pageIndex: number) {
  const container = pagesContainerRef.value;
  if (!container) return;

  if (pageIndex < 0 || pageIndex >= totalPages.value) return;

  const pageWidth = container.clientWidth;
  const scrollLeft = pageIndex * pageWidth;

  container.scrollTo({
    left: scrollLeft,
    behavior: "smooth",
  });

  currentPage.value = pageIndex;
}

function goToPageInstant(pageIndex: number) {
  const container = pagesContainerRef.value;
  if (!container) return;

  if (pageIndex < 0 || pageIndex >= totalPages.value) return;

  const pageWidth = container.clientWidth;
  const scrollLeft = pageIndex * pageWidth;

  container.scrollTo({
    left: scrollLeft,
    behavior: "auto",
  });

  currentPage.value = pageIndex;
}

function handlePageTouchStart(e: TouchEvent) {
  if (e.touches.length > 1) return;

  const touch = e.touches[0];
  const target = e.target as HTMLElement;

  const isEmptyArea = target.classList.contains("desktop-page") || target.classList.contains("desktop-pages-container");

  if (isEmptyArea && !isWiggleMode.value) {
    desktopLongPressTimer = setTimeout(() => {
      isDesktopLongPress.value = true;

      emit(
        "desktopContextmenu",
        new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          clientX: touch.clientX,
          clientY: touch.clientY,
        }),
      );

      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, LONG_PRESS_DURATION);
  }
}

function handlePageTouchMove(e: TouchEvent) {
  if (desktopLongPressTimer) {
    clearTimeout(desktopLongPressTimer);
    desktopLongPressTimer = null;
  }

  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }

  if (wiggleModeTimer) {
    clearTimeout(wiggleModeTimer);
    wiggleModeTimer = null;
  }
}

function handlePageTouchEnd(e: TouchEvent) {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }

  if (desktopLongPressTimer) {
    clearTimeout(desktopLongPressTimer);
    desktopLongPressTimer = null;
  }

  if (!hasMoved.value && !isLongPressing.value && !isDesktopLongPress.value) {
    const target = e.target as HTMLElement;
    const isEmptyArea = target.classList.contains("desktop-page") || target.classList.contains("desktop-pages-container");

    if (isEmptyArea && !isWiggleMode.value) {
      emit("update:selectedApp", null);
      emit("update:selectedApps", new Set<string>());
      emit("update:selectedFolder", null);
      emit("update:selectedSystemIcon", null);
    }
  }

  isLongPressing.value = false;
  isDesktopLongPress.value = false;
}

function handleTouchStart(e: TouchEvent, item: any) {
  if (e.touches.length > 1) return;

  const touch = e.touches[0];
  const now = Date.now();

  dragStartX.value = touch.clientX;
  dragStartY.value = touch.clientY;
  dragCurrentX.value = touch.clientX;
  dragCurrentY.value = touch.clientY;
  hasMoved.value = false;
  currentTouchItem.value = item;

  let itemPageIndex = 0;
  let itemGridIndex = 0;

  for (let pageIndex = 0; pageIndex < iconsByPage.value.length; pageIndex++) {
    const pageItems = iconsByPage.value[pageIndex];
    const foundIndex = pageItems.findIndex((i) => i.id === item.id);

    if (foundIndex !== -1) {
      itemPageIndex = pageIndex;
      itemGridIndex = foundIndex;
      break;
    }
  }

  dragStartPage.value = itemPageIndex;
  dragStartGridIndex.value = itemGridIndex;

  const container = pagesContainerRef.value;
  const pageWidth = container?.clientWidth || windowWidth.value;

  if (item.x !== undefined && item.y !== undefined) {
    dragStartIconX.value = item.x % pageWidth;
    dragStartIconY.value = item.y;
  } else if (item.gridRow !== undefined && item.gridCol !== undefined) {
    dragStartIconX.value = MOBILE_PADDING + item.gridCol * GRID_SIZE_X.value;
    dragStartIconY.value = MOBILE_PADDING + item.gridRow * GRID_SIZE_Y.value;
  } else {
    const col = itemGridIndex % gridColumns.value;
    const row = Math.floor(itemGridIndex / gridColumns.value);
    dragStartIconX.value = MOBILE_PADDING + col * GRID_SIZE_X.value;
    dragStartIconY.value = MOBILE_PADDING + row * GRID_SIZE_Y.value;
  }

  if (isWiggleMode.value) {
    if (container) {
      const scrollLeft = container.scrollLeft;
      const pageWidth = container.clientWidth;
      const actualPage = Math.round(scrollLeft / pageWidth);
      currentPage.value = actualPage;

      dragStartPage.value = actualPage;
    }

    isDragging.value = true;
    isLongPressing.value = true;
    draggedItemId.value = item.id;

    if (item.type === "app") {
      emit("update:draggedApp", item.id);
    } else if (item.type === "folder") {
      emit("update:draggedFolder", item.id);
    } else if (item.type === "systemicon") {
      emit("update:draggedSystemIcon", item.id);
    }

    return;
  }

  longPressTimer = setTimeout(() => {
    if (!hasMoved.value && currentTouchItem.value) {
      isLongPressing.value = true;
      contextMenuShown.value = true;

      const contextMenuEvent = new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: touch.clientX,
        clientY: touch.clientY,
      });

      if (currentTouchItem.value.type === "folder") {
        emit("folderContextmenu", contextMenuEvent, currentTouchItem.value);
      } else if (currentTouchItem.value.type === "systemicon") {
        emit("systemiconContextmenu", contextMenuEvent, currentTouchItem.value);
      } else {
        emit("contextmenu", contextMenuEvent, currentTouchItem.value);
      }

      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      wiggleModeTimer = setTimeout(() => {
        if (!hasMoved.value && currentTouchItem.value) {
          emit("closeContextMenu");
          contextMenuShown.value = false;

          enterWiggleMode();

          isDragging.value = true;
          draggedItemId.value = item.id;

          if (item.type === "app") {
            emit("update:draggedApp", item.id);
          } else if (item.type === "folder") {
            emit("update:draggedFolder", item.id);
          } else if (item.type === "systemicon") {
            emit("update:draggedSystemIcon", item.id);
          }

          if (navigator.vibrate) {
            navigator.vibrate([30, 50, 30]);
          }
        }
      }, WIGGLE_MODE_DURATION - LONG_PRESS_DURATION);
    }
  }, LONG_PRESS_DURATION);
}

function enterWiggleMode() {
  isWiggleMode.value = true;
  emit("update:isWiggleMode", true);
}

function exitWiggleMode() {
  isWiggleMode.value = false;
  isDragging.value = false;
  draggedItemId.value = null;
  emit("update:isWiggleMode", false);
}

function handleTouchMove(e: TouchEvent, item: any) {
  if (e.touches.length > 1) return;

  const touch = e.touches[0];
  const deltaX = touch.clientX - dragStartX.value;
  const deltaY = touch.clientY - dragStartY.value;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  dragCurrentX.value = touch.clientX;
  dragCurrentY.value = touch.clientY;

  if (distance > MOVE_THRESHOLD) {
    hasMoved.value = true;

    if (wiggleModeTimer) {
      clearTimeout(wiggleModeTimer);
      wiggleModeTimer = null;
    }

    if (isDragging.value && isLongPressing.value) {
      e.preventDefault();

      const container = pagesContainerRef.value;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const touchX = touch.clientX - containerRect.left;
      const touchY = touch.clientY - containerRect.top;

      const isNearLeftEdge = touchX < edgeDragThreshold;
      const isNearRightEdge = touchX > containerRect.width - edgeDragThreshold;

      if (isNearLeftEdge && currentPage.value > 0) {
        if (!edgeDragTimer) {
          edgeDragTimer = setTimeout(() => {
            const newPage = currentPage.value - 1;

            goToPageInstant(newPage);

            dragStartPage.value = newPage;

            const pageWidth = container.clientWidth;
            dragStartX.value += pageWidth;

            edgeDragTimer = null;
          }, EDGE_DRAG_DELAY);
        }
      } else if (isNearRightEdge) {
        if (!edgeDragTimer) {
          edgeDragTimer = setTimeout(() => {
            const newPage = currentPage.value + 1;

            if (newPage < totalPages.value) {
              goToPageInstant(newPage);
            } else {
              currentPage.value = newPage;

              const pageWidth = container.clientWidth;
              const scrollLeft = newPage * pageWidth;
              container.scrollTo({
                left: scrollLeft,
                behavior: "auto",
              });
            }

            dragStartPage.value = newPage;

            const pageWidth = container.clientWidth;
            dragStartX.value -= pageWidth;

            edgeDragTimer = null;
          }, EDGE_DRAG_DELAY);
        }
      } else {
        if (edgeDragTimer) {
          clearTimeout(edgeDragTimer);
          edgeDragTimer = null;
        }
      }

      const gridPos = calculateGridPosition(touchX, touchY, currentPage.value);

      if (currentTouchItem.value) {
        reorderIcons(currentTouchItem.value, currentPage.value, gridPos.globalIndex);
      }
    } else {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }

      const angle = Math.abs(Math.atan2(deltaY, deltaX) * (180 / Math.PI));

      if (angle < HORIZONTAL_ANGLE_THRESHOLD || angle > 180 - HORIZONTAL_ANGLE_THRESHOLD) {
      }
    }
  }
}

function handleTouchEnd(e: TouchEvent, item: any) {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }

  if (wiggleModeTimer) {
    clearTimeout(wiggleModeTimer);
    wiggleModeTimer = null;
  }

  if (edgeDragTimer) {
    clearTimeout(edgeDragTimer);
    edgeDragTimer = null;
  }

  if (isDragging.value && hasMoved.value) {
    const container = pagesContainerRef.value;
    if (container && currentTouchItem.value) {
      const containerRect = container.getBoundingClientRect();
      const pageWidth = container.clientWidth;

      const touchX = dragCurrentX.value - containerRect.left;
      const touchY = dragCurrentY.value - containerRect.top;

      const isShortcutItem = currentTouchItem.value.type === "systemicon" && (currentTouchItem.value as any).shortcut;

      if (currentTouchItem.value.type === "app" || isShortcutItem) {
        const targetFolder = checkDropOnFolder(touchX, touchY, currentPage.value);

        if (targetFolder) {
          if (isShortcutItem) {
            desktopStore.addShortcutToFolder(currentTouchItem.value.id, targetFolder.id);
          } else {
            desktopStore.addAppToFolder(currentTouchItem.value.id, targetFolder.id);
          }

          isDragging.value = false;
          isLongPressing.value = false;
          draggedItemId.value = null;
          hasMoved.value = false;
          currentTouchItem.value = null;

          emit("update:draggedApp", null);
          emit("update:draggedFolder", null);
          emit("update:draggedSystemIcon", null);

          dragStartX.value = 0;
          dragStartY.value = 0;
          dragCurrentX.value = 0;
          dragCurrentY.value = 0;
          dragStartIconX.value = 0;
          dragStartIconY.value = 0;
          dragStartPage.value = 0;
          dragStartGridIndex.value = 0;
          return;
        }
      }

      let snapped = snapToGrid(touchX, touchY, currentPage.value);

      if (isPositionOccupied(snapped.x, snapped.y, currentPage.value, currentTouchItem.value.id)) {
        const available = findNextAvailablePosition(currentPage.value, snapped.row, snapped.col, currentTouchItem.value.id);

        if (available) {
          snapped = { ...available, page: currentPage.value };
        } else {
          const nextPage = currentPage.value + 1;
          const nextAvailable = findNextAvailablePosition(nextPage, 0, 0, currentTouchItem.value.id);

          if (nextAvailable) {
            snapped = { ...nextAvailable, page: nextPage };
            currentPage.value = nextPage;
          } else {
            console.warn("No available space found for icon, reverting to original position");
            const originalPage = dragStartPage.value;
            const originalSnapped = snapToGrid(dragStartIconX.value, dragStartIconY.value, originalPage);
            snapped = { ...originalSnapped, page: originalPage };
          }
        }
      }

      const finalPage = snapped.page || currentPage.value;
      const globalX = finalPage * pageWidth + snapped.x;
      const globalY = snapped.y;

      desktopStore.updateItemPosition(currentTouchItem.value.type, currentTouchItem.value.id, globalX, globalY, snapped.row, snapped.col, finalPage);
    }

    isDragging.value = false;
    isLongPressing.value = false;
    draggedItemId.value = null;
    hasMoved.value = false;
    currentTouchItem.value = null;

    emit("update:draggedApp", null);
    emit("update:draggedFolder", null);
    emit("update:draggedSystemIcon", null);

    dragStartX.value = 0;
    dragStartY.value = 0;
    dragCurrentX.value = 0;
    dragCurrentY.value = 0;
    dragStartIconX.value = 0;
    dragStartIconY.value = 0;
    dragStartPage.value = 0;
    dragStartGridIndex.value = 0;
    return;
  }

  if (isWiggleMode.value && !hasMoved.value && currentTouchItem.value) {
    const touch = e.changedTouches[0];
    const contextMenuEvent = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: touch.clientX,
      clientY: touch.clientY,
    });

    if (currentTouchItem.value.type === "folder") {
      emit("folderContextmenu", contextMenuEvent, currentTouchItem.value);
    } else {
      emit("contextmenu", contextMenuEvent, currentTouchItem.value);
    }

    isDragging.value = false;
    isLongPressing.value = false;
    draggedItemId.value = null;
    currentTouchItem.value = null;

    emit("update:draggedApp", null);
    emit("update:draggedFolder", null);
    emit("update:draggedSystemIcon", null);

    return;
  }

  if (!isWiggleMode.value && !isDragging.value && !isLongPressing.value && !hasMoved.value && currentTouchItem.value) {
    const now = Date.now();
    const touch = e.changedTouches[0];

    const timeSinceLastTap = now - lastTapTime;
    const distance = Math.sqrt(Math.pow(touch.clientX - lastTapX, 2) + Math.pow(touch.clientY - lastTapY, 2));

    if (timeSinceLastTap < DOUBLE_TAP_THRESHOLD && distance < DOUBLE_TAP_DISTANCE) {
      if (currentTouchItem.value.type === "folder") {
        emit("folderDblclick", currentTouchItem.value);
      } else if (currentTouchItem.value.type === "systemicon") {
        desktopStore.openSystemApp(currentTouchItem.value.appId);
      } else {
        emit("dblclick", currentTouchItem.value);
      }

      lastTapTime = 0;
      lastTapX = 0;
      lastTapY = 0;
    } else {
      if (currentTouchItem.value.type === "folder") {
        emit("folderClick", currentTouchItem.value);
      } else if (currentTouchItem.value.type !== "systemicon") {
        emit("click", currentTouchItem.value);
      }

      if (currentTouchItem.value) {
        if (currentTouchItem.value.type === "folder") {
          emit("update:selectedFolder", currentTouchItem.value.id);
          emit("update:selectedApp", null);
          emit("update:selectedApps", new Set<string>());
          emit("update:selectedSystemIcon", null);
        } else if (currentTouchItem.value.type === "systemicon") {
          emit("update:selectedSystemIcon", currentTouchItem.value.id);
          emit("update:selectedApp", null);
          emit("update:selectedApps", new Set<string>());
          emit("update:selectedFolder", null);
        } else {
          emit("update:selectedApp", currentTouchItem.value.id);
          emit("update:selectedApps", new Set<string>());
          emit("update:selectedFolder", null);
          emit("update:selectedSystemIcon", null);
        }
      }

      lastTapTime = now;
      lastTapX = touch.clientX;
      lastTapY = touch.clientY;
    }
  }

  isDragging.value = false;
  isLongPressing.value = false;
  draggedItemId.value = null;
  hasMoved.value = false;
  currentTouchItem.value = null;

  emit("update:draggedApp", null);
  emit("update:draggedFolder", null);
  emit("update:draggedSystemIcon", null);

  dragStartX.value = 0;
  dragStartY.value = 0;
  dragCurrentX.value = 0;
  dragCurrentY.value = 0;
  dragStartIconX.value = 0;
  dragStartIconY.value = 0;
  dragStartPage.value = 0;
  dragStartGridIndex.value = 0;
}

function handleFolderClick(folder: DesktopFolder, e?: MouseEvent) {
  emit("folderClick", folder, e);

  emit("update:selectedFolder", folder.id);
  emit("update:selectedApp", null);
  emit("update:selectedApps", new Set<string>());
}

function handleFolderDoubleClick(folder: DesktopFolder) {
  if (isMobile.value) return;
  emit("folderDblclick", folder);
}

function handleFolderContextMenu(e: MouseEvent, folder: DesktopFolder) {
  emit("folderContextmenu", e, folder);
}

function getAppImagePath(item: any): string {
  return (item as DockerApp).image_path;
}

function isAppProcessing(item: any): boolean {
  return (item as DockerApp).isProcessing === true;
}

function getAppStatus(item: any): string {
  return (item as DockerApp).status;
}

function getAsFolder(item: any): DesktopFolder {
  return item as DesktopFolder;
}

function calculateGridSettings() {
  const containerWidth = pagesContainerRef.value?.clientWidth || windowWidth.value;
  const availableWidth = containerWidth - MOBILE_PADDING * 2;
  const cols = gridColumns.value;

  GRID_SIZE_X.value = Math.floor(availableWidth / cols);
  GRID_SIZE_Y.value = GRID_SIZE_X.value + 15;

  updateScrollProgress();
}

onMounted(() => {
  calculateGridSettings();

  window.addEventListener("resize", calculateGridSettings);

  nextTick(assignMobileWidgetPositions);
});

watch(
  () => {
    const positioned = [...systemDesktopIcons.value, ...desktopFolders.value, ...mainDockerApps.value].filter((item) => item.x !== undefined).length;
    return widgetsStore.instances.map((i) => `${i.instanceId}:${i.mobileRow ?? "?"}:${i.mobileCol ?? "?"}:${i.size}`).join("|") + `#${positioned}`;
  },
  () => {
    nextTick(assignMobileWidgetPositions);
  },
);

onUnmounted(() => {
  window.removeEventListener("resize", calculateGridSettings);

  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }

  if (scrollProgressFrame !== null) {
    cancelAnimationFrame(scrollProgressFrame);
    scrollProgressFrame = null;
  }

  if (longPressTimer) {
    clearTimeout(longPressTimer);
  }

  if (wiggleModeTimer) {
    clearTimeout(wiggleModeTimer);
  }

  if (desktopLongPressTimer) {
    clearTimeout(desktopLongPressTimer);
  }

  if (edgeDragTimer) {
    clearTimeout(edgeDragTimer);
  }

  clearWidgetTimers();
});

watch(currentPage, (newPage, oldPage) => {
  if ((isDragging.value || draggedMobileWidget.value !== null) && newPage > oldPage) {
    nextTick(() => {
      const container = pagesContainerRef.value;
      if (!container) return;

      const pageWidth = container.clientWidth;
      const targetScrollLeft = newPage * pageWidth;

      if (Math.abs(container.scrollLeft - targetScrollLeft) > 10) {
        container.scrollTo({
          left: targetScrollLeft,
          behavior: "auto",
        });
      }
    });
  }
});

watch([isPortrait, isLandscape], () => {
  calculateGridSettings();
  nextTick(() => {
    if (currentPage.value >= totalPages.value) {
      currentPage.value = Math.max(0, totalPages.value - 1);
      goToPage(currentPage.value);
    }
  });
});
</script>

<style scoped>
.mobile-desktop-pages-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.desktop-pages-container {
  position: relative;
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  width: 100%;
  height: 100%;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.desktop-pages-container::-webkit-scrollbar {
  display: none;
}

.desktop-page {
  flex-shrink: 0;
  width: 100%;
  height: 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  position: relative;
  padding: 0;
}

.icon-appear-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.icon-appear-leave-active {
  transition: all 0.3s ease-in;
}

.icon-appear-enter-from {
  opacity: 0;
  transform: scale(0.5) translateY(20px);
}

.icon-appear-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.icon-appear-move {
  transition:
    left 0.4s ease,
    top 0.4s ease,
    transform 0.4s ease;
}

.opacity-fade-enter-active,
.opacity-fade-leave-active {
  transition: opacity 0.5s ease-in-out;
}

.opacity-fade-enter-from,
.opacity-fade-leave-to {
  opacity: 0;
}

.loading-overlay-fade-enter-active {
  transition: opacity 0.3s ease-out;
}

.loading-overlay-fade-leave-active {
  transition: opacity 0.4s ease-in;
}

.loading-overlay-fade-enter-from,
.loading-overlay-fade-leave-to {
  opacity: 0;
}

.loading-overlay-fade-enter-to,
.loading-overlay-fade-leave-from {
  opacity: 1;
}

@keyframes pulse-badge {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0);
  }
}

.status-pulse {
  animation: pulse-badge 2s ease-in-out infinite;
}

/* Icon Switch Transition (matches DesktopFolderIcon customize animation) */
.icon-switch-enter-active,
.icon-switch-leave-active {
  transition: all 0.2s ease;
}

.icon-switch-enter-from {
  opacity: 0;
  transform: scale(0.5) rotate(-15deg);
}

.icon-switch-leave-to {
  opacity: 0;
  transform: scale(0.5) rotate(15deg);
}

.desktop-mobile-icon {
  position: absolute;
  z-index: 1;
}

.icon-dragging {
  opacity: 0.9 !important;
  transform: scale(1.1) !important;
  z-index: 1000 !important;
  transition: none !important;
  filter: drop-shadow(0 10px 25px rgba(0, 0, 0, 0.3));
  cursor: grabbing !important;
}

/* Widgets: no opacity and no filter here */
.widget-dragging {
  z-index: 1000 !important;
  transition: none !important;
  transform: scale(1.03);
}

/* Disable TransitionGroup FLIP for the widget group */
.widget-move-none {
  transition: none !important;
}

/* Widget entry never animates opacity */
.widget-appear-enter-active {
  transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.widget-appear-enter-from {
  transform: translateY(18px) scale(0.95);
}

.widget-appear-leave-active {
  transition: all 0.25s ease-in;
}

.widget-appear-leave-to {
  opacity: 0;
  transform: scale(0.92);
}

.icon-dragging .desktop-icon-container {
  transform: rotate(5deg);
}

.icon-wiggle {
  animation: wiggle-animation 0.4s ease-in-out infinite alternate;
}

@keyframes wiggle-animation {
  0% {
    transform: rotate(-1deg) translateY(0px);
  }
  25% {
    transform: rotate(1deg) translateY(-1px);
  }
  50% {
    transform: rotate(-1.5deg) translateY(0px);
  }
  75% {
    transform: rotate(1.5deg) translateY(-1px);
  }
  100% {
    transform: rotate(-1deg) translateY(0px);
  }
}

.wiggle-mode-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 999;
  pointer-events: none;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  padding: 16px;
}

.wiggle-done-button {
  pointer-events: auto;
  padding: 8px 24px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 20px;
  background: rgba(0, 122, 255, 0.95);
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.wiggle-done-button:active {
  transform: scale(0.95);
  background: rgba(0, 122, 255, 1);
}

.wiggle-overlay-fade-enter-active,
.wiggle-overlay-fade-leave-active {
  transition: opacity 0.3s ease;
}

.wiggle-overlay-fade-enter-from,
.wiggle-overlay-fade-leave-to {
  opacity: 0;
}

.wiggle-overlay-fade-enter-active .wiggle-done-button {
  animation: slide-down 0.3s ease;
}

@keyframes slide-down {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
