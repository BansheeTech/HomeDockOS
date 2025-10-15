<!-- homedock-ui/vue3/static/js/__Components__/OrbitLoader.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="fixed inset-0 flex items-center justify-center z-50">
    <div class="relative flex items-center justify-center w-56 h-56">
      <canvas ref="canvas" class="absolute inset-0 w-full h-full pointer-events-none z-50"></canvas>

      <div class="flex items-center justify-center backdrop-blur-xl rounded-full w-40 h-40 p-10 relative z-[40] bg-slate-500/5">
        <Transition name="fade-scale" mode="out-in">
          <Icon v-if="isChecking" :icon="searchIcon" :class="[themeClasses.appLoadingIcon]" class="text-6xl" :style="{ transform: `translate(${posX}px, ${posY}px)` }" key="loading" />
          <Icon v-else-if="isSuccess" :icon="checkBoldIcon" :class="[themeClasses.appLoadingIcon]" class="text-6xl" key="success" />
          <AnimatedIcon v-else-if="isError" :icons="[robotConfusedIcon, linkVariantOff]" :interval="1500" :class="[themeClasses.appLoadingIcon]" :icon-size="60" key="error" />
        </Transition>

        <Transition name="https" mode="out-in">
          <div v-if="isHttps" :class="[themeClasses.sslAdvisorBack]" class="px-4 py-1 absolute mt-52 rounded-full flex items-center" key="https">
            <Icon :icon="lockIcon" :class="[themeClasses.sslAdvsisorIcon]" class="text-sm mr-1" />
            <span :class="[themeClasses.sslAdvsisorIcon]" class="text-sm ml>1">HTTPS</span>
            <Icon :icon="loadingIcon" :class="[themeClasses.sslAdvsisorIcon]" class="text-sm animate-spin ml-1" />
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import { Icon } from "@iconify/vue";
import searchIcon from "@iconify-icons/mdi/magnify";
import checkBoldIcon from "@iconify-icons/mdi/check-bold";
import robotConfusedIcon from "@iconify-icons/mdi/robot-confused";
import lockIcon from "@iconify-icons/mdi/lock";
import loadingIcon from "@iconify-icons/mdi/loading";
import linkVariantOff from "@iconify-icons/mdi/link-variant-off";

import AnimatedIcon from "../__Components__/AnimatedIcon.vue";

const { themeClasses } = useTheme();

const canvas = ref<HTMLCanvasElement | null>(null);
let animationFrameId: number;

defineProps({
  isChecking: Boolean,
  isSuccess: Boolean,
  isError: Boolean,
  isHttps: Boolean,
});

const posX = ref(0);
const posY = ref(0);
let targetX = 0;
let targetY = 0;
let moveInterval: ReturnType<typeof setInterval>;

const moveRandomly = () => {
  targetX = Math.random() * 40 - 20;
  targetY = Math.random() * 40 - 20;
};

const smoothMove = () => {
  posX.value += (targetX - posX.value) * 0.1;
  posY.value += (targetY - posY.value) * 0.1;
  requestAnimationFrame(smoothMove);
};

const particles: Array<{ angle: number; radius: number; speed: number; size: number }> = [];
const numParticles = 100;

const initializeParticles = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
  for (let i = 0; i < numParticles; i++) {
    particles.push({
      angle: Math.random() * 2 * Math.PI,
      radius: 80 + Math.random() * 20,
      speed: 0.005 + Math.random() * 0.03,
      size: 0.5 + Math.random() * 2,
    });
  }
};

const drawParticles = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  particles.forEach((particle) => {
    const x = centerX + Math.cos(particle.angle) * particle.radius;
    const y = centerY + Math.sin(particle.angle) * particle.radius;

    ctx.beginPath();
    ctx.arc(x, y, particle.size, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
    ctx.fill();

    particle.angle += particle.speed;
  });

  animationFrameId = requestAnimationFrame(() => drawParticles(ctx, centerX, centerY));
};

onMounted(() => {
  const canvasElement = canvas.value!;
  const ctx = canvasElement.getContext("2d")!;
  canvasElement.width = 256;
  canvasElement.height = 256;

  const centerX = canvasElement.width / 2;
  const centerY = canvasElement.height / 2;

  initializeParticles(ctx, centerX, centerY);
  drawParticles(ctx, centerX, centerY);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrameId);
});

onMounted(() => {
  moveInterval = setInterval(moveRandomly, 500);
  smoothMove();
});

onBeforeUnmount(() => {
  clearInterval(moveInterval);
});
</script>

<style scoped>
/* Regular Icon Transition */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fade-scale-enter-from {
  transform: scale(1.2);
}

.fade-scale-leave-to {
  transform: scale(0.5) rotate(15deg);
}

/* SSL Icon Transition */
.https-enter-active {
  animation: bounce-in 0.6s ease-out;
}

.https-leave-active {
  animation: fade-out 0.3s ease-in;
}

@keyframes bounce-in {
  0% {
    transform: translateY(-20px) scale(0.8);
    opacity: 0;
  }
  60% {
    transform: translateY(5px) scale(1.05);
    opacity: 1;
  }
  100% {
    transform: translateY(0) scale(1);
  }
}

@keyframes fade-out {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.8);
  }
}
</style>
