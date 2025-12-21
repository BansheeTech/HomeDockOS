<!-- homedock-ui/vue3/static/js/__Components__/StaticOscillatingLines.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <canvas ref="canvas" class="canvas-fullscreen"></canvas>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount } from "vue";

interface Point {
  x: number;
  yBase: number;
  phase: number;
  currentY: number;
  targetY: number;
}

export default defineComponent({
  name: "StaticOscillatingLines",
  props: {
    numLines: { type: Number, default: 3 },
    amplitude: { type: Number, default: 200 },
    pointsPerLine: { type: Number, default: 6 },
    lineWidth: { type: Number, default: 75 },
  },
  setup(props) {
    const canvas = ref<HTMLCanvasElement | null>(null);
    const ctx = ref<CanvasRenderingContext2D | null>(null);
    const lines = ref<Point[][]>([]);
    const numLines = props.numLines;
    const pointsPerLine = props.pointsPerLine;
    const amplitude = props.amplitude;
    const speed = 0.001;
    const opacity = ref(0);
    const opacityIncrement = 0.03;

    const mouse = ref({ x: -1000, y: -1000 });
    const mouseRadius = 650;
    const mouseStrength = 500;
    const smoothing = 0.04;

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

    const drawLine = (points: Point[]) => {
      if (!ctx.value || points.length < 2) return;

      ctx.value.beginPath();
      ctx.value.moveTo(points[0].x, points[0].currentY);

      const resolution = 20;

      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[Math.min(points.length - 1, i + 1)];
        const p3 = points[Math.min(points.length - 1, i + 2)];

        for (let j = 1; j <= resolution; j++) {
          const t = j / resolution;
          const point = catmullRomSpline(p0, p1, p2, p3, t);
          ctx.value.lineTo(point.x, point.y);
        }
      }

      ctx.value.lineWidth = props.lineWidth;
      ctx.value.lineCap = "round";
      ctx.value.lineJoin = "round";
      ctx.value.strokeStyle = `rgba(11, 11, 11, ${opacity.value})`;
      ctx.value.stroke();
    };

    const animate = () => {
      if (ctx.value && canvas.value) {
        ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);

        if (opacity.value < 0.3) {
          opacity.value += opacityIncrement;
        }

        for (const line of lines.value) {
          for (const point of line) {
            point.phase += speed;
            const baseY = point.yBase + amplitude * Math.sin(point.phase);
            const mouseEffect = getMouseInfluence(point.x, point.currentY);
            point.targetY = baseY + mouseEffect;
            point.currentY += (point.targetY - point.currentY) * smoothing;
          }
          drawLine(line);
        }

        requestAnimationFrame(animate);
      }
    };

    onMounted(() => {
      if (canvas.value) {
        ctx.value = canvas.value.getContext("2d");
        updateCanvasSize();

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
