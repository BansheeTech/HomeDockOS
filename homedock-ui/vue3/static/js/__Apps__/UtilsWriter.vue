<!-- homedock-ui/vue3/static/js/__Apps__/UtilsWriter.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="utils-writer flex flex-col h-full overflow-hidden" @keydown.capture="handleKeydown">
    <div class="flex-1 min-h-0">
      <DocxEditor v-if="translationsLoaded" :key="editorKey" ref="editorRef" :document="documentSource" title="" :menu="false" :color-mode="colorMode" :i18n="translations" :locale="locale" @change="handleChange">
        <template #titleBarLeft>
          <DocxEditorMenu :key="menuLanguage" :file-name="fileName" :report-issue="false" :on-save="save">
            <MenuFile :preset="false">
              <MenuSave />
              <MenuPageSetup />
              <MenuSeparator />
              <MenuRow :select-handler="openAbout">{{ $t("About Writer") }}</MenuRow>
            </MenuFile>
          </DocxEditorMenu>
        </template>
      </DocxEditor>
      <WindowLoading v-else />
    </div>

    <StatusBar :icon="documentIcon" :message="statusMessage" :info="statusInfo" :loading="saving" :show-help="true">
      <template #help>
        <div class="space-y-2.5 max-w-sm">
          <div class="flex items-center gap-2">
            <StatusBarHelpIcon :icon="documentIcon" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">{{ $t("Writer") }}</h4>
          </div>
          <div :class="['text-[10px] md:text-xs md:leading-4 space-y-2 leading-relaxed', themeClasses.statusBarInfo]">
            <p>{{ $t("Writer opens and edits Word documents (.docx). Saving writes the changes back to the same file.") }}</p>
          </div>
        </div>
      </template>
    </StatusBar>

    <UtilityAboutDialog v-model:visible="showAboutDialog" title="About Writer" app-name="Writer" :icon="documentIcon" :formats="ABOUT_FORMATS" :credits="ABOUT_CREDITS" />

    <SaveAsDialog v-model:visible="showSaveAsDialog" v-model:name="saveAsName" :folder="NEW_FILES_FOLDER" @confirm="confirmSaveAs" @cancel="cancelSaveAs" />

    <AppDialog v-model:visible="showUnsavedDialog" title="Unsaved Changes" :content="unsavedDialogMessage" ok-text="Save" cancel-text="Cancel" :dismiss-text="$t('Don\'t Save')" type="warning" :mask-closable="false" @ok="handleUnsavedSave" @cancel="handleUnsavedCancel" @dismiss="handleUnsavedDiscard" />
  </div>
</template>

<script lang="ts" setup>
import { ref, shallowRef, computed, inject, onMounted, onUnmounted, watch } from "vue";
import { useI18n } from "vue-i18n";

import { DocxEditor, DocxEditorMenu, type DocxEditorRef } from "@docx-editor.dev/vue";
import type { PartialLocaleStrings } from "@docx-editor.dev/i18n";
import "@docx-editor.dev/vue/styles.css";

import documentIcon from "@iconify-icons/mdi/file-document-edit";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useWindowStore } from "../__Stores__/windowStore";
import { useExternalFile, NEW_FILES_FOLDER, type ExternalBinaryFile, type ExternalFileTarget } from "../__Composables__/useExternalFile";

import StatusBar from "../__Components__/StatusBar.vue";
import StatusBarHelpIcon from "../__Components__/StatusBarHelpIcon.vue";
import AppDialog from "../__Components__/AppDialog.vue";
import SaveAsDialog from "../__Components__/SaveAsDialog.vue";
import UtilityAboutDialog, { type UtilityFormat } from "../__Components__/UtilityAboutDialog.vue";
import WindowLoading from "../__Components__/WindowLoading.vue";

import { notifyError, notifySuccess } from "../__Components__/Notifications.vue";

import type { ThemeData } from "../__Types__/ThemeData";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const EDITOR_LOCALES: Record<string, () => Promise<{ default: PartialLocaleStrings }>> = {
  de: () => import("@docx-editor.dev/i18n/de"),
  es: () => import("@docx-editor.dev/i18n/es"),
  fr: () => import("@docx-editor.dev/i18n/fr"),
  pt: () => import("@docx-editor.dev/i18n/pt-BR"),
  zh: () => import("@docx-editor.dev/i18n/zh-CN"),
};

const MenuFile = DocxEditorMenu.File;
const MenuSave = DocxEditorMenu.Save;
const MenuPageSetup = DocxEditorMenu.PageSetup;
const MenuSeparator = DocxEditorMenu.Separator;
const MenuRow = DocxEditorMenu.Row;

const ABOUT_FORMATS: UtilityFormat[] = [{ name: "Word Document (.docx)", support: "Open and save" }];

const ABOUT_CREDITS = ["docx-editor", "ProseMirror"];

const props = defineProps<{ _windowId?: string; writerFile?: ExternalBinaryFile }>();

const { themeClasses } = useTheme();
const { t, locale } = useI18n();
const windowStore = useWindowStore();
const themeData = inject<ThemeData | null>("data-theme", null);
const { editingLabel, savedDescription, saveToSource, saveNewToStorage } = useExternalFile();

function targetOf(source: ExternalBinaryFile): ExternalFileTarget {
  const { buffer: _buffer, ...target } = source;
  return target;
}

const editorRef = ref<DocxEditorRef | null>(null);
const documentBuffer = shallowRef<ArrayBuffer | null>(props.writerFile?.buffer ?? null);
const target = shallowRef<ExternalFileTarget | null>(props.writerFile ? targetOf(props.writerFile) : null);
const editorKey = ref(0);
const isModified = ref(false);
const saving = ref(false);
const showUnsavedDialog = ref(false);
const showSaveAsDialog = ref(false);
const showAboutDialog = ref(false);
const saveAsName = ref("");
const pendingFile = shallowRef<ExternalBinaryFile | null>(null);
const translations = shallowRef<PartialLocaleStrings | undefined>(undefined);
const translationsLoaded = ref(false);

let resolveSaveAs: ((saved: boolean) => void) | null = null;

const menuLanguage = computed(() => translations.value?._lang ?? "en");

const documentSource = computed(() => documentBuffer.value ?? "blank");

const fileName = computed(() => target.value?.name || `${t("New document")}.docx`);

const colorMode = computed(() => (themeData?.selected_theme === "noir" || themeData?.selected_theme === "aeroplus" ? "dark" : "light"));

const statusMessage = computed(() => editingLabel(target.value?.source, t("New document")));

const statusInfo = computed(() => `${fileName.value}${isModified.value ? " *" : ""}`);

const unsavedDialogMessage = computed(() => t('"{name}" has unsaved changes. Do you want to save before closing?', { name: fileName.value }));

async function loadTranslations(language: string) {
  const loader = EDITOR_LOCALES[language.split("-")[0]];

  try {
    translations.value = loader ? (await loader()).default : undefined;
  } catch {
    translations.value = undefined;
  } finally {
    translationsLoaded.value = true;
  }
}

watch(locale, (next) => loadTranslations(next), { immediate: true });

function updateWindowTitle() {
  if (!props._windowId) return;
  windowStore.updateWindowTitle(props._windowId, `${t("Writer")} - ${fileName.value}${isModified.value ? " *" : ""}`);
}

watch([fileName, isModified], updateWindowTitle);

function handleChange(change: { source?: string }) {
  if (!change.source) isModified.value = true;
}

function loadFile(next: ExternalBinaryFile) {
  isModified.value = false;
  documentBuffer.value = next.buffer;
  target.value = targetOf(next);
  editorKey.value += 1;
}

async function exportDocument(): Promise<Blob> {
  const buffer = await editorRef.value?.save();
  if (!buffer) throw new Error(t("Failed to save file"));

  return new Blob([buffer], { type: DOCX_MIME });
}

function requestSaveAs(): Promise<boolean> {
  saveAsName.value = t("New document");
  showSaveAsDialog.value = true;

  return new Promise((resolve) => {
    resolveSaveAs = resolve;
  });
}

function settleSaveAs(saved: boolean) {
  showSaveAsDialog.value = false;
  resolveSaveAs?.(saved);
  resolveSaveAs = null;
}

async function confirmSaveAs() {
  if (saving.value) return;

  saving.value = true;

  try {
    const saved = await saveNewToStorage(saveAsName.value, "docx", await exportDocument(), DOCX_MIME);
    target.value = saved;
    isModified.value = false;
    notifySuccess(t("File saved"), savedDescription(saved), themeClasses.value.scopeSelector);
    settleSaveAs(true);
  } catch (error: any) {
    notifyError(t(error.response?.data?.error || error.message || "Failed to save file"));
  } finally {
    saving.value = false;
  }
}

function cancelSaveAs() {
  settleSaveAs(false);
}

async function save(): Promise<boolean> {
  if (!editorRef.value || saving.value) return false;

  const current = target.value;
  if (!current?.source) return requestSaveAs();

  saving.value = true;

  try {
    await saveToSource(current, await exportDocument(), DOCX_MIME);
    notifySuccess(t("File saved"), savedDescription(current), themeClasses.value.scopeSelector);
    isModified.value = false;
    return true;
  } catch (error: any) {
    notifyError(t(error.response?.data?.error || error.message || "Failed to save file"));
    return false;
  } finally {
    saving.value = false;
  }
}

function openAbout() {
  showAboutDialog.value = true;
}

function closeWindow() {
  if (props._windowId) windowStore.closeWindow(props._windowId);
}

function continueAfterUnsaved() {
  const next = pendingFile.value;
  pendingFile.value = null;

  if (next) loadFile(next);
  else closeWindow();
}

async function handleUnsavedSave() {
  showUnsavedDialog.value = false;
  if (await save()) continueAfterUnsaved();
}

function handleUnsavedDiscard() {
  showUnsavedDialog.value = false;
  isModified.value = false;
  continueAfterUnsaved();
}

function handleUnsavedCancel() {
  showUnsavedDialog.value = false;
  pendingFile.value = null;
}

function handleKeydown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "s") {
    event.preventDefault();
    event.stopPropagation();
    save();
  }
}

function handleIncomingFile(event: Event) {
  const incoming = (event as CustomEvent<{ writerFile?: ExternalBinaryFile }>).detail?.writerFile;
  if (!incoming) return;

  if (isModified.value) {
    pendingFile.value = incoming;
    showUnsavedDialog.value = true;
  } else {
    loadFile(incoming);
  }
}

function handleWindowCloseRequest(event: Event) {
  if (!isModified.value) return;

  event.preventDefault();
  pendingFile.value = null;
  showUnsavedDialog.value = true;
}

onMounted(() => {
  updateWindowTitle();

  if (props._windowId) {
    window.addEventListener(`homedock:open-file-${props._windowId}`, handleIncomingFile);
    window.addEventListener(`homedock:request-close-${props._windowId}`, handleWindowCloseRequest);
  }
});

onUnmounted(() => {
  if (props._windowId) {
    window.removeEventListener(`homedock:open-file-${props._windowId}`, handleIncomingFile);
    window.removeEventListener(`homedock:request-close-${props._windowId}`, handleWindowCloseRequest);
  }
});
</script>

<style scoped>
.utils-writer {
  background: inherit;
}

.utils-writer :deep(.docx-font-notice) {
  display: none;
}
</style>
