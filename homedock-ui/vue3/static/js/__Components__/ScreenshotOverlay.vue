<!-- homedock-ui/vue3/static/js/__Components__/ScreenshotOverlay.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Teleport to="body">
    <div v-if="flash" class="hd-shot-flash" :style="{ left: `${flash.x}px`, top: `${flash.y}px`, width: `${flash.width}px`, height: `${flash.height}px` }" @animationend="screenshotStore.clearFlash()"></div>

    <Transition name="hd-shot-card">
      <div v-if="preview" class="hd-shot-card" :class="[themeClasses.screenshotCardBg, themeClasses.screenshotCardBorder]" :style="{ bottom: `calc(${taskbarHeight} + 16px)` }" @mouseenter="holdTimer" @mouseleave="resumeTimer">
        <!-- Keyed on the image, not on error: a failed upload still has one, and this is the way back to it. -->
        <button v-if="preview.thumbnail" type="button" class="hd-shot-thumb" @click="openInViewer">
          <img :src="preview.thumbnail" alt="" draggable="false" />
        </button>

        <div class="hd-shot-body">
          <p class="hd-shot-title" :class="themeClasses.screenshotCardText">
            {{ preview.error ? $t(preview.error) : preview.path ? $t("Screenshot saved") : $t("Saving screenshot...") }}
          </p>
          <p class="hd-shot-meta" :class="themeClasses.screenshotCardMuted">
            {{ preview.error ? $t("Nothing was written to Photos") : preview.path ? $t("Saved to {folder}", { folder: "Photos" }) : "Photos" }}
          </p>
        </div>

        <button type="button" class="hd-shot-close" :class="themeClasses.screenshotCardMuted" :title="$t('Close')" @click="dismiss">
          <Icon :icon="closeIcon" width="16" height="16" />
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { computed, watch, onBeforeUnmount } from "vue";

import { Icon } from "@iconify/vue";
import closeIcon from "@iconify-icons/mdi/close";

import { useScreenshotStore } from "../__Stores__/useScreenshotStore";
import { useWindowStore } from "../__Stores__/windowStore";
import { useResponsive } from "../__Composables__/useResponsive";
import { useTheme } from "../__Themes__/ThemeSelector";

const DISMISS_MS = 4500;

const screenshotStore = useScreenshotStore();
const windowStore = useWindowStore();
const { taskbarHeight } = useResponsive();
const { themeClasses } = useTheme();

const flash = computed(() => screenshotStore.flash);
const preview = computed(() => screenshotStore.preview);

let dismissTimer: number | null = null;

function clearTimer() {
  if (dismissTimer === null) return;
  window.clearTimeout(dismissTimer);
  dismissTimer = null;
}

function holdTimer() {
  clearTimer();
}

function resumeTimer() {
  clearTimer();
  if (preview.value?.error) return;
  dismissTimer = window.setTimeout(dismiss, DISMISS_MS);
}

function dismiss() {
  clearTimer();
  screenshotStore.discardPreview();
}

function openInViewer() {
  const shot = screenshotStore.preview;
  if (!shot || !shot.buffer.byteLength) return;

  windowStore.openFileInApp("imageviewer", {
    data: {
      imageFile: {
        name: shot.fileName,
        extension: "png",
        buffer: shot.buffer,
      },
    },
  });

  dismiss();
}

watch(preview, (value) => {
  clearTimer();
  if (value) resumeTimer();
});

watch(
  () => preview.value?.error,
  (error) => {
    if (error) clearTimer();
  },
);

onBeforeUnmount(clearTimer);
</script>

<style scoped>
.hd-shot-flash {
  position: fixed;
  z-index: 10050;
  background: #ffffff;
  pointer-events: none;
  opacity: 0;
  animation: hd-shot-flash 220ms ease-out;
}

@keyframes hd-shot-flash {
  0% {
    opacity: 0;
  }
  25% {
    opacity: 0.85;
  }
  100% {
    opacity: 0;
  }
}

.hd-shot-card {
  position: fixed;
  right: 16px;
  z-index: 10040;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 300px;
  padding: 10px;
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
}

.hd-shot-thumb {
  flex-shrink: 0;
  width: 96px;
  height: 60px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.25);
  cursor: pointer;
  overflow: hidden;
}

/* contain, not cover a screenshot cropped to thumb...xd */
.hd-shot-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.hd-shot-body {
  flex: 1;
  min-width: 0;
}

.hd-shot-title {
  margin: 0;
  font-size: 13px;
  line-height: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hd-shot-meta {
  margin: 2px 0 0;
  font-size: 11px;
  line-height: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hd-shot-close {
  flex-shrink: 0;
  align-self: flex-start;
  padding: 2px;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 150ms ease;
}

.hd-shot-close:hover {
  opacity: 1;
}

.hd-shot-card-enter-active,
.hd-shot-card-leave-active {
  transition:
    transform 260ms cubic-bezier(0.22, 0.61, 0.36, 1),
    opacity 260ms ease;
}

.hd-shot-card-enter-from,
.hd-shot-card-leave-to {
  transform: translateX(calc(100% + 16px));
  opacity: 0;
}
</style>
