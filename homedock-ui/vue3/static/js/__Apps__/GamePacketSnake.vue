<!-- homedock-ui/vue3/static/js/__Apps__/GamePacketSnake.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div ref="root" class="packet-snake relative w-full h-full overflow-hidden select-none outline-hidden" tabindex="0" @keydown="onKeyDown" @pointerdown="focusGame">
    <canvas ref="canvasRef" class="absolute inset-0 w-full h-full block" @pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerUp" @pointercancel="onPointerUp" @contextmenu.prevent></canvas>

    <div v-if="state === 'playing' || state === 'paused'" class="absolute top-0 inset-x-0 flex items-start justify-between gap-3 p-3 sm:p-4 pointer-events-none">
      <div class="hud-panel">
        <div class="hud-label">{{ $t("Packets") }}</div>
        <div class="hud-value">{{ score }}</div>
      </div>
      <div class="hud-panel text-right">
        <div class="hud-label">{{ $t("Best") }}</div>
        <div class="hud-value">{{ Math.max(best, score) }}</div>
      </div>
    </div>

    <div class="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
      <button v-if="state === 'playing'" class="hud-icon-button cursor-pointer" :title="$t('Pause')" @pointerdown.stop @click="pause">
        <Icon :icon="pauseIcon" class="w-4 h-4" />
      </button>
      <button class="hud-icon-button cursor-pointer" :title="muted ? $t('Unmute') : $t('Mute')" @pointerdown.stop @click="toggleMute">
        <Icon :icon="muted ? volumeOffIcon : volumeHighIcon" class="w-4 h-4" />
      </button>
    </div>

    <div v-if="sudo > 0 && (state === 'playing' || state === 'paused')" class="sudo-badge pointer-events-none" :class="{ 'sudo-badge-ending': sudo <= 2 }">
      <span class="sudo-prompt">#</span>
      <span>sudo</span>
      <span class="sudo-seconds">{{ sudo }}s</span>
    </div>

    <transition name="neon-fade">
      <div v-if="state !== 'playing'" class="absolute inset-0 flex items-center justify-center p-4" @pointerdown.stop>
        <div class="menu-panel">
          <template v-if="state === 'ready'">
            <div>
              <h1 class="menu-title">Packet Snake</h1>
              <p class="menu-tagline">
                <span>Python goes SysAdmin</span>
                <span class="tv-badge"><span>Twice!</span></span>
              </p>
            </div>
            <p v-if="best > 0" class="menu-subtitle">{{ $t("Best") }} · {{ best }}</p>
            <button class="menu-button cursor-pointer" @click="startGame">
              <Icon :icon="playIcon" class="w-5 h-5" />
              <span>{{ $t("Play") }}</span>
            </button>
            <div class="controls-grid">
              <template v-if="coarsePointer">
                <span class="controls-keys"><Icon :icon="swipeIcon" class="w-5 h-5" /></span>
                <span>{{ $t("Move") }}</span>
              </template>
              <template v-else>
                <span class="controls-keys"><kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span>
                <span>{{ $t("Move") }}</span>
                <span class="controls-keys"><kbd>P</kbd></span>
                <span>{{ $t("Pause") }}</span>
              </template>
            </div>
            <div class="controls-tips">
              <span class="controls-keys"><Icon :icon="packageIcon" class="w-4 h-4 controls-packet" />→<Icon :icon="snakeIcon" class="w-4 h-4 controls-snake" />+1</span>
              <span class="controls-keys"><span class="sudo-chip">sudo</span>→<Icon :icon="shieldIcon" class="w-4 h-4 controls-snake" /><Icon :icon="packageIcon" class="w-4 h-4 controls-packet" />×8</span>
            </div>
          </template>

          <template v-else-if="state === 'paused'">
            <h2 class="menu-title menu-title-small">{{ $t("Paused") }}</h2>
            <button class="menu-button cursor-pointer" @click="resume">
              <Icon :icon="playIcon" class="w-5 h-5" />
              <span>{{ $t("Resume") }}</span>
            </button>
          </template>

          <template v-else>
            <h2 class="menu-title menu-title-small">{{ $t("Game over") }}</h2>
            <p class="menu-score"><Icon :icon="packageIcon" class="w-6 h-6" />{{ score }}</p>
            <p v-if="newRecord" class="menu-record">{{ $t("New record!") }}</p>
            <p v-else-if="best > 0" class="menu-subtitle">{{ $t("Best") }} · {{ best }}</p>
            <button class="menu-button cursor-pointer" @click="startGame">
              <Icon :icon="replayIcon" class="w-5 h-5" />
              <span>{{ $t("Play again") }}</span>
            </button>
          </template>
        </div>
      </div>
    </transition>

    <aside v-if="state === 'ready' || state === 'over'" class="studio-games" :aria-label="$t('More from Banshee Studio')">
      <div class="studio-games-card">
        <div class="studio-games-text">
          <h2 class="studio-games-title">{{ $t("More from Banshee Studio") }}</h2>
          <p class="studio-games-subtitle">{{ $t("From the creators of HomeDock OS") }}</p>
        </div>
        <div class="studio-games-links">
          <a class="studio-game-link" href="https://apps.apple.com/app/id6768628361" target="_blank" rel="noopener noreferrer" :aria-label="$t('Open Paperclip Empire on the App Store')" :title="$t('Open Paperclip Empire on the App Store')">
            <img class="studio-game-icon" :src="PAPERCLIP_EMPIRE_ICON" alt="" aria-hidden="true" />
          </a>
          <a class="studio-game-link" href="https://apps.apple.com/app/id6798052302" target="_blank" rel="noopener noreferrer" :aria-label="$t('Open Vivarium on the App Store')" :title="$t('Open Vivarium on the App Store')">
            <img class="studio-game-icon" :src="VIVARIUM_ICON" alt="" aria-hidden="true" />
          </a>
        </div>
      </div>
      <span class="studio-support-badge">
        <Icon :icon="heartIcon" class="w-3 h-3" />
        {{ $t("Support HomeDock OS development") }}
      </span>
    </aside>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";

import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";

import { Icon } from "@iconify/vue";
import playIcon from "@iconify-icons/mdi/play";
import pauseIcon from "@iconify-icons/mdi/pause";
import replayIcon from "@iconify-icons/mdi/replay";
import volumeHighIcon from "@iconify-icons/mdi/volume-high";
import volumeOffIcon from "@iconify-icons/mdi/volume-off";
import packageIcon from "@iconify-icons/mdi/package-variant";
import snakeIcon from "@iconify-icons/mdi/snake";
import swipeIcon from "@iconify-icons/mdi/gesture-swipe";
import shieldIcon from "@iconify-icons/mdi/shield";
import heartIcon from "@iconify-icons/mdi/heart";

import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useWindowStore } from "../__Stores__/windowStore";
import { useDesktopStore } from "../__Stores__/desktopStore";
import { PacketSnakeEngine, type PacketSnakeDirection, type PacketSnakeState } from "../__Games__/PacketSnake/PacketSnakeEngine";
import { SnakeSound } from "../__Games__/PacketSnake/snakeSound";
import { ChiptuneMusic } from "../__Games__/PacketSnake/chiptune";

const GAME_ID = "packetsnake";
const PAPERCLIP_EMPIRE_ICON = "/images/games/paperclip-empire.jpg";
const VIVARIUM_ICON = "/images/games/vivarium.jpg";
const MUTE_STORAGE_KEY = "homedock-packetsnake-muted";
const SWIPE_THRESHOLD = 24;
const KEY_DIRECTIONS: Record<string, PacketSnakeDirection> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
};

const props = defineProps<{ _windowId?: string }>();

const csrfToken = useCsrfToken();
const windowStore = useWindowStore();
const desktopStore = useDesktopStore();

const root = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const engine = shallowRef<PacketSnakeEngine | null>(null);
const state = ref<PacketSnakeState>("ready");
const score = ref(0);
const sudo = ref(0);
const best = ref(0);
const newRecord = ref(false);
const muted = ref(readMuted());
const documentVisible = ref(!document.hidden);
const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

const swipes = new Map<number, { x: number; y: number }>();
let resizeObserver: ResizeObserver | null = null;
let sound: SnakeSound | null = null;
let music: ChiptuneMusic | null = null;

const windowActive = computed(() => {
  if (!props._windowId) return true;
  const current = windowStore.getWindowById(props._windowId);
  return !!current && !current.isMinimized && windowStore.activeWindowId === props._windowId;
});

const shouldRender = computed(() => documentVisible.value && windowActive.value && state.value !== "paused");

function readMuted() {
  try {
    return localStorage.getItem(MUTE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function enableSound() {
  if (muted.value) return;
  sound ??= new SnakeSound();
  sound.resume();
}

function playMusic() {
  if (muted.value) return;
  music ??= new ChiptuneMusic();
  music.play();
}

function stopMusic() {
  music?.pause();
}

function toggleMute() {
  muted.value = !muted.value;
  try {
    localStorage.setItem(MUTE_STORAGE_KEY, muted.value ? "1" : "0");
  } catch {}
  if (muted.value) {
    sound?.dispose();
    sound = null;
    stopMusic();
  } else {
    enableSound();
    if (state.value === "playing" || state.value === "over") playMusic();
  }
  focusGame();
}

function appIconUrls() {
  const urls = new Set<string>();
  for (const app of desktopStore.mainDockerApps) {
    if (!app.image_path || app.image_path.endsWith("notfound.jpg")) continue;
    urls.add(app.image_path.startsWith("/") ? app.image_path : `/images/${app.image_path}`);
  }
  return [...urls];
}

function focusGame() {
  root.value?.focus({ preventScroll: true });
}

function syncState() {
  state.value = engine.value?.getState() ?? "ready";
}

function startGame() {
  newRecord.value = false;
  sudo.value = 0;
  engine.value?.setPacketIcons(appIconUrls());
  engine.value?.start();
  syncState();
  enableSound();
  playMusic();
  music?.setScore(0);
  focusGame();
}

function pause() {
  engine.value?.pause();
  swipes.clear();
  syncState();
  stopMusic();
}

function resume() {
  engine.value?.resume();
  syncState();
  enableSound();
  playMusic();
  focusGame();
}

function turn(direction: PacketSnakeDirection) {
  if (engine.value?.turn(direction)) sound?.turn();
}

function onKeyDown(event: KeyboardEvent) {
  const direction = KEY_DIRECTIONS[event.code];
  if (direction || event.code === "Space") event.preventDefault();

  if (event.code === "KeyP" || event.code === "Escape") {
    if (state.value === "playing") pause();
    else if (state.value === "paused") resume();
    return;
  }

  if ((event.code === "Space" || event.code === "Enter") && !event.repeat) {
    if (state.value === "ready" || state.value === "over") startGame();
    else if (state.value === "paused") resume();
    return;
  }

  if (direction) turn(direction);
}

function onPointerDown(event: PointerEvent) {
  if (state.value !== "playing") return;
  canvasRef.value?.setPointerCapture(event.pointerId);
  swipes.set(event.pointerId, { x: event.clientX, y: event.clientY });
}

function onPointerMove(event: PointerEvent) {
  const start = swipes.get(event.pointerId);
  if (!start) return;
  const dx = event.clientX - start.x;
  const dy = event.clientY - start.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;
  if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? "right" : "left");
  else turn(dy > 0 ? "down" : "up");
  swipes.set(event.pointerId, { x: event.clientX, y: event.clientY });
}

function onPointerUp(event: PointerEvent) {
  swipes.delete(event.pointerId);
}

async function loadBest() {
  try {
    const response = await axios.get("/api/games/scores", { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });
    best.value = Number(response.data?.scores?.[GAME_ID] ?? 0);
  } catch {
    best.value = 0;
  }
}

async function saveBest(value: number) {
  try {
    await axios.post("/api/games/scores", { game: GAME_ID, score: value }, { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });
  } catch {}
}

function onGameOver(finalScore: number) {
  sound?.crash();
  music?.setScore(0);
  swipes.clear();
  if (finalScore > best.value) {
    newRecord.value = best.value > 0;
    best.value = finalScore;
    saveBest(finalScore);
  }
  syncState();
}

function onVisibilityChange() {
  documentVisible.value = !document.hidden;
}

watch(shouldRender, (render) => {
  if (render) engine.value?.run();
  else engine.value?.stop();
});

watch(windowActive, (active) => {
  if (!active && state.value === "playing") pause();
  else if (!active) stopMusic();
});

watch(documentVisible, (visible) => {
  if (!visible && state.value === "playing") pause();
  else if (!visible) stopMusic();
});

onMounted(() => {
  if (!canvasRef.value || !root.value) return;

  engine.value = new PacketSnakeEngine(canvasRef.value, {
    onScore: (next) => {
      score.value = next;
      if (state.value === "playing") music?.setScore(next);
    },
    onEat: (next) => sound?.eat(next),
    onGrow: () => sound?.grow(),
    onSudo: (seconds) => {
      if (seconds && !sudo.value) sound?.sudo();
      else if (!seconds && sudo.value) sound?.sudoEnd();
      sudo.value = seconds;
    },
    onGameOver,
  });
  engine.value.setPacketIcons(appIconUrls());

  resizeObserver = new ResizeObserver(([entry]) => engine.value?.resize(entry.contentRect.width, entry.contentRect.height));
  resizeObserver.observe(root.value);
  engine.value.resize(root.value.clientWidth, root.value.clientHeight);

  document.addEventListener("visibilitychange", onVisibilityChange);
  if (shouldRender.value) engine.value.run();
  focusGame();
  loadBest();
});

onBeforeUnmount(() => {
  document.removeEventListener("visibilitychange", onVisibilityChange);
  resizeObserver?.disconnect();
  sound?.dispose();
  sound = null;
  music?.dispose();
  music = null;
  engine.value?.dispose();
  engine.value = null;
});
</script>

<style scoped>
.packet-snake {
  background: #0b0620;
  touch-action: none;
  font-family: ui-rounded, "SF Pro Rounded", system-ui, sans-serif;
  color: #f5f3ff;
}

.hud-panel {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 6.5rem;
  height: 3.3rem;
  padding: 0.45rem 0.7rem;
  border-radius: 0.75rem;
  background: rgb(11 6 32 / 0.55);
  border: 1px solid rgb(54 224 255 / 0.35);
  backdrop-filter: blur(6px);
}

.hud-label {
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.7;
}

.hud-value {
  font-size: 1.25rem;
  line-height: 1.15;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  text-shadow: 0 0 10px rgb(54 224 255 / 0.7);
}

.hud-icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  background: rgb(11 6 32 / 0.55);
  border: 1px solid rgb(255 255 255 / 0.2);
  color: #f5f3ff;
}

.menu-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85rem;
  width: min(22rem, 100%);
  padding: 1.6rem 1.4rem;
  border-radius: 1.25rem;
  background: rgb(11 6 32 / 0.72);
  border: 1px solid rgb(54 224 255 / 0.4);
  box-shadow: 0 0 40px rgb(54 224 255 / 0.22);
  backdrop-filter: blur(10px);
  text-align: center;
}

.menu-title {
  font-size: clamp(2rem, 7vw, 3rem);
  font-weight: 800;
  font-style: italic;
  letter-spacing: 0.02em;
  line-height: 1;
  background: linear-gradient(180deg, #7cf7a5, #36e0ff 55%, #ff2bd6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 12px rgb(54 224 255 / 0.6));
}

.menu-title-small {
  font-size: clamp(1.6rem, 5vw, 2.2rem);
}

.menu-subtitle {
  font-size: 0.8rem;
  opacity: 0.75;
}

.menu-tagline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  margin-top: 0.45rem;
  font-size: 0.72rem;
  font-weight: 700;
  font-style: italic;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #7cf7a5;
  text-shadow: 0 0 8px rgb(124 247 165 / 0.7);
}

.tv-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.4rem;
  height: 3.4rem;
  margin: -1rem -0.6rem -1rem 0;
  background: #ffe45c;
  clip-path: polygon(50% 0%, 61% 17%, 79% 9%, 79% 29%, 98% 32%, 86% 49%, 98% 66%, 79% 70%, 79% 90%, 61% 82%, 50% 100%, 39% 82%, 21% 90%, 21% 70%, 2% 66%, 14% 49%, 2% 32%, 21% 29%, 21% 9%, 39% 17%);
  filter: drop-shadow(0 0 6px rgb(255 228 92 / 0.6));
  transform: rotate(-14deg);
  animation: tv-badge-wobble 1.6s ease-in-out infinite;
}

.tv-badge span {
  padding: 0.1rem 0.25rem;
  border-radius: 0.2rem;
  background: #e8132b;
  color: #fff;
  font-family: Impact, "Arial Black", system-ui, sans-serif;
  font-size: 0.62rem;
  font-style: normal;
  letter-spacing: 0.04em;
  text-shadow: none;
  box-shadow: 0 0 0 1.5px #fff;
}

@keyframes tv-badge-wobble {
  0%,
  100% {
    transform: rotate(-14deg) scale(1);
  }
  50% {
    transform: rotate(-8deg) scale(1.08);
  }
}

.menu-score {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.8rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 12px rgb(54 224 255 / 0.8);
}

.menu-record {
  font-size: 0.85rem;
  font-weight: 700;
  color: #ffe45c;
  text-shadow: 0 0 10px rgb(255 228 92 / 0.8);
}

.menu-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.6rem;
  border-radius: 999px;
  font-weight: 700;
  color: #0b0620;
  background: linear-gradient(90deg, #7cf7a5, #36e0ff);
  box-shadow: 0 0 20px rgb(54 224 255 / 0.5);
  transition: transform 0.15s ease;
}

.menu-button:hover {
  transform: scale(1.04);
}

.controls-grid {
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;
  column-gap: 0.9rem;
  row-gap: 0.4rem;
  font-size: 0.75rem;
  text-align: left;
  opacity: 0.85;
}

.controls-keys {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
  opacity: 0.9;
}

.controls-keys kbd {
  min-width: 1.35rem;
  padding: 0.1rem 0.3rem;
  border: 1px solid rgb(255 255 255 / 0.25);
  border-bottom-width: 2px;
  border-radius: 0.3rem;
  background: rgb(255 255 255 / 0.06);
  font-family: inherit;
  font-size: 0.68rem;
  line-height: 1.2;
  text-align: center;
}

.controls-tips {
  display: flex;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  opacity: 0.8;
}

.controls-packet {
  color: #36e0ff;
}

.controls-snake {
  color: #7cf7a5;
}

.sudo-chip {
  padding: 0 0.3rem;
  border: 1px solid #39ff6a;
  border-radius: 0.25rem;
  background: #06140a;
  color: #39ff6a;
  font-family: ui-monospace, Menlo, monospace;
  font-size: 0.66rem;
  box-shadow: 0 0 6px rgb(57 255 106 / 0.6);
}

.sudo-badge {
  position: absolute;
  top: 3.25rem;
  left: 50%;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.75rem;
  border: 1px solid #39ff6a;
  border-radius: 999px;
  background: rgb(6 20 10 / 0.85);
  color: #39ff6a;
  font-family: ui-monospace, Menlo, monospace;
  font-size: 0.8rem;
  font-weight: 700;
  text-shadow: 0 0 8px rgb(57 255 106 / 0.8);
  box-shadow: 0 0 16px rgb(57 255 106 / 0.45);
  transform: translateX(-50%);
}

.sudo-prompt {
  opacity: 0.6;
}

.sudo-seconds {
  font-variant-numeric: tabular-nums;
  opacity: 0.85;
}

.sudo-badge-ending {
  animation: sudo-blink 0.3s steps(2, jump-none) infinite;
}

@keyframes sudo-blink {
  50% {
    opacity: 0.35;
  }
}

.neon-fade-enter-active,
.neon-fade-leave-active {
  transition: opacity 0.2s ease;
}

.neon-fade-enter-from,
.neon-fade-leave-to {
  opacity: 0;
}

.studio-games {
  position: absolute;
  z-index: 10;
  right: 0.75rem;
  bottom: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.4rem;
  max-width: calc(100% - 1.5rem);
}

.studio-support-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  color: #fff;
  font-size: 0.56rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
  background: linear-gradient(90deg, rgb(255 43 214 / 0.85), rgb(139 92 246 / 0.85));
  box-shadow: 0 0 12px rgb(255 43 214 / 0.35);
}

.studio-games-card {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  max-width: 100%;
  padding: 0.35rem 0.35rem 0.35rem 0.85rem;
  border: 1px solid rgb(255 255 255 / 0.08);
  border-radius: 999px;
  background: rgb(11 6 32 / 0.6);
  backdrop-filter: blur(10px);
}

.studio-games-text {
  min-width: 0;
  text-align: right;
  line-height: 1.2;
}

.studio-games-links {
  display: flex;
  gap: 0.35rem;
}

.studio-games-title {
  color: #f5f3ff;
  font-size: 0.66rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.studio-games-subtitle {
  color: rgb(245 243 255 / 0.5);
  font-size: 0.56rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.studio-game-link {
  display: block;
  flex-shrink: 0;
  width: 1.9rem;
  height: 1.9rem;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.45);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.studio-game-link:hover {
  transform: translateY(-2px) scale(1.06);
  box-shadow: 0 4px 14px rgb(54 224 255 / 0.45);
}

.studio-game-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.studio-game-link:focus-visible {
  outline: 2px solid #36e0ff;
  outline-offset: 3px;
}
</style>
