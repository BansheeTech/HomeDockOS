<!-- homedock-ui/vue3/static/js/__Apps__/AppDockerTerminal.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="app-docker-terminal flex flex-col h-full overflow-hidden">
    <div class="flex items-center gap-1 px-2 py-1.5 border-b" :class="themeClasses.utilityToolbarBorder">
      <Dropdown :trigger="['click']" placement="bottomLeft" :overlay-class-name="themeClasses.scopeSelector" @open-change="onMenuOpenChange">
        <button :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="px-3 py-1 text-xs rounded transition-colors cursor-pointer">{{ $t("Shell") }}</button>
        <template #overlay>
          <Menu class="min-w-[220px]">
            <MenuItem key="new" @click="startSession">
              <div class="flex items-center gap-2">
                <Icon :icon="consoleIcon" class="w-4 h-4" />
                <span>{{ $t("New Session") }}</span>
              </div>
            </MenuItem>
            <MenuItem key="end" :disabled="status !== 'connected'" @click="endSession">
              <div class="flex items-center gap-2">
                <Icon :icon="stopIcon" class="w-4 h-4" />
                <span>{{ $t("End Session") }}</span>
              </div>
            </MenuItem>
            <MenuDivider />
            <MenuItemGroup :title="$t('Shell')">
              <MenuItem key="shell-auto" @click="chooseShell('auto')">
                <div class="flex items-center gap-2">
                  <Icon :icon="shellChoice === 'auto' ? radioOnIcon : radioOffIcon" class="w-4 h-4" />
                  <span>{{ $t("Automatic") }}</span>
                  <span v-if="shellChoice === 'auto' && activeShell" class="ml-auto pl-3 text-[10px] opacity-50">{{ shellName(activeShell) }}</span>
                </div>
              </MenuItem>
              <MenuItem v-for="shell in availableShells" :key="`shell-${shell}`" @click="chooseShell(shell)">
                <div class="flex items-center gap-2">
                  <Icon :icon="shellChoice === shell ? radioOnIcon : radioOffIcon" class="w-4 h-4" />
                  <span>{{ shellName(shell) }}</span>
                  <span class="ml-auto pl-3 text-[10px] opacity-50 font-mono">{{ shell }}</span>
                </div>
              </MenuItem>
            </MenuItemGroup>
            <MenuDivider />
            <MenuItemGroup :title="$t('Run as')">
              <MenuItem key="user-default" @click="chooseUser('default')">
                <div class="flex items-center gap-2">
                  <Icon :icon="userMode === 'default' ? radioOnIcon : radioOffIcon" class="w-4 h-4" />
                  <span>{{ $t("Container user") }}</span>
                </div>
              </MenuItem>
              <MenuItem key="user-root" @click="chooseUser('root')">
                <div class="flex items-center gap-2">
                  <Icon :icon="userMode === 'root' ? radioOnIcon : radioOffIcon" class="w-4 h-4" />
                  <span>root</span>
                </div>
              </MenuItem>
            </MenuItemGroup>
          </Menu>
        </template>
      </Dropdown>

      <Dropdown :trigger="['click']" placement="bottomLeft" :overlay-class-name="themeClasses.scopeSelector" @open-change="onMenuOpenChange">
        <button :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="px-3 py-1 text-xs rounded transition-colors cursor-pointer">{{ $t("Edit") }}</button>
        <template #overlay>
          <Menu class="min-w-[220px]">
            <MenuItem key="copy" :disabled="!hasSelection" @click="copySelection">
              <div class="flex items-center gap-2">
                <Icon :icon="copyIcon" class="w-4 h-4" />
                <span>{{ $t("Copy") }}</span>
                <span class="ml-auto pl-3 text-[10px] opacity-50">{{ shortcut("C") }}</span>
              </div>
            </MenuItem>
            <MenuItem key="paste" :disabled="status !== 'connected'" @click="pasteFromClipboard">
              <div class="flex items-center gap-2">
                <Icon :icon="pasteIcon" class="w-4 h-4" />
                <span>{{ $t("Paste") }}</span>
                <span class="ml-auto pl-3 text-[10px] opacity-50">{{ shortcut("V") }}</span>
              </div>
            </MenuItem>
            <MenuItem key="selectall" @click="selectAll">
              <div class="flex items-center gap-2">
                <Icon :icon="selectAllIcon" class="w-4 h-4" />
                <span>{{ $t("Select All") }}</span>
              </div>
            </MenuItem>
            <MenuDivider />
            <MenuItem key="find" @click="openFind">
              <div class="flex items-center gap-2">
                <Icon :icon="magnifyIcon" class="w-4 h-4" />
                <span>{{ $t("Find") }}</span>
                <span class="ml-auto pl-3 text-[10px] opacity-50">{{ shortcut("F") }}</span>
              </div>
            </MenuItem>
            <MenuItem key="clear" @click="clearScrollback">
              <div class="flex items-center gap-2">
                <Icon :icon="clearIcon" class="w-4 h-4" />
                <span>{{ $t("Clear Scrollback") }}</span>
                <span class="ml-auto pl-3 text-[10px] opacity-50">{{ shortcut("K") }}</span>
              </div>
            </MenuItem>
          </Menu>
        </template>
      </Dropdown>

      <Dropdown :trigger="['click']" placement="bottomLeft" :overlay-class-name="themeClasses.scopeSelector" @open-change="onMenuOpenChange">
        <button :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="px-3 py-1 text-xs rounded transition-colors cursor-pointer">{{ $t("View") }}</button>
        <template #overlay>
          <Menu class="min-w-[200px]">
            <MenuItem key="bigger" :disabled="fontSize >= MAX_FONT_SIZE" @click="changeFontSize(1)">
              <div class="flex items-center gap-2">
                <Icon :icon="magnifyPlusIcon" class="w-4 h-4" />
                <span>{{ $t("Bigger") }}</span>
              </div>
            </MenuItem>
            <MenuItem key="smaller" :disabled="fontSize <= MIN_FONT_SIZE" @click="changeFontSize(-1)">
              <div class="flex items-center gap-2">
                <Icon :icon="magnifyMinusIcon" class="w-4 h-4" />
                <span>{{ $t("Smaller") }}</span>
              </div>
            </MenuItem>
            <MenuItem key="actual" :disabled="fontSize === defaultFontSize" @click="resetFontSize">
              <div class="flex items-center gap-2">
                <Icon :icon="magnifyIcon" class="w-4 h-4" />
                <span>{{ $t("Actual Size") }}</span>
              </div>
            </MenuItem>
            <MenuDivider />
            <MenuItem key="keys" @click="toggleKeyBar">
              <div class="flex items-center gap-2">
                <Icon :icon="keyBarVisible ? keyboardOnIcon : keyboardOffIcon" class="w-4 h-4" />
                <span>{{ $t("Extra Keys") }}</span>
              </div>
            </MenuItem>
          </Menu>
        </template>
      </Dropdown>

      <div class="ml-auto flex items-center gap-2 min-w-0 pl-2">
        <span class="relative flex-shrink-0">
          <AppIconGraphic :image-src="appEntry?.image_path" :size="16" />
          <Icon v-if="dependencyParent" :icon="dependencyBadgeIcon" :class="[themeClasses.hubDependencyBadge]" class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-1" />
        </span>
        <span :class="[themeClasses.windowText]" class="text-xs truncate hidden sm:inline">{{ displayName }}</span>
        <span :class="[statusDotClass]" class="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors"></span>
      </div>
    </div>

    <Transition enter-active-class="transition-all duration-150 ease-out" leave-active-class="transition-all duration-100 ease-in" enter-from-class="opacity-0 -translate-y-1" leave-to-class="opacity-0 -translate-y-1">
      <div v-if="findVisible" class="flex items-center gap-2 px-3 py-2 border-b" :class="themeClasses.utilityToolbarBorder">
        <Icon :icon="magnifyIcon" :class="[themeClasses.windowPlaceholderText]" class="w-4 h-4 flex-shrink-0" />
        <input ref="findInputRef" v-model="findText" type="text" :placeholder="$t('Find...')" :class="[themeClasses.windowInputBg, themeClasses.windowText, themeClasses.windowBorder]" class="flex-1 min-w-0 px-2 py-1 text-xs rounded border outline-hidden" spellcheck="false" @keydown.enter.exact.prevent="findNext" @keydown.shift.enter.prevent="findPrevious" @keydown.esc.prevent="closeFind" />
        <span v-if="findText && findNoMatch" :class="[themeClasses.windowPlaceholderText]" class="text-[11px] flex-shrink-0">{{ $t("No results") }}</span>
        <button :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="p-1 rounded cursor-pointer" :title="$t('Previous')" @click="findPrevious">
          <Icon :icon="chevronUpIcon" class="w-4 h-4" />
        </button>
        <button :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="p-1 rounded cursor-pointer" :title="$t('Next')" @click="findNext">
          <Icon :icon="chevronDownIcon" class="w-4 h-4" />
        </button>
        <button :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="p-1 rounded cursor-pointer" :title="$t('Close')" @click="closeFind">
          <Icon :icon="closeIcon" class="w-4 h-4" />
        </button>
      </div>
    </Transition>

    <div class="relative flex-1 min-h-0" :class="themeClasses.terminalSurface">
      <div ref="terminalHost" class="terminal-host absolute inset-0 pl-2.5 pr-1 pt-1.5 pb-1" :class="{ 'opacity-0 pointer-events-none': status === 'error' }" @contextmenu.stop></div>

      <Transition enter-active-class="transition-opacity duration-200 ease-out" leave-active-class="transition-opacity duration-150 ease-in" enter-from-class="opacity-0" leave-to-class="opacity-0">
        <div v-if="status === 'error'" class="absolute inset-0 flex items-center justify-center p-6">
          <div class="flex flex-col items-center text-center max-w-sm">
            <Icon :icon="errorState.icon" :class="[themeClasses.terminalStateIcon]" class="w-12 h-12 mb-3" />
            <p :class="[themeClasses.terminalStateTitle]" class="text-sm font-semibold mb-1">{{ errorState.title }}</p>
            <p :class="[themeClasses.terminalStateText]" class="text-xs leading-relaxed mb-4">{{ errorState.text }}</p>
            <div class="flex items-center gap-2">
              <button v-if="errorState.action" :disabled="actionBusy" :class="[themeClasses.appPropsActionButtonPrimaryBg, themeClasses.appPropsActionButtonPrimaryBorder, themeClasses.appPropsActionButtonPrimaryText, themeClasses.appPropsActionButtonPrimaryBgHover]" class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-default" @click="runErrorAction">
                <Icon :icon="actionBusy ? spinIcon : errorState.action.icon" :class="{ 'animate-spin': actionBusy }" class="w-3.5 h-3.5" />
                <span>{{ errorState.action.label }}</span>
              </button>
              <button :class="[themeClasses.appPropsActionButtonBg, themeClasses.appPropsActionButtonBorder, themeClasses.appPropsActionButtonText, themeClasses.appPropsActionButtonBgHover]" class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer" @click="startSession">
                <Icon :icon="reloadIcon" class="w-3.5 h-3.5" />
                <span>{{ $t("Try Again") }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <Transition enter-active-class="transition-all duration-200 ease-out" leave-active-class="transition-all duration-150 ease-in" enter-from-class="opacity-0 translate-y-2" leave-to-class="opacity-0 translate-y-2">
        <div v-if="status === 'ended'" class="absolute bottom-3 inset-x-0 flex justify-center px-3 pointer-events-none">
          <div :class="[themeClasses.terminalEndedBar]" class="pointer-events-auto flex items-center gap-3 pl-3 pr-1.5 py-1.5 rounded-full border text-xs max-w-full">
            <span class="truncate">{{ endedMessage }}</span>
            <button :class="[themeClasses.appPropsActionButtonPrimaryBg, themeClasses.appPropsActionButtonPrimaryText, themeClasses.appPropsActionButtonPrimaryBgHover]" class="flex items-center gap-1 px-2.5 py-1 rounded-full font-medium flex-shrink-0 transition-colors cursor-pointer" @click="startSession">
              <Icon :icon="reloadIcon" class="w-3.5 h-3.5" />
              <span>{{ $t("Reconnect") }}</span>
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <div v-if="keyBarVisible" :class="[themeClasses.terminalKeyBar]" class="flex items-center gap-1 px-2 py-1.5 border-t overflow-x-auto flex-shrink-0 terminal-keybar">
      <button v-for="key in extraKeys" :key="key.id" :class="[themeClasses.terminalKey, isKeyLatched(key.id) ? themeClasses.terminalKeyActive : '']" class="h-7 min-w-[2.25rem] px-2 rounded-md border text-xs font-medium flex items-center justify-center flex-shrink-0 transition-colors select-none cursor-pointer" @pointerdown.prevent @click="pressExtraKey(key)">
        <Icon v-if="key.icon" :icon="key.icon" class="w-4 h-4" />
        <span v-else>{{ key.label }}</span>
      </button>
    </div>

    <StatusBar :icon="consoleIcon" :message="statusMessage" :info="statusInfo" :loading="status === 'connecting'" :error="status === 'ended' && endReason === 'lost'" :showHelp="true">
      <template #help>
        <div class="space-y-2.5 max-w-sm">
          <div class="flex items-center gap-2">
            <StatusBarHelpIcon :icon="consoleIcon" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">{{ $t("Terminal") }}</h4>
          </div>

          <div :class="['text-[10px] md:text-xs md:leading-4 space-y-2 leading-relaxed', themeClasses.statusBarInfo]">
            <p>{{ $t("Opens an interactive shell inside the application's container, the same as running docker exec on the machine that hosts HomeDock OS. Commands run inside the container, not on your computer or on the host.") }}</p>
            <p>{{ $t("Pick the shell and the user from the Shell menu. Closing the window ends the session and every process started from it.") }}</p>
          </div>
        </div>
      </template>
    </StatusBar>
  </div>
</template>

<script lang="ts" setup>
import axios, { AxiosError } from "axios";

import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import { Dropdown, Menu, MenuItem, MenuDivider, MenuItemGroup, message } from "ant-design-vue";

import { Terminal, type ITheme } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { Unicode11Addon } from "@xterm/addon-unicode11";
import { SearchAddon } from "@xterm/addon-search";
import "@xterm/xterm/css/xterm.css";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useResponsive } from "../__Composables__/useResponsive";
import { useDesktopStore } from "../__Stores__/desktopStore";
import { startContainer, unpauseContainer } from "../__Services__/DockerActions";
import { shortcutLabel } from "../__Utils__/PlatformKeys";

import { Icon } from "@iconify/vue";
import consoleIcon from "@iconify-icons/mdi/console-line";
import stopIcon from "@iconify-icons/mdi/stop-circle-outline";
import radioOnIcon from "@iconify-icons/mdi/radiobox-marked";
import radioOffIcon from "@iconify-icons/mdi/radiobox-blank";
import keyboardOnIcon from "@iconify-icons/mdi/keyboard-outline";
import keyboardOffIcon from "@iconify-icons/mdi/keyboard-off-outline";
import copyIcon from "@iconify-icons/mdi/content-copy";
import pasteIcon from "@iconify-icons/mdi/content-paste";
import selectAllIcon from "@iconify-icons/mdi/select-all";
import magnifyIcon from "@iconify-icons/mdi/magnify";
import magnifyPlusIcon from "@iconify-icons/mdi/magnify-plus-outline";
import magnifyMinusIcon from "@iconify-icons/mdi/magnify-minus-outline";
import clearIcon from "@iconify-icons/mdi/notification-clear-all";
import chevronUpIcon from "@iconify-icons/mdi/chevron-up";
import chevronDownIcon from "@iconify-icons/mdi/chevron-down";
import closeIcon from "@iconify-icons/mdi/close";
import reloadIcon from "@iconify-icons/mdi/reload";
import spinIcon from "@iconify-icons/mdi/loading";
import playIcon from "@iconify-icons/mdi/play";
import dependencyBadgeIcon from "@iconify-icons/mdi/cube-outline";
import sleepIcon from "@iconify-icons/mdi/power-sleep";
import pauseIcon from "@iconify-icons/mdi/pause-circle-outline";
import shellOffIcon from "@iconify-icons/mdi/console-network-outline";
import alertIcon from "@iconify-icons/mdi/alert-circle-outline";
import searchOffIcon from "@iconify-icons/mdi/file-search-outline";
import arrowUpIcon from "@iconify-icons/mdi/arrow-up";
import arrowDownIcon from "@iconify-icons/mdi/arrow-down";
import arrowLeftIcon from "@iconify-icons/mdi/arrow-left";
import arrowRightIcon from "@iconify-icons/mdi/arrow-right";

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

type SessionStatus = "idle" | "connecting" | "connected" | "ended" | "error";
type UserMode = "default" | "root";
type EndReason = "exit" | "lost" | "user";
type LatchKey = "ctrl" | "alt";

interface SessionInfo {
  shell: string;
  user: UserMode;
  username: string;
  container: string;
  id: string;
}

interface ExtraKey {
  id: string;
  label?: string;
  icon?: any;
  latch?: LatchKey;
  sequence?: string;
  cursor?: "A" | "B" | "C" | "D";
}

const props = defineProps<Props>();
const { t } = useI18n();
const { themeClasses } = useTheme();
const { isMobile } = useResponsive();
const csrfToken = useCsrfToken();
const desktopStore = useDesktopStore();

const SESSION_ENDPOINT = "/api/container-terminal/session";
const FONT_SIZE_KEY = "homedock-terminal-font-size";
const KEY_BAR_KEY = "homedock-terminal-key-bar";
const MIN_FONT_SIZE = 9;
const MAX_FONT_SIZE = 24;
const KEEPALIVE_INTERVAL = 25000;
const MODE_RESET = "\x1b[!p\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1006l\x1b[?2004l";
const ALT_SCREEN_EXIT = "\x1b[?1049l";
const CURSOR_HIDE = "\x1b[?25l";
const CURSOR_SHOW = "\x1b[?25h";
const SGR_RESET = "\x1b[0m";
const SGR_BOLD = "\x1b[1m";
const SGR_DIM = "\x1b[2m";

const HOMEDOCK_LOGO = ["           @@@@@@@@@@@@@@@@@@@@@@@@", "          @@@@@@@@@@@@@@@@@@@@@@@@@", "         @@@@", "        @@@@   @@@@@@@@@@@@@@@@@@@@", "       @@@@   @@@", "       @@@   @@@   @@@@@@@@@@@@@", "      @@@   @@@*  @@@@      @@@*  @", "     @@@   @@@@  @@@@      @@@@  @@", "    @@@*  @@@@  (@@@      @@@@@@@@@", "   @@@@  @@@@   @@@      //////////", "  @@@@  @@@@   @@@", " @@@@  #@@@   @@@", "@@@@   @@@   @@@"];
const LOGO_WIDTH = Math.max(...HOMEDOCK_LOGO.map((line) => line.length));
const BANNER_GAP = 4;
const BANNER_INFO_ROW = 4;
const BANNER_MIN_INFO_WIDTH = 24;

const isApplePlatform = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
const coarsePointer = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;

const appName = computed(() => props.appName || props.data?.appName || "");

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

const terminalHost = ref<HTMLDivElement | null>(null);
const findInputRef = ref<HTMLInputElement | null>(null);

const status = ref<SessionStatus>("idle");
const errorCode = ref("");
const exitCode = ref<number | null>(null);
const endReason = ref<EndReason>("exit");
const activeShell = ref("");
const activeUser = ref<UserMode>("default");
const availableShells = ref<string[]>([]);
const shellChoice = ref("auto");
const userMode = ref<UserMode>("default");
const hasSelection = ref(false);
const actionBusy = ref(false);
const findVisible = ref(false);
const findText = ref("");
const findNoMatch = ref(false);
const termSize = ref({ cols: 0, rows: 0 });
const latched = ref<Set<LatchKey>>(new Set());

const defaultFontSize = isMobile.value ? 12 : 13;
const fontSize = ref(readStoredNumber(FONT_SIZE_KEY, defaultFontSize));
const keyBarPreference = ref(readStoredFlag(KEY_BAR_KEY));
const keyBarVisible = computed(() => (keyBarPreference.value === null ? isMobile.value || coarsePointer : keyBarPreference.value));

let term: Terminal | null = null;
let fitAddon: FitAddon | null = null;
let searchAddon: SearchAddon | null = null;
let socket: WebSocket | null = null;
let generation = 0;
let resizeObserver: ResizeObserver | null = null;
let fitFrame = 0;
let keepaliveTimer: ReturnType<typeof setInterval> | null = null;
let restoreFocusAfterMenu = false;
let disposed = false;
let bannerShown = false;

const encoder = new TextEncoder();

const extraKeys: ExtraKey[] = [
  { id: "esc", label: "esc", sequence: "\x1b" },
  { id: "tab", label: "tab", sequence: "\t" },
  { id: "ctrl", label: "ctrl", latch: "ctrl" },
  { id: "alt", label: "alt", latch: "alt" },
  { id: "up", icon: arrowUpIcon, cursor: "A" },
  { id: "down", icon: arrowDownIcon, cursor: "B" },
  { id: "left", icon: arrowLeftIcon, cursor: "D" },
  { id: "right", icon: arrowRightIcon, cursor: "C" },
  { id: "pipe", label: "|", sequence: "|" },
  { id: "tilde", label: "~", sequence: "~" },
  { id: "slash", label: "/", sequence: "/" },
  { id: "dash", label: "-", sequence: "-" },
];

function readStoredNumber(key: string, fallback: number): number {
  try {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) && value >= MIN_FONT_SIZE && value <= MAX_FONT_SIZE ? value : fallback;
  } catch {
    return fallback;
  }
}

function readStoredFlag(key: string): boolean | null {
  try {
    const value = localStorage.getItem(key);
    return value === null ? null : value === "1";
  } catch {
    return null;
  }
}

function storeValue(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function shellName(path: string): string {
  return path.split(/[\\/]/).pop() || path;
}

function shortcut(key: string): string {
  return isApplePlatform ? shortcutLabel(key) : `Ctrl+Shift+${key}`;
}

const terminalTheme = computed<ITheme>(() => {
  const c = themeClasses.value;

  return {
    background: c.terminalBackground,
    foreground: c.terminalForeground,
    cursor: c.terminalCursor,
    cursorAccent: c.terminalCursorAccent,
    selectionBackground: c.terminalSelection,
    scrollbarSliderBackground: c.terminalScrollbar,
    scrollbarSliderHoverBackground: c.terminalScrollbarHover,
    scrollbarSliderActiveBackground: c.terminalScrollbarHover,
    black: c.terminalBlack,
    red: c.terminalRed,
    green: c.terminalGreen,
    yellow: c.terminalYellow,
    blue: c.terminalBlue,
    magenta: c.terminalMagenta,
    cyan: c.terminalCyan,
    white: c.terminalWhite,
    brightBlack: c.terminalBrightBlack,
    brightRed: c.terminalBrightRed,
    brightGreen: c.terminalBrightGreen,
    brightYellow: c.terminalBrightYellow,
    brightBlue: c.terminalBrightBlue,
    brightMagenta: c.terminalBrightMagenta,
    brightCyan: c.terminalBrightCyan,
    brightWhite: c.terminalBrightWhite,
  };
});

function brandColor(ratio: number): string {
  const parse = (hex: string) => [0, 2, 4].map((offset) => parseInt(hex.replace("#", "").slice(offset, offset + 2), 16) || 0);
  const from = parse(themeClasses.value.terminalBrandFrom);
  const to = parse(themeClasses.value.terminalBrandTo);
  const [r, g, b] = from.map((channel, index) => Math.round(channel + (to[index] - channel) * ratio));

  return `\x1b[38;2;${r};${g};${b}m`;
}

function charWidth(code: number): number {
  const wide = (code >= 0x1100 && code <= 0x115f) || (code >= 0x2e80 && code <= 0xa4cf) || (code >= 0xac00 && code <= 0xd7a3) || (code >= 0xf900 && code <= 0xfaff) || (code >= 0xfe30 && code <= 0xfe4f) || (code >= 0xff00 && code <= 0xff60) || (code >= 0xffe0 && code <= 0xffe6);
  return wide ? 2 : 1;
}

function clipText(text: string, width: number): string {
  const chars = Array.from(text);
  const total = chars.reduce((sum, ch) => sum + charWidth(ch.codePointAt(0) || 0), 0);
  if (total <= width) return text;

  let used = 0;
  let out = "";

  for (const ch of chars) {
    const w = charWidth(ch.codePointAt(0) || 0);
    if (used + w > width - 1) break;
    out += ch;
    used += w;
  }

  return `${out}…`;
}

function sessionMeta(info: SessionInfo): string {
  const who = info.username || (info.user === "root" ? "root" : t("Container user"));
  return [shellName(info.shell), who, info.id].filter(Boolean).join(" · ");
}

function writeBanner(info: SessionInfo) {
  if (!term) return;

  try {
    fitAddon?.fit();
  } catch {}

  const meta = sessionMeta(info);

  if (bannerShown) {
    term.write(`${brandColor(0)}⌂${SGR_RESET} ${SGR_DIM}${clipText(`${t("New Session")} · ${meta}`, Math.max(8, term.cols - 3))}${SGR_RESET}\r\n`);
    return;
  }

  bannerShown = true;

  const name = info.container && info.container !== displayName.value ? `${displayName.value} (${info.container})` : displayName.value;
  const hint = t("Commands run inside the container.");
  const title = `${SGR_BOLD}HomeDock OS${SGR_RESET} ${brandColor(0.3)}${SGR_BOLD}Terminal${SGR_RESET}`;
  const sideBySide = !isMobile.value && term.cols >= LOGO_WIDTH + BANNER_GAP + BANNER_MIN_INFO_WIDTH;

  if (!sideBySide) {
    const width = Math.max(8, term.cols - 3);
    const block = [`${brandColor(0)}⌂${SGR_RESET} ${title}`, `  ${clipText(name, width)}`, `  ${SGR_DIM}${clipText(meta, width)}${SGR_RESET}`, `  ${SGR_DIM}${clipText(hint, width)}${SGR_RESET}`];
    term.write(`\r\n${block.join("\r\n")}\r\n\r\n`);
    return;
  }

  const infoWidth = term.cols - LOGO_WIDTH - BANNER_GAP - 1;
  const details = [title, "", clipText(name, infoWidth), `${SGR_DIM}${clipText(meta, infoWidth)}${SGR_RESET}`, `${SGR_DIM}${clipText(hint, infoWidth)}${SGR_RESET}`];

  const lines = HOMEDOCK_LOGO.map((line, index) => {
    const logo = `${brandColor(index / (HOMEDOCK_LOGO.length - 1))}${line}${SGR_RESET}`;
    const extra = details[index - BANNER_INFO_ROW];
    return extra ? `${logo}${" ".repeat(LOGO_WIDTH - line.length + BANNER_GAP)}${extra}` : logo;
  });

  term.write(`\r\n${lines.join("\r\n")}\r\n\r\n`);
}

const statusDotClass = computed(() => {
  if (status.value === "connected") return themeClasses.value.appPropsDotSuccess;
  if (status.value === "connecting") return themeClasses.value.appPropsDotWarning;
  if (status.value === "error") return themeClasses.value.appPropsDotDanger;
  return themeClasses.value.appPropsDotDark;
});

const statusMessage = computed(() => {
  if (status.value === "connected" && activeShell.value) return `${displayName.value} — ${shellName(activeShell.value)}`;
  return displayName.value || t("Terminal");
});

const statusInfo = computed(() => {
  const size = termSize.value.cols ? `${termSize.value.cols}×${termSize.value.rows}` : "";

  if (status.value === "connected") {
    const who = activeUser.value === "root" ? t("Running as root") : t("Running as the container user");
    return size ? `${who} • ${size}` : who;
  }

  if (status.value === "ended") return endReason.value === "lost" ? t("Disconnected") : t("Session ended");
  if (status.value === "error") return t("Not connected");
  return "";
});

const endedMessage = computed(() => {
  if (endReason.value === "lost") return t("The connection to the container was lost.");
  if (endReason.value === "user") return t("Session ended");
  if (exitCode.value === null || exitCode.value === 0) return t("Process completed");
  return t("Process exited with code {code}", { code: exitCode.value });
});

const errorState = computed(() => {
  const name = displayName.value;
  const app = appEntry.value;

  switch (errorCode.value) {
    case "not_running":
      return {
        icon: sleepIcon,
        title: t("{name} is not running", { name }),
        text: t("Start the application to open a terminal inside its container."),
        action: app ? { label: t("Start", 2), icon: playIcon, run: () => startContainer(app, csrfToken.value, themeClasses.value.scopeSelector) } : null,
      };
    case "paused":
      return {
        icon: pauseIcon,
        title: t("{name} is paused", { name }),
        text: t("A paused container cannot run commands. Resume it to open a terminal."),
        action: app ? { label: t("Unpause"), icon: playIcon, run: () => unpauseContainer(app, csrfToken.value, themeClasses.value.scopeSelector) } : null,
      };
    case "no_shell":
      return {
        icon: shellOffIcon,
        title: t("No shell available"),
        text: t("This container image does not include a shell such as sh or bash, so there is nothing to run a terminal with. Minimal and distroless images often ship this way."),
        action: null,
      };
    case "not_found":
      return {
        icon: searchOffIcon,
        title: t("Container not found"),
        text: t("The container for this application no longer exists. It may have been removed or recreated."),
        action: null,
      };
    case "limit":
      return {
        icon: alertIcon,
        title: t("Too many terminals open"),
        text: t("Close another terminal window and try again."),
        action: null,
      };
    default:
      return {
        icon: alertIcon,
        title: t("Could not open the terminal"),
        text: t("HomeDock OS could not start a shell in this container. Check that Docker is running and try again."),
        action: null,
      };
  }
});

async function runErrorAction() {
  const action = errorState.value.action;
  if (!action || actionBusy.value) return;

  actionBusy.value = true;

  try {
    await action.run();
    await startSession();
  } finally {
    actionBusy.value = false;
  }
}

function sendBytes(data: Uint8Array<ArrayBuffer>) {
  if (socket && socket.readyState === WebSocket.OPEN && status.value === "connected") {
    socket.send(data);
  }
}

function sendText(data: string) {
  sendBytes(encoder.encode(data));
}

function sendControl(payload: Record<string, unknown>) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

function applyLatches(data: string): string {
  if (!latched.value.size) return data;

  let result = data;

  if (latched.value.has("ctrl") && data.length === 1) {
    const code = data.toUpperCase().charCodeAt(0);
    if (code >= 64 && code <= 95) result = String.fromCharCode(code - 64);
    else if (data === " ") result = "\x00";
    else if (data === "?") result = "\x7f";
  }

  if (latched.value.has("alt")) result = `\x1b${result}`;

  latched.value = new Set();
  return result;
}

function isKeyLatched(id: string): boolean {
  return latched.value.has(id as LatchKey);
}

function pressExtraKey(key: ExtraKey) {
  if (key.latch) {
    const next = new Set(latched.value);
    if (next.has(key.latch)) next.delete(key.latch);
    else next.add(key.latch);
    latched.value = next;
    term?.focus();
    return;
  }

  if (key.cursor) {
    const prefix = term?.modes.applicationCursorKeysMode ? "\x1bO" : "\x1b[";
    const modifier = latched.value.has("ctrl") ? "\x1b[1;5" : latched.value.has("alt") ? "\x1b[1;3" : "";
    latched.value = new Set();
    sendText(modifier ? `${modifier}${key.cursor}` : `${prefix}${key.cursor}`);
  } else if (key.sequence) {
    sendText(applyLatches(key.sequence));
  }

  term?.focus();
}

function handleTerminalData(data: string) {
  if (status.value === "ended" && (data === "\r" || data === "\n")) {
    startSession();
    return;
  }

  if (status.value !== "connected") return;

  sendText(applyLatches(data));
}

function handleTerminalBinary(data: string) {
  const bytes = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) bytes[i] = data.charCodeAt(i) & 0xff;
  sendBytes(bytes);
}

async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {}

  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.style.position = "fixed";
  helper.style.opacity = "0";
  document.body.appendChild(helper);
  helper.select();

  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(helper);
  }
}

async function copySelection() {
  const selection = term?.getSelection();
  if (!selection) return;

  await writeClipboard(selection);
  term?.focus();
}

async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    if (text) term?.paste(text);
  } catch {
    message.info(t("Your browser blocked clipboard access. Use {shortcut} to paste instead.", { shortcut: shortcut("V") }));
  }

  term?.focus();
}

function selectAll() {
  term?.selectAll();
  term?.focus();
}

function clearScrollback() {
  term?.clear();
  term?.focus();
}

async function openFind() {
  findVisible.value = true;

  const selection = term?.getSelection();
  if (selection && !selection.includes("\n")) findText.value = selection;

  await nextTick();
  findInputRef.value?.focus();
  findInputRef.value?.select();
}

function closeFind() {
  findVisible.value = false;
  findNoMatch.value = false;
  searchAddon?.clearDecorations();
  term?.clearSelection();
  term?.focus();
}

function findNext() {
  if (!searchAddon || !findText.value) return;
  findNoMatch.value = !searchAddon.findNext(findText.value);
}

function findPrevious() {
  if (!searchAddon || !findText.value) return;
  findNoMatch.value = !searchAddon.findPrevious(findText.value);
}

watch(findText, () => {
  findNoMatch.value = false;
  if (findText.value && searchAddon) findNoMatch.value = !searchAddon.findNext(findText.value, { incremental: true });
});

function changeFontSize(delta: number) {
  setFontSize(fontSize.value + delta);
}

function resetFontSize() {
  setFontSize(defaultFontSize);
}

function setFontSize(size: number) {
  fontSize.value = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, size));
  storeValue(FONT_SIZE_KEY, String(fontSize.value));

  if (term) {
    term.options.fontSize = fontSize.value;
    scheduleFit();
  }

  term?.focus();
}

function toggleKeyBar() {
  keyBarPreference.value = !keyBarVisible.value;
  storeValue(KEY_BAR_KEY, keyBarPreference.value ? "1" : "0");
  nextTick(scheduleFit);
}

function onMenuOpenChange(open: boolean) {
  if (open) {
    restoreFocusAfterMenu = document.activeElement === term?.textarea;
    return;
  }

  if (restoreFocusAfterMenu && !findVisible.value) {
    setTimeout(() => term?.focus(), 0);
  }
}

function chooseShell(shell: string) {
  if (shellChoice.value === shell) return;
  shellChoice.value = shell;
  startSession();
}

function chooseUser(mode: UserMode) {
  if (userMode.value === mode) return;
  userMode.value = mode;
  startSession();
}

function handleKeyEvent(event: KeyboardEvent): boolean {
  if (event.type !== "keydown") return true;

  const key = event.key.toLowerCase();
  const command = isApplePlatform ? event.metaKey && !event.ctrlKey && !event.altKey : event.ctrlKey && event.shiftKey && !event.altKey && !event.metaKey;

  if (!command) return true;

  if (key === "c") {
    if (!isApplePlatform) {
      event.preventDefault();
      copySelection();
    }
    return false;
  }

  if (key === "v") return false;

  if (key === "f") {
    event.preventDefault();
    openFind();
    return false;
  }

  if (key === "k") {
    event.preventDefault();
    clearScrollback();
    return false;
  }

  if (key === "a" && isApplePlatform) {
    event.preventDefault();
    selectAll();
    return false;
  }

  return true;
}

function scheduleFit() {
  if (fitFrame) cancelAnimationFrame(fitFrame);

  fitFrame = requestAnimationFrame(() => {
    fitFrame = 0;
    const host = terminalHost.value;
    if (!term || !fitAddon || !host || host.clientWidth === 0 || host.clientHeight === 0) return;

    try {
      fitAddon.fit();
    } catch {}
  });
}

function stopKeepalive() {
  if (keepaliveTimer) {
    clearInterval(keepaliveTimer);
    keepaliveTimer = null;
  }
}

function closeSocket() {
  stopKeepalive();

  if (socket) {
    const closing = socket;
    socket = null;
    closing.onopen = null;
    closing.onmessage = null;
    closing.onclose = null;
    closing.onerror = null;

    try {
      closing.close(1000);
    } catch {}
  }
}

function endSession() {
  if (status.value !== "connected") return;

  generation++;
  closeSocket();
  finishSession("user", null);
}

function finishSession(reason: EndReason, code: number | null) {
  if (!term) return;

  endReason.value = reason;
  exitCode.value = code;
  status.value = "ended";
  latched.value = new Set();

  const altScreen = term.buffer.active.type === "alternate" ? ALT_SCREEN_EXIT : "";
  term.write(`${altScreen}${MODE_RESET}\r\n\x1b[2m[${endedMessage.value}]\x1b[0m\r\n${CURSOR_HIDE}`);
}

function failSession(code: string) {
  closeSocket();
  errorCode.value = code;
  status.value = "error";
}

function websocketUrl(path: string, ticket: string): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${path}?ticket=${encodeURIComponent(ticket)}`;
}

async function startSession() {
  if (!term || disposed || !appName.value) return;

  const current = ++generation;

  closeSocket();
  status.value = "connecting";
  errorCode.value = "";
  exitCode.value = null;
  endReason.value = "exit";
  findNoMatch.value = false;

  scheduleFit();

  let ticket = "";
  let path = "";

  try {
    const response = await axios.post(SESSION_ENDPOINT, { containerName: appName.value, shell: shellChoice.value, user: userMode.value, cols: term.cols, rows: term.rows }, { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });

    if (current !== generation) return;

    ticket = response.data.ticket;
    path = response.data.path;
    availableShells.value = response.data.shells || [];
    activeShell.value = response.data.shell || "";
    activeUser.value = response.data.user === "root" ? "root" : "default";
  } catch (error) {
    if (current !== generation) return;

    const code = error instanceof AxiosError ? error.response?.data?.code : "";
    failSession(typeof code === "string" && code ? code : "request_failed");
    return;
  }

  let ready = false;
  let exitReported = false;
  let reportedError = "";

  const ws = new WebSocket(websocketUrl(path, ticket));
  ws.binaryType = "arraybuffer";
  socket = ws;

  ws.onmessage = (event) => {
    if (current !== generation || !term) return;

    if (typeof event.data !== "string") {
      term.write(new Uint8Array(event.data as ArrayBuffer));
      return;
    }

    let control: { type?: string; code?: unknown; shell?: string; username?: string; container?: string; id?: string } = {};

    try {
      control = JSON.parse(event.data);
    } catch {
      return;
    }

    if (control.type === "ready") {
      ready = true;
      if (control.shell) activeShell.value = control.shell;
      status.value = "connected";
      writeBanner({ shell: activeShell.value, user: activeUser.value, username: control.username || "", container: control.container || "", id: control.id || "" });
      term.write(CURSOR_SHOW);
      sendControl({ type: "resize", cols: term.cols, rows: term.rows });
      term.focus();

      stopKeepalive();
      keepaliveTimer = setInterval(() => sendControl({ type: "ping" }), KEEPALIVE_INTERVAL);
    } else if (control.type === "exit") {
      exitReported = true;
      exitCode.value = typeof control.code === "number" ? control.code : null;
    } else if (control.type === "error") {
      reportedError = typeof control.code === "string" ? control.code : "exec_failed";
    }
  };

  ws.onclose = () => {
    if (current !== generation) return;

    stopKeepalive();
    socket = null;

    if (reportedError) {
      failSession(reportedError);
    } else if (!ready) {
      failSession("connection_failed");
    } else {
      finishSession(exitReported ? "exit" : "lost", exitReported ? exitCode.value : null);
    }
  };
}

function createTerminal() {
  if (!terminalHost.value) return;

  term = new Terminal({
    allowProposedApi: true,
    allowTransparency: true,
    cursorBlink: true,
    cursorStyle: "block",
    fontFamily: '"SF Mono", SFMono-Regular, ui-monospace, Menlo, Monaco, "Cascadia Mono", Consolas, "Liberation Mono", "DejaVu Sans Mono", "Courier New", monospace',
    fontSize: fontSize.value,
    fontWeightBold: "600",
    lineHeight: 1.1,
    scrollback: 10000,
    macOptionIsMeta: false,
    macOptionClickForcesSelection: true,
    rightClickSelectsWord: isApplePlatform,
    drawBoldTextInBrightColors: true,
    smoothScrollDuration: 0,
    theme: terminalTheme.value,
  });

  fitAddon = new FitAddon();
  searchAddon = new SearchAddon();

  term.loadAddon(fitAddon);
  term.loadAddon(searchAddon);
  term.loadAddon(new Unicode11Addon());
  term.loadAddon(
    new WebLinksAddon((event, uri) => {
      event.preventDefault();
      window.open(uri, "_blank", "noopener,noreferrer");
    }),
  );

  term.unicode.activeVersion = "11";
  term.attachCustomKeyEventHandler(handleKeyEvent);
  term.onData(handleTerminalData);
  term.onBinary(handleTerminalBinary);
  term.onSelectionChange(() => {
    hasSelection.value = !!term?.hasSelection();
  });
  term.onResize(({ cols, rows }) => {
    termSize.value = { cols, rows };
    if (status.value === "connected") sendControl({ type: "resize", cols, rows });
  });

  term.open(terminalHost.value);
  termSize.value = { cols: term.cols, rows: term.rows };

  resizeObserver = new ResizeObserver(scheduleFit);
  resizeObserver.observe(terminalHost.value);

  scheduleFit();
}

watch(terminalTheme, (theme) => {
  if (term) term.options.theme = theme;
});

watch(keyBarVisible, () => nextTick(scheduleFit));

watch(
  () => appEntry.value?.status,
  (current, previous) => {
    if (status.value !== "error" || current === previous) return;
    if (current === "running" && (errorCode.value === "not_running" || errorCode.value === "paused") && !actionBusy.value) startSession();
  },
);

onMounted(async () => {
  createTerminal();
  await nextTick();

  if (!appName.value) {
    failSession("not_found");
    return;
  }

  requestAnimationFrame(() => startSession());
});

onBeforeUnmount(() => {
  disposed = true;
  generation++;
  closeSocket();

  if (fitFrame) cancelAnimationFrame(fitFrame);
  resizeObserver?.disconnect();
  resizeObserver = null;

  term?.dispose();
  term = null;
  fitAddon = null;
  searchAddon = null;
});
</script>

<style scoped>
.terminal-host :deep(.xterm) {
  height: 100%;
}

.terminal-host :deep(.xterm-viewport) {
  background-color: transparent !important;
}

.terminal-host :deep(.xterm-helper-textarea:focus) {
  outline: none !important;
  box-shadow: none !important;
}

.terminal-keybar {
  scrollbar-width: none;
}

.terminal-keybar::-webkit-scrollbar {
  display: none;
}
</style>
