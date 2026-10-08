<!-- homedock-ui/vue3/static/js/__Apps__/UtilsSheets.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="utils-sheets flex flex-col h-full overflow-hidden" @keydown.capture="handleKeydown">
    <div class="flex items-center gap-1 px-2 py-1.5 border-b" :class="themeClasses.utilityToolbarBorder">
      <Dropdown :trigger="['click']" placement="bottomLeft" :overlay-class-name="menuOverlayClass">
        <button :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="px-3 py-1 text-xs rounded transition-colors cursor-pointer">{{ $t("File") }}</button>
        <template #overlay>
          <Menu>
            <MenuItem key="save" :disabled="!api || saving" @click="save">
              <div class="flex items-center gap-2">
                <Icon :icon="contentSaveIcon" class="w-4 h-4" />
                <span>{{ $t("Save") }}</span>
                <span class="ml-auto text-[10px] opacity-50">Ctrl+S</span>
              </div>
            </MenuItem>
            <MenuItem key="download" :disabled="!api" @click="downloadCopy">
              <div class="flex items-center gap-2">
                <Icon :icon="downloadIcon" class="w-4 h-4" />
                <span>{{ $t("Download") }}</span>
              </div>
            </MenuItem>
            <MenuDivider />
            <MenuItem key="about" @click="showAboutDialog = true">
              <div class="flex items-center gap-2">
                <Icon :icon="aboutIcon" class="w-4 h-4" />
                <span>{{ $t("About Sheets") }}</span>
              </div>
            </MenuItem>
            <MenuItem key="exit" @click="handleExit">
              <div class="flex items-center gap-2">
                <Icon :icon="exitIcon" class="w-4 h-4" />
                <span>{{ $t("Exit") }}</span>
              </div>
            </MenuItem>
          </Menu>
        </template>
      </Dropdown>
    </div>

    <div class="flex-1 min-h-0">
      <ReactIsland name="sheets" :props="islandProps" @error="handleIslandError">
        <template #loading>
          <WindowLoading />
        </template>
        <template #error>
          <div class="flex flex-col items-center justify-center h-full gap-2 p-6 text-center">
            <Icon :icon="spreadsheetIcon" :class="['w-10 h-10 opacity-40', themeClasses.windowText]" />
            <p :class="['text-sm', themeClasses.windowText]">{{ $t("Failed to open spreadsheet") }}</p>
          </div>
        </template>
      </ReactIsland>
    </div>

    <StatusBar :icon="spreadsheetIcon" :message="statusMessage" :info="statusInfo" :loading="saving" :show-help="true">
      <template #help>
        <div class="space-y-2.5 max-w-sm">
          <div class="flex items-center gap-2">
            <StatusBarHelpIcon :icon="spreadsheetIcon" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">{{ $t("Sheets") }}</h4>
          </div>
          <div :class="['text-[10px] md:text-xs md:leading-4 space-y-2 leading-relaxed', themeClasses.statusBarInfo]">
            <p>{{ $t("Sheets opens and edits Excel spreadsheets (.xlsx). Saving writes the changes back to the same file.") }}</p>
          </div>
        </div>
      </template>
    </StatusBar>

    <UtilityAboutDialog v-model:visible="showAboutDialog" title="About Sheets" app-name="Sheets" :icon="spreadsheetIcon" :formats="ABOUT_FORMATS" :credits="ABOUT_CREDITS" />

    <SaveAsDialog v-model:visible="showSaveAsDialog" v-model:name="saveAsName" :folder="NEW_FILES_FOLDER" @confirm="confirmSaveAs" @cancel="cancelSaveAs" />

    <AppDialog v-model:visible="showUnsavedDialog" title="Unsaved Changes" :content="unsavedDialogMessage" ok-text="Save" cancel-text="Cancel" :dismiss-text="$t('Don\'t Save')" type="warning" :mask-closable="false" @ok="handleUnsavedSave" @cancel="handleUnsavedCancel" @dismiss="handleUnsavedDiscard" />
  </div>
</template>

<script lang="ts" setup>
import { ref, shallowRef, computed, onMounted, onUnmounted, watch } from "vue";
import { useI18n } from "vue-i18n";

import { Dropdown, Menu, MenuItem, MenuDivider } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import contentSaveIcon from "@iconify-icons/mdi/content-save";
import downloadIcon from "@iconify-icons/mdi/download";
import exitIcon from "@iconify-icons/mdi/exit-to-app";
import spreadsheetIcon from "@iconify-icons/mdi/file-table-box";
import aboutIcon from "@iconify-icons/mdi/information-outline";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useWindowStore } from "../__Stores__/windowStore";
import { useExternalFile, triggerDownload, NEW_FILES_FOLDER, type ExternalBinaryFile, type ExternalFileTarget } from "../__Composables__/useExternalFile";

import ReactIsland from "../__Components__/ReactIsland.vue";
import StatusBar from "../__Components__/StatusBar.vue";
import StatusBarHelpIcon from "../__Components__/StatusBarHelpIcon.vue";
import AppDialog from "../__Components__/AppDialog.vue";
import SaveAsDialog from "../__Components__/SaveAsDialog.vue";
import UtilityAboutDialog, { type UtilityFormat } from "../__Components__/UtilityAboutDialog.vue";
import WindowLoading from "../__Components__/WindowLoading.vue";

import { notifyError, notifySuccess } from "../__Components__/Notifications.vue";

import type { SheetsApi } from "../__Islands__/Sheets.island";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const ABOUT_FORMATS: UtilityFormat[] = [{ name: "Excel Workbook (.xlsx)", support: "Open and save" }];

const ABOUT_CREDITS = ["FortuneSheet", "FortuneExcel", "ExcelJS", "React"];

const props = defineProps<{ _windowId?: string; sheetsFile?: ExternalBinaryFile }>();

const { themeClasses } = useTheme();
const { t } = useI18n();
const windowStore = useWindowStore();
const { editingLabel, savedDescription, saveToSource, saveNewToStorage } = useExternalFile();

function targetOf(source: ExternalBinaryFile): ExternalFileTarget {
  const { buffer: _buffer, ...target } = source;
  return target;
}

const file = shallowRef<ExternalBinaryFile | null>(props.sheetsFile ?? null);
const target = shallowRef<ExternalFileTarget | null>(props.sheetsFile ? targetOf(props.sheetsFile) : null);
const api = shallowRef<SheetsApi | null>(null);
const isModified = ref(false);
const saving = ref(false);
const showUnsavedDialog = ref(false);
const showSaveAsDialog = ref(false);
const showAboutDialog = ref(false);
const saveAsName = ref("");
const pendingFile = shallowRef<ExternalBinaryFile | null>(null);

let resolveSaveAs: ((saved: boolean) => void) | null = null;

const fileName = computed(() => target.value?.name || `${t("New spreadsheet")}.xlsx`);

const islandProps = computed(() => ({
  source: file.value?.buffer ?? null,
  fileName: file.value?.name || "spreadsheet.xlsx",
  onReady: (next: SheetsApi) => (api.value = next),
  onDirty: () => (isModified.value = true),
  onLoadError: () => notifyError(t("Failed to open spreadsheet")),
}));

const menuOverlayClass = computed(() => (themeClasses.value.scopeSelector === "aero-mode-theme" ? "dark-mode-theme" : themeClasses.value.scopeSelector));

const statusMessage = computed(() => editingLabel(target.value?.source, t("New spreadsheet")));

const statusInfo = computed(() => `${fileName.value}${isModified.value ? " *" : ""}`);

const unsavedDialogMessage = computed(() => t('"{name}" has unsaved changes. Do you want to save before closing?', { name: fileName.value }));

function updateWindowTitle() {
  if (!props._windowId) return;
  windowStore.updateWindowTitle(props._windowId, `${t("Sheets")} - ${fileName.value}${isModified.value ? " *" : ""}`);
}

watch([fileName, isModified], updateWindowTitle);

function loadFile(next: ExternalBinaryFile) {
  api.value = null;
  isModified.value = false;
  file.value = next;
  target.value = targetOf(next);
}

function requestSaveAs(): Promise<boolean> {
  saveAsName.value = t("New spreadsheet");
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
  if (!api.value || saving.value) return;

  saving.value = true;

  try {
    const saved = await saveNewToStorage(saveAsName.value, "xlsx", await api.value.exportXlsx(), XLSX_MIME);
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
  if (!api.value || saving.value) return false;

  const current = target.value;
  if (!current?.source) return requestSaveAs();

  saving.value = true;

  try {
    await saveToSource(current, await api.value.exportXlsx(), XLSX_MIME);
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

async function downloadCopy() {
  if (!api.value) return;

  try {
    triggerDownload(await api.value.exportXlsx(), fileName.value);
  } catch {
    notifyError(t("Failed to save file"));
  }
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

function handleExit() {
  if (isModified.value) showUnsavedDialog.value = true;
  else closeWindow();
}

function handleKeydown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    event.stopPropagation();
    save();
  }
}

function handleIslandError(error: unknown) {
  console.error(error);
}

function handleIncomingFile(event: Event) {
  const incoming = (event as CustomEvent<{ sheetsFile?: ExternalBinaryFile }>).detail?.sheetsFile;
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
.utils-sheets {
  background: inherit;
}
</style>
