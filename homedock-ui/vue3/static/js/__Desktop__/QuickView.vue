<!-- homedock-ui/vue3/static/js/__Desktop__/QuickView.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div v-if="isOpen" class="hd-qv-blur" :class="themeClasses.quickViewBlur"></div>

  <Transition name="hd-qv-fade">
    <div v-if="isOpen" class="hd-qv-scrim" :class="themeClasses.quickViewScrim"></div>
  </Transition>

  <div v-if="isOpen" class="hd-qv-layer" @mousedown.self="close">
    <button v-for="item in slots" :key="item.id" type="button" class="hd-qv-slot" :class="[hoveredId === item.id ? 'hd-qv-slot-active' : '']" :style="{ left: `${item.x}px`, top: `${item.y}px`, width: `${item.width}px`, height: `${item.height}px` }" @mousedown.stop="pick(item.id)" @mouseenter="hoveredId = item.id" @mouseleave="handleLeave(item.id)" :title="item.title">
      <span class="hd-qv-label" :class="[themeClasses.contextMenuBg, themeClasses.contextMenuBorder, themeClasses.contextMenuItem]">
        <BaseImage v-if="isImageIcon(item.icon)" :src="item.icon" alt="" class="rounded-[3px] flex-shrink-0" width="14" height="14" draggable="false" />
        <Icon v-else-if="item.icon" :icon="item.icon as IconifyIcon" width="14" height="14" class="flex-shrink-0" />
        <span class="hd-qv-label-text">{{ item.title }}</span>
      </span>
    </button>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from "vue";

import { Icon } from "@iconify/vue";
import type { IconifyIcon } from "@iconify/vue";

import { useWindowStore, isImageIcon, type WindowState } from "../__Stores__/windowStore";
import { useQuickViewStore } from "../__Stores__/useQuickViewStore";
import { useDesktopStore } from "../__Stores__/desktopStore";
import { useResponsive } from "../__Composables__/useResponsive";
import { useTheme } from "../__Themes__/ThemeSelector";
import BaseImage from "../__Components__/BaseImage.vue";

interface ExposeSlot {
  id: string;
  title: string;
  icon: string | IconifyIcon | null;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BaseRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const EDGE_PADDING = 44;
const CELL_GAP = 28;
const LABEL_SPACE = 34;
const TRANSITION = "transform 380ms cubic-bezier(0.22, 0.61, 0.36, 1)";
const TRANSITION_MS = 380;

const windowStore = useWindowStore();
const desktopStore = useDesktopStore();
const quickView = useQuickViewStore();
const { isMobile, taskbarHeightPx } = useResponsive();
const { themeClasses } = useTheme();

const slots = ref<ExposeSlot[]>([]);
const hoveredId = ref<string | null>(null);

const baseRects = new Map<string, BaseRect>();
const touched = new Map<string, HTMLElement>();
const restoreTimers = new Map<string, number>();

let releaseOnTeardown = false;

const isOpen = computed(() => quickView.isOpen);

function eligibleWindows(): WindowState[] {
  return windowStore.appWindows.filter((w) => !w.isMinimized && !w.isClosing);
}

function elementFor(id: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-pwm-window="${id}"]`);
}

function close() {
  quickView.close();
}

function closeImmediate() {
  if (!quickView.isOpen) return;
  releaseOnTeardown = true;
  quickView.close();
}

function handleLeave(id: string) {
  if (hoveredId.value === id) hoveredId.value = null;
}

function pick(id: string) {
  quickView.close();
  windowStore.focusWindow(id);
}

function layout() {
  const wins = eligibleWindows();
  if (!wins.length) {
    quickView.close();
    return;
  }

  const measured: { win: WindowState; el: HTMLElement; rect: BaseRect }[] = [];

  for (const win of wins) {
    const el = elementFor(win.id);
    if (!el) continue;

    if (restoreTimers.has(win.id)) releaseWindow(win.id, el);

    let rect = baseRects.get(win.id);
    if (!rect) {
      const box = el.getBoundingClientRect();
      rect = { left: box.left, top: box.top, width: box.width, height: box.height };
      baseRects.set(win.id, rect);
    }

    measured.push({ win, el, rect });
  }

  if (!measured.length) {
    quickView.close();
    return;
  }

  const total = measured.length;
  const cols = Math.ceil(Math.sqrt(total));
  const rows = Math.ceil(total / cols);

  const areaWidth = window.innerWidth - EDGE_PADDING * 2;
  const areaHeight = window.innerHeight - taskbarHeightPx.value - EDGE_PADDING * 2;
  const cellWidth = areaWidth / cols;
  const cellHeight = areaHeight / rows;
  const innerWidth = Math.max(120, cellWidth - CELL_GAP);
  const innerHeight = Math.max(90, cellHeight - CELL_GAP - LABEL_SPACE);

  const next: ExposeSlot[] = [];

  measured.forEach(({ win, el, rect }, index) => {
    const row = Math.floor(index / cols);
    const col = index - row * cols;
    const inRow = Math.min(cols, total - row * cols);
    const rowOffset = (areaWidth - inRow * cellWidth) / 2;

    const scale = Math.min(innerWidth / rect.width, innerHeight / rect.height, 1);
    const width = rect.width * scale;
    const height = rect.height * scale;

    const x = EDGE_PADDING + rowOffset + col * cellWidth + (cellWidth - width) / 2;
    const y = EDGE_PADDING + row * cellHeight + (cellHeight - LABEL_SPACE - height) / 2;

    el.classList.add("hd-qv-window");
    el.style.transformOrigin = "top left";
    el.style.transition = TRANSITION;
    el.style.pointerEvents = "none";
    el.style.transform = `translate3d(${x - rect.left}px, ${y - rect.top}px, 0) scale(${scale})`;
    touched.set(win.id, el);

    next.push({
      id: win.id,
      title: win.title || "",
      icon: win.icon ?? null,
      x,
      y,
      width,
      height,
    });
  });

  slots.value = next;
}

function releaseWindow(id: string, el: HTMLElement) {
  const timer = restoreTimers.get(id);
  if (timer) {
    window.clearTimeout(timer);
    restoreTimers.delete(id);
  }

  el.style.transition = "none";
  el.style.transform = "";
  el.style.transformOrigin = "";
  el.style.pointerEvents = "";
  el.classList.remove("hd-qv-window");

  void el.offsetWidth;
  el.style.transition = "";
}

function restoreWindow(id: string, el: HTMLElement) {
  el.style.transition = TRANSITION;
  el.style.transform = "";

  const timer = window.setTimeout(() => {
    el.style.transition = "";
    el.style.transformOrigin = "";
    el.style.pointerEvents = "";
    el.classList.remove("hd-qv-window");
    restoreTimers.delete(id);
  }, TRANSITION_MS + 60);

  restoreTimers.set(id, timer);
}

function teardown() {
  hoveredId.value = null;
  slots.value = [];

  touched.forEach((el, id) => {
    const win = windowStore.getWindowById(id);
    if (releaseOnTeardown || !win || win.isMinimized || win.isClosing) releaseWindow(id, el);
    else restoreWindow(id, el);
  });

  releaseOnTeardown = false;
  touched.clear();
  baseRects.clear();
}

function isEditableTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;

  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && quickView.isOpen) {
    e.preventDefault();
    close();
    return;
  }

  if (isMobile.value || isEditableTarget(e.target)) return;

  const isF3 = e.key === "F3";
  const isArrowCombo = e.key === "ArrowUp" && (e.ctrlKey || e.metaKey);
  if (!isF3 && !isArrowCombo) return;

  e.preventDefault();
  quickView.toggle();
}

function handleResize() {
  if (quickView.isOpen) close();
}

watch(isOpen, (open) => {
  if (!open) {
    teardown();
    return;
  }

  if (isMobile.value || !eligibleWindows().length || windowStore.hasOpenDialog) {
    quickView.isOpen = false;
    return;
  }

  void nextTick(() => layout());
});

const windowSignature = () => windowStore.appWindows.map((w) => `${w.id}:${w.isMinimized ? 1 : 0}:${w.isMaximized ? 1 : 0}`).join("|");

watch(windowSignature, (next, previous) => {
  if (!quickView.isOpen) return;

  const before = new Map(
    (previous || "")
      .split("|")
      .filter(Boolean)
      .map((entry) => [entry.split(":")[0], entry]),
  );
  const after = new Map(
    next
      .split("|")
      .filter(Boolean)
      .map((entry) => [entry.split(":")[0], entry]),
  );

  for (const [id, entry] of after) {
    if (!before.has(id) || before.get(id) !== entry) {
      closeImmediate();
      return;
    }
  }

  for (const id of before.keys()) {
    if (after.has(id)) continue;
    const el = touched.get(id);
    if (el) releaseWindow(id, el);
    touched.delete(id);
    baseRects.delete(id);
  }

  if (!eligibleWindows().length) {
    close();
    return;
  }

  void nextTick(() => layout());
});

watch(
  () => windowStore.hasOpenDialog,
  (blocking) => {
    if (blocking) closeImmediate();
  },
);

watch(
  () => windowStore.activeWindowId,
  () => closeImmediate(),
);

watch(
  () => desktopStore.startMenuOpen,
  (open) => {
    if (open) closeImmediate();
  },
);

function handlePointerDown(e: PointerEvent) {
  if (!quickView.isOpen) return;

  const target = e.target as HTMLElement | null;
  if (target?.closest(".hd-qv-layer")) return;

  closeImmediate();
}

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
  document.addEventListener("pointerdown", handlePointerDown, true);
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeydown);
  document.removeEventListener("pointerdown", handlePointerDown, true);
  window.removeEventListener("resize", handleResize);
  restoreTimers.forEach((timer) => window.clearTimeout(timer));
  restoreTimers.clear();
});
</script>

<style>
/* Windows keep their backdrop-filter under transform */
.pwm-window.hd-qv-window {
  animation: none !important;
}
</style>

<style scoped>
.hd-qv-blur {
  position: fixed;
  inset: 0;
  z-index: 98;
  pointer-events: none;
}

.hd-qv-scrim {
  position: fixed;
  inset: 0;
  z-index: 99;
  pointer-events: none;
}

.hd-qv-layer {
  position: fixed;
  inset: 0;
  z-index: 101;
}

.hd-qv-slot {
  position: absolute;
  padding: 0;
  margin: 0;
  border: 2px solid transparent;
  border-radius: 14px;
  background: transparent;
  cursor: pointer;
  outline: none;
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease;
}

.hd-qv-slot-active {
  border-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 0 6px rgba(0, 0, 0, 0.25);
}

.hd-qv-label {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translate(-50%, 8px);
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
  pointer-events: none;
}

.hd-qv-label-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

.hd-qv-fade-enter-active,
.hd-qv-fade-leave-active {
  transition: opacity 220ms ease;
}

.hd-qv-fade-enter-from,
.hd-qv-fade-leave-to {
  opacity: 0;
}
</style>
