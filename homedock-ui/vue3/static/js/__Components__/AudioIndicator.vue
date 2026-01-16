<!-- homedock-ui/vue3/static/js/__Components__/AudioIndicator.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Transition name="taskbar-item">
    <div v-if="mediaStore.hasActivePlayers" class="audio-indicator-wrapper" ref="indicatorRef">
      <div class="audio-indicator" :class="[themeClasses.updateIndicatorBg, themeClasses.updateIndicatorIcon, themeClasses.updateIndicatorBgHover, themeClasses.updateIndicatorIconHover]" @click="toggleDropdown">
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

      <Transition name="dropdown">
        <Teleport to="body">
          <div v-if="isExpanded" class="audio-dropdown border" :class="[themeClasses.updateDropdownBg, themeClasses.updateDropdownBorder, themeClasses.updateDropdownShadow]">
            <div class="dropdown-header px-4 py-3 rounded-t-lg text-sm font-medium flex items-center justify-between" :class="themeClasses.topBack">
              <span class="dropdown-title" :class="themeClasses.notTextUp">Volume</span>
              <span class="volume-percent text-xs font-semibold" :class="themeClasses.notTextUp">{{ currentVolume }}%</span>
            </div>

            <div class="volume-section p-4">
              <div class="volume-control-windows">
                <button @click="toggleMute" class="mute-button p-2 rounded-lg transition-colors" :class="[themeClasses.updateAppItemBg, themeClasses.updateAppItemBgHover]" :title="isMuted ? 'Unmute' : 'Mute'">
                  <svg v-if="isMuted" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" :class="themeClasses.updateAppName">
                    <path d="M12 4L9.91 6.09L12 8.18V4M4.27 3L3 4.27L7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.51-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21L21 19.73l-9-9L4.27 3M19 12c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-3-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71m-2.5 0c0-1.77-1-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63z" />
                  </svg>
                  <svg v-else-if="currentVolume === 0" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" :class="themeClasses.updateAppName">
                    <path d="M7 9v6h4l5 5V4l-5 5H7z" />
                  </svg>
                  <svg v-else-if="currentVolume < 50" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" :class="themeClasses.updateAppName">
                    <path d="M5 9v6h4l5 5V4L9 9H5zm11 3c0-1.77-1-3.29-2.5-4.03v8.06c1.5-.74 2.5-2.26 2.5-4.03z" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" :class="themeClasses.updateAppName">
                    <path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4-.91 7-4.49 7-8.77s-3-7.86-7-8.77M16.5 12c0-1.77-1-3.29-2.5-4.03v8.06c1.5-.74 2.5-2.26 2.5-4.03M3 9v6h4l5 5V4L7 9H3z" />
                  </svg>
                </button>

                <div class="slider-container">
                  <input type="range" v-model.number="currentVolume" min="0" max="100" class="volume-slider-windows" @input="onVolumeChange" />
                  <div class="slider-track">
                    <div class="slider-fill" :style="{ width: `${currentVolume}%` }"></div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="mediaStore.activePlayers.length > 0" class="players-section border-t" :class="themeClasses.updateSectionBorder">
              <div class="section-label px-4 pt-3 pb-1" :class="themeClasses.updateSectionLabel">Now Playing</div>
              <div class="players-list px-2 pb-2">
                <div v-for="player in mediaStore.activePlayers" :key="player.windowId" class="player-item flex items-center gap-3 px-2 py-2 rounded-lg transition-colors cursor-pointer" :class="[themeClasses.updateAppItemBg, themeClasses.updateAppItemBgHover]" @click="focusPlayer(player.windowId)">
                  <div class="player-icon w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" :class="player.isVideo ? 'bg-blue-500/20' : 'bg-purple-500/20'">
                    <svg v-if="player.isVideo" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" :class="player.isVideo ? 'text-blue-500' : 'text-purple-500'">
                      <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="text-purple-500">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                    </svg>
                  </div>
                  <div class="player-info flex-1 min-w-0">
                    <div class="player-name text-xs font-medium truncate" :class="themeClasses.updateAppName">{{ player.fileName }}</div>
                    <div class="player-status text-[10px] flex items-center gap-1" :class="themeClasses.updateMoreApps">
                      <span v-if="player.isPlaying" class="flex items-center gap-1">
                        <span class="playing-dot"></span>
                        Playing
                      </span>
                      <span v-else>Paused</span>
                      <span class="mx-1">·</span>
                      <span>{{ formatTime(player.currentTime) }} / {{ formatTime(player.duration) }}</span>
                    </div>
                  </div>
                  <button @click.stop="togglePlayerPlayback(player.windowId)" class="play-pause-btn p-1.5 rounded-md transition-colors" :class="[themeClasses.updateAppItemBg, themeClasses.updateAppItemBgHover]">
                    <svg v-if="player.isPlaying" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" :class="themeClasses.updateAppName">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" :class="themeClasses.updateAppName">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Teleport>
      </Transition>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";

import { useMediaPlaybackStore } from "../__Stores__/useMediaPlaybackStore";
import { useWindowStore } from "../__Stores__/windowStore";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useTrayManager } from "../__Composables__/useTrayManager";

const mediaStore = useMediaPlaybackStore();
const windowStore = useWindowStore();
const { themeClasses } = useTheme();
const trayManager = useTrayManager();

const TRAY_ID = "audio-indicator";

const indicatorRef = ref<HTMLElement | null>(null);
const isExpanded = ref(false);

const currentVolume = ref(80);
const isMuted = ref(false);

const primaryPlayer = computed(() => mediaStore.primaryPlayer);

watch(
  primaryPlayer,
  (player) => {
    if (player) {
      currentVolume.value = player.volume;
      isMuted.value = player.isMuted;
    }
  },
  { immediate: true }
);

function toggleDropdown(e: MouseEvent) {
  e.stopPropagation();
  if (!isExpanded.value) {
    trayManager.openTray(TRAY_ID);
    isExpanded.value = true;
  } else {
    trayManager.closeTray(TRAY_ID);
    isExpanded.value = false;
  }
}

function closeDropdown() {
  trayManager.closeTray(TRAY_ID);
  isExpanded.value = false;
}

function handleClickOutside(event: MouseEvent) {
  if (indicatorRef.value && !indicatorRef.value.contains(event.target as Node)) {
    const dropdown = document.querySelector(".audio-dropdown");
    if (dropdown && !dropdown.contains(event.target as Node)) {
      closeDropdown();
    }
  }
}

function onVolumeChange() {
  mediaStore.activePlayers.forEach((player) => {
    window.dispatchEvent(
      new CustomEvent(`homedock:media-control-${player.windowId}`, {
        detail: { action: "setVolume", value: currentVolume.value },
      })
    );
  });
}

function toggleMute() {
  isMuted.value = !isMuted.value;
  mediaStore.activePlayers.forEach((player) => {
    window.dispatchEvent(
      new CustomEvent(`homedock:media-control-${player.windowId}`, {
        detail: { action: "setMuted", value: isMuted.value },
      })
    );
  });
}

function togglePlayerPlayback(windowId: string) {
  window.dispatchEvent(
    new CustomEvent(`homedock:media-control-${windowId}`, {
      detail: { action: "togglePlay" },
    })
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

watch(
  () => trayManager.activeTrayId.value,
  (newTrayId) => {
    if (newTrayId !== TRAY_ID && isExpanded.value) {
      isExpanded.value = false;
    }
  }
);

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
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

.audio-dropdown {
  position: fixed;
  right: 1rem;
  left: auto;
  bottom: 4rem;
  border-radius: 12px;
  width: 320px;
  z-index: 9999;
  overflow: hidden;
}

.dropdown-header {
  padding: 0.75rem 1rem;
}

.dropdown-title {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.volume-percent {
  font-size: 0.75rem;
  opacity: 0.8;
}

.volume-section {
  padding: 1rem;
}

.volume-control-windows {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mute-button {
  flex-shrink: 0;
}

.slider-container {
  flex: 1;
  position: relative;
  height: 32px;
  display: flex;
  align-items: center;
}

.volume-slider-windows {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  background: transparent;
  position: relative;
  z-index: 2;
  cursor: pointer;
}

.volume-slider-windows::-webkit-slider-runnable-track {
  width: 100%;
  height: 6px;
  background: transparent;
  border-radius: 3px;
}

.volume-slider-windows::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  margin-top: -4px;
}

.volume-slider-windows::-moz-range-track {
  width: 100%;
  height: 6px;
  background: transparent;
  border-radius: 3px;
}

.volume-slider-windows::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
}

.slider-track {
  position: absolute;
  left: 0;
  right: 0;
  height: 6px;
  background: rgba(128, 128, 128, 0.3);
  border-radius: 3px;
  overflow: hidden;
  z-index: 1;
}

.slider-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  border-radius: 3px;
  transition: width 0.1s ease;
}

.section-label {
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.player-item {
  min-height: 48px;
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

/* Dropdown Animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(10px);
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
