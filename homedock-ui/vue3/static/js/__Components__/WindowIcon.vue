<!-- homedock-ui/vue3/static/js/__Components__/WindowIcon.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <AppIconGraphic v-if="isImageIcon(icon)" :image-src="icon" :size="size">
    <span v-if="overlay" class="absolute inset-0 flex items-center justify-center overflow-hidden rounded-[inherit] pointer-events-none backdrop-blur-[10px] bg-black/15">
      <Icon :icon="overlay" class="w-[78%] h-[78%] text-white [filter:drop-shadow(0_0_1px_rgba(0,0,0,0.8))_drop-shadow(0_0_2px_rgba(0,0,0,0.5))]" />
    </span>
  </AppIconGraphic>
  <AppIconGraphic v-else-if="icon || fallback" :icon="icon || fallback" :color="color" :size="size" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Icon, type IconifyIcon } from "@iconify/vue";

import { isImageIcon, windowIconOverlay, type WindowState } from "../__Stores__/windowStore";
import { getAppById, ENTERPRISE_APP_COLOR } from "../__Config__/WindowDefaultDetails";

import AppIconGraphic from "./AppIconGraphic.vue";

interface Props {
  window: Pick<WindowState, "appId" | "icon">;
  size: number;
  fallback?: IconifyIcon | null;
}

const props = withDefaults(defineProps<Props>(), {
  fallback: null,
});

const icon = computed(() => props.window.icon);
const overlay = computed(() => windowIconOverlay(props.window));
const color = computed(() => (props.window.appId === "enterprise-window" ? ENTERPRISE_APP_COLOR : getAppById(props.window.appId)?.color));
</script>
