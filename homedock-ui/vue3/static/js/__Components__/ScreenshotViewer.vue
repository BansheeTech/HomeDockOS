<!-- homedock-ui/vue3/static/js/__Components__/ScreenshotViewer.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Teleport to="body">
    <div v-if="rendered" ref="rootRef" class="screenshot-viewer fixed inset-0 select-none" role="dialog" aria-modal="true" :aria-label="title" @touchstart.passive="onTouchStart" @touchmove.passive="onTouchMove" @touchend="onTouchEnd">
      <div ref="backdropRef" class="absolute inset-0 bg-black/75 backdrop-blur-2xl" @click="close"></div>

      <div ref="stageRef" class="stage absolute inset-0 pointer-events-none">
        <Transition :name="`viewer-slide-${direction}`">
          <div :key="index" class="absolute inset-0 flex items-center justify-center">
            <ScreenshotFrame ref="frameRef" large :src="images[index]" :alt="`${title} ${index + 1}`" :title="title" :icon="icon" class="viewer-frame pointer-events-auto" :style="dragStyle" @control="close" @image-click="close" />
          </div>
        </Transition>
      </div>

      <div v-if="images.length > 1" ref="chromeRef" class="absolute inset-0 pointer-events-none">
        <button v-if="index > 0" type="button" :aria-label="$t('Previous')" class="viewer-button viewer-arrow absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 pointer-events-auto" @click="go(index - 1)">
          <Icon :icon="chevronLeftIcon" class="w-7 h-7" />
        </button>
        <button v-if="index < images.length - 1" type="button" :aria-label="$t('Next')" class="viewer-button viewer-arrow absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 pointer-events-auto" @click="go(index + 1)">
          <Icon :icon="chevronRightIcon" class="w-7 h-7" />
        </button>

        <div class="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 backdrop-blur-xl pointer-events-auto">
          <button v-for="(_, dot) in images" :key="dot" type="button" :aria-label="`${dot + 1} / ${images.length}`" :aria-current="dot === index" class="w-2 h-2 rounded-full transition-colors duration-200 cursor-pointer" :class="dot === index ? 'bg-white' : 'bg-white/35 hover:bg-white/60'" @click="go(dot)"></button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import { computed, nextTick, onUnmounted, ref, watch } from "vue";

import { Icon } from "@iconify/vue";
import chevronLeftIcon from "@iconify-icons/mdi/chevron-left";
import chevronRightIcon from "@iconify-icons/mdi/chevron-right";

import ScreenshotFrame from "../__Components__/ScreenshotFrame.vue";

const OPEN_DURATION = 380;
const CLOSE_DURATION = 300;
const EASING = "cubic-bezier(0.32, 0.72, 0, 1)";
const CLOSE_EASING = "cubic-bezier(0.4, 0, 0.2, 1)";
const SWIPE_DISTANCE = 60;

const props = defineProps<{
  open: boolean;
  images: string[];
  index: number;
  title: string;
  icon: string;
  origin?: (index: number) => HTMLElement | null;
}>();

const emit = defineEmits<{
  (e: "update:open", open: boolean): void;
  (e: "update:index", index: number): void;
  (e: "closed"): void;
}>();

const rendered = ref(false);
const closing = ref(false);
const direction = ref<"next" | "prev">("next");

const rootRef = ref<HTMLElement | null>(null);
const stageRef = ref<HTMLElement | null>(null);
const backdropRef = ref<HTMLElement | null>(null);
const chromeRef = ref<HTMLElement | null>(null);
const frameRef = ref<InstanceType<typeof ScreenshotFrame> | null>(null);

const touchStart = ref<{ x: number; y: number } | null>(null);
const touchDelta = ref({ x: 0, y: 0 });

const dragStyle = computed(() => {
  if (!touchStart.value) return undefined;
  const { x, y } = touchDelta.value;
  if (Math.abs(y) > Math.abs(x) && y > 0) return { transform: `translateY(${y}px) scale(${Math.max(0.85, 1 - y / 1200)})` };
  return { transform: `translateX(${x * 0.6}px)` };
});

function frameElement(): HTMLElement | null {
  return (frameRef.value?.$el as HTMLElement | undefined) ?? null;
}

function fade(el: HTMLElement | null, from: number, to: number, duration: number) {
  return el?.animate([{ opacity: from }, { opacity: to }], { duration, easing: EASING, fill: "forwards" }).finished;
}

let hiddenOrigin: HTMLElement | null = null;

function hideOrigin(el: HTMLElement | null) {
  if (hiddenOrigin && hiddenOrigin !== el) hiddenOrigin.style.opacity = "";
  hiddenOrigin = el;
  if (el) el.style.opacity = "0";
}

function mapRect(from: DOMRect, to: DOMRect): string {
  return `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${to.width / from.width}, ${to.height / from.height})`;
}

function createGhost(origin: HTMLElement, rect: DOMRect): HTMLElement {
  const ghost = origin.cloneNode(true) as HTMLElement;
  ghost.removeAttribute("data-screenshot-index");
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    margin: "0",
    opacity: "1",
    transformOrigin: "top left",
    pointerEvents: "none",
  });
  rootRef.value?.insertBefore(ghost, stageRef.value);
  return ghost;
}

async function morph(frame: HTMLElement, origin: HTMLElement, opening: boolean, duration: number) {
  frame.style.transition = "none";
  const frameRect = frame.getBoundingClientRect();
  const originRect = origin.getBoundingClientRect();
  const ghost = createGhost(origin, originRect);
  hideOrigin(origin);

  const frameSmall = mapRect(frameRect, originRect);
  const ghostLarge = mapRect(originRect, frameRect);
  const timing: KeyframeAnimationOptions = { duration, easing: opening ? EASING : CLOSE_EASING, fill: "both" };

  const frameStyle = getComputedStyle(frame);
  const originStyle = getComputedStyle(origin);
  const originRadius = parseFloat(originStyle.borderTopLeftRadius) || 0;
  const scaleX = originRect.width / frameRect.width;
  const scaleY = originRect.height / frameRect.height;
  const large = { borderRadius: frameStyle.borderRadius, boxShadow: frameStyle.boxShadow };
  const small = { borderRadius: `${originRadius / scaleX}px / ${originRadius / scaleY}px`, boxShadow: originStyle.boxShadow };

  const swap = opening ? [0, 0.08] : [0.6, 0.95];
  const swapKeyframes = (from: number, to: number): Keyframe[] => [
    { opacity: from, offset: 0 },
    { opacity: from, offset: swap[0] },
    { opacity: to, offset: swap[1] },
    { opacity: to, offset: 1 },
  ];

  const animations = [frame.animate(opening ? [small, large] : [large, small], timing), frame.animate(opening ? [{ transform: frameSmall }, { transform: "none" }] : [{ transform: "none" }, { transform: frameSmall }], timing), ghost.animate(opening ? [{ transform: "none" }, { transform: ghostLarge }] : [{ transform: ghostLarge }, { transform: "none" }], timing), frame.animate(opening ? swapKeyframes(0, 1) : swapKeyframes(1, 0), { duration, fill: "both" }), ghost.animate(opening ? swapKeyframes(1, 0) : swapKeyframes(0, 1), { duration, fill: "both" })];

  await Promise.allSettled(animations.map((animation) => animation.finished));
  ghost.remove();
  frame.style.transition = "";

  if (opening) animations.forEach((animation) => animation.cancel());
  else hideOrigin(null);
}

async function animateOpen() {
  rendered.value = true;
  closing.value = false;
  await nextTick();

  const frame = frameElement();
  const image = frame?.querySelector("img");
  if (image && !image.complete) await image.decode().catch(() => undefined);

  const origin = props.origin?.(props.index) ?? null;
  fade(backdropRef.value, 0, 1, OPEN_DURATION);
  fade(chromeRef.value, 0, 1, OPEN_DURATION);

  if (frame && origin) {
    await morph(frame, origin, true, OPEN_DURATION);
  } else if (frame) {
    frame.animate(
      [
        { opacity: 0, transform: "scale(0.94)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: OPEN_DURATION, easing: EASING },
    );
  }
}

async function animateClose() {
  if (!rendered.value || closing.value) return;
  closing.value = true;

  const frame = frameElement();
  const origin = props.origin?.(props.index) ?? null;

  const animations: Promise<unknown>[] = [fade(backdropRef.value, 1, 0, CLOSE_DURATION) ?? Promise.resolve(), fade(chromeRef.value, 1, 0, CLOSE_DURATION / 2) ?? Promise.resolve()];

  if (frame && origin) {
    animations.push(morph(frame, origin, false, CLOSE_DURATION));
  } else if (frame) {
    hideOrigin(null);
    animations.push(
      frame.animate(
        [
          { opacity: 1, transform: "none" },
          { opacity: 0, transform: "scale(0.94)" },
        ],
        { duration: CLOSE_DURATION, easing: EASING, fill: "forwards" },
      ).finished,
    );
  }

  await Promise.allSettled(animations);
  rendered.value = false;
  closing.value = false;
  emit("closed");
}

function close() {
  emit("update:open", false);
}

function go(next: number) {
  if (next < 0 || next >= props.images.length || next === props.index) return;
  direction.value = next > props.index ? "next" : "prev";
  emit("update:index", next);
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") close();
  else if (event.key === "ArrowLeft") go(props.index - 1);
  else if (event.key === "ArrowRight") go(props.index + 1);
  else return;
  event.preventDefault();
  event.stopPropagation();
}

function onTouchStart(event: TouchEvent) {
  const touch = event.touches[0];
  touchStart.value = { x: touch.clientX, y: touch.clientY };
  touchDelta.value = { x: 0, y: 0 };
}

function onTouchMove(event: TouchEvent) {
  if (!touchStart.value) return;
  const touch = event.touches[0];
  touchDelta.value = { x: touch.clientX - touchStart.value.x, y: touch.clientY - touchStart.value.y };
}

function onTouchEnd() {
  const { x, y } = touchDelta.value;
  touchStart.value = null;
  touchDelta.value = { x: 0, y: 0 };

  if (Math.abs(y) > Math.abs(x) && y > SWIPE_DISTANCE * 1.5) close();
  else if (x < -SWIPE_DISTANCE) go(props.index + 1);
  else if (x > SWIPE_DISTANCE) go(props.index - 1);
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      animateOpen();
      window.addEventListener("keydown", onKeydown, true);
    } else {
      animateClose();
      window.removeEventListener("keydown", onKeydown, true);
    }
  },
  { immediate: true },
);

watch(
  () => props.index,
  (index) => {
    if (rendered.value && !closing.value) hideOrigin(props.origin?.(index) ?? null);
  },
);

onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown, true);
  hideOrigin(null);
});
</script>

<style scoped>
.screenshot-viewer {
  --stage-top: max(40px, 6vh);
  --stage-bottom: max(64px, 9vh);
  --stage-side: max(24px, 7vw);
  --frame-bar: 46px;
  z-index: 100000;
}

.stage {
  margin: var(--stage-top) var(--stage-side) var(--stage-bottom);
}

.viewer-frame {
  --frame-max-width: calc(100vw - 2 * var(--stage-side));
  --frame-image-max-height: calc(100dvh - var(--stage-top) - var(--stage-bottom) - var(--frame-bar));
  transform-origin: top left;
  transition:
    transform 0.25s cubic-bezier(0.32, 0.72, 0, 1),
    filter 0.3s ease;
}

.viewer-button {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  color: rgba(255, 255, 255, 0.92);
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px) saturate(180%);
  box-shadow: inset 0 0 0 0.5px rgba(255, 255, 255, 0.18);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.viewer-button:hover {
  background: rgba(255, 255, 255, 0.22);
}

@media (hover: none) {
  .viewer-arrow {
    display: none;
  }
}

.viewer-slide-next-enter-active,
.viewer-slide-next-leave-active,
.viewer-slide-prev-enter-active,
.viewer-slide-prev-leave-active {
  transition:
    opacity 0.35s cubic-bezier(0.32, 0.72, 0, 1),
    transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}

.viewer-slide-next-enter-from,
.viewer-slide-prev-leave-to {
  opacity: 0;
  transform: translateX(8%);
}

.viewer-slide-next-leave-to,
.viewer-slide-prev-enter-from {
  opacity: 0;
  transform: translateX(-8%);
}
</style>
