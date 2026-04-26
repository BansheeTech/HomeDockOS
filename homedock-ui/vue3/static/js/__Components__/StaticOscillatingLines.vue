<!-- homedock-ui/vue3/static/js/__Components__/StaticOscillatingLines.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <canvas ref="canvas" class="canvas-fullscreen"></canvas>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted, onBeforeUnmount } from "vue";

interface Point {
  x: number;
  yBase: number;
  phase: number;
  currentY: number;
  targetY: number;
}

interface LineState {
  yOffset: number;
  targetYOffset: number;
  opacity: number;
  targetOpacity: number;
  r: number;
  g: number;
  b: number;
  targetR: number;
  targetG: number;
  targetB: number;
  widthScale: number;
  targetWidthScale: number;
  survivor: boolean;
}

export default defineComponent({
  name: "StaticOscillatingLines",
  props: {
    numLines: { type: Number, default: 3 },
    amplitude: { type: Number, default: 200 },
    pointsPerLine: { type: Number, default: 6 },
    lineWidth: { type: Number, default: 75 },
    isSuccess: { type: Boolean, default: false },
    isError: { type: Boolean, default: false },
    isChecking: { type: Boolean, default: true },
  },
  setup(props) {
    const canvas = ref<HTMLCanvasElement | null>(null);
    const ctx = ref<CanvasRenderingContext2D | null>(null);
    const lines = ref<Point[][]>([]);
    const lineStates = ref<LineState[]>([]);
    const numLines = props.numLines;
    const pointsPerLine = props.pointsPerLine;
    const amplitude = props.amplitude;
    const baseSpeed = 0.001;
    const errorSpeed = 0.004;
    const speed = ref(baseSpeed);
    const opacity = ref(0);
    const opacityIncrement = 0.03;

    const errorSurvivorCount = 3;

    const mouse = ref({ x: -1000, y: -1000 });
    const mouseRadius = 650;
    const mouseStrength = 500;
    const smoothing = 0.04;
    const stateEase = 0.025;
    const colorEase = 0.04;

    const handleMouseMove = (e: MouseEvent) => {
      mouse.value.x = e.clientX;
      mouse.value.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.value.x = -1000;
      mouse.value.y = -1000;
    };

    const getMouseInfluence = (px: number, py: number): number => {
      const dx = mouse.value.x - px;
      const dy = mouse.value.y - py;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > mouseRadius) return 0;

      const force = (1 - distance / mouseRadius) * mouseStrength;
      return dy > 0 ? -force : force;
    };

    const initLineStates = () => {
      lineStates.value = [];
      for (let i = 0; i < numLines; i++) {
        lineStates.value.push({
          yOffset: 0,
          targetYOffset: 0,
          opacity: 1,
          targetOpacity: 1,
          r: 11,
          g: 11,
          b: 11,
          targetR: 11,
          targetG: 11,
          targetB: 11,
          widthScale: 1,
          targetWidthScale: 1,
          survivor: false,
        });
      }
    };

    const disperseAll = () => {
      const h = canvas.value?.height || window.innerHeight;
      lineStates.value.forEach((s, i) => {
        const direction = i < numLines / 2 ? -1 : 1;
        s.targetYOffset = direction * h;
        s.targetOpacity = 0;
        s.survivor = false;
      });
    };

    const disperseWithSurvivors = () => {
      const h = canvas.value?.height || window.innerHeight;
      const centerIndex = Math.floor(numLines / 2);
      const survivorStart = Math.max(0, centerIndex - Math.floor(errorSurvivorCount / 2));

      lineStates.value.forEach((s, i) => {
        if (i >= survivorStart && i < survivorStart + errorSurvivorCount) {
          s.survivor = true;
          s.targetYOffset = 0;
          s.targetOpacity = 1;
          s.targetR = 185;
          s.targetG = 28;
          s.targetB = 28;
          s.targetWidthScale = 2.5;
        } else {
          s.survivor = false;
          const direction = i < centerIndex ? -1 : 1;
          s.targetYOffset = direction * h;
          s.targetOpacity = 0;
        }
      });
    };

    const resetLines = () => {
      lineStates.value.forEach((s) => {
        s.targetYOffset = 0;
        s.targetOpacity = 1;
        s.targetR = 11;
        s.targetG = 11;
        s.targetB = 11;
        s.targetWidthScale = 1;
        s.survivor = false;
      });
    };

    watch(
      () => props.isSuccess,
      (val) => {
        if (val) disperseAll();
      },
    );
    watch(
      () => props.isError,
      (val) => {
        if (val) {
          disperseWithSurvivors();
          speed.value = errorSpeed;
        }
      },
    );
    watch(
      () => props.isChecking,
      (val) => {
        if (val) {
          resetLines();
          speed.value = baseSpeed;
        }
      },
    );

    const updateCanvasSize = () => {
      if (canvas.value) {
        canvas.value.width = window.innerWidth;
        canvas.value.height = window.innerHeight;

        for (let i = 0; i < lines.value.length; i++) {
          const yBase = (canvas.value.height / (numLines + 1)) * (i + 1);
          for (let j = 0; j < lines.value[i].length; j++) {
            const point = lines.value[i][j];
            point.x = (j / (pointsPerLine - 1)) * canvas.value.width;
            point.yBase = yBase;
            const newY = yBase + amplitude * Math.sin(point.phase);
            point.currentY = newY;
            point.targetY = newY;
          }
        }
      }
    };

    const catmullRomSpline = (p0: Point, p1: Point, p2: Point, p3: Point, t: number) => {
      const t2 = t * t;
      const t3 = t2 * t;

      const x = 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);

      const y = 0.5 * (2 * p1.currentY + (-p0.currentY + p2.currentY) * t + (2 * p0.currentY - 5 * p1.currentY + 4 * p2.currentY - p3.currentY) * t2 + (-p0.currentY + 3 * p1.currentY - 3 * p2.currentY + p3.currentY) * t3);

      return { x, y };
    };

    const drawLine = (points: Point[], state: LineState) => {
      if (!ctx.value || points.length < 2) return;

      ctx.value.beginPath();
      ctx.value.moveTo(points[0].x, points[0].currentY + state.yOffset);

      const resolution = 20;

      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[Math.min(points.length - 1, i + 1)];
        const p3 = points[Math.min(points.length - 1, i + 2)];

        for (let j = 1; j <= resolution; j++) {
          const t = j / resolution;
          const point = catmullRomSpline(p0, p1, p2, p3, t);
          ctx.value.lineTo(point.x, point.y + state.yOffset);
        }
      }

      ctx.value.lineWidth = props.lineWidth * state.widthScale;
      ctx.value.lineCap = "round";
      ctx.value.lineJoin = "round";
      const finalOpacity = Math.min(opacity.value, 0.3) * state.opacity;
      ctx.value.strokeStyle = `rgba(${Math.round(state.r)}, ${Math.round(state.g)}, ${Math.round(state.b)}, ${finalOpacity})`;
      ctx.value.stroke();
    };

    const animate = () => {
      if (ctx.value && canvas.value) {
        ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);

        if (opacity.value < 0.3) {
          opacity.value += opacityIncrement;
        }

        for (let i = 0; i < lines.value.length; i++) {
          const line = lines.value[i];
          const state = lineStates.value[i];

          if (state) {
            state.yOffset += (state.targetYOffset - state.yOffset) * stateEase;
            state.opacity += (state.targetOpacity - state.opacity) * stateEase;
            state.r += (state.targetR - state.r) * colorEase;
            state.g += (state.targetG - state.g) * colorEase;
            state.b += (state.targetB - state.b) * colorEase;
            state.widthScale += (state.targetWidthScale - state.widthScale) * stateEase;
          }

          for (const point of line) {
            point.phase += speed.value;
            const baseY = point.yBase + amplitude * Math.sin(point.phase);
            const mouseEffect = getMouseInfluence(point.x, point.currentY);
            point.targetY = baseY + mouseEffect;
            point.currentY += (point.targetY - point.currentY) * smoothing;
          }

          drawLine(line, state || { yOffset: 0, opacity: 1, r: 11, g: 11, b: 11, targetYOffset: 0, targetOpacity: 1, targetR: 11, targetG: 11, targetB: 11, survivor: false });
        }

        requestAnimationFrame(animate);
      }
    };

    onMounted(() => {
      if (canvas.value) {
        ctx.value = canvas.value.getContext("2d");
        updateCanvasSize();
        initLineStates();

        for (let i = 0; i < numLines; i++) {
          const yBase = (canvas.value.height / (numLines + 1)) * (i + 1);
          const line: Point[] = [];
          for (let j = 0; j < pointsPerLine; j++) {
            const x = (j / (pointsPerLine - 1)) * canvas.value.width;
            const phase = Math.random() * Math.PI * 2;
            const initialY = yBase + amplitude * Math.sin(phase);
            line.push({ x, yBase, phase, currentY: initialY, targetY: initialY });
          }
          lines.value.push(line);
        }

        animate();
        window.addEventListener("resize", updateCanvasSize);
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseleave", handleMouseLeave);
      }
    });

    onBeforeUnmount(() => {
      window.removeEventListener("resize", updateCanvasSize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    });

    return {
      canvas,
    };
  },
});
</script>

<style scoped>
.canvas-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}
</style>
