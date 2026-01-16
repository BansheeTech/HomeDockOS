<!-- homedock-ui/vue3/static/js/__Apps__/UtilsImageViewer.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="image-viewer flex flex-col h-full overflow-hidden">
    <div class="toolbar flex items-center gap-2 px-3 py-2 border-b flex-shrink-0" :class="themeClasses.utilityToolbarBorder">
      <button @click="zoomOut" :disabled="zoom <= 0.1" :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="p-1.5 rounded transition-colors disabled:opacity-30" title="Zoom Out (-)">
        <Icon :icon="magnifyMinusIcon" class="w-4 h-4" />
      </button>
      <span :class="['text-xs min-w-[50px] text-center', themeClasses.windowText]">{{ Math.round(zoom * 100) }}%</span>
      <button @click="zoomIn" :disabled="zoom >= 5" :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="p-1.5 rounded transition-colors disabled:opacity-30" title="Zoom In (+)">
        <Icon :icon="magnifyPlusIcon" class="w-4 h-4" />
      </button>

      <div class="w-px h-4 mx-1" :class="themeClasses.utilityDivider"></div>

      <button @click="fitToWindow" :class="[themeClasses.windowText, themeClasses.windowButtonBgHover, fitMode === 'fit' ? 'bg-blue-500/20' : '']" class="p-1.5 rounded transition-colors" title="Fit to Window">
        <Icon :icon="fitToPageIcon" class="w-4 h-4" />
      </button>
      <button @click="actualSize" :class="[themeClasses.windowText, themeClasses.windowButtonBgHover, fitMode === 'actual' ? 'bg-blue-500/20' : '']" class="p-1.5 rounded transition-colors" title="Actual Size (1:1)">
        <Icon :icon="aspectRatioIcon" class="w-4 h-4" />
      </button>

      <div class="flex-1"></div>

      <div v-if="imageInfo" :class="['text-xs opacity-60', themeClasses.windowText]">{{ imageInfo.width }} × {{ imageInfo.height }} · {{ formatFileSize(imageInfo.size) }}</div>
    </div>

    <div ref="containerRef" class="flex-1 overflow-hidden relative" :class="themeClasses.imageViewerBg" @wheel.prevent="handleWheel" @mousedown="startPan" @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd" @touchcancel="handleTouchEnd">
      <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center">
        <div class="flex flex-col items-center gap-3">
          <Icon :icon="loadingIcon" class="w-8 h-8 animate-spin" :class="themeClasses.windowTextMuted" />
          <span :class="['text-sm', themeClasses.windowTextMuted]">Loading image...</span>
        </div>
      </div>

      <div v-else-if="error" class="absolute inset-0 flex items-center justify-center">
        <div class="flex flex-col items-center gap-3 text-center p-8">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center bg-red-500/10">
            <Icon :icon="alertIcon" class="w-8 h-8 text-red-500" />
          </div>
          <h3 :class="['text-lg font-medium', themeClasses.windowText]">Cannot Display Image</h3>
          <p :class="['text-sm max-w-xs', themeClasses.windowTextMuted]">{{ error }}</p>
        </div>
      </div>

      <div v-else-if="!imageSrc" class="absolute inset-0 flex items-center justify-center">
        <div class="flex flex-col items-center gap-3 text-center p-8">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center" :class="themeClasses.imageViewerBg">
            <Icon :icon="imageIcon" class="w-8 h-8" :class="themeClasses.windowTextMuted" />
          </div>
          <h3 :class="['text-lg font-medium', themeClasses.windowText]">No Image</h3>
          <p :class="['text-sm max-w-xs', themeClasses.windowTextMuted]">Open an image file to view it here.</p>
        </div>
      </div>

      <div v-else class="absolute inset-0 flex items-center justify-center" :style="{ cursor: isPanning ? 'grabbing' : 'grab' }">
        <img
          ref="imageRef"
          :src="imageSrc"
          :alt="fileName"
          class="max-w-none select-none"
          :style="{
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.15s ease-out',
          }"
          @load="onImageLoad"
          @error="onImageError"
          draggable="false"
        />
      </div>
    </div>

    <StatusBar :icon="fileImageIcon" :message="fileName || 'No image'" :info="imageType ? imageType.toUpperCase() : ''">
      <template v-if="isValidated" #extra>
        <div class="flex items-center gap-1 text-green-500 text-[10px]">
          <Icon :icon="shieldCheckIcon" class="w-3.5 h-3.5" />
          <span>Verified</span>
        </div>
      </template>
      <template #help>
        <div class="space-y-3 max-w-sm">
          <div class="flex items-center gap-2">
            <Icon :icon="imageIcon" :class="['w-5 h-5', themeClasses.statusBarIcon]" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">Image Viewer</h4>
          </div>
          <div :class="['text-[10px] md:text-xs space-y-2.5 leading-relaxed', themeClasses.statusBarInfo]">
            <p>A secure image viewer with magic bytes validation.</p>
            <div class="space-y-1.5">
              <div class="flex items-start gap-2">
                <Icon :icon="shieldCheckIcon" class="w-3.5 h-3.5 mt-0.5 text-green-500 flex-shrink-0" />
                <p><strong>Verified:</strong> Images are validated against their magic bytes to prevent spoofed files.</p>
              </div>
              <div class="flex items-start gap-2">
                <Icon :icon="magnifyPlusIcon" class="w-3.5 h-3.5 mt-0.5 text-blue-500 flex-shrink-0" />
                <p><strong>Zoom:</strong> Use +/- keys or mouse wheel to zoom. Press F to fit to window.</p>
              </div>
              <div class="flex items-start gap-2">
                <Icon :icon="aspectRatioIcon" class="w-3.5 h-3.5 mt-0.5 text-purple-500 flex-shrink-0" />
                <p><strong>Pan:</strong> Click and drag to pan around zoomed images.</p>
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

import { ref, onMounted, onUnmounted, watch } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useWindowStore } from "../__Stores__/windowStore";

import StatusBar from "../__Components__/StatusBar.vue";

import { Icon } from "@iconify/vue";
import imageIcon from "@iconify-icons/mdi/image-outline";
import magnifyPlusIcon from "@iconify-icons/mdi/magnify-plus-outline";
import magnifyMinusIcon from "@iconify-icons/mdi/magnify-minus-outline";
import fitToPageIcon from "@iconify-icons/mdi/fit-to-page-outline";
import aspectRatioIcon from "@iconify-icons/mdi/aspect-ratio";
import loadingIcon from "@iconify-icons/mdi/loading";
import alertIcon from "@iconify-icons/mdi/alert-circle-outline";
import fileImageIcon from "@iconify-icons/mdi/file-image-outline";
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

interface ImageFile {
  name: string;
  extension: string;
  buffer: ArrayBuffer;
}

const props = defineProps<{
  _windowId?: string;
  externalFile?: ExternalFile;
  imageFile?: ImageFile;
}>();

const containerRef = ref<HTMLElement | null>(null);
const imageRef = ref<HTMLImageElement | null>(null);
const imageSrc = ref<string | null>(null);
const fileName = ref("");
const originalWindowTitle = ref(props._windowId ? windowStore.getWindowById(props._windowId)?.title || "" : "");
const imageType = ref("");
const isLoading = ref(false);
const error = ref<string | null>(null);
const isValidated = ref(false);

const zoom = ref(1);
const fitMode = ref<"fit" | "actual" | "custom">("fit");
const panX = ref(0);
const panY = ref(0);
const isPanning = ref(false);
const panStartX = ref(0);
const panStartY = ref(0);
const lastPanX = ref(0);
const lastPanY = ref(0);

const isTouching = ref(false);
const initialPinchDistance = ref(0);
const initialPinchZoom = ref(1);
const touchStartX = ref(0);
const touchStartY = ref(0);
const lastTouchPanX = ref(0);
const lastTouchPanY = ref(0);

const imageInfo = ref<{ width: number; height: number; size: number } | null>(null);

function detectImageType(buffer: ArrayBuffer): string | null {
  const bytes = new Uint8Array(buffer);

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }

  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "png";
  }

  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return "gif";
  }

  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return "webp";
  }

  if (bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return "bmp";
  }

  if (bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01 && bytes[3] === 0x00) {
    return "ico";
  }

  if ((bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00) || (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a)) {
    return "tiff";
  }

  return null;
}

function getFileExtension(filename: string): string {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
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

const MIME_TYPES: Record<string, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  ico: "image/x-icon",
  tiff: "image/tiff",
};

function arrayBufferToDataUrl(buffer: ArrayBuffer, mimeType: string): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

async function loadImage(extFile: ExternalFile) {
  isLoading.value = true;
  error.value = null;
  isValidated.value = false;
  imageSrc.value = null;
  imageInfo.value = null;

  fileName.value = extFile.name;
  updateWindowTitle(extFile.name);
  const extension = getFileExtension(extFile.name);

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

    const detectedType = detectImageType(fileBuffer);

    if (!detectedType) {
      throw new Error("File does not appear to be a valid image. Magic bytes validation failed.");
    }

    const extensionMap: Record<string, string[]> = {
      jpeg: ["jpg", "jpeg"],
      png: ["png"],
      gif: ["gif"],
      webp: ["webp"],
      bmp: ["bmp"],
      ico: ["ico"],
      tiff: ["tif", "tiff"],
    };

    const validExtensions = extensionMap[detectedType] || [];
    if (!validExtensions.includes(extension)) {
      throw new Error(`File extension (.${extension}) does not match detected type (${detectedType.toUpperCase()}). Possible file manipulation detected.`);
    }

    const mimeType = MIME_TYPES[detectedType];
    imageSrc.value = arrayBufferToDataUrl(fileBuffer, mimeType);
    imageType.value = detectedType.toUpperCase();
    isValidated.value = true;
    imageInfo.value = { width: 0, height: 0, size: fileBuffer.byteLength };
  } catch (err: any) {
    console.error("Failed to load image:", err);
    error.value = err.message || "Failed to load image";
  } finally {
    isLoading.value = false;
  }
}

function loadFromBuffer(imgFile: ImageFile) {
  isLoading.value = true;
  error.value = null;
  isValidated.value = false;
  imageSrc.value = null;
  imageInfo.value = null;

  fileName.value = imgFile.name;
  updateWindowTitle(imgFile.name);
  const extension = imgFile.extension.toLowerCase();

  try {
    const fileBuffer = imgFile.buffer;

    const detectedType = detectImageType(fileBuffer);

    if (!detectedType) {
      throw new Error("File does not appear to be a valid image. Magic bytes validation failed.");
    }

    const extensionMap: Record<string, string[]> = {
      jpeg: ["jpg", "jpeg"],
      png: ["png"],
      gif: ["gif"],
      webp: ["webp"],
      bmp: ["bmp"],
      ico: ["ico"],
      tiff: ["tif", "tiff"],
    };

    const validExtensions = extensionMap[detectedType] || [];
    if (!validExtensions.includes(extension)) {
      throw new Error(`File extension (.${extension}) does not match detected type (${detectedType.toUpperCase()}). Possible file manipulation detected.`);
    }

    const mimeType = MIME_TYPES[detectedType];
    imageSrc.value = arrayBufferToDataUrl(fileBuffer, mimeType);
    imageType.value = detectedType.toUpperCase();
    isValidated.value = true;
    imageInfo.value = { width: 0, height: 0, size: fileBuffer.byteLength };
  } catch (err: any) {
    console.error("Failed to load image:", err);
    error.value = err.message || "Failed to load image";
  } finally {
    isLoading.value = false;
  }
}

function onImageLoad() {
  if (imageRef.value && imageInfo.value) {
    imageInfo.value.width = imageRef.value.naturalWidth;
    imageInfo.value.height = imageRef.value.naturalHeight;
  }
  fitToWindow();
}

function onImageError() {
  error.value = "Failed to decode image";
  imageSrc.value = null;
}

function zoomIn() {
  zoom.value = Math.min(5, zoom.value * 1.25);
  fitMode.value = "custom";
}

function zoomOut() {
  zoom.value = Math.max(0.1, zoom.value / 1.25);
  fitMode.value = "custom";
}

function fitToWindow() {
  if (!containerRef.value || !imageRef.value) return;

  const container = containerRef.value.getBoundingClientRect();
  const imgWidth = imageRef.value.naturalWidth;
  const imgHeight = imageRef.value.naturalHeight;

  if (imgWidth === 0 || imgHeight === 0) return;

  const scaleX = (container.width - 40) / imgWidth;
  const scaleY = (container.height - 40) / imgHeight;

  zoom.value = Math.min(1, Math.min(scaleX, scaleY));
  fitMode.value = "fit";
  panX.value = 0;
  panY.value = 0;
}

function actualSize() {
  zoom.value = 1;
  fitMode.value = "actual";
  panX.value = 0;
  panY.value = 0;
}

function handleWheel(e: WheelEvent) {
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  const newZoom = Math.max(0.1, Math.min(5, zoom.value * delta));
  zoom.value = newZoom;
  fitMode.value = "custom";
}

function startPan(e: MouseEvent) {
  if (e.button !== 0) return;
  isPanning.value = true;
  panStartX.value = e.clientX;
  panStartY.value = e.clientY;
  lastPanX.value = panX.value;
  lastPanY.value = panY.value;

  document.addEventListener("mouseup", handleGlobalMouseUp);
  document.addEventListener("mousemove", handleGlobalMouseMove);
}

function handleGlobalMouseUp() {
  endPan();
  document.removeEventListener("mouseup", handleGlobalMouseUp);
  document.removeEventListener("mousemove", handleGlobalMouseMove);
}

function handleGlobalMouseMove(e: MouseEvent) {
  if (!isPanning.value) return;

  const dx = e.clientX - panStartX.value;
  const dy = e.clientY - panStartY.value;

  panX.value = lastPanX.value + dx;
  panY.value = lastPanY.value + dy;
}

function endPan() {
  isPanning.value = false;
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
  } else if (e.touches.length === 1) {
    isTouching.value = true;
    touchStartX.value = e.touches[0].clientX;
    touchStartY.value = e.touches[0].clientY;
    lastTouchPanX.value = panX.value;
    lastTouchPanY.value = panY.value;
  }
}

function handleTouchMove(e: TouchEvent) {
  if (!isTouching.value) return;

  if (e.touches.length === 2) {
    e.preventDefault();
    const currentDistance = getTouchDistance(e.touches);
    if (initialPinchDistance.value > 0) {
      const scale = currentDistance / initialPinchDistance.value;
      const newZoom = Math.max(0.1, Math.min(5, initialPinchZoom.value * scale));
      zoom.value = newZoom;
      fitMode.value = "custom";
    }
  } else if (e.touches.length === 1) {
    e.preventDefault();
    const dx = e.touches[0].clientX - touchStartX.value;
    const dy = e.touches[0].clientY - touchStartY.value;
    panX.value = lastTouchPanX.value + dx;
    panY.value = lastTouchPanY.value + dy;
  }
}

function handleTouchEnd(e: TouchEvent) {
  if (e.touches.length === 0) {
    isTouching.value = false;
    initialPinchDistance.value = 0;
  } else if (e.touches.length === 1) {
    touchStartX.value = e.touches[0].clientX;
    touchStartY.value = e.touches[0].clientY;
    lastTouchPanX.value = panX.value;
    lastTouchPanY.value = panY.value;
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "+" || e.key === "=") {
    e.preventDefault();
    zoomIn();
  } else if (e.key === "-") {
    e.preventDefault();
    zoomOut();
  } else if (e.key === "0") {
    e.preventDefault();
    actualSize();
  } else if (e.key === "f" || e.key === "F") {
    e.preventDefault();
    fitToWindow();
  }
}

function cleanup() {
  imageSrc.value = null;
}

watch(
  () => props.externalFile,
  (extFile) => {
    if (extFile) {
      cleanup();
      loadImage(extFile);
    }
  },
  { immediate: true }
);

watch(
  () => props.imageFile,
  (imgFile) => {
    if (imgFile) {
      cleanup();
      loadFromBuffer(imgFile);
    }
  },
  { immediate: true }
);

function handleIncomingFile(event: CustomEvent) {
  const data = event.detail;
  if (data?.imageFile) {
    cleanup();
    loadFromBuffer(data.imageFile);
  } else if (data?.externalFile) {
    cleanup();
    loadImage(data.externalFile);
  }
}

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);

  if (props._windowId) {
    window.addEventListener(`homedock:open-file-${props._windowId}`, handleIncomingFile as EventListener);
  }
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
  document.removeEventListener("mouseup", handleGlobalMouseUp);
  document.removeEventListener("mousemove", handleGlobalMouseMove);

  if (props._windowId) {
    window.removeEventListener(`homedock:open-file-${props._windowId}`, handleIncomingFile as EventListener);
  }

  cleanup();
});
</script>

<style scoped>
.image-viewer {
  user-select: none;
  touch-action: none;
}
</style>
