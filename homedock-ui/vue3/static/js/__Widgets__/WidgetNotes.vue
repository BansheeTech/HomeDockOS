<!-- homedock-ui/vue3/static/js/__Widgets__/WidgetNotes.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="w-full h-full flex flex-col px-4 py-3">
    <div class="flex items-center gap-1.5 shrink-0 mb-1.5">
      <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
      <span class="text-[10px] font-semibold uppercase tracking-[0.12em]" :class="themeClasses.desktopWidgetMeta">{{ $t("Notes") }}</span>
    </div>

    <textarea v-if="!isListMode" v-model="text" class="notes-area flex-1 w-full resize-none bg-transparent border-none outline-none p-0 text-sm leading-relaxed" :class="themeClasses.desktopWidgetText" :placeholder="$t('Write something...')" spellcheck="false" @mousedown.stop @touchstart.stop @dblclick.stop @contextmenu.stop @keydown.stop @input="scheduleSave" @blur="flush"></textarea>

    <div v-else class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1" @mousedown.stop @touchstart.stop @dblclick.stop @contextmenu.stop>
      <div v-for="(item, index) in items" :key="index" class="flex items-center gap-2 shrink-0">
        <button type="button" class="shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center cursor-pointer transition-colors" :class="item.done ? ['text-white', themeClasses.statsWidgetProgressFill] : ['border border-current', themeClasses.desktopWidgetMeta]" @mousedown.stop @click.stop="toggleItem(index)">
          <Icon v-if="item.done" :icon="checkIcon" class="w-2.5 h-2.5" />
        </button>
        <input :ref="(el) => setItemRef(el, index)" v-model="item.text" type="text" class="notes-area flex-1 min-w-0 bg-transparent border-none outline-none p-0 text-sm leading-relaxed" :class="item.done ? ['line-through', themeClasses.desktopWidgetMeta] : themeClasses.desktopWidgetText" :placeholder="index === 0 && items.length === 1 ? $t('Write something...') : ''" spellcheck="false" @mousedown.stop @touchstart.stop @dblclick.stop @contextmenu.stop @keydown.stop="handleItemKeydown($event, index)" @input="syncTextFromItems" @blur="flush" />
      </div>

      <button v-if="showAddRow" type="button" class="flex items-center gap-2 shrink-0 cursor-pointer text-left group" @mousedown.stop @click.stop="addItem">
        <span class="shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center border border-dashed border-current transition-colors" :class="themeClasses.desktopWidgetMeta">
          <Icon :icon="plusIcon" class="w-2.5 h-2.5" />
        </span>
        <span class="text-sm leading-relaxed opacity-40 transition-opacity group-hover:opacity-70" :class="themeClasses.desktopWidgetMeta">{{ $t("Write something...") }}</span>
      </button>
    </div>

    <div class="shrink-0 flex items-center justify-between mt-1">
      <button type="button" class="w-5 h-5 rounded-md flex items-center justify-center cursor-pointer transition-colors" :class="[isListMode ? themeClasses.desktopWidgetAccent : themeClasses.desktopWidgetMeta, themeClasses.desktopWidgetControlBgHover]" :title="$t('List')" @mousedown.stop @touchstart.stop @click.stop="toggleListMode">
        <Icon :icon="formatListIcon" class="w-3.5 h-3.5" />
      </button>

      <div class="flex items-center gap-1">
        <button v-if="hasSavedFile" type="button" class="w-5 h-5 rounded-md flex items-center justify-center cursor-pointer transition-colors" :class="[themeClasses.desktopWidgetMeta, themeClasses.desktopWidgetControlBgHover]" :title="$t('Refresh')" @mousedown.stop @touchstart.stop @click.stop="loadFromDisk(true)">
          <Icon :icon="refreshIcon" class="w-3.5 h-3.5" :class="{ 'animate-spin': reloading }" />
        </button>
        <button v-if="hasNoteFile" type="button" class="w-5 h-5 rounded-md flex items-center justify-center cursor-pointer transition-colors" :class="[themeClasses.desktopWidgetMeta, themeClasses.desktopWidgetControlBgHover]" :title="$t('File Explorer')" @mousedown.stop @touchstart.stop @click.stop="revealInExplorer">
          <Icon :icon="folderOpenIcon" class="w-3.5 h-3.5" />
        </button>
        <button v-if="hasNoteFile" type="button" class="w-5 h-5 rounded-md flex items-center justify-center cursor-pointer transition-colors" :class="[themeClasses.desktopWidgetMeta, themeClasses.desktopWidgetControlBgHover]" :title="$t('Notepad')" @mousedown.stop @touchstart.stop @click.stop="openInNotepad">
          <Icon :icon="noteEditIcon" class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";

import { ref, computed, nextTick, onMounted, onUnmounted } from "vue";
import { Icon } from "@iconify/vue";

import refreshIcon from "@iconify-icons/mdi/refresh";
import folderOpenIcon from "@iconify-icons/mdi/folder-open-outline";
import noteEditIcon from "@iconify-icons/mdi/note-edit-outline";
import formatListIcon from "@iconify-icons/mdi/format-list-bulleted";
import checkIcon from "@iconify-icons/mdi/check";
import plusIcon from "@iconify-icons/mdi/plus";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useWidgetsStore } from "../__Stores__/useWidgetsStore";
import { useWindowStore } from "../__Stores__/windowStore";
import type { WidgetInstance } from "../__Stores__/useWidgetsStore";
import type { WidgetSize } from "../__Config__/WidgetDefaultDetails";

const NOTES_FOLDER = "Notes";

const props = defineProps<{
  instance: WidgetInstance;
  size: WidgetSize;
}>();

const { themeClasses } = useTheme();
const csrfToken = useCsrfToken();
const widgetsStore = useWidgetsStore();
const windowStore = useWindowStore();

const text = ref("");

const hasNoteFile = computed(() => typeof props.instance.settings?.file === "string" || text.value.length > 0);
const hasSavedFile = computed(() => typeof props.instance.settings?.file === "string");
const reloading = ref(false);

interface ListItem {
  done: boolean;
  text: string;
}

const isListMode = computed(() => props.instance.settings?.mode === "list");
const items = ref<ListItem[]>([]);

const ITEM_RE = /^([✓•*-])\s?(.*)$/;

function parseItems(raw: string): ListItem[] {
  const parsed = raw
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const match = line.match(ITEM_RE);
      if (match) return { done: match[1] === "✓", text: match[2] };
      return { done: false, text: line };
    });
  return parsed.length > 0 ? parsed : [{ done: false, text: "" }];
}

function serializeItems(): string {
  return items.value.map((item) => `${item.done ? "✓" : "•"} ${item.text}`).join("\n");
}

function syncTextFromItems() {
  text.value = serializeItems();
  scheduleSave();
}

function toggleListMode() {
  if (isListMode.value) {
    const plain = items.value.map((item) => (item.done ? `✓ ${item.text}` : item.text)).join("\n");
    if (plain !== text.value) {
      text.value = plain;
      scheduleSave();
    }
    widgetsStore.updateSettings(props.instance.instanceId, { mode: "text" });
    return;
  }
  items.value = parseItems(text.value);
  widgetsStore.updateSettings(props.instance.instanceId, { mode: "list" });
  if (text.value.trim().length > 0) syncTextFromItems();
}

const showAddRow = computed(() => {
  const last = items.value[items.value.length - 1];
  return !last || last.text.trim().length > 0;
});

function addItem() {
  items.value.push({ done: false, text: "" });
  syncTextFromItems();
  focusItem(items.value.length - 1);
}

function toggleItem(index: number) {
  const item = items.value[index];
  if (!item) return;
  item.done = !item.done;
  syncTextFromItems();
}

const itemInputs: (HTMLInputElement | null)[] = [];

function setItemRef(el: unknown, index: number) {
  itemInputs[index] = (el as HTMLInputElement) || null;
}

function focusItem(index: number) {
  nextTick(() => {
    const el = itemInputs[index];
    if (el) {
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  });
}

function handleItemKeydown(event: KeyboardEvent, index: number) {
  if (event.key === "Enter") {
    event.preventDefault();
    items.value.splice(index + 1, 0, { done: false, text: "" });
    syncTextFromItems();
    focusItem(index + 1);
  } else if (event.key === "Backspace" && items.value[index]?.text === "" && items.value.length > 1) {
    event.preventDefault();
    items.value.splice(index, 1);
    syncTextFromItems();
    focusItem(Math.max(0, index - 1));
  }
}

function noteFilename(): string {
  const suffix = props.instance.instanceId.split("-").pop() || props.instance.instanceId;
  return `note-${suffix}.txt`;
}

function noteRelPath(): string {
  const stored = props.instance.settings?.file;
  return typeof stored === "string" && stored ? stored : `${NOTES_FOLDER}/${noteFilename()}`;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let dirty = false;
let saving = false;

function scheduleSave() {
  dirty = true;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 800);
}

async function flush() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (!dirty || saving) return;
  saving = true;
  dirty = false;

  const relPath = noteRelPath();
  const filename = relPath.split("/").pop() || noteFilename();
  const folder = relPath.includes("/") ? relPath.slice(0, relPath.lastIndexOf("/")) : "";

  const form = new FormData();
  form.append("file", new Blob([text.value], { type: "text/plain" }), filename);
  form.append("path", folder);

  try {
    await axios.post("/api/storage/edit", form, { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });
    if (props.instance.settings?.file !== relPath) {
      widgetsStore.updateSettings(props.instance.instanceId, { file: relPath });
    }
  } catch {
    dirty = true;
  } finally {
    saving = false;
    if (dirty && saveTimer === null) saveTimer = setTimeout(flush, 3000);
  }
}

async function loadFromDisk(discardLocal = false) {
  if (discardLocal) {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    dirty = false;
  }

  if (typeof props.instance.settings?.file === "string") {
    reloading.value = true;
    try {
      const response = await axios.get("/api/storage/download", {
        params: { file: props.instance.settings.file },
        responseType: "text",
        transformResponse: [(data) => data],
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      });
      if (!dirty) text.value = typeof response.data === "string" ? response.data : "";
    } catch {
      // Missing file (deleted from the explorer) — start clean
    } finally {
      reloading.value = false;
    }
  }

  if (isListMode.value) items.value = parseItems(text.value);
}

async function revealInExplorer() {
  await flush();
  windowStore.openFileInApp("fileexplorer", {
    data: { initialLocation: "storage", initialPath: NOTES_FOLDER, initialFileName: noteRelPath() },
  });
}

async function openInNotepad() {
  await flush();
  const relPath = noteRelPath();
  const filename = relPath.split("/").pop() || noteFilename();
  windowStore.openFileInApp("notepad", {
    title: `Notepad - ${filename}`,
    data: { externalFile: { path: relPath, content: text.value, source: "storage" } },
  });
}

onMounted(() => loadFromDisk());

onUnmounted(() => {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (dirty) flush();
});
</script>

<style scoped>
.notes-area::placeholder {
  color: currentColor;
  opacity: 0.4;
}
</style>
