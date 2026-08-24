<!-- homedock-ui/vue3/static/js/__Widgets__/WidgetCalendar.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="relative w-full h-full flex px-4 py-3 gap-4">
    <button type="button" class="absolute top-2 right-2 z-10 w-5 h-5 rounded-md flex items-center justify-center cursor-pointer transition-colors" :class="[themeClasses.desktopWidgetMeta, themeClasses.desktopWidgetControlBgHover]" :title="$t('Calendar')" @mousedown.stop @touchstart.stop @click.stop="openCalendar">
      <Icon :icon="openInAppIcon" class="w-3.5 h-3.5" />
    </button>

    <div class="flex-1 min-w-0 flex flex-col">
      <div class="flex items-baseline gap-1 mb-1.5 leading-none">
        <span class="text-xs font-bold capitalize" :class="themeClasses.desktopWidgetAccent">{{ monthName }}</span>
        <span class="text-[10px] font-medium tabular-nums" :class="themeClasses.desktopWidgetMeta">{{ yearLabel }}</span>
      </div>

      <div class="grid grid-cols-7 gap-y-0.5 text-center flex-1 content-evenly">
        <span v-for="day in weekDayLabels" :key="day" class="text-[8px] font-semibold uppercase tracking-wide" :class="themeClasses.desktopWidgetMeta">{{ day }}</span>
        <span v-for="cell in monthCells" :key="cell.key" class="relative text-[10px] tabular-nums leading-4 mx-auto w-[18px] h-[18px] flex items-center justify-center" :class="cell.isToday ? ['font-bold rounded-full text-white', themeClasses.statsWidgetProgressFill] : cell.inMonth ? [themeClasses.desktopWidgetText, 'font-medium'] : [themeClasses.desktopWidgetMeta, 'opacity-50']">
          {{ cell.day }}
          <span v-if="cell.hasEvents && !cell.isToday" class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full" :class="themeClasses.desktopWidgetAccent" style="background-color: currentColor"></span>
        </span>
      </div>
    </div>

    <template v-if="size === 'l'">
      <div class="w-px self-stretch my-1 shrink-0" :class="themeClasses.desktopWidgetDivider"></div>
      <div class="flex-1 min-w-0 flex flex-col">
        <span class="text-[10px] font-semibold uppercase tracking-[0.12em] mb-2" :class="themeClasses.desktopWidgetMeta">{{ $t("Upcoming") }}</span>
        <div v-if="upcomingEvents.length === 0" class="flex-1 flex items-center justify-center">
          <span class="text-xs" :class="themeClasses.desktopWidgetMeta">{{ $t("No upcoming events") }}</span>
        </div>
        <div v-else class="flex-1 flex flex-col justify-start gap-2 overflow-hidden">
          <div v-for="event in upcomingEvents" :key="event.id" class="flex items-stretch gap-2 min-w-0">
            <span class="w-[3px] rounded-full shrink-0 self-stretch" :style="{ backgroundColor: eventColor(event) }"></span>
            <div class="flex flex-col min-w-0 leading-tight justify-center">
              <span class="text-xs font-medium truncate" :class="themeClasses.desktopWidgetText">{{ event.title }}</span>
              <span class="text-[10px] capitalize tabular-nums" :class="themeClasses.desktopWidgetMeta">{{ eventDateLabel(event) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import dayjs from "dayjs";
import "../__Languages__/dayjsLocales";

import { computed, inject, onMounted } from "vue";

import { Icon } from "@iconify/vue";
import openInAppIcon from "@iconify-icons/mdi/open-in-app";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useWindowStore } from "../__Stores__/windowStore";
import { useCalendarStore, type CalendarEvent } from "../__Stores__/useCalendarStore";
import { getLanguage } from "../__Languages__";
import type { WidgetInstance } from "../__Stores__/useWidgetsStore";
import type { WidgetSize } from "../__Config__/WidgetDefaultDetails";
import type { SettingsData } from "../__Types__/SettingsData";

defineProps<{
  instance: WidgetInstance;
  size: WidgetSize;
}>();

const { themeClasses } = useTheme();
const csrfToken = useCsrfToken();
const calendarStore = useCalendarStore();
const windowStore = useWindowStore();

function openCalendar() {
  windowStore.openWindow("calendar");
}

const djLocale = getLanguage();
const settingsData = inject<SettingsData | null>("data-settings", null);
const weekStart = computed<number>(() => (settingsData?.week_start === "sunday" ? 0 : 1));

const EVENT_COLORS: Record<string, string> = {
  blue: "#3b82f6",
  red: "#ef4444",
  green: "#22c55e",
  yellow: "#eab308",
  purple: "#a855f7",
  pink: "#ec4899",
  orange: "#f97316",
  teal: "#14b8a6",
};

const monthName = computed(() => dayjs().locale(djLocale).format("MMMM"));
const yearLabel = computed(() => dayjs().format("YYYY"));

const weekDayLabels = computed(() =>
  Array.from({ length: 7 }, (_, i) =>
    dayjs()
      .locale(djLocale)
      .day((i + weekStart.value) % 7)
      .format("dd"),
  ),
);

interface MonthCell {
  key: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  hasEvents: boolean;
}

const monthCells = computed<MonthCell[]>(() => {
  const today = dayjs();
  const startOfMonth = today.startOf("month");
  const daysInMonth = today.daysInMonth();
  const startDay = (startOfMonth.day() - weekStart.value + 7) % 7;

  const cells: MonthCell[] = [];

  const prevMonthEnd = startOfMonth.subtract(1, "day");
  for (let i = startDay - 1; i >= 0; i--) {
    const d = prevMonthEnd.subtract(i, "day");
    cells.push({ key: d.format("YYYY-MM-DD"), day: d.date(), inMonth: false, isToday: false, hasEvents: false });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const d = startOfMonth.date(i);
    const dateStr = d.format("YYYY-MM-DD");
    cells.push({
      key: dateStr,
      day: i,
      inMonth: true,
      isToday: d.isSame(today, "day"),
      hasEvents: calendarStore.eventsForDate(dateStr).length > 0,
    });
  }

  const remainder = cells.length % 7;
  if (remainder !== 0) {
    const nextMonthStart = startOfMonth.add(1, "month");
    for (let i = 0; i < 7 - remainder; i++) {
      const d = nextMonthStart.add(i, "day");
      cells.push({ key: d.format("YYYY-MM-DD"), day: d.date(), inMonth: false, isToday: false, hasEvents: false });
    }
  }

  return cells;
});

const upcomingEvents = computed<CalendarEvent[]>(() => {
  const today = dayjs().format("YYYY-MM-DD");
  return calendarStore.visibleEvents
    .filter((event) => event.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""))
    .slice(0, 4);
});

function eventColor(event: CalendarEvent): string {
  return EVENT_COLORS[calendarStore.calendarColor(event.calendar_id || "personal")] || "#3b82f6";
}

function eventDateLabel(event: CalendarEvent): string {
  const label = dayjs(event.date).locale(djLocale).format("ddd, MMM D");
  return event.time ? `${label} · ${event.time}` : label;
}

onMounted(() => {
  if (!calendarStore.loaded) {
    calendarStore.fetchCalendars(csrfToken.value);
    calendarStore.fetchEvents(csrfToken.value);
  }
});
</script>
