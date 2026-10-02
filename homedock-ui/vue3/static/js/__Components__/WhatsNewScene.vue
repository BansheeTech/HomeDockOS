<!-- homedock-ui/vue3/static/js/__Components__/WhatsNewScene.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div v-if="useScene" ref="containerRef" class="whatsnew-scene" :style="{ height: `${height}px` }" aria-hidden="true">
    <canvas ref="canvasRef" class="whatsnew-scene-canvas" :class="{ 'whatsnew-scene-ready': ready }"></canvas>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, onBeforeUnmount, onMounted, ref } from "vue";

import type { ThemeData } from "../__Types__/ThemeData";
import type { HomeDockLogoTheme, HomeDockSatellite } from "../__Utils__/HomeDockLogoEngine";
import type { WhatsNewSceneEngine } from "../__Utils__/WhatsNewSceneEngine";

const props = withDefaults(
  defineProps<{
    tiles?: HomeDockSatellite[];
    height?: number;
    theme?: string;
  }>(),
  {
    tiles: () => [],
    height: 200,
    theme: undefined,
  },
);

const themeData = inject<ThemeData | null>("data-theme", null);

const resolvedTheme = computed<HomeDockLogoTheme>(() => {
  const selected = props.theme ?? themeData?.selected_theme;
  return selected === "noir" || selected === "aeroplus" ? selected : "default";
});

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const ready = ref(false);

let engine: WhatsNewSceneEngine | null = null;
let disposed = false;
let inView = true;
let resizeObserver: ResizeObserver | null = null;
let intersectionObserver: IntersectionObserver | null = null;

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

const useScene = supportsWebGL();

function handlePointerMove(event: PointerEvent) {
  const rect = containerRef.value?.getBoundingClientRect();
  if (!rect) return;

  const x = (event.clientX - (rect.left + rect.width / 2)) / (window.innerWidth / 2);
  const y = (event.clientY - (rect.top + rect.height / 2)) / (window.innerHeight / 2);
  engine?.setPointer(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y)));
}

function syncRunning() {
  if (document.hidden || !inView) engine?.stop();
  else engine?.start();
}

function resize() {
  const width = containerRef.value?.clientWidth ?? 0;
  if (width > 0) engine?.resize(width, props.height);
}

onMounted(() => {
  if (!useScene) return;

  requestAnimationFrame(async () => {
    const { WhatsNewSceneEngine } = await import("../__Utils__/WhatsNewSceneEngine");
    if (disposed || !canvasRef.value || !containerRef.value) return;

    engine = new WhatsNewSceneEngine(canvasRef.value, { theme: resolvedTheme.value, tiles: props.tiles });
    resize();
    engine.start();

    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(containerRef.value);

    intersectionObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncRunning();
    });
    intersectionObserver.observe(containerRef.value);

    window.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("visibilitychange", syncRunning);

    requestAnimationFrame(() => {
      ready.value = true;
    });
  });
});

onBeforeUnmount(() => {
  disposed = true;
  resizeObserver?.disconnect();
  intersectionObserver?.disconnect();
  window.removeEventListener("pointermove", handlePointerMove);
  document.removeEventListener("visibilitychange", syncRunning);
  engine?.dispose();
  engine = null;
});
</script>

<style scoped>
.whatsnew-scene {
  position: relative;
  width: 100%;
}

.whatsnew-scene-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.5s ease;
}

.whatsnew-scene-ready {
  opacity: 1;
}
</style>
