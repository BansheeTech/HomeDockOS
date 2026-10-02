// homedock-ui/vue3/static/js/__Composables__/desktopLayoutFit.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import type { LayoutItems } from "../__Stores__/useDesktopSyncStore";

export const DESKTOP_GRID = { sizeX: 110, sizeY: 125, padding: 16, iconWidth: 100, iconHeight: 130 };

const MOBILE_PAGE_ROW_SPAN = 100;
const OVERFLOW_ROWS = 500;

export interface FitEntry {
  key: string;
  cols: number;
  rows: number;
  widget: boolean;
}

export function mobileToDesktopItems(items: LayoutItems): LayoutItems {
  const converted: LayoutItems = {};
  Object.entries(items).forEach(([key, cell]) => {
    if (cell.length === 3) converted[key] = [cell[0] * MOBILE_PAGE_ROW_SPAN + cell[1], cell[2]];
  });
  return converted;
}

export function desktopToMobileItems(items: LayoutItems): LayoutItems {
  const converted: LayoutItems = {};
  Object.entries(items).forEach(([key, cell]) => {
    if (cell.length === 2) converted[key] = [0, cell[0], cell[1]];
  });
  return converted;
}

export function fitDesktopLayout(entries: FitEntry[], stored: LayoutItems, bounds: { cols: number; rows: number; iconCols: number; iconRows: number }): Map<string, [number, number]> {
  const cols = Math.max(1, bounds.cols);
  const rows = Math.max(1, bounds.rows);
  const iconCols = Math.max(1, bounds.iconCols);
  const iconRows = Math.max(1, bounds.iconRows);
  const occupied = new Set<string>();
  const placed = new Map<string, [number, number]>();

  const colLimitOf = (entry: FitEntry) => (entry.widget ? cols : iconCols);
  const rowLimitOf = (entry: FitEntry) => (entry.widget ? rows : iconRows);

  const fits = (row: number, col: number, entry: FitEntry, rowLimit: number) => {
    const colLimit = colLimitOf(entry);
    const width = Math.min(entry.cols, colLimit);
    if (row < 0 || col < 0 || col + width > colLimit || row + entry.rows > rowLimit) return false;

    for (let r = row; r < row + entry.rows; r++) {
      for (let c = col; c < col + width; c++) {
        if (occupied.has(`${r},${c}`)) return false;
      }
    }
    return true;
  };

  const claim = (entry: FitEntry, row: number, col: number) => {
    const width = Math.min(entry.cols, colLimitOf(entry));
    for (let r = row; r < row + entry.rows; r++) {
      for (let c = col; c < col + width; c++) {
        occupied.add(`${r},${c}`);
      }
    }
    placed.set(entry.key, [row, col]);
  };

  const findSpot = (entry: FitEntry): [number, number] => {
    const visibleRows = rowLimitOf(entry);
    for (const rowLimit of [visibleRows, visibleRows + OVERFLOW_ROWS]) {
      for (let row = 0; row + entry.rows <= rowLimit; row++) {
        for (let col = 0; col < colLimitOf(entry); col++) {
          if (fits(row, col, entry, rowLimit)) return [row, col];
        }
      }
    }
    return [visibleRows + OVERFLOW_ROWS, 0];
  };

  const pending: FitEntry[] = [];
  const ordered = [...entries.filter((entry) => entry.widget), ...entries.filter((entry) => !entry.widget)];

  ordered.forEach((entry) => {
    const cell = stored[entry.key];
    if (cell && cell.length === 2 && fits(cell[0], cell[1], entry, rowLimitOf(entry))) {
      claim(entry, cell[0], cell[1]);
    } else {
      pending.push(entry);
    }
  });

  const rank = (entry: FitEntry) => {
    const cell = stored[entry.key];
    return cell && cell.length === 2 ? cell[0] * 10000 + cell[1] : Number.MAX_SAFE_INTEGER;
  };

  const sortPending = (list: FitEntry[]) => list.map((entry, index) => ({ entry, index })).sort((a, b) => rank(a.entry) - rank(b.entry) || a.index - b.index);

  [...sortPending(pending.filter((entry) => entry.widget)), ...sortPending(pending.filter((entry) => !entry.widget))].forEach(({ entry }) => {
    const [row, col] = findSpot(entry);
    claim(entry, row, col);
  });

  return placed;
}
