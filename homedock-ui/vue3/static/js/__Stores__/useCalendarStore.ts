// homedock-ui/vue3/static/js/__Stores__/useCalendarStore.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { defineStore } from "pinia";
import dayjs from "dayjs";
import axios from "axios";

export interface CalendarGroup {
  id: string;
  name: string;
  color: string;
  visible: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  end_time?: string;
  color?: string;
  calendar_id?: string;
  notes?: string;
}

export const useCalendarStore = defineStore("CalendarStore", {
  state: () => ({
    events: [] as CalendarEvent[],
    calendars: [] as CalendarGroup[],
    worldClocks: [] as string[],
    loaded: false,
  }),
  getters: {
    visibleCalendarIds(): string[] {
      return this.calendars.filter((c) => c.visible).map((c) => c.id);
    },
    visibleEvents(): CalendarEvent[] {
      const ids = this.visibleCalendarIds;
      return this.events.filter((e) => ids.includes(e.calendar_id || "personal"));
    },
    eventsForDate() {
      return (date: string): CalendarEvent[] => {
        const ids = this.visibleCalendarIds;
        return this.events.filter((e) => e.date === date && ids.includes(e.calendar_id || "personal")).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
      };
    },
    todayEvents(): CalendarEvent[] {
      return this.eventsForDate(dayjs().format("YYYY-MM-DD"));
    },
    hasTodayEvents(): boolean {
      const today = dayjs().format("YYYY-MM-DD");
      const ids = this.visibleCalendarIds;
      return this.events.some((e) => e.date === today && ids.includes(e.calendar_id || "personal"));
    },
    calendarColor() {
      return (calendarId: string): string => {
        const cal = this.calendars.find((c) => c.id === calendarId);
        return cal?.color || "blue";
      };
    },
  },
  actions: {
    async fetchCalendars(csrfToken: string) {
      try {
        const { data } = await axios.get("/api/calendar/calendars", { headers: { "X-HomeDock-CSRF-Token": csrfToken } });
        if (data.calendars) this.calendars = data.calendars;
      } catch {}
    },
    async saveCalendar(payload: Partial<CalendarGroup>, csrfToken: string): Promise<CalendarGroup | null> {
      try {
        const { data } = await axios.post("/api/calendar/calendars/save", payload, { headers: { "X-HomeDock-CSRF-Token": csrfToken } });
        if (data.success && data.calendar) {
          this.calendars = this.calendars.filter((c) => c.id !== data.calendar.id);
          this.calendars.push(data.calendar);
          return data.calendar;
        }
      } catch {}
      return null;
    },
    async deleteCalendar(id: string, csrfToken: string) {
      try {
        const { data } = await axios.post("/api/calendar/calendars/delete", { id }, { headers: { "X-HomeDock-CSRF-Token": csrfToken } });
        if (data.success) {
          this.calendars = this.calendars.filter((c) => c.id !== id);
          const fallbackId = this.calendars[0]?.id || "personal";
          this.events = this.events.map((e) => (e.calendar_id === id ? { ...e, calendar_id: fallbackId } : e));
        }
      } catch {}
    },
    toggleCalendarVisibility(id: string) {
      const cal = this.calendars.find((c) => c.id === id);
      if (cal) cal.visible = !cal.visible;
    },
    async fetchEvents(csrfToken: string) {
      try {
        const { data } = await axios.get("/api/calendar/events", { headers: { "X-HomeDock-CSRF-Token": csrfToken } });
        if (data.events) {
          this.events = data.events;
          this.loaded = true;
        }
      } catch {}
    },
    async saveEvent(payload: Partial<CalendarEvent>, csrfToken: string): Promise<CalendarEvent | null> {
      try {
        const { data } = await axios.post("/api/calendar/events/save", payload, { headers: { "X-HomeDock-CSRF-Token": csrfToken } });
        if (data.success && data.event) {
          this.events = this.events.filter((e) => e.id !== data.event.id);
          this.events.push(data.event);
          return data.event;
        }
      } catch {}
      return null;
    },
    async deleteEvent(id: string, csrfToken: string) {
      try {
        await axios.post("/api/calendar/events/delete", { id }, { headers: { "X-HomeDock-CSRF-Token": csrfToken } });
        this.events = this.events.filter((e) => e.id !== id);
      } catch {}
    },
    async fetchWorldClocks(csrfToken: string) {
      try {
        const { data } = await axios.get("/api/calendar/world-clocks", { headers: { "X-HomeDock-CSRF-Token": csrfToken } });
        if (data.clocks) this.worldClocks = data.clocks;
      } catch {}
    },
    async saveWorldClocks(csrfToken: string) {
      try {
        await axios.post("/api/calendar/world-clocks/save", { clocks: this.worldClocks }, { headers: { "X-HomeDock-CSRF-Token": csrfToken } });
      } catch {}
    },
    addWorldClock(tz: string) {
      this.worldClocks.push(tz);
    },
    removeWorldClock(idx: number) {
      this.worldClocks.splice(idx, 1);
    },
  },
});
