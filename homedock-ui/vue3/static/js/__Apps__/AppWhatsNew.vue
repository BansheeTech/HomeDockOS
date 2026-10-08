<!-- homedock-ui/vue3/static/js/__Apps__/AppWhatsNew.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="app-whatsnew flex flex-col h-full overflow-hidden" :class="themeClasses.whatsNewBg">
    <div ref="scrollRef" class="flex-1 overflow-auto">
      <div class="relative px-6 pt-6 pb-8 text-center">
        <div class="absolute inset-x-0 top-0 h-48 overflow-hidden">
          <AuroraWaves :max-height="0.5" :amplitude-scale="0.35" :reveal-duration="1800" :speed="0.012" />
        </div>

        <button v-if="!viewingLatest" type="button" :class="['absolute left-4 top-4 z-[1] inline-flex items-center gap-1 pl-1.5 pr-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer', themeClasses.aboutLink]" @click="selectRelease(latestRelease.id)">
          <Icon :icon="chevronLeftIcon" class="w-4 h-4" />
          <span>{{ $t("Back") }}</span>
        </button>

        <WhatsNewScene v-if="sceneTiles.length" :key="release.id" :tiles="sceneTiles" :height="220" class="relative max-w-2xl mx-auto mb-2" />

        <span :class="['relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset transition-colors', themeClasses.aboutLinkOwn]">
          <Icon :icon="newBoxIcon" class="w-3.5 h-3.5" />
          {{ $t("What's New") }} · {{ release.version }}
        </span>

        <h1 :class="['relative text-2xl md:text-3xl font-bold mt-4 text-balance leading-tight md:leading-9', themeClasses.aboutTitle]">{{ text(release.title) }}</h1>
        <p :class="['relative text-sm mt-3 max-w-lg mx-auto text-balance leading-relaxed opacity-80', themeClasses.aboutSubtitle]">{{ text(release.subtitle) }}</p>
      </div>

      <div class="max-w-2xl mx-auto px-6 pb-6 space-y-3">
        <div v-for="(entry, index) in release.entries" :key="`${release.id}-${index}`" :class="['group relative rounded-xl p-5', themeClasses.aboutCard]">
          <span v-if="entry.tag" :class="['absolute -top-2 right-4 z-[1] px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide ring-1 ring-inset backdrop-blur-md transition-colors', entry.tag.accent ? themeClasses.whatsNewTagAccent : themeClasses.aboutLinkOwn]">{{ entry.tag.text ? text(entry.tag.text) : entry.tag.key ? $t(entry.tag.key) : entry.tag.label }}</span>

          <div v-if="entry.image" class="overflow-hidden rounded-lg mb-4">
            <div v-if="missingImages.has(imageUrl(entry.image))" :class="['flex items-center justify-center w-full aspect-video', themeClasses.notInnerIcon]">
              <Icon :icon="iconFor(entry.icon)" class="w-12 h-12 opacity-40" />
            </div>
            <img v-else :src="imageUrl(entry.image)" loading="lazy" draggable="false" alt="" class="w-full aspect-video object-cover transition-all duration-1000 ease-out group-hover:scale-[1.05] group-hover:saturate-150" @error="missingImages.add(imageUrl(entry.image))" />
          </div>

          <div class="flex items-start gap-4">
            <div :class="['flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0', themeClasses.notInnerIcon]">
              <Icon :icon="iconFor(entry.icon)" class="w-5 h-5" />
            </div>

            <div class="flex-1 min-w-0">
              <h3 :class="['text-sm font-semibold leading-snug pr-2', themeClasses.aboutLabel]">{{ text(entry.title) }}</h3>
              <p :class="['text-xs leading-relaxed mt-1.5', themeClasses.aboutDescription]">{{ text(entry.body) }}</p>

              <!-- HDOS00128 -->
              <a v-if="entry.docsUrl" :href="entry.docsUrl" target="_blank" rel="noopener noreferrer" :class="['inline-flex items-center gap-1.5 mt-3 px-2.5 py-1.5 rounded-lg text-[11px] transition-colors', themeClasses.aboutLink]">
                <Icon :icon="bookIcon" size="14px" />
                <span>{{ $t("Learn more about this") }}</span>
                <Icon :icon="openInNewIcon" size="10px" class="opacity-50" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div v-if="viewingLatest && previousReleases.length" class="max-w-2xl mx-auto px-6 pb-6">
        <h2 :class="['px-1 mb-2 text-[11px] font-semibold uppercase tracking-wide opacity-60', themeClasses.aboutLabel]">{{ $t("Previous versions") }}</h2>

        <div :class="['rounded-xl overflow-hidden divide-y divide-gray-500/15', themeClasses.aboutCard]">
          <button v-for="previous in previousReleases" :key="previous.id" type="button" :class="['flex items-center gap-3 w-full px-4 py-3 text-left transition-colors cursor-pointer', themeClasses.aboutLink]" @click="selectRelease(previous.id)">
            <div :class="['flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0', themeClasses.notInnerIcon]">
              <Icon :icon="historyIcon" class="w-4 h-4" />
            </div>

            <div class="flex-1 min-w-0">
              <div :class="['text-sm font-semibold', themeClasses.aboutLabel]">HomeDock OS {{ previous.version }}</div>
              <div :class="['text-xs truncate', themeClasses.aboutDescription]">{{ text(previous.title) }}</div>
            </div>

            <span v-if="missedIds.has(previous.id)" :class="['px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide ring-1 ring-inset flex-shrink-0', themeClasses.whatsNewTagAccent]">{{ $t("Not seen yet") }}</span>
            <Icon :icon="chevronRightIcon" class="w-4 h-4 opacity-40 flex-shrink-0" />
          </button>
        </div>
      </div>

      <div class="flex justify-center px-6 pb-10">
        <a :href="release.changelogUrl" target="_blank" rel="noopener noreferrer" :class="['inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-colors', themeClasses.aboutLink]">
          <Icon :icon="historyIcon" size="16px" />
          <span>{{ $t("Read the full changelog") }}</span>
          <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
        </a>
      </div>
    </div>

    <StatusBar :icon="newBoxIcon" :message="$t('What\'s New')" :info="`${$t('Version')} ${version}`" :showHelp="true">
      <template #help>
        <div class="space-y-2.5 max-w-sm">
          <div class="flex items-center gap-2">
            <StatusBarHelpIcon :icon="newBoxIcon" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">{{ $t("What's New") }}</h4>
          </div>

          <div :class="['text-[10px] md:text-xs md:leading-4 space-y-2 leading-relaxed', themeClasses.statusBarInfo]">
            <p>{{ $t("This window collects the changes that came with this release. It opens by itself once, the first time you sign in after an update, and never again. You can always reopen it from About.") }}</p>
          </div>
        </div>
      </template>
    </StatusBar>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, onMounted, onUnmounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";

import { Icon } from "@iconify/vue";
import newBoxIcon from "@iconify-icons/mdi/new-box";
import historyIcon from "@iconify-icons/mdi/history";
import openInNewIcon from "@iconify-icons/mdi/open-in-new";
import bookIcon from "@iconify-icons/mdi/book-open-variant";
import chevronLeftIcon from "@iconify-icons/mdi/chevron-left";
import chevronRightIcon from "@iconify-icons/mdi/chevron-right";
import windowIcon from "@iconify-icons/mdi/window-maximize";
import splitIcon from "@iconify-icons/mdi/view-split-vertical";
import lockIcon from "@iconify-icons/mdi/lock-check";
import proxyIcon from "@iconify-icons/mdi/lan-connect";
import widgetIcon from "@iconify-icons/mdi/widgets";
import shortcutIcon from "@iconify-icons/mdi/link-variant";
import quickviewIcon from "@iconify-icons/mdi/view-grid";
import helpIcon from "@iconify-icons/mdi/help-circle-outline";
import terminalIcon from "@iconify-icons/mdi/console";
import controlHubIcon from "@iconify-icons/mdi/monitor-dashboard";
import storeIcon from "@iconify-icons/mdi/storefront-outline";
import packagerIcon from "@iconify-icons/mdi/package-variant-closed";
import logsIcon from "@iconify-icons/mdi/text-box-search-outline";
import driveIcon from "@iconify-icons/mdi/folder-lock";
import officeIcon from "@iconify-icons/mdi/file-document-edit";
import imagesIcon from "@iconify-icons/mdi/image-multiple";
import searchIcon from "@iconify-icons/mdi/magnify";
import devicesIcon from "@iconify-icons/mdi/monitor-cellphone";
import gamesIcon from "@iconify-icons/mdi/gamepad-variant";
import paletteIcon from "@iconify-icons/mdi/palette";
import musicIcon from "@iconify-icons/mdi/equalizer";
import nextIcon from "@iconify-icons/mdi/rocket-launch";
import openSourceIcon from "@iconify-icons/mdi/open-source-initiative";
import starIcon from "@iconify-icons/mdi/star-four-points";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useWhatsNewStore } from "../__Stores__/useWhatsNewStore";

import { releases, latestRelease, missedReleases, localized } from "../__Data__/WhatsNewData";
import type { LocalizedText } from "../__Data__/WhatsNewData";

import AuroraWaves from "../__Components__/AuroraWaves.vue";
import WhatsNewScene from "../__Components__/WhatsNewScene.vue";
import StatusBar from "../__Components__/StatusBar.vue";
import StatusBarHelpIcon from "../__Components__/StatusBarHelpIcon.vue";

import type { CommonData } from "../__Types__/CommonData";
import type { HomeDockSatellite } from "../__Utils__/HomeDockLogoEngine";

const commonData = inject<CommonData | null>("data-common", null);

const { locale } = useI18n();
const { themeClasses } = useTheme();
const csrfToken = useCsrfToken();
const whatsNewStore = useWhatsNewStore();

const version = commonData?.version || "";
const currentLocale = computed(() => String(locale.value));

const scrollRef = ref<HTMLDivElement | null>(null);
const selectedId = ref(latestRelease.id);
const missingImages = reactive(new Set<string>());

const release = computed(() => releases.find((candidate) => candidate.id === selectedId.value) ?? latestRelease);
const viewingLatest = computed(() => release.value.id === latestRelease.id);
const previousReleases = releases.slice(1);
const missedIds = computed(() => new Set(missedReleases(whatsNewStore.seenId).map((missed) => missed.id)));

const sceneTiles = computed<HomeDockSatellite[]>(() => (release.value.scene ?? []).map((tile) => ({ icon: iconFor(tile.icon), color: tile.color })));

function text(value: LocalizedText) {
  return localized(value, currentLocale.value);
}

function imageUrl(image: string) {
  return `/images/whatsnew/${release.value.id}/${image}`;
}

function selectRelease(id: string) {
  selectedId.value = id;
  scrollRef.value?.scrollTo({ top: 0 });
}

const entryIcons: Record<string, any> = {
  window: windowIcon,
  split: splitIcon,
  lock: lockIcon,
  proxy: proxyIcon,
  widget: widgetIcon,
  shortcut: shortcutIcon,
  quickview: quickviewIcon,
  help: helpIcon,
  terminal: terminalIcon,
  controlhub: controlHubIcon,
  store: storeIcon,
  packager: packagerIcon,
  logs: logsIcon,
  drive: driveIcon,
  office: officeIcon,
  images: imagesIcon,
  search: searchIcon,
  devices: devicesIcon,
  games: gamesIcon,
  palette: paletteIcon,
  music: musicIcon,
  next: nextIcon,
  opensource: openSourceIcon,
};

function iconFor(name: string) {
  return entryIcons[name] || starIcon;
}

onMounted(() => {
  whatsNewStore.load(csrfToken.value);
});

onUnmounted(() => {
  whatsNewStore.markSeen(csrfToken.value, latestRelease.id);
});
</script>
