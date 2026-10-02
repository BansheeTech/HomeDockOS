<!-- homedock-ui/vue3/static/js/__Apps__/UtilsMediaPlayer.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="media-player flex flex-col h-full overflow-hidden">
    <div class="toolbar flex items-center gap-2 px-3 py-2 border-b flex-shrink-0" :class="themeClasses.utilityToolbarBorder">
      <button @click="toggleMute" :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="p-1.5 rounded transition-colors" :title="isMuted ? $t('Unmute') : $t('Mute')">
        <Icon :icon="volumeIcon" class="w-4 h-4" />
      </button>
      <input type="range" v-model.number="volume" min="0" max="100" class="volume-slider h-1.5 rounded-lg appearance-none cursor-pointer accent-blue-500" :class="themeClasses.sliderBg" @input="onVolumeChange" />
      <span :class="['text-xs min-w-[32px] text-center', themeClasses.windowTextMuted]">{{ volume }}%</span>

      <div class="w-px h-4 mx-1 flex-shrink-0" :class="themeClasses.utilityDivider"></div>

      <button @click="cyclePlaybackSpeed" :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="px-2 py-1 rounded transition-colors text-xs font-medium" :title="$t('Playback Speed')">{{ playbackSpeed }}x</button>
      <button v-if="isAudio" @click="toggleVisualizer" :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="px-2 py-1 rounded transition-colors text-xs font-medium">{{ visualizer === "terrain" ? "3D" : "2D" }}</button>

      <div class="flex-1"></div>

      <Transition name="drop-fade">
        <button v-if="droppedFile" type="button" :disabled="saveState !== 'idle'" :title="isVideo ? $t('Save to Videos') : $t('Save to Music')" :aria-label="isVideo ? $t('Save to Videos') : $t('Save to Music')" :class="saveState === 'saved' ? themeClasses.storeCardInstalledPill : themeClasses.storeCardGetPill" class="drop-save-button flex items-center justify-center gap-1.5 h-7 px-3.5 rounded-full border-0 text-xs font-semibold cursor-pointer flex-shrink-0 transition-colors duration-150 disabled:cursor-default" @click="saveDroppedMedia">
          <Icon :icon="saveState === 'saving' ? loadingIcon : saveState === 'saved' ? checkIcon : saveIcon" :class="saveState === 'saving' ? 'animate-spin' : ''" class="w-3.5 h-3.5 flex-shrink-0" />
          <span class="drop-save-label">{{ saveState === "saved" ? $t("Saved") : isVideo ? $t("Save to Videos") : $t("Save to Music") }}</span>
        </button>
      </Transition>

      <div v-if="mediaInfo" :class="['media-meta text-xs opacity-60 tabular-nums', themeClasses.windowText]">
        <template v-if="isVideo">
          <span>{{ mediaInfo.width }} × {{ mediaInfo.height }}</span>
          <span class="media-meta-separator"> · </span>
        </template>
        <span>{{ formatFileSize(mediaInfo.size) }}</span>
      </div>
    </div>

    <div ref="containerRef" class="flex-1 overflow-hidden relative flex items-center justify-center" @dragenter.prevent.stop="onDragEnter" @dragover.prevent.stop="onDragOver" @dragleave.stop="onDragLeave" @drop.prevent.stop="onDrop">
      <Transition name="drop-fade">
        <div v-if="isDragOver" class="absolute inset-3 z-20 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-blue-500 bg-blue-500/10 pointer-events-none">
          <Icon :icon="movieIcon" class="w-10 h-10 text-blue-500" />
          <span class="text-sm font-semibold text-blue-500">{{ $t("Drop to open") }}</span>
        </div>
      </Transition>

      <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center">
        <div class="flex flex-col items-center gap-3">
          <Icon :icon="loadingIcon" class="w-8 h-8 animate-spin" :class="themeClasses.windowTextMuted" />
          <span :class="['text-sm', themeClasses.windowTextMuted]">{{ $t("Loading media...") }}</span>
        </div>
      </div>

      <div v-else-if="error" class="absolute inset-0 flex items-center justify-center">
        <div class="flex flex-col items-center gap-3 text-center p-8">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center bg-red-500/10">
            <Icon :icon="alertIcon" class="w-8 h-8 text-red-500" />
          </div>
          <h3 :class="['text-lg font-medium', themeClasses.windowText]">{{ $t("Cannot Play Media") }}</h3>
          <p :class="['text-sm max-w-xs', themeClasses.windowTextMuted]">{{ error }}</p>
        </div>
      </div>

      <div v-else-if="!mediaSrc" class="absolute inset-0 flex items-center justify-center">
        <div class="flex flex-col items-center gap-3 text-center p-8">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center" :class="themeClasses.imageViewerBg">
            <Icon :icon="movieIcon" class="w-8 h-8" :class="themeClasses.windowTextMuted" />
          </div>
          <h3 :class="['text-lg font-medium', themeClasses.windowText]">{{ $t("No Media") }}</h3>
          <p :class="['text-sm max-w-xs', themeClasses.windowTextMuted]">{{ $t("Open a video or audio file to play it here.") }}</p>
          <div class="flex flex-wrap items-center justify-center gap-2 mt-1">
            <button type="button" :class="[themeClasses.storeCardGetPill]" class="flex items-center gap-1.5 h-8 px-4 rounded-full border-0 text-xs font-semibold cursor-pointer transition-colors duration-150" @click="browseFolder(VIDEOS_FOLDER)">
              <Icon :icon="folderVideoIcon" class="w-4 h-4" />
              {{ $t("Browse Videos") }}
            </button>
            <button type="button" :class="[themeClasses.storeCardGetPill]" class="flex items-center gap-1.5 h-8 px-4 rounded-full border-0 text-xs font-semibold cursor-pointer transition-colors duration-150" @click="browseFolder(MUSIC_FOLDER)">
              <Icon :icon="folderMusicIcon" class="w-4 h-4" />
              {{ $t("Browse Music") }}
            </button>
          </div>
          <span :class="['text-xs', themeClasses.windowTextMuted]">{{ $t("or drop a video or audio file here") }}</span>
        </div>
      </div>

      <video v-else-if="isVideo" ref="mediaRef" :src="mediaSrc" class="max-w-full max-h-full" @loadedmetadata="onMediaLoaded" @timeupdate="onTimeUpdate" @ended="onMediaEnded" @error="onMediaError" @play="isPlaying = true" @pause="isPlaying = false" playsinline />

      <div v-else-if="isAudio" class="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8 overflow-hidden">
        <div ref="coverRef" class="cover-pulse relative w-32 h-32 flex-shrink-0">
          <Transition name="cover-flip" mode="out-in">
            <AppIconGraphic :key="coverUrl || 'none'" :image-src="coverUrl || undefined" :icon="isPlaying ? musicNoteIcon : musicIcon" color="#a855f7" :size="128" :class="isPlaying && 'cover-playing'" />
          </Transition>
        </div>
        <div class="text-center max-w-full px-4">
          <h3 :class="['text-lg font-medium truncate max-w-xs', themeClasses.windowText]" :title="fileName">{{ fileName }}</h3>
          <p :class="['text-sm mt-1', themeClasses.windowTextMuted]">{{ mediaType.toUpperCase() }}</p>
        </div>
        <canvas :key="visualizer" ref="canvasRef" class="absolute inset-0 w-full h-full p-1 pointer-events-none -z-10" />
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
        <button @click="skipBackward" :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="p-2 rounded-full transition-colors" :title="$t('Back 10s')">
          <Icon :icon="rewindIcon" class="w-5 h-5" />
        </button>
        <button @click="togglePlay" :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="p-3 rounded-full transition-colors bg-blue-500/20 hover:bg-blue-500/30" :title="isPlaying ? $t('Pause') : $t('Play')">
          <Icon :icon="isPlaying ? pauseIcon : playIcon" class="w-6 h-6" />
        </button>
        <button @click="skipForward" :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="p-2 rounded-full transition-colors" :title="$t('Forward 10s')">
          <Icon :icon="fastForwardIcon" class="w-5 h-5" />
        </button>

        <div v-if="isVideo && !isMobile" class="w-px h-6 mx-2 flex-shrink-0" :class="themeClasses.utilityDivider"></div>

        <button v-if="isVideo && !isMobile" @click="toggleFullscreen" :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="p-2 rounded-full transition-colors" :title="$t('Fullscreen')">
          <Icon :icon="fullscreenIcon" class="w-5 h-5" />
        </button>
      </div>
    </div>

    <StatusBar :icon="isVideo ? movieIcon : musicIcon" :message="fileName || $t('No Media')" :info="mediaType ? mediaType.toUpperCase() : ''">
      <template v-if="isValidated" #extra>
        <div class="flex items-center gap-1 text-green-500 text-[10px]">
          <Icon :icon="shieldCheckIcon" class="w-3.5 h-3.5" />
          <span>{{ $t("Verified") }}</span>
        </div>
      </template>
      <template #help>
        <div class="space-y-3 max-w-sm">
          <div class="flex items-center gap-2">
            <StatusBarHelpIcon :icon="movieIcon" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">{{ $t("Media Player") }}</h4>
          </div>
          <div :class="['text-[10px] md:text-xs space-y-2.5 leading-relaxed', themeClasses.statusBarInfo]">
            <p>{{ $t("Play video and audio files with magic bytes validation.") }}</p>
            <div class="space-y-1.5">
              <div class="flex items-start gap-2">
                <Icon :icon="movieIcon" class="w-3.5 h-3.5 mt-0.5 text-blue-500 flex-shrink-0" />
                <p>{{ $t("Video: Supports MP4, WebM, and Ogg video formats.") }}</p>
              </div>
              <div class="flex items-start gap-2">
                <Icon :icon="musicIcon" class="w-3.5 h-3.5 mt-0.5 text-purple-500 flex-shrink-0" />
                <p>{{ $t("Audio: Supports MP3, WAV, AAC, and Ogg audio formats.") }}</p>
              </div>
              <div class="flex items-start gap-2">
                <Icon :icon="shieldCheckIcon" class="w-3.5 h-3.5 mt-0.5 text-green-500 flex-shrink-0" />
                <p>{{ $t("Verified: Files are validated against their magic bytes.") }}</p>
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
import { parseBlob } from "music-metadata";

import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useResponsive } from "../__Composables__/useResponsive";
import { useWindowStore } from "../__Stores__/windowStore";
import { useMediaPlaybackStore, type MediaOrigin } from "../__Stores__/useMediaPlaybackStore";

import AppIconGraphic from "../__Components__/AppIconGraphic.vue";
import StatusBar from "../__Components__/StatusBar.vue";
import StatusBarHelpIcon from "../__Components__/StatusBarHelpIcon.vue";

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
import folderVideoIcon from "@iconify-icons/mdi/folder-play";
import folderMusicIcon from "@iconify-icons/mdi/folder-music";
import saveIcon from "@iconify-icons/mdi/content-save-outline";
import checkIcon from "@iconify-icons/mdi/check";

import { useI18n } from "vue-i18n";
import { message } from "ant-design-vue";

import { uploadToStorage, uniqueStorageName } from "../__Utils__/StorageUpload";
import type { SpectrumEngine } from "../__Utils__/SpectrumEngine";
import { SpectrumLineEngine } from "../__Utils__/SpectrumLineEngine";

const { themeClasses } = useTheme();
const { t } = useI18n();
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
  origin?: MediaOrigin;
}>();

const containerRef = ref<HTMLElement | null>(null);
const mediaRef = ref<HTMLVideoElement | HTMLAudioElement | null>(null);
const mediaSrc = ref<string | null>(null);
const coverUrl = ref<string | null>(null);
let coverToken = 0;
const fileName = ref("");
const currentOrigin = ref<MediaOrigin | null>(null);
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
const coverRef = ref<HTMLElement | null>(null);
const audioContext = ref<AudioContext | null>(null);
const analyser = ref<AnalyserNode | null>(null);
const audioSource = ref<MediaElementAudioSourceNode | null>(null);
type Visualizer = "terrain" | "line";

const VISUALIZER_KEY = "homedock-mediaplayer-visualizer";
const COVER_PULSE = 0.16;

let spectrumEngine: SpectrumEngine | null = null;
let visualizerRequest = 0;
const visualizer = ref<Visualizer>(readVisualizerPreference());
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
      coverUrl: coverUrl.value || undefined,
      origin: currentOrigin.value ?? undefined,
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
      coverUrl: coverUrl.value || undefined,
      origin: currentOrigin.value ?? undefined,
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

function clearCover() {
  coverToken++;
  coverUrl.value = null;
}

function detectCoverImageMime(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return "image/gif";
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp";
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) return "image/bmp";
  return null;
}

async function extractCoverArt(buffer: ArrayBuffer) {
  const token = ++coverToken;
  let next: string | null = null;
  try {
    const metadata = await parseBlob(new Blob([buffer]));
    const pic = metadata?.common?.picture?.[0];
    const detectedMime = pic?.data?.length ? detectCoverImageMime(pic.data) : null;
    if (pic && detectedMime) {
      let binary = "";
      for (let i = 0; i < pic.data.length; i++) {
        binary += String.fromCharCode(pic.data[i]);
      }
      next = `data:${detectedMime};base64,${btoa(binary)}`;
    }
  } catch {}
  if (token !== coverToken) return;
  coverUrl.value = next;
  updatePlaybackStore();
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

const VIDEOS_FOLDER = "Videos";
const SAVED_FEEDBACK_MS = 2000;
const MUSIC_FOLDER = "Music";
const DROPPABLE_EXTENSIONS = new Set(["mp4", "m4v", "webm", "ogv", "mp3", "wav", "aac", "oga", "ogg", "flac"]);
const MEDIA_EXTENSIONS = new Set([...DROPPABLE_EXTENSIONS, "mkv", "avi", "mov", "wmv", "flv", "mpg", "mpeg", "3gp", "m4a", "m4b", "wma", "opus", "aiff", "aif", "alac", "ape"]);

const droppedFile = ref<File | null>(null);
const saveState = ref<"idle" | "saving" | "saved">("idle");
const isDragOver = ref(false);
let dragDepth = 0;

watch(droppedFile, () => {
  saveState.value = "idle";
});

function isMediaFile(file: File): boolean {
  return file.type.startsWith("video/") || file.type.startsWith("audio/") || MEDIA_EXTENSIONS.has(getFileExtension(file.name));
}

function hasDraggedFiles(event: DragEvent): boolean {
  return Boolean(event.dataTransfer?.types.includes("Files"));
}

function onDragEnter(event: DragEvent) {
  if (!hasDraggedFiles(event)) return;
  dragDepth++;
  isDragOver.value = true;
}

function onDragOver(event: DragEvent) {
  if (!hasDraggedFiles(event) || !event.dataTransfer) return;
  event.dataTransfer.dropEffect = "copy";
}

function onDragLeave(event: DragEvent) {
  if (!hasDraggedFiles(event)) return;
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) isDragOver.value = false;
}

async function onDrop(event: DragEvent) {
  dragDepth = 0;
  isDragOver.value = false;

  const file = Array.from(event.dataTransfer?.files ?? []).find(isMediaFile);
  if (!file) return;

  const extension = getFileExtension(file.name);
  if (!DROPPABLE_EXTENSIONS.has(extension)) {
    resetMediaElement();
    clearCover();
    droppedFile.value = null;
    isValidated.value = false;
    mediaInfo.value = null;
    fileName.value = file.name;
    updateWindowTitle(file.name);
    error.value = t("{format} files can't be played in the Media Player.", { format: (extension || "?").toUpperCase() });
    return;
  }

  loadFromBuffer({ name: file.name, extension, buffer: await file.arrayBuffer() });
  if (isValidated.value) droppedFile.value = file;
}

function browseFolder(folder: string) {
  windowStore.openFileInApp("fileexplorer", {
    data: { initialLocation: "storage", initialPath: folder },
  });
}

async function saveDroppedMedia() {
  const file = droppedFile.value;
  if (!file || saveState.value !== "idle") return;

  const folder = isVideo.value ? VIDEOS_FOLDER : MUSIC_FOLDER;
  saveState.value = "saving";
  try {
    const name = await uniqueStorageName(folder, file.name, csrfToken.value);
    await uploadToStorage(file, name, folder, csrfToken.value);
    if (droppedFile.value !== file) return;
    saveState.value = "saved";
    message.success(t("Saved to Storage/{folder}/{filename}", { folder, filename: name }));
    setTimeout(() => {
      if (droppedFile.value === file) droppedFile.value = null;
    }, SAVED_FEEDBACK_MS);
  } catch (err) {
    console.error("Failed to save media:", err);
    if (droppedFile.value === file) saveState.value = "idle";
    message.error(t("Failed to save file"));
  }
}

async function loadMedia(extFile: ExternalFile) {
  droppedFile.value = null;
  resetMediaElement();

  const parts = extFile.path.split("/");
  parts.pop();
  currentOrigin.value = { location: extFile.source, path: parts.join("/"), name: extFile.path, container: extFile.container };

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
    if (["mp3", "aac", "oga", "ogg", "flac"].includes(detected.type.toLowerCase())) {
      extractCoverArt(fileBuffer);
    } else {
      clearCover();
    }
  } catch (err: any) {
    console.error("Failed to load media:", err);
    error.value = err.message || "Failed to load media";
    clearCover();
  } finally {
    isLoading.value = false;
  }
}

function loadFromBuffer(file: MediaFile, origin?: MediaOrigin) {
  droppedFile.value = null;
  resetMediaElement();
  currentOrigin.value = origin ?? null;

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
    if (["mp3", "aac", "oga", "ogg", "flac"].includes(detected.type.toLowerCase())) {
      extractCoverArt(fileBuffer);
    } else {
      clearCover();
    }
  } catch (err: any) {
    console.error("Failed to load media:", err);
    error.value = err.message || "Failed to load media";
    clearCover();
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
    analyserNode.fftSize = 2048;
    analyserNode.smoothingTimeConstant = 0.8;
    analyser.value = analyserNode;

    source.connect(analyserNode);
    analyserNode.connect(ctx.destination);

    isAudioContextInitialized.value = true;
  } catch (err) {
    console.warn("Failed to initialize audio context:", err);
  }
}

async function startVisualization() {
  if (!analyser.value || !canvasRef.value) return;

  if (spectrumEngine && !spectrumEngine.owns(canvasRef.value)) disposeVisualization();

  if (!spectrumEngine) {
    const request = ++visualizerRequest;
    const engine = await createSpectrumEngine(canvasRef.value);
    if (request !== visualizerRequest || !canvasRef.value || !engine?.owns(canvasRef.value)) {
      engine?.dispose();
      return;
    }
    spectrumEngine = engine;
  }

  if (!isPlaying.value || !analyser.value) return;
  spectrumEngine.onPulse = pulseCover;
  spectrumEngine.play(analyser.value);
}

async function createSpectrumEngine(canvas: HTMLCanvasElement): Promise<SpectrumEngine | null> {
  if (visualizer.value === "terrain") {
    try {
      const { SpectrumSceneEngine } = await import("../__Utils__/SpectrumSceneEngine");
      return new SpectrumSceneEngine(canvas);
    } catch (err) {
      console.warn("Failed to initialize the 3D spectrum, falling back to the line:", err);
      visualizer.value = "line";
      await nextTick();
      return canvasRef.value ? createSpectrumEngine(canvasRef.value) : null;
    }
  }

  try {
    return new SpectrumLineEngine(canvas);
  } catch (err) {
    console.warn("Failed to initialize the spectrum line:", err);
    return null;
  }
}

function readVisualizerPreference(): Visualizer {
  try {
    return localStorage.getItem(VISUALIZER_KEY) === "line" ? "line" : "terrain";
  } catch {
    return "terrain";
  }
}

async function toggleVisualizer() {
  visualizer.value = visualizer.value === "terrain" ? "line" : "terrain";
  try {
    localStorage.setItem(VISUALIZER_KEY, visualizer.value);
  } catch {}

  disposeVisualization();
  await nextTick();
  if (isPlaying.value) startVisualization();
}

function pulseCover(pulse: number) {
  if (!coverRef.value) return;
  coverRef.value.style.transform = pulse > 0.001 ? `scale(${1 + pulse * COVER_PULSE})` : "";
}

function stopVisualization() {
  spectrumEngine?.pause();
}

function disposeVisualization() {
  visualizerRequest++;
  spectrumEngine?.dispose();
  spectrumEngine = null;
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
    disposeVisualization();
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
  { immediate: true },
);

watch(
  () => props.mediaFile,
  (file) => {
    if (file) {
      cleanup();
      loadFromBuffer(file, props.origin);
    }
  },
  { immediate: true },
);

function handleIncomingFile(event: CustomEvent) {
  const data = event.detail;
  if (data?.mediaFile) {
    cleanup();
    loadFromBuffer(data.mediaFile, data.origin);
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
  clearCover();
});
</script>

<style scoped>
.media-player {
  user-select: none;
}

.cover-pulse {
  will-change: transform;
  perspective: 600px;
}

.cover-pulse .cover-flip-leave-active {
  transition: transform 0.18s cubic-bezier(0.55, 0, 1, 0.45);
}

.cover-pulse .cover-flip-enter-active {
  transition: transform 0.32s cubic-bezier(0.22, 1.3, 0.36, 1);
}

.cover-pulse .cover-flip-leave-to {
  transform: rotateY(90deg);
}

.cover-pulse .cover-flip-enter-from {
  transform: rotateY(-90deg);
}

.cover-playing :deep(.app-icon-glyph) {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.drop-fade-enter-active,
.drop-fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.drop-fade-enter-from,
.drop-fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

@container window (max-width: 520px) {
  .drop-save-button {
    width: 1.75rem;
    padding: 0;
  }

  .drop-save-label {
    display: none;
  }

  .media-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    font-size: 10px;
    line-height: 1.2;
  }

  .media-meta-separator {
    display: none;
  }
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
