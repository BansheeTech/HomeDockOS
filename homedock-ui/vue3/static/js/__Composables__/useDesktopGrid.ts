// homedock-ui/vue3/static/js/__Composables__/useDesktopGrid.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { computed, ref, type Ref } from "vue";
import { useDesktopStore, type DockerApp, type DesktopFolder, type SystemDesktopIcon } from "../__Stores__/desktopStore";
import { useResponsive } from "./useResponsive";

export type DesktopItemType = "app" | "folder" | "systemicon";

export interface DesktopItem {
  id: string;
  type: DesktopItemType;
  name: string;
  x?: number;
  y?: number;
  gridRow?: number;
  gridCol?: number;
  page?: number;
  data: DockerApp | DesktopFolder | SystemDesktopIcon;
}

export function useDesktopGrid(containerRef?: Ref<HTMLElement | null>) {
  const desktopStore = useDesktopStore();
  const { isMobile, windowWidth, windowHeight, isPortrait } = useResponsive();

  const DESKTOP_PADDING = 16;
  const DESKTOP_GRID_SIZE_X = 110;
  const DESKTOP_GRID_SIZE_Y = 125;
  const MOBILE_PADDING = 16;
  const PAGE_INDICATOR_CLEARANCE = 32;

  const mobileGridSizeX = ref(85);
  const mobileGridSizeY = ref(100);

  function calculateMobileGridSize() {
    const containerWidth = containerRef?.value?.clientWidth || windowWidth.value;
    const availableWidth = containerWidth - MOBILE_PADDING * 2;
    const cols = isPortrait.value ? 4 : 6;
    mobileGridSizeX.value = Math.floor(availableWidth / cols);
    mobileGridSizeY.value = mobileGridSizeX.value + 15;
  }

  const gridSizeX = computed(() => (isMobile.value ? mobileGridSizeX.value : DESKTOP_GRID_SIZE_X));
  const gridSizeY = computed(() => (isMobile.value ? mobileGridSizeY.value : DESKTOP_GRID_SIZE_Y));
  const padding = computed(() => (isMobile.value ? MOBILE_PADDING : DESKTOP_PADDING));
  const columns = computed(() => (isMobile.value ? (isPortrait.value ? 4 : 6) : 20));

  const rows = computed(() => {
    if (!isMobile.value) return 100;
    const containerHeight = containerRef?.value?.clientHeight || windowHeight.value;
    const availableHeight = containerHeight - MOBILE_PADDING * 2 - MOBILE_PADDING * 2 - PAGE_INDICATOR_CLEARANCE;
    return Math.max(1, Math.floor(availableHeight / mobileGridSizeY.value));
  });

  const iconsPerPage = computed(() => columns.value * rows.value);

  const pageWidth = computed(() => {
    if (!isMobile.value) return windowWidth.value;
    return containerRef?.value?.clientWidth || windowWidth.value;
  });

  const allDesktopItems = computed<DesktopItem[]>(() => {
    const items: DesktopItem[] = [];

    const pushSystemIcon = (icon: SystemDesktopIcon) => {
      items.push({
        id: icon.id,
        type: "systemicon",
        name: icon.name,
        x: icon.x,
        y: icon.y,
        gridRow: icon.gridRow,
        gridCol: icon.gridCol,
        page: icon.page,
        data: icon,
      });
    };

    desktopStore.desktopRootSystemIcons.filter((icon) => !icon.shortcut).forEach(pushSystemIcon);

    desktopStore.desktopFolders.forEach((folder) => {
      items.push({
        id: folder.id,
        type: "folder",
        name: folder.name,
        x: folder.x,
        y: folder.y,
        gridRow: folder.gridRow,
        gridCol: folder.gridCol,
        page: folder.page,
        data: folder,
      });
    });

    desktopStore.desktopRootSystemIcons.filter((icon) => icon.shortcut).forEach(pushSystemIcon);

    desktopStore.desktopRootApps.forEach((app) => {
      items.push({
        id: app.id,
        type: "app",
        name: app.display_name || app.name,
        x: app.x,
        y: app.y,
        gridRow: app.gridRow,
        gridCol: app.gridCol,
        page: app.page,
        data: app,
      });
    });

    return items;
  });

  const itemsWithoutPosition = computed(() => {
    return allDesktopItems.value.filter((item) => item.x === undefined && item.y === undefined && item.gridRow === undefined && item.gridCol === undefined);
  });

  function updateItemPosition(item: DesktopItem, x: number, y: number, row: number, col: number, page?: number) {
    desktopStore.updateItemPosition(item.type, item.id, x, y, row, col, page);
  }

  return {
    gridSizeX,
    gridSizeY,
    padding,
    columns,
    rows,
    iconsPerPage,
    pageWidth,
    isMobile,

    allDesktopItems,
    itemsWithoutPosition,

    calculateMobileGridSize,
    updateItemPosition,
  };
}
