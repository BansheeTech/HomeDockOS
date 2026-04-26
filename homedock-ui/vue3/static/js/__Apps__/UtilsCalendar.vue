<!-- homedock-ui/vue3/static/js/__Apps__/UtilsCalendar.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="utils-calendar flex flex-col h-full overflow-hidden" style="container-type: inline-size">
    <div class="flex items-center gap-1 px-2 py-1.5 border-b" :class="themeClasses.utilityToolbarBorder">
      <Dropdown :trigger="['click']" placement="bottomLeft" :overlay-class-name="themeClasses.scopeSelector">
        <button :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="px-3 py-1 text-xs rounded transition-colors">File</button>
        <template #overlay>
          <Menu>
            <MenuItem key="new" @click="openNewEvent">
              <div class="flex items-center gap-2">
                <Icon :icon="plusIcon" class="w-4 h-4" />
                <span>New Event</span>
              </div>
            </MenuItem>
            <MenuDivider />
            <MenuItem key="import" @click="importICS">
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24">
                  <g fill="none">
                    <path fill="currentColor" d="m12 14l-.707.707l.707.707l.707-.707zm1-9a1 1 0 1 0-2 0zM6.293 9.707l5 5l1.414-1.414l-5-5zm6.414 5l5-5l-1.414-1.414l-5 5zM13 14V5h-2v9z" />
                    <path stroke="currentColor" stroke-width="2" d="M5 16v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1" />
                  </g>
                </svg>
                <span>Import .ics</span>
              </div>
            </MenuItem>
            <MenuItem key="export" @click="exportICS" :disabled="events.length === 0">
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24">
                  <g fill="none">
                    <path fill="currentColor" d="m12 5l-.707-.707l.707-.707l.707.707zm1 9a1 1 0 1 1-2 0zM6.293 9.293l5-5l1.414 1.414l-5 5zm6.414-5l5 5l-1.414 1.414l-5-5zM13 5v9h-2V5z" />
                    <path stroke="currentColor" stroke-width="2" d="M5 16v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1" />
                  </g>
                </svg>
                <span>Export .ics</span>
              </div>
            </MenuItem>
            <MenuDivider />
            <MenuItem key="dedup" @click="showDedupDialog" :disabled="events.length === 0">
              <div class="flex items-center gap-2">
                <Icon :icon="filterRemoveIcon" class="w-4 h-4" />
                <span>Remove Duplicates</span>
              </div>
            </MenuItem>
            <MenuItem key="deleteall" @click="confirmDeleteAll" :disabled="events.length === 0">
              <div class="flex items-center gap-2">
                <Icon :icon="deleteIcon" class="w-4 h-4" />
                <span>Delete All Events</span>
              </div>
            </MenuItem>
            <MenuDivider />
            <MenuItem key="exit" @click="handleExit">
              <div class="flex items-center gap-2">
                <Icon :icon="exitIcon" class="w-4 h-4" />
                <span>Exit</span>
              </div>
            </MenuItem>
          </Menu>
        </template>
      </Dropdown>

      <Dropdown :trigger="['click']" placement="bottomLeft" :overlay-class-name="themeClasses.scopeSelector">
        <button :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="px-3 py-1 text-xs rounded transition-colors">View</button>
        <template #overlay>
          <Menu>
            <MenuItem key="calendar" @click="activeTab = 'calendar'">
              <div class="flex items-center gap-2">
                <Icon :icon="calendarIcon" class="w-4 h-4" />
                <span>Calendar</span>
                <span v-if="activeTab === 'calendar'" class="ml-auto text-[10px] opacity-50">✓</span>
              </div>
            </MenuItem>
            <MenuItem key="worldclock" @click="activeTab = 'worldclock'">
              <div class="flex items-center gap-2">
                <Icon :icon="earthIcon" class="w-4 h-4" />
                <span>World Clock</span>
                <span v-if="activeTab === 'worldclock'" class="ml-auto text-[10px] opacity-50">✓</span>
              </div>
            </MenuItem>
            <MenuDivider />
            <MenuItem v-for="cal in calendars" :key="'view-' + cal.id" @click="toggleCalendarVisibility(cal.id)">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-sm border flex items-center justify-center" :style="{ backgroundColor: cal.visible ? eventColor(cal.color) : 'transparent', borderColor: eventColor(cal.color) }">
                  <span v-if="cal.visible" class="text-white text-[8px] font-bold">✓</span>
                </span>
                <span>{{ cal.name }}</span>
              </div>
            </MenuItem>
          </Menu>
        </template>
      </Dropdown>

      <div class="flex-1"></div>
      <input ref="icsFileInput" type="file" accept=".ics" class="hidden" @change="handleICSFile" />
    </div>

    <div class="flex-1 cal-main-area overflow-hidden">
      <template v-if="activeTab === 'calendar'">
        <div class="calendar-grid-panel flex flex-col overflow-hidden">
          <div class="calendar-month-header flex items-center justify-between px-3 py-1.5">
            <button class="toolbar-btn" :class="[themeClasses.calendarNavBtnBg, themeClasses.calendarNavBtn, themeClasses.calendarNavBtnBgHover]" @click="previousMonth">
              <Icon :icon="chevronLeftIcon" class="w-4 h-4" />
            </button>
            <button class="text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity bg-transparent border-none" :class="themeClasses.notTextUp" @click="goToday">{{ currentMonthYear }}</button>
            <button class="toolbar-btn" :class="[themeClasses.calendarNavBtnBg, themeClasses.calendarNavBtn, themeClasses.calendarNavBtnBgHover]" @click="nextMonth">
              <Icon :icon="chevronRightIcon" class="w-4 h-4" />
            </button>
          </div>
          <div class="calendar-weekdays-row">
            <div v-for="day in weekDays" :key="day" class="weekday-header" :class="themeClasses.calendarWeekday">{{ day }}</div>
          </div>
          <div class="calendar-grid flex-1">
            <button v-for="day in calendarDays" :key="day.date" class="calendar-cell" :class="[themeClasses.calendarDayBg, day.isSelected ? themeClasses.calendarDaySelected : day.isToday ? themeClasses.calendarDayToday : !day.isCurrentMonth ? themeClasses.calendarDayOtherMonth : [themeClasses.calendarDay, themeClasses.calendarDayBgHover]]" @click="selectDate(day)">
              <span class="cell-day-number">{{ day.day }}</span>
              <div v-if="eventsForDate(day.date).length > 0" class="cell-event-dots">
                <span v-for="(evt, i) in eventsForDate(day.date).slice(0, 3)" :key="i" class="event-dot" :style="{ backgroundColor: eventColor(calendarStore.calendarColor(evt.calendar_id || 'personal')) }"></span>
              </div>
            </button>
          </div>
        </div>

        <div class="event-sidebar border-l flex flex-col" :class="[themeClasses.utilityToolbarBorder]">
          <!-- Narrow: tab switcher header -->
          <div class="sidebar-tabs-header border-b" :class="themeClasses.utilityToolbarBorder">
            <div class="flex items-center">
              <button class="sidebar-tab flex-1 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider transition-all" :class="sidebarTab === 'events' ? [themeClasses.notTextUp, 'opacity-100'] : [themeClasses.notTextDown, 'opacity-50']" @click="sidebarTab = 'events'">
                {{ selectedDateFormatted }}
              </button>
              <button class="sidebar-tab flex-1 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider transition-all" :class="sidebarTab === 'calendars' ? [themeClasses.notTextUp, 'opacity-100'] : [themeClasses.notTextDown, 'opacity-50']" @click="sidebarTab = 'calendars'">Calendars</button>
              <button class="toolbar-btn mr-2" :class="[themeClasses.calendarNavBtnBg, themeClasses.calendarNavBtn, themeClasses.calendarNavBtnBgHover]" @click="sidebarTab === 'calendars' ? openNewCalendar() : openNewEvent()" :title="sidebarTab === 'calendars' ? 'New Calendar' : 'New Event'">
                <Icon :icon="plusIcon" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Wide: simple header -->
          <div class="sidebar-wide-header px-3 py-2 border-b" :class="themeClasses.utilityToolbarBorder">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold" :class="themeClasses.notTextUp">{{ selectedDateFormatted }}</span>
              <button class="toolbar-btn" :class="[themeClasses.calendarNavBtnBg, themeClasses.calendarNavBtn, themeClasses.calendarNavBtnBgHover]" @click="openNewEvent" title="New Event">
                <Icon :icon="plusIcon" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Events panel -->
          <div class="sidebar-events-panel flex-1 overflow-y-auto px-3 py-2" :class="{ 'narrow-hidden': sidebarTab !== 'events' }">
            <div v-if="selectedDayEvents.length === 0" class="text-center py-4">
              <Icon :icon="calendarBlankIcon" class="w-8 h-8 mx-auto mb-2 opacity-30" :class="themeClasses.statsWidgetStatIcon" />
              <p class="text-xs opacity-40" :class="themeClasses.notTextDown">No events</p>
            </div>
            <div v-for="evt in selectedDayEvents" :key="evt.id" class="event-card mb-2 p-2 rounded-lg border cursor-pointer" :class="[themeClasses.windowBorder, themeClasses.calendarDayBgHover]" @click="editEvent(evt)">
              <div class="flex items-center gap-2">
                <span class="event-color-bar" :style="{ backgroundColor: eventColor(calendarStore.calendarColor(evt.calendar_id || 'personal')) }"></span>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-medium truncate" :class="themeClasses.notTextUp">{{ evt.title }}</p>
                  <p v-if="evt.time" class="text-[10px] opacity-60" :class="themeClasses.notTextDown">{{ evt.time }}{{ evt.end_time ? ` – ${evt.end_time}` : "" }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Calendars panel -->
          <div class="sidebar-calendars-panel overflow-y-auto px-3 py-2 border-t" :class="[themeClasses.utilityToolbarBorder, { 'narrow-hidden': sidebarTab !== 'calendars' }]">
            <div class="flex items-center justify-between mb-1">
              <span class="text-[10px] font-semibold uppercase tracking-wider opacity-60" :class="themeClasses.notTextDown">Calendars</span>
              <button class="toolbar-btn !w-5 !h-5" :class="[themeClasses.calendarNavBtnBg, themeClasses.calendarNavBtn, themeClasses.calendarNavBtnBgHover]" @click="openNewCalendar" title="New Calendar">
                <Icon :icon="plusIcon" class="w-3 h-3" />
              </button>
            </div>
            <div v-for="cal in calendars" :key="cal.id" class="flex items-center gap-2 py-0.5 group">
              <label class="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                <input type="checkbox" :checked="cal.visible" @change="toggleCalendarVisibility(cal.id)" class="accent-current w-3 h-3" :style="{ accentColor: eventColor(cal.color) }" />
                <span class="w-2 h-2 rounded-full flex-shrink-0" :style="{ backgroundColor: eventColor(cal.color) }"></span>
                <span class="text-xs truncate" :class="themeClasses.notTextUp">{{ cal.name }}</span>
              </label>
              <button class="toolbar-btn !w-4 !h-4 opacity-0 group-hover:opacity-60 hover:!opacity-100" :class="themeClasses.calendarNavBtn" @click="editCalendar(cal)" title="Edit">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </template>

      <template v-if="activeTab === 'worldclock'">
        <div class="flex-1 overflow-y-auto p-4">
          <div class="flex items-center justify-between mb-4">
            <span class="text-sm font-semibold" :class="themeClasses.notTextUp">World Clock</span>
            <button v-if="worldClocks.length < 12" class="toolbar-btn" :class="[themeClasses.calendarNavBtnBg, themeClasses.calendarNavBtn, themeClasses.calendarNavBtnBgHover]" @click="showAddClock = true" title="Add Clock">
              <Icon :icon="plusIcon" class="w-4 h-4" />
            </button>
          </div>

          <div v-if="showAddClock" class="mb-4 p-3 rounded-lg border" :class="themeClasses.windowBorder">
            <input ref="clockSearchRef" v-model="clockSearch" type="text" placeholder="Search timezone..." class="w-full text-xs px-2 py-1.5 rounded-md border mb-2 outline-none" :class="[themeClasses.windowBorder, themeClasses.calendarDayBg, themeClasses.notTextUp]" />
            <div class="max-h-32 overflow-y-auto">
              <button v-for="tz in filteredTimezones" :key="tz" class="w-full text-left text-xs px-2 py-1 rounded hover:opacity-80 truncate" :class="[themeClasses.notTextDown, themeClasses.calendarDayBgHover]" @click="addWorldClock(tz)">
                {{ tz }}
              </button>
            </div>
          </div>

          <div v-if="worldClocks.length === 0" class="text-center py-12">
            <Icon :icon="earthIcon" class="w-10 h-10 mx-auto mb-2 opacity-20" :class="themeClasses.statsWidgetStatIcon" />
            <p class="text-xs opacity-40" :class="themeClasses.notTextDown">No clocks added</p>
          </div>

          <div v-for="(tz, idx) in worldClocks" :key="tz" class="world-clock-card p-3 rounded-lg border mb-2" :class="themeClasses.windowBorder">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium" :class="themeClasses.notTextUp">{{ formatTzName(tz) }}</p>
                <p class="text-lg font-bold tabular-nums" :class="themeClasses.notTextUp">{{ worldClockTimes[tz] || "--:--" }}</p>
                <p class="text-[10px] opacity-50" :class="themeClasses.notTextDown">{{ worldClockDates[tz] || "" }}</p>
              </div>
              <div class="flex items-center gap-1">
                <span class="text-[10px] px-1.5 py-0.5 rounded" :class="[themeClasses.calendarDayBg, themeClasses.notTextDown]">{{ worldClockOffsets[tz] || "" }}</span>
                <button class="toolbar-btn opacity-40 hover:opacity-100" :class="themeClasses.calendarNavBtn" @click="removeWorldClock(idx)" title="Remove">
                  <Icon :icon="closeIcon" class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <AppDialog v-model:visible="showEventDialog" :type="editingEvent?.id ? 'info' : 'info'" :title="editingEvent?.id ? 'Edit Event' : 'New Event'" :ok-text="editingEvent?.id ? 'Update' : 'Create'" cancel-text="Cancel" @ok="saveEvent" @cancel="closeEventDialog" :icon="calendarIcon" :width="380">
      <div class="space-y-3">
        <div>
          <label class="text-sm font-medium block mb-1" :class="themeClasses.windowText">Title</label>
          <input v-model="eventForm.title" type="text" maxlength="200" class="w-full px-3 py-2 text-sm rounded-lg border outline-none" :class="[themeClasses.windowBg, themeClasses.windowText, themeClasses.windowBorder]" placeholder="Event title" ref="eventTitleRef" />
        </div>
        <div>
          <label class="text-sm font-medium block mb-1" :class="themeClasses.windowText">Date</label>
          <DatePicker v-model:value="eventFormDate" format="YYYY-MM-DD" class="w-full calendar-date-picker" :class="themeClasses.scopeSelector" :popupClassName="`calendar-picker-popup ${themeClasses.scopeSelector}`" :allow-clear="false" />
        </div>
        <div class="flex gap-2">
          <div class="flex-1">
            <label class="text-sm font-medium block mb-1" :class="themeClasses.windowText">Start time</label>
            <TimePicker v-model:value="eventFormStartTime" format="HH:mm" :minute-step="5" placeholder="Start" class="w-full calendar-time-picker" :class="themeClasses.scopeSelector" :popupClassName="`calendar-picker-popup ${themeClasses.scopeSelector}`" :allow-clear="true" />
          </div>
          <div class="flex-1">
            <label class="text-sm font-medium block mb-1" :class="themeClasses.windowText">End time</label>
            <TimePicker v-model:value="eventFormEndTime" format="HH:mm" :minute-step="5" placeholder="End" class="w-full calendar-time-picker" :class="themeClasses.scopeSelector" :popupClassName="`calendar-picker-popup ${themeClasses.scopeSelector}`" :allow-clear="true" />
          </div>
        </div>
        <div>
          <label class="text-sm font-medium block mb-1" :class="themeClasses.windowText">Calendar</label>
          <div class="flex gap-1.5 flex-wrap">
            <button v-for="cal in calendars" :key="cal.id" class="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border transition-all" :class="eventForm.calendar_id === cal.id ? 'border-white/40 opacity-100' : 'border-transparent opacity-60 hover:opacity-80'" :style="{ backgroundColor: eventColor(cal.color) + '30', color: eventColor(cal.color) }" @click="eventForm.calendar_id = cal.id">
              <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: eventColor(cal.color) }"></span>
              {{ cal.name }}
            </button>
          </div>
        </div>
        <div>
          <label class="text-sm font-medium block mb-1" :class="themeClasses.windowText">Notes</label>
          <textarea v-model="eventForm.notes" maxlength="2000" rows="3" class="w-full px-3 py-2 text-sm rounded-lg border outline-none resize-none" :class="[themeClasses.windowBg, themeClasses.windowText, themeClasses.windowBorder]" placeholder="Optional notes..."></textarea>
        </div>
        <div v-if="editingEvent?.id" class="pt-1">
          <button class="w-full px-3 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors" @click="showDeleteEventConfirm = true">Delete this event</button>
        </div>
      </div>
    </AppDialog>

    <AppDialog v-model:visible="showDeleteEventConfirm" type="warning" title="Delete Event" ok-text="Delete" cancel-text="Cancel" @ok="deleteEvent" @cancel="showDeleteEventConfirm = false" :icon="deleteIcon" :width="340">
      <p class="text-sm" :class="themeClasses.windowText">
        Are you sure you want to delete "<strong>{{ editingEvent?.title }}</strong
        >"?
      </p>
    </AppDialog>

    <AppDialog
      v-model:visible="showDeleteAllDialog"
      type="warning"
      title="Delete All Events"
      ok-text="Delete All"
      cancel-text="Cancel"
      @ok="
        showDeleteAllConfirm = true;
        showDeleteAllDialog = false;
      "
      @cancel="showDeleteAllDialog = false"
      :icon="deleteIcon"
      :width="340"
    >
      <p class="text-xs" :class="themeClasses.notTextDown">This will permanently delete all {{ events.length }} events. This action cannot be undone.</p>
    </AppDialog>

    <AppDialog v-model:visible="showDeleteAllConfirm" type="error" title="Are you positively sure?" ok-text="Yes, delete everything" cancel-text="Cancel" :reverse-buttons="true" @ok="deleteAllEvents" @cancel="showDeleteAllConfirm = false" :icon="deleteIcon" :width="380">
      <p class="text-xs" :class="themeClasses.notTextDown">All {{ events.length }} events will be permanently deleted. There is no way to recover them.</p>
    </AppDialog>

    <AppDialog v-model:visible="showDedupDialogVisible" type="info" title="Remove Duplicates" :ok-text="duplicateGroups.length > 0 ? 'Remove Selected' : 'OK'" :cancel-text="duplicateGroups.length > 0 ? 'Cancel' : ''" :ok-cancel="duplicateGroups.length > 0" @ok="duplicateGroups.length > 0 ? removeDuplicates() : (showDedupDialogVisible = false)" @cancel="showDedupDialogVisible = false" :icon="filterRemoveIcon" :width="420" :ok-disabled="duplicateGroups.length > 0 && dedupSelected.length === 0">
      <div v-if="duplicateGroups.length === 0" class="py-2">
        <p class="text-sm" :class="themeClasses.windowText">No duplicate events found.</p>
      </div>
      <template v-else>
        <p class="text-sm mb-3" :class="themeClasses.windowText">Found {{ duplicateGroups.reduce((a, g) => a + g.dupes.length, 0) }} duplicate(s). Select which to remove:</p>
        <div class="max-h-48 overflow-y-auto space-y-2 pr-1">
          <div v-for="(group, gi) in duplicateGroups" :key="gi">
            <div class="text-xs font-semibold mb-1 px-1" :class="themeClasses.windowText">{{ group.key }}</div>
            <label v-for="dupe in group.dupes" :key="dupe.id" class="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer" :class="themeClasses.calendarDayBgHover">
              <input type="checkbox" v-model="dedupSelected" :value="dupe.id" class="accent-blue-500" />
              <span class="event-color-bar-sm" :style="{ backgroundColor: eventColor(calendarStore.calendarColor(dupe.calendar_id || 'personal')) }"></span>
              <span class="text-sm truncate" :class="themeClasses.windowText">{{ dupe.title }} · {{ dupe.date }}{{ dupe.time ? ` ${dupe.time}` : "" }}</span>
            </label>
          </div>
        </div>
      </template>
    </AppDialog>

    <AppDialog
      v-model:visible="showICSImportDialog"
      type="info"
      title="Import .ics"
      ok-text="Import"
      cancel-text="Cancel"
      @ok="confirmICSImport"
      @cancel="
        showICSImportDialog = false;
        icsPendingEvents = [];
      "
      :icon="calendarIcon"
      :width="380"
    >
      <div class="space-y-3">
        <p class="text-sm" :class="themeClasses.windowText">{{ icsPendingEvents.length }} event{{ icsPendingEvents.length !== 1 ? "s" : "" }} found. Import to which calendar?</p>
        <div class="flex gap-1.5 flex-wrap">
          <button v-for="cal in calendars" :key="cal.id" class="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border transition-all" :class="icsImportCalendarId === cal.id ? 'border-white/40 opacity-100' : 'border-transparent opacity-60 hover:opacity-80'" :style="{ backgroundColor: eventColor(cal.color) + '30', color: eventColor(cal.color) }" @click="icsImportCalendarId = cal.id">
            <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: eventColor(cal.color) }"></span>
            {{ cal.name }}
          </button>
          <button class="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border transition-all" :class="[themeClasses.windowBorder, themeClasses.windowText, icsImportCalendarId === '__new__' ? 'opacity-100' : 'opacity-60 hover:opacity-80']" @click="icsImportCalendarId = '__new__'"><Icon :icon="plusIcon" class="w-3 h-3" /> New Calendar</button>
        </div>
        <div v-if="icsImportCalendarId === '__new__'">
          <label class="text-sm font-medium block mb-1" :class="themeClasses.windowText">Calendar name</label>
          <input v-model="icsImportCalendarName" type="text" maxlength="100" class="w-full px-3 py-2 text-sm rounded-lg border outline-none" :class="[themeClasses.windowBg, themeClasses.windowText, themeClasses.windowBorder]" placeholder="e.g. Spain Holidays" />
        </div>
      </div>
    </AppDialog>

    <AppDialog v-model:visible="showCalendarDialog" type="info" :title="editingCalendar?.id ? 'Edit Calendar' : 'New Calendar'" :ok-text="editingCalendar?.id ? 'Update' : 'Create'" cancel-text="Cancel" @ok="saveCalendarForm" @cancel="showCalendarDialog = false" :icon="calendarIcon" :width="340">
      <div class="space-y-3">
        <div>
          <label class="text-sm font-medium block mb-1" :class="themeClasses.windowText">Name</label>
          <input v-model="calendarForm.name" type="text" maxlength="100" class="w-full px-3 py-2 text-sm rounded-lg border outline-none" :class="[themeClasses.windowBg, themeClasses.windowText, themeClasses.windowBorder]" placeholder="Calendar name" />
        </div>
        <div>
          <label class="text-sm font-medium block mb-1" :class="themeClasses.windowText">Color</label>
          <div class="flex gap-1.5">
            <button v-for="c in EVENT_COLORS" :key="c.name" class="w-6 h-6 rounded-full border-2 transition-transform" :class="calendarForm.color === c.name ? 'scale-110 border-white/60' : 'border-transparent hover:scale-105'" :style="{ backgroundColor: c.hex }" @click="calendarForm.color = c.name" :title="c.name"></button>
          </div>
        </div>
        <div v-if="editingCalendar?.id && calendars.length > 1" class="pt-1">
          <button class="w-full px-3 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors" @click="showDeleteCalendarDialog = true">Delete this calendar</button>
        </div>
      </div>
    </AppDialog>

    <AppDialog
      v-model:visible="showDeleteCalendarDialog"
      type="warning"
      title="Delete Calendar"
      ok-text="Delete"
      cancel-text="Cancel"
      @ok="
        showDeleteCalendarConfirm = true;
        showDeleteCalendarDialog = false;
      "
      @cancel="showDeleteCalendarDialog = false"
      :icon="deleteIcon"
      :width="380"
    >
      <div class="space-y-3">
        <p class="text-xs" :class="themeClasses.notTextDown">
          The calendar "<strong>{{ editingCalendar?.name }}</strong
          >" and its configuration will be permanently deleted.
        </p>
        <div class="flex items-center justify-between">
          <span class="text-xs" :class="themeClasses.windowText">Keep events (move to "{{ calendars.find((c) => c.id !== editingCalendar?.id)?.name }}")</span>
          <Switch v-model:checked="deleteCalendarKeepEvents" />
        </div>
      </div>
    </AppDialog>

    <AppDialog v-model:visible="showDeleteCalendarConfirm" type="error" title="Are you positively sure?" ok-text="Yes, delete calendar" cancel-text="Cancel" :reverse-buttons="true" @ok="confirmDeleteCalendar" @cancel="showDeleteCalendarConfirm = false" :icon="deleteIcon" :width="380">
      <p class="text-xs" :class="themeClasses.notTextDown">
        <template v-if="deleteCalendarKeepEvents"
          >The calendar "<strong>{{ editingCalendar?.name }}</strong
          >" will be deleted. Its events will be moved to "{{ calendars.find((c) => c.id !== editingCalendar?.id)?.name }}".</template
        >
        <template v-else
          >The calendar "<strong>{{ editingCalendar?.name }}</strong
          >" and <strong>all its events</strong> will be permanently deleted.</template
        >
      </p>
    </AppDialog>

    <StatusBar :icon="calendarIcon" message="Calendar" :info="statusInfo">
      <template #help>
        <div class="space-y-3 max-w-sm">
          <div class="flex items-center gap-2">
            <Icon :icon="calendarIcon" :class="['w-5 h-5', themeClasses.statusBarIcon]" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">Calendar</h4>
          </div>
          <div :class="['text-[10px] md:text-xs space-y-2.5 leading-relaxed', themeClasses.statusBarInfo]">
            <p>Manage events and track time across the world.</p>
            <div class="space-y-1.5">
              <div class="flex items-start gap-2">
                <Icon :icon="plusIcon" class="w-3.5 h-3.5 mt-0.5 text-blue-500 flex-shrink-0" />
                <p><strong>Events:</strong> Click any day to see its events. Create new events from the File menu or the sidebar + button.</p>
              </div>
              <div class="flex items-start gap-2">
                <Icon :icon="earthIcon" class="w-3.5 h-3.5 mt-0.5 text-green-500 flex-shrink-0" />
                <p><strong>World Clock:</strong> Switch to World Clock from the View menu to track time across different timezones.</p>
              </div>
              <div class="flex items-start gap-2">
                <Icon :icon="filterRemoveIcon" class="w-3.5 h-3.5 mt-0.5 text-orange-500 flex-shrink-0" />
                <p><strong>Import / Export:</strong> Import and export events in standard .ics format, compatible with Google Calendar, Apple Calendar, and Outlook.</p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </StatusBar>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Icon } from "@iconify/vue";
import { TimePicker, DatePicker, Dropdown, Menu, MenuItem, MenuDivider, Switch } from "ant-design-vue";
import calendarIcon from "@iconify-icons/mdi/calendar";
import calendarBlankIcon from "@iconify-icons/mdi/calendar-blank-outline";
import chevronLeftIcon from "@iconify-icons/mdi/chevron-left";
import chevronRightIcon from "@iconify-icons/mdi/chevron-right";
import plusIcon from "@iconify-icons/mdi/plus";
import closeIcon from "@iconify-icons/mdi/close";
import earthIcon from "@iconify-icons/mdi/earth";
import exitIcon from "@iconify-icons/mdi/exit-to-app";
import filterRemoveIcon from "@iconify-icons/mdi/filter-remove-outline";
import deleteIcon from "@iconify-icons/mdi/delete-outline";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useWindowStore } from "../__Stores__/windowStore";
import { useCalendarStore } from "../__Stores__/useCalendarStore";
import StatusBar from "../__Components__/StatusBar.vue";
import AppDialog from "../__Components__/AppDialog.vue";

dayjs.extend(utc);
dayjs.extend(timezone);

interface Props {
  _windowId?: string;
}

const props = defineProps<Props>();

const { themeClasses } = useTheme();
const csrfToken = useCsrfToken();
const windowStore = useWindowStore();
const calendarStore = useCalendarStore();

const activeTab = ref<"calendar" | "worldclock">("calendar");
const sidebarTab = ref<"events" | "calendars">("events");
const viewDate = ref(dayjs());
const selectedDate = ref(dayjs());

const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const EVENT_COLORS = [
  { name: "blue", hex: "#3b82f6" },
  { name: "red", hex: "#ef4444" },
  { name: "green", hex: "#22c55e" },
  { name: "yellow", hex: "#eab308" },
  { name: "purple", hex: "#a855f7" },
  { name: "pink", hex: "#ec4899" },
  { name: "orange", hex: "#f97316" },
  { name: "teal", hex: "#14b8a6" },
];

function eventColor(name: string): string {
  return EVENT_COLORS.find((c) => c.name === name)?.hex || "#3b82f6";
}

const events = computed(() => calendarStore.visibleEvents);

const currentMonthYear = computed(() => viewDate.value.format("MMMM YYYY"));
const selectedDateFormatted = computed(() => selectedDate.value.format("ddd, MMM D"));
const statusInfo = computed(() => {
  const count = events.value.length;
  return `${count} event${count !== 1 ? "s" : ""} total`;
});

const calendarDays = computed(() => {
  const days: any[] = [];
  const startOfMonth = viewDate.value.startOf("month");
  const endOfMonth = viewDate.value.endOf("month");
  const startDay = startOfMonth.day();
  const daysInMonth = endOfMonth.date();

  const prevMonthEnd = startOfMonth.subtract(1, "day");
  for (let i = startDay - 1; i >= 0; i--) {
    const d = prevMonthEnd.subtract(i, "day");
    days.push({ day: d.date(), date: d.format("YYYY-MM-DD"), isCurrentMonth: false, isToday: d.isSame(dayjs(), "day"), isSelected: d.isSame(selectedDate.value, "day"), dayjs: d });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const d = startOfMonth.date(i);
    days.push({ day: i, date: d.format("YYYY-MM-DD"), isCurrentMonth: true, isToday: d.isSame(dayjs(), "day"), isSelected: d.isSame(selectedDate.value, "day"), dayjs: d });
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = endOfMonth.add(i, "day");
    days.push({ day: d.date(), date: d.format("YYYY-MM-DD"), isCurrentMonth: false, isToday: d.isSame(dayjs(), "day"), isSelected: d.isSame(selectedDate.value, "day"), dayjs: d });
  }
  return days;
});

function eventsForDate(date: string) {
  return calendarStore.eventsForDate(date);
}

const selectedDayEvents = computed(() => eventsForDate(selectedDate.value.format("YYYY-MM-DD")));

function selectDate(day: any) {
  selectedDate.value = day.dayjs;
  if (!day.isCurrentMonth) viewDate.value = day.dayjs;
}

function previousMonth() {
  viewDate.value = viewDate.value.subtract(1, "month");
}
function nextMonth() {
  viewDate.value = viewDate.value.add(1, "month");
}
function goToday() {
  const today = dayjs();
  viewDate.value = today;
  selectedDate.value = today;
}

function handleExit() {
  if (props._windowId) windowStore.closeWindow(props._windowId);
}

// Event CRUD
const calendars = computed(() => calendarStore.calendars);

const showEventDialog = ref(false);
const editingEvent = ref<any>(null);
const eventForm = ref({ title: "", date: "", time: "", end_time: "", calendar_id: "personal", notes: "" });
const showDeleteEventConfirm = ref(false);
const eventTitleRef = ref<HTMLInputElement | null>(null);
const icsFileInput = ref<HTMLInputElement | null>(null);

const showICSImportDialog = ref(false);
const icsImportCalendarId = ref("personal");
const icsImportCalendarName = ref("");
const icsPendingEvents = ref<any[]>([]);

const showCalendarDialog = ref(false);
const showDeleteCalendarDialog = ref(false);
const showDeleteCalendarConfirm = ref(false);
const deleteCalendarKeepEvents = ref(true);
const editingCalendar = ref<any>(null);
const calendarForm = ref({ name: "", color: "blue" });

const eventFormStartTime = computed({
  get: () => (eventForm.value.time ? dayjs(eventForm.value.time, "HH:mm") : undefined),
  set: (val: any) => {
    eventForm.value.time = val ? val.format("HH:mm") : "";
  },
});
const eventFormEndTime = computed({
  get: () => (eventForm.value.end_time ? dayjs(eventForm.value.end_time, "HH:mm") : undefined),
  set: (val: any) => {
    eventForm.value.end_time = val ? val.format("HH:mm") : "";
  },
});
const eventFormDate = computed({
  get: () => (eventForm.value.date ? dayjs(eventForm.value.date, "YYYY-MM-DD") : dayjs()),
  set: (val: any) => {
    eventForm.value.date = val ? val.format("YYYY-MM-DD") : "";
  },
});

function openNewEvent() {
  editingEvent.value = {};
  const defaultCalId = calendars.value[0]?.id || "personal";
  eventForm.value = { title: "", date: selectedDate.value.format("YYYY-MM-DD"), time: "", end_time: "", calendar_id: defaultCalId, notes: "" };
  showEventDialog.value = true;
  nextTick(() => eventTitleRef.value?.focus());
}

function editEvent(evt: any) {
  editingEvent.value = evt;
  eventForm.value = { title: evt.title, date: evt.date, time: evt.time || "", end_time: evt.end_time || "", calendar_id: evt.calendar_id || calendars.value[0]?.id || "personal", notes: evt.notes || "" };
  showEventDialog.value = true;
  nextTick(() => eventTitleRef.value?.focus());
}

function closeEventDialog() {
  showEventDialog.value = false;
  editingEvent.value = null;
}

async function saveEvent() {
  if (!eventForm.value.title.trim()) return;
  const payload: any = { ...eventForm.value };
  if (editingEvent.value?.id) payload.id = editingEvent.value.id;
  await calendarStore.saveEvent(payload, csrfToken.value);
  closeEventDialog();
}

async function deleteEvent() {
  if (!editingEvent.value?.id) return;
  await calendarStore.deleteEvent(editingEvent.value.id, csrfToken.value);
  showDeleteEventConfirm.value = false;
  closeEventDialog();
}

const showDedupDialogVisible = ref(false);
const dedupSelected = ref<string[]>([]);
const duplicateGroups = ref<{ key: string; dupes: any[] }[]>([]);

function showDedupDialog() {
  const seen = new Map<string, any[]>();
  for (const evt of events.value) {
    const key = `${evt.title} · ${evt.date}${evt.time ? ` ${evt.time}` : ""}`;
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key)!.push(evt);
  }
  const groups: { key: string; dupes: any[] }[] = [];
  for (const [key, evts] of seen) {
    if (evts.length > 1) {
      groups.push({ key, dupes: evts.slice(1) });
    }
  }
  duplicateGroups.value = groups;
  dedupSelected.value = groups.flatMap((g) => g.dupes.map((d) => d.id));
  showDedupDialogVisible.value = true;
}

async function removeDuplicates() {
  for (const id of dedupSelected.value) {
    await calendarStore.deleteEvent(id, csrfToken.value);
  }
  showDedupDialogVisible.value = false;
}

const showDeleteAllDialog = ref(false);
const showDeleteAllConfirm = ref(false);

function confirmDeleteAll() {
  showDeleteAllDialog.value = true;
}

async function deleteAllEvents() {
  for (const evt of [...events.value]) {
    await calendarStore.deleteEvent(evt.id, csrfToken.value);
  }
  showDeleteAllConfirm.value = false;
}

function escapeICS(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function exportICS() {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//HomeDockOS//Calendar//EN"];
  for (const evt of events.value) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${evt.id}`);
    lines.push(`SUMMARY:${escapeICS(evt.title)}`);
    const dateClean = evt.date.replace(/-/g, "");
    if (evt.time) {
      const timeClean = evt.time.replace(/:/g, "");
      lines.push(`DTSTART:${dateClean}T${timeClean}00`);
      if (evt.end_time) {
        const endClean = evt.end_time.replace(/:/g, "");
        lines.push(`DTEND:${dateClean}T${endClean}00`);
      }
    } else {
      lines.push(`DTSTART;VALUE=DATE:${dateClean}`);
    }
    if (evt.notes) lines.push(`DESCRIPTION:${escapeICS(evt.notes)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");

  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `homedock-calendar-${dayjs().format("YYYY-MM-DD")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

function importICS() {
  icsFileInput.value?.click();
}

async function handleICSFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const text = await file.text();
  const parsed = parseICS(text);
  if (parsed.length === 0) return;
  icsPendingEvents.value = parsed;
  icsImportCalendarId.value = calendars.value[0]?.id || "personal";
  icsImportCalendarName.value = file.name.replace(/\.ics$/i, "").replace(/[_-]/g, " ");
  showICSImportDialog.value = true;
  if (icsFileInput.value) icsFileInput.value.value = "";
}

async function confirmICSImport() {
  let calId = icsImportCalendarId.value;
  if (calId === "__new__" && icsImportCalendarName.value.trim()) {
    const newCal = await calendarStore.saveCalendar({ name: icsImportCalendarName.value.trim(), color: "blue", visible: true }, csrfToken.value);
    if (newCal) calId = newCal.id;
  }
  for (const evt of icsPendingEvents.value) {
    await calendarStore.saveEvent({ ...evt, calendar_id: calId }, csrfToken.value);
  }
  icsPendingEvents.value = [];
  showICSImportDialog.value = false;
}

function openNewCalendar() {
  editingCalendar.value = {};
  calendarForm.value = { name: "", color: "blue" };
  showCalendarDialog.value = true;
}

function editCalendar(cal: any) {
  editingCalendar.value = cal;
  calendarForm.value = { name: cal.name, color: cal.color };
  showCalendarDialog.value = true;
}

async function saveCalendarForm() {
  if (!calendarForm.value.name.trim()) return;
  const payload: any = { ...calendarForm.value, visible: true };
  if (editingCalendar.value?.id) payload.id = editingCalendar.value.id;
  await calendarStore.saveCalendar(payload, csrfToken.value);
  showCalendarDialog.value = false;
}

async function confirmDeleteCalendar() {
  const id = editingCalendar.value?.id;
  if (!id) return;
  if (!deleteCalendarKeepEvents.value) {
    const eventsToDelete = calendarStore.events.filter((e) => e.calendar_id === id);
    for (const evt of eventsToDelete) {
      await calendarStore.deleteEvent(evt.id, csrfToken.value);
    }
  }
  await calendarStore.deleteCalendar(id, csrfToken.value);
  showDeleteCalendarConfirm.value = false;
  showCalendarDialog.value = false;
}

function toggleCalendarVisibility(id: string) {
  calendarStore.toggleCalendarVisibility(id);
}

function parseICS(text: string): any[] {
  const results: any[] = [];
  const lines = text.replace(/\r\n /g, "").split(/\r?\n/);
  let current: any = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = { title: "", date: "", time: "", end_time: "", color: "blue", notes: "" };
    } else if (line === "END:VEVENT" && current) {
      if (current.title && current.date) results.push(current);
      current = null;
    } else if (current) {
      const sep = line.indexOf(":");
      if (sep < 0) continue;
      const key = line.substring(0, sep).split(";")[0];
      const val = line.substring(sep + 1);
      const unescaped = val.replace(/\\n/g, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");

      if (key === "SUMMARY") {
        current.title = unescaped.substring(0, 200);
      } else if (key === "DESCRIPTION") {
        current.notes = unescaped.substring(0, 2000);
      } else if (key === "DTSTART") {
        const dt = parseDTValue(val);
        current.date = dt.date;
        current.time = dt.time;
      } else if (key === "DTEND") {
        const dt = parseDTValue(val);
        current.end_time = dt.time;
      }
    }
  }
  return results;
}

function parseDTValue(val: string): { date: string; time: string } {
  const clean = val.replace(/[Z]$/, "");
  if (clean.length >= 8) {
    const date = `${clean.substring(0, 4)}-${clean.substring(4, 6)}-${clean.substring(6, 8)}`;
    let time = "";
    if (clean.length >= 13 && clean[8] === "T") {
      time = `${clean.substring(9, 11)}:${clean.substring(11, 13)}`;
    }
    return { date, time };
  }
  return { date: "", time: "" };
}

const worldClocks = computed(() => calendarStore.worldClocks);
const worldClockTimes = ref<Record<string, string>>({});
const worldClockDates = ref<Record<string, string>>({});
const worldClockOffsets = ref<Record<string, string>>({});
const showAddClock = ref(false);
const clockSearch = ref("");
const clockSearchRef = ref<HTMLInputElement | null>(null);

const COMMON_TIMEZONES = ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Sao_Paulo", "America/Mexico_City", "America/Buenos_Aires", "America/Bogota", "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Madrid", "Europe/Rome", "Europe/Moscow", "Europe/Istanbul", "Europe/Athens", "Asia/Tokyo", "Asia/Shanghai", "Asia/Hong_Kong", "Asia/Singapore", "Asia/Seoul", "Asia/Kolkata", "Asia/Dubai", "Asia/Bangkok", "Australia/Sydney", "Australia/Melbourne", "Pacific/Auckland", "Africa/Cairo", "Africa/Lagos", "Africa/Johannesburg", "Pacific/Honolulu", "America/Anchorage"];

const filteredTimezones = computed(() => {
  const q = clockSearch.value.toLowerCase();
  const available = COMMON_TIMEZONES.filter((tz) => !worldClocks.value.includes(tz));
  if (!q) return available;
  return available.filter((tz) => tz.toLowerCase().includes(q));
});

function formatTzName(tz: string): string {
  return tz.replace(/_/g, " ").replace(/\//g, " / ");
}

function updateWorldClockTimes() {
  const now = dayjs();
  for (const tz of worldClocks.value) {
    try {
      const t = now.tz(tz);
      worldClockTimes.value[tz] = t.format("HH:mm:ss");
      worldClockDates.value[tz] = t.format("ddd, MMM D");
      const offset = t.utcOffset();
      const h = Math.floor(Math.abs(offset) / 60);
      const m = Math.abs(offset) % 60;
      worldClockOffsets.value[tz] = `UTC${offset >= 0 ? "+" : "-"}${h}${m > 0 ? `:${String(m).padStart(2, "0")}` : ""}`;
    } catch {
      worldClockTimes.value[tz] = "--:--";
    }
  }
}

async function addWorldClock(tz: string) {
  calendarStore.addWorldClock(tz);
  showAddClock.value = false;
  clockSearch.value = "";
  updateWorldClockTimes();
  await calendarStore.saveWorldClocks(csrfToken.value);
}

async function removeWorldClock(idx: number) {
  calendarStore.removeWorldClock(idx);
  await calendarStore.saveWorldClocks(csrfToken.value);
}

watch(showAddClock, (v) => {
  if (v) nextTick(() => clockSearchRef.value?.focus());
});

let clockInterval: ReturnType<typeof setInterval> | null = null;

onMounted(async () => {
  await Promise.all([calendarStore.fetchCalendars(csrfToken.value), calendarStore.fetchEvents(csrfToken.value), calendarStore.fetchWorldClocks(csrfToken.value)]);
  updateWorldClockTimes();
  clockInterval = setInterval(updateWorldClockTimes, 1000);
});

onUnmounted(() => {
  if (clockInterval) clearInterval(clockInterval);
});
</script>

<style scoped>
.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

/* Wide layout (default): side-by-side */
.cal-main-area {
  display: flex;
  flex-direction: row;
}

.calendar-grid-panel {
  flex: 1;
  min-width: 0;
}

.calendar-weekdays-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  padding: 0.5rem 0.75rem 0.25rem;
}

.weekday-header {
  text-align: center;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.25rem;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
  gap: 2px;
  padding: 0 0.75rem 0.75rem;
}

.calendar-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border: none;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s ease;
  font-weight: 500;
  min-height: 0;
}

.cell-day-number {
  font-size: 0.7rem;
  line-height: 1;
}

.cell-event-dots {
  display: flex;
  gap: 2px;
}

.event-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
}

.event-sidebar {
  width: 220px;
  min-width: 220px;
}

/* Wide: show wide header + events + collapsible calendars; hide tab header + calendars panel */
.sidebar-tabs-header {
  display: none;
}

.sidebar-wide-header {
  display: block;
}

.sidebar-events-panel {
  display: block;
}

.sidebar-calendars-panel {
  display: block;
}

.sidebar-tab {
  position: relative;
}

.event-color-bar {
  width: 3px;
  height: 24px;
  border-radius: 2px;
  flex-shrink: 0;
}

.event-color-bar-sm {
  width: 3px;
  height: 14px;
  border-radius: 2px;
  flex-shrink: 0;
}

.world-clock-card {
  transition: all 0.15s ease;
}

/* Compact layout: stack vertically when container is narrow */
@container (max-width: 520px) {
  .cal-main-area {
    flex-direction: column;
    overflow-y: auto;
  }

  .calendar-grid-panel {
    flex: none;
  }

  .calendar-grid {
    grid-template-rows: repeat(6, minmax(32px, auto));
  }

  .event-sidebar {
    width: 100%;
    min-width: 0;
    border-left: none !important;
    border-top-width: 1px;
    border-top-style: solid;
    flex: 1;
    min-height: 120px;
  }

  /* Narrow: show tab header + tab panels; hide wide header + collapsible calendars */
  .sidebar-tabs-header {
    display: block;
  }

  .sidebar-wide-header {
    display: none;
  }

  .sidebar-events-panel {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .sidebar-calendars-panel {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .narrow-hidden {
    display: none !important;
  }
}
</style>
