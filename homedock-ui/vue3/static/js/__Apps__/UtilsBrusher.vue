<!-- homedock-ui/vue3/static/js/__Apps__/UtilsBrusher.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="brusher flex flex-col h-full overflow-hidden select-none">
    <AppDialog v-model:visible="showUnsavedDialog" title="Unsaved Changes" content="You have unsaved changes. Do you want to save before closing?" ok-text="Save" cancel-text="Cancel" dismiss-text="Don't Save" type="warning" :mask-closable="false" @ok="handleSaveAndClose" @cancel="showUnsavedDialog = false" @dismiss="handleDiscardAndClose" />

    <AppDialog v-model:visible="showResizeDialog" title="Resize Canvas" ok-text="Resize" cancel-text="Cancel" @ok="handleResize" @cancel="showResizeDialog = false">
      <div class="space-y-4">
        <div class="flex items-center gap-4">
          <div class="flex-1">
            <label :class="['text-xs block mb-1', themeClasses.windowTextMuted]">Width (px)</label>
            <input v-model.number="resizeWidth" type="number" min="100" max="4000" :class="[themeClasses.windowBg, themeClasses.windowText, themeClasses.windowBorder]" class="w-full px-3 py-2 text-sm rounded-lg border outline-none" />
          </div>
          <div class="flex-1">
            <label :class="['text-xs block mb-1', themeClasses.windowTextMuted]">Height (px)</label>
            <input v-model.number="resizeHeight" type="number" min="100" max="4000" :class="[themeClasses.windowBg, themeClasses.windowText, themeClasses.windowBorder]" class="w-full px-3 py-2 text-sm rounded-lg border outline-none" />
          </div>
        </div>
        <p :class="['text-xs', themeClasses.windowTextMuted]">Current: {{ canvasWidth }} × {{ canvasHeight }}. Existing content will be preserved in the top-left corner.</p>
      </div>
    </AppDialog>

    <div class="flex items-center gap-1 px-2 py-1.5 border-b" :class="themeClasses.utilityToolbarBorder">
      <Dropdown :trigger="['click']" placement="bottomLeft" :overlay-class-name="themeClasses.scopeSelector">
        <button :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="px-3 py-1 text-xs rounded transition-colors">File</button>
        <template #overlay>
          <Menu>
            <MenuItem key="new" @click="newCanvas">
              <div class="flex items-center gap-2">
                <Icon :icon="fileIcon" class="w-4 h-4" />
                <span>New</span>
                <span class="ml-auto text-[10px] opacity-50">Ctrl+N</span>
              </div>
            </MenuItem>
            <MenuDivider />
            <MenuItem key="save" @click="saveImage">
              <div class="flex items-center gap-2">
                <Icon :icon="saveIcon" class="w-4 h-4" />
                <span>Save</span>
                <span class="ml-auto text-[10px] opacity-50">Ctrl+S</span>
              </div>
            </MenuItem>
            <MenuDivider />
            <MenuItem key="exit" @click="handleExit">
              <div class="flex items-center gap-2">
                <Icon :icon="exitIcon" class="w-4 h-4" />
                <span>Exit</span>
              </div>
            </MenuItem>
          </Menu>
        </template>
      </Dropdown>

      <Dropdown :trigger="['click']" placement="bottomLeft" :overlay-class-name="themeClasses.scopeSelector">
        <button :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="px-3 py-1 text-xs rounded transition-colors">Edit</button>
        <template #overlay>
          <Menu>
            <MenuItem key="undo" @click="undo" :disabled="historyIndex <= 0">
              <div class="flex items-center gap-2">
                <Icon :icon="undoIcon" class="w-4 h-4" />
                <span>Undo</span>
                <span class="ml-auto text-[10px] opacity-50">Ctrl+Z</span>
              </div>
            </MenuItem>
            <MenuItem key="redo" @click="redo" :disabled="historyIndex >= history.length - 1">
              <div class="flex items-center gap-2">
                <Icon :icon="redoIcon" class="w-4 h-4" />
                <span>Redo</span>
                <span class="ml-auto text-[10px] opacity-50">Ctrl+Y</span>
              </div>
            </MenuItem>
            <MenuDivider />
            <MenuItem key="clear" @click="clearCanvas">
              <div class="flex items-center gap-2">
                <Icon :icon="deleteIcon" class="w-4 h-4" />
                <span>Clear Canvas</span>
              </div>
            </MenuItem>
          </Menu>
        </template>
      </Dropdown>

      <Dropdown :trigger="['click']" placement="bottomLeft" :overlay-class-name="themeClasses.scopeSelector">
        <button :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="px-3 py-1 text-xs rounded transition-colors">Image</button>
        <template #overlay>
          <Menu>
            <MenuItem key="resize" @click="openResizeDialog">
              <div class="flex items-center gap-2">
                <Icon :icon="resizeIcon" class="w-4 h-4" />
                <span>Resize Canvas...</span>
              </div>
            </MenuItem>
          </Menu>
        </template>
      </Dropdown>
    </div>

    <div class="toolbar flex items-center gap-2 px-2 py-1.5 border-b flex-shrink-0" :class="themeClasses.utilityToolbarBorder">
      <div class="flex items-center gap-0.5">
        <button v-for="tool in tools" :key="tool.id" @click="currentTool = tool.id" :class="[themeClasses.windowText, themeClasses.windowButtonBgHover, currentTool === tool.id ? 'ring-2 ring-blue-500 bg-blue-500/20' : '']" class="tool-btn p-1.5 rounded transition-colors" :title="tool.name">
          <Icon :icon="tool.icon" class="tool-icon" />
        </button>
      </div>

      <div class="w-px h-5 mx-0.5 flex-shrink-0" :class="themeClasses.utilityDivider"></div>

      <div class="flex items-center gap-1.5">
        <label class="relative cursor-pointer flex-shrink-0">
          <div class="color-swatch rounded border-2 border-white shadow-md" :style="{ backgroundColor: currentColor }"></div>
          <input type="color" v-model="currentColor" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
        </label>
        <div class="quick-colors gap-0.5">
          <button v-for="color in quickColors" :key="color" @click="currentColor = color" class="w-4 h-4 rounded border border-gray-400/50 hover:scale-110 transition-transform" :style="{ backgroundColor: color }" :title="color"></button>
        </div>
      </div>

      <div class="w-px h-5 mx-0.5 flex-shrink-0" :class="themeClasses.utilityDivider"></div>

      <div class="flex items-center gap-1.5">
        <Icon :icon="brushIcon" class="brush-icon w-4 h-4" :class="themeClasses.windowTextMuted" />
        <input type="range" v-model.number="brushSize" min="1" max="50" class="brush-slider h-1.5 rounded-lg appearance-none cursor-pointer accent-blue-500" :class="themeClasses.sliderBg" />
        <span class="brush-size-label text-center" :class="themeClasses.windowTextMuted">{{ brushSize }}</span>
      </div>
    </div>

    <div ref="canvasContainer" class="flex-1 overflow-auto relative" :class="themeClasses.brusherCanvasBg">
      <canvas ref="canvasRef" @mousedown="startDrawing" @mousemove="draw" @touchstart.prevent="handleTouchStart" @touchmove.prevent="handleTouchMove" @touchend.prevent="stopDrawing" class="cursor-crosshair" :style="{ backgroundColor: canvasBackground }"></canvas>

      <canvas ref="previewCanvasRef" class="absolute top-0 left-0 pointer-events-none"></canvas>
    </div>

    <StatusBar :icon="brushIcon" :message="tools.find((t) => t.id === currentTool)?.name || 'Pencil'" :info="`${canvasWidth} × ${canvasHeight}${lastSaved ? ' · Saved: ' + lastSaved : ''}`">
      <template #help>
        <div class="space-y-3 max-w-sm">
          <div class="flex items-center gap-2">
            <Icon :icon="brushIcon" :class="['w-5 h-5', themeClasses.statusBarIcon]" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">Brusher</h4>
          </div>
          <div :class="['text-[10px] md:text-xs space-y-2.5 leading-relaxed', themeClasses.statusBarInfo]">
            <p>A simple drawing application for quick sketches and annotations.</p>
            <div class="space-y-1.5">
              <div class="flex items-start gap-2">
                <Icon :icon="pencilIcon" class="w-3.5 h-3.5 mt-0.5 text-blue-500 flex-shrink-0" />
                <p><strong>Tools:</strong> Pencil, Eraser, Line, Rectangle, and Circle tools available in the toolbar.</p>
              </div>
              <div class="flex items-start gap-2">
                <Icon :icon="undoIcon" class="w-3.5 h-3.5 mt-0.5 text-orange-500 flex-shrink-0" />
                <p><strong>Undo/Redo:</strong> Use Ctrl+Z to undo and Ctrl+Y to redo your changes.</p>
              </div>
              <div class="flex items-start gap-2">
                <Icon :icon="saveIcon" class="w-3.5 h-3.5 mt-0.5 text-green-500 flex-shrink-0" />
                <p><strong>Save:</strong> Images are saved to Storage/Photos as PNG files.</p>
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

import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";

import { Dropdown, Menu, MenuItem, MenuDivider, message } from "ant-design-vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useWindowStore } from "../__Stores__/windowStore";

import AppDialog from "../__Components__/AppDialog.vue";
import StatusBar from "../__Components__/StatusBar.vue";

import { Icon } from "@iconify/vue";
import pencilIcon from "@iconify-icons/mdi/pencil";
import eraserIcon from "@iconify-icons/mdi/eraser";
import minusIcon from "@iconify-icons/mdi/minus";
import squareOutlineIcon from "@iconify-icons/mdi/square-outline";
import circleOutlineIcon from "@iconify-icons/mdi/circle-outline";
import brushIcon from "@iconify-icons/mdi/brush";
import undoIcon from "@iconify-icons/mdi/undo";
import redoIcon from "@iconify-icons/mdi/redo";
import deleteIcon from "@iconify-icons/mdi/delete-outline";
import saveIcon from "@iconify-icons/mdi/content-save";
import loadingIcon from "@iconify-icons/mdi/loading";
import fileIcon from "@iconify-icons/mdi/file";
import resizeIcon from "@iconify-icons/mdi/resize";
import imageIcon from "@iconify-icons/mdi/image";
import exitIcon from "@iconify-icons/mdi/exit-to-app";

const { themeClasses } = useTheme();
const csrfToken = useCsrfToken();
const windowStore = useWindowStore();

interface ImageFile {
  name: string;
  extension: string;
  buffer: ArrayBuffer;
}

const props = defineProps<{
  _windowId?: string;
  imageFile?: ImageFile;
}>();

const hasUnsavedChanges = ref(false);
const showUnsavedDialog = ref(false);

const showResizeDialog = ref(false);
const resizeWidth = ref(800);
const resizeHeight = ref(426);

const tools = [
  { id: "pencil", name: "Pencil", icon: pencilIcon },
  { id: "eraser", name: "Eraser", icon: eraserIcon },
  { id: "line", name: "Line", icon: minusIcon },
  { id: "rectangle", name: "Rectangle", icon: squareOutlineIcon },
  { id: "circle", name: "Circle", icon: circleOutlineIcon },
];

const quickColors = ["#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#ff8000", "#8000ff"];

const canvasRef = ref<HTMLCanvasElement | null>(null);
const previewCanvasRef = ref<HTMLCanvasElement | null>(null);
const canvasContainer = ref<HTMLElement | null>(null);
const currentTool = ref("pencil");
const currentColor = ref("#000000");
const brushSize = ref(5);
const canvasBackground = ref("#ffffff");
const canvasWidth = ref(800);
const canvasHeight = ref(426);
const isSaving = ref(false);
const lastSaved = ref("");

const isDrawing = ref(false);
const startX = ref(0);
const startY = ref(0);
const lastX = ref(0);
const lastY = ref(0);

const history = ref<ImageData[]>([]);
const historyIndex = ref(-1);
const maxHistory = 30;

function getContext(): CanvasRenderingContext2D | null {
  return canvasRef.value?.getContext("2d") || null;
}

function getPreviewContext(): CanvasRenderingContext2D | null {
  return previewCanvasRef.value?.getContext("2d") || null;
}

function saveToHistory(isInitial = false) {
  const ctx = getContext();
  if (!ctx || !canvasRef.value) return;

  const imageData = ctx.getImageData(0, 0, canvasRef.value.width, canvasRef.value.height);

  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1);
  }

  history.value.push(imageData);

  if (history.value.length > maxHistory) {
    history.value.shift();
  } else {
    historyIndex.value++;
  }

  if (!isInitial) {
    hasUnsavedChanges.value = true;
  }
}

function undo() {
  if (historyIndex.value <= 0) return;

  historyIndex.value--;
  const ctx = getContext();
  if (ctx && history.value[historyIndex.value]) {
    ctx.putImageData(history.value[historyIndex.value], 0, 0);
  }
}

function redo() {
  if (historyIndex.value >= history.value.length - 1) return;

  historyIndex.value++;
  const ctx = getContext();
  if (ctx && history.value[historyIndex.value]) {
    ctx.putImageData(history.value[historyIndex.value], 0, 0);
  }
}

function clearCanvas() {
  const ctx = getContext();
  if (!ctx || !canvasRef.value) return;

  ctx.fillStyle = canvasBackground.value;
  ctx.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  saveToHistory();
}

function newCanvas() {
  if (hasUnsavedChanges.value) {
    if (!confirm("Create a new canvas? All unsaved changes will be lost.")) {
      return;
    }
  }

  history.value = [];
  historyIndex.value = -1;
  hasUnsavedChanges.value = false;
  lastSaved.value = "";

  const ctx = getContext();
  if (ctx && canvasRef.value) {
    ctx.fillStyle = canvasBackground.value;
    ctx.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height);
    saveToHistory(true);
  }
}

function openResizeDialog() {
  resizeWidth.value = canvasWidth.value;
  resizeHeight.value = canvasHeight.value;
  showResizeDialog.value = true;
}

function handleResize() {
  const newWidth = Math.max(100, Math.min(4000, resizeWidth.value));
  const newHeight = Math.max(100, Math.min(4000, resizeHeight.value));

  if (newWidth === canvasWidth.value && newHeight === canvasHeight.value) {
    showResizeDialog.value = false;
    return;
  }

  const canvas = canvasRef.value;
  const previewCanvas = previewCanvasRef.value;
  if (!canvas || !previewCanvas) return;

  const ctx = getContext();
  if (!ctx) return;

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext("2d");
  if (!tempCtx) return;
  tempCtx.drawImage(canvas, 0, 0);

  canvas.width = newWidth;
  canvas.height = newHeight;

  previewCanvas.width = newWidth;
  previewCanvas.height = newHeight;

  ctx.fillStyle = canvasBackground.value;
  ctx.fillRect(0, 0, newWidth, newHeight);

  ctx.drawImage(tempCanvas, 0, 0);

  canvasWidth.value = newWidth;
  canvasHeight.value = newHeight;

  history.value = [];
  historyIndex.value = -1;
  saveToHistory();
  hasUnsavedChanges.value = true;

  showResizeDialog.value = false;
  message.success(`Canvas resized to ${newWidth} × ${newHeight}`);
}

function getCoordinates(e: MouseEvent | Touch): { x: number; y: number } {
  const canvas = canvasRef.value;
  if (!canvas) return { x: 0, y: 0 };

  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

function startDrawing(e: MouseEvent) {
  isDrawing.value = true;
  const coords = getCoordinates(e);
  startX.value = coords.x;
  startY.value = coords.y;
  lastX.value = coords.x;
  lastY.value = coords.y;

  if (currentTool.value === "pencil" || currentTool.value === "eraser") {
    const ctx = getContext();
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    }
  }

  document.addEventListener("mouseup", handleGlobalMouseUp);
  document.addEventListener("mousemove", handleGlobalMouseMove);
}

function handleGlobalMouseUp() {
  stopDrawing();
  document.removeEventListener("mouseup", handleGlobalMouseUp);
  document.removeEventListener("mousemove", handleGlobalMouseMove);
}

function handleGlobalMouseMove(e: MouseEvent) {
  if (!isDrawing.value) return;
  draw(e);
}

function draw(e: MouseEvent) {
  if (!isDrawing.value) return;

  const coords = getCoordinates(e);
  const ctx = getContext();
  const previewCtx = getPreviewContext();

  if (!ctx) return;

  if (currentTool.value === "pencil") {
    ctx.strokeStyle = currentColor.value;
    ctx.lineWidth = brushSize.value;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  } else if (currentTool.value === "eraser") {
    ctx.strokeStyle = canvasBackground.value;
    ctx.lineWidth = brushSize.value;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  } else if (previewCtx && previewCanvasRef.value) {
    previewCtx.clearRect(0, 0, previewCanvasRef.value.width, previewCanvasRef.value.height);
    previewCtx.strokeStyle = currentColor.value;
    previewCtx.lineWidth = brushSize.value;
    previewCtx.lineCap = "round";

    if (currentTool.value === "line") {
      previewCtx.beginPath();
      previewCtx.moveTo(startX.value, startY.value);
      previewCtx.lineTo(coords.x, coords.y);
      previewCtx.stroke();
    } else if (currentTool.value === "rectangle") {
      previewCtx.strokeRect(startX.value, startY.value, coords.x - startX.value, coords.y - startY.value);
    } else if (currentTool.value === "circle") {
      const radiusX = Math.abs(coords.x - startX.value) / 2;
      const radiusY = Math.abs(coords.y - startY.value) / 2;
      const centerX = startX.value + (coords.x - startX.value) / 2;
      const centerY = startY.value + (coords.y - startY.value) / 2;
      previewCtx.beginPath();
      previewCtx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
      previewCtx.stroke();
    }
  }

  lastX.value = coords.x;
  lastY.value = coords.y;
}

function stopDrawing() {
  if (!isDrawing.value) return;

  isDrawing.value = false;
  const ctx = getContext();
  const previewCtx = getPreviewContext();

  if (!ctx) return;

  if (currentTool.value === "line") {
    ctx.strokeStyle = currentColor.value;
    ctx.lineWidth = brushSize.value;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(startX.value, startY.value);
    ctx.lineTo(lastX.value, lastY.value);
    ctx.stroke();
  } else if (currentTool.value === "rectangle") {
    ctx.strokeStyle = currentColor.value;
    ctx.lineWidth = brushSize.value;
    ctx.strokeRect(startX.value, startY.value, lastX.value - startX.value, lastY.value - startY.value);
  } else if (currentTool.value === "circle") {
    ctx.strokeStyle = currentColor.value;
    ctx.lineWidth = brushSize.value;
    const radiusX = Math.abs(lastX.value - startX.value) / 2;
    const radiusY = Math.abs(lastY.value - startY.value) / 2;
    const centerX = startX.value + (lastX.value - startX.value) / 2;
    const centerY = startY.value + (lastY.value - startY.value) / 2;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (previewCtx && previewCanvasRef.value) {
    previewCtx.clearRect(0, 0, previewCanvasRef.value.width, previewCanvasRef.value.height);
  }

  saveToHistory();
}

function handleTouchStart(e: TouchEvent) {
  if (e.touches.length === 1) {
    const touch = e.touches[0];
    isDrawing.value = true;
    const coords = getCoordinates(touch);
    startX.value = coords.x;
    startY.value = coords.y;
    lastX.value = coords.x;
    lastY.value = coords.y;

    if (currentTool.value === "pencil" || currentTool.value === "eraser") {
      const ctx = getContext();
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
      }
    }
  }
}

function handleTouchMove(e: TouchEvent) {
  if (e.touches.length === 1 && isDrawing.value) {
    const touch = e.touches[0];
    draw({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
  }
}

async function saveImage() {
  if (!canvasRef.value) return;

  isSaving.value = true;

  try {
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvasRef.value!.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error("Failed to create blob"));
      }, "image/png");
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `brusher-${timestamp}.png`;

    const formData = new FormData();
    formData.append("file", blob, filename);
    formData.append("path", "Photos");

    await axios.post("/api/storage/upload", formData, {
      headers: {
        "X-HomeDock-CSRF-Token": csrfToken.value,
        "Content-Type": "multipart/form-data",
      },
    });

    lastSaved.value = new Date().toLocaleTimeString();
    hasUnsavedChanges.value = false;
    message.success(`Saved to Storage/Photos/${filename}`);
  } catch (error) {
    console.error("Failed to save image:", error);
    message.error("Failed to save image");
  } finally {
    isSaving.value = false;
  }
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
    e.preventDefault();
    undo();
  } else if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
    e.preventDefault();
    redo();
  } else if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    saveImage();
  } else if ((e.ctrlKey || e.metaKey) && e.key === "n") {
    e.preventDefault();
    newCanvas();
  }
}

function initializeCanvas() {
  if (!canvasContainer.value || !canvasRef.value || !previewCanvasRef.value) return;

  const width = 800;
  const height = 426;

  canvasRef.value.width = width;
  canvasRef.value.height = height;
  previewCanvasRef.value.width = width;
  previewCanvasRef.value.height = height;

  canvasWidth.value = width;
  canvasHeight.value = height;

  const ctx = getContext();
  if (ctx) {
    ctx.fillStyle = canvasBackground.value;
    ctx.fillRect(0, 0, width, height);
  }
}

function handleCloseRequest(e: Event) {
  if (hasUnsavedChanges.value) {
    e.preventDefault();
    showUnsavedDialog.value = true;
  }
}

async function handleSaveAndClose() {
  showUnsavedDialog.value = false;
  await saveImage();
  if (props._windowId) {
    windowStore.closeWindow(props._windowId);
  }
}

function handleDiscardAndClose() {
  showUnsavedDialog.value = false;
  hasUnsavedChanges.value = false;
  if (props._windowId) {
    windowStore.closeWindow(props._windowId);
  }
}

function handleExit() {
  if (!props._windowId) return;

  if (hasUnsavedChanges.value) {
    showUnsavedDialog.value = true;
  } else {
    windowStore.closeWindow(props._windowId);
  }
}

const pendingImageFile = ref<ImageFile | null>(null);

function arrayBufferToDataUrl(buffer: ArrayBuffer, mimeType: string): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.byteLength; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.byteLength));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

function loadImageFromBuffer(imgFile: ImageFile) {
  if (!canvasRef.value) {
    pendingImageFile.value = imgFile;
    return;
  }

  const ext = imgFile.extension.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp",
  };
  const mimeType = mimeTypes[ext] || `image/${ext}`;

  const dataUrl = arrayBufferToDataUrl(imgFile.buffer, mimeType);

  const img = new Image();
  img.onload = () => {
    canvasWidth.value = img.width;
    canvasHeight.value = img.height;

    nextTick(() => {
      const ctx = getContext();
      if (ctx && canvasRef.value) {
        canvasRef.value.width = img.width;
        canvasRef.value.height = img.height;

        if (previewCanvasRef.value) {
          previewCanvasRef.value.width = img.width;
          previewCanvasRef.value.height = img.height;
        }

        ctx.drawImage(img, 0, 0);

        history.value = [];
        historyIndex.value = -1;
        saveToHistory(true);
      }
    });
  };
  img.onerror = () => {
    console.error("Failed to load image");
  };
  img.src = dataUrl;
}

watch(
  () => props.imageFile,
  (imgFile) => {
    if (imgFile) {
      loadImageFromBuffer(imgFile);
    }
  },
  { immediate: true }
);

function handleIncomingFile(event: CustomEvent) {
  const data = event.detail;
  if (data?.imageFile) {
    loadImageFromBuffer(data.imageFile);
  }
}

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);

  if (props._windowId) {
    window.addEventListener(`homedock:request-close-${props._windowId}`, handleCloseRequest);
    window.addEventListener(`homedock:open-file-${props._windowId}`, handleIncomingFile as EventListener);
  }

  nextTick(() => {
    initializeCanvas();

    if (pendingImageFile.value) {
      loadImageFromBuffer(pendingImageFile.value);
      pendingImageFile.value = null;
    } else {
      saveToHistory(true);
    }
  });
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
  document.removeEventListener("mouseup", handleGlobalMouseUp);
  document.removeEventListener("mousemove", handleGlobalMouseMove);
  if (props._windowId) {
    window.removeEventListener(`homedock:request-close-${props._windowId}`, handleCloseRequest);
    window.removeEventListener(`homedock:open-file-${props._windowId}`, handleIncomingFile as EventListener);
  }
});
</script>

<style scoped>
.brusher {
  user-select: none;
}

/* Default styles for small windows */
.tool-icon {
  width: 1rem;
  height: 1rem;
}

.color-swatch {
  width: 1.5rem;
  height: 1.5rem;
}

.quick-colors {
  display: none;
}

.brush-icon {
  display: none;
}

.brush-slider {
  width: 4rem;
}

.brush-size-label {
  font-size: 10px;
  width: 1.25rem;
}

/* Medium window styles (450px+) */
@container window (min-width: 450px) {
  .tool-icon {
    width: 1.25rem;
    height: 1.25rem;
  }

  .color-swatch {
    width: 1.75rem;
    height: 1.75rem;
  }

  .brush-icon {
    display: block;
  }

  .brush-slider {
    width: 5rem;
  }

  .brush-size-label {
    font-size: 12px;
    width: 1.5rem;
  }
}

/* Larger window styles (600px+) show quick colors */
@container window (min-width: 600px) {
  .quick-colors {
    display: flex;
  }
}

input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 3px;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
}
</style>
