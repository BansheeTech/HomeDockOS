<!-- homedock-ui/vue3/static/js/__Components__/Banners.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div ref="viewport" class="banners-viewport rounded-2xl" @pointerenter="handlePointerEnter" @pointerleave="handlePointerLeave" @mousedown="handleDragStart" @touchstart.passive="handleTouchStart" @touchend.passive="handleTouchRelease" @touchcancel.passive="handleTouchRelease" @scroll.passive="handleScroll" @click.capture="handleClickCapture">
    <div ref="strip" class="banners-strip">
      <span v-for="(banner, index) in loopedBanners" :key="`${index}-${banner.container}`" class="pr-4 rounded-2xl overflow-hidden flex-shrink-0">
        <BannersTilt :appIcon="banner.appIcon" :appName="banner.container" :deskScreen="banner.deskImg" :maxTilt="5" :speed="1000" :glare="true" :maxGlare="0.4">
          <template #image>
            <img class="rounded-2xl" height="250" width="550" draggable="false" :src="banner.src" :alt="banner.alt" :data-container-name="banner.container" />
          </template>
          <template #title>
            <h3>{{ banner.alt }}</h3>
          </template>
          <template #text>
            <p class="text-balance">{{ banner.text }}</p>
          </template>
        </BannersTilt>
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { t } from "../__Languages__";

import BannersTilt from "../__Components__/BannersTilt.vue";

interface BannerData {
  src: string;
  alt: string;
  text: string;
  appIcon: string;
  deskImg: string;
  container: string;
}

const AUTO_SCROLL_SPEED = 9; // px/s
const TOUCH_RESUME_DELAY = 2000; // ms
const DRAG_THRESHOLD = 5; // px

const bannerData: BannerData[] = [
  { alt: "Pi-Hole", container: "pihole", text: t("It's getting annoying... Block it!") },
  { alt: "Plex", container: "plex", text: t("Stream everything, everywhere.") },
  { alt: "WordPress", container: "wordpress", text: t("You're awesome, let the world know.") },
  { alt: "WireGuard", container: "wireguard", text: t("The state-of-the-art VPN solution.") },
  { alt: "Immich", container: "immich", text: t("Where memories safely sleep.") },
  { alt: "WPS Office", container: "wps-office", text: t("Edit your sensitive data on the go.") },
  { alt: "File Browser", container: "filebrowser", text: t("Access all your data. Everywhere.") },
  { alt: "Vaultwarden", container: "vaultwarden", text: t("One password to rule them all.") },
  { alt: "Drawio", container: "drawio", text: t("It may be complex, try with a flowchart.") },
  { alt: "Stirling PDF", container: "stirling-pdf", text: t("All-in-one PDF Editor, anywhere.") },
  { alt: "Ollama GPT", container: "ollama-gpt", text: t("Your private AI Large Language Models.") },
  { alt: "ownCloud", container: "owncloud", text: t("So... Let's talk about storage, you good?") },
  { alt: "Home Assistant", container: "homeassistant", text: t("Its name is clear enough. You need it.") },
].map((banner) => ({
  ...banner,
  src: `/images/banners-bg/${banner.container}.jpg`,
  appIcon: `/images/docker-icons/${banner.container}.jpg`,
  deskImg: `/images/banners-desk/${banner.container}.jpg`,
}));

function pickBanners(): BannerData[] {
  const pool = [...bannerData];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 4);
}

const viewport = ref<HTMLElement | null>(null);
const strip = ref<HTMLElement | null>(null);

const shuffledBanners = ref<BannerData[]>(pickBanners());
const sets = ref(3);
const loopedBanners = computed(() => Array.from({ length: sets.value }, () => shuffledBanners.value).flat());

const isHovering = ref(false);
const isDragging = ref(false);
const hasDragged = ref(false);

let setWidth = 0;
let maxScroll = 0;
let offset = 0;
let selfScroll = 0;
let touchHoldUntil = 0;
let rafId = 0;
let lastFrame = 0;
let dragStartX = 0;
let dragStartScroll = 0;
let resizeObserver: ResizeObserver | null = null;

function applyScroll(value: number) {
  const el = viewport.value;
  if (!el) return;
  offset = Math.min(Math.max(value, 0), maxScroll);
  el.scrollLeft = offset;
  selfScroll = el.scrollLeft;
}

function normalize() {
  const el = viewport.value;
  if (!el || !setWidth) return 0;

  const shift = el.scrollLeft > setWidth * 2 ? -setWidth : el.scrollLeft < setWidth * 0.5 ? setWidth : 0;
  if (shift) applyScroll(el.scrollLeft + shift);

  return shift;
}

function measure() {
  const el = viewport.value;
  const track = strip.value;
  if (!el || !track) return;

  setWidth = track.scrollWidth / sets.value;
  maxScroll = Math.max(track.scrollWidth - el.clientWidth, 0);
  if (!setWidth) return;

  const needed = Math.ceil(el.clientWidth / setWidth) + 2;
  if (needed > sets.value) {
    sets.value = needed;
    nextTick(measure);
    return;
  }

  if (el.scrollLeft < setWidth) applyScroll(setWidth);
}

function isPaused() {
  return isHovering.value || isDragging.value || performance.now() < touchHoldUntil;
}

function tick(timestamp: number) {
  rafId = requestAnimationFrame(tick);

  const delta = lastFrame ? (timestamp - lastFrame) / 1000 : 0;
  lastFrame = timestamp;

  if (!setWidth) measure();
  if (!isPaused() && setWidth) applyScroll(offset + AUTO_SCROLL_SPEED * Math.min(delta, 0.1));
  normalize();
}

function handleScroll() {
  const el = viewport.value;
  if (!el) return;
  if (Math.abs(el.scrollLeft - selfScroll) > 1) offset = el.scrollLeft;
  normalize();
}

function handlePointerEnter(e: PointerEvent) {
  if (e.pointerType === "mouse") isHovering.value = true;
}

function handlePointerLeave(e: PointerEvent) {
  if (e.pointerType === "mouse") isHovering.value = false;
}

function handleTouchStart() {
  isHovering.value = false;
  touchHoldUntil = Infinity;
}

function handleTouchRelease() {
  touchHoldUntil = performance.now() + TOUCH_RESUME_DELAY;
}

function handleDragStart(e: MouseEvent) {
  const el = viewport.value;
  if (!el || e.button === 2 || performance.now() < touchHoldUntil) return;

  isDragging.value = true;
  hasDragged.value = false;
  dragStartX = e.pageX;
  dragStartScroll = el.scrollLeft;

  el.style.cursor = "grabbing";
  el.style.userSelect = "none";

  window.addEventListener("mousemove", handleDragMove);
  window.addEventListener("mouseup", handleDragEnd);
}

function handleDragMove(e: MouseEvent) {
  const el = viewport.value;
  if (!isDragging.value || !el) return;

  e.preventDefault();

  const walk = e.pageX - dragStartX;
  if (Math.abs(walk) > DRAG_THRESHOLD) hasDragged.value = true;

  applyScroll(dragStartScroll - walk);
  dragStartScroll += normalize();
}

function handleDragEnd() {
  const el = viewport.value;
  if (!el) return;

  isDragging.value = false;
  el.style.cursor = "";
  el.style.userSelect = "";

  window.removeEventListener("mousemove", handleDragMove);
  window.removeEventListener("mouseup", handleDragEnd);

  setTimeout(() => {
    hasDragged.value = false;
  }, 50);
}

function handleClickCapture(e: MouseEvent) {
  if (!hasDragged.value) return;
  e.stopPropagation();
  e.preventDefault();
}

onMounted(() => {
  measure();
  if (viewport.value && typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => measure());
    resizeObserver.observe(viewport.value);
  }
  rafId = requestAnimationFrame(tick);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId);
  resizeObserver?.disconnect();
  window.removeEventListener("mousemove", handleDragMove);
  window.removeEventListener("mouseup", handleDragEnd);
});
</script>

<style scoped>
.banners-viewport {
  overflow-x: auto;
  overflow-y: hidden;
  cursor: grab;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.banners-viewport::-webkit-scrollbar {
  display: none;
  height: 0;
  width: 0;
}

.banners-strip {
  display: flex;
  width: max-content;
}
</style>
