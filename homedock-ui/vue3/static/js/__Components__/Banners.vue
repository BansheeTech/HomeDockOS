<!-- homedock-ui/vue3/static/js/__Components__/Banners.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="banners-root relative" @pointerenter="hovering = true" @pointerleave="hovering = false" @focusin="onFocusIn" @focusout="focused = false">
    <div ref="viewport" class="banners-viewport" @scroll.passive="updateEdges" @pointerdown="markInteraction" @wheel.passive="markInteraction" @touchstart.passive="markInteraction">
      <div v-for="(banner, index) in banners" :key="banner.container" role="button" tabindex="0" class="banner-card relative overflow-hidden rounded-xl cursor-pointer" @click="openBanner(banner)" @keydown.enter="openBanner(banner)">
        <img class="banner-bg absolute inset-0 w-full h-full object-cover" :style="{ animationDelay: `${-index * 7}s` }" draggable="false" :src="banner.src" alt="" />
        <div class="banner-front absolute inset-0">
          <div class="absolute inset-0 bg-linear-to-r/srgb from-black/60 via-black/25 to-transparent"></div>
          <div :class="[appearance === 'cupertino' ? 'desk-cupertino' : 'desk-redmond']" class="banner-desk absolute">
            <div :class="[themeClasses.screenshotThumb, themeClasses.screenshotImageBg]" class="desk-window relative w-full h-full flex flex-col overflow-hidden border shadow-xl">
              <div v-if="appearance === 'cupertino'" :class="[themeClasses.screenshotWindowBar]" class="desk-bar relative flex-shrink-0 flex items-center border-b">
                <div class="desk-lights flex flex-shrink-0">
                  <span v-for="color in TRAFFIC_LIGHTS" :key="color" :class="color" class="desk-light rounded-full"></span>
                </div>
                <div class="desk-title-center absolute inset-y-0 flex items-center justify-center min-w-0">
                  <div class="desk-icon flex-shrink-0"><AppIconGraphic :image-src="banner.appIcon" fluid /></div>
                  <span :class="[themeClasses.screenshotWindowTitle]" class="desk-title truncate">{{ banner.alt }}</span>
                </div>
              </div>
              <div v-else :class="[themeClasses.screenshotWindowBar]" class="desk-bar flex-shrink-0 flex items-center border-b">
                <div class="desk-icon flex-shrink-0"><AppIconGraphic :image-src="banner.appIcon" fluid /></div>
                <span :class="[themeClasses.screenshotWindowTitle]" class="desk-title flex-1 min-w-0 truncate">{{ banner.alt }}</span>
                <div :class="[themeClasses.screenshotWindowTitle]" class="desk-controls flex items-center flex-shrink-0">
                  <Icon v-for="control in WINDOW_CONTROLS" :key="control.name" :icon="control.icon" />
                </div>
              </div>
              <img class="flex-1 min-h-0 w-full object-cover object-left-top" draggable="false" :src="banner.deskImg" alt="" />
            </div>
          </div>

          <div class="banner-body absolute flex flex-col text-white">
            <div class="flex items-center gap-3">
              <div class="banner-icon flex-shrink-0">
                <AppIconGraphic :image-src="banner.appIcon" fluid />
              </div>
              <span class="h-7 px-4 inline-flex items-center rounded-full bg-white/20 backdrop-blur-md text-xs font-bold transition-colors duration-150 hover:bg-white/30" @click.stop="primaryAction(banner)">{{ isInstalled(banner) ? $t("Open") : $t("Get") }}</span>
            </div>
            <div class="mt-auto min-w-0">
              <h3 class="banner-title m-0 font-bold truncate">{{ banner.alt }}</h3>
              <p class="banner-text m-0 text-white/85 text-balance">{{ banner.text }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <button v-if="canScrollBack" type="button" :aria-label="$t('Previous')" class="banner-arrow left-2" @click="scrollByPage(-1)">
      <Icon :icon="chevronLeftIcon" class="w-5 h-5" />
    </button>
    <button v-if="canScrollForward" type="button" :aria-label="$t('Next')" class="banner-arrow right-2" @click="scrollByPage(1)">
      <Icon :icon="chevronRightIcon" class="w-5 h-5" />
    </button>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { t } from "../__Languages__";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useAppStore } from "../__Stores__/useAppStore";
import { useAppStoreActions } from "../__Composables__/useAppStoreActions";

import { Icon } from "@iconify/vue";
import chevronLeftIcon from "@iconify-icons/mdi/chevron-left";
import chevronRightIcon from "@iconify-icons/mdi/chevron-right";
import windowMinimizeIcon from "@iconify-icons/mdi/window-minimize";
import windowMaximizeIcon from "@iconify-icons/mdi/window-maximize";
import windowCloseIcon from "@iconify-icons/mdi/close";

import AppIconGraphic from "../__Components__/AppIconGraphic.vue";

interface BannerData {
  src: string;
  alt: string;
  text: string;
  appIcon: string;
  deskImg: string;
  container: string;
}

const BANNER_COUNT = 6;
const AUTOPLAY_INTERVAL = 6000;
const INTERACTION_COOLDOWN = 10000;
const TRAFFIC_LIGHTS = ["bg-red-500", "bg-yellow-500", "bg-green-500"];
const WINDOW_CONTROLS = [
  { name: "minimize", icon: windowMinimizeIcon },
  { name: "maximize", icon: windowMaximizeIcon },
  { name: "close", icon: windowCloseIcon },
];

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
  return pool.slice(0, BANNER_COUNT);
}

const { themeClasses, appearance } = useTheme();
const appStore = useAppStore();
const { findStoreApp, openAppDetails, openInstalledApp } = useAppStoreActions();

const banners = ref<BannerData[]>(pickBanners());

const viewport = ref<HTMLElement | null>(null);
const canScrollBack = ref(false);
const canScrollForward = ref(false);

const hovering = ref(false);
const focused = ref(false);

let resizeObserver: ResizeObserver | null = null;
let autoplayTimer: number | null = null;
let lastInteraction = 0;

function markInteraction() {
  lastInteraction = Date.now();
}

function onFocusIn(event: FocusEvent) {
  focused.value = (event.target as Element).matches(":focus-visible");
}

function advance() {
  const el = viewport.value;
  const card = el?.firstElementChild as HTMLElement | null;
  if (!el || !card || hovering.value || focused.value || document.hidden) return;
  if (Date.now() - lastInteraction < INTERACTION_COOLDOWN) return;
  if (el.scrollWidth <= el.clientWidth + 4) return;
  const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
  const step = card.offsetWidth + parseFloat(getComputedStyle(el).columnGap || "0");
  el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + step, behavior: "smooth" });
}

function updateEdges() {
  const el = viewport.value;
  if (!el) return;
  canScrollBack.value = el.scrollLeft > 4;
  canScrollForward.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
}

function scrollByPage(direction: number) {
  const el = viewport.value;
  if (!el) return;
  markInteraction();
  el.scrollBy({ left: direction * el.clientWidth, behavior: "smooth" });
}

function isInstalled(banner: BannerData): boolean {
  return Boolean(findStoreApp(banner.container)?.is_installed);
}

function openBanner(banner: BannerData) {
  const app = findStoreApp(banner.container);
  if (app) openAppDetails(app);
}

function primaryAction(banner: BannerData) {
  const app = findStoreApp(banner.container);
  if (!app) return;
  if (app.is_installed) openInstalledApp(app);
  else openAppDetails(app);
}

watch(
  () => appStore.apps.length,
  () => nextTick(updateEdges),
);

onMounted(() => {
  updateEdges();
  if (viewport.value) {
    resizeObserver = new ResizeObserver(() => updateEdges());
    resizeObserver.observe(viewport.value);
  }
  autoplayTimer = window.setInterval(advance, AUTOPLAY_INTERVAL);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  if (autoplayTimer !== null) window.clearInterval(autoplayTimer);
});
</script>

<style scoped>
.banners-viewport {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 88%;
  gap: 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
}

.banners-viewport::-webkit-scrollbar {
  display: none;
}

@container appstore-content (min-width: 640px) {
  .banners-viewport {
    grid-auto-columns: calc((100% - 16px) / 2);
  }
}

.banner-card {
  scroll-snap-align: start;
  aspect-ratio: 1150 / 500;
  container-type: inline-size;
  background: #1f2937;
}

.banner-front {
  will-change: transform;
}

.banner-body {
  inset: 7cqw 45cqw 6cqw 6cqw;
}

.banner-icon {
  width: 13cqw;
  height: 13cqw;
  min-width: 36px;
  min-height: 36px;
}

.banner-title {
  font-size: clamp(14px, 4.6cqw, 24px);
  line-height: 1.2;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}

.banner-text {
  font-size: clamp(11px, 3cqw, 15px);
  line-height: 1.3;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}

.banner-bg {
  transform-origin: 30% 50%;
  animation: banner-drift 24s ease-in-out infinite alternate;
  will-change: transform;
}

@keyframes banner-drift {
  from {
    transform: scale(1.04) translate3d(0, 0, 0);
  }
  to {
    transform: scale(1.14) translate3d(-2.5%, -1.5%, 0);
  }
}

.banner-desk {
  right: 4cqw;
  bottom: 0;
  width: 38cqw;
  height: 32cqw;
  transform: translateY(2cqw);
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.banner-desk::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
  opacity: 0;
  transition: opacity 0.35s ease;
}

.banner-card:hover .banner-desk {
  transform: translateY(0);
}

.banner-card:hover .banner-desk::before {
  opacity: 1;
}

.desk-window {
  border-radius: inherit;
  border-bottom: 0;
}

.desk-cupertino {
  border-radius: clamp(6px, 1.4cqw, 10px) clamp(6px, 1.4cqw, 10px) 0 0;
}

.desk-redmond {
  border-radius: clamp(4px, 0.8cqw, 6px) clamp(4px, 0.8cqw, 6px) 0 0;
}

.desk-bar {
  height: clamp(16px, 3.6cqw, 28px);
  padding: 0 clamp(6px, 1.4cqw, 12px);
  gap: clamp(4px, 0.9cqw, 8px);
}

.desk-lights {
  gap: clamp(3px, 0.6cqw, 6px);
}

.desk-light {
  width: clamp(5px, 1cqw, 9px);
  height: clamp(5px, 1cqw, 9px);
}

.desk-title-center {
  left: clamp(30px, 7cqw, 56px);
  right: clamp(30px, 7cqw, 56px);
  gap: clamp(3px, 0.7cqw, 6px);
}

.desk-icon {
  width: clamp(9px, 2cqw, 16px);
  height: clamp(9px, 2cqw, 16px);
}

.desk-title {
  font-size: clamp(8px, 1.7cqw, 12px);
  line-height: 1;
}

.desk-controls {
  gap: clamp(5px, 1.2cqw, 10px);
  font-size: clamp(7px, 1.5cqw, 11px);
}

.banner-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.85);
  color: #111827;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.banners-root:hover .banner-arrow {
  opacity: 1;
}
</style>
