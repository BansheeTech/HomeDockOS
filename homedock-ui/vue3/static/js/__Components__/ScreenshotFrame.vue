<!-- homedock-ui/vue3/static/js/__Components__/ScreenshotFrame.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div :class="[themeClasses.screenshotThumb, large ? 'frame-large rounded-[12px]' : 'rounded-xl shadow-md']" class="screenshot-frame flex flex-col overflow-hidden border transition-[filter] duration-300">
    <div v-if="appearance === 'cupertino'" :class="[themeClasses.screenshotWindowBar, large ? 'h-9 px-3.5' : 'h-7 px-3']" class="relative flex-shrink-0 flex items-center border-b">
      <div :class="large ? 'gap-2' : 'gap-1.5'" class="traffic-lights flex flex-shrink-0">
        <component :is="large ? 'button' : 'span'" v-for="light in trafficLights" :key="light.control" :type="large ? 'button' : undefined" :aria-label="large ? $t(light.label) : undefined" :class="[light.color, large ? 'w-3 h-3 cursor-pointer' : 'w-2 h-2']" class="traffic-light relative rounded-full flex items-center justify-center" @click="onControl($event, light.control)">
          <Icon v-if="large" :icon="light.glyph" class="traffic-glyph w-2.5 h-2.5 text-black/60" />
        </component>
      </div>
      <div :class="large ? 'left-20 right-20 gap-2' : 'left-14 right-14 gap-1.5'" class="absolute inset-y-0 flex items-center justify-center min-w-0 pointer-events-none">
        <AppIconGraphic :image-src="icon" :size="large ? 18 : 14" />
        <span :class="[themeClasses.screenshotWindowTitle, large ? 'text-[13px] font-medium' : 'text-[10px]']" class="truncate">{{ title }}</span>
      </div>
    </div>

    <div v-else :class="[themeClasses.screenshotWindowBar, large ? 'h-11 gap-2.5 pl-3.5 pr-2' : 'h-7 gap-1.5 px-2.5']" class="flex-shrink-0 flex items-center border-b">
      <AppIconGraphic :image-src="icon" :size="large ? 24 : 16" class="pointer-events-none" />
      <span :class="[themeClasses.screenshotWindowTitle, large ? 'text-[13px] font-medium' : 'text-[10px]']" class="flex-1 min-w-0 text-left truncate">{{ title }}</span>
      <div :class="[themeClasses.screenshotWindowTitle, large ? 'gap-1' : 'gap-2']" class="flex items-center flex-shrink-0">
        <component :is="large ? 'button' : 'span'" v-for="control in windowControls" :key="control.control" :type="large ? 'button' : undefined" :aria-label="large ? $t(control.label) : undefined" :class="large ? ['w-8 h-8 rounded-md cursor-pointer', control.control === 'close' ? 'hover:bg-red-500 hover:text-white' : 'hover:bg-black/10'] : ''" class="flex items-center justify-center transition-colors duration-150" @click="onControl($event, control.control)">
          <Icon :icon="control.glyph" :width="large ? control.size + 4 : control.size" :height="large ? control.size + 4 : control.size" />
        </component>
      </div>
    </div>

    <div :class="[themeClasses.screenshotImageBg, large ? 'cursor-zoom-out' : 'aspect-video']" class="flex-1 min-h-0" @click="large && emit('image-click')">
      <img draggable="false" :src="src" :alt="alt" :class="large ? 'frame-large-image block' : 'w-full h-full object-cover'" class="pointer-events-none" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useTheme } from "../__Themes__/ThemeSelector";

import { Icon } from "@iconify/vue";
import windowMinimizeIcon from "@iconify-icons/mdi/window-minimize";
import windowMaximizeIcon from "@iconify-icons/mdi/window-maximize";
import windowCloseIcon from "@iconify-icons/mdi/close";
import minusIcon from "@iconify-icons/mdi/minus";
import plusIcon from "@iconify-icons/mdi/plus";

import AppIconGraphic from "../__Components__/AppIconGraphic.vue";

export type FrameControl = "close" | "minimize" | "maximize";

const props = defineProps<{
  src: string;
  alt: string;
  title: string;
  icon: string;
  large?: boolean;
}>();

const emit = defineEmits<{
  (e: "control", control: FrameControl): void;
  (e: "image-click"): void;
}>();

function onControl(event: MouseEvent, control: FrameControl) {
  if (!props.large) return;
  event.stopPropagation();
  emit("control", control);
}

const { themeClasses, appearance } = useTheme();

const trafficLights = [
  { control: "close" as const, label: "Close", color: "bg-red-500", glyph: windowCloseIcon },
  { control: "minimize" as const, label: "Minimize", color: "bg-yellow-500", glyph: minusIcon },
  { control: "maximize" as const, label: "Maximize", color: "bg-green-500", glyph: plusIcon },
];

const windowControls = [
  { control: "minimize" as const, label: "Minimize", glyph: windowMinimizeIcon, size: 10 },
  { control: "maximize" as const, label: "Maximize", glyph: windowMaximizeIcon, size: 9 },
  { control: "close" as const, label: "Close", glyph: windowCloseIcon, size: 10 },
];
</script>

<style scoped>
.frame-large {
  box-shadow:
    0 30px 80px -20px rgba(0, 0, 0, 0.6),
    0 0 0 0.5px rgba(255, 255, 255, 0.12);
}

.frame-large-image {
  max-width: var(--frame-max-width, 100%);
  max-height: var(--frame-image-max-height, 70vh);
  width: auto;
  height: auto;
}

.traffic-glyph {
  opacity: 0;
  transition: opacity 0.15s ease;
}

.traffic-lights:hover .traffic-glyph {
  opacity: 1;
}
</style>
