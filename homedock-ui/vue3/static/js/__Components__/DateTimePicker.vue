<!-- homedock-ui/vue3/static/js/__Components__/DateTimePicker.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="datetime-picker" ref="pickerRef">
    <div class="tray-clock" :class="[themeClasses.trayClockBg, themeClasses.trayClockBgHover]" @click="toggleDropdown">
      <span class="clock-time" :class="themeClasses.clockTimeText">{{ currentTime }}</span>
      <span v-if="!isMobile" class="clock-date" :class="themeClasses.clockDateText">{{ currentDateFormatted }}</span>
    </div>

    <Transition name="dropdown">
      <div v-if="isOpen" class="calendar-dropdown border" :class="[themeClasses.calendarDropdownBg, themeClasses.calendarDropdownBorder, themeClasses.calendarDropdownShadow]" :style="dropdownStyle">
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
              {{ day.day }}
            </button>
          </div>
        </div>
      </div>
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

interface Props {
  placement?: "top" | "bottom";
}

const props = withDefaults(defineProps<Props>(), {
  placement: "top",
});

const { isMobile } = useResponsive();
const { themeClasses } = useTheme();
const trayManager = useTrayManager();

const TRAY_ID = "date-time-picker";

const pickerRef = ref<HTMLElement | null>(null);
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
  }
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

  selectedDate.value = dayjs(now);
}

function handleClickOutside(event: MouseEvent) {
  if (pickerRef.value && !pickerRef.value.contains(event.target as Node)) {
    closeDropdown();
  }
}

let clockInterval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  updateClock();
  clockInterval = setInterval(updateClock, 1000);
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
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  border: none;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s ease;
  font-weight: 500;
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
