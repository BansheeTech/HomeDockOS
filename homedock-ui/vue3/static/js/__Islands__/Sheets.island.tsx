// homedock-ui/vue3/static/js/__Islands__/Sheets.island.tsx
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { lazy, Suspense, useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { WorkbookInstance } from "@fortune-sheet/react";
import type { Sheet } from "@fortune-sheet/core";

import "@fortune-sheet/react/dist/index.css";

import { useIslandHost } from "./host";

export interface SheetsApi {
  exportXlsx(): Promise<Blob>;
  instance(): WorkbookInstance | null;
}

const loadWorkbook = () => import("@fortune-sheet/react");

const Workbook = lazy(() => loadWorkbook().then((module) => ({ default: module.Workbook })));

interface SheetsIslandProps {
  source: ArrayBuffer | null;
  fileName: string;
  onReady?: (api: SheetsApi) => void;
  onDirty?: () => void;
  onLoadError?: (error: unknown) => void;
}

const SUPPORTED_LANGS = new Set(["en", "es", "ru", "zh", "hi"]);

const EMPTY_WORKBOOK: Sheet[] = [{ name: "Sheet1", celldata: [], order: 0, status: 1 }];

const NUMERIC_TEXT = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;

function typeUnstyledNumbers(sheets: Sheet[]): Sheet[] {
  for (const sheet of sheets) {
    for (const entry of sheet.celldata ?? []) {
      const cell = entry.v;

      if (!cell || cell.ct || cell.qp || typeof cell.v !== "string" || !NUMERIC_TEXT.test(cell.v)) continue;

      cell.ct = { fa: "General", t: "n" };
      cell.m ??= cell.v;
      cell.v = Number(cell.v);
    }
  }

  return sheets;
}

async function readWorkbook(source: ArrayBuffer, fileName: string): Promise<Sheet[]> {
  const [{ HandleZip }, { FortuneFile }] = await Promise.all([import("@corbe30/fortune-excel/dist/ToFortuneSheet/HandleZip"), import("@corbe30/fortune-excel/dist/ToFortuneSheet/FortuneFile")]);

  const files = await new HandleZip(new File([source], fileName)).unzipFile();
  const workbook = new FortuneFile(files, fileName);
  workbook.Parse();

  return workbook.serialize().sheets as unknown as Sheet[];
}

async function writeWorkbook(sheetRef: RefObject<WorkbookInstance | null>): Promise<Blob> {
  const [{ exportSheetExcel }, { IFileType }] = await Promise.all([import("@corbe30/fortune-excel/dist/ToExcel/ExcelFile"), import("@corbe30/fortune-excel/dist/common/ICommon")]);

  return exportSheetExcel(sheetRef, IFileType.XLSX, false);
}

function useCanvasRefreshOnResize(element: HTMLElement | null) {
  const [pixelRatio, setPixelRatio] = useState(() => window.devicePixelRatio);

  useEffect(() => {
    if (!element) return;

    let frame = 0;
    let nudged = false;

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        nudged = !nudged;
        setPixelRatio(window.devicePixelRatio - (nudged ? 1e-9 : 0));
      });
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [element]);

  return pixelRatio;
}

export default function SheetsIsland({ source, fileName, onReady, onDirty, onLoadError }: SheetsIslandProps) {
  const host = useIslandHost();
  const sheetRef = useRef<WorkbookInstance>(null);
  const [sheets, setSheets] = useState<Sheet[] | null>(source ? null : EMPTY_WORKBOOK);
  const [key, setKey] = useState(0);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const pixelRatio = useCanvasRefreshOnResize(container);

  const callbacks = useRef({ onReady, onDirty, onLoadError });
  callbacks.current = { onReady, onDirty, onLoadError };

  useEffect(() => {
    loadWorkbook().catch((error) => callbacks.current.onLoadError?.(error));
  }, []);

  useEffect(() => {
    if (!source) return;

    let cancelled = false;

    readWorkbook(source, fileName).then(
      (next) => {
        if (cancelled) return;
        setSheets(typeUnstyledNumbers(structuredClone(next)));
        setKey((current) => current + 1);
      },
      (error) => {
        if (!cancelled) callbacks.current.onLoadError?.(error);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [source, fileName]);

  const [mountedKey, setMountedKey] = useState<number | null>(null);

  const attachWorkbook = useCallback(
    (instance: WorkbookInstance | null) => {
      sheetRef.current = instance;
      if (instance) setMountedKey(key);
    },
    [key],
  );

  useEffect(() => {
    if (mountedKey === null) return;

    callbacks.current.onReady?.({
      exportXlsx: () => writeWorkbook(sheetRef),
      instance: () => sheetRef.current,
    });
  }, [mountedKey]);

  if (!sheets) return null;

  const lang = host.locale.split("-")[0];

  return (
    <div ref={setContainer} data-island="sheets" className="hd-sheets h-full w-full">
      <Suspense>
        <Workbook key={key} ref={attachWorkbook} data={sheets} lang={SUPPORTED_LANGS.has(lang) ? lang : "en"} devicePixelRatio={pixelRatio} onOp={() => callbacks.current.onDirty?.()} />
      </Suspense>
    </div>
  );
}
