<!-- homedock-ui/vue3/static/js/__Widgets__/WidgetMedia.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="relative w-full h-full overflow-hidden">
    <img v-if="player?.coverUrl" :src="player.coverUrl" class="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-25 pointer-events-none" alt="" draggable="false" />

    <button v-if="canReveal" type="button" class="absolute top-2 right-2 z-10 w-5 h-5 rounded-md flex items-center justify-center cursor-pointer transition-colors" :class="[themeClasses.desktopWidgetMeta, themeClasses.desktopWidgetControlBgHover]" :title="$t('File Explorer')" @mousedown.stop @touchstart.stop @click.stop="revealInExplorer">
      <Icon :icon="folderOpenIcon" class="w-3.5 h-3.5" />
    </button>

    <div v-if="player && size === 'm'" class="relative w-full h-full flex flex-col items-center px-4 py-4">
      <div class="shrink-0 w-[104px] h-[104px] rounded-2xl overflow-hidden shadow-lg flex items-center justify-center" :class="themeClasses.desktopWidgetControlBg">
        <img v-if="player.coverUrl" :src="player.coverUrl" class="w-full h-full object-cover" alt="" draggable="false" />
        <Icon v-else :icon="player.isVideo ? movieIcon : musicIcon" class="w-8 h-8" :class="themeClasses.desktopWidgetMeta" />
      </div>

      <span class="mt-2.5 w-full text-center text-xs font-semibold truncate" :class="themeClasses.desktopWidgetTitle">{{ player.fileName }}</span>

      <div class="w-full mt-auto flex flex-col gap-1">
        <div class="h-1 rounded-full overflow-hidden" :class="themeClasses.statsWidgetProgressBg">
          <div class="h-full rounded-full" :class="themeClasses.statsWidgetProgressFill" :style="{ width: `${progressPercent}%` }"></div>
        </div>
        <div class="flex items-center justify-between text-[9px] tabular-nums" :class="themeClasses.desktopWidgetMeta">
          <span>{{ currentTimeText }}</span>
          <span>{{ durationText }}</span>
        </div>
      </div>

      <button type="button" class="shrink-0 mt-1 w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer" :class="[themeClasses.desktopWidgetControlBg, themeClasses.desktopWidgetControlBgHover]" @mousedown.stop @click.stop="togglePlay">
        <Icon :icon="player.isPlaying ? pauseIcon : playIcon" class="w-5 h-5" :class="themeClasses.desktopWidgetTitle" />
      </button>
    </div>

    <div v-else-if="player" class="relative w-full h-full flex items-center px-4 py-3 gap-3">
      <div class="shrink-0 w-14 h-14 rounded-xl overflow-hidden shadow-md flex items-center justify-center" :class="themeClasses.desktopWidgetControlBg">
        <img v-if="player.coverUrl" :src="player.coverUrl" class="w-full h-full object-cover" alt="" draggable="false" />
        <Icon v-else :icon="player.isVideo ? movieIcon : musicIcon" class="w-6 h-6" :class="themeClasses.desktopWidgetMeta" />
      </div>

      <div class="flex-1 min-w-0 flex flex-col gap-1.5">
        <span class="text-xs font-semibold truncate" :class="themeClasses.desktopWidgetTitle">{{ player.fileName }}</span>
        <div class="h-1 rounded-full overflow-hidden" :class="themeClasses.statsWidgetProgressBg">
          <div class="h-full rounded-full" :class="themeClasses.statsWidgetProgressFill" :style="{ width: `${progressPercent}%` }"></div>
        </div>
      </div>

      <button type="button" class="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer" :class="[themeClasses.desktopWidgetControlBg, themeClasses.desktopWidgetControlBgHover]" @mousedown.stop @click.stop="togglePlay">
        <Icon :icon="player.isPlaying ? pauseIcon : playIcon" class="w-5 h-5" :class="themeClasses.desktopWidgetTitle" />
      </button>
    </div>

    <div v-else class="relative w-full h-full flex flex-col items-center justify-center gap-1.5 px-4 py-3">
      <Icon :icon="musicOffIcon" class="w-6 h-6" :class="themeClasses.desktopWidgetMeta" />
      <span class="text-xs" :class="themeClasses.desktopWidgetMeta">{{ $t("Nothing playing") }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { Icon } from "@iconify/vue";

import playIcon from "@iconify-icons/mdi/play";
import pauseIcon from "@iconify-icons/mdi/pause";
import musicIcon from "@iconify-icons/mdi/music";
import movieIcon from "@iconify-icons/mdi/movie";
import musicOffIcon from "@iconify-icons/mdi/music-off";
import folderOpenIcon from "@iconify-icons/mdi/folder-open-outline";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useWindowStore } from "../__Stores__/windowStore";
import { useMediaPlaybackStore } from "../__Stores__/useMediaPlaybackStore";
import type { WidgetInstance } from "../__Stores__/useWidgetsStore";
import type { WidgetSize } from "../__Config__/WidgetDefaultDetails";

defineProps<{
  instance: WidgetInstance;
  size: WidgetSize;
}>();

const { themeClasses } = useTheme();
const windowStore = useWindowStore();
const mediaStore = useMediaPlaybackStore();

const player = computed(() => mediaStore.primaryPlayer);

const canReveal = computed(() => Boolean(player.value?.origin));

const progressPercent = computed(() => {
  if (!player.value || !player.value.duration) return 0;
  return Math.min(100, (player.value.currentTime / player.value.duration) * 100);
});

function formatTime(seconds: number): string {
  const total = Math.floor(seconds || 0);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

const currentTimeText = computed(() => (player.value ? formatTime(player.value.currentTime) : ""));
const durationText = computed(() => (player.value ? formatTime(player.value.duration) : ""));

function revealInExplorer() {
  const origin = player.value?.origin;
  if (!origin) return;

  windowStore.openFileInApp("fileexplorer", {
    data: {
      initialLocation: origin.location,
      initialContainer: origin.container,
      initialMountIndex: origin.mountIndex,
      initialDiskId: origin.disk,
      initialPath: origin.path,
      initialFileName: origin.name,
    },
  });
}

function togglePlay() {
  if (!player.value) return;
  window.dispatchEvent(
    new CustomEvent(`homedock:media-control-${player.value.windowId}`, {
      detail: { action: "togglePlay" },
    }),
  );
}
</script>
