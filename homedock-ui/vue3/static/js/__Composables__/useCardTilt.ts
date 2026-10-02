// homedock-ui/vue3/static/js/__Composables__/useCardTilt.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const TILT_MAX_DEG = 8;

function clampUnit(value: number) {
  return Math.max(-1, Math.min(1, value));
}

export function useCardTilt() {
  const cardRef = ref<HTMLElement | null>(null);
  const tilt = ref({ x: 0, y: 0 });
  const glare = ref({ x: 50, y: 50, visible: false });

  const canTilt = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const tiltStyle = computed(() => {
    const { x, y } = tilt.value;
    const angle = Math.hypot(x, y);
    return { rotate: angle > 0 ? `${x} ${y} 0 ${angle}deg` : "1 0 0 0deg" };
  });

  const glareStyle = computed(() => ({ "--glare-x": `${glare.value.x}%`, "--glare-y": `${glare.value.y}%`, opacity: glare.value.visible ? 1 : 0 }));

  function handlePointerMove(event: PointerEvent) {
    const rect = cardRef.value?.getBoundingClientRect();
    if (!rect) return;

    const nx = clampUnit((event.clientX - (rect.left + rect.width / 2)) / (window.innerWidth / 2));
    const ny = clampUnit((event.clientY - (rect.top + rect.height / 2)) / (window.innerHeight / 2));

    tilt.value = { x: -ny * TILT_MAX_DEG, y: nx * TILT_MAX_DEG };
    glare.value = { x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100, visible: true };
  }

  function reset() {
    tilt.value = { x: 0, y: 0 };
    glare.value = { ...glare.value, visible: false };
  }

  onMounted(() => {
    if (!canTilt) return;
    window.addEventListener("pointermove", handlePointerMove);
    document.documentElement.addEventListener("mouseleave", reset);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("pointermove", handlePointerMove);
    document.documentElement.removeEventListener("mouseleave", reset);
  });

  return { cardRef, tiltStyle, glareStyle };
}
