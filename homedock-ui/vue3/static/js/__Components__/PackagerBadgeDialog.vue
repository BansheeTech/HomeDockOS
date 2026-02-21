<!-- homedock-ui/vue3/static/js/__Components__/PackagerBadgeDialog.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <AppDialog v-model:visible="visibleModel" type="info" :title="`Share your ${displayName} package`" ok-text="Close" :ok-cancel="false" :width="820" @ok="visibleModel = false">
    <div v-if="app" class="space-y-4">
      <p :class="['text-xs', themeClasses.packagerTextMuted]">Download badges to share your app. Embed them in your README, GitHub repo, docs, or any website.</p>

      <div ref="scrollRef" class="flex items-start gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing select-none" @mousedown="onScrollDown" @mousemove="onScrollMove" @mouseup="onScrollUp" @mouseleave="onScrollUp">
        <div v-for="badge in badgeVariants" :key="badge.key" class="flex flex-col items-center gap-2 flex-shrink-0">
          <div class="rounded-xl overflow-hidden">
            <svg v-if="badge.type === 'per-app'" xmlns="http://www.w3.org/2000/svg" :width="layout.width" :height="layout.totalHeight" :viewBox="`0 0 ${layout.width} ${layout.totalHeight}`" fill="none">
              <defs>
                <clipPath :id="`${badge.key}-outer`"><rect :width="layout.width" :height="layout.totalHeight" :rx="layout.outerRx" /></clipPath>
                <clipPath :id="`${badge.key}-card`"><rect :width="layout.width" :height="layout.cardHeight" /></clipPath>
                <clipPath :id="`${badge.key}-icon`"><rect :x="layout.cardPad" :y="layout.cardPad" :width="layout.iconSize" :height="layout.iconSize" :rx="layout.iconRx" /></clipPath>
                <clipPath :id="`${badge.key}-mini`"><circle :cx="layout.miniCx" :cy="layout.miniCy" :r="layout.miniSize / 2" /></clipPath>
                <filter :id="`${badge.key}-blur`" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="100" />
                </filter>
                <linearGradient :id="`${badge.key}-overlay`" x1="1" y1="0" x2="0" y2="0">
                  <stop offset="0%" stop-color="#000" stop-opacity="0.45" />
                  <stop offset="50%" stop-color="#000" stop-opacity="0.2" />
                  <stop offset="100%" stop-color="#000" stop-opacity="0.1" />
                </linearGradient>
              </defs>
              <g :clip-path="`url(#${badge.key}-outer)`">
                <g :clip-path="`url(#${badge.key}-card)`">
                  <rect :width="layout.width" :height="layout.cardHeight" fill="#1a1a1a" />
                  <image :href="iconUrl" :x="-layout.width * 0.3" :y="-layout.cardHeight * 0.3" :width="layout.width * 1.6" :height="layout.cardHeight * 1.6" :filter="`url(#${badge.key}-blur)`" preserveAspectRatio="xMidYMid slice" />
                  <rect :width="layout.width" :height="layout.cardHeight" :fill="`url(#${badge.key}-overlay)`" />
                  <rect x="0.5" y="0.5" :width="layout.width - 1" :height="layout.cardHeight - 1" fill="none" stroke="white" stroke-opacity="0.15" />
                </g>
                <image :href="iconUrl" :x="layout.cardPad" :y="layout.cardPad" :width="layout.iconSize" :height="layout.iconSize" :clip-path="`url(#${badge.key}-icon)`" />
                <rect :x="layout.cardPad" :y="layout.cardPad" :width="layout.iconSize" :height="layout.iconSize" :rx="layout.iconRx" fill="none" stroke="white" stroke-opacity="0.2" />
                <image :href="iconUrl" :x="layout.miniX" y="12" :width="layout.miniSize" :height="layout.miniSize" :clip-path="`url(#${badge.key}-mini)`" />
                <circle :cx="layout.miniCx" :cy="layout.miniCy" :r="layout.miniSize / 2" fill="none" stroke="white" stroke-opacity="0.15" />
                <text :x="layout.textX" y="37" fill="white" :font-family="FONT_STACK" :font-size="layout.line1FontSize" font-weight="600">{{ layout.line1Text }}</text>
                <text :x="layout.textX" y="55" fill="white" fill-opacity="0.7" :font-family="FONT_STACK" :font-size="layout.line2FontSize" font-weight="400">on the HomeDock OS App Store</text>
                <rect :y="layout.cardHeight" :width="layout.width" :height="layout.skirtHeight" :fill="badge.theme === 'light' ? '#ffffff' : '#111111'" />
                <line x1="0" :y1="layout.cardHeight" :x2="layout.width" :y2="layout.cardHeight" :stroke="badge.theme === 'light' ? '#000000' : '#ffffff'" stroke-opacity="0.06" />
                <g :transform="`translate(${layout.skirtGroupX}, ${layout.logoY}) scale(${layout.logoScale})`">
                  <g :fill="badge.theme === 'light' ? '#000000' : '#ffffff'">
                    <path v-for="(d, i) in LOGO_PATHS" :key="i" :d="d" />
                  </g>
                </g>
                <text :x="layout.skirtTextX" :y="layout.skirtTextY" :fill="badge.theme === 'light' ? '#000000' : '#ffffff'" :font-family="FONT_STACK" :font-size="layout.skirtFontSize" font-weight="500">{{ layout.skirtText }}</text>
                <rect x="0.5" y="0.5" :width="layout.width - 1" :height="layout.totalHeight - 1" :rx="layout.outerRx - 0.5" fill="none" :stroke="badge.theme === 'light' ? '#000000' : '#ffffff'" stroke-opacity="0.12" />
              </g>
            </svg>
            <img v-else :src="`/images/badges/app-store-badge-${badge.theme}.svg`" :alt="`HomeDock OS App Store badge ${badge.theme}`" class="h-[112px] w-auto pointer-events-none" draggable="false" />
          </div>
          <button @click.stop="downloadBadge(badge.type, badge.theme)" :disabled="downloading" :class="[themeClasses.windowBorder, themeClasses.explorerActionButton, themeClasses.explorerActionButtonHover]" class="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all duration-150 text-xs">
            <Icon :icon="downloading ? loadingIcon : downloadIcon" :class="['w-3.5 h-3.5', downloading ? 'animate-spin' : '']" />
            <span>{{ badge.label }}</span>
          </button>
        </div>
      </div>

      <div :class="['rounded-xl border mt-1', themeClasses.windowBorder]">
        <div>
          <button @click.stop="toggleSection('discord')" :class="['flex items-center gap-2 w-full p-3 text-left', themeClasses.packagerText]">
            <Icon :icon="discordIcon" :class="['w-4 h-4 flex-shrink-0', themeClasses.packagerTextMuted]" />
            <span class="text-xs font-medium">Share on Discord</span>
            <Icon :icon="activeSection === 'discord' ? chevronUpIcon : chevronDownIcon" :class="['w-3.5 h-3.5 ml-auto flex-shrink-0', themeClasses.packagerTextMuted]" />
          </button>
          <div class="grid transition-all duration-200 ease-in-out" :style="{ gridTemplateRows: activeSection === 'discord' ? '1fr' : '0fr' }">
            <div class="overflow-hidden">
              <p :class="['text-xs leading-relaxed px-3 pb-3 -mt-1', themeClasses.packagerTextMuted]">Packaged an existing app? Share your <strong>.hds</strong> file with the community in the <strong>#package-sharing</strong> channel on our Discord so other users can install it too.</p>
              <div class="flex items-center gap-2 px-3 pb-3">
                <button @click.stop="openDiscordChannel" :class="['inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 bg-[#5865F2] hover:bg-[#4752C4] text-white']">
                  <Icon :icon="discordIcon" class="w-3.5 h-3.5" />
                  #package-sharing
                </button>
                <button @click.stop="openDiscordInvite" :class="['inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-150', themeClasses.windowBorder, themeClasses.packagerTextMuted, 'hover:opacity-80']">
                  <Icon :icon="accountGroupIcon" class="w-3.5 h-3.5" />
                  Join Discord
                </button>
              </div>
            </div>
          </div>
        </div>
        <div :class="['border-t', themeClasses.windowBorder]">
          <button @click.stop="toggleSection('email')" :class="['flex items-center gap-2 w-full p-3 text-left', themeClasses.packagerText]">
            <Icon :icon="emailIcon" :class="['w-4 h-4 flex-shrink-0', themeClasses.packagerTextMuted]" />
            <span class="text-xs font-medium">Submit your apps to the App Store</span>
            <Icon :icon="activeSection === 'email' ? chevronUpIcon : chevronDownIcon" :class="['w-3.5 h-3.5 ml-auto flex-shrink-0', themeClasses.packagerTextMuted]" />
          </button>
          <div class="grid transition-all duration-200 ease-in-out" :style="{ gridTemplateRows: activeSection === 'email' ? '1fr' : '0fr' }">
            <div class="overflow-hidden">
              <p :class="['text-xs leading-relaxed px-3 pb-3 -mt-1', themeClasses.packagerTextMuted]">
                Built your own app? Package it as <strong>.hds</strong> and send it to
                <button @click.stop="copyEmail" :class="['inline-flex items-center gap-0.5 font-medium underline decoration-dotted underline-offset-2 hover:opacity-80 transition-opacity', themeClasses.packagerText]">
                  apps@homedock.cloud
                  <Icon :icon="emailCopied ? checkIcon : copyIcon" class="w-3 h-3 inline" /></button
                >. We support indie developers and list their apps on the official App Store for free. We're a small team, so reviews may take some time. We'll reach out back for screenshots and details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppDialog>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { useTheme } from "../__Themes__/ThemeSelector";
import { Icon } from "@iconify/vue";

import AppDialog from "./AppDialog.vue";

import downloadIcon from "@iconify-icons/mdi/download";
import loadingIcon from "@iconify-icons/mdi/loading";
import checkIcon from "@iconify-icons/mdi/check-circle";
import copyIcon from "@iconify-icons/mdi/content-copy";
import chevronDownIcon from "@iconify-icons/mdi/chevron-down";
import chevronUpIcon from "@iconify-icons/mdi/chevron-up";
import emailIcon from "@iconify-icons/mdi/email-outline";
import discordIcon from "@iconify-icons/mdi/discord";
import accountGroupIcon from "@iconify-icons/mdi/account-group";

interface PackageManifest {
  name: string;
  display_name?: string;
  icon?: string;
  description?: string;
  docker_image?: string;
  version?: string;
  category?: string;
}

interface PackageApp {
  filename: string;
  manifest: PackageManifest;
  is_installed?: boolean;
}

const props = defineProps<{
  app: PackageApp | null;
}>();

const visibleModel = defineModel<boolean>("visible", { default: false });

const { themeClasses } = useTheme();

const LOGO_PATHS = ["M1 660.333C5.887 646.603 10.89 633.248 15.642 619.803C58.257 499.219 100.827 378.618 143.414 258.024C168.377 187.336 193.358 116.654 218.274 45.948C219.192 43.345 220.134 41.944 223.376 41.971C245.706 42.152 268.038 42.048 290.37 42.069C427.678 42.196 564.986 42.331 702.647 42.232C703 42.444 703 42.889 702.861 44.043C702.646 65.186 702.582 85.619 702.469 106.051C702.458 108.015 702.138 109.978 701.961 111.941C662.645 111.961 623.329 111.994 584.013 111.997C480.556 112.005 377.1 112.031 273.643 111.887C269.549 111.881 268.038 113.158 266.728 116.874C223.624 239.18 180.383 361.438 137.182 483.711C116.741 541.566 96.317 599.428 75.989 657.324C74.784 660.755 73.283 662.088 69.405 662.047C46.917 661.809 24.425 661.921 1.467 661.958C1 661.556 1 661.111 1 660.333Z", "M703 504.667C701.447 505.333 699.894 505.957 698.341 505.958C637.685 506.004 577.029 505.994 516.373 505.984C516.046 505.984 515.718 505.891 514.555 505.713C533.602 453.589 552.592 401.622 571.735 349.233C526.975 349.233 482.896 349.233 438.362 349.233C432.456 365.475 426.516 381.867 420.538 398.245C390.831 479.624 361.116 561 331.398 642.375C329.366 647.938 327.421 653.541 325.121 658.993C324.59 660.253 322.771 661.8 321.533 661.81C300.049 661.981 278.563 661.933 256.395 661.933C259.885 652.267 263.212 642.984 266.587 633.719C304.242 530.371 341.905 427.027 379.561 323.68C384.413 310.363 389.313 297.062 394.016 283.693C395.102 280.607 396.549 279.439 400.022 279.443C487.007 279.561 573.992 279.535 660.977 279.545C662.277 279.546 663.577 279.692 665.494 279.808C646.438 331.947 627.527 383.692 608.386 436.066C622.175 436.066 635.281 436.066 648.387 436.066C659.366 436.066 659.346 436.059 663.038 425.958C675.249 392.547 687.468 359.14 699.72 325.744C700.275 324.23 701.171 322.84 702.133 322.088C702.24 323.936 702.02 325.089 702.02 326.243C702.002 383.774 701.997 441.305 702.044 498.836C702.045 500.224 702.667 501.612 703 503C703 503.444 703 503.889 703 504.667Z", "M701.936 160.628C702.394 183.487 702.357 206.274 702.14 229.499C619.798 229.957 537.636 229.981 455.475 229.999C423.477 230.006 391.478 230.072 359.481 229.905C355.717 229.885 354.087 230.943 352.817 234.552C321.33 324.052 289.717 413.508 258.099 502.962C239.797 554.741 221.433 606.498 203.162 658.288C202.392 660.468 201.927 662.024 198.979 662.006C175.981 661.866 152.982 661.918 129.984 661.895C129.698 661.895 129.412 661.689 128.678 661.407C132.3 651.089 135.909 640.757 139.554 630.438C194.388 475.226 249.249 320.023 303.937 164.759C305.35 160.747 307.184 159.951 310.999 159.983C331.663 160.159 352.33 160.041 372.995 160.071C482.477 160.225 591.959 160.393 701.936 160.628Z"];

const LOGO_PATHS_STR = LOGO_PATHS.map((d) => `<path d="${d}"/>`).join("");
const FONT_STACK = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const downloading = ref(false);
const emailCopied = ref(false);
const activeSection = ref<"discord" | "email" | null>("discord");

const scrollRef = ref<HTMLElement | null>(null);
const dragging = ref(false);
const dragStartX = ref(0);
const dragScrollLeft = ref(0);

const displayName = computed(() => props.app?.manifest?.display_name || props.app?.manifest?.name || "App");
const slug = computed(() => props.app?.manifest?.name || "app");

const iconUrl = computed(() => {
  if (!props.app?.manifest?.name || !props.app?.manifest?.icon) return "";
  const ext = props.app.manifest.icon.substring(props.app.manifest.icon.lastIndexOf("."));
  return `/images/user-images/${props.app.manifest.name}${ext}`;
});

const layout = computed(() => computeLayout(displayName.value));

const badgeVariants = computed(() => [
  { key: `badge-${slug.value}-light`, type: "per-app", theme: "light", label: "Custom Light .png" },
  { key: `badge-${slug.value}-dark`, type: "per-app", theme: "dark", label: "Custom Dark .png" },
  { key: "badge-generic-light", type: "generic", theme: "light", label: "Branding Light .png" },
  { key: "badge-generic-dark", type: "generic", theme: "dark", label: "Branding Dark .png" },
]);

function computeLayout(name: string) {
  const cardPad = 14;
  const iconSize = 56;
  const iconRx = 14;
  const iconGap = 14;
  const cardHeight = cardPad + iconSize + cardPad;
  const skirtHeight = 28;
  const totalHeight = cardHeight + skirtHeight;
  const outerRx = 20;
  const textX = cardPad + iconSize + iconGap;
  const line1Text = `Get ${name}`;
  const line1FontSize = 16;
  const line2FontSize = 12;
  const line1Width = line1Text.length * line1FontSize * 0.58;
  const line2Width = 28 * line2FontSize * 0.5;
  const width = Math.max(300, Math.ceil(textX + Math.max(line1Width, line2Width) + 16));
  const miniSize = 20;
  const miniX = width - 12 - miniSize;
  const miniCx = miniX + miniSize / 2;
  const miniCy = 12 + miniSize / 2;
  const logoScale = 0.025;
  const logoH = Math.round(662 * logoScale);
  const logoW = Math.round(703 * logoScale);
  const logoTopDead = Math.round(42 * logoScale);
  const skirtText = "Available on the HomeDock OS App Store";
  const skirtFontSize = 11;
  const logoTextGap = 8;
  const skirtTextW = skirtText.length * skirtFontSize * 0.54;
  const skirtGroupW = logoW + logoTextGap + skirtTextW;
  const skirtGroupX = Math.round((width - skirtGroupW) / 2);
  const logoY = cardHeight + Math.round((skirtHeight - logoH) / 2) - logoTopDead;
  const skirtTextX = skirtGroupX + logoW + logoTextGap;
  const skirtTextY = cardHeight + Math.round(skirtHeight / 2) + 4;

  return {
    cardPad,
    iconSize,
    iconRx,
    iconGap,
    cardHeight,
    skirtHeight,
    totalHeight,
    outerRx,
    textX,
    line1Text,
    line1FontSize,
    line2FontSize,
    width,
    miniSize,
    miniX,
    miniCx,
    miniCy,
    logoScale,
    logoY,
    skirtGroupX,
    skirtTextX,
    skirtTextY,
    skirtText,
    skirtFontSize,
  };
}

const onScrollDown = (e: MouseEvent) => {
  if (!scrollRef.value) return;
  dragging.value = true;
  dragStartX.value = e.pageX - scrollRef.value.offsetLeft;
  dragScrollLeft.value = scrollRef.value.scrollLeft;
};
const onScrollMove = (e: MouseEvent) => {
  if (!dragging.value || !scrollRef.value) return;
  e.preventDefault();
  const x = e.pageX - scrollRef.value.offsetLeft;
  scrollRef.value.scrollLeft = dragScrollLeft.value - (x - dragStartX.value);
};
const onScrollUp = () => {
  dragging.value = false;
};

const toggleSection = (section: "discord" | "email") => {
  activeSection.value = activeSection.value === section ? null : section;
};

const openDiscordChannel = () => {
  window.open("https://discord.com/channels/1381296490923954226/1467490625384349790", "_blank", "noopener,noreferrer");
};

const openDiscordInvite = () => {
  window.open("https://discord.gg/Zj3JCYsRWw", "_blank", "noopener,noreferrer");
};

const copyEmail = async () => {
  try {
    await navigator.clipboard.writeText("apps@homedock.cloud");
    emailCopied.value = true;
    setTimeout(() => {
      emailCopied.value = false;
    }, 2000);
  } catch {
    /* noop */
  }
};

const escapeXml = (str: string) => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const fetchIconBase64 = async (): Promise<string | null> => {
  try {
    const res = await fetch(iconUrl.value);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  } catch {
    return null;
  }
};

const buildSvgString = (name: string, theme: string, iconBase64: string | null) => {
  const L = computeLayout(name);
  const isLight = theme === "light";
  const skirtBg = isLight ? "#ffffff" : "#111111";
  const skirtFg = isLight ? "#000000" : "#ffffff";
  const iconHref = iconBase64 ? `data:image/webp;base64,${iconBase64}` : "";

  let bgFrag = "";
  let iconFrag = "";
  let miniFrag = "";

  if (iconBase64) {
    bgFrag = `<image href="${iconHref}" x="${-L.width * 0.3}" y="${-L.cardHeight * 0.3}" width="${L.width * 1.6}" height="${L.cardHeight * 1.6}" filter="url(#bg-blur)" preserveAspectRatio="xMidYMid slice"/>`;
    iconFrag = `<image href="${iconHref}" x="${L.cardPad}" y="${L.cardPad}" width="${L.iconSize}" height="${L.iconSize}" clip-path="url(#icon-clip)"/><rect x="${L.cardPad}" y="${L.cardPad}" width="${L.iconSize}" height="${L.iconSize}" rx="${L.iconRx}" fill="none" stroke="white" stroke-opacity="0.2"/>`;
    miniFrag = `<image href="${iconHref}" x="${L.miniX}" y="12" width="${L.miniSize}" height="${L.miniSize}" clip-path="url(#mini-clip)"/><circle cx="${L.miniCx}" cy="${L.miniCy}" r="${L.miniSize / 2}" fill="none" stroke="white" stroke-opacity="0.15"/>`;
  } else {
    iconFrag = `<rect x="${L.cardPad}" y="${L.cardPad}" width="${L.iconSize}" height="${L.iconSize}" rx="${L.iconRx}" fill="#333"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${L.width}" height="${L.totalHeight}" viewBox="0 0 ${L.width} ${L.totalHeight}" fill="none">
  <defs>
    <clipPath id="outer-clip"><rect width="${L.width}" height="${L.totalHeight}" rx="${L.outerRx}"/></clipPath>
    <clipPath id="card-clip"><rect width="${L.width}" height="${L.cardHeight}"/></clipPath>
    <clipPath id="icon-clip"><rect x="${L.cardPad}" y="${L.cardPad}" width="${L.iconSize}" height="${L.iconSize}" rx="${L.iconRx}"/></clipPath>
    <clipPath id="mini-clip"><circle cx="${L.miniCx}" cy="${L.miniCy}" r="${L.miniSize / 2}"/></clipPath>
    <filter id="bg-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceGraphic" stdDeviation="100"/></filter>
    <linearGradient id="dark-overlay" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0%" stop-color="#000" stop-opacity="0.45"/>
      <stop offset="50%" stop-color="#000" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.1"/>
    </linearGradient>
  </defs>
  <g clip-path="url(#outer-clip)">
    <g clip-path="url(#card-clip)">
      <rect width="${L.width}" height="${L.cardHeight}" fill="#1a1a1a"/>
      ${bgFrag}
      <rect width="${L.width}" height="${L.cardHeight}" fill="url(#dark-overlay)"/>
      <rect x="0.5" y="0.5" width="${L.width - 1}" height="${L.cardHeight - 1}" fill="none" stroke="white" stroke-opacity="0.15"/>
    </g>
    ${iconFrag}
    ${miniFrag}
    <text x="${L.textX}" y="37" fill="white" font-family="${FONT_STACK}" font-size="${L.line1FontSize}" font-weight="600">${escapeXml(L.line1Text)}</text>
    <text x="${L.textX}" y="55" fill="white" fill-opacity="0.7" font-family="${FONT_STACK}" font-size="${L.line2FontSize}" font-weight="400">on the HomeDock OS App Store</text>
    <rect y="${L.cardHeight}" width="${L.width}" height="${L.skirtHeight}" fill="${skirtBg}"/>
    <line x1="0" y1="${L.cardHeight}" x2="${L.width}" y2="${L.cardHeight}" stroke="${skirtFg}" stroke-opacity="0.06"/>
    <g transform="translate(${L.skirtGroupX}, ${L.logoY}) scale(${L.logoScale})">
      <g fill="${skirtFg}">${LOGO_PATHS_STR}</g>
    </g>
    <text x="${L.skirtTextX}" y="${L.skirtTextY}" fill="${skirtFg}" font-family="${FONT_STACK}" font-size="${L.skirtFontSize}" font-weight="500">${L.skirtText}</text>
    <rect x="0.5" y="0.5" width="${L.width - 1}" height="${L.totalHeight - 1}" rx="${L.outerRx - 0.5}" fill="none" stroke="${skirtFg}" stroke-opacity="0.12"/>
  </g>
</svg>`;
};

const svgToPng = (svgString: string, scale = 4): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))), "image/png");
    };
    img.onerror = () => reject(new Error("SVG load failed"));
    img.src = dataUrl;
  });
};

const downloadBadge = async (type: string, theme: string) => {
  if (downloading.value) return;
  downloading.value = true;

  try {
    let svgString: string;
    let filename: string;

    if (type === "generic") {
      const res = await fetch(`/images/badges/app-store-badge-${theme}.svg`);
      svgString = await res.text();
      filename = `app-store-badge-${theme}.png`;
    } else {
      const iconBase64 = await fetchIconBase64();
      svgString = buildSvgString(displayName.value, theme, iconBase64);
      filename = `${slug.value}-badge-${theme}.png`;
    }

    const pngBlob = await svgToPng(svgString);
    const url = URL.createObjectURL(pngBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } finally {
    downloading.value = false;
  }
};
</script>
