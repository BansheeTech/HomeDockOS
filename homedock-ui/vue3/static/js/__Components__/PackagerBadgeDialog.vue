<!-- homedock-ui/vue3/static/js/__Components__/PackagerBadgeDialog.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <AppDialog v-model:visible="visibleModel" type="info" :title="$t('Share your {name} package', { name: displayName })" :ok-text="$t('Close')" :ok-cancel="false" :width="720" @ok="visibleModel = false">
    <div v-if="app" class="badge-dialog space-y-5">
      <div class="flex items-center gap-3.5">
        <AppIconGraphic v-if="iconUrl" :image-src="iconUrl" :size="56" />
        <AppIconGraphic v-else :icon="packageIcon" :size="56" />
        <div class="min-w-0">
          <p :class="[themeClasses.storeModalAppName]" class="m-0 text-base font-bold truncate">{{ displayName }}</p>
          <p :class="[themeClasses.storeCardSubtitle]" class="m-0 mt-0.5 text-xs leading-relaxed">{{ $t("Download badges to share your app. Embed them in your README, GitHub repo, docs, or any website.") }}</p>
        </div>
      </div>

      <section>
        <div class="flex justify-center">
          <SegmentedControl :model-value="kind" :options="kindOptions" @update:model-value="selectKind" />
        </div>
        <p :class="[themeClasses.storeCardSubtitle]" class="m-0 mt-2.5 px-1 text-xs leading-relaxed text-center">{{ $t(KIND_DESCRIPTIONS[kind]) }}</p>
        <div :class="[themeClasses.storeInfoBar]" class="mt-2 rounded-2xl border p-4">
          <Transition name="kind-fade" mode="out-in">
            <div :key="kind" class="badge-grid grid items-end gap-4">
              <div v-for="badge in badges" :key="badge.theme" class="flex flex-col items-center gap-2.5 min-w-0">
                <img :src="badge.preview" :alt="`${displayName} · ${badge.label}`" class="block w-full h-auto select-none" draggable="false" />
                <button type="button" :disabled="!!downloadingKey" :class="[themeClasses.storeCardGetPill]" class="flex items-center gap-1.5 h-7 px-3.5 rounded-full text-xs font-semibold cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-default" @click="downloadBadge(badge)">
                  <Icon :icon="downloadingKey === `${kind}-${badge.theme}` ? loadingIcon : downloadIcon" :class="downloadingKey === `${kind}-${badge.theme}` ? 'animate-spin' : ''" class="w-3.5 h-3.5" />
                  <span>{{ badge.label }}</span>
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </section>

      <section>
        <h2 :class="[themeClasses.storeCardSubtitle]" class="m-0 mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider">{{ $t("Share with the community") }}</h2>
        <div :class="[themeClasses.storeInfoBar]" class="rounded-xl border overflow-hidden">
          <button type="button" :aria-expanded="openRow === 'discord'" :class="[themeClasses.storeRowHover]" class="flex items-center gap-3 w-full px-3 py-2.5 bg-transparent border-0 text-left cursor-pointer transition-colors duration-150" @click="toggleRow('discord')">
            <AppIconGraphic :icon="discordIcon" color="#5865F2" :size="28" />
            <span :class="[themeClasses.storeModalAppName]" class="flex-1 min-w-0 text-[13px] font-semibold truncate">{{ $t("Share on Discord") }}</span>
            <Icon :icon="chevronIcon" :class="[themeClasses.storeCardSubtitle, openRow === 'discord' ? 'rotate-90' : '']" class="w-4 h-4 flex-shrink-0 transition-transform duration-200" />
          </button>
          <div class="accordion-body" :class="{ 'is-open': openRow === 'discord' }">
            <div class="overflow-hidden">
              <div class="pl-[52px] pr-3 pb-3">
                <p :class="[themeClasses.storeCardSubtitle]" class="m-0 text-xs leading-relaxed">{{ $t("Packaged an existing app? Share your .hds file with the community in the #package-sharing channel on our Discord so other users can install it too.") }}</p>
                <div class="flex flex-wrap items-center gap-2 mt-2.5">
                  <button type="button" class="flex items-center gap-1.5 h-7 px-3.5 rounded-full text-xs font-semibold cursor-pointer bg-[#5865F2] text-white transition-colors duration-150 hover:bg-[#4752C4]" @click="openDiscordChannel">
                    <Icon :icon="discordIcon" class="w-3.5 h-3.5" />
                    <span>#package-sharing</span>
                  </button>
                  <button type="button" :class="[themeClasses.storeCardInstalledPill]" class="flex items-center gap-1.5 h-7 px-3.5 rounded-full text-xs font-semibold cursor-pointer transition-colors duration-150" @click="openDiscordInvite">
                    <Icon :icon="accountGroupIcon" class="w-3.5 h-3.5" />
                    <span>{{ $t("Join Discord") }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div :class="[themeClasses.storeInfoBarDivider]" class="h-px ml-[52px]"></div>

          <button type="button" :aria-expanded="openRow === 'submit'" :class="[themeClasses.storeRowHover]" class="flex items-center gap-3 w-full px-3 py-2.5 bg-transparent border-0 text-left cursor-pointer transition-colors duration-150" @click="toggleRow('submit')">
            <AppIconGraphic :icon="emailIcon" color="#3b82f6" :size="28" />
            <span :class="[themeClasses.storeModalAppName]" class="flex-1 min-w-0 text-[13px] font-semibold truncate">{{ $t("Submit your apps to the App Store") }}</span>
            <Icon :icon="chevronIcon" :class="[themeClasses.storeCardSubtitle, openRow === 'submit' ? 'rotate-90' : '']" class="w-4 h-4 flex-shrink-0 transition-transform duration-200" />
          </button>
          <div class="accordion-body" :class="{ 'is-open': openRow === 'submit' }">
            <div class="overflow-hidden">
              <div class="pl-[52px] pr-3 pb-3">
                <p :class="[themeClasses.storeCardSubtitle]" class="m-0 text-xs leading-relaxed">{{ $t("Built your own app? Package it as .hds and send it to") }} apps@homedock.cloud. {{ $t("We support indie developers and list their apps on the official App Store for free. We're a small team, so reviews may take some time. We'll reach out back for screenshots and details.") }}</p>
                <div class="flex flex-wrap items-center gap-2 mt-2.5">
                  <button type="button" :class="[themeClasses.storeCardGetPill]" class="flex items-center gap-1.5 h-7 px-3.5 rounded-full text-xs font-semibold cursor-pointer transition-colors duration-150" @click="copyEmail">
                    <Icon :icon="emailCopied ? checkIcon : copyIcon" class="w-3.5 h-3.5" />
                    <span class="select-text">apps@homedock.cloud</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </AppDialog>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useTheme } from "../__Themes__/ThemeSelector";
import { rasterizeAppIcon } from "../__Utils__/AppIconArtwork";

import { Icon } from "@iconify/vue";
import downloadIcon from "@iconify-icons/mdi/tray-arrow-down";
import loadingIcon from "@iconify-icons/mdi/loading";
import checkIcon from "@iconify-icons/mdi/check";
import copyIcon from "@iconify-icons/mdi/content-copy";
import emailIcon from "@iconify-icons/mdi/email-outline";
import discordIcon from "@iconify-icons/mdi/discord";
import accountGroupIcon from "@iconify-icons/mdi/account-group";
import packageIcon from "@iconify-icons/mdi/package-variant";
import chevronIcon from "@iconify-icons/mdi/chevron-right";
import storeIcon from "@iconify-icons/mdi/storefront-outline";
import heartIcon from "@iconify-icons/mdi/heart-outline";
import tagIcon from "@iconify-icons/mdi/tag-outline";

import AppDialog from "./AppDialog.vue";
import AppIconGraphic from "./AppIconGraphic.vue";
import SegmentedControl from "./SegmentedControl.vue";

type BadgeKind = "appstore" | "support" | "branding";
type BadgeTheme = "dark" | "light";

interface PackageManifest {
  name: string;
  display_name?: string;
  icon?: string;
}

interface PackageApp {
  filename: string;
  manifest: PackageManifest;
}

interface BadgeVariant {
  theme: BadgeTheme;
  label: string;
  svg: string;
  preview: string;
}

const props = defineProps<{
  app: PackageApp | null;
}>();

const visibleModel = defineModel<boolean>("visible", { default: false });

const { t } = useI18n();
const { themeClasses } = useTheme();

const LOGO_PATHS = ["M1 660.333C5.887 646.603 10.89 633.248 15.642 619.803C58.257 499.219 100.827 378.618 143.414 258.024C168.377 187.336 193.358 116.654 218.274 45.948C219.192 43.345 220.134 41.944 223.376 41.971C245.706 42.152 268.038 42.048 290.37 42.069C427.678 42.196 564.986 42.331 702.647 42.232C703 42.444 703 42.889 702.861 44.043C702.646 65.186 702.582 85.619 702.469 106.051C702.458 108.015 702.138 109.978 701.961 111.941C662.645 111.961 623.329 111.994 584.013 111.997C480.556 112.005 377.1 112.031 273.643 111.887C269.549 111.881 268.038 113.158 266.728 116.874C223.624 239.18 180.383 361.438 137.182 483.711C116.741 541.566 96.317 599.428 75.989 657.324C74.784 660.755 73.283 662.088 69.405 662.047C46.917 661.809 24.425 661.921 1.467 661.958C1 661.556 1 661.111 1 660.333Z", "M703 504.667C701.447 505.333 699.894 505.957 698.341 505.958C637.685 506.004 577.029 505.994 516.373 505.984C516.046 505.984 515.718 505.891 514.555 505.713C533.602 453.589 552.592 401.622 571.735 349.233C526.975 349.233 482.896 349.233 438.362 349.233C432.456 365.475 426.516 381.867 420.538 398.245C390.831 479.624 361.116 561 331.398 642.375C329.366 647.938 327.421 653.541 325.121 658.993C324.59 660.253 322.771 661.8 321.533 661.81C300.049 661.981 278.563 661.933 256.395 661.933C259.885 652.267 263.212 642.984 266.587 633.719C304.242 530.371 341.905 427.027 379.561 323.68C384.413 310.363 389.313 297.062 394.016 283.693C395.102 280.607 396.549 279.439 400.022 279.443C487.007 279.561 573.992 279.535 660.977 279.545C662.277 279.546 663.577 279.692 665.494 279.808C646.438 331.947 627.527 383.692 608.386 436.066C622.175 436.066 635.281 436.066 648.387 436.066C659.366 436.066 659.346 436.059 663.038 425.958C675.249 392.547 687.468 359.14 699.72 325.744C700.275 324.23 701.171 322.84 702.133 322.088C702.24 323.936 702.02 325.089 702.02 326.243C702.002 383.774 701.997 441.305 702.044 498.836C702.045 500.224 702.667 501.612 703 503C703 503.444 703 503.889 703 504.667Z", "M701.936 160.628C702.394 183.487 702.357 206.274 702.14 229.499C619.798 229.957 537.636 229.981 455.475 229.999C423.477 230.006 391.478 230.072 359.481 229.905C355.717 229.885 354.087 230.943 352.817 234.552C321.33 324.052 289.717 413.508 258.099 502.962C239.797 554.741 221.433 606.498 203.162 658.288C202.392 660.468 201.927 662.024 198.979 662.006C175.981 661.866 152.982 661.918 129.984 661.895C129.698 661.895 129.412 661.689 128.678 661.407C132.3 651.089 135.909 640.757 139.554 630.438C194.388 475.226 249.249 320.023 303.937 164.759C305.35 160.747 307.184 159.951 310.999 159.983C331.663 160.159 352.33 160.041 372.995 160.071C482.477 160.225 591.959 160.393 701.936 160.628Z"];

const LOGO_PATHS_STR = LOGO_PATHS.map((d) => `<path d="${d}"/>`).join("");
const FONT_STACK = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const SUPPORT_FONT = "-apple-system, SF Pro Text, Inter, sans-serif";
const ICON_RASTER_SIZE = 256;
const EXPORT_SCALE = 4;
const BADGE_THEMES: BadgeTheme[] = ["dark", "light"];

const KIND_DESCRIPTIONS: Record<BadgeKind, string> = {
  appstore: "Badges for users to discover and install your app from the HomeDock OS App Store.",
  support: "For developers who want to link or credit HomeDock OS in their project's README or website ♥",
  branding: "Generic HomeDock OS App Store badges without a specific app name.",
};

const kind = ref<BadgeKind>("appstore");
const badgeIcon = ref<string | null>(null);
const downloadingKey = ref<string | null>(null);
const emailCopied = ref(false);
const openRow = ref<"discord" | "submit" | null>("discord");

function toggleRow(row: "discord" | "submit") {
  openRow.value = openRow.value === row ? null : row;
}

function selectKind(value: string) {
  if (value in KIND_DESCRIPTIONS) kind.value = value as BadgeKind;
}

const kindOptions = computed(() => [
  { value: "appstore", label: t("App Store"), icon: storeIcon },
  { value: "support", label: t("Support"), icon: heartIcon },
  { value: "branding", label: t("Branding"), icon: tagIcon },
]);

const displayName = computed(() => props.app?.manifest?.display_name || props.app?.manifest?.name || "App");
const slug = computed(() => props.app?.manifest?.name || "app");

const iconUrl = computed(() => {
  const manifest = props.app?.manifest;
  if (!manifest?.name || !manifest.icon) return "";
  return `/images/user-images/${manifest.name}${manifest.icon.substring(manifest.icon.lastIndexOf("."))}`;
});

watch(
  [visibleModel, iconUrl],
  async ([visible, src]) => {
    if (!visible) return;
    badgeIcon.value = null;
    if (!src) return;
    const raster = await rasterizeAppIcon(src, ICON_RASTER_SIZE);
    if (iconUrl.value === src) badgeIcon.value = raster;
  },
  { immediate: true },
);

watch(visibleModel, (visible) => {
  if (visible) kind.value = "appstore";
});

const escapeXml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const svgDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

function appStoreLayout(name: string) {
  const cardPad = 14;
  const iconSize = 56;
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
  const logoScale = 0.025;
  const logoH = Math.round(662 * logoScale);
  const logoW = Math.round(703 * logoScale);
  const logoTopDead = Math.round(42 * logoScale);
  const skirtText = "Available on the HomeDock OS App Store";
  const skirtFontSize = 11;
  const logoTextGap = 8;
  const skirtGroupX = Math.round((width - (logoW + logoTextGap + skirtText.length * skirtFontSize * 0.54)) / 2);

  return {
    cardPad,
    iconSize,
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
    miniCx: miniX + miniSize / 2,
    miniCy: 12 + miniSize / 2,
    logoScale,
    logoY: cardHeight + Math.round((skirtHeight - logoH) / 2) - logoTopDead,
    skirtGroupX,
    skirtTextX: skirtGroupX + logoW + logoTextGap,
    skirtTextY: cardHeight + Math.round(skirtHeight / 2) + 4,
    skirtText,
    skirtFontSize,
  };
}

function buildAppStoreSvg(name: string, theme: BadgeTheme, icon: string | null) {
  const L = appStoreLayout(name);
  const skirtBg = theme === "light" ? "#ffffff" : "#111111";
  const skirtFg = theme === "light" ? "#000000" : "#ffffff";

  const backdrop = icon ? `<image href="${icon}" x="${-L.width * 0.3}" y="${-L.cardHeight * 0.3}" width="${L.width * 1.6}" height="${L.cardHeight * 1.6}" filter="url(#bg-blur)" preserveAspectRatio="xMidYMid slice"/>` : "";
  const artwork = icon ? `<image href="${icon}" x="${L.cardPad}" y="${L.cardPad}" width="${L.iconSize}" height="${L.iconSize}" filter="url(#icon-shadow)"/>` : `<rect x="${L.cardPad}" y="${L.cardPad}" width="${L.iconSize}" height="${L.iconSize}" rx="${L.iconSize * 0.225}" fill="#333"/>`;
  const mini = icon ? `<image href="${icon}" x="${L.miniX}" y="12" width="${L.miniSize}" height="${L.miniSize}" clip-path="url(#mini-clip)" preserveAspectRatio="xMidYMid slice"/><circle cx="${L.miniCx}" cy="${L.miniCy}" r="${L.miniSize / 2}" fill="none" stroke="white" stroke-opacity="0.15"/>` : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${L.width}" height="${L.totalHeight}" viewBox="0 0 ${L.width} ${L.totalHeight}" fill="none">
  <defs>
    <clipPath id="outer-clip"><rect width="${L.width}" height="${L.totalHeight}" rx="${L.outerRx}"/></clipPath>
    <clipPath id="card-clip"><rect width="${L.width}" height="${L.cardHeight}"/></clipPath>
    <clipPath id="mini-clip"><circle cx="${L.miniCx}" cy="${L.miniCy}" r="${L.miniSize / 2}"/></clipPath>
    <filter id="bg-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceGraphic" stdDeviation="100"/></filter>
    <filter id="icon-shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.35"/></filter>
    <linearGradient id="dark-overlay" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0%" stop-color="#000" stop-opacity="0.45"/>
      <stop offset="50%" stop-color="#000" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.1"/>
    </linearGradient>
  </defs>
  <g clip-path="url(#outer-clip)">
    <g clip-path="url(#card-clip)">
      <rect width="${L.width}" height="${L.cardHeight}" fill="#1a1a1a"/>
      ${backdrop}
      <rect width="${L.width}" height="${L.cardHeight}" fill="url(#dark-overlay)"/>
    </g>
    ${artwork}
    ${mini}
    <text x="${L.textX}" y="37" fill="white" font-family="${FONT_STACK}" font-size="${L.line1FontSize}" font-weight="600">${escapeXml(L.line1Text)}</text>
    <text x="${L.textX}" y="55" fill="white" fill-opacity="0.7" font-family="${FONT_STACK}" font-size="${L.line2FontSize}" font-weight="400">on the HomeDock OS App Store</text>
    <rect y="${L.cardHeight}" width="${L.width}" height="${L.skirtHeight}" fill="${skirtBg}"/>
    <line x1="0" y1="${L.cardHeight}" x2="${L.width}" y2="${L.cardHeight}" stroke="${skirtFg}" stroke-opacity="0.06"/>
    <g transform="translate(${L.skirtGroupX}, ${L.logoY}) scale(${L.logoScale})"><g fill="${skirtFg}">${LOGO_PATHS_STR}</g></g>
    <text x="${L.skirtTextX}" y="${L.skirtTextY}" fill="${skirtFg}" font-family="${FONT_STACK}" font-size="${L.skirtFontSize}" font-weight="500">${L.skirtText}</text>
    <rect x="0.5" y="0.5" width="${L.width - 1}" height="${L.totalHeight - 1}" rx="${L.outerRx - 0.5}" fill="none" stroke="${skirtFg}" stroke-opacity="0.12"/>
  </g>
</svg>`;
}

function supportWidth(name: string) {
  return Math.max(240, Math.ceil(67 + (name.length + " works better on".length) * 10 * 0.58 + 20));
}

function buildSupportSvg(name: string, theme: BadgeTheme) {
  const isDark = theme === "dark";
  const W = supportWidth(name);
  const bgStops = isDark ? `<stop offset="0%" stop-color="#221d55"/><stop offset="55%" stop-color="#110f28"/><stop offset="100%" stop-color="#0d0d1a"/>` : `<stop offset="0%" stop-color="#f5f3ff"/><stop offset="55%" stop-color="#ede9fe"/><stop offset="100%" stop-color="#e8e4fc"/>`;
  const line1Fill = isDark ? `fill="#ffffff" fill-opacity="0.6"` : `fill="#1e1b4b" fill-opacity="1"`;
  const hdFill = isDark ? "#ffffff" : "#7c3aed";
  const s1 = isDark ? "#818cf8" : "#6366f1";
  const s2 = isDark ? "#6366f1" : "#818cf8";
  const s3 = isDark ? "#4f46e5" : "#a5b4fc";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="66" viewBox="0 0 ${W} 66">
  <defs>
    <linearGradient id="sbg" x1="0%" y1="0%" x2="100%" y2="0%">${bgStops}</linearGradient>
    <linearGradient id="spill" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6366f1"/><stop offset="50%" stop-color="#8b5cf6"/><stop offset="100%" stop-color="#a855f7"/></linearGradient>
    <linearGradient id="sborder" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6366f1" stop-opacity="0.8"/><stop offset="100%" stop-color="#a855f7" stop-opacity="0.3"/></linearGradient>
    <filter id="sglow"><feGaussianBlur stdDeviation="2.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <clipPath id="sclip"><rect width="${W}" height="66" rx="18"/></clipPath>
  </defs>
  <g clip-path="url(#sclip)">
    <rect width="${W}" height="66" rx="18" fill="url(#sbg)"/>
    <rect x="11" y="11" width="44" height="44" rx="12" fill="url(#spill)" filter="url(#sglow)" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>
    <g transform="translate(14, 14) scale(${38 / 702})"><g fill="#ffffff">${LOGO_PATHS_STR}</g></g>
    <text x="67" y="21" font-family="${SUPPORT_FONT}" font-size="10" font-weight="500" ${line1Fill} letter-spacing="-0.2">${escapeXml(name)} works better on</text>
    <text x="67" y="40" font-family="${SUPPORT_FONT}" font-size="19" font-weight="300" fill="${hdFill}" letter-spacing="-1" filter="url(#sglow)">HomeDock <tspan font-weight="800">OS</tspan></text>
    <text x="67" y="53" font-family="${SUPPORT_FONT}" font-size="9" font-weight="600" letter-spacing="-0.5"><tspan fill="${s1}">Safer</tspan><tspan fill="${s2}"> · Faster</tspan><tspan fill="${s3}"> · Multiplatform</tspan></text>
    <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4m-8-2l8-8m0 0v5m0-5h-5" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="translate(${W - 40}, 22) scale(0.9)" opacity="0.6"/>
  </g>
  <rect x="0.6" y="0.6" width="${W - 1.2}" height="64.8" rx="18.4" fill="none" stroke="url(#sborder)" stroke-width="1.2"/>
</svg>`;
}

const BRANDING_WIDTH = Math.ceil(77 + "HomeDock OS App Store".length * 19 * 0.56 + 20);

function buildBrandingSvg(theme: BadgeTheme) {
  const isDark = theme === "dark";
  const bg = isDark ? "#000000" : "#ffffff";
  const fg = isDark ? "#ffffff" : "#000000";
  const W = BRANDING_WIDTH;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="76" viewBox="0 0 ${W} 76" fill="none"><rect width="${W}" height="76" rx="12" fill="${bg}"/><rect x="0.5" y="0.5" width="${W - 1}" height="75" rx="11.5" stroke="${fg}" stroke-opacity="0.2"/><g transform="translate(16, 16) scale(0.0627)"><g fill="${fg}">${LOGO_PATHS_STR}</g></g><text x="77" y="30" font-family="${FONT_STACK}" font-size="13" font-weight="400" letter-spacing="-0.2" fill="${fg}" fill-opacity="0.6">Available on the</text><text x="77" y="53" font-family="${FONT_STACK}" font-size="19" font-weight="600" letter-spacing="-0.3" fill="${fg}">HomeDock OS App Store</text></svg>`;
}

const badges = computed<BadgeVariant[]>(() =>
  BADGE_THEMES.map((theme) => {
    const label = theme === "dark" ? "Dark .png" : "Light .png";
    let svg: string;
    if (kind.value === "support") svg = buildSupportSvg(displayName.value, theme);
    else if (kind.value === "branding") svg = buildBrandingSvg(theme);
    else svg = buildAppStoreSvg(displayName.value, theme, badgeIcon.value);
    return { theme, label, svg, preview: svgDataUrl(svg) };
  }),
);

function badgeFilename(theme: BadgeTheme) {
  if (kind.value === "support") return `${slug.value}-support-badge-${theme}.png`;
  if (kind.value === "branding") return `app-store-badge-${theme}.png`;
  return `${slug.value}-badge-${theme}.png`;
}

function svgToPng(svg: string, scale = EXPORT_SCALE): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth * scale;
      canvas.height = image.naturalHeight * scale;
      const context = canvas.getContext("2d");
      if (!context) return reject(new Error("Canvas unavailable"));
      context.scale(scale, scale);
      context.drawImage(image, 0, 0);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))), "image/png");
    };
    image.onerror = () => reject(new Error("SVG load failed"));
    image.src = svgDataUrl(svg);
  });
}

async function downloadBadge(badge: BadgeVariant) {
  if (downloadingKey.value) return;
  downloadingKey.value = `${kind.value}-${badge.theme}`;
  try {
    const url = URL.createObjectURL(await svgToPng(badge.svg));
    const link = document.createElement("a");
    link.href = url;
    link.download = badgeFilename(badge.theme);
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Badge export failed:", error);
  } finally {
    downloadingKey.value = null;
  }
}

function openDiscordChannel() {
  window.open("https://discord.com/channels/1381296490923954226/1467490625384349790", "_blank", "noopener,noreferrer");
}

function openDiscordInvite() {
  window.open("https://discord.gg/Zj3JCYsRWw", "_blank", "noopener,noreferrer");
}

async function copyEmail() {
  try {
    await navigator.clipboard.writeText("apps@homedock.cloud");
    emailCopied.value = true;
    setTimeout(() => (emailCopied.value = false), 2000);
  } catch {
    emailCopied.value = false;
  }
}
</script>

<style scoped>
.badge-dialog {
  container-type: inline-size;
  container-name: badge-dialog;
}

.badge-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@container badge-dialog (max-width: 520px) {
  .badge-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .badge-grid img {
    max-width: 380px;
  }
}

.accordion-body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.25s ease;
}

.accordion-body.is-open {
  grid-template-rows: 1fr;
}

.kind-fade-enter-active,
.kind-fade-leave-active {
  transition: opacity 0.15s ease;
}

.kind-fade-enter-from,
.kind-fade-leave-to {
  opacity: 0;
}
</style>
