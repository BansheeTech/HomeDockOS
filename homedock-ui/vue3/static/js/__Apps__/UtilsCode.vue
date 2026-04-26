<!-- homedock-ui/vue3/static/js/__Apps__/UtilsCode.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="utils-notepad flex flex-col h-full overflow-hidden">
    <div class="flex items-center gap-1 px-2 py-1.5 border-b" :class="themeClasses.utilityToolbarBorder">
      <Dropdown :trigger="['click']" placement="bottomLeft" :overlay-class-name="themeClasses.scopeSelector">
        <button :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="px-3 py-1 text-xs rounded transition-colors">File</button>
        <template #overlay>
          <Menu>
            <MenuItem key="new" @click="handleNewTab">
              <div class="flex items-center gap-2">
                <Icon :icon="fileIcon" class="w-4 h-4" />
                <span>New Tab</span>
                <span class="ml-auto text-[10px] opacity-50">Ctrl+N</span>
              </div>
            </MenuItem>
            <MenuDivider />
            <MenuItem key="save" @click="handleSave" :disabled="!activeTab?.content?.trim()">
              <div class="flex items-center gap-2">
                <Icon :icon="contentSaveIcon" class="w-4 h-4" />
                <span>Save</span>
                <span class="ml-auto text-[10px] opacity-50">Ctrl+S</span>
              </div>
            </MenuItem>
            <MenuItem key="saveas" @click="openSaveAsDialog" :disabled="!activeTab?.content?.trim()">
              <div class="flex items-center gap-2">
                <Icon :icon="contentSaveEditIcon" class="w-4 h-4" />
                <span>Save As...</span>
              </div>
            </MenuItem>
            <MenuDivider />
            <MenuItem key="closetab" @click="closeTab(activeTabId)" :disabled="tabs.length <= 1">
              <div class="flex items-center gap-2">
                <Icon :icon="closeIcon" class="w-4 h-4" />
                <span>Close Tab</span>
                <span class="ml-auto text-[10px] opacity-50">Ctrl+W</span>
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
        <button :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="px-3 py-1 text-xs rounded transition-colors">Edit</button>
        <template #overlay>
          <Menu>
            <MenuItem key="find" @click="toggleFindReplace">
              <div class="flex items-center gap-2">
                <Icon :icon="magnifyIcon" class="w-4 h-4" />
                <span>Find & Replace</span>
                <span class="ml-auto text-[10px] opacity-50">Ctrl+F</span>
              </div>
            </MenuItem>
            <MenuDivider />
            <MenuItem key="selectall" @click="selectAll">
              <div class="flex items-center gap-2">
                <Icon :icon="selectAllIcon" class="w-4 h-4" />
                <span>Select All</span>
                <span class="ml-auto text-[10px] opacity-50">Ctrl+A</span>
              </div>
            </MenuItem>
          </Menu>
        </template>
      </Dropdown>

      <Dropdown :trigger="['click']" placement="bottomLeft" :overlay-class-name="themeClasses.scopeSelector">
        <button :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="px-3 py-1 text-xs rounded transition-colors">View</button>
        <template #overlay>
          <Menu>
            <MenuItem key="zoomin" @click="zoomIn">
              <div class="flex items-center gap-2">
                <Icon :icon="magnifyPlusIcon" class="w-4 h-4" />
                <span>Zoom In</span>
                <span class="ml-auto text-[10px] opacity-50">Ctrl++</span>
              </div>
            </MenuItem>
            <MenuItem key="zoomout" @click="zoomOut">
              <div class="flex items-center gap-2">
                <Icon :icon="magnifyMinusIcon" class="w-4 h-4" />
                <span>Zoom Out</span>
                <span class="ml-auto text-[10px] opacity-50">Ctrl+-</span>
              </div>
            </MenuItem>
            <MenuDivider />
            <MenuItem key="resetzoom" @click="resetZoom">
              <div class="flex items-center gap-2">
                <Icon :icon="magnifyIcon" class="w-4 h-4" />
                <span>Reset Zoom</span>
                <span class="ml-auto text-[10px] opacity-50">Ctrl+0</span>
              </div>
            </MenuItem>
            <MenuDivider />
            <MenuItem key="wordwrap" @click="wordWrap = !wordWrap">
              <div class="flex items-center gap-2">
                <Icon :icon="wordWrap ? checkIcon : wrapIcon" class="w-4 h-4" />
                <span>Word Wrap</span>
              </div>
            </MenuItem>
          </Menu>
        </template>
      </Dropdown>
    </div>

    <div v-if="tabs.length > 1" class="flex items-center border-b overflow-x-auto" :class="themeClasses.utilityToolbarBorder">
      <div class="flex items-center min-w-0">
        <div v-for="tab in tabs" :key="tab.id" @click="activeTabId = tab.id" @auxclick.middle.prevent="tabs.length > 1 && closeTab(tab.id)" :class="['group flex items-center gap-1 px-2 py-1.5 text-xs cursor-pointer border-r transition-colors min-w-0 max-w-[160px] overflow-hidden', themeClasses.utilityToolbarBorder, activeTabId === tab.id ? 'bg-blue-500/20 border-blue-500/30' : 'hover:bg-white/5 border-transparent']" :title="getTabTooltip(tab)">
          <Icon :icon="getStorageIcon(tab)" :class="['w-3 h-3 flex-shrink-0', getStorageIconColor(tab)]" :title="getStorageLabel(tab)" />
          <span :class="[themeClasses.windowText]" class="truncate flex-1 min-w-0">{{ tab.title }}{{ tab.isModified ? " *" : "" }}</span>
          <button v-if="tabs.length > 1" @click.stop="closeTab(tab.id)" :class="[themeClasses.windowButtonBgHover]" class="p-0.5 rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 flex-shrink-0 transition-opacity">
            <Icon :icon="closeIcon" :class="['w-2.5 h-2.5', themeClasses.windowText]" />
          </button>
        </div>
      </div>
      <button @click="handleNewTab" :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="p-1.5 mx-1 rounded transition-colors flex-shrink-0" title="New Tab (Ctrl+N)">
        <Icon :icon="plusIcon" :class="['w-4 h-4 opacity-60', themeClasses.windowText]" />
      </button>
    </div>

    <Transition name="slide-down">
      <div v-if="showFindReplace" class="flex items-center gap-2 px-3 py-2 border-b" :class="themeClasses.utilityToolbarBorder">
        <input v-model="findText" type="text" placeholder="Find..." :class="[themeClasses.windowBg, themeClasses.windowText, themeClasses.windowBorder]" class="flex-1 px-2 py-1 text-xs rounded border outline-none" @keyup.enter="findNext" />
        <input v-model="replaceText" type="text" placeholder="Replace..." :class="[themeClasses.windowBg, themeClasses.windowText, themeClasses.windowBorder]" class="flex-1 px-2 py-1 text-xs rounded border outline-none" />
        <button @click="findNext" :class="[themeClasses.windowText]" class="px-2 py-1 text-xs rounded bg-blue-500/20 hover:bg-blue-500/30">Find</button>
        <button @click="replaceNext" :class="[themeClasses.windowText]" class="px-2 py-1 text-xs rounded bg-blue-500/20 hover:bg-blue-500/30">Replace</button>
        <button @click="replaceAllInTab" :class="[themeClasses.windowText]" class="px-2 py-1 text-xs rounded bg-blue-500/20 hover:bg-blue-500/30">Replace All</button>
        <button @click="showFindReplace = false" :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="p-1 rounded">
          <Icon :icon="closeIcon" class="w-4 h-4" />
        </button>
      </div>
    </Transition>

    <div class="flex-1 overflow-hidden p-2 relative" :style="hljsCssVars">
      <Transition name="lang-badge">
        <div v-if="badgeVisible" :key="badgeKey" :class="[themeClasses.notepadBadgeBg, 'pointer-events-none']" class="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-opacity">
          <Icon :icon="fileCodeIcon" :class="[themeClasses.notepadBadgeIcon]" class="w-3.5 h-3.5" />
          <span :class="[themeClasses.notepadBadgeText]" class="text-[11px] font-medium">{{ detectedLang }}</span>
        </div>
      </Transition>

      <!-- Editor -->
      <div class="relative w-full h-full">
        <textarea ref="textareaRef" v-model="activeTabContent" :class="[themeClasses.windowBorder, wordWrap ? 'whitespace-pre-wrap overflow-x-hidden' : 'whitespace-pre overflow-x-auto', 'code-active']" class="w-full h-full resize-none p-3 font-mono leading-relaxed rounded-lg border outline-none bg-transparent" :style="{ fontSize: fontSize + 'px' }" @input="handleInput" @keydown="handleKeydown" @scroll="syncCodeScroll" spellcheck="false"></textarea>
        <div v-if="activeTabContent" ref="codeEditorRef" class="notepad-code-overlay absolute inset-0 p-3 pointer-events-none rounded-lg border border-transparent" :class="wordWrap ? 'overflow-y-auto overflow-x-hidden' : 'overflow-auto'" :style="{ fontSize: fontSize + 'px', ...hljsCssVars }">
          <pre class="m-0 font-mono leading-relaxed" :class="wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre'"><code v-html="highlightedCode"></code></pre>
        </div>
      </div>
    </div>

    <StatusBar :icon="statusIcon" :message="statusMessage" :info="statusInfo">
      <template #help>
        <div class="space-y-3 max-w-sm">
          <div class="flex items-center gap-2">
            <Icon :icon="fileCodeIcon" :class="['w-5 h-5', themeClasses.statusBarIcon]" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">Code</h4>
          </div>
          <div :class="['text-[10px] md:text-xs space-y-2.5 leading-relaxed', themeClasses.statusBarInfo]">
            <p>A code editor with syntax highlighting.</p>
            <div class="space-y-1.5">
              <div class="flex items-start gap-2">
                <Icon :icon="sourceCodeIcon" class="w-3.5 h-3.5 mt-0.5 text-green-500 flex-shrink-0" />
                <p><strong>Sources:</strong> New files are saved to your Storage/Sources folder.</p>
              </div>
              <div class="flex items-start gap-2">
                <Icon :icon="cubeIcon" class="w-3.5 h-3.5 mt-0.5 text-blue-500 flex-shrink-0" />
                <p><strong>Drop Zone:</strong> Files opened from Drop Zone are saved back to their original location (encrypted).</p>
              </div>
              <div class="flex items-start gap-2">
                <Icon :icon="cubeScanIcon" class="w-3.5 h-3.5 mt-0.5 text-purple-500 flex-shrink-0" />
                <p><strong>App Drive:</strong> Files opened from App Drive are saved back to the container's storage.</p>
              </div>
              <div class="flex items-start gap-2">
                <Icon :icon="harddiskIcon" class="w-3.5 h-3.5 mt-0.5 text-orange-500 flex-shrink-0" />
                <p><strong>Disks+:</strong> Files opened from a mounted disk are saved back to that disk.</p>
              </div>
            </div>
            <p class="opacity-70">The colored icon on each tab indicates where that file will be saved.</p>
          </div>
        </div>
      </template>
    </StatusBar>

    <AppDialog v-model:visible="showSaveAsDialog" title="Save Source As" ok-text="Save" cancel-text="Cancel" @ok="handleSaveAs" @cancel="showSaveAsDialog = false">
      <div class="space-y-2">
        <input v-model="saveAsFilename" type="text" placeholder="filename.py" :class="[themeClasses.windowBg, themeClasses.windowText, themeClasses.windowBorder]" class="w-full px-3 py-2 text-sm rounded-lg border outline-none font-mono" @keyup.enter="handleSaveAs" />
        <div class="flex items-center gap-1.5">
          <Icon :icon="sourceCodeIcon" :class="['w-3 h-3', themeClasses.windowText, 'opacity-40']" />
          <span :class="['text-[11px]', themeClasses.windowText, 'opacity-40']">Saving in Storage/Sources</span>
        </div>
      </div>
    </AppDialog>

    <AppDialog v-model:visible="showCloseConfirmDialog" title="Unsaved Changes" ok-text="Close" cancel-text="Cancel" @ok="confirmCloseTab" @cancel="cancelCloseTab">
      <p :class="['text-sm', themeClasses.windowText]">
        "<strong>{{ pendingCloseTabTitle }}</strong
        >" has unsaved changes. Are you sure you want to close it?
      </p>
    </AppDialog>

    <AppDialog v-model:visible="showEncodingWarningDialog" title="Encoding Warning" ok-text="Save Anyway" cancel-text="Cancel" @ok="confirmEncodingSave" @cancel="cancelEncodingSave">
      <div :class="['text-sm space-y-2', themeClasses.windowText]">
        <p>This file contains characters that may indicate a <strong>non-UTF-8 encoding</strong> or binary content.</p>
        <p class="opacity-70">Saving this file will convert it to UTF-8, which could corrupt special characters or formatting.</p>
        <p>Are you sure you want to continue?</p>
      </div>
    </AppDialog>

    <AppDialog v-model:visible="showWindowCloseDialog" title="Unsaved Changes" :content="windowCloseDialogMessage" ok-text="Save All" cancel-text="Cancel" dismiss-text="Don't Save" type="warning" :mask-closable="false" @ok="handleSaveAllAndClose" @cancel="showWindowCloseDialog = false" @dismiss="handleDiscardAllAndClose" />
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";

import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";

import { Dropdown, Menu, MenuItem, MenuDivider } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import fileIcon from "@iconify-icons/mdi/file";
import folderIcon from "@iconify-icons/mdi/folder";
import contentSaveIcon from "@iconify-icons/mdi/content-save";
import contentSaveEditIcon from "@iconify-icons/mdi/content-save-edit";
import sourceCodeIcon from "@iconify-icons/mdi/code-braces";
import magnifyIcon from "@iconify-icons/mdi/magnify";
import magnifyPlusIcon from "@iconify-icons/mdi/magnify-plus-outline";
import magnifyMinusIcon from "@iconify-icons/mdi/magnify-minus-outline";
import selectAllIcon from "@iconify-icons/mdi/select-all";
import checkIcon from "@iconify-icons/mdi/check";
import wrapIcon from "@iconify-icons/mdi/wrap";
import closeIcon from "@iconify-icons/mdi/close";
import fileCodeIcon from "@iconify-icons/mdi/file-code";
import plusIcon from "@iconify-icons/mdi/plus";
import cubeIcon from "@iconify-icons/mdi/cube";
import cubeScanIcon from "@iconify-icons/mdi/cube-scan";
import harddiskIcon from "@iconify-icons/mdi/harddisk";
import exitIcon from "@iconify-icons/mdi/exit-to-app";

import hljs from "highlight.js/lib/core";
import python from "highlight.js/lib/languages/python";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import java from "highlight.js/lib/languages/java";
import go from "highlight.js/lib/languages/go";
import rust from "highlight.js/lib/languages/rust";
import ruby from "highlight.js/lib/languages/ruby";
import php from "highlight.js/lib/languages/php";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import csharp from "highlight.js/lib/languages/csharp";
import swift from "highlight.js/lib/languages/swift";
import kotlin from "highlight.js/lib/languages/kotlin";
import lua from "highlight.js/lib/languages/lua";
import r from "highlight.js/lib/languages/r";
import perl from "highlight.js/lib/languages/perl";
import bash from "highlight.js/lib/languages/bash";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import scss from "highlight.js/lib/languages/scss";
import less from "highlight.js/lib/languages/less";
import json from "highlight.js/lib/languages/json";
import yaml from "highlight.js/lib/languages/yaml";
import ini from "highlight.js/lib/languages/ini";
import sql from "highlight.js/lib/languages/sql";
import graphql from "highlight.js/lib/languages/graphql";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import makefile from "highlight.js/lib/languages/makefile";
import nginx from "highlight.js/lib/languages/nginx";
import apache from "highlight.js/lib/languages/apache";
import markdown from "highlight.js/lib/languages/markdown";

hljs.registerLanguage("python", python);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("java", java);
hljs.registerLanguage("go", go);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("ruby", ruby);
hljs.registerLanguage("php", php);
hljs.registerLanguage("c", c);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("csharp", csharp);
hljs.registerLanguage("swift", swift);
hljs.registerLanguage("kotlin", kotlin);
hljs.registerLanguage("lua", lua);
hljs.registerLanguage("r", r);
hljs.registerLanguage("perl", perl);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("scss", scss);
hljs.registerLanguage("less", less);
hljs.registerLanguage("json", json);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("ini", ini);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("graphql", graphql);
hljs.registerLanguage("dockerfile", dockerfile);
hljs.registerLanguage("makefile", makefile);
hljs.registerLanguage("nginx", nginx);
hljs.registerLanguage("apache", apache);
hljs.registerLanguage("markdown", markdown);

import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useWindowStore } from "../__Stores__/windowStore";
import { useDisksPlusStore } from "../__Stores__/useDisksPlusStore";

import StatusBar from "../__Components__/StatusBar.vue";
import AppDialog from "../__Components__/AppDialog.vue";

import { notifyError, notifySuccess } from "../__Components__/Notifications.vue";

interface ExternalFile {
  path: string;
  content: string;
  source: "appdrive" | "dropzone" | "storage" | "disksplus";
  container?: string;
  mountIndex?: number;
  disk?: string;
}

interface Tab {
  id: string;
  title: string;
  content: string;
  originalContent: string;
  isModified: boolean;
  originalFilename: string | null;
  externalFile: ExternalFile | null;
}

interface Props {
  _windowId?: string;
  externalFile?: ExternalFile;
  data?: {
    externalFile?: ExternalFile;
  };
}

const props = defineProps<Props>();
const { themeClasses } = useTheme();
const csrfToken = useCsrfToken();
const windowStore = useWindowStore();
const disksPlusStore = useDisksPlusStore();

function generateTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function createEmptyTab(): Tab {
  return {
    id: generateTabId(),
    title: "Untitled",
    content: "",
    originalContent: "",
    isModified: false,
    originalFilename: null,
    externalFile: null,
  };
}

const tabs = ref<Tab[]>([createEmptyTab()]);
const activeTabId = ref(tabs.value[0].id);

const activeTab = computed(() => tabs.value.find((t) => t.id === activeTabId.value) || tabs.value[0]);

const activeTabContent = computed({
  get: () => activeTab.value?.content || "",
  set: (value: string) => {
    const tab = tabs.value.find((t) => t.id === activeTabId.value);
    if (tab) {
      tab.content = value;
    }
  },
});

const textareaRef = ref<HTMLTextAreaElement | null>(null);

const showFindReplace = ref(false);
const findText = ref("");
const replaceText = ref("");

const fontSize = ref(12);
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 24;
const DEFAULT_FONT_SIZE = 12;

const wordWrap = ref(true);

const showLangBadge = ref(false);
let langBadgeTimer: ReturnType<typeof setTimeout> | null = null;
const detectedLang = computed(() => codeLanguage.value || "");

const badgeVisible = computed(() => showLangBadge.value && !!detectedLang.value);

const badgeKey = computed(() => "code-" + detectedLang.value);

function flashLangBadge() {
  if (!detectedLang.value) return;
  if (langBadgeTimer) clearTimeout(langBadgeTimer);
  showLangBadge.value = true;
  langBadgeTimer = setTimeout(() => {
    showLangBadge.value = false;
    langBadgeTimer = null;
  }, 2000);
}

const showSaveAsDialog = ref(false);
const saveAsFilename = ref("");

const showCloseConfirmDialog = ref(false);
const pendingCloseTabId = ref<string | null>(null);
const pendingCloseTabTitle = ref("");

const showEncodingWarningDialog = ref(false);
const pendingSaveAction = ref<(() => Promise<void>) | null>(null);

const showWindowCloseDialog = ref(false);

const codeEditorRef = ref<HTMLElement | null>(null);

const CODE_EXTS: Record<string, string> = {
  py: "python",
  js: "javascript",
  ts: "typescript",
  jsx: "javascript",
  tsx: "typescript",
  mjs: "javascript",
  cjs: "javascript",
  java: "java",
  go: "go",
  rs: "rust",
  rb: "ruby",
  php: "php",
  c: "c",
  cpp: "cpp",
  cs: "csharp",
  swift: "swift",
  kt: "kotlin",
  lua: "lua",
  r: "r",
  pl: "perl",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  fish: "bash",
  html: "xml",
  htm: "xml",
  xml: "xml",
  svg: "xml",
  xhtml: "xml",
  css: "css",
  scss: "scss",
  less: "less",
  sass: "css",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  toml: "ini",
  ini: "ini",
  sql: "sql",
  graphql: "graphql",
  dockerfile: "dockerfile",
  makefile: "makefile",
  conf: "nginx",
  nginx: "nginx",
  apache: "apache",
};

function getFileExtension(tab: Tab): string {
  const name = tab.externalFile?.path || tab.originalFilename || tab.title;
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

const codeLanguage = computed(() => CODE_EXTS[getFileExtension(activeTab.value)] || "");

const highlightedCode = computed(() => {
  const content = activeTab.value?.content || "";
  if (!content) return "";
  const lang = codeLanguage.value;
  let result: string;
  if (lang && hljs.getLanguage(lang)) {
    result = hljs.highlight(content, { language: lang }).value;
  } else {
    result = hljs.highlightAuto(content).value;
  }
  if (content.endsWith("\n")) {
    result += " ";
  }
  return result;
});

const hljsCssVars = computed(() => ({
  "--hljs-base": themeClasses.value.notepadHljsBase,
  "--hljs-keyword": themeClasses.value.notepadHljsKeyword,
  "--hljs-string": themeClasses.value.notepadHljsString,
  "--hljs-number": themeClasses.value.notepadHljsNumber,
  "--hljs-comment": themeClasses.value.notepadHljsComment,
  "--hljs-function": themeClasses.value.notepadHljsFunction,
  "--hljs-title": themeClasses.value.notepadHljsTitle,
  "--hljs-params": themeClasses.value.notepadHljsParams,
  "--hljs-built-in": themeClasses.value.notepadHljsBuiltIn,
  "--hljs-type": themeClasses.value.notepadHljsType,
  "--hljs-literal": themeClasses.value.notepadHljsLiteral,
  "--hljs-attr": themeClasses.value.notepadHljsAttr,
  "--hljs-variable": themeClasses.value.notepadHljsVariable,
  "--hljs-tag": themeClasses.value.notepadHljsTag,
  "--hljs-name": themeClasses.value.notepadHljsName,
  "--hljs-attribute": themeClasses.value.notepadHljsAttribute,
  "--hljs-selector": themeClasses.value.notepadHljsSelector,
  "--hljs-regexp": themeClasses.value.notepadHljsRegexp,
  "--hljs-meta": themeClasses.value.notepadHljsMeta,
  "--hljs-operator": themeClasses.value.notepadHljsOperator,
  "--hljs-property": themeClasses.value.notepadHljsProperty,
  "--notepad-caret": themeClasses.value.notepadCaret,
}));

const lineCount = computed(() => (activeTab.value?.content || "").split("\n").length);
const wordCount = computed(() => {
  const text = (activeTab.value?.content || "").trim();
  if (!text) return 0;
  return text.split(/\s+/).length;
});
const charCount = computed(() => (activeTab.value?.content || "").length);

const statusIcon = computed(() => {
  const tab = activeTab.value;
  if (tab?.externalFile) {
    if (tab.externalFile.source === "appdrive") return cubeScanIcon;
    if (tab.externalFile.source === "storage") return folderIcon;
    if (tab.externalFile.source === "disksplus") return harddiskIcon;
    return cubeIcon; // dropzone
  }
  return sourceCodeIcon;
});
const statusMessage = computed(() => {
  const tab = activeTab.value;
  if (tab?.externalFile) {
    if (tab.externalFile.source === "appdrive") return "Editing on App Drive";
    if (tab.externalFile.source === "storage") return "Editing on Storage";
    if (tab.externalFile.source === "disksplus") return "Editing on Disks+";
    return "Editing on Drop Zone";
  }
  return "Editing in Sources";
});
const statusInfo = computed(() => `Ln ${lineCount.value} | Words ${wordCount.value} | ${charCount.value} chars`);

const windowCloseDialogMessage = computed(() => {
  const unsavedTabs = tabs.value.filter((t) => t.isModified);
  if (unsavedTabs.length === 1) {
    return `"${unsavedTabs[0].title}" has unsaved changes. Do you want to save before closing?`;
  }
  return `${unsavedTabs.length} files have unsaved changes. Do you want to save all before closing?`;
});

function getStorageIcon(tab: Tab) {
  if (!tab.externalFile) return sourceCodeIcon;
  if (tab.externalFile.source === "appdrive") return cubeScanIcon;
  if (tab.externalFile.source === "storage") return folderIcon;
  if (tab.externalFile.source === "disksplus") return harddiskIcon;
  return cubeIcon;
}

function getStorageIconColor(tab: Tab): string {
  if (!tab.externalFile) return "text-green-500";
  if (tab.externalFile.source === "appdrive") return "text-purple-500";
  if (tab.externalFile.source === "storage") return "text-green-500";
  if (tab.externalFile.source === "disksplus") return "text-orange-500";
  return "text-blue-500";
}

function getStorageLabel(tab: Tab): string {
  if (!tab.externalFile) return "Sources";
  if (tab.externalFile.source === "appdrive") return "App Drive";
  if (tab.externalFile.source === "storage") return "Storage";
  if (tab.externalFile.source === "disksplus") return "Disks+";
  return "Drop Zone";
}

function getTabTooltip(tab: Tab): string {
  if (!tab.externalFile) {
    const path = tab.originalFilename ? `Sources/${tab.originalFilename}` : "Not saved yet";
    return `${tab.title}\nPath: ${path}\nSaved to: Sources`;
  }
  const sourceNames: Record<string, string> = {
    appdrive: "App Drive",
    storage: "Storage",
    dropzone: "Drop Zone",
    disksplus: "Disks+",
  };
  const source = sourceNames[tab.externalFile.source] || "Unknown";
  return `${tab.title}\nPath: ${tab.externalFile.path}\nSaved to: ${source}`;
}

function hasEncodingIssues(content: string): boolean {
  if (content.includes("\uFFFD")) return true;
  if (content.includes("\u0000")) return true;
  const controlChars = content.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g);
  if (controlChars && controlChars.length > content.length * 0.01) return true;
  return false;
}

async function confirmEncodingSave() {
  showEncodingWarningDialog.value = false;
  if (pendingSaveAction.value) {
    await pendingSaveAction.value();
    pendingSaveAction.value = null;
  }
}

function cancelEncodingSave() {
  showEncodingWarningDialog.value = false;
  pendingSaveAction.value = null;
}

function updateWindowTitle() {
  if (!props._windowId) return;
  const tab = activeTab.value;
  if (!tab) return;

  const hasModified = tabs.value.some((t) => t.isModified);
  const title = tab.title + (hasModified ? " *" : "");
  windowStore.updateWindowTitle(props._windowId, `Code - ${title}`);
}

watch([activeTabId, () => activeTab.value?.title, () => activeTab.value?.isModified], updateWindowTitle);

function handleInput() {
  const tab = activeTab.value;
  if (tab) {
    tab.isModified = tab.content !== tab.originalContent;
  }
}

function syncCodeScroll() {
  if (textareaRef.value && codeEditorRef.value) {
    codeEditorRef.value.scrollTop = textareaRef.value.scrollTop;
    codeEditorRef.value.scrollLeft = textareaRef.value.scrollLeft;
  }
}

function handleNewTab() {
  const newTab = createEmptyTab();
  tabs.value.push(newTab);
  activeTabId.value = newTab.id;
}

function closeTab(tabId: string) {
  const tab = tabs.value.find((t) => t.id === tabId);
  if (!tab) return;

  if (tabs.value.length <= 1) return;

  if (tab.isModified) {
    pendingCloseTabId.value = tabId;
    pendingCloseTabTitle.value = tab.title;
    showCloseConfirmDialog.value = true;
    return;
  }

  performCloseTab(tabId);
}

function performCloseTab(tabId: string) {
  const index = tabs.value.findIndex((t) => t.id === tabId);
  if (index === -1) return;

  tabs.value.splice(index, 1);

  if (activeTabId.value === tabId) {
    activeTabId.value = tabs.value[Math.max(0, index - 1)].id;
  }
}

function confirmCloseTab() {
  if (pendingCloseTabId.value) {
    performCloseTab(pendingCloseTabId.value);
  }
  showCloseConfirmDialog.value = false;
  pendingCloseTabId.value = null;
  pendingCloseTabTitle.value = "";
}

function cancelCloseTab() {
  showCloseConfirmDialog.value = false;
  pendingCloseTabId.value = null;
  pendingCloseTabTitle.value = "";
}

async function handleSave() {
  const tab = activeTab.value;
  if (!tab) return;

  if (hasEncodingIssues(tab.content)) {
    pendingSaveAction.value = performSave;
    showEncodingWarningDialog.value = true;
    return;
  }

  await performSave();
}

async function performSave() {
  const tab = activeTab.value;
  if (!tab) return;

  if (tab.externalFile) {
    await handleSaveToExternal();
    return;
  }

  if (!tab.originalFilename) {
    openSaveAsDialog();
    return;
  }

  await saveSourceToStorage(tab);
}

function openSaveAsDialog() {
  const tab = activeTab.value;
  if (!tab) return;
  saveAsFilename.value = tab.originalFilename || (tab.title !== "Untitled" ? tab.title : "");
  showSaveAsDialog.value = true;
}

function sanitizeFilename(title: string): string {
  const dangerous = ["<", ">", ":", '"', "|", "?", "*", "&", "/", "\\"];
  let safe = title.trim();
  for (const char of dangerous) {
    safe = safe.split(char).join("-");
  }
  safe = safe.replace(/^[\.\s]+|[\.\s]+$/g, "");
  if (safe.length > 250) safe = safe.substring(0, 250);
  if (!safe) safe = "Untitled";
  return safe;
}

async function ensureSourcesFolderExists() {
  try {
    await axios.get("/api/storage/files", {
      params: { path: "Sources" },
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });
  } catch (error: any) {
    if (error.response?.status === 404) {
      await axios.post("/api/storage/create-folder", { name: "Sources", path: "" }, { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });
    } else {
      throw error;
    }
  }
}

async function checkFileExists(path: string): Promise<boolean> {
  try {
    await axios.get("/api/storage/download", {
      params: { file: path },
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      responseType: "blob",
    });
    return true;
  } catch {
    return false;
  }
}

async function saveSourceToStorage(tab: Tab) {
  try {
    const filename = tab.originalFilename || sanitizeFilename(tab.title);
    await ensureSourcesFolderExists();

    const formData = new FormData();
    const blob = new Blob([tab.content], { type: "text/plain" });
    formData.append("file", blob, filename);
    formData.append("path", "Sources");

    await axios.post("/api/storage/upload", formData, {
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });

    tab.originalContent = tab.content;
    tab.isModified = false;
    tab.originalFilename = filename;
    notifySuccess("Source saved", `Saved to Sources/${filename}`, themeClasses.value.scopeSelector);
  } catch (error: any) {
    notifyError(error.response?.data?.error || "Failed to save source");
  }
}

async function handleSaveAs() {
  const tab = activeTab.value;
  if (!tab) return;

  if (hasEncodingIssues(tab.content)) {
    showSaveAsDialog.value = false;
    pendingSaveAction.value = performSaveAs;
    showEncodingWarningDialog.value = true;
    return;
  }

  await performSaveAs();
}

async function performSaveAs() {
  const tab = activeTab.value;
  if (!tab) return;

  const rawFilename = saveAsFilename.value.trim() || "Untitled";
  const filename = sanitizeFilename(rawFilename);

  try {
    await ensureSourcesFolderExists();

    let finalFilename = filename;
    let counter = 1;
    while (await checkFileExists(`Sources/${finalFilename}`)) {
      const dot = filename.lastIndexOf(".");
      if (dot > 0) {
        finalFilename = `${filename.substring(0, dot)} (${counter})${filename.substring(dot)}`;
      } else {
        finalFilename = `${filename} (${counter})`;
      }
      counter++;
      if (counter > 100) {
        notifyError("Too many files with this name");
        return;
      }
    }

    const formData = new FormData();
    const blob = new Blob([tab.content], { type: "text/plain" });
    formData.append("file", blob, finalFilename);
    formData.append("path", "Sources");

    await axios.post("/api/storage/upload", formData, {
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });

    tab.title = finalFilename;
    tab.originalContent = tab.content;
    tab.isModified = false;
    tab.originalFilename = finalFilename;
    tab.externalFile = null;
    showSaveAsDialog.value = false;
    notifySuccess("Source saved", `Saved to Sources/${finalFilename}`, themeClasses.value.scopeSelector);
  } catch (error: any) {
    notifyError(error.response?.data?.error || "Failed to save source");
  }
}

async function autoSaveNewSource(tab: Tab) {
  const title = tab.title !== "Untitled" ? tab.title : `source-${new Date().toISOString().replace(/[/:]/g, "-").slice(0, 19)}.txt`;
  const filename = sanitizeFilename(title);

  try {
    await ensureSourcesFolderExists();

    let finalFilename = filename;
    let counter = 1;
    while (await checkFileExists(`Sources/${finalFilename}`)) {
      const dot = filename.lastIndexOf(".");
      if (dot > 0) {
        finalFilename = `${filename.substring(0, dot)} (${counter})${filename.substring(dot)}`;
      } else {
        finalFilename = `${filename} (${counter})`;
      }
      counter++;
      if (counter > 100) throw new Error("Too many files with this name");
    }

    const formData = new FormData();
    const blob = new Blob([tab.content], { type: "text/plain" });
    formData.append("file", blob, finalFilename);
    formData.append("path", "Sources");

    await axios.post("/api/storage/upload", formData, {
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });

    tab.title = finalFilename;
    tab.originalContent = tab.content;
    tab.isModified = false;
    tab.originalFilename = finalFilename;
    notifySuccess("Source saved", `Saved to Sources/${finalFilename}`, themeClasses.value.scopeSelector);
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || "Failed to save source");
  }
}

async function handleSaveToExternal() {
  const tab = activeTab.value;
  if (!tab?.externalFile) return;

  try {
    const ext = tab.externalFile;

    if (ext.source === "storage") {
      const formData = new FormData();
      const blob = new Blob([tab.content], { type: "text/plain" });
      formData.append("file", blob, ext.path.split("/").pop() || "file.txt");

      const pathParts = ext.path.split("/");
      pathParts.pop();
      if (pathParts.length > 0) {
        formData.append("path", pathParts.join("/"));
      }

      await axios.post("/api/storage/upload", formData, {
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      });
    } else if (ext.source === "dropzone") {
      const formData = new FormData();
      const blob = new Blob([tab.content], { type: "text/plain" });
      formData.append("file", blob, ext.path.split("/").pop() || "file.txt");

      const pathParts = ext.path.split("/");
      pathParts.pop();
      if (pathParts.length > 0) {
        formData.append("path", pathParts.join("/"));
      }

      await axios.post("/api/dropzone/upload", formData, {
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      });
    } else if (ext.source === "appdrive") {
      const formData = new FormData();
      const blob = new Blob([tab.content], { type: "text/plain" });
      formData.append("file", blob, ext.path.split("/").pop() || "file.txt");
      formData.append("container", ext.container || "");
      formData.append("mount", String(ext.mountIndex ?? 0));

      const pathParts = ext.path.split("/");
      pathParts.pop();
      if (pathParts.length > 0) {
        formData.append("path", pathParts.join("/"));
      }

      await axios.post("/api/appdrive/upload", formData, {
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      });
    } else if (ext.source === "disksplus") {
      if (!ext.disk) {
        notifyError("Disks+ save failed: missing disk id");
        return;
      }
      const formData = new FormData();
      const blob = new Blob([tab.content], { type: "text/plain" });
      formData.append("file", blob, ext.path.split("/").pop() || "file.txt");
      formData.append("disk", ext.disk);

      const pathParts = ext.path.split("/");
      pathParts.pop();
      if (pathParts.length > 0) {
        formData.append("path", pathParts.join("/"));
      }

      await axios.post("/api/disksplus/upload", formData, {
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      });
      disksPlusStore.slideSession();
    }

    tab.originalContent = tab.content;
    tab.isModified = false;
    const sourceNames: Record<string, string> = {
      appdrive: "App Drive",
      storage: "Storage",
      dropzone: "Drop Zone",
      disksplus: "Disks+",
    };
    const storageName = sourceNames[ext.source] || "Unknown";
    notifySuccess("File saved", `Saved to ${storageName}: ${ext.path}`, themeClasses.value.scopeSelector);
  } catch (error: any) {
    notifyError(error.response?.data?.error || "Failed to save file");
  }
}

function toggleFindReplace() {
  showFindReplace.value = !showFindReplace.value;
  if (showFindReplace.value) {
    const selection = window.getSelection()?.toString();
    if (selection) {
      findText.value = selection;
    }
  }
}

function findNext() {
  if (!findText.value || !textareaRef.value) return;

  const textarea = textareaRef.value;
  const text = activeTabContent.value;
  const searchStart = textarea.selectionEnd;
  let index = text.indexOf(findText.value, searchStart);

  if (index === -1) {
    index = text.indexOf(findText.value);
  }

  if (index !== -1) {
    textarea.focus();
    textarea.setSelectionRange(index, index + findText.value.length);
  }
}

function replaceNext() {
  if (!findText.value || !textareaRef.value) return;

  const textarea = textareaRef.value;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = activeTabContent.value.substring(start, end);

  if (selectedText === findText.value) {
    activeTabContent.value = activeTabContent.value.substring(0, start) + replaceText.value + activeTabContent.value.substring(end);
    textarea.setSelectionRange(start, start + replaceText.value.length);
    handleInput();
  }

  findNext();
}

function replaceAllInTab() {
  if (!findText.value) return;

  const count = (activeTabContent.value.match(new RegExp(escapeRegex(findText.value), "g")) || []).length;
  activeTabContent.value = activeTabContent.value.split(findText.value).join(replaceText.value);
  handleInput();
  notifySuccess("Replace all", `Replaced ${count} occurrences`, themeClasses.value.scopeSelector);
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function selectAll() {
  textareaRef.value?.select();
}

function zoomIn() {
  if (fontSize.value < MAX_FONT_SIZE) {
    fontSize.value = Math.min(fontSize.value + 2, MAX_FONT_SIZE);
  }
}

function zoomOut() {
  if (fontSize.value > MIN_FONT_SIZE) {
    fontSize.value = Math.max(fontSize.value - 2, MIN_FONT_SIZE);
  }
}

function resetZoom() {
  fontSize.value = DEFAULT_FONT_SIZE;
}

function handleKeydown(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
      case "s":
        e.preventDefault();
        handleSave();
        break;
      case "n":
        e.preventDefault();
        handleNewTab();
        break;
      case "f":
        e.preventDefault();
        toggleFindReplace();
        break;
      case "w":
        e.preventDefault();
        if (tabs.value.length > 1) {
          closeTab(activeTabId.value);
        }
        break;
      case "=":
      case "+":
        e.preventDefault();
        zoomIn();
        break;
      case "-":
        e.preventDefault();
        zoomOut();
        break;
      case "0":
        e.preventDefault();
        resetZoom();
        break;
    }
  }
}

watch(activeTabId, () => {
  nextTick(() => {
    flashLangBadge();
  });
});

function openExternalFileAsTab(extFile: ExternalFile) {
  const fileName = extFile.path.split("/").pop() || "File";

  const existingTab = tabs.value.find((t) => t.externalFile?.path === extFile.path && t.externalFile?.source === extFile.source);

  if (existingTab) {
    activeTabId.value = existingTab.id;
    return;
  }

  const newTab: Tab = {
    id: generateTabId(),
    title: fileName,
    content: extFile.content,
    originalContent: extFile.content,
    isModified: false,
    originalFilename: null,
    externalFile: extFile,
  };

  tabs.value.push(newTab);
  activeTabId.value = newTab.id;
}

function handleIncomingFile(event: CustomEvent) {
  const data = event.detail;
  if (data?.externalFile) {
    openExternalFileAsTab(data.externalFile);
  }
}

function handleWindowCloseRequest(e: Event) {
  const hasUnsavedChanges = tabs.value.some((t) => t.isModified);
  if (hasUnsavedChanges) {
    e.preventDefault();
    showWindowCloseDialog.value = true;
  }
}

async function handleSaveAllAndClose() {
  showWindowCloseDialog.value = false;

  const modifiedTabs = tabs.value.filter((t) => t.isModified);
  for (const tab of modifiedTabs) {
    activeTabId.value = tab.id;

    try {
      if (tab.externalFile) {
        await handleSaveToExternal();
      } else if (!tab.originalFilename) {
        await autoSaveNewSource(tab);
      } else {
        await saveSourceToStorage(tab);
      }
    } catch (error) {
      console.error("Failed to save tab:", tab.title, error);
      notifyError("Failed to save: " + tab.title);
      return;
    }
  }

  if (props._windowId) {
    windowStore.closeWindow(props._windowId);
  }
}

function handleDiscardAllAndClose() {
  showWindowCloseDialog.value = false;
  if (props._windowId) {
    windowStore.closeWindow(props._windowId);
  }
}

function handleExit() {
  if (!props._windowId) return;

  const hasUnsavedChanges = tabs.value.some((t) => t.isModified);
  if (hasUnsavedChanges) {
    showWindowCloseDialog.value = true;
  } else {
    windowStore.closeWindow(props._windowId);
  }
}

onMounted(() => {
  const extFile = props.externalFile || props.data?.externalFile;

  if (extFile) {
    const tab = tabs.value[0];
    tab.externalFile = extFile;
    tab.content = extFile.content;
    tab.originalContent = extFile.content;
    tab.title = extFile.path.split("/").pop() || "File";
  }

  updateWindowTitle();
  nextTick(() => {
    flashLangBadge();
  });

  if (props._windowId) {
    window.addEventListener(`homedock:open-file-${props._windowId}`, handleIncomingFile as EventListener);
    window.addEventListener(`homedock:request-close-${props._windowId}`, handleWindowCloseRequest);
  }
});

onUnmounted(() => {
  if (langBadgeTimer) clearTimeout(langBadgeTimer);
  if (props._windowId) {
    window.removeEventListener(`homedock:open-file-${props._windowId}`, handleIncomingFile as EventListener);
    window.removeEventListener(`homedock:request-close-${props._windowId}`, handleWindowCloseRequest);
  }
});
</script>

<style scoped>
.utils-notepad {
  background: inherit;
}

.utils-notepad textarea,
.utils-notepad .notepad-code-overlay pre,
.utils-notepad .notepad-code-overlay code {
  font-family: Menlo, Consolas, "DejaVu Sans Mono", "Liberation Mono", monospace !important;
  line-height: 1.625 !important;
  letter-spacing: 0 !important;
  word-spacing: 0 !important;
  tab-size: 4 !important;
  -moz-tab-size: 4 !important;
  word-break: break-all !important;
  overflow-wrap: break-word !important;
}

.utils-notepad textarea::-webkit-scrollbar {
  cursor: default;
}

.utils-notepad textarea::-webkit-scrollbar-thumb {
  cursor: default;
}

.utils-notepad textarea::-webkit-scrollbar-track {
  cursor: default;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.lang-badge-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.lang-badge-leave-active {
  transition: all 0.3s ease-out;
}

.lang-badge-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.9);
}

.lang-badge-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.notepad-code-overlay {
  color: var(--hljs-base, #d4d4d4);
  caret-color: transparent;
}

.notepad-code-overlay pre,
.notepad-code-overlay code {
  background: transparent !important;
  color: var(--hljs-base, #d4d4d4);
  font-family: inherit;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
}

.utils-notepad textarea.code-active {
  color: transparent;
  caret-color: var(--notepad-caret, #e5e7eb);
}

/* highlight.js theme-aware colors via CSS variables */
.notepad-code-overlay :deep(.hljs-keyword) {
  color: var(--hljs-keyword);
}
.notepad-code-overlay :deep(.hljs-string) {
  color: var(--hljs-string);
}
.notepad-code-overlay :deep(.hljs-number) {
  color: var(--hljs-number);
}
.notepad-code-overlay :deep(.hljs-comment) {
  color: var(--hljs-comment);
  font-style: italic;
}
.notepad-code-overlay :deep(.hljs-function) {
  color: var(--hljs-function);
}
.notepad-code-overlay :deep(.hljs-title) {
  color: var(--hljs-title);
}
.notepad-code-overlay :deep(.hljs-params) {
  color: var(--hljs-params);
}
.notepad-code-overlay :deep(.hljs-built_in) {
  color: var(--hljs-built-in);
}
.notepad-code-overlay :deep(.hljs-type) {
  color: var(--hljs-type);
}
.notepad-code-overlay :deep(.hljs-literal) {
  color: var(--hljs-literal);
}
.notepad-code-overlay :deep(.hljs-attr) {
  color: var(--hljs-attr);
}
.notepad-code-overlay :deep(.hljs-variable),
.notepad-code-overlay :deep(.hljs-template-variable) {
  color: var(--hljs-variable);
}
.notepad-code-overlay :deep(.hljs-tag) {
  color: var(--hljs-tag);
}
.notepad-code-overlay :deep(.hljs-name) {
  color: var(--hljs-name);
}
.notepad-code-overlay :deep(.hljs-attribute) {
  color: var(--hljs-attribute);
}
.notepad-code-overlay :deep(.hljs-selector-tag),
.notepad-code-overlay :deep(.hljs-selector-class),
.notepad-code-overlay :deep(.hljs-selector-id) {
  color: var(--hljs-selector);
}
.notepad-code-overlay :deep(.hljs-regexp) {
  color: var(--hljs-regexp);
}
.notepad-code-overlay :deep(.hljs-meta),
.notepad-code-overlay :deep(.hljs-meta .hljs-keyword) {
  color: var(--hljs-meta);
}
.notepad-code-overlay :deep(.hljs-symbol) {
  color: var(--hljs-number);
}
.notepad-code-overlay :deep(.hljs-operator),
.notepad-code-overlay :deep(.hljs-punctuation) {
  color: var(--hljs-operator);
}
.notepad-code-overlay :deep(.hljs-property) {
  color: var(--hljs-property);
}
.notepad-code-overlay :deep(.hljs-decorator) {
  color: var(--hljs-function);
}
.notepad-code-overlay :deep(.hljs-doctag) {
  color: var(--hljs-comment);
}
.notepad-code-overlay :deep(.hljs-section) {
  color: var(--hljs-title);
}
</style>
