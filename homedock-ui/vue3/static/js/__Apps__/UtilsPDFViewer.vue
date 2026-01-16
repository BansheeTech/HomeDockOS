<!-- homedock-ui/vue3/static/js/__Apps__/UtilsPDFViewer.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="pdf-viewer flex flex-col h-full overflow-hidden @container">
    <div class="toolbar flex items-center gap-1 @[400px]:gap-2 px-2 @[400px]:px-3 py-2 border-b flex-shrink-0" :class="themeClasses.utilityToolbarBorder">
      <button @click="previousPage" :disabled="currentPage <= 1" :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="p-1 @[400px]:p-1.5 rounded transition-colors disabled:opacity-30" title="Previous Page">
        <Icon :icon="chevronLeftIcon" class="w-4 h-4" />
      </button>
      <span :class="['text-xs whitespace-nowrap', themeClasses.windowTextMuted]">{{ currentPage }} / {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage >= totalPages" :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="p-1 @[400px]:p-1.5 rounded transition-colors disabled:opacity-30" title="Next Page">
        <Icon :icon="chevronRightIcon" class="w-4 h-4" />
      </button>

      <div class="w-px h-4 mx-0.5 @[400px]:mx-1" :class="themeClasses.utilityDivider"></div>

      <div class="flex items-center gap-0">
        <button @click="zoomOut" :disabled="zoom <= 0.25" :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="p-1 @[400px]:p-1.5 rounded transition-colors disabled:opacity-30" title="Zoom Out (-)">
          <Icon :icon="magnifyMinusIcon" class="w-4 h-4" />
        </button>
        <span :class="['text-xs min-w-[40px] text-center', themeClasses.windowText]">{{ Math.round(zoom * 100) }}%</span>
        <button @click="zoomIn" :disabled="zoom >= 4" :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="p-1 @[400px]:p-1.5 rounded transition-colors disabled:opacity-30" title="Zoom In (+)">
          <Icon :icon="magnifyPlusIcon" class="w-4 h-4" />
        </button>
      </div>

      <div class="w-px h-4 mx-0.5 @[400px]:mx-1" :class="themeClasses.utilityDivider"></div>

      <button @click="fitToWidth" :class="[themeClasses.windowText, themeClasses.windowButtonBgHover, fitMode === 'width' ? 'bg-blue-500/20' : '']" class="p-1 @[400px]:p-1.5 rounded transition-colors" title="Fit to Width">
        <Icon :icon="arrowExpandHorizontalIcon" class="w-4 h-4" />
      </button>
      <button @click="fitToPage" :class="[themeClasses.windowText, themeClasses.windowButtonBgHover, fitMode === 'page' ? 'bg-blue-500/20' : '']" class="p-1 @[400px]:p-1.5 rounded transition-colors" title="Fit to Page">
        <Icon :icon="fitToPageIcon" class="w-4 h-4" />
      </button>

      <div class="flex-1"></div>

      <div v-if="fileSize" :class="['text-xs opacity-60 hidden @[450px]:block', themeClasses.windowText]">{{ formatFileSize(fileSize) }}</div>
    </div>

    <div ref="containerRef" class="flex-1 overflow-auto relative pdf-container" :class="themeClasses.imageViewerBg" @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd" @touchcancel="handleTouchEnd">
      <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center">
        <div class="flex flex-col items-center gap-3">
          <Icon :icon="loadingIcon" class="w-8 h-8 animate-spin" :class="themeClasses.windowTextMuted" />
          <span :class="['text-sm', themeClasses.windowTextMuted]">Loading PDF...</span>
        </div>
      </div>

      <div v-else-if="error" class="absolute inset-0 flex items-center justify-center">
        <div class="flex flex-col items-center gap-3 text-center p-8">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center bg-red-500/10">
            <Icon :icon="alertIcon" class="w-8 h-8 text-red-500" />
          </div>
          <h3 :class="['text-lg font-medium', themeClasses.windowText]">Cannot Display PDF</h3>
          <p :class="['text-sm max-w-xs', themeClasses.windowTextMuted]">{{ error }}</p>
        </div>
      </div>

      <div v-else-if="!pdfDocument" class="absolute inset-0 flex items-center justify-center">
        <div class="flex flex-col items-center gap-3 text-center p-8">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center" :class="themeClasses.imageViewerBg">
            <Icon :icon="filePdfIcon" class="w-8 h-8" :class="themeClasses.windowTextMuted" />
          </div>
          <h3 :class="['text-lg font-medium', themeClasses.windowText]">No PDF</h3>
          <p :class="['text-sm max-w-xs', themeClasses.windowTextMuted]">Open a PDF file to view it here.</p>
        </div>
      </div>

      <div v-else class="flex flex-col items-center gap-4 p-4 min-w-fit" @scroll="handleScroll">
        <canvas v-for="pageNum in renderedPages" :key="pageNum" :ref="(el) => setCanvasRef(el as HTMLCanvasElement, pageNum)" class="shadow-lg flex-shrink-0" :class="themeClasses.pdfCanvasBg"></canvas>

        <div v-if="totalPages > MAX_CONTINUOUS_PAGES && currentBatchEnd < totalPages" class="py-4">
          <button @click="loadNextBatch" :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="px-4 py-2 rounded-lg border transition-colors text-sm font-medium">Load pages {{ currentBatchEnd + 1 }}-{{ Math.min(currentBatchEnd + MAX_CONTINUOUS_PAGES, totalPages) }}</button>
        </div>
      </div>
    </div>

    <StatusBar :icon="filePdfIcon" :message="fileName || 'No PDF'" :info="totalPages > 0 ? `Page ${currentPage} of ${totalPages}` : ''">
      <template v-if="isValidated" #extra>
        <div class="flex items-center gap-1 text-green-500 text-[10px]">
          <Icon :icon="shieldCheckIcon" class="w-3.5 h-3.5" />
          <span>Verified</span>
        </div>
      </template>
      <template #help>
        <div class="space-y-3 max-w-sm">
          <div class="flex items-center gap-2">
            <Icon :icon="filePdfIcon" :class="['w-5 h-5', themeClasses.statusBarIcon]" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">PDF Viewer</h4>
          </div>
          <div :class="['text-[10px] md:text-xs space-y-2.5 leading-relaxed', themeClasses.statusBarInfo]">
            <p>A secure PDF viewer powered by PDF.js.</p>
            <div class="space-y-1.5">
              <div class="flex items-start gap-2">
                <Icon :icon="shieldCheckIcon" class="w-3.5 h-3.5 mt-0.5 text-green-500 flex-shrink-0" />
                <p><strong>Secure:</strong> PDFs are rendered safely without executing embedded scripts.</p>
              </div>
              <div class="flex items-start gap-2">
                <Icon :icon="magnifyPlusIcon" class="w-3.5 h-3.5 mt-0.5 text-blue-500 flex-shrink-0" />
                <p><strong>Zoom:</strong> Use +/- keys or toolbar buttons to zoom in and out.</p>
              </div>
              <div class="flex items-start gap-2">
                <Icon :icon="chevronLeftIcon" class="w-3.5 h-3.5 mt-0.5 text-purple-500 flex-shrink-0" />
                <p><strong>Navigate:</strong> Use arrow keys or toolbar buttons to change pages.</p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </StatusBar>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";

import { ref, shallowRef, computed, onMounted, onUnmounted, watch, nextTick } from "vue";

import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useWindowStore } from "../__Stores__/windowStore";

import StatusBar from "../__Components__/StatusBar.vue";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

import { Icon } from "@iconify/vue";
import filePdfIcon from "@iconify-icons/mdi/file-pdf-box";
import magnifyPlusIcon from "@iconify-icons/mdi/magnify-plus-outline";
import magnifyMinusIcon from "@iconify-icons/mdi/magnify-minus-outline";
import fitToPageIcon from "@iconify-icons/mdi/fit-to-page-outline";
import arrowExpandHorizontalIcon from "@iconify-icons/mdi/arrow-expand-horizontal";
import chevronLeftIcon from "@iconify-icons/mdi/chevron-left";
import chevronRightIcon from "@iconify-icons/mdi/chevron-right";
import loadingIcon from "@iconify-icons/mdi/loading";
import alertIcon from "@iconify-icons/mdi/alert-circle-outline";
import shieldCheckIcon from "@iconify-icons/mdi/shield-check-outline";

const { themeClasses } = useTheme();
const csrfToken = useCsrfToken();
const windowStore = useWindowStore();

interface ExternalFile {
  source: "storage" | "dropzone" | "appdrive";
  path: string;
  name: string;
  container?: string;
}

interface PDFFile {
  name: string;
  buffer: ArrayBuffer;
}

const props = defineProps<{
  _windowId?: string;
  externalFile?: ExternalFile;
  pdfFile?: PDFFile;
}>();

const MAX_CONTINUOUS_PAGES = 50;

const containerRef = ref<HTMLElement | null>(null);
const canvasRefs = new Map<number, HTMLCanvasElement>();
const activeRenderTasks = new Map<number, pdfjsLib.RenderTask>();
const pdfDocument = shallowRef<pdfjsLib.PDFDocumentProxy | null>(null);
const currentPage = ref(1);
const totalPages = ref(0);
const fileName = ref("");
const originalWindowTitle = ref(props._windowId ? windowStore.getWindowById(props._windowId)?.title || "" : "");
const fileSize = ref(0);
const isLoading = ref(false);
const error = ref<string | null>(null);
const isValidated = ref(false);
const currentBatchEnd = ref(0);

const zoom = ref(1);
const fitMode = ref<"width" | "page" | "custom">("width");

const isTouching = ref(false);
const initialPinchDistance = ref(0);
const initialPinchZoom = ref(1);
const pinchZoomPending = ref(false);

const renderedPages = computed(() => {
  if (totalPages.value === 0) return [];
  const pages: number[] = [];
  for (let i = 1; i <= currentBatchEnd.value; i++) {
    pages.push(i);
  }
  return pages;
});

function setCanvasRef(el: HTMLCanvasElement | null, pageNum: number) {
  if (el) {
    canvasRefs.set(pageNum, el);
  } else {
    canvasRefs.delete(pageNum);
  }
}

const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d];

function validatePDFMagicBytes(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer);
  return PDF_MAGIC_BYTES.every((b, i) => bytes[i] === b);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function updateWindowTitle(name: string) {
  if (props._windowId && name && originalWindowTitle.value) {
    windowStore.updateWindowTitle(props._windowId, `${originalWindowTitle.value} - ${name}`);
  }
}

async function loadPDFFromBuffer(buffer: ArrayBuffer, name: string) {
  isLoading.value = true;
  error.value = null;
  isValidated.value = false;
  for (const task of activeRenderTasks.values()) {
    task.cancel();
  }
  activeRenderTasks.clear();
  pdfDocument.value = null;
  currentPage.value = 1;
  totalPages.value = 0;
  currentBatchEnd.value = 0;
  canvasRefs.clear();

  fileName.value = name;
  fileSize.value = buffer.byteLength;
  updateWindowTitle(name);

  try {
    if (!validatePDFMagicBytes(buffer)) {
      throw new Error("File does not appear to be a valid PDF. Magic bytes validation failed.");
    }

    isValidated.value = true;

    let pdf: pdfjsLib.PDFDocumentProxy | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const loadingTask = pdfjsLib.getDocument({ data: buffer, verbosity: 0 });
        pdf = await loadingTask.promise;
        break;
      } catch (loadErr) {
        if (attempt === 2) throw loadErr;
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    if (!pdf) throw new Error("Failed to load PDF after retries");

    pdfDocument.value = pdf;
    totalPages.value = pdf.numPages;

    currentBatchEnd.value = Math.min(totalPages.value, MAX_CONTINUOUS_PAGES);
  } catch (err: any) {
    console.error("Failed to load PDF:", err);
    error.value = err.message || "Failed to load PDF";
  } finally {
    isLoading.value = false;
  }
}

async function renderPage(pageNum: number) {
  if (!pdfDocument.value || !containerRef.value) return;

  const canvas = canvasRefs.get(pageNum);
  if (!canvas) return;

  const existingTask = activeRenderTasks.get(pageNum);
  if (existingTask) {
    existingTask.cancel();
    activeRenderTasks.delete(pageNum);
  }

  try {
    const page = await pdfDocument.value.getPage(pageNum);
    const context = canvas.getContext("2d");

    if (!context) return;

    const containerWidth = containerRef.value.clientWidth - 64;
    const viewport = page.getViewport({ scale: 1 });

    let scale = zoom.value;

    if (fitMode.value === "width") {
      scale = containerWidth / viewport.width;
      if (pageNum === 1) zoom.value = scale;
    } else if (fitMode.value === "page") {
      const containerHeight = containerRef.value.clientHeight - 64;
      const scaleX = containerWidth / viewport.width;
      const scaleY = containerHeight / viewport.height;
      scale = Math.min(scaleX, scaleY);
      if (pageNum === 1) zoom.value = scale;
    }

    const scaledViewport = page.getViewport({ scale });

    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    const renderTask = page.render({ canvas, viewport: scaledViewport });
    activeRenderTasks.set(pageNum, renderTask);

    await renderTask.promise;
    activeRenderTasks.delete(pageNum);
  } catch (err: any) {
    if (err?.name === "RenderingCancelledException") return;
    console.error("Failed to render page:", pageNum, err);
  }
}

async function renderAllPages() {
  if (!pdfDocument.value) return;

  await nextTick();

  const batchSize = 5;
  for (let i = 1; i <= currentBatchEnd.value; i += batchSize) {
    const batch = [];
    for (let j = i; j < i + batchSize && j <= currentBatchEnd.value; j++) {
      batch.push(renderPage(j));
    }
    await Promise.all(batch);
  }
}

async function loadNextBatch() {
  if (currentBatchEnd.value >= totalPages.value) return;

  const newEnd = Math.min(currentBatchEnd.value + MAX_CONTINUOUS_PAGES, totalPages.value);
  const oldEnd = currentBatchEnd.value;
  currentBatchEnd.value = newEnd;

  await nextTick();

  for (let i = oldEnd + 1; i <= newEnd; i++) {
    await renderPage(i);
  }
}

function handleScroll(e: Event) {
  const container = e.target as HTMLElement;
  if (!container) return;

  const containerRect = container.getBoundingClientRect();

  for (const [pageNum, canvas] of canvasRefs) {
    const rect = canvas.getBoundingClientRect();
    const visibleTop = Math.max(rect.top, containerRect.top);
    const visibleBottom = Math.min(rect.bottom, containerRect.bottom);
    const visibleHeight = visibleBottom - visibleTop;

    if (visibleHeight > containerRect.height * 0.3) {
      currentPage.value = pageNum;
      break;
    }
  }
}

function scrollToPage(pageNum: number) {
  const canvas = canvasRefs.get(pageNum);
  if (canvas) {
    canvas.scrollIntoView({ behavior: "smooth", block: "start" });
    currentPage.value = pageNum;
  }
}

function nextPage() {
  if (currentPage.value < currentBatchEnd.value) {
    scrollToPage(currentPage.value + 1);
  }
}

function previousPage() {
  if (currentPage.value > 1) {
    scrollToPage(currentPage.value - 1);
  }
}

async function zoomIn() {
  zoom.value = Math.min(4, zoom.value * 1.25);
  fitMode.value = "custom";
  await renderAllPages();
}

async function zoomOut() {
  zoom.value = Math.max(0.25, zoom.value / 1.25);
  fitMode.value = "custom";
  await renderAllPages();
}

async function fitToWidth() {
  fitMode.value = "width";
  await renderAllPages();
}

async function fitToPage() {
  fitMode.value = "page";
  await renderAllPages();
}

async function loadPDF(extFile: ExternalFile) {
  isLoading.value = true;
  error.value = null;

  try {
    let response: any;
    let fileBuffer: ArrayBuffer;

    if (extFile.source === "storage") {
      response = await axios.get("/api/storage/download", {
        params: { file: extFile.path },
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
        responseType: "arraybuffer",
      });
      fileBuffer = response.data;
    } else if (extFile.source === "dropzone") {
      response = await axios.get("/api/dropzone/download", {
        params: { file: extFile.path },
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
        responseType: "arraybuffer",
      });
      fileBuffer = response.data;
    } else if (extFile.source === "appdrive") {
      response = await axios.get("/api/appdrive/download", {
        params: {
          container: extFile.container,
          path: extFile.path,
        },
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
        responseType: "arraybuffer",
      });
      fileBuffer = response.data;
    } else {
      throw new Error("Unknown file source");
    }

    await loadPDFFromBuffer(fileBuffer, extFile.name);
  } catch (err: any) {
    console.error("Failed to load PDF:", err);
    error.value = err.message || "Failed to load PDF";
    isLoading.value = false;
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement) return;

  if (e.key === "+" || e.key === "=") {
    e.preventDefault();
    zoomIn();
  } else if (e.key === "-") {
    e.preventDefault();
    zoomOut();
  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
    e.preventDefault();
    previousPage();
  } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
    e.preventDefault();
    nextPage();
  } else if (e.key === "Home") {
    e.preventDefault();
    scrollToPage(1);
  } else if (e.key === "End") {
    e.preventDefault();
    scrollToPage(currentBatchEnd.value);
  }
}

function getTouchDistance(touches: TouchList): number {
  if (touches.length < 2) return 0;
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function handleTouchStart(e: TouchEvent) {
  if (e.touches.length === 2) {
    e.preventDefault();
    initialPinchDistance.value = getTouchDistance(e.touches);
    initialPinchZoom.value = zoom.value;
    isTouching.value = true;
    pinchZoomPending.value = false;
  }
}

function handleTouchMove(e: TouchEvent) {
  if (!isTouching.value || e.touches.length !== 2) return;

  e.preventDefault();
  const currentDistance = getTouchDistance(e.touches);
  if (initialPinchDistance.value > 0) {
    const scale = currentDistance / initialPinchDistance.value;
    const newZoom = Math.max(0.25, Math.min(4, initialPinchZoom.value * scale));
    zoom.value = newZoom;
    fitMode.value = "custom";
    pinchZoomPending.value = true;
  }
}

function handleTouchEnd(e: TouchEvent) {
  if (e.touches.length === 0) {
    if (pinchZoomPending.value) {
      renderAllPages();
      pinchZoomPending.value = false;
    }
    isTouching.value = false;
    initialPinchDistance.value = 0;
  } else if (e.touches.length === 1) {
    isTouching.value = false;
    initialPinchDistance.value = 0;
  }
}

let resizeObserver: ResizeObserver | null = null;
let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

function setupResizeObserver() {
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (pdfDocument.value && (fitMode.value === "width" || fitMode.value === "page")) {
          renderAllPages();
        }
      }, 150);
    });
    resizeObserver.observe(containerRef.value);
  }
}

watch(renderedPages, async (pages) => {
  if (pages.length > 0 && pdfDocument.value) {
    await nextTick();
    await renderAllPages();
  }
});

watch(
  () => props.externalFile,
  (extFile) => {
    if (extFile) {
      loadPDF(extFile);
    }
  },
  { immediate: true }
);

watch(
  () => props.pdfFile,
  (pdfFileData) => {
    if (pdfFileData) {
      loadPDFFromBuffer(pdfFileData.buffer, pdfFileData.name);
    }
  },
  { immediate: true }
);

function handleIncomingFile(event: CustomEvent) {
  const data = event.detail;
  if (data?.pdfFile) {
    loadPDFFromBuffer(data.pdfFile.buffer, data.pdfFile.name);
  } else if (data?.externalFile) {
    loadPDF(data.externalFile);
  }
}

function cleanup() {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
  }
  for (const task of activeRenderTasks.values()) {
    task.cancel();
  }
  activeRenderTasks.clear();
  if (pdfDocument.value) {
    pdfDocument.value.destroy();
    pdfDocument.value = null;
  }
  canvasRefs.clear();
}

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
  setupResizeObserver();

  if (props._windowId) {
    window.addEventListener(`homedock:open-file-${props._windowId}`, handleIncomingFile as EventListener);
  }
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);

  if (resizeObserver) {
    resizeObserver.disconnect();
  }

  if (props._windowId) {
    window.removeEventListener(`homedock:open-file-${props._windowId}`, handleIncomingFile as EventListener);
  }

  cleanup();
});
</script>

<style scoped>
.pdf-viewer {
  user-select: none;
}

.pdf-container {
  touch-action: pan-x pan-y;
}
</style>
