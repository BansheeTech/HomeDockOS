<!-- homedock-ui/vue3/static/js/__Components__/DateTimePicker.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="datetime-picker" ref="pickerRef">
    <div class="tray-clock" :class="[themeClasses.trayClockBg, themeClasses.trayClockBgHover]" @click="toggleDropdown">
      <span class="clock-time" :class="themeClasses.clockTimeText">{{ currentTime }}</span>
      <span v-if="!isMobile" class="clock-date" :class="themeClasses.clockDateText">{{ currentDateFormatted }}</span>
      <span v-if="hasTodayEvents" class="tray-today-dot">
        <span class="tray-dot-ping" :class="{ 'animate-ping': eventUrgency === 'now' }" :style="{ backgroundColor: eventDotColor, opacity: eventUrgency === 'now' ? 0.75 : 0 }"></span>
        <span class="tray-dot-core" :style="{ backgroundColor: eventDotColor }"></span>
      </span>
    </div>

    <TrayPanel :open="isOpen" :anchor="pickerRef" :title="currentMonthYear" :subtitle="todayLabel" :icon="calendarIcon" icon-color="#0891b2" @close="closeDropdown">
      <template #accessory>
        <div class="flex items-center gap-0.5 flex-shrink-0">
          <button type="button" :class="[themeClasses.storeCardSubtitle, themeClasses.storeRowHover]" class="flex items-center justify-center w-7 h-7 rounded-full border-0 bg-transparent cursor-pointer transition-colors duration-150" :aria-label="$t('Previous')" @click="previousMonth">
            <Icon :icon="chevronLeftIcon" class="w-4 h-4" />
          </button>
          <button type="button" :class="[themeClasses.storeCardSubtitle, themeClasses.storeRowHover]" class="h-7 px-2 rounded-full border-0 bg-transparent text-[11px] font-semibold cursor-pointer transition-colors duration-150" @click="goToToday">{{ $t("Today") }}</button>
          <button type="button" :class="[themeClasses.storeCardSubtitle, themeClasses.storeRowHover]" class="flex items-center justify-center w-7 h-7 rounded-full border-0 bg-transparent cursor-pointer transition-colors duration-150" :aria-label="$t('Next')" @click="nextMonth">
            <Icon :icon="chevronRightIcon" class="w-4 h-4" />
          </button>
        </div>
      </template>

      <div class="calendar-body px-1.5">
        <div class="calendar-weekdays">
          <div v-for="day in weekDays" :key="day" :class="[themeClasses.storeCardSubtitle]" class="weekday">{{ day }}</div>
        </div>

        <div class="calendar-days">
          <button v-for="day in calendarDays" :key="day.date" type="button" class="calendar-day" :class="day.isSelected ? (day.isToday ? 'bg-red-500 text-white font-bold' : 'bg-blue-600 text-white') : day.isToday ? ['bg-transparent text-red-500 font-bold', themeClasses.storeRowHover] : !day.isCurrentMonth ? [themeClasses.storeCardSubtitle, 'bg-transparent opacity-50'] : [themeClasses.storeModalAppName, 'bg-transparent', themeClasses.storeRowHover]" @click="selectDate(day)">
            <span>{{ day.day }}</span>
            <span v-if="eventsForDate(day.date).length > 0" :class="day.isSelected ? 'bg-white' : 'bg-blue-500'" class="tray-event-dot"></span>
          </button>
        </div>
      </div>

      <TraySection v-if="selectedDayEvents.length > 0" :title="selectedDate.isSame(dayjs(), 'day') ? t(`Today's Events`) : selectedDate.locale(djLocale).format('ddd, MMM D')">
        <TrayRow v-for="evt in selectedDayEvents.slice(0, 4)" :key="evt.id" :title="evt.title">
          <template #leading>
            <span class="w-1 h-7 rounded-full flex-shrink-0" :style="{ backgroundColor: eventColorHex(calendarStore.calendarColor(evt.calendar_id || 'personal')) }"></span>
          </template>
          <template #trailing>
            <span :class="[themeClasses.storeCardSubtitle]" class="flex-shrink-0 text-[11px] tabular-nums">{{ formatEventTime(evt.time) }}</span>
          </template>
        </TrayRow>
        <p v-if="selectedDayEvents.length > 4" :class="[themeClasses.storeCardSubtitle]" class="m-0 px-1.5 pt-1 text-[11px]">+{{ selectedDayEvents.length - 4 }} {{ $t("more") }}</p>
      </TraySection>

      <template #footer>
        <button type="button" :class="[themeClasses.storeCardInstalledPill]" class="flex items-center justify-center w-full h-8 rounded-full border-0 text-xs font-semibold cursor-pointer transition-colors duration-150" @click="openCalendarApp">{{ $t("Open Calendar") }}</button>
      </template>
    </TrayPanel>
  </div>
</template>

<script lang="ts" setup>
import dayjs from "dayjs";
import "../__Languages__/dayjsLocales";

import { ref, computed, inject, onMounted, onUnmounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { getLanguage } from "../__Languages__";

import type { SettingsData } from "../__Types__/SettingsData";

import { Icon } from "@iconify/vue";
import chevronLeftIcon from "@iconify-icons/mdi/chevron-left";
import chevronRightIcon from "@iconify-icons/mdi/chevron-right";
import calendarIcon from "@iconify-icons/mdi/calendar-month";

import TrayPanel from "./TrayPanel.vue";
import TraySection from "./TraySection.vue";
import TrayRow from "./TrayRow.vue";

import { useResponsive } from "../__Composables__/useResponsive";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useTrayManager } from "../__Composables__/useTrayManager";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useWindowStore } from "../__Stores__/windowStore";
import { useCalendarStore } from "../__Stores__/useCalendarStore";

interface Props {
  placement?: "top" | "bottom";
}

const props = withDefaults(defineProps<Props>(), {
  placement: "top",
});

const { isMobile } = useResponsive();
const { themeClasses } = useTheme();
const { t } = useI18n();
const trayManager = useTrayManager();
const csrfToken = useCsrfToken();
const windowStore = useWindowStore();
const calendarStore = useCalendarStore();

const djLocale = getLanguage();

const settingsData = inject<SettingsData | null>("data-settings", null);
const clockFormat = computed(() => settingsData?.clock_format ?? "24h");
const weekStart = computed<number>(() => (settingsData?.week_start === "sunday" ? 0 : 1));

const TRAY_ID = "date-time-picker";

const pickerRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const currentTime = ref("");
const currentDateFormatted = ref("");
const selectedDate = ref(dayjs());
const viewDate = ref(dayjs());

const weekDays = computed(() =>
  Array.from({ length: 7 }, (_, i) =>
    dayjs()
      .locale(djLocale)
      .day((i + weekStart.value) % 7)
      .format("dd"),
  ),
);

const currentMonthYear = computed(() => {
  const raw = viewDate.value.locale(djLocale).format("MMMM YYYY");
  return raw.charAt(0).toUpperCase() + raw.slice(1);
});

const calendarDays = computed(() => {
  const days = [];
  const startOfMonth = viewDate.value.startOf("month");
  const endOfMonth = viewDate.value.endOf("month");
  const startDay = (startOfMonth.day() - weekStart.value + 7) % 7;
  const daysInMonth = endOfMonth.date();

  const prevMonthEnd = startOfMonth.subtract(1, "day");
  for (let i = startDay - 1; i >= 0; i--) {
    const day = prevMonthEnd.subtract(i, "day");
    days.push({
      day: day.date(),
      date: day.format("YYYY-MM-DD"),
      isCurrentMonth: false,
      isToday: day.isSame(dayjs(), "day"),
      isSelected: day.isSame(selectedDate.value, "day"),
      dayjs: day,
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const day = startOfMonth.date(i);
    days.push({
      day: i,
      date: day.format("YYYY-MM-DD"),
      isCurrentMonth: true,
      isToday: day.isSame(dayjs(), "day"),
      isSelected: day.isSame(selectedDate.value, "day"),
      dayjs: day,
    });
  }

  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const day = endOfMonth.add(i, "day");
    days.push({
      day: day.date(),
      date: day.format("YYYY-MM-DD"),
      isCurrentMonth: false,
      isToday: day.isSame(dayjs(), "day"),
      isSelected: day.isSame(selectedDate.value, "day"),
      dayjs: day,
    });
  }

  return days;
});

const todayLabel = computed(() => {
  const raw = dayjs().locale(djLocale).format("dddd, D MMMM");
  return raw.charAt(0).toUpperCase() + raw.slice(1);
});

function goToToday() {
  selectedDate.value = dayjs();
  viewDate.value = dayjs();
}

function previousMonth() {
  viewDate.value = viewDate.value.subtract(1, "month");
}

function nextMonth() {
  viewDate.value = viewDate.value.add(1, "month");
}

function selectDate(day: any) {
  selectedDate.value = day.dayjs;
  if (!day.isCurrentMonth) {
    viewDate.value = day.dayjs;
  }
}

function toggleDropdown() {
  if (!isOpen.value) {
    trayManager.openTray(TRAY_ID);
    isOpen.value = true;
    viewDate.value = selectedDate.value;
    fetchTrayEvents();
  } else {
    trayManager.closeTray(TRAY_ID);
    isOpen.value = false;
  }
}

function closeDropdown() {
  trayManager.closeTray(TRAY_ID);
  isOpen.value = false;
}

watch(
  () => trayManager.activeTrayId.value,
  (newTrayId) => {
    if (newTrayId !== TRAY_ID && isOpen.value) {
      isOpen.value = false;
    }
  },
);

function updateClock() {
  const now = new Date();

  if (clockFormat.value === "12h") {
    const h24 = now.getHours();
    const period = h24 >= 12 ? "PM" : "AM";
    const h12 = h24 % 12 || 12;
    const minutes = now.getMinutes().toString().padStart(2, "0");
    currentTime.value = `${h12}:${minutes} ${period}`;
  } else {
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    currentTime.value = `${hours}:${minutes}`;
  }

  const day = now.getDate().toString().padStart(2, "0");
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const year = now.getFullYear();
  currentDateFormatted.value = `${day}/${month}/${year}`;
}

const EVENT_COLOR_MAP: Record<string, string> = {
  blue: "#3b82f6",
  red: "#ef4444",
  green: "#22c55e",
  yellow: "#eab308",
  purple: "#a855f7",
  pink: "#ec4899",
  orange: "#f97316",
  teal: "#14b8a6",
};

function eventColorHex(name: string): string {
  return EVENT_COLOR_MAP[name] || "#3b82f6";
}

function formatEventTime(raw: string | undefined | null): string {
  if (!raw) return "—";
  const [h, m] = raw.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return raw;
  if (clockFormat.value === "12h") {
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${period}`;
  }
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function eventsForDate(date: string) {
  return calendarStore.eventsForDate(date);
}

const hasTodayEvents = computed(() => calendarStore.hasTodayEvents);

const selectedDayEvents = computed(() => calendarStore.eventsForDate(selectedDate.value.format("YYYY-MM-DD")));

const minutesToNextEvent = ref<number | null>(null);

function updateEventProximity() {
  const now = dayjs();
  const today = now.format("YYYY-MM-DD");
  const todayEvents = calendarStore.eventsForDate(today);
  const nowMins = now.hour() * 60 + now.minute();

  let closest: number | null = null;
  for (const evt of todayEvents) {
    if (!evt.time) continue;
    const [h, m] = evt.time.split(":").map(Number);
    const startMins = h * 60 + m;
    let endMins = startMins + 60;
    if (evt.end_time) {
      const [eh, em] = evt.end_time.split(":").map(Number);
      endMins = eh * 60 + em;
    }
    if (nowMins >= startMins && nowMins < endMins) {
      closest = 0;
      break;
    }
    if (startMins > nowMins) {
      const diff = startMins - nowMins;
      if (closest === null || diff < closest) closest = diff;
    }
  }
  minutesToNextEvent.value = closest;
}

type Urgency = "far" | "approaching" | "soon" | "imminent" | "now";

const eventUrgency = computed<Urgency>(() => {
  const mins = minutesToNextEvent.value;
  if (mins === null) return "far";
  if (mins === 0) return "now";
  if (mins <= 15) return "imminent";
  if (mins <= 60) return "soon";
  if (mins <= 180) return "approaching";
  return "far";
});

const URGENCY_COLORS: Record<Urgency, string> = {
  far: "#3b82f6",
  approaching: "#eab308",
  soon: "#f97316",
  imminent: "#ef4444",
  now: "#ef4444",
};

const eventDotColor = computed(() => URGENCY_COLORS[eventUrgency.value]);

function fetchTrayEvents() {
  calendarStore.fetchEvents(csrfToken.value);
}

function openCalendarApp() {
  closeDropdown();
  windowStore.openWindow("calendar");
}

let clockInterval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  updateClock();
  updateEventProximity();
  calendarStore.fetchCalendars(csrfToken.value);
  fetchTrayEvents();
  clockInterval = setInterval(() => {
    updateClock();
    updateEventProximity();
  }, 1000);
  setInterval(fetchTrayEvents, 60000);
});

onUnmounted(() => {
  if (clockInterval) {
    clearInterval(clockInterval);
  }
});
</script>

<style scoped>
.datetime-picker {
  position: relative;
}

.tray-clock {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  height: 36px;
  padding: 0 0.5rem;
  user-select: none;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.15s ease;
  position: relative;
}

.tray-today-dot {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 6px;
  height: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tray-dot-ping {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.tray-dot-core {
  position: relative;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  transition: background-color 2s ease;
}

@keyframes ping {
  75%,
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.animate-ping {
  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.clock-time {
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.1;
}

.clock-date {
  font-size: 0.6rem;
  line-height: 1.1;
}

.calendar-body {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding-bottom: 0.25rem;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.125rem;
}

.weekday {
  text-align: center;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 0.25rem 0;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.125rem;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  position: relative;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.tray-event-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  position: absolute;
  bottom: 3px;
}

@media (max-width: 768px) {
  .tray-clock {
    padding: 0 0.25rem;
  }

  .clock-time {
    font-size: 0.75rem;
  }
}
</style>
