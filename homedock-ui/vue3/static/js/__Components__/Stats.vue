<!-- src/static/js/__Components__/Stats.vue -->
<!-- Copyright © 2023-2025 Banshee -->
<!-- https://www.banshee.pro -->

<template>
  <div :class="[themeClasses.statHolder]" class="flex flex-col rounded-xl mr-6 min-w-36 min-h-20 p-2 border overflow-hidden transition-all duration-300 ease-in-out">
    <div class="relative flex items-center">
      <Progress :trailColor="themeClasses.antProgressTrail" v-if="isProgressBar" class="absolute -right-1" type="dashboard" gapPosition="right" :strokeWidth="14" :showInfo="false" :size="22" :percent="Number(value)" :stroke-color="dynamicColor" status="active"></Progress>
      <div v-if="progressText || progressTextSecond" class="absolute right-0 top-5 text-[8px] flex flex-col leading-none items-center">
        <span :class="[themeClasses.statSubtleText]" class="font-bold">{{ progressText }}</span>
        <span :class="[themeClasses.statSubtleText]">{{ progressTextSecond }}</span>
      </div>
      <Icon :class="[themeClasses.statSubtleText]" :icon="mdi_icon" class="h-4 w-4" />
      <span :class="[themeClasses.statSubtleText]" class="ml-1 text-xs font-normal">{{ title }}</span>
    </div>
    <div class="flex flex-col justify-center">
      <div class="text-[28px] font-normal relative">
        <transition name="fade">
          <div class="absolute inset-0 flex items-baseline justify-start space-x-1" :key="value">
            <span :class="[themeClasses.statInnerText]">{{ value }}</span>
            <span :class="[themeClasses.statInnerText]" class="text-xs">{{ nValue }}</span>
          </div>
        </transition>
      </div>
      <div class="flex flex-col text-xs font-normal mt-8 h-5">
        <template v-if="isProgressBar">
          <Progress :trailColor="themeClasses.antProgressTrail" class="relative" :showInfo="false" :size="10" :percent="Number(value)" :stroke-color="dynamicColor" status="active"> </Progress>
        </template>
        <template v-else>
          <span :class="[themeClasses.statUnprogressText]" class="font-semibold mt-1">{{ downText }}{{ nValue2 }}</span>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, PropType } from "vue";
import { useTheme } from "../__Themes__/ThemeSelector";

import { Progress } from "ant-design-vue";

import { Icon, IconifyIcon } from "@iconify/vue";

const { themeClasses } = useTheme();

function hexToRgb(hex: string) {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

function interpolateColor(color1: number[], color2: number[], factor: number) {
  const result = color1.slice();
  for (let i = 0; i < 3; i++) {
    result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
  }
  return `rgb(${result.join(",")})`;
}

const props = defineProps({
  showProgressBar: {
    type: Boolean,
    required: false,
    default: false,
  },
  title: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number],
    required: true,
  },
  nValue: {
    type: String,
    required: true,
  },
  nValue2: {
    type: String,
    required: false,
  },
  downText: {
    type: [String, Number],
    required: false,
    default: null,
  },
  mdi_icon: {
    type: [String, Object] as PropType<string | IconifyIcon>,
    required: true,
  },
  progressText: {
    type: [String, Number],
    required: false,
    default: null,
  },
  progressTextSecond: {
    type: String,
    required: false,
    default: null,
  },
});

const isProgressBar = computed(() => props.showProgressBar);

const dynamicColor = computed(() => {
  let color1, color2, factor;
  const percentage = Number(props.value);

  if (percentage <= 40) {
    color1 = hexToRgb("#D0E1f2"); // Azul Claro
    color2 = hexToRgb("#002FFF"); // Azul Vivo
    factor = percentage / 40;
  } else if (percentage <= 52) {
    color1 = hexToRgb("#002FFF"); // Azul Vivo
    color2 = hexToRgb("#32A600"); // Verde
    factor = (percentage - 40) / 12;
  } else if (percentage <= 62) {
    color1 = hexToRgb("#32A600"); // Verde
    color2 = hexToRgb("#D6BA00"); // Amarillo
    factor = (percentage - 52) / 10;
  } else if (percentage <= 70) {
    color1 = hexToRgb("#D6BA00"); // Amarillo
    color2 = hexToRgb("#FF0000"); // Rojo
    factor = (percentage - 62) / 8;
  } else {
    color1 = hexToRgb("#FF0000"); // Rojo
    color2 = hexToRgb("#000000"); // Negro
    factor = (percentage - 70) / 30;
  }

  return interpolateColor(color1, color2, factor);
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease-in-out, transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}

.fade-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(-20px);
}

.fade-enter-to {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.fade-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.fade-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}
</style>
