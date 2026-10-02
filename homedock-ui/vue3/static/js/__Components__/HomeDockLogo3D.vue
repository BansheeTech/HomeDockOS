<!-- homedock-ui/vue3/static/js/__Components__/HomeDockLogo3D.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="homedock-logo-3d" :style="{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }">
    <AppIconGraphic v-if="!ready && !(useScene && intro)" :icon="homedockIcon" :color="FALLBACK[resolvedTheme].tile" :glyph-color="FALLBACK[resolvedTheme].glyph" :size="Math.round(canvasHeight / frame)" class="homedock-logo-fallback" />
    <canvas v-if="useScene" ref="canvasRef" class="homedock-logo-canvas" :class="{ 'homedock-logo-ready': ready }" :style="canvasStyle"></canvas>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from "vue";

import { homedockIcon } from "../__Config__/HomeDockIcon";
import type { ThemeData } from "../__Types__/ThemeData";
import type { HomeDockLogoEngine, HomeDockLogoSide, HomeDockLogoState, HomeDockLogoTheme, HomeDockSatellite } from "../__Utils__/HomeDockLogoEngine";

import AppIconGraphic from "./AppIconGraphic.vue";

const FALLBACK: Record<HomeDockLogoTheme, { tile: string; glyph: string }> = {
  default: { tile: "#ffffff", glyph: "#18181b" },
  noir: { tile: "#27272a", glyph: "#ffffff" },
  aeroplus: { tile: "#27272a", glyph: "#ffffff" },
};

const props = withDefaults(
  defineProps<{
    state?: HomeDockLogoState;
    size?: number;
    width?: number;
    height?: number;
    frame?: number;
    intro?: boolean;
    satellites?: HomeDockSatellite[];
    theme?: string;
    bleed?: number;
  }>(),
  {
    state: "idle",
    size: 120,
    width: undefined,
    height: undefined,
    frame: 1.33,
    intro: false,
    satellites: () => [],
    theme: undefined,
    bleed: 0,
  },
);

const themeData = inject<ThemeData | null>("data-theme", null);

const resolvedTheme = computed<HomeDockLogoTheme>(() => {
  const selected = props.theme ?? themeData?.selected_theme;
  return selected === "noir" || selected === "aeroplus" ? selected : "default";
});

const canvasWidth = computed(() => props.width ?? props.size);
const canvasHeight = computed(() => props.height ?? props.size);
const renderScale = computed(() => 1 + props.bleed * 2);
const renderWidth = computed(() => Math.round(canvasWidth.value * renderScale.value));
const renderHeight = computed(() => Math.round(canvasHeight.value * renderScale.value));

const canvasStyle = computed(() => ({
  left: `${-canvasWidth.value * props.bleed}px`,
  top: `${-canvasHeight.value * props.bleed}px`,
  width: `${renderWidth.value}px`,
  height: `${renderHeight.value}px`,
}));

const canvasRef = ref<HTMLCanvasElement | null>(null);
const ready = ref(false);

let engine: HomeDockLogoEngine | null = null;
let disposed = false;
let resolveEngine: (created: HomeDockLogoEngine | null) => void = () => {};
const engineReady = new Promise<HomeDockLogoEngine | null>((resolve) => (resolveEngine = resolve));

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
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;

  const x = (event.clientX - (rect.left + rect.width / 2)) / (window.innerWidth / 2);
  const y = (event.clientY - (rect.top + rect.height / 2)) / (window.innerHeight / 2);
  engine?.setPointer(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y)));
}

function handleVisibility() {
  if (document.hidden) engine?.stop();
  else engine?.start();
}

async function dock(hold = 0): Promise<void> {
  if (!useScene) return;
  const created = await engineReady;
  await created?.dock(hold);
}

function nudge(side: HomeDockLogoSide) {
  engine?.nudge(side);
}

function setSecretLength(length: number) {
  engine?.setSecretLength(length);
}

defineExpose({ dock, nudge, setSecretLength });

watch(
  () => props.state,
  (state) => engine?.setState(state),
);

watch([renderWidth, renderHeight], ([width, height]) => engine?.resize(width, height));

onMounted(() => {
  if (!useScene) return;

  requestAnimationFrame(async () => {
    const { HomeDockLogoEngine } = await import("../__Utils__/HomeDockLogoEngine");
    if (disposed || !canvasRef.value) {
      resolveEngine(null);
      return;
    }

    engine = new HomeDockLogoEngine(canvasRef.value, { theme: resolvedTheme.value, frame: props.frame * renderScale.value, intro: props.intro, satellites: props.satellites });
    engine.setState(props.state);
    engine.resize(renderWidth.value, renderHeight.value);
    engine.start();
    resolveEngine(engine);

    window.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("visibilitychange", handleVisibility);

    requestAnimationFrame(() => {
      ready.value = true;
    });
  });
});

onBeforeUnmount(() => {
  disposed = true;
  resolveEngine(null);
  window.removeEventListener("pointermove", handlePointerMove);
  document.removeEventListener("visibilitychange", handleVisibility);
  engine?.dispose();
  engine = null;
});
</script>

<style scoped>
.homedock-logo-3d {
  position: relative;
  flex-shrink: 0;
}

.homedock-logo-3d .homedock-logo-fallback {
  position: absolute;
  top: 50%;
  left: 50%;
  translate: -50% -50%;
}

.homedock-logo-canvas {
  position: absolute;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.5s ease;
}

.homedock-logo-ready {
  opacity: 1;
}
</style>
