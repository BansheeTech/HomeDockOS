<!-- homedock-ui/vue3/static/js/__Apps__/UtilsNotepad.vue -->
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
            <MenuItem key="open" @click="showOpenDialog = true">
              <div class="flex items-center gap-2">
                <Icon :icon="folderOpenIcon" class="w-4 h-4" />
                <span>Open...</span>
                <span class="ml-auto text-[10px] opacity-50">Ctrl+O</span>
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
        <div v-for="tab in tabs" :key="tab.id" @click="activeTabId = tab.id" @auxclick.middle.prevent="tabs.length > 1 && closeTab(tab.id)" :class="['group flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-r transition-colors min-w-0 max-w-[200px]', themeClasses.utilityToolbarBorder, activeTabId === tab.id ? 'bg-blue-500/20 border-blue-500/30' : 'hover:bg-white/5 border-transparent']" :title="getTabTooltip(tab)">
          <Icon :icon="getStorageIcon(tab)" :class="['w-3 h-3 flex-shrink-0', getStorageIconColor(tab)]" :title="getStorageLabel(tab)" />
          <Icon :icon="tab.externalFile ? fileCodeIcon : textFileIcon" :class="['w-3.5 h-3.5 flex-shrink-0 opacity-60', themeClasses.windowText]" />
          <span :class="[themeClasses.windowText]" class="truncate"> {{ tab.title }}{{ tab.isModified ? " *" : "" }} </span>
          <button v-if="tabs.length > 1" @click.stop="closeTab(tab.id)" :class="[themeClasses.windowButtonBgHover]" class="ml-1 p-0.5 rounded opacity-60 hover:opacity-100 flex-shrink-0 transition-opacity">
            <Icon :icon="closeIcon" :class="['w-3 h-3', themeClasses.windowText]" />
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

    <div class="flex-1 overflow-hidden p-2">
      <textarea ref="textareaRef" v-model="activeTabContent" :class="[themeClasses.windowText, themeClasses.windowBorder, wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto']" class="w-full h-full resize-none p-3 font-mono leading-relaxed rounded-lg border outline-none bg-transparent" :style="{ fontSize: fontSize + 'px' }" @input="handleInput" @keydown="handleKeydown" spellcheck="false"></textarea>
    </div>

    <StatusBar :icon="statusIcon" :message="statusMessage" :info="statusInfo">
      <template #help>
        <div class="space-y-3 max-w-sm">
          <div class="flex items-center gap-2">
            <Icon :icon="textFileIcon" :class="['w-5 h-5', themeClasses.statusBarIcon]" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">Notepad</h4>
          </div>
          <div :class="['text-[10px] md:text-xs space-y-2.5 leading-relaxed', themeClasses.statusBarInfo]">
            <p>A simple text editor with support for multiple storage locations.</p>
            <div class="space-y-1.5">
              <div class="flex items-start gap-2">
                <Icon :icon="notebookIcon" class="w-3.5 h-3.5 mt-0.5 text-green-500 flex-shrink-0" />
                <p><strong>Notes:</strong> Notes created with File &gt; New are saved to your Storage/Notes folder.</p>
              </div>
              <div class="flex items-start gap-2">
                <Icon :icon="cubeIcon" class="w-3.5 h-3.5 mt-0.5 text-blue-500 flex-shrink-0" />
                <p><strong>Drop Zone:</strong> Files opened from Drop Zone are saved back to their original location (encrypted).</p>
              </div>
              <div class="flex items-start gap-2">
                <Icon :icon="cubeScanIcon" class="w-3.5 h-3.5 mt-0.5 text-purple-500 flex-shrink-0" />
                <p><strong>App Drive:</strong> Files opened from App Drive are saved back to the container's storage.</p>
              </div>
            </div>
            <p class="opacity-70">The colored icon on each tab indicates where that file will be saved.</p>
          </div>
        </div>
      </template>
    </StatusBar>

    <AppDialog v-model:visible="showOpenDialog" title="Open Note" ok-text="Open" cancel-text="Cancel" :ok-disabled="!selectedNoteFilename" @ok="handleOpenNote" @cancel="showOpenDialog = false">
      <div class="space-y-3">
        <div class="flex items-center gap-2 pb-2 border-b" :class="themeClasses.utilityToolbarBorder">
          <Icon :icon="notebookIcon" :class="['w-4 h-4', themeClasses.windowText, 'opacity-60']" />
          <span :class="['text-xs', themeClasses.windowText, 'opacity-60']">Location: <strong>Storage/Notes</strong></span>
        </div>
        <div class="space-y-1 max-h-56 overflow-y-auto">
          <div v-if="isLoadingNotes" class="text-center py-4">
            <Icon :icon="loadingIcon" :class="['w-6 h-6 animate-spin mx-auto', themeClasses.windowText]" />
          </div>
          <div v-else-if="savedNotes.length === 0" :class="['text-center py-4 text-sm opacity-50', themeClasses.windowText]">No saved notes found</div>
          <div
            v-else
            v-for="note in savedNotes"
            :key="note.filename"
            @click="selectedNoteFilename = note.filename"
            @dblclick="
              selectedNoteFilename = note.filename;
              handleOpenNote();
            "
            :class="['flex items-center gap-3 p-2 rounded cursor-pointer transition-colors', selectedNoteFilename === note.filename ? 'bg-blue-500/20' : 'hover:bg-black/5 dark:hover:bg-white/5']"
          >
            <Icon :icon="textFileIcon" :class="['w-5 h-5 flex-shrink-0', themeClasses.windowText, 'opacity-60']" />
            <div class="flex-1 min-w-0">
              <div :class="['font-medium text-sm truncate', themeClasses.windowText]">{{ note.title }}</div>
              <div :class="['text-xs opacity-50', themeClasses.windowText]">{{ formatDate(note.modified) }}</div>
            </div>
          </div>
        </div>
      </div>
    </AppDialog>

    <AppDialog v-model:visible="showSaveAsDialog" title="Save Note As" ok-text="Save" cancel-text="Cancel" @ok="handleSaveAs" @cancel="showSaveAsDialog = false">
      <div class="space-y-2">
        <input v-model="saveAsTitle" type="text" placeholder="Note title..." :class="[themeClasses.windowBg, themeClasses.windowText, themeClasses.windowBorder]" class="w-full px-3 py-2 text-sm rounded-lg border outline-none" @keyup.enter="handleSaveAs" />
        <div class="flex items-center gap-1.5">
          <Icon :icon="folderIcon" :class="['w-3 h-3', themeClasses.windowText, 'opacity-40']" />
          <span :class="['text-[11px]', themeClasses.windowText, 'opacity-40']">Saving in Storage/Notes</span>
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

import { ref, computed, onMounted, onUnmounted, watch } from "vue";

import { Dropdown, Menu, MenuItem, MenuDivider } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import fileIcon from "@iconify-icons/mdi/file";
import folderIcon from "@iconify-icons/mdi/folder";
import folderOpenIcon from "@iconify-icons/mdi/folder-open";
import contentSaveIcon from "@iconify-icons/mdi/content-save";
import contentSaveEditIcon from "@iconify-icons/mdi/content-save-edit";
import magnifyIcon from "@iconify-icons/mdi/magnify";
import magnifyPlusIcon from "@iconify-icons/mdi/magnify-plus-outline";
import magnifyMinusIcon from "@iconify-icons/mdi/magnify-minus-outline";
import selectAllIcon from "@iconify-icons/mdi/select-all";
import checkIcon from "@iconify-icons/mdi/check";
import wrapIcon from "@iconify-icons/mdi/wrap";
import closeIcon from "@iconify-icons/mdi/close";
import textFileIcon from "@iconify-icons/mdi/file-document";
import fileCodeIcon from "@iconify-icons/mdi/file-code";
import loadingIcon from "@iconify-icons/mdi/loading";
import plusIcon from "@iconify-icons/mdi/plus";
import cubeIcon from "@iconify-icons/mdi/cube";
import cubeScanIcon from "@iconify-icons/mdi/cube-scan";
import notebookIcon from "@iconify-icons/mdi/notebook";
import exitIcon from "@iconify-icons/mdi/exit-to-app";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useWindowStore } from "../__Stores__/windowStore";

import StatusBar from "../__Components__/StatusBar.vue";
import AppDialog from "../__Components__/AppDialog.vue";

import { notifyError, notifySuccess } from "../__Components__/Notifications.vue";

interface ExternalFile {
  path: string;
  content: string;
  source: "appdrive" | "dropzone" | "storage";
  container?: string;
  mountIndex?: number;
}

interface StorageNote {
  filename: string;
  title: string;
  modified: number;
  size: number;
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

const fontSize = ref(10);
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 24;
const DEFAULT_FONT_SIZE = 10;

const wordWrap = ref(true);

const showOpenDialog = ref(false);
const showSaveAsDialog = ref(false);
const saveAsTitle = ref("");
const selectedNoteFilename = ref<string | null>(null);
const savedNotes = ref<StorageNote[]>([]);
const isLoadingNotes = ref(false);

const showCloseConfirmDialog = ref(false);
const pendingCloseTabId = ref<string | null>(null);
const pendingCloseTabTitle = ref("");

const showEncodingWarningDialog = ref(false);
const pendingSaveAction = ref<(() => Promise<void>) | null>(null);

const showWindowCloseDialog = ref(false);

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
    return cubeIcon; // dropzone
  }
  return notebookIcon;
});
const statusMessage = computed(() => {
  const tab = activeTab.value;
  if (tab?.externalFile) {
    if (tab.externalFile.source === "appdrive") return "Editing on App Drive";
    if (tab.externalFile.source === "storage") return "Editing on Storage";
    return "Editing on Drop Zone";
  }
  return "Editing in Notes";
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
  if (!tab.externalFile) return notebookIcon;
  if (tab.externalFile.source === "appdrive") return cubeScanIcon;
  if (tab.externalFile.source === "storage") return folderIcon;
  return cubeIcon;
}

function getStorageIconColor(tab: Tab): string {
  if (!tab.externalFile) return "text-green-500";
  if (tab.externalFile.source === "appdrive") return "text-purple-500";
  if (tab.externalFile.source === "storage") return "text-green-500";
  return "text-blue-500";
}

function getStorageLabel(tab: Tab): string {
  if (!tab.externalFile) return "Notes";
  if (tab.externalFile.source === "appdrive") return "App Drive";
  if (tab.externalFile.source === "storage") return "Storage";
  return "Drop Zone";
}

function getTabTooltip(tab: Tab): string {
  if (!tab.externalFile) {
    const path = tab.originalFilename ? `Notes/${tab.originalFilename}` : "Not saved yet";
    return `${tab.title}\nPath: ${path}\nSaved to: Notes`;
  }
  const sourceNames: Record<string, string> = {
    appdrive: "App Drive",
    storage: "Storage",
    dropzone: "Drop Zone",
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
  windowStore.updateWindowTitle(props._windowId, `Notepad - ${title}`);
}

watch([activeTabId, () => activeTab.value?.title, () => activeTab.value?.isModified], updateWindowTitle);

function handleInput() {
  const tab = activeTab.value;
  if (tab) {
    tab.isModified = tab.content !== tab.originalContent;
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

async function ensureNotesFolderExists() {
  try {
    await axios.get("/api/storage/files", {
      params: { path: "Notes" },
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });
  } catch (error: any) {
    if (error.response?.status === 404) {
      await axios.post("/api/storage/create-folder", { name: "Notes", path: "" }, { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });
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

async function saveNoteToStorage(tab: Tab) {
  try {
    const filename = tab.originalFilename || sanitizeFilename(tab.title) + ".txt";
    const formData = new FormData();
    const blob = new Blob([tab.content], { type: "text/plain" });
    formData.append("file", blob, filename);
    formData.append("path", "Notes");

    await axios.post("/api/storage/upload", formData, {
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });

    tab.originalContent = tab.content;
    tab.isModified = false;
    tab.originalFilename = filename;
    notifySuccess("Note saved", `Saved to Notes/${filename}`, themeClasses.value.scopeSelector);
  } catch (error: any) {
    notifyError(error.response?.data?.error || "Failed to save note");
  }
}

async function saveNoteWithRename(tab: Tab, newFilename: string) {
  try {
    const exists = await checkFileExists(`Notes/${newFilename}`);
    if (exists) {
      notifyError(`A note named "${newFilename.replace(".txt", "")}" already exists`);
      return;
    }

    const formData = new FormData();
    const blob = new Blob([tab.content], { type: "text/plain" });
    formData.append("file", blob, newFilename);
    formData.append("path", "Notes");

    await axios.post("/api/storage/upload", formData, {
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });

    if (tab.originalFilename) {
      await axios.post("/api/storage/delete", { file: `Notes/${tab.originalFilename}` }, { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });
    }

    tab.originalContent = tab.content;
    tab.isModified = false;
    tab.originalFilename = newFilename;
    tab.title = newFilename.replace(".txt", "");
    notifySuccess("Note saved", `Saved to Notes/${newFilename}`, themeClasses.value.scopeSelector);
  } catch (error: any) {
    notifyError(error.response?.data?.error || "Failed to save note");
  }
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
    showSaveAsDialog.value = true;
    saveAsTitle.value = tab.title;
    return;
  }

  const expectedFilename = sanitizeFilename(tab.title) + ".txt";
  if (expectedFilename !== tab.originalFilename) {
    await saveNoteWithRename(tab, expectedFilename);
  } else {
    await saveNoteToStorage(tab);
  }
}

function openSaveAsDialog() {
  const tab = activeTab.value;
  if (!tab) return;
  saveAsTitle.value = tab.title !== "Untitled" ? tab.title : "";
  showSaveAsDialog.value = true;
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

  const title = saveAsTitle.value.trim() || "Untitled";
  const baseFilename = sanitizeFilename(title);

  try {
    await ensureNotesFolderExists();

    let finalFilename = baseFilename + ".txt";
    let counter = 1;
    while (await checkFileExists(`Notes/${finalFilename}`)) {
      finalFilename = `${baseFilename} (${counter}).txt`;
      counter++;
      if (counter > 100) {
        notifyError("Too many notes with this name");
        return;
      }
    }

    const formData = new FormData();
    const blob = new Blob([tab.content], { type: "text/plain" });
    formData.append("file", blob, finalFilename);
    formData.append("path", "Notes");

    await axios.post("/api/storage/upload", formData, {
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });

    tab.title = finalFilename.replace(".txt", "");
    tab.originalContent = tab.content;
    tab.isModified = false;
    tab.originalFilename = finalFilename;
    tab.externalFile = null;
    showSaveAsDialog.value = false;
    notifySuccess("Note saved", `Saved to Notes/${finalFilename}`, themeClasses.value.scopeSelector);
  } catch (error: any) {
    notifyError(error.response?.data?.error || "Failed to save note");
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
    }

    tab.originalContent = tab.content;
    tab.isModified = false;
    const sourceNames: Record<string, string> = {
      appdrive: "App Drive",
      storage: "Storage",
      dropzone: "Drop Zone",
    };
    const storageName = sourceNames[ext.source] || "Unknown";
    notifySuccess("File saved", `Saved to ${storageName}: ${ext.path}`, themeClasses.value.scopeSelector);
  } catch (error: any) {
    notifyError(error.response?.data?.error || "Failed to save file");
  }
}

async function loadNotesList() {
  isLoadingNotes.value = true;
  try {
    await ensureNotesFolderExists();
    const response = await axios.get("/api/storage/files", {
      params: { path: "Notes" },
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });

    if (response.data.files) {
      savedNotes.value = response.data.files
        .filter((file: any) => !file.is_directory && file.name.toLowerCase().endsWith(".txt"))
        .map((file: any) => {
          const filename = file.display_name || file.name.split("/").pop() || file.name;
          return {
            filename: filename,
            title: filename.replace(/\.txt$/i, ""),
            modified: file.modified,
            size: file.size,
          };
        })
        .sort((a: StorageNote, b: StorageNote) => b.modified - a.modified);
    }
  } catch (error: any) {
    if (error.response?.status === 404) {
      savedNotes.value = [];
    } else {
      console.error("Failed to load notes list:", error);
    }
  } finally {
    isLoadingNotes.value = false;
  }
}

async function handleOpenNote() {
  const selectedNote = savedNotes.value.find((n) => n.filename === selectedNoteFilename.value);
  if (!selectedNote) return;

  try {
    const existingTab = tabs.value.find((t) => t.originalFilename === selectedNote.filename && !t.externalFile);
    if (existingTab) {
      activeTabId.value = existingTab.id;
      showOpenDialog.value = false;
      selectedNoteFilename.value = null;
      return;
    }

    const response = await axios.get("/api/storage/download", {
      params: { file: `Notes/${selectedNote.filename}` },
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      responseType: "text",
    });

    const content = response.data;

    const newTab: Tab = {
      id: generateTabId(),
      title: selectedNote.title,
      content: content,
      originalContent: content,
      isModified: false,
      originalFilename: selectedNote.filename,
      externalFile: null,
    };

    tabs.value.push(newTab);
    activeTabId.value = newTab.id;

    showOpenDialog.value = false;
    selectedNoteFilename.value = null;
  } catch (error: any) {
    notifyError(error.response?.data?.error || "Failed to open note");
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

function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleString();
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
  }
}

watch(showOpenDialog, (isOpen) => {
  if (isOpen) {
    loadNotesList();
  }
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
        await autoSaveNewNote(tab);
      } else {
        await saveNoteToStorage(tab);
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

async function autoSaveNewNote(tab: Tab) {
  const title = tab.title !== "Untitled" ? tab.title : `Note ${new Date().toLocaleString().replace(/[/:]/g, "-")}`;
  const baseFilename = sanitizeFilename(title);

  try {
    await ensureNotesFolderExists();

    let finalFilename = baseFilename + ".txt";
    let counter = 1;
    while (await checkFileExists(`Notes/${finalFilename}`)) {
      finalFilename = `${baseFilename} (${counter}).txt`;
      counter++;
      if (counter > 100) {
        throw new Error("Too many notes with this name");
      }
    }

    const formData = new FormData();
    const blob = new Blob([tab.content], { type: "text/plain" });
    formData.append("file", blob, finalFilename);
    formData.append("path", "Notes");

    await axios.post("/api/storage/upload", formData, {
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });

    tab.title = finalFilename.replace(".txt", "");
    tab.originalContent = tab.content;
    tab.isModified = false;
    tab.originalFilename = finalFilename;
    notifySuccess("Note saved", `Saved to Notes/${finalFilename}`, themeClasses.value.scopeSelector);
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || "Failed to save note");
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

  if (props._windowId) {
    window.addEventListener(`homedock:open-file-${props._windowId}`, handleIncomingFile as EventListener);
    window.addEventListener(`homedock:request-close-${props._windowId}`, handleWindowCloseRequest);
  }
});

onUnmounted(() => {
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
</style>
