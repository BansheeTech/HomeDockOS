<!-- homedock-ui/vue3/static/js/__Desktop__/DesktopWidgetFrame.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div v-if="definition" ref="cardRef" :class="[cardClasses, 'relative w-full h-full rounded-xl shadow-lg overflow-hidden select-none']">
    <div v-if="glassLeafActive" :class="[glassClasses, 'absolute inset-0 rounded-[inherit] pointer-events-none']" aria-hidden="true"></div>
    <div class="absolute" :style="canvasStyle">
      <component :is="definition.component" :instance="instance" :size="instance.size" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onUnmounted } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useResponsive } from "../__Composables__/useResponsive";
import { getWidgetDefinition, getWidgetDims } from "../__Config__/WidgetDefaultDetails";
import type { WidgetInstance } from "../__Stores__/useWidgetsStore";

const DESIGN_CELL_X = 110;
const DESIGN_CELL_Y = 125;
const CELL_GUTTER = 10;

const props = defineProps<{
  instance: WidgetInstance;
  bare?: boolean;
}>();

const { themeClasses } = useTheme();
const { isMobile } = useResponsive();

const definition = computed(() => getWidgetDefinition(props.instance.type));

const glassLeafActive = computed(() => !isMobile.value && !props.bare);

const tokenParts = computed(() => themeClasses.value.desktopWidgetCard.split(/\s+/));

const surfacelessClasses = computed(() => tokenParts.value.filter((c) => !c.startsWith("backdrop-") && !c.startsWith("bg-")).join(" "));

const cardClasses = computed(() => {
  if (props.bare || glassLeafActive.value) return surfacelessClasses.value;
  return themeClasses.value.desktopWidgetCard;
});

const glassClasses = computed(() => tokenParts.value.filter((c) => c.startsWith("bg-") || c.startsWith("backdrop-")).join(" "));

const cardRef = ref<HTMLDivElement | null>(null);
const cardSize = ref({ width: 0, height: 0 });

let resizeObserver: ResizeObserver | null = null;

watch(
  cardRef,
  (el) => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (!el) return;

    cardSize.value = { width: el.clientWidth, height: el.clientHeight };
    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        cardSize.value = { width: entry.contentRect.width, height: entry.contentRect.height };
      }
    });
    resizeObserver.observe(el);
  },
  { immediate: true },
);

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});

const designSize = computed(() => {
  const dims = getWidgetDims(props.instance.type, props.instance.size);
  return {
    width: dims.cols * DESIGN_CELL_X - CELL_GUTTER,
    height: dims.rows * DESIGN_CELL_Y - CELL_GUTTER,
  };
});

const canvasStyle = computed<Record<string, string>>(() => {
  const { width: designW, height: designH } = designSize.value;
  const { width, height } = cardSize.value;

  let scale = width > 0 && height > 0 ? Math.min(width / designW, height / designH) : 1;

  if (Math.abs(scale - 1) < 0.02) scale = 1;

  const offsetX = width > 0 ? Math.round((width - designW * scale) / 2) : 0;
  const offsetY = height > 0 ? Math.round((height - designH * scale) / 2) : 0;

  return {
    width: `${designW}px`,
    height: `${designH}px`,
    transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
    transformOrigin: "top left",
  };
});
</script>
