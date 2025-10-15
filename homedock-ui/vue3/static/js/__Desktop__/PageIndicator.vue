<!-- homedock-ui/vue3/static/js/__Desktop__/PageIndicator.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Transition name="indicator-fade">
    <div v-if="totalPages > 1" class="page-indicator">
      <div v-for="page in totalPages" :key="page" :class="['dot', { active: page - 1 === currentPage }]" @click="handleDotClick(page - 1)" />
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { computed } from "vue";

interface Props {
  currentPage: number;
  totalPages: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "page-change", page: number): void;
}>();

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
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  flex-shrink: 0;
}

.dot:active {
  transform: scale(0.9);
}

.dot.active {
  width: 24px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
}

/* Transition animations */
.indicator-fade-enter-active,
.indicator-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.indicator-fade-enter-from,
.indicator-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>
