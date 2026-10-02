<!-- homedock-ui/vue3/static/js/__Components__/AppBusyOverlay.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Transition name="app-busy">
    <div v-if="visible" class="app-busy">
      <span class="app-busy-sheen"></span>
      <span class="app-busy-glow">
        <span class="app-busy-comet"></span>
      </span>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
defineProps<{ visible: boolean }>();
</script>

<style scoped>
@property --app-busy-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

.app-busy {
  position: absolute;
  inset: 4px;
  z-index: 2;
  pointer-events: none;
}

.app-busy-sheen {
  position: absolute;
  inset: 2px;
  border-radius: 22.5%;
  background: linear-gradient(110deg, transparent 35%, rgba(255, 255, 255, 0.45) 50%, transparent 65%);
  background-size: 300% 100%;
  background-repeat: no-repeat;
  animation: app-busy-sweep 2s ease-in-out infinite;
}

@keyframes app-busy-sweep {
  0% {
    background-position: 100% 0;
  }
  65%,
  100% {
    background-position: 0% 0;
  }
}

.app-busy-glow {
  position: absolute;
  inset: 0;
  filter: drop-shadow(0 0 3px rgba(96, 165, 250, 0.85));
}

.app-busy-comet {
  position: absolute;
  inset: 0;
  padding: 2px;
  border-radius: 14px;
  background: conic-gradient(from var(--app-busy-angle), transparent 0deg, transparent 200deg, rgba(96, 165, 250, 0.35) 280deg, rgba(147, 197, 253, 0.9) 340deg, #fff 360deg);
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: app-busy-orbit 1.4s linear infinite;
}

@keyframes app-busy-orbit {
  to {
    --app-busy-angle: 360deg;
  }
}

.app-busy-enter-active {
  transition: opacity 0.3s ease-out;
}

.app-busy-leave-active {
  transition: opacity 0.4s ease-in;
}

.app-busy-enter-from,
.app-busy-leave-to {
  opacity: 0;
}
</style>
