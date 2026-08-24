<!-- homedock-ui/vue3/static/js/__Windows__/FolderView.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="folder-view-container" :class="themeClasses.folderContainerBg">
    <div class="folder-breadcrumb" :class="[themeClasses.folderBreadcrumbBg, themeClasses.folderBreadcrumbBorder]">
      <Icon :icon="desktopIcon" class="breadcrumb-icon" :class="themeClasses.folderBreadcrumbIcon" />
      <span class="breadcrumb-text" :class="themeClasses.folderBreadcrumbText">{{ $t("Desktop") }}</span>
      <Icon :icon="chevronRightIcon" class="breadcrumb-separator" :class="themeClasses.folderBreadcrumbSeparator" />
      <Icon :icon="folderIcon" class="breadcrumb-icon" :class="themeClasses.folderBreadcrumbIcon" />
      <span class="breadcrumb-text folder-name" :class="themeClasses.folderBreadcrumbText">{{ folderName }}</span>
      <span class="app-count" :class="themeClasses.folderAppCount">({{ totalItemCount }} {{ $t("apps") }})</span>
    </div>

    <div v-if="totalItemCount === 0" class="empty-folder-state">
      <Icon :icon="folderOpenOutlineIcon" class="empty-icon" :class="themeClasses.folderEmptyIcon" />
      <h3 class="empty-title" :class="themeClasses.folderEmptyTitle">{{ $t("Empty folder") }}</h3>
      <p class="empty-description" :class="themeClasses.folderEmptyDescription">{{ $t("Drag apps here to organize them") }}</p>
    </div>

    <div class="folder-apps-grid" ref="containerRef" @contextmenu="handleDesktopContextMenu" @mousedown="handleGridMouseDown">
      <SelectionBox :visible="isSelectingArea" :style="selectionBoxStyle" />
      <TransitionGroup name="icon-appear">
        <div v-for="(app, index) in folderApps" :key="app.id" :data-app-id="app.id" :class="['desktop-icon group flex flex-col items-center gap-1 cursor-pointer p-3 rounded-lg w-[100px] z-[1] select-none outline-none border', isMobile ? 'touch-pan-y' : 'touch-none', !(selectedApp === app.id || selectedApps.has(app.id)) && ['border-transparent', 'shadow-[0_0_0_1px_transparent]'], (selectedApp === app.id || selectedApps.has(app.id)) && [themeClasses.desktopIconBgSelected, themeClasses.desktopIconBorderSelected, themeClasses.desktopIconShadowSelected], isDragging && (draggedApp === app.id || selectedApps.has(app.id)) ? 'opacity-50 !cursor-grabbing' : 'hover:-translate-y-0.5 active:cursor-grabbing']" :style="getIconStyle(folderShortcuts.length + index)" @mousedown="handleMouseDown($event, app)" @click="handleClick(app, $event)" @dblclick="handleDoubleClick(app)" @contextmenu="handleContextMenu($event, app)" @touchstart="handleTouchStart($event, app)" @touchmove="handleTouchMove" @touchend="handleTouchEnd($event, app)" :title="`${app.display_name || app.name} (${app.status})`">
          <div :class="['icon-container relative w-16 h-16 flex items-center justify-center rounded-2xl overflow-hidden pointer-events-none border', themeClasses.desktopIconContainerBg, themeClasses.desktopIconContainerScaleHover, !(selectedApp === app.id || selectedApps.has(app.id)) && ['border-transparent', themeClasses.desktopIconContainerBgHover], (selectedApp === app.id || selectedApps.has(app.id)) && [themeClasses.desktopIconContainerBgSelected, themeClasses.desktopIconContainerBorderSelected], getContainerClasses(app)]">
            <BaseImage :src="app.image_path" class="app-image rounded-xl" alt="" draggable="false" />
            <Transition name="loading-overlay-fade">
              <div v-if="app.isProcessing === true" class="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl pointer-events-none z-[2]">
                <div class="w-8 h-8 rounded-full border-[3px] border-white/30 border-t-blue-500 animate-spin shadow-lg"></div>
              </div>
            </Transition>
            <PortScanningOverlay :visible="app.status === 'running' && isPortScanning(app) && !app.isProcessing" />
            <div :class="['status-badge', getStatusBadgeClass(app.status), themeClasses.desktopStatusBadgeBorder, { 'status-pulse': app.status === 'running' }]"></div>
          </div>
          <span class="app-name" :class="[themeClasses.desktopIconText]">{{ app.display_name || app.name }}</span>
        </div>
      </TransitionGroup>

      <TransitionGroup name="icon-appear">
        <div v-for="(shortcutIcon, index) in folderShortcuts" :key="shortcutIcon.id" :data-shortcut-id="shortcutIcon.id" :class="['desktop-icon group flex flex-col items-center gap-1 cursor-pointer p-3 rounded-lg w-[100px] z-[1] select-none outline-none border', isMobile ? 'touch-pan-y' : 'touch-none', !(selectedSystemIcon === shortcutIcon.id || selectedSystemIcons.has(shortcutIcon.id)) && ['border-transparent', 'shadow-[0_0_0_1px_transparent]'], (selectedSystemIcon === shortcutIcon.id || selectedSystemIcons.has(shortcutIcon.id)) && [themeClasses.desktopIconBgSelected, themeClasses.desktopIconBorderSelected, themeClasses.desktopIconShadowSelected], isDragging && (draggedShortcut === shortcutIcon.id || selectedSystemIcons.has(shortcutIcon.id)) ? 'opacity-50 !cursor-grabbing' : 'hover:-translate-y-0.5 active:cursor-grabbing']" :style="getIconStyle(index)" @mousedown="handleShortcutMouseDown($event, shortcutIcon)" @click="handleShortcutClick(shortcutIcon, $event)" @dblclick="handleShortcutDoubleClick(shortcutIcon)" @contextmenu="handleShortcutContextMenu($event, shortcutIcon)" @touchstart="handleShortcutTouchStart($event, shortcutIcon)" :title="shortcutIcon.name">
          <div :class="['icon-container relative w-16 h-16 flex items-center justify-center rounded-2xl overflow-hidden pointer-events-none border', themeClasses.desktopIconContainerBg, themeClasses.desktopIconContainerScaleHover, !(selectedSystemIcon === shortcutIcon.id || selectedSystemIcons.has(shortcutIcon.id)) && ['border-transparent', themeClasses.desktopIconContainerBgHover], (selectedSystemIcon === shortcutIcon.id || selectedSystemIcons.has(shortcutIcon.id)) && [themeClasses.desktopIconContainerBgSelected, themeClasses.desktopIconContainerBorderSelected]]">
            <Transition name="icon-switch" mode="out-in">
              <BaseImage v-if="shortcutIcon.shortcut?.iconType === 'image'" :key="`image:${shortcutIcon.shortcut.iconValue}`" :src="getShortcutIconUrl(shortcutIcon.shortcut.iconValue)" class="app-image rounded-xl" alt="" draggable="false" />
              <div v-else :key="`preset:${shortcutIcon.shortcut?.iconValue}`" :class="['w-full h-full flex items-center justify-center rounded-lg', themeClasses.iconHolder]">
                <Icon :icon="getShortcutGlyph(shortcutIcon.shortcut)" class="w-10 h-10 pointer-events-none" :class="themeClasses.explorerItemIcon" />
              </div>
            </Transition>
            <div class="absolute bottom-1 left-1 w-4 h-4 rounded bg-white border border-black/10 shadow-sm flex items-center justify-center z-[3] pointer-events-none">
              <Icon :icon="arrowTopRightIcon" class="w-3 h-3 text-blue-600" />
            </div>
          </div>
          <span class="app-name" :class="[themeClasses.desktopIconText]">{{ shortcutIcon.name }}</span>
        </div>
      </TransitionGroup>
    </div>

    <ContextMenu :visible="contextMenu.visible" :x="contextMenu.x" :y="contextMenu.y" :items="contextMenuItems" @close="closeContextMenu" />

    <ShortcutEditModal v-model:visible="showShortcutModal" mode="edit" :initial-name="shortcutModalInitial.name" :initial-url="shortcutModalInitial.url" :initial-icon-type="shortcutModalInitial.iconType" :initial-icon-value="shortcutModalInitial.iconValue" @save="handleShortcutSave" />

    <StatusBar :icon="folderOpenIcon" :message="`${folderName}`" :info="`${totalItemCount} ${totalItemCount === 1 ? $t('app') : $t('apps')}`" :showHelp="true">
      <template #help>
        <div class="space-y-2.5 max-w-sm">
          <div class="flex items-center gap-2">
            <Icon :icon="folderOpenIcon" :class="['w-5 h-5', themeClasses.statusBarIcon]" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">{{ $t("Folder") }}</h4>
          </div>

          <div :class="['text-[10px] md:text-xs space-y-2 leading-relaxed', themeClasses.statusBarInfo]">
            <p>{{ $t("Folders help you organize your apps by grouping related applications together. Create folders by dragging apps on top of each other on the desktop, making it easier to manage and access your installed applications.") }}</p>
          </div>
        </div>
      </template>
    </StatusBar>

    <DragGhost :visible="draggedAppsForGhost.length > 0" :items="draggedAppsForGhost" :style="ghostStyle" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useDesktopStore, DockerApp, SystemDesktopIcon } from "../__Stores__/desktopStore";
import { useWindowStore } from "../__Stores__/windowStore";
import { useResponsive } from "../__Composables__/useResponsive";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useDialog } from "../__Composables__/useDialog";
import { useDesktopDragSelection } from "../__Composables__/useDesktopDragSelection";
import { useDesktopDragAndDrop } from "../__Composables__/useDesktopDragAndDrop";
import { useDesktopDragGhost } from "../__Composables__/useDesktopDragGhost";

import type { GridConfig, SelectionState } from "../__Composables__/desktopDragTypes";

import DragGhost, { type DragGhostItem } from "../__Components__/DragGhost.vue";
import SelectionBox from "../__Components__/SelectionBox.vue";
import BaseImage from "../__Components__/BaseImage.vue";
import ContextMenu, { type ContextMenuItem } from "../__Components__/ContextMenu.vue";
import StatusBar from "../__Components__/StatusBar.vue";
import PortScanningOverlay from "../__Components__/PortScanningOverlay.vue";
import ShortcutEditModal, { type ShortcutModalResult } from "../__Components__/ShortcutEditModal.vue";

import { getShortcutGlyph, getShortcutIconUrl } from "../__Config__/ShortcutIcons";

import { startContainer, stopContainer, restartContainer, pauseContainer, unpauseContainer, uninstallContainer, updateContainer } from "../__Services__/DockerActions";

import { Icon } from "@iconify/vue";
import desktopIcon from "@iconify-icons/mdi/desktop-mac";
import folderIcon from "@iconify-icons/mdi/folder";
import folderOpenOutlineIcon from "@iconify-icons/mdi/folder-open-outline";
import folderOpenIcon from "@iconify-icons/mdi/folder-open";
import chevronRightIcon from "@iconify-icons/mdi/chevron-right";
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
import propertiesIcon from "@iconify-icons/mdi/information-outline";
import exportIcon from "@iconify-icons/mdi/export";
import pencilIcon from "@iconify-icons/mdi/pencil";
import linkOffIcon from "@iconify-icons/mdi/link-variant-off";
import arrowTopRightIcon from "@iconify-icons/mdi/arrow-top-right";
import checkIcon from "@iconify-icons/mdi/check-circle";

interface Props {
  folderId: string;
}

const props = defineProps<Props>();

const { t } = useI18n();
const desktopStore = useDesktopStore();
const windowStore = useWindowStore();
const { isMobile } = useResponsive();
const { themeClasses } = useTheme();
const { confirm } = useDialog();

const csrfToken = useCsrfToken();

const containerRef = ref<HTMLDivElement | null>(null);

const GRID_SIZE_X = ref(110);
const GRID_SIZE_Y = ref(125);
const ICON_PADDING = ref(16);

const gridConfig = computed<GridConfig>(() => ({
  sizeX: GRID_SIZE_X.value,
  sizeY: GRID_SIZE_Y.value,
  padding: ICON_PADDING.value,
  iconWidth: 100,
  iconHeight: 130,
}));

const {
  selectedApp,
  selectedApps,
  selectedSystemIcon,
  selectedSystemIcons,
  isSelectingArea,
  selectionBox,
  selectionBoxStyle: composableSelectionBoxStyle,
  selectItem,
  clearSelection,
} = useDesktopDragSelection({
  containerRef,
  gridConfig,
  enableBoxSelection: true,
  enableMultiSelect: true,
});

const selectionState = computed<SelectionState>(() => ({
  selectedApp: selectedApp.value,
  selectedApps: selectedApps.value,
  selectedFolder: null,
  selectedFolders: new Set<string>(),
  selectedSystemIcon: selectedSystemIcon.value,
  selectedSystemIcons: selectedSystemIcons.value,
}));

const {
  isDragging,
  hasMoved,
  startDrag: composableStartDrag,
  updateDrag,
  endDrag: composableEndDrag,
  handleTouchStart: composableHandleTouchStart,
} = useDesktopDragAndDrop({
  mode: "ghost",
  containerId: props.folderId,
  containerRef,
  gridConfig,
  selection: selectionState,
  enableMobileDrag: false,

  onMobileTap: (item, _e) => {
    if (item.type !== "app") return;
    selectItem({ type: "app", id: item.id });
  },

  onMobileDoubleTap: (item, _e) => {
    if (item.type === "systemicon") {
      const icon = folderShortcuts.value.find((i) => i.id === item.id);
      if (icon) {
        handleShortcutDoubleClick(icon, true);
      }
      return;
    }

    const app = folderApps.value.find((a) => a.id === item.id);
    if (app) {
      handleDoubleClick(app, true);
    }
  },

  onMobileLongPress: (item, e) => {
    const touch = e.touches?.[0] || e.changedTouches?.[0];
    if (!touch) return;

    const contextMenuEvent = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: touch.clientX,
      clientY: touch.clientY,
    });

    if (item.type === "systemicon") {
      const icon = folderShortcuts.value.find((i) => i.id === item.id);
      if (icon) {
        handleShortcutContextMenu(contextMenuEvent, icon);
      }
      return;
    }

    const app = folderApps.value.find((a) => a.id === item.id);
    if (app) {
      handleContextMenu(contextMenuEvent, app);
    }
  },
});

const { ghostStyle, updatePosition: updateGhostPosition } = useDesktopDragGhost();

const draggedApp = ref<string | null>(null);
const draggedShortcut = ref<string | null>(null);

const contextMenuApp = ref<DockerApp | null>(null);
const contextMenuShortcut = ref<SystemDesktopIcon | null>(null);
const maxCols = ref<number>(0);

const showShortcutModal = ref(false);
const editingShortcutId = ref<string | null>(null);
const shortcutModalInitial = ref<{ name: string; url: string; iconType: "preset" | "image"; iconValue: string }>({ name: "", url: "", iconType: "preset", iconValue: "web" });

const isHovering = ref(false);

function shortcutToGhostItem(icon: SystemDesktopIcon): DragGhostItem {
  if (icon.shortcut?.iconType === "image") {
    return { name: icon.name, image_path: getShortcutIconUrl(icon.shortcut.iconValue) };
  }
  return { name: icon.name, presetIcon: getShortcutGlyph(icon.shortcut) };
}

const draggedAppsForGhost = computed<DragGhostItem[]>(() => {
  if (!isDragging.value || !hasMoved.value) return [];

  const activeId = draggedApp.value || draggedShortcut.value;
  if (!activeId) return [];

  const isMulti = (selectedApps.value.size > 0 && selectedApps.value.has(activeId)) || (selectedSystemIcons.value.size > 0 && selectedSystemIcons.value.has(activeId));

  if (isMulti) {
    const items: DragGhostItem[] = folderApps.value.filter((a) => selectedApps.value.has(a.id));
    folderShortcuts.value.forEach((icon) => {
      if (selectedSystemIcons.value.has(icon.id)) {
        items.push(shortcutToGhostItem(icon));
      }
    });
    return items;
  }

  if (draggedApp.value) {
    const single = folderApps.value.find((a) => a.id === draggedApp.value);
    return single ? [single] : [];
  }

  const singleIcon = folderShortcuts.value.find((i) => i.id === draggedShortcut.value);
  return singleIcon ? [shortcutToGhostItem(singleIcon)] : [];
});

const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
});

const folder = computed(() => desktopStore.getFolderById(props.folderId));
const folderName = computed(() => folder.value?.name || t("Unknown Folder"));
const folderApps = computed(() => {
  const apps = desktopStore.getAppsInFolder(props.folderId);

  const statusPriority: Record<string, number> = {
    running: 1,
    paused: 2,
    restarting: 3,
    created: 4,
    exited: 5,
  };

  return apps.sort((a, b) => {
    const priorityA = statusPriority[a.status] || 99;
    const priorityB = statusPriority[b.status] || 99;

    if (priorityA === priorityB) {
      return a.name.localeCompare(b.name);
    }

    return priorityA - priorityB;
  });
});

const folderShortcuts = computed(() => {
  return desktopStore
    .getShortcutsInFolder(props.folderId)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
});

const totalItemCount = computed(() => folderApps.value.length + folderShortcuts.value.length);

const selectionBoxStyle = composableSelectionBoxStyle;

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

function calculateGridSettings() {
  const containerWidth = containerRef.value?.clientWidth || window.innerWidth;

  if (isMobile.value) {
    const MOBILE_COLS = 4;
    const MOBILE_PADDING = 16;
    const availableWidth = containerWidth - MOBILE_PADDING * 2;
    const calculatedGridSizeX = Math.floor(availableWidth / MOBILE_COLS);

    GRID_SIZE_X.value = calculatedGridSizeX;
    GRID_SIZE_Y.value = calculatedGridSizeX + 15;
    ICON_PADDING.value = MOBILE_PADDING;
  } else {
    GRID_SIZE_X.value = 110;
    GRID_SIZE_Y.value = 125;
    ICON_PADDING.value = 16;
  }

  calculateMaxCols();
}

function getIconStyle(index: number): Record<string, string> {
  const cols = maxCols.value || 1;
  const row = Math.floor(index / cols);
  const col = index % cols;

  const style: Record<string, string> = {
    position: "absolute",
    left: `${ICON_PADDING.value + col * GRID_SIZE_X.value}px`,
    top: `${ICON_PADDING.value + row * GRID_SIZE_Y.value}px`,
  };

  if (isMobile.value) {
    style.width = `${GRID_SIZE_X.value}px`;
  }

  return style;
}

function calculateMaxCols() {
  const containerWidth = containerRef.value?.clientWidth || window.innerWidth;
  maxCols.value = Math.max(1, Math.floor((containerWidth - ICON_PADDING.value * 2) / GRID_SIZE_X.value));
}

function isPortScanning(app: DockerApp): boolean {
  if (!app.ports || app.ports.length === 0) return false;
  if (app.ports.includes("disabled")) return true;
  if (app.ports.includes("hostmode")) return false;
  const unique = new Set(app.ports);
  return unique.size !== app.ports.length;
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

function handleClick(app: DockerApp, e?: MouseEvent) {
  if (hasMoved.value) return;

  const isCtrlPressed = e?.ctrlKey || e?.metaKey;
  selectItem({ type: "app", id: app.id }, { ctrl: isCtrlPressed });
}

const SELECTION_PADDING = 16;

function handleGridMouseDown(e: MouseEvent) {
  if (isMobile.value) return;
  if ((e.target as HTMLElement).closest(".desktop-icon")) return;
  if (e.button !== 0) return;

  const containerRect = containerRef.value?.getBoundingClientRect();
  if (!containerRect) return;

  clearSelection();

  const rawX = e.clientX - containerRect.left;
  const rawY = e.clientY - containerRect.top;

  const startX = Math.max(SELECTION_PADDING, Math.min(rawX, containerRect.width - SELECTION_PADDING));
  const startY = Math.max(SELECTION_PADDING, Math.min(rawY, containerRect.height - SELECTION_PADDING));

  isSelectingArea.value = true;
  selectionBox.value.startX = startX;
  selectionBox.value.startY = startY;
  selectionBox.value.currentX = startX;
  selectionBox.value.currentY = startY;

  document.addEventListener("mousemove", handleGridMouseMove);
  document.addEventListener("mouseup", handleGridMouseUp);
}

function handleGridMouseMove(e: MouseEvent) {
  if (!isSelectingArea.value) return;

  const containerRect = containerRef.value?.getBoundingClientRect();
  if (!containerRect) return;

  const rawX = e.clientX - containerRect.left;
  const rawY = e.clientY - containerRect.top;

  selectionBox.value.currentX = Math.max(SELECTION_PADDING, Math.min(rawX, containerRect.width - SELECTION_PADDING));
  selectionBox.value.currentY = Math.max(SELECTION_PADDING, Math.min(rawY, containerRect.height - SELECTION_PADDING));

  updateSelectedAppsInBox();
}

function handleGridMouseUp(_e: MouseEvent) {
  if (!isSelectingArea.value) return;

  isSelectingArea.value = false;

  document.removeEventListener("mousemove", handleGridMouseMove);
  document.removeEventListener("mouseup", handleGridMouseUp);
}

function updateSelectedAppsInBox() {
  const boxX = Math.min(selectionBox.value.startX, selectionBox.value.currentX);
  const boxY = Math.min(selectionBox.value.startY, selectionBox.value.currentY);
  const boxWidth = Math.abs(selectionBox.value.currentX - selectionBox.value.startX);
  const boxHeight = Math.abs(selectionBox.value.currentY - selectionBox.value.startY);

  selectedApps.value.clear();
  selectedSystemIcons.value.clear();

  const boxLeft = boxX;
  const boxTop = boxY;
  const boxRight = boxX + boxWidth;
  const boxBottom = boxY + boxHeight;

  const cols = maxCols.value || 1;

  const intersectsIndex = (index: number): boolean => {
    const row = Math.floor(index / cols);
    const col = index % cols;

    const iconLeft = ICON_PADDING.value + col * GRID_SIZE_X.value;
    const iconTop = ICON_PADDING.value + row * GRID_SIZE_Y.value;
    const iconRight = iconLeft + 100;
    const iconBottom = iconTop + 130;

    return boxLeft < iconRight && boxRight > iconLeft && boxTop < iconBottom && boxBottom > iconTop;
  };

  folderShortcuts.value.forEach((icon, index) => {
    if (intersectsIndex(index)) {
      selectedSystemIcons.value.add(icon.id);
    }
  });

  folderApps.value.forEach((app, index) => {
    if (intersectsIndex(folderShortcuts.value.length + index)) {
      selectedApps.value.add(app.id);
    }
  });
}

const ghostOffset = ref({ x: 0, y: 0 });

function startDrag(app: DockerApp, clientX: number, clientY: number) {
  draggedApp.value = app.id;

  const iconElement = containerRef.value?.querySelector(`[data-app-id="${app.id}"]`);
  if (iconElement) {
    const rect = iconElement.getBoundingClientRect();
    ghostOffset.value = {
      x: clientX - rect.left - rect.width / 2,
      y: clientY - rect.top - rect.height / 2,
    };
  } else {
    ghostOffset.value = { x: 50, y: 60 };
  }

  composableStartDrag({ type: "app", id: app.id }, clientX, clientY);
}

function handleMouseDown(e: MouseEvent, app: DockerApp) {
  if (isMobile.value) return;
  if (e.button !== 0) return;

  e.preventDefault();

  startDrag(app, e.clientX, e.clientY);

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
}

function handleMouseMove(e: MouseEvent) {
  if (!draggedApp.value && !draggedShortcut.value) return;

  updateDrag(e.clientX, e.clientY);

  if (hasMoved.value) {
    updateGhostPosition({
      x: e.clientX - ghostOffset.value.x,
      y: e.clientY - ghostOffset.value.y,
    });
  }
}

function handleMouseUp(_e: MouseEvent) {
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);

  composableEndDrag();
  draggedApp.value = null;
  draggedShortcut.value = null;
}

function handleDragTouchMove(e: TouchEvent) {
  if (!draggedApp.value) return;
  if (e.touches.length > 1) {
    handleDragTouchEnd(e);
    return;
  }

  const touch = e.touches[0];

  updateDrag(touch.clientX, touch.clientY);

  if (hasMoved.value) {
    e.preventDefault();
    updateGhostPosition({
      x: touch.clientX - ghostOffset.value.x,
      y: touch.clientY - ghostOffset.value.y,
    });
  }
}

function handleDragTouchEnd(_e: TouchEvent) {
  document.removeEventListener("touchmove", handleDragTouchMove);
  document.removeEventListener("touchend", handleDragTouchEnd);
  document.removeEventListener("touchcancel", handleDragTouchEnd);

  composableEndDrag();
  draggedApp.value = null;
}

function handleDoubleClick(app: DockerApp, fromMobileGesture = false) {
  if (isMobile.value && !fromMobileGesture) return;

  const isRunning = app.status === "running";

  if (isRunning && app.service_url) {
    desktopStore.launchDockerApp(app);
  } else {
    windowStore.openUniqueWindow("properties", app.id, {
      title: `${app.display_name || app.name} - Properties`,
      data: { appId: app.id },
    });
  }
}

function handleContextMenu(e: MouseEvent, app: DockerApp) {
  e.preventDefault();
  e.stopPropagation();

  if (!selectedApps.value.has(app.id)) {
    selectedApp.value = app.id;
    selectedApps.value.clear();
  }

  selectedSystemIcon.value = null;
  selectedSystemIcons.value.clear();

  contextMenuApp.value = app;
  contextMenuShortcut.value = null;

  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
  };
}

function handleShortcutDoubleClick(icon: SystemDesktopIcon, fromMobileGesture = false) {
  if (isMobile.value && !fromMobileGesture) return;
  desktopStore.openSystemApp(icon.appId);
}

function handleShortcutClick(icon: SystemDesktopIcon, e?: MouseEvent) {
  if (hasMoved.value) return;

  const isCtrlPressed = e?.ctrlKey || e?.metaKey;
  selectItem({ type: "systemicon", id: icon.id }, { ctrl: isCtrlPressed });
}

function startShortcutDrag(icon: SystemDesktopIcon, clientX: number, clientY: number) {
  draggedShortcut.value = icon.id;

  const iconElement = containerRef.value?.querySelector(`[data-shortcut-id="${icon.id}"]`);
  if (iconElement) {
    const rect = iconElement.getBoundingClientRect();
    ghostOffset.value = {
      x: clientX - rect.left - rect.width / 2,
      y: clientY - rect.top - rect.height / 2,
    };
  } else {
    ghostOffset.value = { x: 50, y: 60 };
  }

  composableStartDrag({ type: "systemicon", id: icon.id }, clientX, clientY);
}

function handleShortcutMouseDown(e: MouseEvent, icon: SystemDesktopIcon) {
  if (isMobile.value) return;
  if (e.button !== 0) return;

  e.preventDefault();

  startShortcutDrag(icon, e.clientX, e.clientY);

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
}

function handleShortcutContextMenu(e: MouseEvent, icon: SystemDesktopIcon) {
  e.preventDefault();
  e.stopPropagation();

  if (!selectedSystemIcons.value.has(icon.id)) {
    selectedSystemIcons.value.clear();
  }

  selectedApp.value = null;
  selectedApps.value.clear();
  selectedSystemIcon.value = icon.id;

  contextMenuApp.value = null;
  contextMenuShortcut.value = icon;

  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
  };
}

function handleShortcutTouchStart(e: TouchEvent, icon: SystemDesktopIcon) {
  composableHandleTouchStart(e, { type: "systemicon", id: icon.id });
}

function openShortcutEditModal(icon: SystemDesktopIcon) {
  if (!icon.shortcut || icon.shortcut.type === "file") return;
  editingShortcutId.value = icon.shortcut.shortcutId;
  shortcutModalInitial.value = { name: icon.name, url: icon.shortcut.url, iconType: icon.shortcut.iconType as "preset" | "image", iconValue: icon.shortcut.iconValue };
  showShortcutModal.value = true;
}

async function handleShortcutSave(result: ShortcutModalResult) {
  if (editingShortcutId.value) {
    await desktopStore.updateShortcut(editingShortcutId.value, result, csrfToken.value);
  }
}

function handleDesktopContextMenu(e: MouseEvent) {
  if ((e.target as HTMLElement).closest(".desktop-icon")) {
    return;
  }

  e.preventDefault();
  e.stopPropagation();

  clearSelection();

  contextMenuApp.value = null;
  contextMenuShortcut.value = null;

  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
  };
}

const contextMenuItems = computed<ContextMenuItem[]>(() => {
  const multiApps = folderApps.value.filter((a) => selectedApps.value.has(a.id) && a.HDRole !== "dependency");
  const multiShortcuts = folderShortcuts.value.filter((i) => selectedSystemIcons.value.has(i.id));
  const multiCount = multiApps.length + multiShortcuts.length;

  if ((contextMenuApp.value || contextMenuShortcut.value) && multiCount > 1) {
    const hasRunning = multiApps.some((a) => a.status === "running");
    const hasStopped = multiApps.some((a) => a.status === "exited");
    const hasPaused = multiApps.some((a) => a.status === "paused");

    const items: ContextMenuItem[] = [
      {
        label: multiApps.length === multiCount ? t("Selected: {n} apps", { n: multiCount }) : t("Selected: {n} items", { n: multiCount }),
        icon: checkIcon,
        action: () => {},
        disabled: true,
      },
    ];

    if (multiApps.length > 0) {
      items.push({ divider: true });
      items.push({
        label: "Start All",
        icon: playIcon,
        action: async () => {
          for (const app of multiApps) {
            if (app.status !== "running") {
              await startContainer(app, csrfToken.value, themeClasses.value.scopeSelector);
            }
          }
        },
        disabled: !hasStopped,
      });
      items.push({
        label: "Stop All",
        icon: stopIcon,
        action: async () => {
          for (const app of multiApps) {
            if (app.status === "running") {
              await stopContainer(app, csrfToken.value, themeClasses.value.scopeSelector);
            }
          }
        },
        disabled: !hasRunning,
      });
      items.push({
        label: "Restart All",
        icon: restartIcon,
        action: async () => {
          for (const app of multiApps) {
            if (app.status !== "exited") {
              await restartContainer(app, csrfToken.value, themeClasses.value.scopeSelector);
            }
          }
        },
        disabled: multiApps.every((a) => a.status === "exited"),
      });
      items.push({ divider: true });
      items.push({
        label: "Pause All",
        icon: pauseIcon,
        action: async () => {
          for (const app of multiApps) {
            if (app.status === "running") {
              await pauseContainer(app, csrfToken.value, themeClasses.value.scopeSelector);
            }
          }
        },
        disabled: !hasRunning,
      });
      items.push({
        label: "Unpause All",
        icon: unpauseIcon,
        action: async () => {
          for (const app of multiApps) {
            if (app.status === "paused") {
              await unpauseContainer(app, csrfToken.value, themeClasses.value.scopeSelector);
            }
          }
        },
        disabled: !hasPaused,
      });
      items.push({ divider: true });
      items.push({
        label: "Update All",
        icon: updateIcon,
        action: async () => {
          for (const app of multiApps) {
            await updateContainer(app, csrfToken.value, themeClasses.value.scopeSelector);
          }
        },
      });
    }

    items.push({ divider: true });
    items.push({
      label: t("Remove from Folder ({n})", { n: multiCount }),
      icon: exportIcon,
      action: () => {
        for (const app of multiApps) {
          desktopStore.removeAppFromFolder(app.id);
        }
        for (const icon of multiShortcuts) {
          desktopStore.removeShortcutFromFolder(icon.id);
        }
        clearSelection();
      },
    });

    if (multiShortcuts.length > 0) {
      items.push({ divider: true });
      items.push({
        label: t("Delete Shortcuts ({n})", { n: multiShortcuts.length }),
        icon: linkOffIcon,
        action: () => {
          confirm({
            title: t("Delete Shortcuts"),
            content: t("Delete {n} shortcuts?", { n: multiShortcuts.length }),
            okText: t("Delete"),
            cancelText: t("Cancel"),
            onOk: async () => {
              for (const icon of multiShortcuts) {
                await desktopStore.removeShortcut(icon.shortcut!.shortcutId, csrfToken.value);
              }
            },
          });
        },
      });
    }

    return items;
  }

  if (contextMenuShortcut.value) {
    const icon = contextMenuShortcut.value;
    const shortcutId = icon.shortcut?.shortcutId || "";

    return [
      {
        label: "Open",
        icon: openIcon,
        action: () => {
          desktopStore.openSystemApp(icon.appId);
        },
      },
      { divider: true },
      {
        label: "Edit Shortcut",
        icon: pencilIcon,
        action: () => {
          openShortcutEditModal(icon);
        },
      },
      { divider: true },
      {
        label: "Remove from Folder",
        icon: exportIcon,
        action: () => {
          desktopStore.removeShortcutFromFolder(icon.id);
        },
      },
      { divider: true },
      {
        label: "Delete Shortcut",
        icon: linkOffIcon,
        action: () => {
          confirm({
            title: t("Delete Shortcut"),
            content: t(`Delete "{name}"?`, { name: icon.name }),
            okText: t("Delete"),
            cancelText: t("Cancel"),
            onOk: async () => {
              await desktopStore.removeShortcut(shortcutId, csrfToken.value);
            },
          });
        },
      },
    ];
  }

  if (!contextMenuApp.value) {
    return [
      {
        label: "Refresh",
        icon: refreshIcon,
        action: () => {},
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
          desktopStore.launchDockerApp(contextMenuApp.value);
        }
      },
    });
    items.push({ divider: true });
  }

  items.push({
    label: isRunning ? "Stop" : t("Start", 2),
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
        windowStore.openUniqueWindow("logs", contextMenuApp.value.name, {
          title: `${contextMenuApp.value.display_name || contextMenuApp.value.name} - Logs`,
          data: { appName: contextMenuApp.value.name },
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
    action: () => {},
  });

  items.push({ divider: true });

  items.push({
    label: "Properties",
    icon: propertiesIcon,
    action: () => {
      if (!contextMenuApp.value) return;
      windowStore.openUniqueWindow("properties", contextMenuApp.value.id, {
        title: `${contextMenuApp.value.display_name || contextMenuApp.value.name} - Properties`,
        data: { appId: contextMenuApp.value.id },
      });
    },
  });

  items.push({ divider: true });
  items.push({
    label: "Remove from Folder",
    icon: exportIcon,
    action: () => {
      if (contextMenuApp.value) {
        desktopStore.removeAppFromFolder(contextMenuApp.value.id);
      }
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
        title: t("Confirm Uninstall"),
        content: t("Are you sure you want to uninstall {name}? This action cannot be undone.", { name: appToUninstall.display_name || appToUninstall.name }),
        okText: t("Uninstall"),
        cancelText: t("Cancel"),
        onOk: async () => {
          await uninstallContainer(appToUninstall, csrfToken.value, themeClasses.value.scopeSelector);
        },
      });
    },
  });

  return items;
});

function closeContextMenu() {
  contextMenu.value.visible = false;
  contextMenuApp.value = null;
  contextMenuShortcut.value = null;
}

function handleTouchStart(e: TouchEvent, app: DockerApp) {
  composableHandleTouchStart(e, { type: "app", id: app.id });
}

function handleTouchMove(_e: TouchEvent) {}

function handleTouchEnd(_e: TouchEvent, _app: DockerApp) {}

function isMouseOver(x: number, y: number): boolean {
  if (!containerRef.value) return false;
  const rect = containerRef.value.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function onGlobalMouseMove(e: MouseEvent) {
  isHovering.value = isMouseOver(e.clientX, e.clientY);
}

function onGlobalMouseUp(e: MouseEvent) {
  if (isHovering.value && desktopStore.draggedAppIds.length > 0) {
    e.preventDefault();

    desktopStore.draggedAppIds.forEach((itemId) => {
      if (itemId.startsWith("shortcut-")) {
        const icon = desktopStore.systemDesktopIcons.find((i) => i.id === itemId);
        if (icon?.shortcut && icon.folderId !== props.folderId) {
          desktopStore.addShortcutToFolder(itemId, props.folderId);
        }
      } else {
        const app = desktopStore.dockerApps.find((a) => a.id === itemId);
        if (app && app.folderId !== props.folderId) {
          desktopStore.addAppToFolder(itemId, props.folderId);
        }
      }
    });

    desktopStore.clearDraggedApps();
  }
  isHovering.value = false;
}

watch(
  () => desktopStore.draggedAppIds.length > 0,
  (hasDraggedApps) => {
    if (hasDraggedApps) {
      document.addEventListener("mousemove", onGlobalMouseMove, true);
      document.addEventListener("mouseup", onGlobalMouseUp, true);
    } else {
      document.removeEventListener("mousemove", onGlobalMouseMove, true);
      document.removeEventListener("mouseup", onGlobalMouseUp, true);
      isHovering.value = false;

      if (isDragging.value) {
        isDragging.value = false;
        draggedApp.value = null;
        draggedShortcut.value = null;
        hasMoved.value = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      }
    }
  },
);

watch(
  folderName,
  (newName) => {
    const folderWindow = windowStore.windows.find((w) => w.appId === "folder-view" && w.data?.folderId === props.folderId);
    if (folderWindow) {
      windowStore.updateWindowTitle(folderWindow.id, newName);
    }
  },
  { immediate: false },
);

function handleResize() {
  calculateGridSettings();
}

watch(
  () => isMobile.value,
  () => {
    calculateGridSettings();
  },
);

onMounted(() => {
  calculateGridSettings();

  window.addEventListener("resize", handleResize);

  if (containerRef.value) {
    const resizeObserver = new ResizeObserver(() => {
      calculateGridSettings();
    });
    resizeObserver.observe(containerRef.value);

    (containerRef.value as any).__resizeObserver = resizeObserver;
  }
});

onUnmounted(() => {
  draggedApp.value = null;
  draggedShortcut.value = null;
  composableEndDrag();

  window.removeEventListener("resize", handleResize);

  if (containerRef.value && (containerRef.value as any).__resizeObserver) {
    (containerRef.value as any).__resizeObserver.disconnect();
  }

  document.removeEventListener("mousemove", onGlobalMouseMove, true);
  document.removeEventListener("mouseup", onGlobalMouseUp, true);

  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
  document.removeEventListener("touchmove", handleDragTouchMove);
  document.removeEventListener("touchend", handleDragTouchEnd);
  document.removeEventListener("touchcancel", handleDragTouchEnd);

  document.removeEventListener("mousemove", handleGridMouseMove);
  document.removeEventListener("mouseup", handleGridMouseUp);

  if (isDragging.value) {
    desktopStore.clearDraggedApps();
  }
});
</script>

<style scoped>
.folder-view-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Breadcrumb */
.folder-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1rem;
  border-bottom: 1px solid transparent;
}

.breadcrumb-icon {
  width: 18px;
  height: 18px;
}

.breadcrumb-separator {
  width: 16px;
  height: 16px;
}

.breadcrumb-text {
  font-size: 0.875rem;
  font-weight: 500;
}

.folder-name {
  font-weight: 600;
}

.app-count {
  font-size: 0.75rem;
  margin-left: 0.25rem;
}

/* Empty state */
.empty-folder-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  padding: 2rem;
}

.empty-icon {
  width: 64px;
  height: 64px;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.empty-description {
  font-size: 0.875rem;
  margin: 0;
}

/* Apps grid */
.folder-apps-grid {
  position: relative;
  flex: 1;
  width: 100%;
  height: 100%;
  padding: 1rem;
  overflow-y: auto;
  overflow-x: hidden;
  user-select: none;
}

/* Desktop Icon */
.desktop-icon {
  transition: all 0.3s ease;
}

.desktop-icon:hover {
  transform: translateY(-2px);
}

.icon-container {
  transition:
    background 0.15s ease,
    transform 0.2s ease;
}

.app-image {
  width: 48px;
  height: 48px;
  object-fit: contain;
  pointer-events: none;
}

.status-badge {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  z-index: 3;
  pointer-events: none;
  transition: all 0.2s ease;
}

.status-badge.status-pulse {
  animation: pulse-badge 2s ease-in-out infinite;
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

.app-name {
  font-size: 0.75rem;
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: none;
}

/* Icon Appear Animation */
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
  transition: transform 0.4s ease;
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

/* Loading Overlay Fade Animation */
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
</style>
