<!-- homedock-ui/vue3/static/js/__Desktop__/DesktopIconsGrid.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="desktop-icons-container" ref="containerRef" @contextmenu="handleDesktopContextMenu" @mousedown="handleDesktopMouseDown">
    <Transition name="loading-fade">
      <div v-if="isLoading" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-[100]">
        <div :class="[themeClasses.desktopLoadingBg, themeClasses.desktopLoadingBorder]" class="flex flex-col items-center gap-4 px-12 py-8 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
          <div class="w-12 h-12 border-4 border-white/10 rounded-full animate-spin" :class="[themeClasses.desktopLoadingSpinner]" style="border-top-color: currentColor"></div>
          <p :class="[themeClasses.desktopLoadingText]" class="text-sm font-medium m-0 tracking-wide">Loading applications...</p>
          <div :class="[themeClasses.desktopLoadingBarBg]" class="w-[200px] h-[3px] rounded-[3px] overflow-hidden">
            <div :class="[themeClasses.desktopLoadingBarFill]" class="h-full bg-[length:200%_100%] animate-[loading-bar-animation_1.5s_ease-in-out_infinite]"></div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="empty-state-fade">
      <div v-if="!isLoading && desktopStore.mainDockerApps.length === 0" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center p-12 z-[100] pointer-events-none">
        <div :class="[themeClasses.desktopEmptyBg, themeClasses.desktopEmptyBorder]" class="flex flex-col items-center gap-2 text-center max-w-[400px] rounded-2xl px-6 py-4 pointer-events-auto">
          <AnimatedIcon :icons="[hexagonOutlineIcon, hexagonSlice2Icon, hexagonSlice4Icon, hexagonSlice6Icon, hexagonSlice4Icon, hexagonSlice2Icon]" :iconSize="isMobile ? 48 : 64" :interval="1000" :containerClass="`${themeClasses.desktopEmptyIcon} mb-2`" />
          <h3 :class="[themeClasses.desktopEmptyTitle]" class="text-2xl font-semibold m-0">No apps installed yet</h3>
          <p :class="[themeClasses.desktopEmptyDescription]" class="text-sm m-0 leading-relaxed">Get started by installing your first application from the App Store</p>
          <button :class="[themeClasses.desktopInstallButtonBg, themeClasses.desktopInstallButtonText, themeClasses.desktopInstallButtonBgHover, themeClasses.desktopInstallButtonShadow]" class="flex items-center justify-center gap-2 px-6 py-3 mt-2 border-none rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap" @click="openAppStore">
            <Icon :icon="widgetsOutlineIcon" class="w-[18px] h-[18px] flex-shrink-0" />
            <span>Browse App Store</span>
          </button>
        </div>
      </div>
    </Transition>

    <MobileDesktopPages v-if="isMobile" :selected-app="selectedApp" :selected-apps="selectedApps" :selected-folder="selectedFolder" :dragged-app="draggedApp" :dragged-folder="draggedFolder" @update:selected-app="selectedApp = $event" @update:selected-apps="selectedApps = $event" @update:selected-folder="selectedFolder = $event" @update:dragged-app="draggedApp = $event" @update:dragged-folder="draggedFolder = $event" @update:is-wiggle-mode="isWiggleMode = $event" @click="handleClick" @dblclick="handleDoubleClick" @contextmenu="handleContextMenu" @desktop-contextmenu="handleDesktopContextMenu" @close-context-menu="closeContextMenu" @folder-click="handleFolderClick" @folder-dblclick="handleFolderDoubleClick" @folder-contextmenu="handleFolderContextMenu" @folder-touch-start="handleFolderTouchStart" />

    <template v-else>
      <div v-if="isSelectingArea" :class="[themeClasses.desktopSelectionBorder, themeClasses.desktopSelectionBg]" class="absolute pointer-events-none z-[2]" :style="selectionBoxStyle"></div>

      <TransitionGroup name="icon-appear">
        <div v-for="app in mainDockerApps" :key="app.id" :class="['group flex flex-col items-center gap-1 cursor-pointer p-3 rounded-lg transition-[left,top,background,transform,border,box-shadow] duration-[400ms,400ms,150ms,200ms,0ms,0ms] ease-[ease,ease,ease,ease,ease,ease] w-[100px] z-[1] touch-none select-none outline-none border', !(selectedApp === app.id || selectedApps.has(app.id)) && ['border-transparent', 'shadow-[0_0_0_1px_transparent]'], (selectedApp === app.id || selectedApps.has(app.id)) && [themeClasses.desktopIconBgSelected, themeClasses.desktopIconBorderSelected, themeClasses.desktopIconShadowSelected], draggedApp === app.id ? 'opacity-70 !cursor-grabbing !z-[1000] !transition-none' : 'hover:-translate-y-0.5 active:cursor-grabbing']" :style="getIconStyle(app)" @mousedown="handleMouseDown($event, app)" @touchstart.passive="handleTouchStart($event, app)" @click="handleClick(app, $event)" @dblclick="handleDoubleClick(app)" @contextmenu="handleContextMenu($event, app)" :title="`${app.name} (${app.status})`">
          <div :class="['relative w-16 h-16 flex items-center justify-center rounded-2xl overflow-hidden transition-[background,transform,border-color] duration-[150ms,200ms,0ms] ease-[ease,ease,ease] pointer-events-none border', themeClasses.desktopIconContainerBg, themeClasses.desktopIconContainerScaleHover, !(selectedApp === app.id || selectedApps.has(app.id)) && ['border-transparent', themeClasses.desktopIconContainerBgHover], (selectedApp === app.id || selectedApps.has(app.id)) && [themeClasses.desktopIconContainerBgSelected, themeClasses.desktopIconContainerBorderSelected], getContainerClasses(app)]">
            <BaseImage :src="app.image_path" class="w-12 h-12 object-contain pointer-events-none rounded-xl" alt="" draggable="false" />
            <Transition name="loading-overlay-fade">
              <div v-if="app.isProcessing === true" class="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl pointer-events-none z-[2]">
                <div class="w-8 h-8 rounded-full border-[3px] border-white/30 border-t-blue-500 animate-spin shadow-lg"></div>
              </div>
            </Transition>
            <div :class="['absolute bottom-1 right-1 w-3 h-3 rounded-full z-[3] pointer-events-none transition-all duration-200', getStatusBadgeClass(app.status), themeClasses.desktopStatusBadgeBorder, app.status === 'running' && 'status-pulse']"></div>
          </div>
          <span :class="[themeClasses.desktopIconText, 'text-xs text-center max-w-full overflow-hidden text-ellipsis whitespace-nowrap pointer-events-none font-medium']" style="line-height: 1.25rem">{{ app.name }}</span>
        </div>
      </TransitionGroup>

      <TransitionGroup v-if="desktopStore.mainDockerApps.length > 0 || desktopFolders.some((f: DesktopFolder) => f.items.length > 0)" name="icon-appear">
        <DesktopFolderIcon v-for="folder in displayedFolders" :key="folder.id" :folder="folder" :is-selected="selectedFolder === folder.id" :is-dragging="draggedFolder === folder.id" @mousedown="handleFolderMouseDown" @touchstart="handleFolderTouchStart" @click="handleFolderClick" @dblclick="handleFolderDoubleClick" @contextmenu="handleFolderContextMenu" />
      </TransitionGroup>
    </template>

    <ContextMenu :visible="contextMenu.visible" :x="contextMenu.x" :y="contextMenu.y" :items="contextMenuItems" @close="closeContextMenu" />

    <AppDialog v-model:visible="showCreateFolderModal" type="info" title="Create New Folder" ok-text="Create" cancel-text="Cancel" @ok="handleCreateFolderOk" @cancel="handleCreateFolderCancel">
      <input v-model="createFolderName" placeholder="Folder name" class="w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors" :class="[themeClasses.windowBg, themeClasses.windowBorder, themeClasses.windowText, themeClasses.windowBorderFocused]" @keyup.enter="handleCreateFolderOk" />
    </AppDialog>

    <AppDialog v-model:visible="showRenameFolderModal" type="info" title="Rename Folder" ok-text="Rename" cancel-text="Cancel" @ok="handleRenameFolderOk" @cancel="handleRenameFolderCancel">
      <input v-model="renameFolderName" placeholder="Folder name" class="w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors" :class="[themeClasses.windowBg, themeClasses.windowBorder, themeClasses.windowText, themeClasses.windowBorderFocused]" @keyup.enter="handleRenameFolderOk" />
    </AppDialog>

    <ColorPickerMenu :visible="showColorPickerMenu" :x="colorPickerPosition.x" :y="colorPickerPosition.y" v-model="folderColor" @apply="handleColorChangeApply" @cancel="handleColorChangeCancel" @close="showColorPickerMenu = false" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";

import { useDesktopStore, DockerApp, DesktopFolder } from "../__Stores__/desktopStore";
import { useWindowStore } from "../__Stores__/windowStore";
import { useSelectedAppsStore } from "../__Stores__/selectedAppsStore";

import { useResponsive } from "../__Composables__/useResponsive";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useDialog } from "../__Composables__/useDialog";

import { useTheme } from "../__Themes__/ThemeSelector";

import { fetchContainers, startContainerPolling, stopContainerPolling } from "../__Services__/DockerAPIFetchContainerData";

import BaseImage from "../__Components__/BaseImage.vue";
import ContextMenu, { type ContextMenuItem } from "../__Components__/ContextMenu.vue";
import AnimatedIcon from "../__Components__/AnimatedIcon.vue";
import DesktopFolderIcon from "./DesktopFolderIcon.vue";
import ColorPickerMenu from "../__Components__/ColorPickerMenu.vue";
import MobileDesktopPages from "./MobileDesktopPages.vue";
import AppDialog from "../__Components__/AppDialog.vue";

import { startContainer, stopContainer, restartContainer, pauseContainer, unpauseContainer, uninstallContainer, updateContainer } from "../__Services__/DockerActions";

import { Icon } from "@iconify/vue";
import openIcon from "@iconify-icons/mdi/open-in-new";
import playIcon from "@iconify-icons/mdi/play";
import stopIcon from "@iconify-icons/mdi/stop";
import restartIcon from "@iconify-icons/mdi/restart";
import pauseIcon from "@iconify-icons/mdi/cog-pause";
import unpauseIcon from "@iconify-icons/mdi/cog-play";
import uninstallIcon from "@iconify-icons/mdi/delete-alert";
import updateIcon from "@iconify-icons/mdi/shape-circle-plus";
import terminalIcon from "@iconify-icons/mdi/console";
import refreshIcon from "@iconify-icons/mdi/refresh";
import resetIcon from "@iconify-icons/mdi/restore";
import propertiesIcon from "@iconify-icons/mdi/information-outline";
import checkIcon from "@iconify-icons/mdi/check-circle";
import widgetsOutlineIcon from "@iconify-icons/mdi/widgets-outline";
import folderPlusIcon from "@iconify-icons/mdi/folder-plus";
import folderOpenIcon from "@iconify-icons/mdi/folder-open";
import folderEditIcon from "@iconify-icons/mdi/folder-edit";
import folderRemoveIcon from "@iconify-icons/mdi/folder-remove";
import paletteIcon from "@iconify-icons/mdi/palette";

import hexagonOutlineIcon from "@iconify-icons/mdi/hexagon-outline";
import hexagonSlice2Icon from "@iconify-icons/mdi/hexagon-slice-2";
import hexagonSlice4Icon from "@iconify-icons/mdi/hexagon-slice-4";
import hexagonSlice6Icon from "@iconify-icons/mdi/hexagon-slice-6";

const desktopStore = useDesktopStore();
const windowStore = useWindowStore();
const selectedAppsStore = useSelectedAppsStore();
const { isMobile, isPortrait, isLandscape, windowWidth, windowHeight } = useResponsive();
const { themeClasses } = useTheme();
const { confirm } = useDialog();

const csrfToken = useCsrfToken();

const containerRef = ref<HTMLDivElement | null>(null);

const isLoading = ref(true);
const foldersLoaded = ref(false);
const selectedApp = ref<string | null>(null);
const selectedApps = ref<Set<string>>(new Set());
const selectedFolder = ref<string | null>(null);
const draggedFolder = ref<string | null>(null);
const isWiggleMode = ref(false);

const isSelectingArea = ref(false);
const selectionBox = ref({
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
});

const contextMenuApp = ref<DockerApp | null>(null);
const contextMenuFolder = ref<DesktopFolder | null>(null);
const draggedApp = ref<string | null>(null);
const isDragging = ref(false);
const hasMoved = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const dragStartIconX = ref(0);
const dragStartIconY = ref(0);
const draggedAppsInitialPositions = ref<Map<string, { x: number; y: number }>>(new Map());

const GRID_SIZE_X = ref(110);
const GRID_SIZE_Y = ref(125);
const ICON_PADDING = ref(16);

const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
});

const showCreateFolderModal = ref(false);
const createFolderName = ref("New Folder");
const createFolderPosition = ref<{ x: number; y: number; row: number; col: number } | null>(null);

const showRenameFolderModal = ref(false);
const renameFolderId = ref<string | null>(null);
const renameFolderName = ref("");

const showColorPickerMenu = ref(false);
const colorPickerFolderId = ref<string | null>(null);
const folderColor = ref("#3b82f6");
const colorPickerPosition = ref({ x: 0, y: 0 });

function openCreateFolderModal() {
  if (isMobile.value) {
    createFolderPosition.value = null;
  } else {
    createFolderPosition.value = findNextAvailablePosition();
  }

  createFolderName.value = "New Folder";
  showCreateFolderModal.value = true;
}

function handleCreateFolderOk() {
  if (createFolderName.value.trim()) {
    if (isMobile.value) {
      desktopStore.createFolder(createFolderName.value.trim());
      initializeGridPositions();
    } else if (createFolderPosition.value) {
      const pos = createFolderPosition.value;
      desktopStore.createFolder(createFolderName.value.trim(), pos.x, pos.y, pos.row, pos.col);
    }
    showCreateFolderModal.value = false;
  }
}

function handleCreateFolderCancel() {
  showCreateFolderModal.value = false;
  createFolderName.value = "New Folder";
  createFolderPosition.value = null;
}

function openRenameFolderModal(folderId: string, currentName: string) {
  renameFolderId.value = folderId;
  renameFolderName.value = currentName;
  showRenameFolderModal.value = true;
}

function handleRenameFolderOk() {
  if (renameFolderId.value && renameFolderName.value.trim()) {
    desktopStore.renameFolder(renameFolderId.value, renameFolderName.value.trim());
    showRenameFolderModal.value = false;
  }
}

function handleRenameFolderCancel() {
  showRenameFolderModal.value = false;
  renameFolderId.value = null;
  renameFolderName.value = "";
}

function openColorPickerMenu(folderId: string, currentColor: string, x: number, y: number) {
  colorPickerFolderId.value = folderId;
  folderColor.value = currentColor || "#3b82f6";
  colorPickerPosition.value = { x, y };
  showColorPickerMenu.value = true;
}

function handleColorChangeApply(color: string) {
  if (colorPickerFolderId.value) {
    desktopStore.updateFolderColor(colorPickerFolderId.value, color);
    showColorPickerMenu.value = false;
  }
}

function handleColorChangeCancel() {
  showColorPickerMenu.value = false;
  colorPickerFolderId.value = null;
  folderColor.value = "#3b82f6";
}

const mainDockerApps = computed(() => desktopStore.desktopRootApps);

const desktopFolders = computed(() => desktopStore.desktopFolders);

const displayedFolders = computed(() => {
  return foldersLoaded.value ? desktopFolders.value : [];
});

const selectionBoxStyle = computed(() => {
  const x = Math.min(selectionBox.value.startX, selectionBox.value.currentX);
  const y = Math.min(selectionBox.value.startY, selectionBox.value.currentY);
  const width = Math.abs(selectionBox.value.currentX - selectionBox.value.startX);
  const height = Math.abs(selectionBox.value.currentY - selectionBox.value.startY);

  return {
    left: `${x}px`,
    top: `${y}px`,
    width: `${width}px`,
    height: `${height}px`,
  };
});

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

function getIconStyle(app: DockerApp): Record<string, string> {
  const baseStyle: Record<string, string> = {};

  if (isMobile.value) {
    baseStyle.width = `${GRID_SIZE_X.value}px`;
  }

  if (app.x !== undefined && app.y !== undefined) {
    return {
      ...baseStyle,
      position: "absolute",
      left: `${app.x}px`,
      top: `${app.y}px`,
    };
  }

  if (app.gridRow !== undefined && app.gridCol !== undefined) {
    return {
      ...baseStyle,
      position: "absolute",
      left: `${ICON_PADDING.value + app.gridCol * GRID_SIZE_X.value}px`,
      top: `${ICON_PADDING.value + app.gridRow * GRID_SIZE_Y.value}px`,
    };
  }

  return {
    ...baseStyle,
    position: "absolute",
    opacity: "0",
    pointerEvents: "none",
    left: "0",
    top: "0",
  };
}

function getContainerClasses(app: DockerApp): string {
  const statusClasses: Record<string, string> = {
    running: "",
    paused: "brightness-50 opacity-75",
    exited: "grayscale brightness-50 opacity-75",
    created: "brightness-50 sepia opacity-50",
  };

  return statusClasses[app.status] || "";
}

function isPositionOccupied(x: number, y: number, excludeAppId?: string, excludeAppIds?: Set<string>, excludeFolderId?: string): boolean {
  const appCollision = mainDockerApps.value.some((app) => {
    if (excludeAppId && app.id === excludeAppId) return false;
    if (excludeAppIds && excludeAppIds.has(app.id)) return false;
    if (app.x === undefined || app.y === undefined) return false;

    const dx = Math.abs(app.x - x);
    const dy = Math.abs(app.y - y);
    return dx < GRID_SIZE_X.value && dy < GRID_SIZE_Y.value;
  });

  if (appCollision) return true;

  const folderCollision = desktopFolders.value.some((folder) => {
    if (excludeFolderId && folder.id === excludeFolderId) return false;
    if (folder.x === undefined || folder.y === undefined) return false;

    const dx = Math.abs(folder.x - x);
    const dy = Math.abs(folder.y - y);
    return dx < GRID_SIZE_X.value && dy < GRID_SIZE_Y.value;
  });

  return folderCollision;
}

function calculateGridSettings() {
  const containerWidth = containerRef.value?.clientWidth || window.innerWidth;

  if (isMobile.value) {
    const MOBILE_COLS = isPortrait.value ? 4 : 6;
    const MOBILE_PADDING = 16;

    const innerContainerWidth = containerWidth - MOBILE_PADDING * 2;

    const availableWidth = innerContainerWidth - MOBILE_PADDING * 2;

    const calculatedGridSizeX = Math.floor(availableWidth / MOBILE_COLS);

    GRID_SIZE_X.value = calculatedGridSizeX;
    GRID_SIZE_Y.value = calculatedGridSizeX + 15;
    ICON_PADDING.value = MOBILE_PADDING;
  } else {
    GRID_SIZE_X.value = 110;
    GRID_SIZE_Y.value = 125;
    ICON_PADDING.value = 16;
  }
}

function findNextAvailablePosition(): { x: number; y: number; row: number; col: number } {
  const containerWidth = containerRef.value?.clientWidth || window.innerWidth;
  const maxCols = Math.floor((containerWidth - ICON_PADDING.value * 2) / GRID_SIZE_X.value);

  let row = 0;
  let col = 0;

  while (true) {
    const x = ICON_PADDING.value + col * GRID_SIZE_X.value;
    const y = ICON_PADDING.value + row * GRID_SIZE_Y.value;

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

function initializeGridPositions() {
  if (isMobile.value) {
    const containerWidth = containerRef.value?.clientWidth || windowWidth.value;
    const containerHeight = containerRef.value?.clientHeight || windowHeight.value;

    const MOBILE_PADDING = 16;
    const pageWidth = containerWidth - MOBILE_PADDING * 2;

    const cols = isPortrait.value ? 4 : 6;

    const availableHeight = containerHeight - MOBILE_PADDING * 2;
    const rows = Math.floor(availableHeight / GRID_SIZE_Y.value);

    const iconsPerPage = cols * Math.max(1, rows - 1);

    const allFolders = desktopFolders.value;
    const allApps = mainDockerApps.value;

    const foldersWithoutPos = allFolders.filter((f) => f.x === undefined && f.y === undefined && f.gridRow === undefined && f.gridCol === undefined);

    const appsWithoutPos = allApps.filter((a) => a.x === undefined && a.y === undefined && a.gridRow === undefined && a.gridCol === undefined);

    const itemsWithoutPos = [...foldersWithoutPos.map((f) => ({ ...f, itemType: "folder" as const })), ...appsWithoutPos.map((a) => ({ ...a, itemType: "app" as const }))];

    if (itemsWithoutPos.length === 0) return;

    const occupiedPositions = new Set<string>();

    [...allFolders, ...allApps].forEach((item) => {
      if (item.x !== undefined && item.y !== undefined) {
        const itemPageIndex = Math.floor(item.x / pageWidth);
        const localX = item.x % pageWidth;
        const localY = item.y;

        const itemCol = Math.round((localX - MOBILE_PADDING) / GRID_SIZE_X.value);
        const itemRow = Math.round((localY - MOBILE_PADDING) / GRID_SIZE_Y.value);

        const posKey = `${itemPageIndex},${itemRow},${itemCol}`;
        occupiedPositions.add(posKey);
      }
    });

    function findNextFreePosition(startGlobalIndex: number): { page: number; row: number; col: number } | null {
      for (let globalIdx = startGlobalIndex; globalIdx < 1000; globalIdx++) {
        const page = Math.floor(globalIdx / iconsPerPage);
        const indexInPage = globalIdx % iconsPerPage;
        const col = indexInPage % cols;
        const row = Math.floor(indexInPage / cols);

        const posKey = `${page},${row},${col}`;
        if (!occupiedPositions.has(posKey)) {
          return { page, row, col };
        }
      }
      return null;
    }

    let searchStartIndex = 0;

    itemsWithoutPos.forEach((item) => {
      const freePos = findNextFreePosition(searchStartIndex);

      if (!freePos) {
        console.error(`No free position found for ${item.itemType} "${item.name}"`);
        return;
      }

      const { page: pageIndex, row, col } = freePos;

      const localX = MOBILE_PADDING + col * GRID_SIZE_X.value;
      const localY = MOBILE_PADDING + row * GRID_SIZE_Y.value;

      const globalX = pageIndex * pageWidth + localX;
      const globalY = localY;

      if (item.itemType === "folder") {
        desktopStore.updateFolderPosition(item.id, globalX, globalY, row, col, pageIndex);
      } else {
        desktopStore.updateIconPosition(item.id, globalX, globalY, row, col, pageIndex);
      }

      const posKey = `${pageIndex},${row},${col}`;
      occupiedPositions.add(posKey);

      searchStartIndex = pageIndex * iconsPerPage + row * cols + col + 1;
    });
  } else {
    const folders = desktopFolders.value;
    folders.forEach((folder) => {
      if (folder.x === undefined && folder.y === undefined && folder.gridRow === undefined && folder.gridCol === undefined) {
        const pos = findNextAvailablePosition();
        desktopStore.updateFolderPosition(folder.id, pos.x, pos.y, pos.row, pos.col);
      }
    });

    const apps = mainDockerApps.value;
    apps.forEach((app) => {
      if (app.x === undefined && app.y === undefined && app.gridRow === undefined && app.gridCol === undefined) {
        const pos = findNextAvailablePosition();
        desktopStore.updateIconPosition(app.id, pos.x, pos.y, pos.row, pos.col);
      }
    });
  }
}

function snapToGrid(x: number, y: number): { x: number; y: number; row: number; col: number } {
  const col = Math.round((x - ICON_PADDING.value) / GRID_SIZE_X.value);
  const row = Math.round((y - ICON_PADDING.value) / GRID_SIZE_Y.value);

  return {
    x: ICON_PADDING.value + col * GRID_SIZE_X.value,
    y: ICON_PADDING.value + row * GRID_SIZE_Y.value,
    row: Math.max(0, row),
    col: Math.max(0, col),
  };
}

function startDrag(app: DockerApp, clientX: number, clientY: number) {
  draggedApp.value = app.id;
  isDragging.value = true;
  dragStartX.value = clientX;
  dragStartY.value = clientY;

  if (app.x !== undefined && app.y !== undefined) {
    dragStartIconX.value = app.x;
    dragStartIconY.value = app.y;
  } else if (app.gridRow !== undefined && app.gridCol !== undefined) {
    dragStartIconX.value = ICON_PADDING.value + app.gridCol * GRID_SIZE_X.value;
    dragStartIconY.value = ICON_PADDING.value + app.gridRow * GRID_SIZE_Y.value;
  } else {
    dragStartIconX.value = 0;
    dragStartIconY.value = 0;
  }

  draggedAppsInitialPositions.value.clear();
  if (selectedApps.value.size > 1 && selectedApps.value.has(app.id)) {
    selectedApps.value.forEach((appId) => {
      const selectedApp = mainDockerApps.value.find((a) => a.id === appId);
      if (selectedApp) {
        let x = 0;
        let y = 0;
        if (selectedApp.x !== undefined && selectedApp.y !== undefined) {
          x = selectedApp.x;
          y = selectedApp.y;
        } else if (selectedApp.gridRow !== undefined && selectedApp.gridCol !== undefined) {
          x = ICON_PADDING.value + selectedApp.gridCol * GRID_SIZE_X.value;
          y = ICON_PADDING.value + selectedApp.gridRow * GRID_SIZE_Y.value;
        }
        draggedAppsInitialPositions.value.set(appId, { x, y });
      }
    });
  }

  const draggedIds = draggedAppsInitialPositions.value.size > 0 ? Array.from(draggedAppsInitialPositions.value.keys()) : [app.id];
  desktopStore.setDraggedApps(draggedIds);
}

function handleMouseDown(e: MouseEvent, app: DockerApp) {
  if (isMobile.value) return;

  if (e.button !== 0) return;

  hasMoved.value = false;

  startDrag(app, e.clientX, e.clientY);

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
}

function handleTouchStart(e: TouchEvent, app: DockerApp) {
  if (!isMobile.value) return;

  if (e.touches.length > 1) return;

  const touch = e.touches[0];

  hasMoved.value = false;

  startDrag(app, touch.clientX, touch.clientY);

  document.addEventListener("touchmove", handleTouchMove, { passive: false });
  document.addEventListener("touchend", handleTouchEnd);
  document.addEventListener("touchcancel", handleTouchEnd);
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value || !draggedApp.value) return;

  const deltaX = e.clientX - dragStartX.value;
  const deltaY = e.clientY - dragStartY.value;

  const DRAG_THRESHOLD = 5;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  if (distance > DRAG_THRESHOLD) {
    hasMoved.value = true;
    e.preventDefault();

    const containerWidth = containerRef.value?.clientWidth || window.innerWidth;
    const containerHeight = containerRef.value?.clientHeight || window.innerHeight;
    const iconWidth = 100;
    const iconHeight = 130;

    if (draggedAppsInitialPositions.value.size > 1) {
      draggedAppsInitialPositions.value.forEach((initialPos, appId) => {
        let newX = initialPos.x + deltaX;
        let newY = initialPos.y + deltaY;

        newX = Math.max(ICON_PADDING.value, Math.min(newX, containerWidth - iconWidth - ICON_PADDING.value));
        newY = Math.max(ICON_PADDING.value, Math.min(newY, containerHeight - iconHeight - ICON_PADDING.value));

        desktopStore.updateIconPosition(appId, newX, newY);
      });
    } else {
      let newX = dragStartIconX.value + deltaX;
      let newY = dragStartIconY.value + deltaY;

      newX = Math.max(ICON_PADDING.value, Math.min(newX, containerWidth - iconWidth - ICON_PADDING.value));
      newY = Math.max(ICON_PADDING.value, Math.min(newY, containerHeight - iconHeight - ICON_PADDING.value));

      desktopStore.updateIconPosition(draggedApp.value, newX, newY);
    }
  }
}

function handleMouseUp(e: MouseEvent) {
  if (!isDragging.value || !draggedApp.value) return;

  if (hasMoved.value) {
    e.preventDefault();
  }

  endDrag();

  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
}

function handleTouchMove(e: TouchEvent) {
  if (!isDragging.value || !draggedApp.value) return;

  if (e.touches.length > 1) {
    handleTouchEnd(e);
    return;
  }

  const touch = e.touches[0];

  const deltaX = touch.clientX - dragStartX.value;
  const deltaY = touch.clientY - dragStartY.value;

  const DRAG_THRESHOLD = 5;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  if (distance > DRAG_THRESHOLD) {
    hasMoved.value = true;

    e.preventDefault();

    const containerWidth = containerRef.value?.clientWidth || window.innerWidth;
    const containerHeight = containerRef.value?.clientHeight || window.innerHeight;
    const iconWidth = 100;
    const iconHeight = 130;

    if (draggedAppsInitialPositions.value.size > 1) {
      draggedAppsInitialPositions.value.forEach((initialPos, appId) => {
        let newX = initialPos.x + deltaX;
        let newY = initialPos.y + deltaY;

        newX = Math.max(ICON_PADDING.value, Math.min(newX, containerWidth - iconWidth - ICON_PADDING.value));
        newY = Math.max(ICON_PADDING.value, Math.min(newY, containerHeight - iconHeight - ICON_PADDING.value));

        desktopStore.updateIconPosition(appId, newX, newY);
      });
    } else {
      let newX = dragStartIconX.value + deltaX;
      let newY = dragStartIconY.value + deltaY;

      newX = Math.max(ICON_PADDING.value, Math.min(newX, containerWidth - iconWidth - ICON_PADDING.value));
      newY = Math.max(ICON_PADDING.value, Math.min(newY, containerHeight - iconHeight - ICON_PADDING.value));

      desktopStore.updateIconPosition(draggedApp.value, newX, newY);
    }
  }
}

function handleTouchEnd(e: TouchEvent) {
  if (!isDragging.value || !draggedApp.value) return;

  e.preventDefault();

  endDrag();

  document.removeEventListener("touchmove", handleTouchMove, { passive: false } as AddEventListenerOptions);
  document.removeEventListener("touchend", handleTouchEnd);
  document.removeEventListener("touchcancel", handleTouchEnd);
}

function checkDropOnFolder(x: number, y: number): DesktopFolder | null {
  const HOVER_THRESHOLD = 80;

  for (const folder of desktopFolders.value) {
    if (folder.x === undefined || folder.y === undefined) continue;

    const dx = Math.abs(folder.x - x);
    const dy = Math.abs(folder.y - y);
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < HOVER_THRESHOLD) {
      return folder;
    }
  }

  return null;
}

function endDrag() {
  if (!draggedApp.value) return;

  try {
    if (hasMoved.value) {
      const app = mainDockerApps.value.find((a) => a.id === draggedApp.value);
      if (app && app.x !== undefined && app.y !== undefined) {
        const targetFolder = checkDropOnFolder(app.x, app.y);

        if (targetFolder) {
          if (draggedAppsInitialPositions.value.size > 1) {
            draggedAppsInitialPositions.value.forEach((pos, appId) => {
              desktopStore.addAppToFolder(appId, targetFolder.id);
            });
          } else {
            desktopStore.addAppToFolder(app.id, targetFolder.id);
          }

          return;
        }
      }

      if (draggedAppsInitialPositions.value.size > 1) {
        const draggedAppData = mainDockerApps.value.find((a) => a.id === draggedApp.value);
        if (!draggedAppData || draggedAppData.x === undefined || draggedAppData.y === undefined) {
          return;
        }

        const mainSnapped = snapToGrid(draggedAppData.x, draggedAppData.y);

        const snapDeltaX = mainSnapped.x - draggedAppData.x;
        const snapDeltaY = mainSnapped.y - draggedAppData.y;

        const groupPositions = new Map<string, { x: number; y: number; row: number; col: number }>();
        draggedAppsInitialPositions.value.forEach((initialPos, appId) => {
          const app = mainDockerApps.value.find((a) => a.id === appId);
          if (app && app.x !== undefined && app.y !== undefined) {
            const snappedX = app.x + snapDeltaX;
            const snappedY = app.y + snapDeltaY;
            const snapped = snapToGrid(snappedX, snappedY);
            groupPositions.set(appId, snapped);
          }
        });

        let hasInternalCollision = false;
        const occupiedPositions = new Set<string>();
        groupPositions.forEach((pos) => {
          const posKey = `${pos.x},${pos.y}`;
          if (occupiedPositions.has(posKey)) {
            hasInternalCollision = true;
          } else {
            occupiedPositions.add(posKey);
          }
        });

        const excludeIds = new Set(draggedAppsInitialPositions.value.keys());
        let hasExternalCollision = false;
        groupPositions.forEach((pos) => {
          if (isPositionOccupied(pos.x, pos.y, undefined, excludeIds)) {
            hasExternalCollision = true;
          }
        });

        if (hasInternalCollision || hasExternalCollision) {
          groupPositions.clear();
          draggedAppsInitialPositions.value.forEach((initialPos, appId) => {
            const snapped = snapToGrid(initialPos.x, initialPos.y);
            groupPositions.set(appId, snapped);
          });
        }

        groupPositions.forEach((pos, appId) => {
          desktopStore.updateIconPosition(appId, pos.x, pos.y, pos.row, pos.col);
        });
      } else {
        const app = mainDockerApps.value.find((a) => a.id === draggedApp.value);
        if (app && app.x !== undefined && app.y !== undefined) {
          let snapped = snapToGrid(app.x, app.y);

          let attempts = 0;
          while (isPositionOccupied(snapped.x, snapped.y, draggedApp.value) && attempts < 20) {
            const nextPos = findNextAvailablePosition();
            snapped = snapToGrid(nextPos.x, nextPos.y);
            attempts++;
          }

          desktopStore.updateIconPosition(draggedApp.value, snapped.x, snapped.y, snapped.row, snapped.col);
        }
      }
    }
  } finally {
    isDragging.value = false;
    draggedApp.value = null;
    hasMoved.value = false;
    draggedAppsInitialPositions.value.clear();
    desktopStore.clearDraggedApps();
  }
}

const contextMenuItems = computed<ContextMenuItem[]>(() => {
  if (contextMenuFolder.value) {
    const folder = contextMenuFolder.value;
    return [
      {
        label: "Open",
        icon: folderOpenIcon,
        action: () => {
          desktopStore.openFolder(folder.id);
        },
      },
      { divider: true },
      {
        label: "Rename",
        icon: folderEditIcon,
        action: () => {
          openRenameFolderModal(folder.id, folder.name);
        },
      },
      {
        label: "Change Color",
        icon: paletteIcon,
        action: () => {
          const x = contextMenu.value.x;
          const y = contextMenu.value.y;
          openColorPickerMenu(folder.id, folder.color || "#3b82f6", x, y);
        },
      },
      { divider: true },
      {
        label: "Delete Folder",
        icon: folderRemoveIcon,
        action: () => {
          const itemCount = folder.items.length;
          const message = itemCount > 0 ? `Delete "${folder.name}"? ${itemCount} app(s) will be moved to desktop.` : `Delete "${folder.name}"?`;

          confirm({
            title: "Delete Folder",
            content: message,
            okText: "Delete",
            cancelText: "Cancel",
            onOk: () => {
              desktopStore.deleteFolder(folder.id);
            },
          });
        },
      },
    ];
  }

  if (!contextMenuApp.value) {
    return [
      {
        label: "New Folder",
        icon: folderPlusIcon,
        action: () => {
          openCreateFolderModal();
        },
        disabled: desktopStore.mainDockerApps.length === 0,
      },
      { divider: true },
      {
        label: "Refresh",
        icon: refreshIcon,
        action: async () => {
          await fetchContainers(csrfToken.value);
        },
      },
      { divider: true },
      {
        label: "Reset Icon Positions",
        icon: resetIcon,
        action: () => {
          confirm({
            title: "Reset Icon Positions",
            content: "Reset all icon and folder positions to default grid? Folders will appear first, followed by apps.",
            okText: "Reset",
            cancelText: "Cancel",
            onOk: () => {
              desktopStore.resetIconPositions();
              initializeGridPositions();
            },
          });
        },
      },
    ];
  }

  const selectedCount = selectedApps.value.size;
  if (selectedCount > 1) {
    const selectedAppsList = Array.from(selectedApps.value)
      .map((id) => mainDockerApps.value.find((a) => a.id === id))
      .filter((a) => a !== undefined) as DockerApp[];

    const hasRunning = selectedAppsList.some((a) => a.status === "running");
    const hasStopped = selectedAppsList.some((a) => a.status === "exited");
    const hasPaused = selectedAppsList.some((a) => a.status === "paused");

    return [
      {
        label: `Selected: ${selectedCount} apps`,
        icon: checkIcon,
        action: () => {}, // Header item, no action
        disabled: true,
      },
      { divider: true },
      {
        label: "Start All",
        icon: playIcon,
        action: async () => {
          for (const app of selectedAppsList) {
            if (app.status !== "running") {
              await startContainer(app, csrfToken.value, themeClasses.value.scopeSelector);
            }
          }
        },
        disabled: !hasStopped,
      },
      {
        label: "Stop All",
        icon: stopIcon,
        action: async () => {
          for (const app of selectedAppsList) {
            if (app.status === "running") {
              await stopContainer(app, csrfToken.value, themeClasses.value.scopeSelector);
            }
          }
        },
        disabled: !hasRunning,
      },
      {
        label: "Restart All",
        icon: restartIcon,
        action: async () => {
          for (const app of selectedAppsList) {
            if (app.status !== "exited") {
              await restartContainer(app, csrfToken.value, themeClasses.value.scopeSelector);
            }
          }
        },
        disabled: selectedAppsList.every((a) => a.status === "exited"),
      },
      { divider: true },
      {
        label: "Pause All",
        icon: pauseIcon,
        action: async () => {
          for (const app of selectedAppsList) {
            if (app.status === "running") {
              await pauseContainer(app, csrfToken.value, themeClasses.value.scopeSelector);
            }
          }
        },
        disabled: !hasRunning,
      },
      {
        label: "Unpause All",
        icon: unpauseIcon,
        action: async () => {
          for (const app of selectedAppsList) {
            if (app.status === "paused") {
              await unpauseContainer(app, csrfToken.value, themeClasses.value.scopeSelector);
            }
          }
        },
        disabled: !hasPaused,
      },
      { divider: true },
      {
        label: "Update All",
        icon: updateIcon,
        action: async () => {
          for (const app of selectedAppsList) {
            await updateContainer(app, csrfToken.value, themeClasses.value.scopeSelector);
          }
        },
      },
    ];
  }

  const app = contextMenuApp.value;
  const isRunning = app.status === "running";
  const isExited = app.status === "exited";
  const isPaused = app.status === "paused";

  const items: ContextMenuItem[] = [];

  if (isRunning && app.service_url) {
    items.push({
      label: "Open",
      icon: openIcon,
      action: () => {
        if (contextMenuApp.value?.service_url) {
          window.open(contextMenuApp.value.service_url, "_blank", "noopener,noreferrer");
        }
      },
    });
    items.push({ divider: true });
  }

  items.push({
    label: isRunning ? "Stop" : "Start",
    icon: isRunning ? stopIcon : playIcon,
    action: async () => {
      if (!contextMenuApp.value) return;
      if (isRunning) {
        await stopContainer(contextMenuApp.value, csrfToken.value, themeClasses.value.scopeSelector);
      } else {
        await startContainer(contextMenuApp.value, csrfToken.value, themeClasses.value.scopeSelector);
      }
    },
    disabled: isPaused,
  });

  items.push({
    label: "Restart",
    icon: restartIcon,
    action: async () => {
      if (contextMenuApp.value) {
        await restartContainer(contextMenuApp.value, csrfToken.value, themeClasses.value.scopeSelector);
      }
    },
    disabled: isExited,
  });

  items.push({ divider: true });

  items.push({
    label: isPaused ? "Unpause" : "Pause",
    icon: isPaused ? unpauseIcon : pauseIcon,
    action: async () => {
      if (!contextMenuApp.value) return;
      if (isPaused) {
        await unpauseContainer(contextMenuApp.value, csrfToken.value, themeClasses.value.scopeSelector);
      } else {
        await pauseContainer(contextMenuApp.value, csrfToken.value, themeClasses.value.scopeSelector);
      }
    },
    disabled: isExited,
  });

  items.push({ divider: true });

  items.push({
    label: "View Logs",
    icon: terminalIcon,
    action: () => {
      if (contextMenuApp.value) {
        windowStore.openWindow("logs", {
          title: `${contextMenuApp.value.name} - Logs`,
          data: { appName: contextMenuApp.value.name },
          allowMultiple: true,
        });
      }
    },
  });

  items.push({
    label: "Update",
    icon: updateIcon,
    action: async () => {
      if (contextMenuApp.value) {
        await updateContainer(contextMenuApp.value, csrfToken.value, themeClasses.value.scopeSelector);
      }
    },
  });

  items.push({
    label: "Refresh",
    icon: refreshIcon,
    action: () => {
      loadContainers();
    },
  });

  items.push({ divider: true });

  items.push({
    label: "Properties",
    icon: propertiesIcon,
    action: () => {
      if (!contextMenuApp.value) return;
      windowStore.openWindow("properties", {
        title: `${contextMenuApp.value.name} - Properties`,
        data: { appId: contextMenuApp.value.id },
        allowMultiple: true,
      });
    },
  });

  items.push({ divider: true });

  items.push({
    label: "Uninstall",
    icon: uninstallIcon,
    action: () => {
      if (!contextMenuApp.value) return;
      const appToUninstall = contextMenuApp.value;

      confirm({
        title: "Confirm Uninstall",
        content: `Are you sure you want to uninstall ${appToUninstall.name}? This action cannot be undone.`,
        okText: "Uninstall",
        cancelText: "Cancel",
        onOk: async () => {
          await uninstallContainer(appToUninstall, csrfToken.value, themeClasses.value.scopeSelector);
        },
      });
    },
  });

  return items;
});

async function loadContainers() {
  try {
    isLoading.value = true;
    await fetchContainers(csrfToken.value);
  } catch (error) {
  } finally {
    isLoading.value = false;
  }
}

function openAppStore() {
  desktopStore.openSystemApp("appstore");
}

function handleClick(app: DockerApp, e?: MouseEvent) {
  if (isWiggleMode.value) return;

  if (!hasMoved.value) {
    const event = e || (window.event as MouseEvent);
    const isCtrlPressed = event?.ctrlKey || event?.metaKey;

    if (isCtrlPressed) {
      if (selectedApps.value.has(app.id)) {
        selectedApps.value.delete(app.id);
      } else {
        selectedApps.value.add(app.id);
      }
      selectedApp.value = null;
    } else {
      selectedApps.value.clear();
      selectedApp.value = app.id;
      selectedFolder.value = null;
    }
  }
}

function handleDoubleClick(app: DockerApp) {
  if (isWiggleMode.value) return;

  const isRunning = app.status === "running";

  if (isRunning && app.service_url) {
    window.open(app.service_url, "_blank", "noopener,noreferrer");
  } else {
    windowStore.openWindow("properties", {
      title: `${app.name} - Properties`,
      data: { appId: app.id },
      allowMultiple: true,
    });
  }
}

function deselectIcon() {
  selectedApp.value = null;
  selectedApps.value.clear();
  selectedFolder.value = null;
}

function handleFolderMouseDown(e: MouseEvent, folder: DesktopFolder) {
  if (isMobile.value) return;
  if (e.button !== 0) return;

  hasMoved.value = false;
  draggedFolder.value = folder.id;
  isDragging.value = true;
  dragStartX.value = e.clientX;
  dragStartY.value = e.clientY;

  if (folder.x !== undefined && folder.y !== undefined) {
    dragStartIconX.value = folder.x;
    dragStartIconY.value = folder.y;
  } else if (folder.gridRow !== undefined && folder.gridCol !== undefined) {
    dragStartIconX.value = ICON_PADDING.value + folder.gridCol * GRID_SIZE_X.value;
    dragStartIconY.value = ICON_PADDING.value + folder.gridRow * GRID_SIZE_Y.value;
  } else {
    dragStartIconX.value = 0;
    dragStartIconY.value = 0;
  }

  document.addEventListener("mousemove", handleFolderMouseMove);
  document.addEventListener("mouseup", handleFolderMouseUp);
}

function handleFolderTouchStart(e: TouchEvent, folder: DesktopFolder) {
  if (!isMobile.value) return;
  if (e.touches.length > 1) return;

  const touch = e.touches[0];
  hasMoved.value = false;
  draggedFolder.value = folder.id;
  isDragging.value = true;
  dragStartX.value = touch.clientX;
  dragStartY.value = touch.clientY;

  if (folder.x !== undefined && folder.y !== undefined) {
    dragStartIconX.value = folder.x;
    dragStartIconY.value = folder.y;
  } else if (folder.gridRow !== undefined && folder.gridCol !== undefined) {
    dragStartIconX.value = ICON_PADDING.value + folder.gridCol * GRID_SIZE_X.value;
    dragStartIconY.value = ICON_PADDING.value + folder.gridRow * GRID_SIZE_Y.value;
  } else {
    dragStartIconX.value = 0;
    dragStartIconY.value = 0;
  }

  document.addEventListener("touchmove", handleFolderTouchMove, { passive: false });
  document.addEventListener("touchend", handleFolderTouchEnd);
  document.addEventListener("touchcancel", handleFolderTouchEnd);
}

function handleFolderMouseMove(e: MouseEvent) {
  if (!isDragging.value || !draggedFolder.value) return;

  const deltaX = e.clientX - dragStartX.value;
  const deltaY = e.clientY - dragStartY.value;

  const DRAG_THRESHOLD = 5;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  if (distance > DRAG_THRESHOLD) {
    hasMoved.value = true;
    e.preventDefault();

    const containerWidth = containerRef.value?.clientWidth || window.innerWidth;
    const containerHeight = containerRef.value?.clientHeight || window.innerHeight;
    const iconWidth = 100;
    const iconHeight = 130;

    let newX = dragStartIconX.value + deltaX;
    let newY = dragStartIconY.value + deltaY;

    newX = Math.max(ICON_PADDING.value, Math.min(newX, containerWidth - iconWidth - ICON_PADDING.value));
    newY = Math.max(ICON_PADDING.value, Math.min(newY, containerHeight - iconHeight - ICON_PADDING.value));

    desktopStore.updateFolderPosition(draggedFolder.value, newX, newY);
  }
}

function handleFolderMouseUp(e: MouseEvent) {
  if (!isDragging.value || !draggedFolder.value) return;

  if (hasMoved.value) {
    e.preventDefault();
    const folder = desktopFolders.value.find((f) => f.id === draggedFolder.value);
    if (folder && folder.x !== undefined && folder.y !== undefined) {
      const snapped = snapToGrid(folder.x, folder.y);

      const isColliding = isPositionOccupied(snapped.x, snapped.y, undefined, undefined, draggedFolder.value);

      if (isColliding) {
        const originalSnapped = snapToGrid(dragStartIconX.value, dragStartIconY.value);
        desktopStore.updateFolderPosition(draggedFolder.value, originalSnapped.x, originalSnapped.y, originalSnapped.row, originalSnapped.col);
      } else {
        desktopStore.updateFolderPosition(draggedFolder.value, snapped.x, snapped.y, snapped.row, snapped.col);
      }
    }
  }

  isDragging.value = false;
  draggedFolder.value = null;
  hasMoved.value = false;

  document.removeEventListener("mousemove", handleFolderMouseMove);
  document.removeEventListener("mouseup", handleFolderMouseUp);
}

function handleFolderTouchMove(e: TouchEvent) {
  if (!isDragging.value || !draggedFolder.value) return;
  if (e.touches.length > 1) {
    handleFolderTouchEnd(e);
    return;
  }

  const touch = e.touches[0];
  const deltaX = touch.clientX - dragStartX.value;
  const deltaY = touch.clientY - dragStartY.value;

  const DRAG_THRESHOLD = 5;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  if (distance > DRAG_THRESHOLD) {
    hasMoved.value = true;
    e.preventDefault();

    const containerWidth = containerRef.value?.clientWidth || window.innerWidth;
    const containerHeight = containerRef.value?.clientHeight || window.innerHeight;
    const iconWidth = 100;
    const iconHeight = 130;

    let newX = dragStartIconX.value + deltaX;
    let newY = dragStartIconY.value + deltaY;

    newX = Math.max(ICON_PADDING.value, Math.min(newX, containerWidth - iconWidth - ICON_PADDING.value));
    newY = Math.max(ICON_PADDING.value, Math.min(newY, containerHeight - iconHeight - ICON_PADDING.value));

    desktopStore.updateFolderPosition(draggedFolder.value, newX, newY);
  }
}

function handleFolderTouchEnd(e: TouchEvent) {
  if (!isDragging.value || !draggedFolder.value) return;

  e.preventDefault();

  if (hasMoved.value) {
    const folder = desktopFolders.value.find((f) => f.id === draggedFolder.value);
    if (folder && folder.x !== undefined && folder.y !== undefined) {
      const snapped = snapToGrid(folder.x, folder.y);
      const isColliding = isPositionOccupied(snapped.x, snapped.y, undefined, undefined, draggedFolder.value);

      if (isColliding) {
        const originalSnapped = snapToGrid(dragStartIconX.value, dragStartIconY.value);
        desktopStore.updateFolderPosition(draggedFolder.value, originalSnapped.x, originalSnapped.y, originalSnapped.row, originalSnapped.col);
      } else {
        desktopStore.updateFolderPosition(draggedFolder.value, snapped.x, snapped.y, snapped.row, snapped.col);
      }
    }
  }

  isDragging.value = false;
  draggedFolder.value = null;
  hasMoved.value = false;

  document.removeEventListener("touchmove", handleFolderTouchMove, { passive: false } as AddEventListenerOptions);
  document.removeEventListener("touchend", handleFolderTouchEnd);
  document.removeEventListener("touchcancel", handleFolderTouchEnd);
}

function handleFolderClick(folder: DesktopFolder, e?: MouseEvent) {
  if (isWiggleMode.value) return;

  if (!hasMoved.value) {
    const event = e || (window.event as MouseEvent);
    const isCtrlPressed = event?.ctrlKey || event?.metaKey;

    if (!isCtrlPressed) {
      selectedApp.value = null;
      selectedApps.value.clear();
    }

    selectedFolder.value = folder.id;
  }
}

function handleFolderDoubleClick(folder: DesktopFolder) {
  if (isWiggleMode.value) return;

  desktopStore.openFolder(folder.id);
}

function handleFolderContextMenu(e: MouseEvent, folder: DesktopFolder) {
  if (isWiggleMode.value) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  e.preventDefault();
  e.stopPropagation();

  selectedFolder.value = folder.id;
  selectedApp.value = null;
  selectedApps.value.clear();
  contextMenuApp.value = null;
  contextMenuFolder.value = folder;

  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
  };
}

function isFolderPositionOccupied(x: number, y: number, excludeFolderId?: string): boolean {
  return desktopFolders.value.some((folder) => {
    if (excludeFolderId && folder.id === excludeFolderId) return false;
    if (folder.x === undefined || folder.y === undefined) return false;

    const dx = Math.abs(folder.x - x);
    const dy = Math.abs(folder.y - y);
    return dx < GRID_SIZE_X.value && dy < GRID_SIZE_Y.value;
  });
}

function handleContextMenu(e: MouseEvent, app: DockerApp) {
  if (isWiggleMode.value) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  e.preventDefault();
  e.stopPropagation();

  if (!selectedApps.value.has(app.id)) {
    selectedApp.value = app.id;
    selectedApps.value.clear();
  }

  contextMenuApp.value = app;

  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
  };
}

function handleDesktopMouseDown(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains("desktop-icons-container")) {
    if (e.button !== 0) return;

    const containerRect = containerRef.value?.getBoundingClientRect();
    if (!containerRect) return;

    isSelectingArea.value = true;
    selectionBox.value.startX = e.clientX - containerRect.left;
    selectionBox.value.startY = e.clientY - containerRect.top;
    selectionBox.value.currentX = selectionBox.value.startX;
    selectionBox.value.currentY = selectionBox.value.startY;

    selectedApp.value = null;
    selectedApps.value.clear();
    selectedFolder.value = null;

    document.addEventListener("mousemove", handleDesktopMouseMove);
    document.addEventListener("mouseup", handleDesktopMouseUp);
  }
}

function handleDesktopMouseMove(e: MouseEvent) {
  if (!isSelectingArea.value) return;

  const containerRect = containerRef.value?.getBoundingClientRect();
  if (!containerRect) return;

  selectionBox.value.currentX = e.clientX - containerRect.left;
  selectionBox.value.currentY = e.clientY - containerRect.top;

  updateSelectedAppsInBox();
}

function handleDesktopMouseUp(e: MouseEvent) {
  if (!isSelectingArea.value) return;

  isSelectingArea.value = false;

  document.removeEventListener("mousemove", handleDesktopMouseMove);
  document.removeEventListener("mouseup", handleDesktopMouseUp);
}

function updateSelectedAppsInBox() {
  const boxX = Math.min(selectionBox.value.startX, selectionBox.value.currentX);
  const boxY = Math.min(selectionBox.value.startY, selectionBox.value.currentY);
  const boxWidth = Math.abs(selectionBox.value.currentX - selectionBox.value.startX);
  const boxHeight = Math.abs(selectionBox.value.currentY - selectionBox.value.startY);

  selectedApps.value.clear();

  mainDockerApps.value.forEach((app) => {
    if (app.x === undefined || app.y === undefined) return;

    const iconX = app.x;
    const iconY = app.y;
    const iconWidth = 100;
    const iconHeight = 130;

    const boxLeft = boxX;
    const boxTop = boxY;
    const boxRight = boxX + boxWidth;
    const boxBottom = boxY + boxHeight;

    const iconLeft = iconX;
    const iconTop = iconY;
    const iconRight = iconX + iconWidth;
    const iconBottom = iconY + iconHeight;

    const intersects = boxLeft < iconRight && boxRight > iconLeft && boxTop < iconBottom && boxBottom > iconTop;

    if (intersects) {
      selectedApps.value.add(app.id);
    }
  });
}

function handleDesktopContextMenu(e: MouseEvent) {
  if (isWiggleMode.value) {
    e.preventDefault();
    return;
  }

  const isValidDesktopClick = isMobile.value || (e.target as HTMLElement).classList.contains("desktop-icons-container");

  if (isValidDesktopClick) {
    e.preventDefault();

    deselectIcon();

    contextMenuApp.value = null;
    contextMenuFolder.value = null;

    contextMenu.value = {
      visible: true,
      x: e.clientX,
      y: e.clientY,
    };
  }
}

function closeContextMenu() {
  contextMenu.value.visible = false;
  contextMenuApp.value = null;
  contextMenuFolder.value = null;
}

defineExpose({
  deselectIcon,
});

watch(
  () => selectedAppsStore.applications,
  (newApps, oldApps) => {
    const filteredApps = newApps.filter((app) => {
      const desiredState = selectedAppsStore.getDesiredState(app.name);
      return desiredState !== "uninstalling";
    });

    const appsChanged = !oldApps || oldApps.length !== newApps.length || filteredApps.length !== desktopStore.dockerApps.length || JSON.stringify(filteredApps.map((a) => ({ id: a.id, status: a.status, ports: a.ports, usagePercent: a.usagePercent, service_url: a.service_url }))) !== JSON.stringify(desktopStore.dockerApps.map((a) => ({ id: a.id, status: a.status, ports: a.ports, usagePercent: a.usagePercent, service_url: a.service_url })));

    if (appsChanged) {
      desktopStore.loadDockerApps(filteredApps);
      initializeGridPositions();
    }

    if (filteredApps.length === 0) {
      desktopStore.loadDockerApps([]);
    }
  }
);

watch(
  () => mainDockerApps.value,
  (newApps) => {
    const appsWithoutPosition = newApps.filter((app) => app.x === undefined && app.y === undefined && app.gridRow === undefined && app.gridCol === undefined);

    if (appsWithoutPosition.length > 0) {
      initializeGridPositions();
    }
  },
  { deep: true }
);

onMounted(() => {
  calculateGridSettings();

  loadContainers();

  startContainerPolling(csrfToken.value, 5000);

  desktopStore.loadFolders();

  setTimeout(() => {
    foldersLoaded.value = true;
  }, 150);

  window.addEventListener("resize", handleResize);
});

function handleResize() {
  calculateGridSettings();
  initializeGridPositions();
}

watch(
  () => [isMobile.value, isPortrait.value, isLandscape.value],
  () => {
    calculateGridSettings();
    initializeGridPositions();
  }
);

onUnmounted(() => {
  stopContainerPolling();

  window.removeEventListener("resize", handleResize);

  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);

  document.removeEventListener("touchmove", handleTouchMove, { passive: false } as AddEventListenerOptions);
  document.removeEventListener("touchend", handleTouchEnd);
  document.removeEventListener("touchcancel", handleTouchEnd);
});
</script>

<style scoped>
.desktop-icons-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100%;
  padding: 1rem;
  user-select: none;
  overflow: hidden;
}

/* Vue Transitions */
.loading-fade-enter-active {
  transition: opacity 0.3s ease;
}

.loading-fade-leave-active {
  transition: opacity 0.5s ease;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
}

.empty-state-fade-enter-active {
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}

.empty-state-fade-leave-active {
  transition: opacity 0.4s ease-in, transform 0.4s ease-in;
}

.empty-state-fade-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(calc(-50% + 20px));
}

.empty-state-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(calc(-50% - 10px));
}

.empty-state-fade-enter-to,
.empty-state-fade-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(-50%);
}

.opacity-fade-enter-active,
.opacity-fade-leave-active {
  transition: opacity 0.5s ease-in-out;
}

.opacity-fade-enter-from,
.opacity-fade-leave-to {
  opacity: 0;
}

.opacity-fade-enter-to,
.opacity-fade-leave-from {
  opacity: 1;
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

/* Animations */
@keyframes loading-bar-animation {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(100%);
  }
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
</style>
