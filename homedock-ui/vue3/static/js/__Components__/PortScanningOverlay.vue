<!-- homedock-ui/vue3/static/js/__Components__/PortScanningOverlay.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Transition name="scanning-fade">
    <div v-if="visible" class="absolute inset-0 flex items-center justify-center rounded-2xl pointer-events-none z-[2]">
      <div class="scanning-badge">
        <div class="scanning-bar">
          <div class="scanning-bar-fill" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>
.scanning-badge {
  background: rgba(80, 80, 80, 0.5);
  border-radius: 9999px;
  padding: 4px 6px;
}

.scanning-bar {
  width: 28px;
  height: 3px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.5);
  overflow: hidden;
  position: relative;
}

.scanning-bar-fill {
  position: absolute;
  top: 0;
  left: 0;
  width: 40%;
  height: 100%;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.5);
  animation: scan-slide 1s ease-in-out infinite alternate;
}

@keyframes scan-slide {
  0% {
    left: -40%;
  }
  100% {
    left: 100%;
  }
}

.scanning-fade-enter-active,
.scanning-fade-leave-active {
  transition: opacity 0.4s ease;
}

.scanning-fade-enter-from,
.scanning-fade-leave-to {
  opacity: 0;
}
</style>
