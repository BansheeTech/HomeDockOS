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

    <Transition name="dropdown">
      <Teleport to="body">
        <div v-if="isOpen" ref="dropdownRef" class="calendar-dropdown border" :class="[themeClasses.calendarDropdownBg, themeClasses.calendarDropdownBorder, themeClasses.calendarDropdownShadow]" :style="dropdownStyle">
          <div class="calendar-header" :class="themeClasses.topBack">
            <button class="nav-btn" :class="[themeClasses.calendarNavBtnBg, themeClasses.calendarNavBtn, themeClasses.calendarNavBtnBgHover, themeClasses.calendarNavBtnTextHover]" @click="previousMonth">
              <Icon :icon="chevronLeftIcon" width="18" height="18" />
            </button>
            <span class="calendar-title" :class="themeClasses.notTextUp">{{ currentMonthYear }}</span>
            <button class="nav-btn" :class="[themeClasses.calendarNavBtnBg, themeClasses.calendarNavBtn, themeClasses.calendarNavBtnBgHover, themeClasses.calendarNavBtnTextHover]" @click="nextMonth">
              <Icon :icon="chevronRightIcon" width="18" height="18" />
            </button>
          </div>

          <div class="calendar-body">
            <div class="calendar-weekdays">
              <div v-for="day in weekDays" :key="day" class="weekday" :class="themeClasses.calendarWeekday">{{ day }}</div>
            </div>

            <div class="calendar-days">
              <button v-for="day in calendarDays" :key="day.date" class="calendar-day" :class="[themeClasses.calendarDayBg, day.isSelected ? themeClasses.calendarDaySelected : day.isToday ? themeClasses.calendarDayToday : !day.isCurrentMonth ? themeClasses.calendarDayOtherMonth : [themeClasses.calendarDay, themeClasses.calendarDayBgHover]]" @click="selectDate(day)">
                <span>{{ day.day }}</span>
                <span v-if="eventsForDate(day.date).length > 0" class="tray-event-dot"></span>
              </button>
            </div>
          </div>

          <div v-if="selectedDayEvents.length > 0" class="tray-events-section" :class="themeClasses.utilityToolbarBorder">
            <div class="tray-events-header" :class="themeClasses.calendarWeekday">{{ selectedDate.isSame(dayjs(), "day") ? "Today's Events" : selectedDate.format("ddd, MMM D") }}</div>
            <div v-for="evt in selectedDayEvents.slice(0, 4)" :key="evt.id" class="tray-event-item">
              <span class="tray-event-color" :style="{ backgroundColor: eventColorHex(calendarStore.calendarColor(evt.calendar_id || 'personal')) }"></span>
              <span class="tray-event-time" :class="themeClasses.calendarWeekday">{{ evt.time || "—" }}</span>
              <span class="tray-event-title" :class="themeClasses.calendarDay">{{ evt.title }}</span>
            </div>
            <div v-if="selectedDayEvents.length > 4" class="tray-events-more" :class="themeClasses.calendarWeekday">+{{ selectedDayEvents.length - 4 }} more</div>
          </div>

          <button class="tray-open-calendar" :class="[themeClasses.calendarNavBtnBg, themeClasses.calendarNavBtn, themeClasses.calendarNavBtnBgHover, themeClasses.calendarNavBtnTextHover]" @click="openCalendarApp">Open Calendar</button>
        </div>
      </Teleport>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import dayjs from "dayjs";

import { Icon } from "@iconify/vue";
import chevronLeftIcon from "@iconify-icons/mdi/chevron-left";
import chevronRightIcon from "@iconify-icons/mdi/chevron-right";

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
const trayManager = useTrayManager();
const csrfToken = useCsrfToken();
const windowStore = useWindowStore();
const calendarStore = useCalendarStore();

const TRAY_ID = "date-time-picker";

const pickerRef = ref<HTMLElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const currentTime = ref("");
const currentDateFormatted = ref("");
const selectedDate = ref(dayjs());
const viewDate = ref(dayjs());

const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const currentMonthYear = computed(() => {
  return viewDate.value.format("MMMM YYYY");
});

const calendarDays = computed(() => {
  const days = [];
  const startOfMonth = viewDate.value.startOf("month");
  const endOfMonth = viewDate.value.endOf("month");
  const startDay = startOfMonth.day(); // 0 = Sunday
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

const dropdownStyle = computed(() => {
  return {
    position: "fixed",
    bottom: "4rem",
    right: "1rem",
    left: "auto",
  } as const;
});

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

  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  currentTime.value = `${hours}:${minutes}`;

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

function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node;
  if (pickerRef.value && !pickerRef.value.contains(target) && (!dropdownRef.value || !dropdownRef.value.contains(target))) {
    closeDropdown();
  }
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
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  if (clockInterval) {
    clearInterval(clockInterval);
  }
  document.removeEventListener("click", handleClickOutside);
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

.calendar-dropdown {
  z-index: 9999;
  border-radius: 12px;
  width: 280px;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-radius: 0.75rem 0.75rem 0 0;
}

.calendar-title {
  font-size: 0.875rem;
  font-weight: 600;
}

.nav-btn {
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 6px;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.calendar-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem 1.5rem 1.5rem 1.5rem;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
  margin-bottom: 0.25rem;
}

.weekday {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  font-size: 0.75rem;
  border: none;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s ease;
  font-weight: 500;
  position: relative;
}

.tray-event-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: #3b82f6;
  position: absolute;
  bottom: 3px;
}

.tray-events-section {
  border-top: 1px solid;
  padding: 0.75rem 1.5rem;
}

.tray-events-header {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.tray-event-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
}

.tray-event-color {
  width: 3px;
  height: 14px;
  border-radius: 1.5px;
  flex-shrink: 0;
}

.tray-event-time {
  font-size: 0.65rem;
  min-width: 30px;
}

.tray-event-title {
  font-size: 0.7rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tray-events-more {
  font-size: 0.6rem;
  text-align: center;
  padding-top: 0.25rem;
}

.tray-open-calendar {
  display: block;
  width: calc(100% - 3rem);
  margin: 0 1.5rem 1rem;
  padding: 0.4rem;
  border: none;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

/* Dropdown Animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .tray-clock {
    padding: 0 0.25rem;
  }

  .clock-time {
    font-size: 0.75rem;
  }

  .calendar-dropdown {
    width: 280px;
    padding: 0.75rem;
  }
}
</style>
