<!-- homedock-ui/vue3/static/js/__Components__/ControlHubGraph.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <svg class="block w-full h-full" :viewBox="`0 0 ${VW} ${VH}`" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="color" stop-opacity="0.45" />
        <stop offset="100%" :stop-color="color" stop-opacity="0.03" />
      </linearGradient>
    </defs>

    <g v-if="grid" :stroke="color" stroke-opacity="0.15" stroke-width="1" vector-effect="non-scaling-stroke">
      <line v-for="i in 9" :key="`h${i}`" x1="0" :y1="(VH / 10) * i" :x2="VW" :y2="(VH / 10) * i" vector-effect="non-scaling-stroke" />
      <line v-for="i in 9" :key="`v${i}`" :x1="(VW / 10) * i" y1="0" :x2="(VW / 10) * i" :y2="VH" vector-effect="non-scaling-stroke" />
    </g>

    <path v-if="areaPath" :d="areaPath" :fill="`url(#${gradientId})`" stroke="none" />
    <path v-if="linePath" :d="linePath" fill="none" :stroke="color" :stroke-width="lineWidth" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round" />
  </svg>
</template>

<script lang="ts" setup>
import { computed } from "vue";

const VW = 100;
const VH = 100;

interface Props {
  values: number[];
  capacity?: number;
  max?: number;
  color?: string;
  grid?: boolean;
  lineWidth?: number;
}

const props = withDefaults(defineProps<Props>(), {
  capacity: 60,
  max: 100,
  color: "#1a86d0",
  grid: false,
  lineWidth: 1.5,
});

const gradientId = `chgrad_${Math.random().toString(36).slice(2, 11)}`;

const points = computed(() => {
  const values = props.values || [];
  if (!values.length) return [];

  const capacity = Math.max(props.capacity, 2);
  const step = VW / (capacity - 1);
  const offset = Math.max(0, capacity - values.length);
  const max = props.max > 0 ? props.max : 100;

  return values.map((value, index) => {
    const ratio = Math.max(0, Math.min(1, (Number(value) || 0) / max));
    return [(offset + index) * step, VH - ratio * VH];
  });
});

const linePath = computed(() => {
  const list = points.value;
  if (list.length < 2) return "";
  return list.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
});

const areaPath = computed(() => {
  const list = points.value;
  if (list.length < 2) return "";
  const first = list[0];
  const last = list[list.length - 1];
  return `${linePath.value} L${last[0].toFixed(2)} ${VH} L${first[0].toFixed(2)} ${VH} Z`;
});
</script>
