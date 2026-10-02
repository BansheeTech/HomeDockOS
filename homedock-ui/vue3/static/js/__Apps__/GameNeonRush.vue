<!-- homedock-ui/vue3/static/js/__Apps__/GameNeonRush.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div ref="root" class="neon-rush relative w-full h-full overflow-hidden select-none outline-none" tabindex="0" @keydown="onKeyDown" @keyup="onKeyUp" @blur="engine?.clearInput()" @pointerdown="focusGame">
    <canvas ref="canvasRef" class="absolute inset-0 w-full h-full block" @pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerUp" @pointercancel="onPointerUp" @pointerleave="onPointerUp" @contextmenu.prevent></canvas>

    <div v-if="tofuFlash" :key="tofuFlashKey" class="tofu-flash pointer-events-none"></div>

    <div v-if="state === 'playing' || state === 'paused'" class="absolute top-0 inset-x-0 flex items-start justify-between gap-3 p-3 sm:p-4 pointer-events-none">
      <div class="hud-panel" :class="{ 'hud-panel-refill': tofuFlash }">
        <div class="hud-label">{{ $t("Distance") }}</div>
        <div class="hud-value">{{ formatDistance(hud.distance) }}</div>
        <div class="hud-meter health-meter" :class="{ 'hud-meter-critical': hud.health <= 30 }">
          <div class="hud-meter-heading">
            <Icon :icon="heartIcon" class="hud-meter-icon" />
            <span class="hud-label">{{ $t("Health") }}</span>
            <span class="hud-meter-value">{{ Math.ceil(hud.health) }}%</span>
          </div>
          <div class="hud-track" role="progressbar" :aria-label="$t('Health')" :aria-valuenow="Math.ceil(hud.health)" aria-valuemin="0" aria-valuemax="100">
            <div class="hud-fill" :style="{ width: `${hud.health}%` }"></div>
          </div>
        </div>
      </div>
      <div class="hud-panel" :class="{ 'hud-panel-refill': tofuFlash }">
        <div class="hud-value text-right">{{ Math.round(hud.speed * 3.6) }}<span class="hud-unit">km/h</span></div>
        <div class="hud-meter nitro-meter">
          <div class="hud-meter-heading">
            <Icon :icon="boltIcon" class="hud-meter-icon" />
            <span class="hud-label">Nitro</span>
            <span class="hud-meter-value">{{ Math.round(hud.boost * 100) }}%</span>
          </div>
          <div ref="nitroTrack" class="hud-track">
            <div class="hud-fill" :style="{ width: `${Math.round(hud.boost * 100)}%` }"></div>
          </div>
        </div>
        <div class="hud-meter brakes-meter" :class="{ 'hud-meter-critical': hud.brakes <= 0.25 }">
          <div class="hud-meter-heading">
            <Icon :icon="brakeIcon" class="hud-meter-icon" />
            <span class="hud-label">Brakes</span>
            <span class="hud-meter-value">{{ Math.round(hud.brakes * 100) }}%</span>
          </div>
          <div class="hud-track">
            <div class="hud-fill" :style="{ width: `${Math.round(hud.brakes * 100)}%` }"></div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-for="pickup in pickupEffects"
      :key="pickup.id"
      class="pickup-flight pointer-events-none"
      :class="{ 'pickup-flight-active': pickup.flying }"
      :style="{
        left: `${pickup.x}px`,
        top: `${pickup.y}px`,
        transform: pickup.flying ? `translate(calc(-50% + ${pickup.dx}px), calc(-50% + ${pickup.dy}px)) scale(0.2) rotate(360deg)` : 'translate(-50%, -50%) scale(1)',
      }"
    >
      <img v-if="pickup.icon" :src="pickup.icon" alt="" />
      <Icon v-else :icon="packageIcon" class="w-6 h-6" />
    </div>

    <div v-show="state === 'playing' || state === 'paused'" class="minimap pointer-events-none" :class="coarsePointer ? 'minimap-touch' : 'minimap-desktop'">
      <canvas ref="minimapRef" class="w-full h-full block"></canvas>
    </div>

    <div class="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
      <button v-if="state === 'playing'" class="hud-icon-button" :title="$t('Pause')" @pointerdown.stop @click="pause">
        <Icon :icon="pauseIcon" class="w-4 h-4" />
      </button>
      <button class="hud-icon-button" :title="muted ? $t('Unmute') : $t('Mute')" @pointerdown.stop @click="toggleMute">
        <Icon :icon="muted ? volumeOffIcon : volumeHighIcon" class="w-4 h-4" />
      </button>
    </div>

    <template v-if="coarsePointer && state === 'playing'">
      <div class="absolute bottom-4 left-4 touch-hint pointer-events-none"><Icon :icon="chevronLeftIcon" class="w-8 h-8" /></div>
      <div class="absolute bottom-4 right-4 touch-hint pointer-events-none"><Icon :icon="chevronRightIcon" class="w-8 h-8" /></div>
      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
        <button class="boost-button brake-button" :class="{ 'boost-button-active': brakeHeld }" @pointerdown.stop.prevent="setBrake(true)" @pointerup.stop="setBrake(false)" @pointercancel.stop="setBrake(false)" @pointerleave="setBrake(false)">
          <Icon :icon="brakeIcon" class="w-7 h-7" />
        </button>
        <button class="boost-button" :class="{ 'boost-button-active': boostHeld }" @pointerdown.stop.prevent="setBoost(true)" @pointerup.stop="setBoost(false)" @pointercancel.stop="setBoost(false)" @pointerleave="setBoost(false)">
          <Icon :icon="boltIcon" class="w-7 h-7" />
        </button>
      </div>
    </template>

    <transition name="neon-fade">
      <div v-if="state !== 'playing'" class="absolute inset-0 flex items-center justify-center p-4" @pointerdown.stop>
        <div class="menu-panel">
          <template v-if="state === 'ready'">
            <div>
              <h1 class="menu-title">Neon Rush</h1>
              <p class="menu-tagline">Ultra Tofu Dealer 86</p>
            </div>
            <p v-if="best > 0" class="menu-subtitle">{{ $t("Best") }} · {{ formatDistance(best) }}</p>
            <button class="menu-button" @click="startGame">
              <Icon :icon="playIcon" class="w-5 h-5" />
              <span>{{ $t("Play") }}</span>
            </button>
            <div class="controls-grid">
              <template v-if="coarsePointer">
                <span class="controls-keys"><Icon :icon="chevronLeftIcon" class="w-4 h-4" /><Icon :icon="chevronRightIcon" class="w-4 h-4" /></span>
                <span>{{ $t("Steer") }}</span>
                <span class="controls-keys controls-nitro"><Icon :icon="boltIcon" class="w-4 h-4" /></span>
                <span>Nitro</span>
                <span class="controls-keys controls-brake"><Icon :icon="brakeIcon" class="w-4 h-4" /></span>
                <span>{{ $t("Brake") }}</span>
                <span class="controls-keys"><Icon :icon="brakeIcon" class="w-4 h-4 controls-brake" />+<Icon :icon="chevronLeftIcon" class="w-4 h-4" /><Icon :icon="chevronRightIcon" class="w-4 h-4" /></span>
                <span>{{ $t("Drift") }}</span>
              </template>
              <template v-else>
                <span class="controls-keys"><kbd>←</kbd><kbd>→</kbd><kbd>A</kbd><kbd>D</kbd></span>
                <span>{{ $t("Steer") }}</span>
                <span class="controls-keys"><kbd>↑</kbd><kbd>W</kbd><kbd>␣</kbd></span>
                <span>Nitro</span>
                <span class="controls-keys"><kbd>↓</kbd><kbd>S</kbd></span>
                <span>{{ $t("Brake") }}</span>
                <span class="controls-keys"><kbd>↓</kbd>+<kbd>←</kbd><kbd>→</kbd></span>
                <span>{{ $t("Drift") }}</span>
                <span class="controls-keys"><kbd>P</kbd></span>
                <span>{{ $t("Pause") }}</span>
              </template>
            </div>
            <div class="controls-tips">
              <span class="controls-keys"><Icon :icon="packageIcon" class="w-4 h-4" />→<Icon :icon="boltIcon" class="w-4 h-4 controls-nitro" /></span>
              <span class="controls-keys"><span class="controls-repair"></span>→<Icon :icon="heartIcon" class="w-4 h-4 controls-health" /><Icon :icon="brakeIcon" class="w-4 h-4 controls-brake" /></span>
              <span class="controls-keys"><span class="controls-tofu">豆腐</span>→<Icon :icon="heartIcon" class="w-4 h-4 controls-health" /><Icon :icon="brakeIcon" class="w-4 h-4 controls-brake" />100%</span>
            </div>
          </template>

          <template v-else-if="state === 'paused'">
            <h2 class="menu-title menu-title-small">{{ $t("Paused") }}</h2>
            <button class="menu-button" @click="resume">
              <Icon :icon="playIcon" class="w-5 h-5" />
              <span>{{ $t("Resume") }}</span>
            </button>
          </template>

          <template v-else>
            <h2 class="menu-title menu-title-small">{{ $t("Game over") }}</h2>
            <p class="menu-score">{{ formatDistance(lastDistance) }}</p>
            <p v-if="newRecord" class="menu-record">{{ $t("New record!") }}</p>
            <p v-else-if="best > 0" class="menu-subtitle">{{ $t("Best") }} · {{ formatDistance(best) }}</p>
            <button class="menu-button" @click="startGame">
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

import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from "vue";

import { Icon } from "@iconify/vue";
import playIcon from "@iconify-icons/mdi/play";
import pauseIcon from "@iconify-icons/mdi/pause";
import replayIcon from "@iconify-icons/mdi/replay";
import boltIcon from "@iconify-icons/mdi/lightning-bolt";
import brakeIcon from "@iconify-icons/mdi/car-brake-abs";
import chevronLeftIcon from "@iconify-icons/mdi/chevron-left";
import chevronRightIcon from "@iconify-icons/mdi/chevron-right";
import volumeHighIcon from "@iconify-icons/mdi/volume-high";
import volumeOffIcon from "@iconify-icons/mdi/volume-off";
import packageIcon from "@iconify-icons/mdi/package-variant";
import heartIcon from "@iconify-icons/mdi/heart";

import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useWindowStore } from "../__Stores__/windowStore";
import { useDesktopStore } from "../__Stores__/desktopStore";
import { NeonRushEngine, type NeonRushHud, type NeonRushPickup, type NeonRushState } from "../__Games__/NeonRush/NeonRushEngine";
import { EngineSound } from "../__Games__/NeonRush/engineSound";
import { SynthwaveMusic } from "../__Games__/NeonRush/synthwave";

const GAME_ID = "neonrush";
const PAPERCLIP_EMPIRE_ICON = "/images/games/paperclip-empire.jpg";
const VIVARIUM_ICON = "/images/games/vivarium.jpg";
const MUTE_STORAGE_KEY = "homedock-neonrush-muted";
const TOFU_FLASH_DURATION = 900;
const GAME_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "KeyA", "KeyD", "KeyW", "KeyS", "Space", "ShiftLeft", "ShiftRight"]);

const props = defineProps<{ _windowId?: string }>();

const csrfToken = useCsrfToken();
const windowStore = useWindowStore();
const desktopStore = useDesktopStore();

const root = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const minimapRef = ref<HTMLCanvasElement | null>(null);
const nitroTrack = ref<HTMLElement | null>(null);
const engine = shallowRef<NeonRushEngine | null>(null);
const state = ref<NeonRushState>("ready");
const hud = reactive<NeonRushHud>({ speed: 0, distance: 0, boost: 1, health: 100, boosting: false, offroad: false, brakes: 1, braking: false, drifting: false });
const best = ref(0);
const lastDistance = ref(0);
const newRecord = ref(false);
const boostHeld = ref(false);
const brakeHeld = ref(false);
const documentVisible = ref(!document.hidden);
const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
const pickupEffects = ref<{ id: number; x: number; y: number; dx: number; dy: number; icon: string | null; flying: boolean }[]>([]);

const pointers = new Map<number, number>();
let resizeObserver: ResizeObserver | null = null;
let nextPickupId = 0;
const pickupTimers = new Set<number>();
const tofuFlash = ref(false);
const tofuFlashKey = ref(0);
let tofuFlashTimer = 0;

function celebrateTofu() {
  engineSound?.tofu();
  tofuFlashKey.value++;
  tofuFlash.value = true;
  window.clearTimeout(tofuFlashTimer);
  tofuFlashTimer = window.setTimeout(() => (tofuFlash.value = false), TOFU_FLASH_DURATION);
}

const muted = ref(readMuted());
let music: SynthwaveMusic | null = null;
let engineSound: EngineSound | null = null;

function setEngineRunning(running: boolean) {
  if (running && !muted.value && !engineSound) engineSound = new EngineSound();
  engineSound?.setRunning(running && !muted.value);
}

function appIconUrls() {
  const urls = new Set<string>();
  for (const app of desktopStore.mainDockerApps) {
    if (!app.image_path || app.image_path.endsWith("notfound.jpg")) continue;
    urls.add(app.image_path.startsWith("/") ? app.image_path : `/images/${app.image_path}`);
  }
  return [...urls];
}

function readMuted() {
  try {
    return localStorage.getItem(MUTE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function playMusic() {
  if (muted.value) return;
  music ??= new SynthwaveMusic();
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
  if (muted.value) stopMusic();
  else if (state.value === "playing" || state.value === "over") playMusic();
  setEngineRunning(state.value === "playing");
  focusGame();
}

const windowActive = computed(() => {
  if (!props._windowId) return true;
  const current = windowStore.getWindowById(props._windowId);
  return !!current && !current.isMinimized && windowStore.activeWindowId === props._windowId;
});

const shouldRender = computed(() => documentVisible.value && windowActive.value && state.value !== "paused");

function formatDistance(meters: number) {
  return meters < 1000 ? `${Math.floor(meters)} m` : `${(meters / 1000).toFixed(2)} km`;
}

function focusGame() {
  root.value?.focus({ preventScroll: true });
}

function syncState() {
  state.value = engine.value?.getState() ?? "ready";
}

function animatePickup(pickup: NeonRushPickup) {
  const gameRoot = root.value;
  const canvas = canvasRef.value;
  const nitro = nitroTrack.value;
  if (!gameRoot || !canvas || !nitro) return;

  const rootRect = gameRoot.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  const nitroRect = nitro.getBoundingClientRect();
  const x = canvasRect.left - rootRect.left + pickup.x;
  const y = canvasRect.top - rootRect.top + pickup.y;
  const targetX = nitroRect.left - rootRect.left + nitroRect.width / 2;
  const targetY = nitroRect.top - rootRect.top + nitroRect.height / 2;
  const id = ++nextPickupId;

  pickupEffects.value.push({ id, x, y, dx: targetX - x, dy: targetY - y, icon: pickup.icon, flying: false });
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const effect = pickupEffects.value.find((item) => item.id === id);
      if (effect) effect.flying = true;
    }),
  );

  const timer = window.setTimeout(() => {
    pickupEffects.value = pickupEffects.value.filter((item) => item.id !== id);
    pickupTimers.delete(timer);
  }, 720);
  pickupTimers.add(timer);
}

function startGame() {
  newRecord.value = false;
  engine.value?.setDropIcons(appIconUrls());
  engine.value?.start();
  syncState();
  playMusic();
  setEngineRunning(true);
  focusGame();
}

function pause() {
  engine.value?.pause();
  engine.value?.clearInput();
  pointers.clear();
  boostHeld.value = false;
  brakeHeld.value = false;
  syncState();
  stopMusic();
  setEngineRunning(false);
}

function resume() {
  engine.value?.resume();
  syncState();
  playMusic();
  setEngineRunning(true);
  focusGame();
}

function setBoost(active: boolean) {
  boostHeld.value = active;
  engine.value?.setPointerBoost(active);
}

function setBrake(active: boolean) {
  brakeHeld.value = active;
  engine.value?.setPointerBrake(active);
}

function onKeyDown(event: KeyboardEvent) {
  if (GAME_KEYS.has(event.code)) event.preventDefault();

  if (event.code === "KeyP" || event.code === "Escape") {
    if (state.value === "playing") pause();
    else if (state.value === "paused") resume();
    return;
  }

  if ((event.code === "Space" || event.code === "Enter") && !event.repeat && (state.value === "ready" || state.value === "over")) {
    startGame();
    return;
  }

  if ((event.code === "Space" || event.code === "Enter") && !event.repeat && state.value === "paused") {
    resume();
    return;
  }

  engine.value?.setKey(event.code, true);
}

function onKeyUp(event: KeyboardEvent) {
  engine.value?.setKey(event.code, false);
}

function updatePointerSteer() {
  let steer = 0;
  for (const value of pointers.values()) steer += value;
  engine.value?.setPointerSteer(steer);
}

function pointerSide(event: PointerEvent) {
  const rect = canvasRef.value!.getBoundingClientRect();
  return event.clientX - rect.left < rect.width / 2 ? -1 : 1;
}

function onPointerDown(event: PointerEvent) {
  if (state.value !== "playing") return;
  canvasRef.value?.setPointerCapture(event.pointerId);
  pointers.set(event.pointerId, pointerSide(event));
  updatePointerSteer();
}

function onPointerMove(event: PointerEvent) {
  if (!pointers.has(event.pointerId)) return;
  pointers.set(event.pointerId, pointerSide(event));
  updatePointerSteer();
}

function onPointerUp(event: PointerEvent) {
  if (!pointers.delete(event.pointerId)) return;
  updatePointerSteer();
}

async function loadBest() {
  try {
    const response = await axios.get("/api/games/scores", { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });
    best.value = Number(response.data?.scores?.[GAME_ID] ?? 0);
  } catch {
    best.value = 0;
  }
}

async function saveBest(distance: number) {
  try {
    await axios.post("/api/games/scores", { game: GAME_ID, score: Math.floor(distance) }, { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });
  } catch {}
}

function onGameOver(distance: number) {
  setEngineRunning(false);
  lastDistance.value = distance;
  pointers.clear();
  boostHeld.value = false;
  brakeHeld.value = false;
  if (Math.floor(distance) > best.value) {
    newRecord.value = best.value > 0;
    best.value = Math.floor(distance);
    saveBest(distance);
  }
  syncState();
}

function sizeMinimap() {
  const canvas = minimapRef.value;
  const holder = canvas?.parentElement;
  if (!canvas || !holder) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(holder.clientWidth * ratio);
  canvas.height = Math.round(holder.clientHeight * ratio);
}

watch(state, (next, previous) => {
  if ((next === "playing" || next === "paused") && previous !== "playing" && previous !== "paused") requestAnimationFrame(sizeMinimap);
});

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

  engine.value = new NeonRushEngine(canvasRef.value, {
    onHud: (next) => {
      Object.assign(hud, next);
      engineSound?.update(next.speed, next.boosting, next.offroad, next.drifting);
    },
    onGameOver,
    onHit: () => engineSound?.collision(),
    onRepair: (active) => engineSound?.repair(active),
    onTofu: celebrateTofu,
    onPickup: (pickup) => {
      engineSound?.pickup();
      animatePickup(pickup);
    },
  });
  engine.value.setDropIcons(appIconUrls());

  resizeObserver = new ResizeObserver(([entry]) => {
    engine.value?.resize(entry.contentRect.width, entry.contentRect.height);
    sizeMinimap();
  });
  resizeObserver.observe(root.value);
  engine.value.resize(root.value.clientWidth, root.value.clientHeight);
  engine.value.setMinimap(minimapRef.value);
  sizeMinimap();

  document.addEventListener("visibilitychange", onVisibilityChange);
  if (shouldRender.value) engine.value.run();
  focusGame();
  loadBest();
});

onBeforeUnmount(() => {
  document.removeEventListener("visibilitychange", onVisibilityChange);
  resizeObserver?.disconnect();
  music?.dispose();
  music = null;
  engineSound?.dispose();
  engineSound = null;
  for (const timer of pickupTimers) window.clearTimeout(timer);
  window.clearTimeout(tofuFlashTimer);
  pickupTimers.clear();
  pickupEffects.value = [];
  engine.value?.dispose();
  engine.value = null;
});
</script>

<style scoped>
.neon-rush {
  background: #0b0620;
  touch-action: none;
  font-family: ui-rounded, "SF Pro Rounded", system-ui, sans-serif;
  color: #f5f3ff;
  --hud-panel-height: 5.6rem;
}

.hud-panel {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 8.75rem;
  height: var(--hud-panel-height);
  padding: 0.45rem 0.7rem;
  border-radius: 0.75rem;
  background: rgb(11 6 32 / 0.55);
  border: 1px solid rgb(255 43 214 / 0.35);
  backdrop-filter: blur(6px);
  overflow: hidden;
}

.minimap {
  position: absolute;
  border-radius: 0.75rem;
  background: rgb(11 6 32 / 0.88);
  border: 1px solid rgb(255 43 214 / 0.35);
  backdrop-filter: blur(6px);
  overflow: hidden;
}

.minimap-desktop {
  left: 1rem;
  bottom: 1rem;
  width: clamp(5rem, 12vw, 7.5rem);
  height: clamp(8rem, 26vh, 12rem);
}

.minimap-touch {
  left: 0.75rem;
  top: calc(1rem + var(--hud-panel-height) + 0.5rem);
  width: 4.5rem;
  height: 7.5rem;
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
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 10px rgb(54 224 255 / 0.7);
}

.hud-meter {
  --meter-from: #38e58a;
  --meter-to: #d8ff5f;
  --meter-glow: rgb(56 229 138 / 0.65);
}

.nitro-meter {
  --meter-from: #36e0ff;
  --meter-to: #ff2bd6;
  --meter-glow: rgb(255 43 214 / 0.8);
}

.brakes-meter {
  --meter-from: #ff8a2b;
  --meter-to: #ffe45c;
  --meter-glow: rgb(255 138 43 / 0.75);
}

.hud-meter-critical {
  --meter-from: #ff315c;
  --meter-to: #ff8a5b;
  --meter-glow: rgb(255 49 92 / 0.75);
}

.hud-meter-heading {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--meter-from);
}

.hud-meter-icon {
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
  filter: drop-shadow(0 0 4px var(--meter-glow));
}

.hud-meter-heading .hud-label {
  flex: 1;
  opacity: 0.85;
}

.hud-meter-value {
  font-size: 0.62rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.hud-track {
  height: 0.28rem;
  margin-top: 0.2rem;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.12);
  overflow: hidden;
}

.hud-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--meter-from), var(--meter-to));
  box-shadow: 0 0 8px var(--meter-glow);
  transition:
    width 0.1s linear,
    background 0.2s ease;
}

.hud-unit {
  font-size: 0.65em;
  margin-left: 0.2em;
  opacity: 0.7;
}

.pickup-flight {
  position: absolute;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0.2rem;
  border: 1px solid rgb(54 224 255 / 0.9);
  border-radius: 0.65rem;
  background: rgb(11 6 32 / 0.9);
  color: #36e0ff;
  box-shadow: 0 0 16px rgb(54 224 255 / 0.75);
  transition:
    transform 650ms cubic-bezier(0.18, 0.78, 0.25, 1),
    opacity 650ms ease;
  will-change: transform, opacity;
}

.pickup-flight-active {
  opacity: 0;
}

.pickup-flight img {
  width: 100%;
  height: 100%;
  border-radius: 0.4rem;
  object-fit: cover;
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

.touch-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.08);
  border: 1px solid rgb(255 255 255 / 0.18);
  opacity: 0.8;
}

.boost-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border-radius: 999px;
  background: rgb(255 43 214 / 0.2);
  border: 2px solid rgb(255 43 214 / 0.7);
  color: #ffe45c;
  box-shadow: 0 0 18px rgb(255 43 214 / 0.45);
  touch-action: none;
}

.boost-button-active {
  background: rgb(255 43 214 / 0.5);
  transform: scale(0.94);
}

.brake-button {
  background: rgb(255 138 43 / 0.2);
  border-color: rgb(255 138 43 / 0.7);
  color: #ffd2a8;
  box-shadow: 0 0 18px rgb(255 138 43 / 0.45);
}

.brake-button.boost-button-active {
  background: rgb(255 138 43 / 0.5);
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
  border: 1px solid rgb(255 43 214 / 0.4);
  box-shadow: 0 0 40px rgb(255 43 214 / 0.25);
  backdrop-filter: blur(10px);
  text-align: center;
}

.menu-title {
  font-size: clamp(2rem, 7vw, 3rem);
  font-weight: 800;
  font-style: italic;
  letter-spacing: 0.02em;
  line-height: 1;
  background: linear-gradient(180deg, #ffe45c, #ff2bd6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 12px rgb(255 43 214 / 0.6));
}

.menu-title-small {
  font-size: clamp(1.6rem, 5vw, 2.2rem);
}

.menu-subtitle {
  font-size: 0.8rem;
  opacity: 0.75;
}

.menu-tagline {
  margin-top: 0.45rem;
  font-size: 0.72rem;
  font-weight: 700;
  font-style: italic;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: #36e0ff;
  text-shadow: 0 0 8px rgb(54 224 255 / 0.7);
}

.menu-score {
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
  background: linear-gradient(90deg, #36e0ff, #ff2bd6);
  box-shadow: 0 0 20px rgb(255 43 214 / 0.5);
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
  gap: 1.4rem;
  font-size: 0.75rem;
  opacity: 0.8;
}

.controls-nitro {
  color: #ffe45c;
}

.controls-brake {
  color: #ff8a2b;
}

.controls-health {
  color: #38e58a;
}

.controls-repair {
  width: 0.9rem;
  height: 0.9rem;
  border-radius: 0.2rem;
  background: repeating-linear-gradient(0deg, #38e58a 0 2px, rgb(56 229 138 / 0.25) 2px 4px);
  box-shadow: 0 0 6px rgb(56 229 138 / 0.7);
}

.controls-tofu {
  padding: 0 0.25rem;
  border-radius: 0.2rem;
  background: #fffdf6;
  color: #2a2340;
  font-size: 0.6rem;
  font-weight: 800;
  box-shadow: 0 0 6px rgb(157 255 216 / 0.8);
}

.tofu-flash {
  position: absolute;
  inset: 0;
  z-index: 5;
  background: radial-gradient(circle at 50% 70%, rgb(255 253 246 / 0.75), rgb(157 255 216 / 0.25) 45%, transparent 75%);
  animation: tofu-flash 0.6s ease-out forwards;
}

@keyframes tofu-flash {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

.hud-panel-refill {
  animation: hud-refill 0.9s ease-out;
}

@keyframes hud-refill {
  0% {
    border-color: #fffdf6;
    box-shadow: 0 0 24px rgb(157 255 216 / 0.9);
  }
  100% {
    border-color: rgb(255 43 214 / 0.35);
    box-shadow: none;
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
  box-shadow: 0 4px 14px rgb(255 43 214 / 0.45);
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
