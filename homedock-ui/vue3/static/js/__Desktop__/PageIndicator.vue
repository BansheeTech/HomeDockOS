<!-- homedock-ui/vue3/static/js/__Desktop__/PageIndicator.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Transition name="indicator-fade">
    <div v-if="totalPages > 1" :class="['page-indicator', { idle: !isAwake }]">
      <div v-for="page in totalPages" :key="page" class="dot" :style="getDotStyle(page - 1)" @click="handleDotClick(page - 1)" />
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { computed, ref, watch, onMounted, onUnmounted } from "vue";

interface Props {
  currentPage: number;
  totalPages: number;
  scrollProgress?: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "page-change", page: number): void;
}>();

const DOT_SIZE = 8;
const ACTIVE_EXTRA_WIDTH = 16;
const IDLE_DELAY = 3000;

const isAwake = ref(true);
let idleTimer: ReturnType<typeof setTimeout> | null = null;

function wakeIndicator() {
  isAwake.value = true;

  if (idleTimer) {
    clearTimeout(idleTimer);
  }

  idleTimer = setTimeout(() => {
    isAwake.value = false;
    idleTimer = null;
  }, IDLE_DELAY);
}

watch(() => [props.scrollProgress, props.currentPage, props.totalPages], wakeIndicator);

onMounted(wakeIndicator);

onUnmounted(() => {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
});

const activePosition = computed(() => {
  const raw = props.scrollProgress ?? props.currentPage;
  return Math.max(0, Math.min(raw, props.totalPages - 1));
});

function getDotStyle(page: number) {
  const weight = Math.max(0, 1 - Math.abs(page - activePosition.value));

  return {
    width: `${DOT_SIZE + ACTIVE_EXTRA_WIDTH * weight}px`,
    background: `rgba(255, 255, 255, ${0.4 + 0.55 * weight})`,
    boxShadow: weight > 0 ? `0 0 8px rgba(255, 255, 255, ${0.3 * weight})` : "none",
  };
}

function handleDotClick(page: number) {
  if (page !== props.currentPage) {
    emit("page-change", page);
  }
}
</script>

<style scoped>
.page-indicator {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 10;
  pointer-events: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  opacity: 1;
  transition: opacity 0.5s ease;
}

.page-indicator.idle {
  opacity: 0;
  pointer-events: none;
}

.dot {
  height: 8px;
  border-radius: 4px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  flex-shrink: 0;
}

.dot:active {
  transform: scale(0.9);
}

/* Transition animations */
.indicator-fade-enter-active,
.indicator-fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.indicator-fade-enter-from,
.indicator-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>
