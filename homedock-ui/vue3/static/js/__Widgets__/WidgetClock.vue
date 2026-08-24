<!-- homedock-ui/vue3/static/js/__Widgets__/WidgetClock.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div v-if="size === 'm'" class="w-full h-full flex flex-col items-center justify-center px-4 py-3">
    <div class="relative w-[132px] h-[132px]">
      <div class="absolute left-1/2 top-[64%] -translate-x-1/2 flex items-baseline gap-[2px] px-[7px] py-[3px] rounded-[5px] leading-none ring-1 ring-inset ring-black/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)]" :class="[themeClasses.desktopWidgetControlBg, themeClasses.desktopWidgetText]">
        <span class="text-[11px] font-semibold tabular-nums tracking-tight">{{ timeText }}</span>
        <span v-if="meridiemText" class="text-[7px] font-semibold">{{ meridiemText }}</span>
      </div>

      <svg viewBox="0 0 100 100" class="absolute inset-0 w-full h-full">
        <circle cx="50" cy="50" r="48" fill="currentColor" fill-opacity="0.05" :class="themeClasses.desktopWidgetText" />
        <g :class="themeClasses.desktopWidgetMeta" stroke="currentColor" stroke-linecap="round">
          <line v-for="tick in 12" :key="tick" x1="50" y1="6.5" x2="50" y2="10.5" :stroke-width="tick % 3 === 1 ? 2.5 : 1.25" :stroke-opacity="tick % 3 === 1 ? 0.9 : 0.45" :transform="`rotate(${(tick - 1) * 30} 50 50)`" />
        </g>
        <LogoIcon x="44" y="22" width="12" height="12" opacity="0.10" :class="themeClasses.desktopWidgetTitle" />

        <g :class="themeClasses.desktopWidgetTitle" stroke="currentColor" stroke-linecap="round">
          <line x1="50" y1="50" x2="50" y2="28" stroke-width="4" :transform="`rotate(${hourDeg} 50 50)`" />
          <line x1="50" y1="50" x2="50" y2="17" stroke-width="2.5" :transform="`rotate(${minuteDeg} 50 50)`" />
        </g>
        <g :class="themeClasses.desktopWidgetAccent" stroke="currentColor" stroke-linecap="round">
          <line x1="50" y1="56" x2="50" y2="14" stroke-width="1.2" :transform="`rotate(${secondDeg} 50 50)`" />
        </g>
        <circle cx="50" cy="50" r="3" fill="currentColor" :class="themeClasses.desktopWidgetAccent" />
        <circle cx="50" cy="50" r="1.2" fill="currentColor" :class="themeClasses.desktopWidgetTitle" />
      </svg>
    </div>
    <span class="mt-2 text-xs font-medium capitalize" :class="themeClasses.desktopWidgetText">{{ dateText }}</span>
    <span class="mt-0.5 text-[10px] tracking-wide" :class="themeClasses.desktopWidgetMeta">{{ timezoneText }}</span>
  </div>

  <div v-else class="w-full h-full flex flex-col items-center justify-center px-4 py-3">
    <div class="flex items-baseline gap-1 leading-none">
      <span class="text-[40px] font-semibold tabular-nums tracking-tight" :class="themeClasses.desktopWidgetTitle">{{ timeText }}</span>
      <span v-if="meridiemText" class="text-sm font-semibold whitespace-nowrap" :class="themeClasses.desktopWidgetMeta">{{ meridiemText }}</span>
    </div>
    <span class="mt-1.5 text-[11px] font-medium capitalize" :class="themeClasses.desktopWidgetText">{{ dateText }}</span>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, inject, watch, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";

import LogoIcon from "../__Components__/LogoIcon.vue";
import { useTheme } from "../__Themes__/ThemeSelector";
import type { WidgetInstance } from "../__Stores__/useWidgetsStore";
import type { WidgetSize } from "../__Config__/WidgetDefaultDetails";
import type { SettingsData } from "../__Types__/SettingsData";

const props = defineProps<{
  instance: WidgetInstance;
  size: WidgetSize;
}>();

const { themeClasses } = useTheme();
const { locale } = useI18n();

const settingsData = inject<SettingsData | null>("data-settings", null);
const is12h = computed(() => (settingsData?.clock_format ?? "24h") === "12h");

const now = ref(new Date());
let ticker: ReturnType<typeof setInterval> | null = null;
let frame: number | null = null;

const timeParts = computed(() => {
  const parts = new Intl.DateTimeFormat(locale.value, {
    hour: is12h.value ? "numeric" : "2-digit",
    minute: "2-digit",
    hour12: is12h.value,
  }).formatToParts(now.value);

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return { hour: get("hour"), minute: get("minute"), dayPeriod: get("dayPeriod") };
});

const timeText = computed(() => `${timeParts.value.hour}:${timeParts.value.minute}`);

const meridiemText = computed(() => timeParts.value.dayPeriod.replace(/[\s.]/g, "").toUpperCase());

const isAnalog = computed(() => props.size === "m");

const sweepNow = ref(new Date());

const sweepTime = computed(() => {
  const seconds = sweepNow.value.getSeconds() + sweepNow.value.getMilliseconds() / 1000;
  const minutes = sweepNow.value.getMinutes() + seconds / 60;

  return { seconds, minutes, hours: (sweepNow.value.getHours() % 12) + minutes / 60 };
});

const hourDeg = computed(() => sweepTime.value.hours * 30);
const minuteDeg = computed(() => sweepTime.value.minutes * 6);
const secondDeg = computed(() => sweepTime.value.seconds * 6);

const dateText = computed(() => now.value.toLocaleDateString(locale.value, { weekday: "long", day: "numeric", month: "long" }));

const timezoneText = computed(() => Intl.DateTimeFormat().resolvedOptions().timeZone);

const sweep = () => {
  sweepNow.value = new Date();
  frame = requestAnimationFrame(sweep);
};

const startSweep = () => {
  if (frame === null) frame = requestAnimationFrame(sweep);
};

const stopSweep = () => {
  if (frame !== null) cancelAnimationFrame(frame);
  frame = null;
};

watch(isAnalog, (analog) => (analog ? startSweep() : stopSweep()));

onMounted(() => {
  ticker = setInterval(() => {
    now.value = new Date();
  }, 1000);

  if (isAnalog.value) startSweep();
});

onUnmounted(() => {
  if (ticker) clearInterval(ticker);

  stopSweep();
});
</script>
