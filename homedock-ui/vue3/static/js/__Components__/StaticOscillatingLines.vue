<!-- homedock-ui/vue3/static/js/__Components__/StaticOscillatingLines.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
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
}

export default defineComponent({
  name: "StaticOscillatingLines",
  props: {
    numLines: { type: Number, default: 3 },
    amplitude: { type: Number, default: 500 },
    pointsPerLine: { type: Number, default: 3 },
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
    const opacityIncrement = 0.05;

    const updateCanvasSize = () => {
      if (canvas.value) {
        canvas.value.width = window.innerWidth;
        canvas.value.height = window.innerHeight;
      }
    };

    const drawLine = (points: Point[]) => {
      if (!ctx.value) return;

      ctx.value.beginPath();
      ctx.value.moveTo(points[0].x, points[0].yBase + amplitude * Math.sin(points[0].phase));

      for (let i = 0; i < points.length - 1; i++) {
        const x_mid = (points[i].x + points[i + 1].x) / 2;
        const y_mid = (points[i].yBase + points[i + 1].yBase) / 2;
        const cp_x1 = (x_mid + points[i].x) / 2;
        const cp_x2 = (x_mid + points[i + 1].x) / 2;

        ctx.value.bezierCurveTo(cp_x1, points[i].yBase + amplitude * Math.sin(points[i].phase), cp_x2, y_mid + amplitude * Math.sin((points[i].phase + points[i + 1].phase) / 2), points[i + 1].x, points[i + 1].yBase + amplitude * Math.sin(points[i + 1].phase));
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
            line.push({ x, yBase, phase });
          }
          lines.value.push(line);
        }

        animate();
        window.addEventListener("resize", updateCanvasSize);
      }
    });

    onBeforeUnmount(() => {
      window.removeEventListener("resize", updateCanvasSize);
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
