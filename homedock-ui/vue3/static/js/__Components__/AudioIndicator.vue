<!-- homedock-ui/vue3/static/js/__Components__/AudioIndicator.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Transition name="taskbar-item">
    <div v-if="mediaStore.hasActivePlayers" class="audio-indicator-wrapper" ref="indicatorRef">
      <div class="audio-indicator" :class="[themeClasses.updateIndicatorBg, themeClasses.updateIndicatorIcon, themeClasses.updateIndicatorBgHover, themeClasses.updateIndicatorIconHover]" @click="toggle">
        <svg v-if="isMuted" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4L9.91 6.09L12 8.18V4M4.27 3L3 4.27L7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.51-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21L21 19.73l-9-9L4.27 3M19 12c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-3-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71m-2.5 0c0-1.77-1-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63z" />
        </svg>
        <svg v-else-if="currentVolume === 0" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 9v6h4l5 5V4l-5 5H7z" />
        </svg>
        <svg v-else-if="currentVolume < 50" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5 9v6h4l5 5V4L9 9H5zm11 3c0-1.77-1-3.29-2.5-4.03v8.06c1.5-.74 2.5-2.26 2.5-4.03z" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4-.91 7-4.49 7-8.77s-3-7.86-7-8.77M16.5 12c0-1.77-1-3.29-2.5-4.03V16.03c1.5-.74 2.5-2.26 2.5-4.03M3 9v6h4l5 5V4L7 9H3z" />
        </svg>
      </div>

      <TrayPanel :open="isOpen" :anchor="indicatorRef" :title="$t('Volume')" :subtitle="mediaStore.activePlayers.length ? $t('Now Playing') : undefined" :icon="volumeIcon" icon-color="#ec4899" @close="close">
        <template #accessory>
          <span :class="[themeClasses.storeCardSubtitle]" class="flex-shrink-0 text-xs font-semibold tabular-nums">{{ isMuted ? 0 : currentVolume }}%</span>
        </template>

        <div class="px-1.5 pt-1">
          <div :class="[themeClasses.storeInfoBar]" class="flex items-center gap-3 px-2.5 py-2 rounded-xl border">
            <button type="button" :class="[themeClasses.storeCardInstalledPill]" class="flex items-center justify-center w-8 h-8 rounded-full border-0 flex-shrink-0 cursor-pointer transition-colors duration-150" :title="isMuted ? $t('Unmute') : $t('Mute')" :aria-label="isMuted ? $t('Unmute') : $t('Mute')" @click="toggleMute">
              <Icon :icon="volumeIcon" class="w-4 h-4" />
            </button>
            <div class="volume-slider relative flex-1 h-8 flex items-center" :class="{ 'is-muted': isMuted }">
              <span :class="[themeClasses.storeInfoBarDivider]" class="absolute inset-x-0 h-1.5 rounded-full overflow-hidden">
                <span class="block h-full rounded-full bg-blue-500 transition-[width] duration-100" :style="{ width: `${isMuted ? 0 : currentVolume}%` }"></span>
              </span>
              <input v-model.number="currentVolume" type="range" min="0" max="100" :aria-label="$t('Volume')" class="relative z-[1] w-full h-8 m-0 bg-transparent cursor-pointer" @input="onVolumeChange" />
            </div>
          </div>
        </div>

        <TraySection v-if="mediaStore.activePlayers.length > 0" :title="$t('Now Playing')">
          <TrayRow v-for="player in mediaStore.activePlayers" :key="player.windowId" :title="player.fileName" interactive @click="focusPlayer(player.windowId)">
            <template #leading>
              <AppIconGraphic :image-src="player.coverUrl || undefined" :icon="player.isVideo ? videoIcon : musicIcon" :color="player.isVideo ? '#3b82f6' : '#a855f7'" :size="32" />
            </template>
            <template #subtitle>
              <span class="flex items-center gap-1.5 tabular-nums">
                <span v-if="player.isPlaying" class="playing-dot"></span>
                <span>{{ player.isPlaying ? $t("Playing") : $t("Paused") }}</span>
                <span>·</span>
                <span>{{ formatTime(player.currentTime) }} / {{ formatTime(player.duration) }}</span>
              </span>
            </template>
            <template #trailing>
              <button type="button" :class="[themeClasses.storeCardInstalledPill]" class="flex items-center justify-center w-7 h-7 rounded-full border-0 flex-shrink-0 cursor-pointer transition-colors duration-150" :aria-label="player.isPlaying ? $t('Paused') : $t('Playing')" @click.stop="togglePlayerPlayback(player.windowId)">
                <Icon :icon="player.isPlaying ? pauseIcon : playIcon" class="w-4 h-4" />
              </button>
            </template>
          </TrayRow>
        </TraySection>
      </TrayPanel>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from "vue";

import { useMediaPlaybackStore } from "../__Stores__/useMediaPlaybackStore";
import { useWindowStore } from "../__Stores__/windowStore";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useTrayPanel } from "../__Composables__/useTrayManager";

import { Icon } from "@iconify/vue";
import volumeOffIcon from "@iconify-icons/mdi/volume-off";
import volumeLowIcon from "@iconify-icons/mdi/volume-low";
import volumeMediumIcon from "@iconify-icons/mdi/volume-medium";
import volumeHighIcon from "@iconify-icons/mdi/volume-high";
import musicIcon from "@iconify-icons/mdi/music-note";
import videoIcon from "@iconify-icons/mdi/movie-open";
import playIcon from "@iconify-icons/mdi/play";
import pauseIcon from "@iconify-icons/mdi/pause";

import AppIconGraphic from "./AppIconGraphic.vue";
import TrayPanel from "./TrayPanel.vue";
import TraySection from "./TraySection.vue";
import TrayRow from "./TrayRow.vue";

const mediaStore = useMediaPlaybackStore();
const windowStore = useWindowStore();
const { themeClasses } = useTheme();
const { isOpen, toggle, close } = useTrayPanel("audio-indicator");

const indicatorRef = ref<HTMLElement | null>(null);

const currentVolume = ref(80);
const isMuted = ref(false);

const primaryPlayer = computed(() => mediaStore.primaryPlayer);

const volumeIcon = computed(() => {
  if (isMuted.value || currentVolume.value === 0) return volumeOffIcon;
  if (currentVolume.value < 34) return volumeLowIcon;
  if (currentVolume.value < 67) return volumeMediumIcon;
  return volumeHighIcon;
});

watch(
  primaryPlayer,
  (player) => {
    if (player) {
      currentVolume.value = player.volume;
      isMuted.value = player.isMuted;
    }
  },
  { immediate: true },
);

function onVolumeChange() {
  mediaStore.activePlayers.forEach((player) => {
    window.dispatchEvent(
      new CustomEvent(`homedock:media-control-${player.windowId}`, {
        detail: { action: "setVolume", value: currentVolume.value },
      }),
    );
  });
}

function toggleMute() {
  isMuted.value = !isMuted.value;
  mediaStore.activePlayers.forEach((player) => {
    window.dispatchEvent(
      new CustomEvent(`homedock:media-control-${player.windowId}`, {
        detail: { action: "setMuted", value: isMuted.value },
      }),
    );
  });
}

function togglePlayerPlayback(windowId: string) {
  window.dispatchEvent(
    new CustomEvent(`homedock:media-control-${windowId}`, {
      detail: { action: "togglePlay" },
    }),
  );
}

function focusPlayer(windowId: string) {
  windowStore.focusWindow(windowId);
  if (windowStore.windows.find((w) => w.id === windowId)?.isMinimized) {
    windowStore.restoreWindow(windowId);
  }
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
</script>

<style scoped>
.audio-indicator-wrapper {
  position: relative;
  user-select: none;
}

.audio-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  transition: all 0.15s ease;
  cursor: pointer;
}

.volume-slider input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
}

.volume-slider input[type="range"]::-webkit-slider-runnable-track {
  height: 6px;
  background: transparent;
}

.volume-slider input[type="range"]::-moz-range-track {
  height: 6px;
  background: transparent;
}

.volume-slider input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  margin-top: -5px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow:
    0 0 0 0.5px rgba(0, 0, 0, 0.12),
    0 1px 3px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

.volume-slider input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border: none;
  border-radius: 50%;
  background: #ffffff;
  box-shadow:
    0 0 0 0.5px rgba(0, 0, 0, 0.12),
    0 1px 3px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

.volume-slider.is-muted input[type="range"]::-webkit-slider-thumb {
  opacity: 0.6;
}

.playing-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse-dot 1.5s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.8);
  }
}

/* Taskbar item transitions */
.taskbar-item-enter-active,
.taskbar-item-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.taskbar-item-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(10px);
}

.taskbar-item-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(10px);
}
</style>
