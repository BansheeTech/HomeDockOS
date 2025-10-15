<!-- homedock-ui/vue3/static/js/__Desktop__/MobileDesktopPages.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="mobile-desktop-pages-wrapper">
    <div ref="pagesContainerRef" class="desktop-pages-container" @scroll="handlePageScroll" @touchstart="handlePageTouchStart" @touchmove="handlePageTouchMove" @touchend="handlePageTouchEnd">
      <div v-for="(pageItems, pageIndex) in iconsByPage" :key="`page-${pageIndex}`" class="desktop-page" :data-page="pageIndex">
        <TransitionGroup name="icon-appear">
          <div v-for="item in pageItems.filter((i: any) => i.type === 'app')" :key="item.id" :class="['desktop-mobile-icon group flex flex-col items-center gap-1 cursor-pointer px-3 py-1.5 rounded-lg touch-none select-none outline-none border', !(selectedApp === item.id || selectedApps.has(item.id)) && ['border-transparent', 'shadow-[0_0_0_1px_transparent]'], (selectedApp === item.id || selectedApps.has(item.id)) && [themeClasses.desktopIconBgSelected, themeClasses.desktopIconBorderSelected, themeClasses.desktopIconShadowSelected], isDragging && draggedItemId === item.id ? 'icon-dragging' : '', isWiggleMode && draggedItemId !== item.id ? 'icon-wiggle' : '', !isDragging || draggedItemId !== item.id ? 'transition-[left,top,background,transform,border,box-shadow] duration-[400ms,400ms,150ms,200ms,0ms,0ms] ease-[ease,ease,ease,ease,ease,ease]' : '']" :style="getIconStyle(item, pageIndex)" @touchstart="handleTouchStart($event, item)" @touchmove="handleTouchMove($event, item)" @touchend="handleTouchEnd($event, item)" :title="`${item.name} (${item.status})`">
            <div :class="['relative w-16 h-16 flex items-center justify-center rounded-2xl overflow-hidden transition-[background,transform,border-color] duration-[150ms,200ms,0ms] ease-[ease,ease,ease] pointer-events-none border', themeClasses.desktopIconContainerBg, themeClasses.desktopIconContainerScaleHover, !(selectedApp === item.id || selectedApps.has(item.id)) && ['border-transparent', themeClasses.desktopIconContainerBgHover], (selectedApp === item.id || selectedApps.has(item.id)) && [themeClasses.desktopIconContainerBgSelected, themeClasses.desktopIconContainerBorderSelected], getContainerClasses(item)]">
              <BaseImage :src="item.image_path" class="w-12 h-12 object-contain pointer-events-none rounded-xl" alt="" draggable="false" />
              <Transition name="loading-overlay-fade">
                <div v-if="item.isProcessing === true" class="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl pointer-events-none z-[2]">
                  <div class="w-8 h-8 rounded-full border-[3px] border-white/30 border-t-blue-500 animate-spin shadow-lg"></div>
                </div>
              </Transition>
              <div :class="['absolute bottom-1 right-1 w-3 h-3 rounded-full z-[3] pointer-events-none transition-all duration-200', getStatusBadgeClass(item.status), themeClasses.desktopStatusBadgeBorder, item.status === 'running' && 'status-pulse']"></div>
            </div>
            <span :class="[themeClasses.desktopIconText, 'text-xs text-center max-w-full overflow-hidden text-ellipsis whitespace-nowrap pointer-events-none font-medium']" style="line-height: 1.25rem">{{ item.name }}</span>
          </div>
        </TransitionGroup>

        <TransitionGroup name="icon-appear">
          <DesktopFolderIcon v-for="item in pageItems.filter((i: any) => i.type === 'folder')" :key="item.id" :folder="item" :is-selected="selectedFolder === item.id" :is-dragging="draggedFolder === item.id" :style="getIconStyle(item, pageIndex)" @touchstart="(e: TouchEvent) => handleTouchStart(e, item)" @touchmove="(e: TouchEvent) => handleTouchMove(e, item)" @touchend="(e: TouchEvent) => handleTouchEnd(e, item)" @click="handleFolderClick" @dblclick="handleFolderDoubleClick" @contextmenu="handleFolderContextMenu" />
        </TransitionGroup>
      </div>
    </div>

    <PageIndicator :current-page="currentPage" :total-pages="totalPages" @page-change="goToPage" />

    <Transition name="wiggle-overlay-fade">
      <div v-if="isWiggleMode" class="wiggle-mode-overlay">
        <button class="wiggle-done-button" :class="themeClasses.wiggleDoneButton" @click="exitWiggleMode">Done</button>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useDesktopStore, type DockerApp, type DesktopFolder } from "../__Stores__/desktopStore";
import { useWindowStore } from "../__Stores__/windowStore";
import { useResponsive } from "../__Composables__/useResponsive";
import { useTheme } from "../__Themes__/ThemeSelector";
import BaseImage from "../__Components__/BaseImage.vue";
import DesktopFolderIcon from "./DesktopFolderIcon.vue";
import PageIndicator from "./PageIndicator.vue";

interface Props {
  selectedApp: string | null;
  selectedApps: Set<string>;
  selectedFolder: string | null;
  draggedApp: string | null;
  draggedFolder: string | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "update:selectedApp", value: string | null): void;
  (e: "update:selectedApps", value: Set<string>): void;
  (e: "update:selectedFolder", value: string | null): void;
  (e: "update:draggedApp", value: string | null): void;
  (e: "update:draggedFolder", value: string | null): void;
  (e: "update:isWiggleMode", value: boolean): void;
  (e: "click", app: DockerApp, event?: MouseEvent): void;
  (e: "dblclick", app: DockerApp): void;
  (e: "contextmenu", event: MouseEvent, app: DockerApp): void;
  (e: "desktopContextmenu", event: MouseEvent): void;
  (e: "closeContextMenu"): void;
  (e: "folderClick", folder: DesktopFolder, event?: MouseEvent): void;
  (e: "folderDblclick", folder: DesktopFolder): void;
  (e: "folderContextmenu", event: MouseEvent, folder: DesktopFolder): void;
}>();

const desktopStore = useDesktopStore();
const windowStore = useWindowStore();
const { windowWidth, windowHeight, isPortrait, isLandscape } = useResponsive();
const { themeClasses } = useTheme();

const pagesContainerRef = ref<HTMLDivElement | null>(null);

const currentPage = ref(0);
const isScrolling = ref(false);
let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

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
const GRID_SIZE_X = ref(85);
const GRID_SIZE_Y = ref(100);

const mainDockerApps = computed(() => desktopStore.desktopRootApps);
const desktopFolders = computed(() => desktopStore.desktopFolders);

const gridColumns = computed(() => {
  return isPortrait.value ? 4 : 6;
});

const gridRows = computed(() => {
  const containerHeight = pagesContainerRef.value?.clientHeight || windowHeight.value;
  const availableHeight = containerHeight - MOBILE_PADDING * 2;
  return Math.floor(availableHeight / GRID_SIZE_Y.value);
});

const iconsPerPage = computed(() => {
  return gridColumns.value * Math.max(1, gridRows.value - 1);
});

const iconsByPage = computed(() => {
  const container = pagesContainerRef.value;
  const pageWidth = container?.clientWidth || windowWidth.value;

  const folders = desktopFolders.value.map((f) => ({ ...f, type: "folder" as const }));
  const apps = mainDockerApps.value.map((a) => ({ ...a, type: "app" as const }));
  const allItems = [...folders, ...apps];

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

  const maxPage = Math.max(0, ...itemsWithPage.map((item) => item.pageIndex));

  const pages: Array<Array<(typeof allItems)[0]>> = [];
  for (let i = 0; i <= maxPage; i++) {
    const pageItems = itemsWithPage.filter((item) => item.pageIndex === i).map(({ pageIndex, ...item }) => item);
    pages.push(pageItems);
  }

  if (isDragging.value) {
    const minPages = Math.max(1, currentPage.value + 1);
    while (pages.length < minPages) {
      pages.push([]);
    }
  } else {
    while (pages.length > 1 && pages[pages.length - 1].length === 0) {
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

function getIconStyle(item: any, pageIndex: number): Record<string, string> {
  const container = pagesContainerRef.value;
  const pageWidth = container?.clientWidth || windowWidth.value;

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
    };
  }

  return {
    position: "absolute",
    opacity: "0",
    pointerEvents: "none",
    left: "0",
    top: "0",
    width: `${GRID_SIZE_X.value}px`,
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
  row = Math.max(0, Math.min(row, gridRows.value - 2));

  const globalIndex = row * gridColumns.value + col;

  return { col, row, globalIndex };
}

function snapToGrid(x: number, y: number, pageIndex: number): { x: number; y: number; row: number; col: number; page: number } {
  const container = pagesContainerRef.value;
  if (!container) return { x: 0, y: 0, row: 0, col: 0, page: 0 };

  const col = Math.round((x - MOBILE_PADDING) / GRID_SIZE_X.value);
  const row = Math.round((y - MOBILE_PADDING) / GRID_SIZE_Y.value);

  const clampedCol = Math.max(0, Math.min(col, gridColumns.value - 1));
  const clampedRow = Math.max(0, Math.min(row, gridRows.value - 2));

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

  const pageWidth = container.clientWidth;

  const folders = desktopFolders.value.map((f) => ({ ...f, type: "folder" as const }));
  const apps = mainDockerApps.value.map((a) => ({ ...a, type: "app" as const }));
  const allItems = [...folders, ...apps];

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
        for (let row = Math.max(0, preferredRow - radius); row <= Math.min(gridRows.value - 2, preferredRow + radius); row++) {
          if (col >= 0 && col < gridColumns.value && row >= 0 && row < gridRows.value - 1) {
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

  for (let row = 0; row < gridRows.value - 1; row++) {
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

function getContainerClasses(app: any): string {
  const statusClasses: Record<string, string> = {
    running: "",
    paused: "brightness-50 opacity-75",
    exited: "grayscale brightness-50 opacity-75",
    created: "brightness-50 sepia opacity-50",
  };
  return statusClasses[app.status] || "";
}

function handlePageScroll() {
  const container = pagesContainerRef.value;
  if (!container) return;

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
        })
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

      if (currentTouchItem.value.type === "app") {
        const targetFolder = checkDropOnFolder(touchX, touchY, currentPage.value);

        if (targetFolder) {
          desktopStore.addAppToFolder(currentTouchItem.value.id, targetFolder.id);

          isDragging.value = false;
          isLongPressing.value = false;
          draggedItemId.value = null;
          hasMoved.value = false;
          currentTouchItem.value = null;

          emit("update:draggedApp", null);
          emit("update:draggedFolder", null);

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

      if (currentTouchItem.value.type === "app") {
        desktopStore.updateIconPosition(currentTouchItem.value.id, globalX, globalY, snapped.row, snapped.col);
      } else if (currentTouchItem.value.type === "folder") {
        desktopStore.updateFolderPosition(currentTouchItem.value.id, globalX, globalY, snapped.row, snapped.col);
      }
    }

    isDragging.value = false;
    isLongPressing.value = false;
    draggedItemId.value = null;
    hasMoved.value = false;
    currentTouchItem.value = null;

    emit("update:draggedApp", null);
    emit("update:draggedFolder", null);

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
      } else {
        emit("dblclick", currentTouchItem.value);
      }

      lastTapTime = 0;
      lastTapX = 0;
      lastTapY = 0;
    } else {
      if (currentTouchItem.value.type === "folder") {
        emit("folderClick", currentTouchItem.value);
      } else {
        emit("click", currentTouchItem.value);
      }

      if (currentTouchItem.value) {
        if (currentTouchItem.value.type === "folder") {
          emit("update:selectedFolder", currentTouchItem.value.id);
          emit("update:selectedApp", null);
          emit("update:selectedApps", new Set<string>());
        } else {
          emit("update:selectedApp", currentTouchItem.value.id);
          emit("update:selectedApps", new Set<string>());
          emit("update:selectedFolder", null);
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
  emit("folderDblclick", folder);
}

function handleFolderContextMenu(e: MouseEvent, folder: DesktopFolder) {
  emit("folderContextmenu", e, folder);
}

function calculateGridSettings() {
  const containerWidth = pagesContainerRef.value?.clientWidth || windowWidth.value;
  const availableWidth = containerWidth - MOBILE_PADDING * 2;
  const cols = gridColumns.value;

  GRID_SIZE_X.value = Math.floor(availableWidth / cols);
  GRID_SIZE_Y.value = GRID_SIZE_X.value + 15;
}

onMounted(() => {
  calculateGridSettings();

  window.addEventListener("resize", calculateGridSettings);
});

onUnmounted(() => {
  window.removeEventListener("resize", calculateGridSettings);

  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
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
});

watch(currentPage, (newPage, oldPage) => {
  if (isDragging.value && newPage > oldPage) {
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
  transition: left 0.4s ease, top 0.4s ease, transform 0.4s ease;
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
