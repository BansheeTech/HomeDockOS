<!-- homedock-ui/vue3/static/js/__Components__/PrismPanesLoader.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <canvas ref="canvas" class="w-full h-full pointer-events-none" />
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

interface Props {
  isChecking?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
}

const props = withDefaults(defineProps<Props>(), { isChecking: true, isSuccess: false, isError: false });

const { selected_theme } = useTheme();

const isDark = selected_theme !== "default";

const canvas = ref<HTMLCanvasElement | null>(null);

const BASE_W = 176;
const BASE_H = 272;

const PANE_SHAPES = [
  { dx: -34, dy: 30, w: 58, h: 104, r: 14, color: [124, 131, 246] },
  { dx: 0, dy: 0, w: 58, h: 104, r: 14, color: [103, 232, 249] },
  { dx: 34, dy: -30, w: 58, h: 104, r: 14, color: [167, 139, 250] },
];

const BASE_SHEAR = 0.62;

const SUCCESS_COLOR = [52, 211, 153];
const ERROR_COLOR = [244, 113, 113];

const CHECKING_SPREAD = 0.75;
const SUCCESS_SHEAR = 0.1;
const SUCCESS_ZOOM = 1.15;
const SUCCESS_TILT = [-32, 0, 32].map((deg) => (deg * Math.PI) / 180);

interface PaneState {
  phase: number;
  jitter: number;
  r: number;
  g: number;
  b: number;
  targetR: number;
  targetG: number;
  targetB: number;
  alpha: number;
  targetAlpha: number;
  spin: number;
  targetSpin: number;
  spinDelay: number;
}

const panes: PaneState[] = [];

const baseAlpha = isDark ? 0.36 : 0.52;
const colorEase = 0.05;
const HOVER_ZOOM = 0.012;

const SPIN_TURN = Math.PI * 2;
const SPIN_EASE = 0.075;
const SPIN_STAGGER = 7;

let ctx: CanvasRenderingContext2D | null = null;
let raf = 0;
let time = 0;

let spread = CHECKING_SPREAD;
let targetSpread = CHECKING_SPREAD;
let speed = 0.016;
let targetSpeed = 0.016;
let shear = BASE_SHEAR;
let targetShear = BASE_SHEAR;
let motion = 1;
let targetMotion = 1;
let zoom = 1;
let targetZoom = 1;
let ease = 0.045;

let pointerX = -9999;
let pointerY = -9999;
let hover = 0;

const makePanes = () => {
  panes.length = 0;

  PANE_SHAPES.forEach((shape, i) => {
    panes.push({
      phase: i * 2.1,
      jitter: 0.8 + i * 0.16,
      r: shape.color[0],
      g: shape.color[1],
      b: shape.color[2],
      targetR: shape.color[0],
      targetG: shape.color[1],
      targetB: shape.color[2],
      alpha: 0,
      targetAlpha: baseAlpha,
      spin: 0,
      targetSpin: 0,
      spinDelay: 0,
    });
  });
};

const toChecking = () => {
  targetSpread = CHECKING_SPREAD;
  targetSpeed = 0.016;
  targetShear = BASE_SHEAR;
  targetMotion = 1;
  targetZoom = 1;
  ease = 0.045;

  panes.forEach((pane, i) => {
    pane.targetAlpha = baseAlpha;
    pane.targetR = PANE_SHAPES[i].color[0];
    pane.targetG = PANE_SHAPES[i].color[1];
    pane.targetB = PANE_SHAPES[i].color[2];
    pane.spin = 0;
    pane.targetSpin = 0;
    pane.spinDelay = 0;
  });
};

const toSuccess = () => {
  targetSpread = 0;
  targetSpeed = 0.006;
  targetShear = SUCCESS_SHEAR;
  targetMotion = 0;
  targetZoom = SUCCESS_ZOOM;
  ease = 0.12;

  panes.forEach((pane, i) => {
    pane.targetAlpha = baseAlpha * 0.8;
    pane.targetR = SUCCESS_COLOR[0];
    pane.targetG = SUCCESS_COLOR[1];
    pane.targetB = SUCCESS_COLOR[2];
    pane.targetSpin = pane.spin + SPIN_TURN;
    pane.spinDelay = i * SPIN_STAGGER;
  });
};

const toError = () => {
  targetSpread = 1.35;
  targetSpeed = 0.005;
  targetShear = BASE_SHEAR + 0.24;
  targetMotion = 1;
  targetZoom = 0.92;
  ease = 0.045;

  panes.forEach((pane) => {
    pane.targetAlpha = baseAlpha * 0.75;
    pane.targetR = ERROR_COLOR[0];
    pane.targetG = ERROR_COLOR[1];
    pane.targetB = ERROR_COLOR[2];
    pane.spin = 0;
    pane.targetSpin = 0;
    pane.spinDelay = 0;
  });
};

watch(
  () => props.isError,
  (val) => val && toError(),
);

watch(
  () => props.isSuccess,
  (val) => val && toSuccess(),
);

watch(
  () => props.isChecking,
  (val) => val && !props.isError && !props.isSuccess && toChecking(),
);

const handlePointerMove = (e: PointerEvent) => {
  pointerX = e.clientX;
  pointerY = e.clientY;
};

const resize = () => {
  if (!canvas.value || !ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const width = canvas.value.clientWidth || BASE_W;
  const height = canvas.value.clientHeight || BASE_H;

  canvas.value.width = Math.round(width * dpr);
  canvas.value.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
};

const roundedRect = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
};

const updateHover = () => {
  if (!canvas.value) return;

  const rect = canvas.value.getBoundingClientRect();
  const inside = pointerX >= rect.left && pointerX <= rect.right && pointerY >= rect.top && pointerY <= rect.bottom;

  hover += ((inside ? 1 : 0) - hover) * 0.08;
};

const drawPane = (index: number, scale: number, cx: number, cy: number) => {
  if (!ctx) return;

  const shape = PANE_SHAPES[index];
  const pane = panes[index];

  const float = Math.sin(time * pane.jitter + pane.phase) * 9 * motion;
  const breathe = 1 + Math.sin(time * pane.jitter * 0.47 + pane.phase) * 0.025 * motion;

  const x = cx + shape.dx * spread * scale;
  const y = cy + (shape.dy * spread + float) * scale;

  const w = shape.w * scale * breathe;
  const h = shape.h * scale * breathe;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(SUCCESS_TILT[index] * (1 - motion) + pane.spin);
  ctx.transform(1, shear, 0, 1, 0, 0);

  const gradient = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  const shine = 0.15 + 0.7 * (0.5 + 0.5 * Math.sin(time * 0.55 + index * 2));
  const rgb = `${Math.round(pane.r)}, ${Math.round(pane.g)}, ${Math.round(pane.b)}`;

  gradient.addColorStop(0, `rgba(${rgb}, ${pane.alpha * 0.7})`);
  gradient.addColorStop(Math.max(0.01, shine - 0.16), `rgba(${rgb}, ${pane.alpha * 0.85})`);
  gradient.addColorStop(shine, `rgba(${rgb}, ${pane.alpha * 1.25})`);
  gradient.addColorStop(Math.min(0.99, shine + 0.16), `rgba(${rgb}, ${pane.alpha * 0.8})`);
  gradient.addColorStop(1, `rgba(${rgb}, ${pane.alpha * 0.55})`);

  ctx.shadowColor = `rgba(${rgb}, ${pane.alpha * 0.55})`;
  ctx.shadowBlur = 16 * scale;
  ctx.fillStyle = gradient;

  roundedRect(ctx, -w / 2, -h / 2, w, h, shape.r * scale);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.lineWidth = Math.max(0.6, 1.1 * scale);
  ctx.strokeStyle = `rgba(255, 255, 255, ${pane.alpha * 0.55})`;
  ctx.stroke();

  ctx.restore();
};

const animate = () => {
  if (!ctx || !canvas.value) return;

  const width = canvas.value.clientWidth || BASE_W;
  const height = canvas.value.clientHeight || BASE_H;
  const dpr = window.devicePixelRatio || 1;

  if (Math.abs(canvas.value.width - width * dpr) > 1 || Math.abs(canvas.value.height - height * dpr) > 1) resize();

  ctx.clearRect(0, 0, width, height);

  speed += (targetSpeed - speed) * ease;
  spread += (targetSpread - spread) * ease;
  shear += (targetShear - shear) * ease;
  motion += (targetMotion - motion) * ease;
  zoom += (targetZoom - zoom) * ease;
  time += speed;

  updateHover();

  const scale = Math.min(1, width / BASE_W, height / BASE_H) * zoom * (1 + hover * HOVER_ZOOM);

  ctx.globalCompositeOperation = isDark ? "lighter" : "source-over";

  panes.forEach((pane) => {
    pane.alpha += (pane.targetAlpha - pane.alpha) * ease;
    pane.r += (pane.targetR - pane.r) * colorEase;
    pane.g += (pane.targetG - pane.g) * colorEase;
    pane.b += (pane.targetB - pane.b) * colorEase;

    if (pane.spinDelay > 0) pane.spinDelay--;
    else pane.spin += (pane.targetSpin - pane.spin) * SPIN_EASE;
  });

  for (let i = panes.length - 1; i >= 0; i--) drawPane(i, scale, width / 2, height / 2);

  ctx.globalCompositeOperation = "source-over";

  raf = requestAnimationFrame(animate);
};

onMounted(() => {
  if (!canvas.value) return;

  ctx = canvas.value.getContext("2d");

  if (!ctx) return;

  makePanes();
  resize();

  if (props.isError) toError();
  else if (props.isSuccess) toSuccess();

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", handlePointerMove);

  raf = requestAnimationFrame(animate);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  window.removeEventListener("resize", resize);
  window.removeEventListener("pointermove", handlePointerMove);
});
</script>
