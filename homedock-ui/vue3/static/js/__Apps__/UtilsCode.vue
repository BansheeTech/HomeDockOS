<!-- homedock-ui/vue3/static/js/__Apps__/UtilsCode.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="utils-notepad flex flex-col h-full overflow-hidden">
    <div class="flex items-center gap-1 px-2 py-1.5 border-b" :class="themeClasses.utilityToolbarBorder">
      <Dropdown :trigger="['click']" placement="bottomLeft" :overlay-class-name="themeClasses.scopeSelector">
        <button :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="px-3 py-1 text-xs rounded transition-colors">{{ $t("File") }}</button>
        <template #overlay>
          <Menu>
            <MenuItem key="new" @click="handleNewTab">
              <div class="flex items-center gap-2">
                <Icon :icon="fileIcon" class="w-4 h-4" />
                <span>{{ $t("New Tab") }}</span>
                <span class="ml-auto text-[10px] opacity-50">Ctrl+N</span>
              </div>
            </MenuItem>
            <MenuItem key="open" @click="showOpenDialog = true">
              <div class="flex items-center gap-2">
                <Icon :icon="folderOpenIcon" class="w-4 h-4" />
                <span>{{ $t("Open...") }}</span>
                <span class="ml-auto text-[10px] opacity-50">Ctrl+O</span>
              </div>
            </MenuItem>
            <MenuDivider />
            <MenuItem key="save" @click="handleSave" :disabled="!hasText">
              <div class="flex items-center gap-2">
                <Icon :icon="contentSaveIcon" class="w-4 h-4" />
                <span>{{ $t("Save") }}</span>
                <span class="ml-auto text-[10px] opacity-50">Ctrl+S</span>
              </div>
            </MenuItem>
            <MenuItem key="saveas" @click="openSaveAsDialog" :disabled="!hasText">
              <div class="flex items-center gap-2">
                <Icon :icon="contentSaveEditIcon" class="w-4 h-4" />
                <span>{{ $t("Save As...") }}</span>
              </div>
            </MenuItem>
            <MenuDivider />
            <MenuItem key="closetab" @click="closeTab(activeTabId)" :disabled="tabs.length <= 1">
              <div class="flex items-center gap-2">
                <Icon :icon="closeIcon" class="w-4 h-4" />
                <span>{{ $t("Close Tab") }}</span>
                <span class="ml-auto text-[10px] opacity-50">Ctrl+W</span>
              </div>
            </MenuItem>
            <MenuDivider />
            <MenuItem key="exit" @click="handleExit">
              <div class="flex items-center gap-2">
                <Icon :icon="exitIcon" class="w-4 h-4" />
                <span>{{ $t("Exit") }}</span>
              </div>
            </MenuItem>
          </Menu>
        </template>
      </Dropdown>

      <Dropdown :trigger="['click']" placement="bottomLeft" :overlay-class-name="themeClasses.scopeSelector">
        <button :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="px-3 py-1 text-xs rounded transition-colors">{{ $t("Edit") }}</button>
        <template #overlay>
          <Menu>
            <MenuItem key="find" @click="toggleFindReplace">
              <div class="flex items-center gap-2">
                <Icon :icon="magnifyIcon" class="w-4 h-4" />
                <span>{{ $t("Find & Replace") }}</span>
                <span class="ml-auto text-[10px] opacity-50">Ctrl+F</span>
              </div>
            </MenuItem>
            <MenuDivider />
            <MenuItem key="selectall" @click="selectAll">
              <div class="flex items-center gap-2">
                <Icon :icon="selectAllIcon" class="w-4 h-4" />
                <span>{{ $t("Select All") }}</span>
                <span class="ml-auto text-[10px] opacity-50">Ctrl+A</span>
              </div>
            </MenuItem>
          </Menu>
        </template>
      </Dropdown>

      <Dropdown :trigger="['click']" placement="bottomLeft" :overlay-class-name="themeClasses.scopeSelector">
        <button :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="px-3 py-1 text-xs rounded transition-colors">{{ $t("View") }}</button>
        <template #overlay>
          <Menu>
            <MenuItem key="zoomin" @click="zoomIn">
              <div class="flex items-center gap-2">
                <Icon :icon="magnifyPlusIcon" class="w-4 h-4" />
                <span>{{ $t("Zoom In") }}</span>
                <span class="ml-auto text-[10px] opacity-50">Ctrl++</span>
              </div>
            </MenuItem>
            <MenuItem key="zoomout" @click="zoomOut">
              <div class="flex items-center gap-2">
                <Icon :icon="magnifyMinusIcon" class="w-4 h-4" />
                <span>{{ $t("Zoom Out") }}</span>
                <span class="ml-auto text-[10px] opacity-50">Ctrl+-</span>
              </div>
            </MenuItem>
            <MenuDivider />
            <MenuItem key="resetzoom" @click="resetZoom">
              <div class="flex items-center gap-2">
                <Icon :icon="magnifyIcon" class="w-4 h-4" />
                <span>{{ $t("Reset Zoom") }}</span>
                <span class="ml-auto text-[10px] opacity-50">Ctrl+0</span>
              </div>
            </MenuItem>
            <MenuDivider />
            <MenuItem key="wordwrap" @click="wordWrap = !wordWrap">
              <div class="flex items-center gap-2">
                <Icon :icon="wordWrap ? checkIcon : wrapIcon" class="w-4 h-4" />
                <span>{{ $t("Word Wrap") }}</span>
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
          <span :class="[themeClasses.windowText]" class="truncate flex-1 min-w-0">{{ $t(tab.title) }}{{ tab.isModified ? " *" : "" }}</span>
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
        <input v-model="findText" type="text" :placeholder="$t('Find...')" :class="[themeClasses.windowInputBg, themeClasses.windowText, themeClasses.windowBorder]" class="flex-1 px-2 py-1 text-xs rounded border outline-none" @keyup.enter="findNext" />
        <input v-model="replaceText" type="text" :placeholder="$t('Replace...')" :class="[themeClasses.windowInputBg, themeClasses.windowText, themeClasses.windowBorder]" class="flex-1 px-2 py-1 text-xs rounded border outline-none" />
        <button @click="findNext" :class="[themeClasses.windowText]" class="px-2 py-1 text-xs rounded bg-blue-500/20 hover:bg-blue-500/30">{{ $t("Find") }}</button>
        <button @click="replaceNext" :class="[themeClasses.windowText]" class="px-2 py-1 text-xs rounded bg-blue-500/20 hover:bg-blue-500/30">{{ $t("Replace") }}</button>
        <button @click="replaceAllInTab" :class="[themeClasses.windowText]" class="px-2 py-1 text-xs rounded bg-blue-500/20 hover:bg-blue-500/30">{{ $t("Replace All") }}</button>
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
      <div :class="[themeClasses.windowBorder]" class="code-surface relative w-full h-full rounded-lg border overflow-hidden" @keydown.capture="handleKeydown">
        <CodeMirrorEditor ref="editorRef" :state-key="activeTabId" :load-state="loadState" :wrap="wordWrap" :font-size="fontSize" :language="languageExtension" monospace @update="handleEditorUpdate" />
      </div>
    </div>

    <StatusBar :icon="statusIcon" :message="statusMessage" :info="statusInfo">
      <template #help>
        <div class="space-y-3 max-w-sm">
          <div class="flex items-center gap-2">
            <StatusBarHelpIcon :icon="fileCodeIcon" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">{{ $t("Code") }}</h4>
          </div>
          <div :class="['text-[10px] md:text-xs space-y-2.5 leading-relaxed', themeClasses.statusBarInfo]">
            <p>{{ $t("A code editor with syntax highlighting.") }}</p>
            <div class="space-y-1.5">
              <div class="flex items-start gap-2">
                <Icon :icon="sourceCodeIcon" class="w-3.5 h-3.5 mt-0.5 text-green-500 flex-shrink-0" />
                <p>
                  <strong>{{ $t("Sources:") }}</strong> {{ $t("New files are saved to your Storage/Sources folder.") }}
                </p>
              </div>
              <div class="flex items-start gap-2">
                <Icon :icon="cubeIcon" class="w-3.5 h-3.5 mt-0.5 text-blue-500 flex-shrink-0" />
                <p>
                  <strong>{{ $t("Drop Zone:") }}</strong> {{ $t("Files opened from Drop Zone are saved back to their original location (encrypted).") }}
                </p>
              </div>
              <div class="flex items-start gap-2">
                <Icon :icon="cubeScanIcon" class="w-3.5 h-3.5 mt-0.5 text-purple-500 flex-shrink-0" />
                <p>
                  <strong>{{ $t("App Drive:") }}</strong> {{ $t("Files opened from App Drive are saved back to the container's storage.") }}
                </p>
              </div>
              <div class="flex items-start gap-2">
                <Icon :icon="harddiskIcon" class="w-3.5 h-3.5 mt-0.5 text-orange-500 flex-shrink-0" />
                <p>
                  <strong>{{ $t("Disks+:") }}</strong> {{ $t("Files opened from a mounted disk are saved back to that disk.") }}
                </p>
              </div>
            </div>
            <p class="opacity-70">{{ $t("The colored icon on each tab indicates where that file will be saved.") }}</p>
          </div>
        </div>
      </template>
    </StatusBar>

    <AppDialog v-model:visible="showOpenDialog" title="Open Source" ok-text="Open" cancel-text="Cancel" :ok-disabled="!selectedSourceFilename" @ok="handleOpenSource" @cancel="showOpenDialog = false">
      <div class="space-y-3">
        <div class="flex items-center gap-2 pb-2 border-b" :class="themeClasses.utilityToolbarBorder">
          <Icon :icon="sourceCodeIcon" :class="['w-4 h-4', themeClasses.windowText, 'opacity-60']" />
          <span :class="['text-xs', themeClasses.windowText, 'opacity-60']">{{ $t("Location:") }} <strong>Storage/Sources</strong></span>
        </div>
        <div class="space-y-1 max-h-56 overflow-y-auto">
          <div v-if="isLoadingSources" class="text-center py-4">
            <Icon :icon="loadingIcon" :class="['w-6 h-6 animate-spin mx-auto', themeClasses.windowText]" />
          </div>
          <div v-else-if="savedSources.length === 0" :class="['text-center py-4 text-sm opacity-50', themeClasses.windowText]">{{ $t("No saved sources found") }}</div>
          <div
            v-else
            v-for="source in savedSources"
            :key="source.filename"
            @click="selectedSourceFilename = source.filename"
            @dblclick="
              selectedSourceFilename = source.filename;
              handleOpenSource();
            "
            :class="['flex items-center gap-3 p-2 rounded cursor-pointer transition-colors', selectedSourceFilename === source.filename ? 'bg-blue-500/20' : 'hover:bg-black/5 dark:hover:bg-white/5']"
          >
            <Icon :icon="fileCodeIcon" :class="['w-5 h-5 flex-shrink-0', themeClasses.windowText, 'opacity-60']" />
            <div class="flex-1 min-w-0">
              <div :class="['font-medium text-sm truncate font-mono', themeClasses.windowText]">{{ source.filename }}</div>
              <div :class="['text-xs opacity-50', themeClasses.windowText]">{{ formatDate(source.modified) }}</div>
            </div>
          </div>
        </div>
      </div>
    </AppDialog>

    <AppDialog v-model:visible="showSaveAsDialog" title="Save Source As" ok-text="Save" cancel-text="Cancel" @ok="handleSaveAs" @cancel="showSaveAsDialog = false">
      <div class="space-y-2">
        <input v-model="saveAsFilename" type="text" placeholder="filename.py" :class="[themeClasses.windowInputBg, themeClasses.windowText, themeClasses.windowBorder]" class="w-full px-3 py-2 text-sm rounded-lg border outline-none font-mono" @keyup.enter="handleSaveAs" />
        <div class="flex items-center gap-1.5">
          <Icon :icon="sourceCodeIcon" :class="['w-3 h-3', themeClasses.windowText, 'opacity-40']" />
          <span :class="['text-[11px]', themeClasses.windowText, 'opacity-40']">{{ $t("Saving in Storage/Sources") }}</span>
        </div>
      </div>
    </AppDialog>

    <AppDialog v-model:visible="showCloseConfirmDialog" title="Unsaved Changes" ok-text="Close" cancel-text="Cancel" @ok="confirmCloseTab" @cancel="cancelCloseTab">
      <p :class="['text-sm', themeClasses.windowText]">
        "<strong>{{ pendingCloseTabTitle }}</strong
        >" {{ $t("has unsaved changes. Are you sure you want to close it?") }}
      </p>
    </AppDialog>

    <AppDialog v-model:visible="showEncodingWarningDialog" title="Encoding Warning" ok-text="Save Anyway" cancel-text="Cancel" @ok="confirmEncodingSave" @cancel="cancelEncodingSave">
      <div :class="['text-sm space-y-2', themeClasses.windowText]">
        <p>
          {{ $t("This file contains characters that may indicate a") }} <strong>{{ $t("non-UTF-8 encoding") }}</strong> {{ $t("or binary content.") }}
        </p>
        <p class="opacity-70">{{ $t("Saving this file will convert it to UTF-8, which could corrupt special characters or formatting.") }}</p>
        <p>{{ $t("Are you sure you want to continue?") }}</p>
      </div>
    </AppDialog>

    <AppDialog v-model:visible="showWindowCloseDialog" title="Unsaved Changes" :content="windowCloseDialogMessage" ok-text="Save All" cancel-text="Cancel" :dismiss-text="$t('Don\'t Save')" type="warning" :mask-closable="false" @ok="handleSaveAllAndClose" @cancel="showWindowCloseDialog = false" @dismiss="handleDiscardAllAndClose" />
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";

import { ref, computed, onMounted, onUnmounted, watch, nextTick, markRaw, shallowRef } from "vue";
import { useI18n } from "vue-i18n";
import type { EditorState, Extension, Text } from "@codemirror/state";

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
import folderOpenIcon from "@iconify-icons/mdi/folder-open";
import loadingIcon from "@iconify-icons/mdi/loading";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useWindowStore } from "../__Stores__/windowStore";
import { useExternalFile } from "../__Composables__/useExternalFile";

import StatusBar from "../__Components__/StatusBar.vue";
import StatusBarHelpIcon from "../__Components__/StatusBarHelpIcon.vue";
import AppDialog from "../__Components__/AppDialog.vue";
import CodeMirrorEditor, { createEditorState, countWords, findText as findTextInDoc, replaceAllText, loadLanguage } from "../__Components__/CodeMirrorEditor.vue";

import { notifyError, notifySuccess } from "../__Components__/Notifications.vue";
import { uniqueStorageName } from "../__Utils__/StorageUpload";

interface ExternalFile {
  path: string;
  content: string;
  source: "appdrive" | "dropzone" | "storage" | "disksplus";
  container?: string;
  mountIndex?: number;
  disk?: string;
}

type TabFile = Omit<ExternalFile, "content">;

interface Tab {
  id: string;
  title: string;
  savedDoc: Text;
  isModified: boolean;
  originalFilename: string | null;
  externalFile: TabFile | null;
}

interface TextFile {
  name: string;
  content: string;
}

interface Props {
  _windowId?: string;
  externalFile?: ExternalFile;
  textFile?: TextFile;
  data?: {
    externalFile?: ExternalFile;
  };
}

const props = defineProps<Props>();
const { themeClasses } = useTheme();
const { t } = useI18n();
const csrfToken = useCsrfToken();
const windowStore = useWindowStore();
const { saveToSource } = useExternalFile();

function saveDoc(target: TabFile, doc: Text) {
  return saveToSource({ ...target, name: target.path.split("/").pop() || target.path }, new Blob([doc.toString()]), "text/plain");
}

function generateTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

const editorStates = new Map<string, EditorState>();

function toTabFile({ content: _content, ...file }: ExternalFile): TabFile {
  return file;
}

function createTab(text: string, fields: Partial<Omit<Tab, "id" | "savedDoc">> = {}): Tab {
  const state = createEditorState(text);
  const tab: Tab = { id: generateTabId(), title: "Untitled", isModified: false, originalFilename: null, externalFile: null, ...fields, savedDoc: markRaw(state.doc) };
  editorStates.set(tab.id, state);
  return tab;
}

function createInitialTab(): Tab {
  const extFile = props.externalFile || props.data?.externalFile;
  if (extFile) return createTab(extFile.content, { title: extFile.path.split("/").pop() || "File", externalFile: toTabFile(extFile) });
  if (props.textFile) return createTab(props.textFile.content, { title: props.textFile.name });
  return createTab("");
}

const tabs = ref<Tab[]>([createInitialTab()]);
const activeTabId = ref(tabs.value[0].id);

const activeTab = computed(() => tabs.value.find((t) => t.id === activeTabId.value) || tabs.value[0]);

function loadState(tabId: string): EditorState {
  return editorStates.get(tabId)!;
}

function tabDoc(tab: Tab): Text {
  return editorStates.get(tab.id)!.doc;
}

function markSaved(tab: Tab, doc: Text) {
  tab.savedDoc = markRaw(doc);
  tab.isModified = !tabDoc(tab).eq(doc);
}

const editorRef = ref<InstanceType<typeof CodeMirrorEditor> | null>(null);
const languageExtension = shallowRef<Extension | null>(null);

const showFindReplace = ref(false);
const findText = ref("");
const replaceText = ref("");

const fontSize = ref(12);
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 24;
const DEFAULT_FONT_SIZE = 12;
const REFRESH_DELAY_MS = 150;

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

interface StorageSource {
  filename: string;
  modified: number;
  size: number;
}

const showOpenDialog = ref(false);
const selectedSourceFilename = ref<string | null>(null);
const savedSources = ref<StorageSource[]>([]);
const isLoadingSources = ref(false);

const showCloseConfirmDialog = ref(false);
const pendingCloseTabId = ref<string | null>(null);
const pendingCloseTabTitle = ref("");

const showEncodingWarningDialog = ref(false);
const pendingSaveAction = ref<(() => Promise<void>) | null>(null);

const showWindowCloseDialog = ref(false);

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

const tabFilename = computed(() => activeTab.value.externalFile?.path || activeTab.value.originalFilename || activeTab.value.title);
let languageToken = 0;

watch(
  tabFilename,
  async (filename) => {
    const token = ++languageToken;
    const extension = await loadLanguage(filename);
    if (token === languageToken) languageExtension.value = extension;
  },
  { immediate: true },
);

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

const textStats = ref({ lines: 1, words: 0, chars: 0 });
const hasText = computed(() => textStats.value.words > 0);
let refreshTimer: ReturnType<typeof setTimeout> | undefined;
let statsToken = 0;

async function refreshText() {
  const tab = activeTab.value;
  const doc = loadState(tab.id).doc;
  tab.isModified = !doc.eq(tab.savedDoc);

  const token = ++statsToken;
  textStats.value = { lines: doc.lines, words: textStats.value.words, chars: doc.length };
  const words = await countWords(doc, () => token === statsToken);
  if (words !== null) textStats.value = { ...textStats.value, words };
}

function scheduleRefresh() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(refreshText, REFRESH_DELAY_MS);
}

function handleEditorUpdate(state: EditorState, docChanged: boolean) {
  editorStates.set(activeTabId.value, state);
  if (!docChanged) return;
  activeTab.value.isModified = true;
  scheduleRefresh();
}

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
    if (tab.externalFile.source === "appdrive") return t("Editing on App Drive");
    if (tab.externalFile.source === "storage") return t("Editing on Storage");
    if (tab.externalFile.source === "disksplus") return t("Editing on Disks+");
    return t("Editing on Drop Zone");
  }
  return t("Editing in Sources");
});
const statusInfo = computed(() => `Ln ${textStats.value.lines} | Words ${textStats.value.words} | ${textStats.value.chars} chars`);

const windowCloseDialogMessage = computed(() => {
  const unsavedTabs = tabs.value.filter((tab) => tab.isModified);
  if (unsavedTabs.length === 1) {
    return t('"{name}" has unsaved changes. Do you want to save before closing?', { name: t(unsavedTabs[0].title) });
  }
  return t("{n} files have unsaved changes. Do you want to save all before closing?", { n: unsavedTabs.length });
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
    const path = tab.originalFilename ? `Sources/${tab.originalFilename}` : t("Not saved yet");
    return `${tab.title}\n${t("Path:")} ${path}\n${t("Saved to:")} ${t("Sources")}`;
  }
  const sourceNames: Record<string, string> = {
    appdrive: "App Drive",
    storage: "Storage",
    dropzone: "Drop Zone",
    disksplus: "Disks+",
  };
  const source = sourceNames[tab.externalFile.source] || "Unknown";
  return `${tab.title}\n${t("Path:")} ${tab.externalFile.path}\n${t("Saved to:")} ${source}`;
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

  const hasModified = tabs.value.some((tab) => tab.isModified);
  const title = t(tab.title) + (hasModified ? " *" : "");
  windowStore.updateWindowTitle(props._windowId, `${t("Code")} - ${title}`);
}

watch([activeTabId, () => activeTab.value?.title, () => activeTab.value?.isModified], updateWindowTitle);

function handleNewTab() {
  const newTab = createTab("");
  tabs.value.push(newTab);
  activeTabId.value = newTab.id;
}

function closeTab(tabId: string) {
  const tab = tabs.value.find((t) => t.id === tabId);
  if (!tab) return;

  if (tabs.value.length <= 1) return;

  if (tab.isModified) {
    pendingCloseTabId.value = tabId;
    pendingCloseTabTitle.value = t(tab.title);
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
  editorStates.delete(tabId);
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

  if (hasEncodingIssues(tabDoc(tab).toString())) {
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

async function saveSourceToStorage(tab: Tab) {
  try {
    const filename = tab.originalFilename || sanitizeFilename(tab.title);
    await ensureSourcesFolderExists();

    const doc = tabDoc(tab);
    await saveDoc({ source: "storage", path: `Sources/${filename}` }, doc);

    markSaved(tab, doc);
    tab.originalFilename = filename;
    notifySuccess(t("Source saved"), t("Saved to Sources/{f}", { f: filename }), themeClasses.value.scopeSelector);
  } catch (error: any) {
    notifyError(t(error.response?.data?.error || "Failed to save source"));
  }
}

async function handleSaveAs() {
  const tab = activeTab.value;
  if (!tab) return;

  if (hasEncodingIssues(tabDoc(tab).toString())) {
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

    const finalFilename = await uniqueStorageName("Sources", filename, csrfToken.value);
    const doc = tabDoc(tab);
    await saveDoc({ source: "storage", path: `Sources/${finalFilename}` }, doc);

    tab.title = finalFilename;
    markSaved(tab, doc);
    tab.originalFilename = finalFilename;
    tab.externalFile = null;
    showSaveAsDialog.value = false;
    notifySuccess(t("Source saved"), t("Saved to Sources/{f}", { f: finalFilename }), themeClasses.value.scopeSelector);
  } catch (error: any) {
    notifyError(t(error.response?.data?.error || "Failed to save source"));
  }
}

async function autoSaveNewSource(tab: Tab) {
  const title = tab.title !== "Untitled" ? tab.title : `source-${new Date().toISOString().replace(/[/:]/g, "-").slice(0, 19)}.txt`;
  const filename = sanitizeFilename(title);

  try {
    await ensureSourcesFolderExists();

    const finalFilename = await uniqueStorageName("Sources", filename, csrfToken.value);
    const doc = tabDoc(tab);
    await saveDoc({ source: "storage", path: `Sources/${finalFilename}` }, doc);

    tab.title = finalFilename;
    markSaved(tab, doc);
    tab.originalFilename = finalFilename;
    notifySuccess(t("Source saved"), t("Saved to Sources/{f}", { f: finalFilename }), themeClasses.value.scopeSelector);
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || "Failed to save source");
  }
}

async function handleSaveToExternal() {
  const tab = activeTab.value;
  if (!tab?.externalFile) return;

  try {
    const ext = tab.externalFile;
    if (ext.source === "disksplus" && !ext.disk) {
      notifyError(t("Disks+ save failed: missing disk id"));
      return;
    }

    const doc = tabDoc(tab);
    await saveDoc(ext, doc);

    markSaved(tab, doc);
    const sourceNames: Record<string, string> = {
      appdrive: "App Drive",
      storage: "Storage",
      dropzone: "Drop Zone",
      disksplus: "Disks+",
    };
    const storageName = sourceNames[ext.source] || "Unknown";
    notifySuccess(t("File saved"), t("Saved to {storage}: {path}", { storage: storageName, path: ext.path }), themeClasses.value.scopeSelector);
  } catch (error: any) {
    notifyError(t(error.response?.data?.error || "Failed to save file"));
  }
}

function toggleFindReplace() {
  showFindReplace.value = !showFindReplace.value;
  const view = editorRef.value?.view;
  if (!showFindReplace.value || !view) return;
  const { from, to } = view.state.selection.main;
  if (from !== to) findText.value = view.state.sliceDoc(from, to);
}

function findNext() {
  const view = editorRef.value?.view;
  if (!findText.value || !view) return;
  const match = findTextInDoc(view.state.doc, findText.value, view.state.selection.main.to);
  if (match) view.dispatch({ selection: { anchor: match.from, head: match.to }, scrollIntoView: true });
  view.focus();
}

function replaceNext() {
  const view = editorRef.value?.view;
  if (!findText.value || !view) return;
  const { from, to } = view.state.selection.main;
  if (view.state.sliceDoc(from, to) === findText.value) {
    view.dispatch({ changes: { from, to, insert: replaceText.value }, selection: { anchor: from + replaceText.value.length } });
  }
  findNext();
}

function replaceAllInTab() {
  const view = editorRef.value?.view;
  if (!findText.value || !view) return;
  const result = replaceAllText(view.state.doc, findText.value, replaceText.value);
  if (result) view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: result.text } });
  notifySuccess(t("Replace all"), t("Replaced {n} occurrences", { n: result?.count ?? 0 }), themeClasses.value.scopeSelector);
}

function selectAll() {
  const view = editorRef.value?.view;
  if (!view) return;
  view.dispatch({ selection: { anchor: 0, head: view.state.doc.length } });
  view.focus();
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

function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleString();
}

async function loadSourcesList() {
  isLoadingSources.value = true;
  try {
    await ensureSourcesFolderExists();
    const response = await axios.get("/api/storage/files", {
      params: { path: "Sources" },
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });

    if (response.data.files) {
      savedSources.value = response.data.files
        .filter((file: any) => !file.is_directory)
        .map((file: any) => ({
          filename: file.display_name || file.name.split("/").pop() || file.name,
          modified: file.modified,
          size: file.size,
        }))
        .sort((a: StorageSource, b: StorageSource) => b.modified - a.modified);
    }
  } catch (error: any) {
    if (error.response?.status === 404) {
      savedSources.value = [];
    } else {
      console.error("Failed to load sources list:", error);
    }
  } finally {
    isLoadingSources.value = false;
  }
}

async function handleOpenSource() {
  const selectedSource = savedSources.value.find((source) => source.filename === selectedSourceFilename.value);
  if (!selectedSource) return;

  try {
    const existingTab = tabs.value.find((tab) => tab.originalFilename === selectedSource.filename && !tab.externalFile);
    if (existingTab) {
      activeTabId.value = existingTab.id;
      showOpenDialog.value = false;
      selectedSourceFilename.value = null;
      return;
    }

    const response = await axios.get("/api/storage/download", {
      params: { file: `Sources/${selectedSource.filename}` },
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      responseType: "text",
    });

    const content = typeof response.data === "string" ? response.data : JSON.stringify(response.data, null, 2);
    const newTab = createTab(content, { title: selectedSource.filename, originalFilename: selectedSource.filename });

    tabs.value.push(newTab);
    activeTabId.value = newTab.id;

    showOpenDialog.value = false;
    selectedSourceFilename.value = null;
  } catch (error: any) {
    notifyError(t(error.response?.data?.error || "Failed to open source"));
  }
}

watch(showOpenDialog, (isOpen) => {
  if (isOpen) loadSourcesList();
});

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
      case "o":
        e.preventDefault();
        showOpenDialog.value = true;
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
    if (e.defaultPrevented) e.stopPropagation();
  }
}

watch(activeTabId, () => {
  nextTick(() => {
    flashLangBadge();
    refreshText();
  });
});

function openExternalFileAsTab(extFile: ExternalFile) {
  const fileName = extFile.path.split("/").pop() || "File";

  const existingTab = tabs.value.find((t) => t.externalFile?.path === extFile.path && t.externalFile?.source === extFile.source);

  if (existingTab) {
    activeTabId.value = existingTab.id;
    return;
  }

  const newTab = createTab(extFile.content, { title: fileName, externalFile: toTabFile(extFile) });

  tabs.value.push(newTab);
  activeTabId.value = newTab.id;
}

function openTextFileAsTab(textFile: TextFile) {
  const newTab = createTab(textFile.content, { title: textFile.name });

  tabs.value.push(newTab);
  activeTabId.value = newTab.id;
}

function handleIncomingFile(event: CustomEvent) {
  const data = event.detail;
  if (data?.externalFile) {
    openExternalFileAsTab(data.externalFile);
  } else if (data?.textFile) {
    openTextFileAsTab(data.textFile);
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
      notifyError(t("Failed to save: {name}", { name: tab.title }));
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
  updateWindowTitle();
  nextTick(() => {
    flashLangBadge();
    refreshText();
  });

  if (props._windowId) {
    window.addEventListener(`homedock:open-file-${props._windowId}`, handleIncomingFile as EventListener);
    window.addEventListener(`homedock:request-close-${props._windowId}`, handleWindowCloseRequest);
  }
});

onUnmounted(() => {
  if (langBadgeTimer) clearTimeout(langBadgeTimer);
  clearTimeout(refreshTimer);
  statsToken++;
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

.code-surface {
  color: var(--hljs-base, #d4d4d4);
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
</style>
