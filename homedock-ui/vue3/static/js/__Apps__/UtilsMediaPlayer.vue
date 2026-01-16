<!-- homedock-ui/vue3/static/js/__Apps__/UtilsMediaPlayer.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="media-player flex flex-col h-full overflow-hidden">
    <div class="toolbar flex items-center gap-2 px-3 py-2 border-b flex-shrink-0" :class="themeClasses.utilityToolbarBorder">
      <button @click="toggleMute" :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="p-1.5 rounded transition-colors" :title="isMuted ? 'Unmute' : 'Mute'">
        <Icon :icon="volumeIcon" class="w-4 h-4" />
      </button>
      <input type="range" v-model.number="volume" min="0" max="100" class="volume-slider h-1.5 rounded-lg appearance-none cursor-pointer accent-blue-500" :class="themeClasses.sliderBg" @input="onVolumeChange" />
      <span :class="['text-xs min-w-[32px] text-center', themeClasses.windowTextMuted]">{{ volume }}%</span>

      <div class="w-px h-4 mx-1 flex-shrink-0" :class="themeClasses.utilityDivider"></div>

      <button @click="cyclePlaybackSpeed" :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="px-2 py-1 rounded transition-colors text-xs font-medium" title="Playback Speed">{{ playbackSpeed }}x</button>

      <div class="flex-1"></div>

      <div v-if="mediaInfo" :class="['text-xs opacity-60', themeClasses.windowText]">
        <span v-if="isVideo">{{ mediaInfo.width }} × {{ mediaInfo.height }} · </span>
        {{ formatFileSize(mediaInfo.size) }}
      </div>
    </div>

    <div ref="containerRef" class="flex-1 overflow-hidden relative flex items-center justify-center">
      <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center">
        <div class="flex flex-col items-center gap-3">
          <Icon :icon="loadingIcon" class="w-8 h-8 animate-spin" :class="themeClasses.windowTextMuted" />
          <span :class="['text-sm', themeClasses.windowTextMuted]">Loading media...</span>
        </div>
      </div>

      <div v-else-if="error" class="absolute inset-0 flex items-center justify-center">
        <div class="flex flex-col items-center gap-3 text-center p-8">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center bg-red-500/10">
            <Icon :icon="alertIcon" class="w-8 h-8 text-red-500" />
          </div>
          <h3 :class="['text-lg font-medium', themeClasses.windowText]">Cannot Play Media</h3>
          <p :class="['text-sm max-w-xs', themeClasses.windowTextMuted]">{{ error }}</p>
        </div>
      </div>

      <div v-else-if="!mediaSrc" class="absolute inset-0 flex items-center justify-center">
        <div class="flex flex-col items-center gap-3 text-center p-8">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center" :class="themeClasses.imageViewerBg">
            <Icon :icon="movieIcon" class="w-8 h-8" :class="themeClasses.windowTextMuted" />
          </div>
          <h3 :class="['text-lg font-medium', themeClasses.windowText]">No Media</h3>
          <p :class="['text-sm max-w-xs', themeClasses.windowTextMuted]">Open a video or audio file to play it here.</p>
        </div>
      </div>

      <video v-else-if="isVideo" ref="mediaRef" :src="mediaSrc" class="max-w-full max-h-full" @loadedmetadata="onMediaLoaded" @timeupdate="onTimeUpdate" @ended="onMediaEnded" @error="onMediaError" @play="isPlaying = true" @pause="isPlaying = false" playsinline />

      <div v-else-if="isAudio" class="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8 overflow-hidden">
        <div class="w-32 h-32 rounded-2xl flex items-center justify-center flex-shrink-0" :class="themeClasses.imageViewerBg">
          <Icon :icon="isPlaying ? musicNoteIcon : musicIcon" :class="['w-16 h-16', themeClasses.windowTextMuted, isPlaying ? 'animate-pulse' : '']" />
        </div>
        <div class="text-center max-w-full px-4">
          <h3 :class="['text-lg font-medium truncate max-w-xs', themeClasses.windowText]" :title="fileName">{{ fileName }}</h3>
          <p :class="['text-sm mt-1', themeClasses.windowTextMuted]">{{ mediaType.toUpperCase() }}</p>
        </div>
        <canvas ref="canvasRef" class="absolute inset-0 w-full h-full p-1 pointer-events-none -z-10" />
        <audio ref="mediaRef" :src="mediaSrc" @loadedmetadata="onMediaLoaded" @timeupdate="onTimeUpdate" @ended="onMediaEnded" @error="onMediaError" @play="onAudioPlay" @pause="onAudioPause" />
      </div>

      <div v-if="mediaSrc && isVideo" class="absolute inset-0 flex items-center justify-center cursor-pointer" @click="togglePlay" @dblclick="!isMobile && toggleFullscreen()">
        <Transition name="fade">
          <div v-if="showPlayOverlay" class="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <Icon :icon="isPlaying ? pauseIcon : playIcon" class="w-10 h-10 text-white" />
          </div>
        </Transition>
      </div>
    </div>

    <div v-if="mediaSrc" class="controls px-3 py-2 border-t flex flex-col gap-2" :class="themeClasses.utilityToolbarBorder">
      <div class="flex items-center gap-2">
        <span :class="['text-xs min-w-[40px]', themeClasses.windowTextMuted]">{{ formatTime(currentTime) }}</span>
        <input type="range" v-model.number="seekValue" min="0" :max="duration" step="0.1" class="seek-slider flex-1 h-1.5 rounded-lg appearance-none cursor-pointer accent-blue-500" :class="themeClasses.sliderBg" @input="onSeek" />
        <span :class="['text-xs min-w-[40px] text-right', themeClasses.windowTextMuted]">{{ formatTime(duration) }}</span>
      </div>

      <div class="flex items-center justify-center gap-2">
        <button @click="skipBackward" :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="p-2 rounded-full transition-colors" title="Back 10s">
          <Icon :icon="rewindIcon" class="w-5 h-5" />
        </button>
        <button @click="togglePlay" :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="p-3 rounded-full transition-colors bg-blue-500/20 hover:bg-blue-500/30" :title="isPlaying ? 'Pause' : 'Play'">
          <Icon :icon="isPlaying ? pauseIcon : playIcon" class="w-6 h-6" />
        </button>
        <button @click="skipForward" :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="p-2 rounded-full transition-colors" title="Forward 10s">
          <Icon :icon="fastForwardIcon" class="w-5 h-5" />
        </button>

        <div v-if="isVideo && !isMobile" class="w-px h-6 mx-2 flex-shrink-0" :class="themeClasses.utilityDivider"></div>

        <button v-if="isVideo && !isMobile" @click="toggleFullscreen" :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="p-2 rounded-full transition-colors" title="Fullscreen">
          <Icon :icon="fullscreenIcon" class="w-5 h-5" />
        </button>
      </div>
    </div>

    <StatusBar :icon="isVideo ? movieIcon : musicIcon" :message="fileName || 'No media'" :info="mediaType ? mediaType.toUpperCase() : ''">
      <template v-if="isValidated" #extra>
        <div class="flex items-center gap-1 text-green-500 text-[10px]">
          <Icon :icon="shieldCheckIcon" class="w-3.5 h-3.5" />
          <span>Verified</span>
        </div>
      </template>
      <template #help>
        <div class="space-y-3 max-w-sm">
          <div class="flex items-center gap-2">
            <Icon :icon="movieIcon" :class="['w-5 h-5', themeClasses.statusBarIcon]" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">Media Player</h4>
          </div>
          <div :class="['text-[10px] md:text-xs space-y-2.5 leading-relaxed', themeClasses.statusBarInfo]">
            <p>Play video and audio files with magic bytes validation.</p>
            <div class="space-y-1.5">
              <div class="flex items-start gap-2">
                <Icon :icon="movieIcon" class="w-3.5 h-3.5 mt-0.5 text-blue-500 flex-shrink-0" />
                <p><strong>Video:</strong> Supports MP4, WebM, and Ogg video formats.</p>
              </div>
              <div class="flex items-start gap-2">
                <Icon :icon="musicIcon" class="w-3.5 h-3.5 mt-0.5 text-purple-500 flex-shrink-0" />
                <p><strong>Audio:</strong> Supports MP3, WAV, AAC, and Ogg audio formats.</p>
              </div>
              <div class="flex items-start gap-2">
                <Icon :icon="shieldCheckIcon" class="w-3.5 h-3.5 mt-0.5 text-green-500 flex-shrink-0" />
                <p><strong>Verified:</strong> Files are validated against their magic bytes.</p>
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

import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useResponsive } from "../__Composables__/useResponsive";
import { useWindowStore } from "../__Stores__/windowStore";
import { useMediaPlaybackStore } from "../__Stores__/useMediaPlaybackStore";

import StatusBar from "../__Components__/StatusBar.vue";

import { Icon } from "@iconify/vue";
import movieIcon from "@iconify-icons/mdi/movie-outline";
import musicIcon from "@iconify-icons/mdi/music";
import musicNoteIcon from "@iconify-icons/mdi/music-note";
import playIcon from "@iconify-icons/mdi/play";
import pauseIcon from "@iconify-icons/mdi/pause";
import rewindIcon from "@iconify-icons/mdi/rewind-10";
import fastForwardIcon from "@iconify-icons/mdi/fast-forward-10";
import volumeHighIcon from "@iconify-icons/mdi/volume-high";
import volumeMediumIcon from "@iconify-icons/mdi/volume-medium";
import volumeLowIcon from "@iconify-icons/mdi/volume-low";
import volumeOffIcon from "@iconify-icons/mdi/volume-off";
import fullscreenIcon from "@iconify-icons/mdi/fullscreen";
import loadingIcon from "@iconify-icons/mdi/loading";
import alertIcon from "@iconify-icons/mdi/alert-circle-outline";
import shieldCheckIcon from "@iconify-icons/mdi/shield-check-outline";

const { themeClasses } = useTheme();
const csrfToken = useCsrfToken();
const { isMobile } = useResponsive();
const windowStore = useWindowStore();
const mediaPlaybackStore = useMediaPlaybackStore();

interface ExternalFile {
  source: "storage" | "dropzone" | "appdrive";
  path: string;
  name: string;
  container?: string;
}

interface MediaFile {
  name: string;
  extension: string;
  buffer: ArrayBuffer;
}

const props = defineProps<{
  _windowId?: string;
  externalFile?: ExternalFile;
  mediaFile?: MediaFile;
}>();

const containerRef = ref<HTMLElement | null>(null);
const mediaRef = ref<HTMLVideoElement | HTMLAudioElement | null>(null);
const mediaSrc = ref<string | null>(null);
const fileName = ref("");
const originalWindowTitle = ref(props._windowId ? windowStore.getWindowById(props._windowId)?.title || "" : "");
const mediaType = ref("");
const isLoading = ref(false);
const error = ref<string | null>(null);
const isValidated = ref(false);

const isPlaying = ref(false);
const isMuted = ref(false);
const volume = ref(80);
const currentTime = ref(0);
const duration = ref(0);
const seekValue = ref(0);
const playbackSpeed = ref(1);
const showPlayOverlay = ref(false);

const mediaInfo = ref<{ width?: number; height?: number; size: number } | null>(null);

const canvasRef = ref<HTMLCanvasElement | null>(null);
const audioContext = ref<AudioContext | null>(null);
const analyser = ref<AnalyserNode | null>(null);
const audioSource = ref<MediaElementAudioSourceNode | null>(null);
const animationId = ref<number | null>(null);
const isAudioContextInitialized = ref(false);
const connectedMediaElement = ref<HTMLAudioElement | null>(null);

const isVideo = computed(() => ["mp4", "webm", "ogv", "ogg"].includes(mediaType.value.toLowerCase()) && mediaType.value.toLowerCase() !== "oga");
const isAudio = computed(() => ["mp3", "wav", "aac", "oga", "ogg", "flac"].includes(mediaType.value.toLowerCase()) && !isVideo.value);
const volumeIcon = computed(() => {
  if (isMuted.value) return volumeOffIcon;
  if (volume.value === 0) return volumeLowIcon;
  if (volume.value < 50) return volumeMediumIcon;
  return volumeHighIcon;
});

function registerInPlaybackStore() {
  if (props._windowId && mediaSrc.value && fileName.value) {
    mediaPlaybackStore.registerPlayer(props._windowId, {
      fileName: fileName.value,
      isPlaying: isPlaying.value,
      isVideo: isVideo.value,
      volume: volume.value,
      isMuted: isMuted.value,
      currentTime: currentTime.value,
      duration: duration.value,
    });
  }
}

function updatePlaybackStore() {
  if (props._windowId && mediaSrc.value) {
    mediaPlaybackStore.updatePlayer(props._windowId, {
      fileName: fileName.value,
      isPlaying: isPlaying.value,
      isVideo: isVideo.value,
      volume: volume.value,
      isMuted: isMuted.value,
      currentTime: currentTime.value,
      duration: duration.value,
    });
  }
}

function unregisterFromPlaybackStore() {
  if (props._windowId) {
    mediaPlaybackStore.unregisterPlayer(props._windowId);
  }
}

function handleMediaControl(event: CustomEvent) {
  const { action, value } = event.detail;
  switch (action) {
    case "togglePlay":
      togglePlay();
      break;
    case "setVolume":
      volume.value = value;
      onVolumeChange();
      break;
    case "setMuted":
      isMuted.value = value;
      if (mediaRef.value) {
        mediaRef.value.muted = value;
      }
      updatePlaybackStore();
      break;
  }
}

const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

const MIME_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  ogv: "video/ogg",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  aac: "audio/aac",
  oga: "audio/ogg",
  ogg: "audio/ogg",
  flac: "audio/flac",
};

function detectMediaType(buffer: ArrayBuffer): { type: string; isVideo: boolean } | null {
  const bytes = new Uint8Array(buffer);

  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (brand === "M4A " || brand === "M4B ") {
      return { type: "m4a", isVideo: false };
    }
    return { type: "mp4", isVideo: true };
  }

  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return { type: "webm", isVideo: true };
  }

  if (bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
    if (bytes[28] === 0x80 && bytes[29] === 0x74 && bytes[30] === 0x68 && bytes[31] === 0x65) {
      return { type: "ogv", isVideo: true };
    }
    return { type: "ogg", isVideo: false };
  }

  if ((bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)) {
    return { type: "mp3", isVideo: false };
  }

  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x41 && bytes[10] === 0x56 && bytes[11] === 0x45) {
    return { type: "wav", isVideo: false };
  }

  if (bytes[0] === 0x66 && bytes[1] === 0x4c && bytes[2] === 0x61 && bytes[3] === 0x43) {
    return { type: "flac", isVideo: false };
  }

  if (bytes[0] === 0xff && (bytes[1] & 0xf0) === 0xf0) {
    return { type: "aac", isVideo: false };
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
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function updateWindowTitle(name: string) {
  if (props._windowId && name && originalWindowTitle.value) {
    windowStore.updateWindowTitle(props._windowId, `${originalWindowTitle.value} - ${name}`);
  }
}

function arrayBufferToBlobUrl(buffer: ArrayBuffer, mimeType: string): string {
  const blob = new Blob([buffer], { type: mimeType });
  return URL.createObjectURL(blob);
}

function revokeBlobUrl() {
  if (mediaSrc.value && mediaSrc.value.startsWith("blob:")) {
    URL.revokeObjectURL(mediaSrc.value);
  }
}

function resetMediaElement() {
  if (mediaRef.value) {
    mediaRef.value.pause();
    mediaRef.value.removeAttribute("src");
    mediaRef.value.load();
  }
  revokeBlobUrl();
  mediaSrc.value = null;
  isPlaying.value = false;
  currentTime.value = 0;
  duration.value = 0;
  seekValue.value = 0;
  showPlayOverlay.value = true;
}

async function loadMedia(extFile: ExternalFile) {
  resetMediaElement();

  isLoading.value = true;
  error.value = null;
  isValidated.value = false;
  mediaInfo.value = null;

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

    const detected = detectMediaType(fileBuffer);

    if (!detected) {
      throw new Error("File does not appear to be a valid media file. Magic bytes validation failed.");
    }

    const mimeType = MIME_TYPES[detected.type] || MIME_TYPES[extension];
    if (!mimeType) {
      throw new Error(`Unsupported media format: ${extension}`);
    }

    mediaSrc.value = arrayBufferToBlobUrl(fileBuffer, mimeType);
    mediaType.value = detected.type;
    isValidated.value = true;
    mediaInfo.value = { size: fileBuffer.byteLength };
  } catch (err: any) {
    console.error("Failed to load media:", err);
    error.value = err.message || "Failed to load media";
  } finally {
    isLoading.value = false;
  }
}

function loadFromBuffer(file: MediaFile) {
  resetMediaElement();

  isLoading.value = true;
  error.value = null;
  isValidated.value = false;
  mediaInfo.value = null;

  fileName.value = file.name;
  updateWindowTitle(file.name);
  const extension = file.extension.toLowerCase();

  try {
    const fileBuffer = file.buffer;

    const detected = detectMediaType(fileBuffer);

    if (!detected) {
      throw new Error("File does not appear to be a valid media file. Magic bytes validation failed.");
    }

    const mimeType = MIME_TYPES[detected.type] || MIME_TYPES[extension];
    if (!mimeType) {
      throw new Error(`Unsupported media format: ${extension}`);
    }

    mediaSrc.value = arrayBufferToBlobUrl(fileBuffer, mimeType);
    mediaType.value = detected.type;
    isValidated.value = true;
    mediaInfo.value = { size: fileBuffer.byteLength };
  } catch (err: any) {
    console.error("Failed to load media:", err);
    error.value = err.message || "Failed to load media";
  } finally {
    isLoading.value = false;
  }
}

function onMediaLoaded() {
  if (mediaRef.value) {
    duration.value = mediaRef.value.duration;
    mediaRef.value.volume = volume.value / 100;
    mediaRef.value.playbackRate = playbackSpeed.value;

    if (isVideo.value && mediaRef.value instanceof HTMLVideoElement) {
      mediaInfo.value = {
        ...mediaInfo.value!,
        width: mediaRef.value.videoWidth,
        height: mediaRef.value.videoHeight,
      };
    }

    registerInPlaybackStore();

    mediaRef.value
      .play()
      .then(() => {
        isPlaying.value = true;
        showPlayOverlay.value = false;
        updatePlaybackStore();
      })
      .catch(() => {
        isPlaying.value = false;
        showPlayOverlay.value = true;
        updatePlaybackStore();
      });
  }
}

function onTimeUpdate() {
  if (mediaRef.value) {
    currentTime.value = mediaRef.value.currentTime;
    seekValue.value = mediaRef.value.currentTime;
    if (props._windowId && Math.floor(currentTime.value) % 2 === 0) {
      mediaPlaybackStore.updatePlayer(props._windowId, {
        currentTime: currentTime.value,
        duration: duration.value,
      });
    }
  }
}

function onMediaEnded() {
  isPlaying.value = false;
  showPlayOverlay.value = true;
  stopVisualization();
  updatePlaybackStore();
}

function initAudioContext() {
  if (!mediaRef.value || !isAudio.value) return;

  if (connectedMediaElement.value === mediaRef.value) {
    if (audioContext.value && audioSource.value && analyser.value) {
      if (audioContext.value.state === "suspended") {
        audioContext.value.resume();
      }
      isAudioContextInitialized.value = true;
    }
    return;
  }

  if (audioContext.value && audioContext.value.state !== "closed") {
    audioContext.value.close().catch(() => {});
  }

  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContext.value = ctx;

    const source = ctx.createMediaElementSource(mediaRef.value as HTMLAudioElement);
    audioSource.value = source;
    connectedMediaElement.value = mediaRef.value as HTMLAudioElement;

    const analyserNode = ctx.createAnalyser();
    analyserNode.fftSize = 512;
    analyserNode.smoothingTimeConstant = 0.8;
    analyser.value = analyserNode;

    source.connect(analyserNode);
    analyserNode.connect(ctx.destination);

    isAudioContextInitialized.value = true;
  } catch (err) {
    console.warn("Failed to initialize audio context:", err);
  }
}

function startVisualization() {
  if (!analyser.value || !canvasRef.value || !audioContext.value) return;

  const canvas = canvasRef.value;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const bufferLength = analyser.value.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const sampleRate = audioContext.value.sampleRate;
  const maxFreq = 23350;
  const usableBins = Math.floor((maxFreq / (sampleRate / 2)) * bufferLength);

  function draw() {
    if (!analyser.value || !canvasRef.value || !ctx || !isPlaying.value) {
      animationId.value = null;
      return;
    }

    animationId.value = requestAnimationFrame(draw);

    const parent = canvasRef.value.parentElement;
    if (!parent) return;

    const width = parent.clientWidth;
    const height = parent.clientHeight;

    if (canvasRef.value.width !== width || canvasRef.value.height !== height) {
      canvasRef.value.width = width;
      canvasRef.value.height = height;
    }

    analyser.value.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, width, height);

    const barCount = 64;
    const totalGap = barCount - 1;
    const gap = 1;
    const barWidth = (width - totalGap * gap) / barCount;
    const step = Math.floor(usableBins / barCount);

    for (let i = 0; i < barCount; i++) {
      const dataIndex = i * step;
      const value = dataArray[dataIndex];
      const barHeight = Math.max(2, (value / 255) * height);

      const hue = 200 + (i / barCount) * 60;
      ctx.fillStyle = `hsla(${hue}, 80%, 55%, 0.8)`;

      const x = i * (barWidth + gap);
      const y = height - barHeight;

      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 8);
      ctx.fill();
    }
  }

  draw();
}

function stopVisualization() {
  if (animationId.value) {
    cancelAnimationFrame(animationId.value);
    animationId.value = null;
  }

  if (canvasRef.value) {
    const ctx = canvasRef.value.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
    }
  }
}

async function onAudioPlay() {
  isPlaying.value = true;
  if (!isAudioContextInitialized.value) {
    initAudioContext();
  }
  if (audioContext.value?.state === "suspended") {
    audioContext.value.resume();
  }
  await nextTick();
  requestAnimationFrame(() => {
    startVisualization();
  });
  updatePlaybackStore();
}

function onAudioPause() {
  isPlaying.value = false;
  stopVisualization();
  updatePlaybackStore();
}

function cleanupAudioContext(forceClose = false) {
  stopVisualization();

  if (forceClose) {
    if (audioContext.value && audioContext.value.state !== "closed") {
      audioContext.value.close().catch(() => {});
    }
    audioContext.value = null;
    analyser.value = null;
    audioSource.value = null;
    connectedMediaElement.value = null;
  }

  isAudioContextInitialized.value = false;
}

function onMediaError() {
  error.value = "Failed to decode media file. Format may not be supported by your browser.";
  mediaSrc.value = null;
}

function togglePlay() {
  if (!mediaRef.value) return;

  if (isPlaying.value) {
    mediaRef.value.pause();
    isPlaying.value = false;
  } else {
    mediaRef.value.play();
    isPlaying.value = true;
  }

  updatePlaybackStore();
  showPlayOverlay.value = true;
  setTimeout(() => {
    showPlayOverlay.value = false;
  }, 500);
}

function toggleMute() {
  if (!mediaRef.value) return;
  isMuted.value = !isMuted.value;
  mediaRef.value.muted = isMuted.value;
  updatePlaybackStore();
}

function onVolumeChange() {
  if (!mediaRef.value) return;
  mediaRef.value.volume = volume.value / 100;
  if (volume.value > 0) {
    isMuted.value = false;
    mediaRef.value.muted = false;
  }
  updatePlaybackStore();
}

function onSeek() {
  if (!mediaRef.value) return;
  mediaRef.value.currentTime = seekValue.value;
}

function skipForward() {
  if (!mediaRef.value) return;
  mediaRef.value.currentTime = Math.min(duration.value, mediaRef.value.currentTime + 10);
}

function skipBackward() {
  if (!mediaRef.value) return;
  mediaRef.value.currentTime = Math.max(0, mediaRef.value.currentTime - 10);
}

function cyclePlaybackSpeed() {
  const currentIndex = speeds.indexOf(playbackSpeed.value);
  const nextIndex = (currentIndex + 1) % speeds.length;
  playbackSpeed.value = speeds[nextIndex];
  if (mediaRef.value) {
    mediaRef.value.playbackRate = playbackSpeed.value;
  }
}

function toggleFullscreen() {
  if (!mediaRef.value || !(mediaRef.value instanceof HTMLVideoElement)) return;

  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    mediaRef.value.requestFullscreen();
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (!mediaSrc.value) return;

  if (props._windowId && windowStore.activeWindowId !== props._windowId) return;

  const target = e.target as HTMLElement;
  if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

  switch (e.key) {
    case " ":
    case "k":
      e.preventDefault();
      togglePlay();
      break;
    case "ArrowLeft":
      e.preventDefault();
      skipBackward();
      break;
    case "ArrowRight":
      e.preventDefault();
      skipForward();
      break;
    case "ArrowUp":
      e.preventDefault();
      volume.value = Math.min(100, volume.value + 5);
      onVolumeChange();
      break;
    case "ArrowDown":
      e.preventDefault();
      volume.value = Math.max(0, volume.value - 5);
      onVolumeChange();
      break;
    case "m":
      e.preventDefault();
      toggleMute();
      break;
    case "f":
      e.preventDefault();
      if (isVideo.value && !isMobile.value) toggleFullscreen();
      break;
  }
}

function cleanup(forceCloseAudio = false) {
  cleanupAudioContext(forceCloseAudio);
  if (mediaRef.value) {
    mediaRef.value.pause();
    mediaRef.value.src = "";
  }
  revokeBlobUrl();
  mediaSrc.value = null;
  isPlaying.value = false;
  currentTime.value = 0;
  duration.value = 0;
  unregisterFromPlaybackStore();
}

watch(
  () => props.externalFile,
  (extFile) => {
    if (extFile) {
      cleanup();
      loadMedia(extFile);
    }
  },
  { immediate: true }
);

watch(
  () => props.mediaFile,
  (file) => {
    if (file) {
      cleanup();
      loadFromBuffer(file);
    }
  },
  { immediate: true }
);

function handleIncomingFile(event: CustomEvent) {
  const data = event.detail;
  if (data?.mediaFile) {
    cleanup();
    loadFromBuffer(data.mediaFile);
  } else if (data?.externalFile) {
    cleanup();
    loadMedia(data.externalFile);
  }
}

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);

  if (props._windowId) {
    window.addEventListener(`homedock:open-file-${props._windowId}`, handleIncomingFile as EventListener);
    window.addEventListener(`homedock:media-control-${props._windowId}`, handleMediaControl as EventListener);
  }
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);

  if (props._windowId) {
    window.removeEventListener(`homedock:open-file-${props._windowId}`, handleIncomingFile as EventListener);
    window.removeEventListener(`homedock:media-control-${props._windowId}`, handleMediaControl as EventListener);
  }

  cleanup(true);
});
</script>

<style scoped>
.media-player {
  user-select: none;
}

.volume-slider {
  width: 80px;
}

.seek-slider,
.volume-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 3px;
}

.seek-slider::-webkit-slider-thumb,
.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
}

.seek-slider::-moz-range-thumb,
.volume-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
