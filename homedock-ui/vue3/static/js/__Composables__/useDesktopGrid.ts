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
    const availableHeight = containerHeight - MOBILE_PADDING * 2;
    return Math.max(1, Math.floor(availableHeight / mobileGridSizeY.value) - 1);
  });

  const iconsPerPage = computed(() => columns.value * rows.value);

  const pageWidth = computed(() => {
    if (!isMobile.value) return windowWidth.value;
    return containerRef?.value?.clientWidth || windowWidth.value;
  });

  const allDesktopItems = computed<DesktopItem[]>(() => {
    const items: DesktopItem[] = [];

    desktopStore.systemDesktopIcons.forEach((icon) => {
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
    });

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

  // Uses store's unified updateItemPosition
  function updateItemPosition(item: DesktopItem, x: number, y: number, row: number, col: number, page?: number) {
    desktopStore.updateItemPosition(item.type, item.id, x, y, row, col, page);
  }

  function initializeItemPositions() {
    const items = itemsWithoutPosition.value;
    if (items.length === 0) return;

    if (isMobile.value) {
      initializeMobilePositions(items);
    } else {
      initializeDesktopPositions(items);
    }
  }

  function initializeMobilePositions(items: DesktopItem[]) {
    const containerWidth = containerRef?.value?.clientWidth || windowWidth.value;
    const MOBILE_PADDING = 16;
    const cols = isPortrait.value ? 4 : 6;

    const innerContainerWidth = containerWidth - MOBILE_PADDING * 2;
    const availableWidth = innerContainerWidth - MOBILE_PADDING * 2;
    const gx = Math.floor(availableWidth / cols);
    const gy = gx + 15;
    const pad = MOBILE_PADDING;

    const containerHeight = containerRef?.value?.clientHeight || windowHeight.value;
    const availableHeight = containerHeight - MOBILE_PADDING * 2;
    const rowCount = Math.max(1, Math.floor(availableHeight / gy) - 1);
    const ipp = cols * rowCount;

    const pw = containerWidth;

    const occupiedPositions = new Set<string>();

    allDesktopItems.value.forEach((item) => {
      if (item.x !== undefined && item.y !== undefined) {
        const itemPageIndex = Math.floor(item.x / pw);
        const localX = item.x % pw;
        const itemCol = Math.round((localX - pad) / gx);
        const itemRow = Math.round((item.y - pad) / gy);
        occupiedPositions.add(`${itemPageIndex},${itemRow},${itemCol}`);
      }
    });

    let searchStartIndex = 0;

    items.forEach((item) => {
      let freePos: { page: number; row: number; col: number } | null = null;

      for (let globalIdx = searchStartIndex; globalIdx < 1000; globalIdx++) {
        const page = Math.floor(globalIdx / ipp);
        const indexInPage = globalIdx % ipp;
        const col = indexInPage % cols;
        const row = Math.floor(indexInPage / cols);

        const posKey = `${page},${row},${col}`;
        if (!occupiedPositions.has(posKey)) {
          freePos = { page, row, col };
          break;
        }
      }

      if (!freePos) {
        console.error(`No free position found for ${item.type} "${item.name}"`);
        return;
      }

      const { page: pageIndex, row, col } = freePos;
      const localX = pad + col * gx;
      const localY = pad + row * gy;
      const globalX = pageIndex * pw + localX;

      updateItemPosition(item, globalX, localY, row, col, pageIndex);

      occupiedPositions.add(`${pageIndex},${row},${col}`);
      searchStartIndex = pageIndex * ipp + row * cols + col + 1;
    });
  }

  function initializeDesktopPositions(items: DesktopItem[]) {
    const gx = gridSizeX.value;
    const gy = gridSizeY.value;
    const pad = padding.value;
    const containerWidth = containerRef?.value?.clientWidth || windowWidth.value;
    const maxCols = Math.floor((containerWidth - pad * 2) / gx);

    const occupiedPositions = new Set<string>();

    allDesktopItems.value.forEach((item) => {
      if (item.x !== undefined && item.y !== undefined) {
        const col = Math.round((item.x - pad) / gx);
        const row = Math.round((item.y - pad) / gy);
        occupiedPositions.add(`${row},${col}`);
      }
    });

    let row = 0;
    let col = 0;

    items.forEach((item) => {
      while (occupiedPositions.has(`${row},${col}`)) {
        col++;
        if (col >= maxCols) {
          col = 0;
          row++;
        }
        if (row > 100) {
          console.error(`No free position found for ${item.type} "${item.name}"`);
          return;
        }
      }

      const x = pad + col * gx;
      const y = pad + row * gy;

      updateItemPosition(item, x, y, row, col);

      occupiedPositions.add(`${row},${col}`);

      col++;
      if (col >= maxCols) {
        col = 0;
        row++;
      }
    });
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
    initializeItemPositions,
  };
}
