<!-- homedock-ui/vue3/static/js/__Apps__/AppLogs.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="app-logs flex flex-col h-full overflow-hidden">
    <div class="flex items-center gap-3 px-4 pt-3 pb-2.5 flex-shrink-0">
      <span class="relative flex-shrink-0">
        <AppIconGraphic :image-src="appEntry?.image_path" :size="36" />
        <Icon v-if="dependencyParent" :icon="dependencyBadgeIcon" :class="[themeClasses.hubDependencyBadge]" class="absolute -top-1 -right-1 w-4 h-4 rounded-full p-0.5 ring-1" />
      </span>
      <div class="flex flex-col justify-center min-w-0 flex-1">
        <p :class="[themeClasses.hubCardTextAppName]" class="font-bold text-sm truncate m-0" :title="`${displayName} ${$t('logs')}`">{{ displayName }} {{ $t("logs") }}</p>
        <p :class="[themeClasses.hubCardTextRepo]" class="text-xs truncate m-0">{{ dependencyParent ? $t("Dependency of {name}", { name: dependencyParent }) : $t("Real-time container logs") }}</p>
      </div>
    </div>

    <div class="flex items-center gap-2 px-3 py-1.5 border-y flex-shrink-0 flex-wrap" :class="themeClasses.utilityToolbarBorder">
      <div class="relative flex-1 min-w-[140px]">
        <Icon :icon="magnifyIcon" :class="[themeClasses.windowPlaceholderText]" class="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" />
        <input v-model="searchQuery" type="text" :placeholder="$t('Search logs...')" :class="[themeClasses.windowInputBg, themeClasses.windowText, themeClasses.windowBorder]" class="w-full h-7 pl-7 pr-7 text-xs rounded-md border outline-none" spellcheck="false" @keydown.esc="searchQuery = ''" />
        <button v-if="searchQuery" :class="[themeClasses.windowPlaceholderText]" class="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded border-0 bg-transparent cursor-pointer" :title="$t('Clear')" @click="searchQuery = ''">
          <Icon :icon="closeIcon" class="w-3.5 h-3.5" />
        </button>
      </div>

      <div class="flex items-center h-7 rounded-md border p-0.5 flex-shrink-0" :class="[themeClasses.windowBorder]">
        <button v-for="option in levelOptions" :key="option.value" :class="[levelFilter === option.value ? [themeClasses.appPropsActionButtonPrimaryBg, themeClasses.appPropsActionButtonPrimaryText] : [themeClasses.windowText, themeClasses.windowButtonBgHover]]" class="h-full px-2.5 text-[11px] font-medium rounded border-0 cursor-pointer transition-colors flex items-center gap-1" @click="levelFilter = option.value">
          <span v-if="option.dot" :class="option.dot" class="w-1.5 h-1.5 rounded-full"></span>
          {{ option.label }}
        </button>
      </div>

      <Select v-model:value="timeRange" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" class="w-[130px] rounded-md text-xs flex-shrink-0 [&_.ant-select-selector]:!min-h-0 [&_.ant-select-selector]:!h-7 [&_.ant-select-selector]:!py-0 [&_.ant-select-selection-item]:!leading-7" :popup-class-name="`${themeClasses.scopeSelector}`" :dropdown-match-select-width="false" :show-search="false" size="small" @change="reload" @dropdown-visible-change="onRangeMenuOpen">
        <SelectOption v-for="option in visibleRangeOptions" :key="option.value" :value="option.value">{{ option.label }}</SelectOption>
      </Select>

      <div class="flex items-center gap-0.5 flex-shrink-0">
        <button :class="wrapLines ? [themeClasses.appPropsActionButtonPrimaryBg, themeClasses.appPropsActionButtonPrimaryText] : [themeClasses.windowText, themeClasses.windowButtonBgHover, 'bg-transparent']" class="w-7 h-7 rounded-md border-0 cursor-pointer flex items-center justify-center transition-colors" :title="$t('Wrap lines')" :aria-pressed="wrapLines" @click="toggleWrap">
          <Icon :icon="wrapLines ? wrapIcon : wrapDisabledIcon" class="w-4 h-4" />
        </button>
        <Dropdown v-model:open="downloadMenuOpen" :trigger="['click']" placement="bottomRight" :overlay-class-name="`${themeClasses.scopeSelector} ant-select-dropdown`" :disabled="downloading || latestLogMs === null" @open-change="onDownloadMenuOpen">
          <button :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="w-7 h-7 rounded-md border-0 bg-transparent cursor-pointer flex items-center justify-center disabled:opacity-40 disabled:cursor-default" :title="$t('Download')" :disabled="downloading || latestLogMs === null">
            <Icon :icon="downloading ? spinIcon : downloadIcon" :class="{ 'animate-spin': downloading }" class="w-4 h-4" />
          </button>
          <template #overlay>
            <div role="listbox" class="p-1 min-w-[200px]" @mouseleave="activeDownload = null">
              <div v-for="option in downloadOptions" :key="option.value" role="option" :aria-selected="option.value === timeRange" class="ant-select-item ant-select-item-option cursor-pointer" :class="{ 'ant-select-item-option-selected': option.value === timeRange, 'ant-select-item-option-active': option.value === activeDownload }" @mouseenter="activeDownload = option.value" @click="chooseDownload(option.value)">
                <div class="ant-select-item-option-content flex items-center gap-3">
                  <span class="truncate">{{ option.label }}</span>
                  <span v-if="option.size" class="ml-auto text-[11px] font-normal opacity-60 tabular-nums">{{ option.size }}</span>
                </div>
              </div>
            </div>
          </template>
        </Dropdown>
      </div>
    </div>

    <div class="relative flex-1 min-h-0" :class="themeClasses.terminalSurface">
      <div ref="scrollRef" class="logs-scroll absolute inset-0 overflow-auto font-mono text-[12px] leading-[18px] py-1" :style="{ color: themeClasses.terminalForeground }" @scroll="onScroll">
        <div :style="{ height: `${virtualizer.getTotalSize()}px`, width: wrapLines ? '100%' : 'max-content', minWidth: '100%', position: 'relative' }">
          <div v-for="row in virtualizer.getVirtualItems()" :key="visibleLines[row.index].id" :ref="wrapLines ? measureRow : undefined" :data-index="row.index" class="log-row absolute left-0 flex gap-3 pl-2 pr-3 border-l-2" :class="[levelRowClass(visibleLines[row.index].level)]" :style="{ transform: `translateY(${row.start}px)`, width: wrapLines ? '100%' : 'max-content', minWidth: '100%' }">
            <span class="log-time flex-shrink-0 w-[62px] tabular-nums" :style="{ color: themeClasses.terminalBrightBlack }" :title="visibleLines[row.index].fullDate">{{ visibleLines[row.index].time }}</span>
            <span :class="wrapLines ? 'whitespace-pre-wrap [overflow-wrap:anywhere] min-w-0 flex-1' : 'whitespace-pre'">
              <template v-for="(segment, segmentIndex) in visibleLines[row.index].segments" :key="segmentIndex">
                <span :style="segmentStyle(segment)"
                  ><template v-for="(part, partIndex) in highlightParts(segment.text)" :key="partIndex"
                    ><mark v-if="part.match" class="log-match">{{ part.text }}</mark
                    ><template v-else>{{ part.text }}</template></template
                  ></span
                >
              </template>
            </span>
          </div>
        </div>
      </div>

      <div v-if="!visibleLines.length" class="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pointer-events-none">
        <Icon :icon="loading ? spinIcon : emptyState.icon" :class="[themeClasses.terminalStateIcon, { 'animate-spin': loading }]" class="w-10 h-10 mb-2" />
        <p :class="[themeClasses.terminalStateText]" class="text-xs m-0">{{ loading ? $t("Loading logs...") : emptyState.text }}</p>
      </div>

      <Transition enter-active-class="transition-all duration-200 ease-out" leave-active-class="transition-all duration-150 ease-in" enter-from-class="opacity-0 translate-y-2" leave-to-class="opacity-0 translate-y-2">
        <button v-if="!following && visibleLines.length" :class="[themeClasses.terminalEndedBar]" class="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pl-2.5 pr-3 py-1 rounded-full border text-xs font-medium cursor-pointer" @click="jumpToNow">
          <Icon :icon="arrowDownIcon" class="w-3.5 h-3.5" />
          <span>{{ newLineCount ? $t("{n} new lines", { n: newLineCount }) : $t("Jump to now") }}</span>
        </button>
      </Transition>
    </div>

    <StatusBar :icon="scriptTextIcon" :message="displayName" :info="statusInfo" :loading="loading" :error="fetchFailed" :showHelp="true">
      <template #help>
        <div class="space-y-2.5 max-w-sm">
          <div class="flex items-center gap-2">
            <StatusBarHelpIcon :icon="scriptTextIcon" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">{{ $t("Logs") }}</h4>
          </div>

          <div :class="['text-[10px] md:text-xs space-y-2 leading-relaxed', themeClasses.statusBarInfo]">
            <p>{{ $t("Everything the container writes appears here as it happens. Scroll up to read calmly and new lines wait for you below; the button at the bottom takes you back to the latest.") }}</p>
            <p>{{ $t("Search and the level filter work on what is loaded. Download saves the last minutes, the last hours or the entire log, straight from the container.") }}</p>
          </div>
        </div>
      </template>
    </StatusBar>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";

import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import { Select, SelectOption, Dropdown, message } from "ant-design-vue";
import { useVirtualizer } from "@tanstack/vue-virtual";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useDesktopStore } from "../__Stores__/desktopStore";
import { parseAnsi, stripAnsi, type AnsiSegment, type AnsiColor } from "../__Utils__/AnsiParser";
import { formatBytes } from "../__Composables__/useControlHub";

import { Icon } from "@iconify/vue";
import spinIcon from "@iconify-icons/mdi/loading";
import dependencyBadgeIcon from "@iconify-icons/mdi/cube-outline";
import scriptTextIcon from "@iconify-icons/mdi/script-text";
import magnifyIcon from "@iconify-icons/mdi/magnify";
import closeIcon from "@iconify-icons/mdi/close";
import wrapIcon from "@iconify-icons/mdi/wrap";
import wrapDisabledIcon from "@iconify-icons/mdi/wrap-disabled";
import downloadIcon from "@iconify-icons/mdi/download";
import arrowDownIcon from "@iconify-icons/mdi/arrow-down";
import emptyLogsIcon from "@iconify-icons/mdi/text-box-outline";
import searchOffIcon from "@iconify-icons/mdi/text-search";
import alertIcon from "@iconify-icons/mdi/alert-circle-outline";

import AppIconGraphic from "../__Components__/AppIconGraphic.vue";
import StatusBar from "../__Components__/StatusBar.vue";
import StatusBarHelpIcon from "../__Components__/StatusBarHelpIcon.vue";

interface Props {
  appName?: string;
  dependencyOf?: string;
  data?: {
    appName?: string;
  };
}

type LogLevel = "error" | "warn" | "info";
type LevelFilter = "all" | "warn" | "error";
type TimeRange = "15m" | "1h" | "24h" | "all";

interface LogLine {
  id: number;
  ts: string;
  time: string;
  fullDate: string;
  plain: string;
  lower: string;
  segments: AnsiSegment[];
  level: LogLevel;
}

const props = defineProps<Props>();
const { t } = useI18n();
const { themeClasses } = useTheme();
const csrfToken = useCsrfToken();
const desktopStore = useDesktopStore();

const LOGS_ENDPOINT = "/api/view-container-logs";
const POLL_INTERVAL = 2000;
const MAX_LINES = 20000;
const ROW_HEIGHT = 18;
const FOLLOW_THRESHOLD = 24;
const WRAP_KEY = "homedock-logs-wrap";
const RANGE_SECONDS: Record<TimeRange, number> = { "15m": 15 * 60, "1h": 60 * 60, "24h": 24 * 60 * 60, all: Infinity };

const ERROR_RE = /\b(error|fatal|critical|crit|panic|emerg|alert|exception)\b|\berr\b(?=[\]:|\s])|traceback \(most recent call last\)|level=(error|fatal|panic)|"level":\s*"(error|fatal|panic)"/i;
const WARN_RE = /\b(warn|warning)\b|level=warn|"level":\s*"warn(ing)?"/i;

const appName = computed(() => props.appName || props.data?.appName || "Unknown");
const appEntry = computed(() => desktopStore.dockerApps.find((a) => a.name === appName.value) || null);

const displayName = computed(() => {
  const app = appEntry.value;
  if (!app) return appName.value;

  return app.HDRole === "dependency" ? app.name : app.display_name || app.name;
});

const dependencyParent = computed(() => {
  if (props.dependencyOf) return props.dependencyOf;

  const app = appEntry.value;
  if (!app || app.HDRole !== "dependency" || !app.HDGroup) return "";

  const main = desktopStore.mainDockerApps.find((candidate) => candidate.HDGroup === app.HDGroup);
  return main ? main.display_name || main.name : "";
});

const scrollRef = ref<HTMLDivElement | null>(null);
const lines = ref<LogLine[]>([]);
const loading = ref(true);
const fetchFailed = ref(false);
const notFound = ref(false);
const searchQuery = ref("");
const levelFilter = ref<LevelFilter>("all");
const timeRange = ref<TimeRange>("all");
const wrapLines = ref(readWrapPreference());
const following = ref(true);
const newLineCount = ref(0);
const downloading = ref(false);
const logSize = ref<number | null>(null);
const latestLogMs = ref<number | null>(null);
const clockOffset = ref(0);
const nowTick = ref(Date.now());
const downloadMenuOpen = ref(false);
const activeDownload = ref<TimeRange | null>(null);

let cursor = "";
let nextId = 0;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let inFlight = false;
let generation = 0;

const levelOptions = computed(() => [
  { value: "all" as LevelFilter, label: t("All"), dot: "" },
  { value: "warn" as LevelFilter, label: t("Warnings"), dot: "bg-amber-500" },
  { value: "error" as LevelFilter, label: t("Errors"), dot: "bg-red-500" },
]);

const rangeOptions = computed(() => [
  { value: "15m" as TimeRange, label: t("Last 15 minutes") },
  { value: "1h" as TimeRange, label: t("Last hour") },
  { value: "24h" as TimeRange, label: t("Last 24 hours") },
  { value: "all" as TimeRange, label: t("Latest lines") },
]);

function rangeAvailable(range: TimeRange): boolean {
  if (range === "all") return true;
  if (latestLogMs.value === null) return false;
  return latestLogMs.value >= nowTick.value + clockOffset.value - RANGE_SECONDS[range] * 1000;
}

const visibleRangeOptions = computed(() => rangeOptions.value.filter((option) => rangeAvailable(option.value) || option.value === timeRange.value));

const downloadOptions = computed(() => {
  if (latestLogMs.value === null) return [];

  const recent = rangeOptions.value.filter((option) => option.value !== "all" && rangeAvailable(option.value)).map((option) => ({ ...option, size: "" }));

  return [...recent, { value: "all" as TimeRange, label: t("Entire log"), size: logSize.value !== null ? formatBytes(logSize.value) : "" }];
});

const normalizedQuery = computed(() => searchQuery.value.trim().toLowerCase());

const visibleLines = computed(() => {
  const query = normalizedQuery.value;
  const level = levelFilter.value;

  if (!query && level === "all") return lines.value;

  return lines.value.filter((line) => {
    if (level === "error" && line.level !== "error") return false;
    if (level === "warn" && line.level === "info") return false;
    return !query || line.lower.includes(query);
  });
});

const errorCount = computed(() => lines.value.reduce((count, line) => count + (line.level === "error" ? 1 : 0), 0));

const statusInfo = computed(() => {
  const parts = [t("{n} lines", { n: visibleLines.value.length })];
  if (errorCount.value) parts.push(t("{n} errors", { n: errorCount.value }));
  return parts.join(" • ");
});

const emptyState = computed(() => {
  if (notFound.value) return { icon: alertIcon, text: t("Container not found") };
  if (fetchFailed.value && !lines.value.length) return { icon: alertIcon, text: t("Failed to fetch logs for this application.") };
  if (lines.value.length) return { icon: searchOffIcon, text: t("No results") };
  return { icon: emptyLogsIcon, text: t("No logs found for this application.") };
});

const palette = computed(() => {
  const c = themeClasses.value;
  return [c.terminalBlack, c.terminalRed, c.terminalGreen, c.terminalYellow, c.terminalBlue, c.terminalMagenta, c.terminalCyan, c.terminalWhite, c.terminalBrightBlack, c.terminalBrightRed, c.terminalBrightGreen, c.terminalBrightYellow, c.terminalBrightBlue, c.terminalBrightMagenta, c.terminalBrightCyan, c.terminalBrightWhite];
});

const virtualizer = useVirtualizer(
  computed(() => ({
    count: visibleLines.value.length,
    getScrollElement: () => scrollRef.value,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  })),
);

function readWrapPreference(): boolean {
  try {
    return localStorage.getItem(WRAP_KEY) !== "0";
  } catch {
    return true;
  }
}

function toggleWrap() {
  wrapLines.value = !wrapLines.value;
  try {
    localStorage.setItem(WRAP_KEY, wrapLines.value ? "1" : "0");
  } catch {}
}

function measureRow(element: unknown) {
  if (element instanceof Element) virtualizer.value.measureElement(element);
}

function resolveColor(color: AnsiColor): string | undefined {
  if (!color) return undefined;
  return "index" in color ? palette.value[color.index] : color.rgb;
}

function segmentStyle(segment: AnsiSegment): Record<string, string> {
  const style: Record<string, string> = {};
  const fg = resolveColor(segment.fg);
  const bg = resolveColor(segment.bg);

  if (fg) style.color = fg;
  if (bg) style.backgroundColor = bg;
  if (segment.bold) style.fontWeight = "600";
  if (segment.dim) style.opacity = "0.65";
  if (segment.italic) style.fontStyle = "italic";
  if (segment.underline) style.textDecoration = "underline";

  return style;
}

function highlightParts(text: string): { text: string; match: boolean }[] {
  const query = normalizedQuery.value;
  if (!query) return [{ text, match: false }];

  const parts: { text: string; match: boolean }[] = [];
  const lower = text.toLowerCase();
  let index = 0;

  while (index < text.length) {
    const found = lower.indexOf(query, index);
    if (found === -1) {
      parts.push({ text: text.slice(index), match: false });
      break;
    }
    if (found > index) parts.push({ text: text.slice(index, found), match: false });
    parts.push({ text: text.slice(found, found + query.length), match: true });
    index = found + query.length;
  }

  return parts;
}

function levelRowClass(level: LogLevel): string {
  if (level === "error") return "bg-red-500/10 border-l-red-500";
  if (level === "warn") return "bg-amber-500/10 border-l-amber-500";
  return "border-l-transparent";
}

function detectLevel(plain: string): LogLevel {
  if (ERROR_RE.test(plain)) return "error";
  if (WARN_RE.test(plain)) return "warn";
  return "info";
}

function parseTimestamp(ts: string): Date | null {
  if (!ts) return null;
  const date = new Date(ts.replace(/(\.\d{3})\d+/, "$1"));
  return Number.isNaN(date.getTime()) ? null : date;
}

function onRangeMenuOpen(open: boolean) {
  if (open) nowTick.value = Date.now();
}

function onDownloadMenuOpen(open: boolean) {
  if (open) nowTick.value = Date.now();
  else activeDownload.value = null;
}

function chooseDownload(range: TimeRange) {
  downloadMenuOpen.value = false;
  downloadLogs(range);
}

function toLogLine(entry: { ts: string; text: string }): LogLine {
  const plain = stripAnsi(entry.text);
  const date = parseTimestamp(entry.ts);
  const valid = date !== null;

  return {
    id: nextId++,
    ts: entry.ts,
    time: valid ? date!.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) : "",
    fullDate: valid ? date!.toLocaleString() : "",
    plain,
    lower: plain.toLowerCase(),
    segments: parseAnsi(entry.text),
    level: detectLevel(plain),
  };
}

function isAtBottom(): boolean {
  const el = scrollRef.value;
  if (!el) return true;
  return el.scrollHeight - el.scrollTop - el.clientHeight < FOLLOW_THRESHOLD;
}

function scrollToBottom() {
  const el = scrollRef.value;
  if (!el) return;

  nextTick(() => {
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  });
}

function onScroll() {
  const atBottom = isAtBottom();
  following.value = atBottom;
  if (atBottom) newLineCount.value = 0;
}

function jumpToNow() {
  following.value = true;
  newLineCount.value = 0;
  scrollToBottom();
}

function appendLines(entries: { ts: string; text: string }[]) {
  if (!entries.length) return;

  const incoming = entries.map(toLogLine);
  const newest = parseTimestamp(entries[entries.length - 1].ts)?.getTime();
  if (newest !== undefined && (latestLogMs.value === null || newest > latestLogMs.value)) latestLogMs.value = newest;

  const merged = lines.value.concat(incoming);
  lines.value = merged.length > MAX_LINES ? merged.slice(merged.length - MAX_LINES) : merged;

  if (following.value) scrollToBottom();
  else newLineCount.value += incoming.length;
}

async function fetchLogs() {
  if (inFlight) return;

  inFlight = true;
  const current = generation;

  try {
    const response = await axios.get(LOGS_ENDPOINT, {
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      params: { containerName: appName.value, cursor: cursor || undefined, range: cursor ? undefined : timeRange.value },
    });

    if (current !== generation) return;

    fetchFailed.value = false;
    notFound.value = false;
    cursor = response.data?.cursor || cursor;
    if ("size" in (response.data || {})) logSize.value = typeof response.data.size === "number" ? response.data.size : null;
    if ("latest" in (response.data || {})) latestLogMs.value = parseTimestamp(response.data.latest)?.getTime() ?? null;
    if (typeof response.data?.now === "number") clockOffset.value = response.data.now * 1000 - Date.now();
    appendLines(response.data?.lines || []);
    nowTick.value = Date.now();

    if (following.value && !rangeAvailable(timeRange.value)) {
      timeRange.value = "all";
      reload();
    }
  } catch (error: any) {
    if (current !== generation) return;

    fetchFailed.value = true;
    notFound.value = error?.response?.status === 404;
  } finally {
    if (current === generation) {
      loading.value = false;
      inFlight = false;
    }
  }
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function reload() {
  generation++;
  stopPolling();
  inFlight = false;
  cursor = "";
  lines.value = [];
  newLineCount.value = 0;
  following.value = true;
  loading.value = true;

  await fetchLogs();
  pollTimer = setInterval(fetchLogs, POLL_INTERVAL);
}

async function downloadLogs(range: TimeRange) {
  if (downloading.value) return;
  downloading.value = true;

  try {
    const response = await axios.post(`${LOGS_ENDPOINT}/download-ticket`, { containerName: appName.value, range }, { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });
    const ticket = response.data?.ticket;
    if (!ticket) throw new Error("ticket");

    const link = document.createElement("a");
    link.href = `${LOGS_ENDPOINT}/download?ticket=${encodeURIComponent(ticket)}`;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch {
    message.error(t("Failed to download file. Please try again."));
  } finally {
    downloading.value = false;
  }
}

watch(
  () => virtualizer.value.getTotalSize(),
  () => {
    if (following.value) scrollToBottom();
  },
);

watch([normalizedQuery, levelFilter, wrapLines], () => {
  newLineCount.value = 0;
  following.value = true;
  nextTick(() => {
    virtualizer.value.measure();
    scrollToBottom();
  });
});

onMounted(reload);

onBeforeUnmount(() => {
  generation++;
  stopPolling();
});
</script>

<style scoped>
.logs-scroll {
  -webkit-user-select: text;
  user-select: text;
}

.log-time {
  -webkit-user-select: none;
  user-select: none;
}

.log-row {
  min-height: 18px;
}

.log-match {
  background-color: rgba(250, 204, 21, 0.45);
  color: inherit;
  border-radius: 2px;
  padding: 0;
}
</style>
