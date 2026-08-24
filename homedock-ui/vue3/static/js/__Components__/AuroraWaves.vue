<!-- homedock-ui/vue3/static/js/__Components__/AuroraWaves.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <canvas ref="canvasRef" class="block w-full h-full pointer-events-none" :style="flipped ? { transform: 'scaleY(-1)' } : undefined" aria-hidden="true"></canvas>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from "vue";

interface Props {
  maxHeight?: number;
  amplitudeScale?: number;
  flipped?: boolean;
  revealDuration?: number;
  speed?: number;
}

const props = withDefaults(defineProps<Props>(), {
  maxHeight: 0.1,
  amplitudeScale: 1,
  flipped: false,
  revealDuration: 2800,
  speed: 0.0016,
});

const COLORS: Array<[number, number, number, number]> = [
  [59, 130, 246, 0.12],
  [99, 102, 241, 0.08],
  [236, 72, 153, 0.06],
  [37, 99, 235, 0.05],
];

const canvasRef = ref<HTMLCanvasElement | null>(null);

let animId: number | null = null;
let observer: ResizeObserver | null = null;

const easeOutSmooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 4));

onMounted(() => {
  const canvas = canvasRef.value;

  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  const waves = COLORS.map((color, i) => ({
    color,
    baseY: (i + 1) / (COLORS.length + 1),
    amplitude: (30 + Math.random() * 40) * props.amplitudeScale,
    frequency: 0.004 + Math.random() * 0.002,
    phaseSpeed: (0.8 + Math.random() * 0.4) * (i % 2 === 0 ? 1 : -1),
    thickness: 60 + Math.random() * 50,
  }));

  let time = 0;
  let startTs: number | null = null;

  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };

  const drawFrame = (reveal: number) => {
    const w = canvas.width;
    const h = canvas.height;

    if (!w || !h) return;

    ctx.clearRect(0, 0, w, h);

    const auroraH = h * props.maxHeight;

    for (const wave of waves) {
      const yCenter = wave.baseY * auroraH;
      const amp = wave.amplitude * reveal;

      ctx.beginPath();
      ctx.moveTo(0, 0);

      for (let x = 0; x <= w; x += 4) {
        const nx = x * wave.frequency;
        const y = yCenter + Math.sin(nx + time * wave.phaseSpeed) * amp + Math.sin(nx * 2.3 + time * wave.phaseSpeed * 0.7) * amp * 0.4;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(w, 0);
      ctx.closePath();

      const [r, g, b, a] = wave.color;
      const aR = a * reveal;
      const grad = ctx.createLinearGradient(0, 0, 0, yCenter + wave.thickness);
      grad.addColorStop(0, `rgba(${r},${g},${b},${aR * 1.5})`);
      grad.addColorStop(0.5, `rgba(${r},${g},${b},${aR})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();

      for (let x = 0; x <= w; x += 4) {
        const nx = x * wave.frequency;
        const y = yCenter + Math.sin(nx + time * wave.phaseSpeed) * amp + Math.sin(nx * 2.3 + time * wave.phaseSpeed * 0.7) * amp * 0.4;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.strokeStyle = `rgba(${r},${g},${b},${aR * 2.5})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  };

  const loop = (ts: number) => {
    if (!canvasRef.value) return;

    if (startTs === null) startTs = ts;

    time += props.speed;
    drawFrame(easeOutSmooth(Math.min((ts - startTs) / props.revealDuration, 1)));

    animId = requestAnimationFrame(loop);
  };

  observer = new ResizeObserver(() => {
    resize();
    if (reducedMotion) drawFrame(1);
  });

  observer.observe(canvas);

  resize();

  if (reducedMotion) {
    drawFrame(1);
  } else {
    animId = requestAnimationFrame(loop);
  }
});

onBeforeUnmount(() => {
  if (animId) cancelAnimationFrame(animId);
  if (observer) observer.disconnect();
});
</script>
