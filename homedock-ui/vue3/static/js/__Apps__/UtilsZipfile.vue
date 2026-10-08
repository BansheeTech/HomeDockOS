<!-- homedock-ui/vue3/static/js/__Apps__/UtilsZipfile.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="zipfile flex flex-col h-full overflow-hidden" @dragenter.prevent.stop="onDragEnter" @dragover.prevent.stop="onDragOver" @dragleave.stop="onDragLeave" @drop.prevent.stop="onDrop">
    <div v-if="listing || loading" class="zipfile-toolbar flex items-center gap-2 px-3 h-12 border-b flex-shrink-0" :class="themeClasses.utilityToolbarBorder">
      <div class="relative flex items-center flex-1 min-w-0 max-w-[260px]">
        <Icon :icon="searchIcon" :class="[themeClasses.explorerSearchIcon]" class="absolute left-2 w-3.5 h-3.5 pointer-events-none" />
        <input v-model="query" type="text" :disabled="!listing" :placeholder="$t('Search in archive')" autocomplete="off" spellcheck="false" :class="[themeClasses.explorerSearchInput, themeClasses.explorerSearchInputText, themeClasses.explorerSearchInputFocusRing]" class="w-full h-7 pl-7 pr-6 rounded-md border text-xs outline-hidden transition-all duration-150 disabled:opacity-50" @keydown.esc="onSearchEscape" />
        <button v-if="query" type="button" :aria-label="$t('Clear')" :class="[themeClasses.explorerClearButton, themeClasses.explorerClearButtonHover]" class="absolute right-1 flex items-center justify-center w-5 h-5 rounded border-0 bg-transparent cursor-pointer" @click="query = ''">
          <Icon :icon="closeIcon" class="w-3 h-3" />
        </button>
      </div>

      <div class="flex-1"></div>

      <Transition name="pill-swap" mode="out-in">
        <div v-if="activeJob" key="progress" class="flex items-center gap-2.5 flex-shrink-0">
          <div class="zipfile-progress-text flex flex-col items-end min-w-0">
            <span :class="[themeClasses.storeModalAppName]" class="text-[11px] font-semibold leading-tight tabular-nums">{{ $t("Extracting…") }} {{ jobPercentLabel }}</span>
            <span :class="[themeClasses.storeCardSubtitle]" class="text-[10px] leading-tight tabular-nums">{{ jobDetailLabel }}</span>
          </div>
          <div :class="[themeClasses.storeInfoBarDivider]" class="zipfile-progress-track relative w-24 h-1.5 rounded-full overflow-hidden">
            <div v-if="jobPercent === null" class="zipfile-indeterminate absolute inset-y-0 w-1/3 rounded-full bg-blue-500"></div>
            <div v-else class="absolute inset-y-0 left-0 rounded-full bg-blue-500 transition-[width] duration-300 ease-out" :style="{ width: `${jobPercent}%` }"></div>
          </div>
          <button type="button" :title="$t('Cancel')" :aria-label="$t('Cancel')" :class="[themeClasses.windowText, themeClasses.windowButtonBgHover]" class="flex items-center justify-center w-6 h-6 rounded-full border-0 bg-transparent cursor-pointer transition-colors" @click="cancelJob">
            <Icon :icon="closeCircleIcon" class="w-4 h-4 opacity-70" />
          </button>
        </div>

        <button v-else-if="lastResult" key="reveal" type="button" :title="$t('Show in File Explorer')" :class="[themeClasses.storeCardInstalledPill]" class="zipfile-pill flex items-center justify-center gap-1.5 h-7 px-3.5 rounded-full border-0 text-xs font-semibold cursor-pointer flex-shrink-0 transition-colors duration-150" @click="revealResult">
          <Icon :icon="checkIcon" class="w-3.5 h-3.5 flex-shrink-0" />
          <span class="zipfile-pill-label">{{ $t("Show in File Explorer") }}</span>
        </button>

        <button v-else-if="mode === 'local'" key="save" type="button" :disabled="saving" :title="$t('Save to Archives')" :class="[themeClasses.storeCardGetPill]" class="zipfile-pill flex items-center justify-center gap-1.5 h-7 px-3.5 rounded-full border-0 text-xs font-semibold cursor-pointer flex-shrink-0 transition-colors duration-150 disabled:cursor-default disabled:opacity-60" @click="saveLocalArchive">
          <Icon :icon="saving ? loadingIcon : saveIcon" :class="saving && 'animate-spin'" class="w-3.5 h-3.5 flex-shrink-0" />
          <span class="zipfile-pill-label">{{ $t("Save to Archives") }}</span>
        </button>

        <button v-else key="extract" type="button" :disabled="!canExtract" :title="extractLabel" :class="[themeClasses.storeCardGetPill]" class="zipfile-pill flex items-center justify-center gap-1.5 h-7 px-3.5 rounded-full border-0 text-xs font-semibold cursor-pointer flex-shrink-0 transition-colors duration-150 disabled:cursor-default disabled:opacity-50" @click="extract(selectedForExtraction)">
          <Icon :icon="extractIcon" class="w-3.5 h-3.5 flex-shrink-0" />
          <span class="zipfile-pill-label">{{ extractLabel }}</span>
        </button>
      </Transition>
    </div>

    <Transition name="bar-reveal">
      <form v-if="needsPassword" class="zipfile-password flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 border-b flex-shrink-0" :class="[themeClasses.utilityToolbarBorder, themeClasses.storeInfoBar]" @submit.prevent="unlock">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <AppIconGraphic :icon="lockIcon" color="#f59e0b" :size="28" />
          <div class="min-w-0">
            <p :class="[themeClasses.storeModalAppName]" class="m-0 text-xs font-semibold truncate">{{ $t("This archive is password-protected") }}</p>
            <p :class="[passwordError ? 'text-red-500' : themeClasses.storeCardSubtitle]" class="m-0 text-[11px] truncate">{{ passwordError ? $t(passwordError) : $t("Enter the password to open or extract its files.") }}</p>
          </div>
        </div>
        <div class="zipfile-password-fields flex items-center gap-2 ml-auto">
          <input ref="passwordInputRef" v-model="passwordDraft" type="password" :maxlength="MAX_UNLOCK_PASSWORD_LENGTH" autocomplete="off" :placeholder="$t('Password')" :class="[themeClasses.explorerSearchInput, themeClasses.explorerSearchInputText, themeClasses.explorerSearchInputFocusRing, shakePassword && 'zipfile-shake']" class="zipfile-password-input w-44 h-7 px-2.5 rounded-md border text-xs outline-hidden transition-all duration-150" @animationend="shakePassword = false" />
          <button type="submit" :disabled="!passwordDraft || unlocking" :class="[themeClasses.storeCardGetPill]" class="flex items-center justify-center gap-1.5 h-7 px-3.5 rounded-full border-0 text-xs font-semibold cursor-pointer flex-shrink-0 transition-colors duration-150 disabled:cursor-default disabled:opacity-50">
            <Icon v-if="unlocking" :icon="loadingIcon" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ $t("Unlock") }}</span>
          </button>
        </div>
      </form>
    </Transition>

    <div class="relative flex-1 min-h-0 flex flex-col">
      <Transition name="drop-fade">
        <div v-if="isDragOver" class="absolute inset-3 z-20 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-blue-500 bg-blue-500/10 pointer-events-none">
          <Icon :icon="zipIcon" class="w-10 h-10 text-blue-500" />
          <span class="text-sm font-semibold text-blue-500">{{ $t("Drop to open") }}</span>
        </div>
      </Transition>

      <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
        <div class="flex flex-col items-center gap-3">
          <Icon :icon="loadingIcon" class="w-8 h-8 animate-spin" :class="themeClasses.windowTextMuted" />
          <span :class="['text-sm', themeClasses.windowTextMuted]">{{ $t("Reading archive…") }}</span>
        </div>
      </div>

      <div v-else-if="errorCode" class="absolute inset-0 flex items-center justify-center">
        <div class="flex flex-col items-center gap-3 text-center p-8">
          <div :class="isBlocked ? 'bg-amber-500/10' : 'bg-red-500/10'" class="w-16 h-16 rounded-2xl flex items-center justify-center">
            <Icon :icon="isBlocked ? shieldAlertIcon : alertIcon" :class="isBlocked ? 'text-amber-500' : 'text-red-500'" class="w-8 h-8" />
          </div>
          <h3 :class="['text-lg font-medium m-0', themeClasses.windowText]">{{ isBlocked ? $t("Archive Blocked") : $t("Can't Open Archive") }}</h3>
          <p :class="['text-sm max-w-xs m-0', themeClasses.windowTextMuted]">{{ $t(archiveErrorMessage(errorCode)) }}</p>
          <button v-if="errorCode === 'unlock_required' && fileRef" type="button" :class="[themeClasses.storeCardGetPill]" class="flex items-center gap-1.5 h-8 mt-1 px-4 rounded-full border-0 text-xs font-semibold cursor-pointer transition-colors duration-150" @click="revealArchive">
            <Icon :icon="folderOpenIcon" class="w-4 h-4" />
            {{ $t("Show in File Explorer") }}
          </button>
          <button v-else type="button" :class="[themeClasses.storeCardGetPill]" class="flex items-center gap-1.5 h-8 mt-1 px-4 rounded-full border-0 text-xs font-semibold cursor-pointer transition-colors duration-150" @click="browseArchives">
            <Icon :icon="folderFileIcon" class="w-4 h-4" />
            {{ $t("Browse Archives") }}
          </button>
        </div>
      </div>

      <div v-else-if="!listing" class="absolute inset-0 flex items-center justify-center">
        <div class="flex flex-col items-center gap-3 text-center p-8">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center" :class="themeClasses.imageViewerBg">
            <Icon :icon="zipIcon" class="w-8 h-8" :class="themeClasses.windowTextMuted" />
          </div>
          <h3 :class="['text-lg font-medium m-0', themeClasses.windowText]">{{ $t("No Archive") }}</h3>
          <p :class="['text-sm max-w-xs m-0', themeClasses.windowTextMuted]">{{ $t("Open a ZIP or TAR archive to see what's inside.") }}</p>
          <button type="button" :class="[themeClasses.storeCardGetPill]" class="flex items-center gap-1.5 h-8 mt-1 px-4 rounded-full border-0 text-xs font-semibold cursor-pointer transition-colors duration-150" @click="browseArchives">
            <Icon :icon="folderFileIcon" class="w-4 h-4" />
            {{ $t("Browse Archives") }}
          </button>
          <span :class="['text-xs', themeClasses.windowTextMuted]">{{ $t("or drop a ZIP here") }}</span>
        </div>
      </div>

      <template v-else>
        <div :class="[themeClasses.storeListSeparator, themeClasses.storeCardSubtitle]" class="zipfile-columns flex items-center h-7 pl-3 pr-3 border-b text-[11px] font-medium flex-shrink-0 select-none">
          <button type="button" class="zipfile-col-name flex items-center gap-1 flex-1 min-w-0 h-full bg-transparent border-0 p-0 text-left cursor-pointer" :class="[themeClasses.storeCardSubtitle]" @click="setSort('name')">
            <span>{{ $t("Name") }}</span>
            <Icon v-if="sortKey === 'name'" :icon="sortAsc ? chevronUpIcon : chevronDownIcon" class="w-3.5 h-3.5" />
          </button>
          <button type="button" class="zipfile-col-size flex items-center justify-end gap-1 h-full bg-transparent border-0 p-0 cursor-pointer" :class="[themeClasses.storeCardSubtitle]" @click="setSort('size')">
            <Icon v-if="sortKey === 'size'" :icon="sortAsc ? chevronUpIcon : chevronDownIcon" class="w-3.5 h-3.5" />
            <span>{{ $t("Size") }}</span>
          </button>
          <button type="button" class="zipfile-col-date flex items-center gap-1 h-full bg-transparent border-0 p-0 cursor-pointer" :class="[themeClasses.storeCardSubtitle]" @click="setSort('modified')">
            <span>{{ $t("Modified") }}</span>
            <Icon v-if="sortKey === 'modified'" :icon="sortAsc ? chevronUpIcon : chevronDownIcon" class="w-3.5 h-3.5" />
          </button>
        </div>

        <div ref="scrollRef" tabindex="0" class="zipfile-scroll flex-1 min-h-0 overflow-y-auto outline-hidden" @keydown="onListKeydown" @click.self="clearSelection" @contextmenu.prevent.self="openBlankMenu">
          <div v-if="rows.length" :style="{ height: `${virtualizer.getTotalSize()}px` }" class="relative w-full" @click.self="clearSelection" @contextmenu.prevent.self="openBlankMenu">
            <div v-for="virtualRow in virtualizer.getVirtualItems()" :key="rows[virtualRow.index].entry.path" :class="[selection.has(rows[virtualRow.index].entry.path) ? themeClasses.desktopIconBgSelected : themeClasses.storeRowHover, rows[virtualRow.index].entry.skip && 'opacity-50']" class="zipfile-row absolute left-1.5 right-1.5 flex items-center pl-1.5 pr-1.5 rounded-md cursor-default" :style="{ top: 0, height: `${ROW_HEIGHT}px`, transform: `translateY(${virtualRow.start}px)` }" @click="onRowClick(rows[virtualRow.index], $event)" @dblclick="onRowDoubleClick(rows[virtualRow.index])" @touchstart.passive="onRowTouchStart" @touchmove.passive="onRowTouchMove" @touchend="onRowTouchEnd(rows[virtualRow.index], $event)" @contextmenu.prevent.stop="openRowMenu(rows[virtualRow.index], $event)">
              <div class="zipfile-col-name flex items-center gap-1.5 flex-1 min-w-0 h-full" :style="{ paddingLeft: `${rows[virtualRow.index].depth * INDENT}px` }">
                <button v-if="rows[virtualRow.index].entry.is_dir && !query" type="button" tabindex="-1" :aria-label="expanded.has(rows[virtualRow.index].entry.path) ? $t('Collapse') : $t('Expand')" :class="[themeClasses.windowTextMuted]" class="flex items-center justify-center w-4 h-4 flex-shrink-0 border-0 bg-transparent p-0 cursor-pointer" @click.stop="toggleFolder(rows[virtualRow.index].entry.path)" @dblclick.stop @touchend.stop>
                  <Icon :icon="chevronRightIcon" :class="expanded.has(rows[virtualRow.index].entry.path) && 'rotate-90'" class="w-4 h-4 transition-transform duration-150" />
                </button>
                <span v-else class="w-4 flex-shrink-0"></span>

                <span class="relative flex-shrink-0">
                  <FolderGraphic v-if="rows[virtualRow.index].entry.is_dir" :size="20" :open="expanded.has(rows[virtualRow.index].entry.path)" />
                  <FileGraphic v-else :name="rows[virtualRow.index].entry.name" :size="20" />
                  <span v-if="openingPath === rows[virtualRow.index].entry.path" class="absolute inset-0 flex items-center justify-center">
                    <Icon :icon="loadingIcon" class="w-3.5 h-3.5 animate-spin text-blue-500" />
                  </span>
                  <Icon v-else-if="rows[virtualRow.index].entry.encrypted && !passwordVerified" :icon="lockIcon" class="absolute -right-1 -bottom-0.5 w-2.5 h-2.5 text-amber-500" />
                </span>

                <span class="flex flex-col min-w-0 flex-1">
                  <span :class="[themeClasses.dropZoneFileText]" class="text-xs truncate leading-tight">{{ rows[virtualRow.index].entry.name }}</span>
                  <span v-if="query && parentFolder(rows[virtualRow.index].entry.path)" :class="[themeClasses.storeCardSubtitle]" class="text-[10px] truncate leading-tight">{{ parentFolder(rows[virtualRow.index].entry.path) }}</span>
                </span>

                <Icon v-if="rows[virtualRow.index].entry.skip" :icon="shieldAlertIcon" :title="$t(skipReasonLabel(rows[virtualRow.index].entry.skip!))" class="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
              </div>

              <span :class="[themeClasses.storeCardSubtitle]" class="zipfile-col-size text-[11px] text-right tabular-nums truncate">{{ sizeLabel(rows[virtualRow.index]) }}</span>
              <span :class="[themeClasses.storeCardSubtitle]" class="zipfile-col-date text-[11px] tabular-nums truncate">{{ dateLabel(rows[virtualRow.index].entry.modified) }}</span>
            </div>
          </div>

          <div v-else class="flex flex-col items-center justify-center h-full gap-1 p-6 text-center">
            <p :class="[themeClasses.windowText]" class="m-0 text-sm font-medium">{{ query ? $t("No results") : $t("This archive is empty") }}</p>
            <p v-if="query" :class="[themeClasses.windowTextMuted]" class="m-0 text-xs">{{ $t("Nothing in this archive matches “{query}”.", { query }) }}</p>
          </div>
        </div>
      </template>
    </div>

    <StatusBar :icon="zipIcon" :message="statusMessage" :info="statusInfo" :show-help="true">
      <template v-if="listing && (listing.skipped > 0 || (listing.encrypted && passwordVerified))" #extra>
        <div v-if="listing.skipped > 0" :title="$t('Unsafe items are never extracted')" class="flex items-center gap-1 text-amber-500 text-[10px]">
          <Icon :icon="shieldAlertIcon" class="w-3.5 h-3.5" />
          <span>{{ $t("{n} skipped", { n: listing.skipped }) }}</span>
        </div>
        <div v-else class="flex items-center gap-1 text-green-500 text-[10px]">
          <Icon :icon="lockOpenIcon" class="w-3.5 h-3.5" />
          <span>{{ $t("Unlocked") }}</span>
        </div>
      </template>
      <template #help>
        <div class="space-y-3 max-w-sm">
          <div class="flex items-center gap-2">
            <StatusBarHelpIcon :icon="zipIcon" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">{{ $t("Zipfile") }}</h4>
          </div>
          <div :class="['text-[10px] md:text-xs md:leading-4 space-y-2.5 leading-relaxed', themeClasses.statusBarInfo]">
            <p>{{ $t("Zipfile opens ZIP and TAR archives so you can look inside, open single files and extract them next to the archive.") }}</p>
            <div class="space-y-1.5">
              <div class="flex items-start gap-2">
                <Icon :icon="shieldCheckIcon" class="w-3.5 h-3.5 mt-0.5 text-green-500 flex-shrink-0" />
                <p>{{ $t("Safe: items that would escape the destination, links and archives that expand to absurd sizes are never extracted.") }}</p>
              </div>
              <div class="flex items-start gap-2">
                <Icon :icon="lockIcon" class="w-3.5 h-3.5 mt-0.5 text-amber-500 flex-shrink-0" />
                <p>{{ $t("Encrypted: password-protected ZIP files are supported, both AES and the older ZipCrypto.") }}</p>
              </div>
              <div class="flex items-start gap-2">
                <Icon :icon="extractIcon" class="w-3.5 h-3.5 mt-0.5 text-blue-500 flex-shrink-0" />
                <p>{{ $t("Extract: select items to extract only those, or extract everything at once.") }}</p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </StatusBar>

    <ContextMenu :items="menuItems" :visible="menuVisible" :x="menuX" :y="menuY" @close="menuVisible = false" @item-click="menuVisible = false" />

    <DisksPlusDangerAuthModal v-if="!explorerOpen" />
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";

import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useVirtualizer } from "@tanstack/vue-virtual";
import { message } from "ant-design-vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useDangerAuth } from "../__Composables__/useDangerAuth";
import { triggerDownload } from "../__Composables__/useExternalFile";
import { useWindowStore } from "../__Stores__/windowStore";
import { useDisksPlusStore } from "../__Stores__/useDisksPlusStore";
import { announceFilesChanged, useArchiveJobsStore } from "../__Stores__/useArchiveJobsStore";
import { BROWSER_IMAGE_EXTENSIONS } from "../__Composables__/useThumbnails";
import { CODE_EXTENSIONS, MEDIA_EXTENSIONS, PDF_EXTENSIONS, SHEETS_EXTENSIONS, TEXT_EXTENSIONS, WRITER_EXTENSIONS } from "../__Config__/FileAssociations";
import { fileExtension } from "../__Config__/FileIcons";
import { MAX_UNLOCK_PASSWORD_LENGTH, archiveErrorCode, archiveErrorMessage, isZipName, listArchive, normalizeBinaryError, parentFolder, readArchiveEntry, startExtract, type ArchiveEntry, type ArchiveFileRef, type ArchiveListing, type ArchiveSkipReason } from "../__Utils__/ArchiveClient";
import { LocalArchiveError, openLocalArchive, type LocalArchive } from "../__Utils__/ArchiveLocal";
import { uniqueStorageName, uploadToStorage } from "../__Utils__/StorageUpload";

import StatusBar from "../__Components__/StatusBar.vue";
import StatusBarHelpIcon from "../__Components__/StatusBarHelpIcon.vue";
import ContextMenu, { type ContextMenuItem } from "../__Components__/ContextMenu.vue";
import AppIconGraphic from "../__Components__/AppIconGraphic.vue";
import FolderGraphic from "../__Components__/FolderGraphic.vue";
import FileGraphic from "../__Components__/FileGraphic.vue";
import DisksPlusDangerAuthModal from "../__Components__/DisksPlusDangerAuthModal.vue";

import { Icon } from "@iconify/vue";
import zipIcon from "@iconify-icons/mdi/zip-box";
import searchIcon from "@iconify-icons/mdi/magnify";
import closeIcon from "@iconify-icons/mdi/close";
import closeCircleIcon from "@iconify-icons/mdi/close-circle";
import loadingIcon from "@iconify-icons/mdi/loading";
import alertIcon from "@iconify-icons/mdi/alert-circle-outline";
import shieldAlertIcon from "@iconify-icons/mdi/shield-alert-outline";
import shieldCheckIcon from "@iconify-icons/mdi/shield-check-outline";
import lockIcon from "@iconify-icons/mdi/lock";
import lockOpenIcon from "@iconify-icons/mdi/lock-open-variant-outline";
import folderFileIcon from "@iconify-icons/mdi/folder-file";
import folderOpenIcon from "@iconify-icons/mdi/folder-open";
import extractIcon from "@iconify-icons/mdi/archive-arrow-up-outline";
import saveIcon from "@iconify-icons/mdi/content-save-outline";
import checkIcon from "@iconify-icons/mdi/check";
import chevronRightIcon from "@iconify-icons/mdi/chevron-right";
import chevronUpIcon from "@iconify-icons/mdi/chevron-up";
import chevronDownIcon from "@iconify-icons/mdi/chevron-down";
import openIcon from "@iconify-icons/mdi/open-in-app";
import downloadIcon from "@iconify-icons/mdi/download";
import expandIcon from "@iconify-icons/mdi/unfold-more-horizontal";
import collapseIcon from "@iconify-icons/mdi/unfold-less-horizontal";

interface Row {
  entry: ArchiveEntry;
  depth: number;
  childCount: number;
}

type SortKey = "name" | "size" | "modified";

const props = defineProps<{
  _windowId?: string;
  archiveFile?: ArchiveFileRef;
  localFile?: File;
}>();

const ROW_HEIGHT = 30;
const INDENT = 16;
const ARCHIVES_FOLDER = "Archives";
const RESULT_VISIBLE_MS = 8000;
const DOUBLE_TAP_THRESHOLD = 300;
const DOUBLE_TAP_DISTANCE = 30;
const TAP_MOVE_THRESHOLD = 10;
const BLOCKING_ERRORS = new Set(["suspicious_ratio", "overlapping_entries", "too_many_entries"]);

const SKIP_REASONS: Record<ArchiveSkipReason, string> = {
  unsafe_path: "Skipped: this item would be written outside the destination folder",
  reserved_name: "Skipped: this name is reserved by the system",
  invalid_name: "Skipped: this name contains characters that aren't allowed",
  duplicate: "Skipped: another item already has this name",
  conflict: "Skipped: a file and a folder share this name",
  link: "Skipped: links are never extracted",
  special_file: "Skipped: device and special files are never extracted",
  suspicious_ratio: "Skipped: this item expands to a suspicious size",
  encrypted_unsupported: "Skipped: this item uses an encryption method that isn't supported",
};

const { themeClasses } = useTheme();
const { t, locale } = useI18n();
const csrfToken = useCsrfToken();
const windowStore = useWindowStore();
const disksPlusStore = useDisksPlusStore();
const jobsStore = useArchiveJobsStore();
const { withDangerCheck } = useDangerAuth();

const mode = ref<"empty" | "server" | "local">("empty");
const fileRef = ref<ArchiveFileRef | null>(null);
const localArchive = shallowRef<LocalArchive | null>(null);
const localFileRef = shallowRef<File | null>(null);
const listing = shallowRef<ArchiveListing | null>(null);
const loading = ref(false);
const errorCode = ref<string | null>(null);

const password = ref("");
const passwordDraft = ref("");
const passwordVerified = ref(false);
const passwordError = ref("");
const unlocking = ref(false);
const shakePassword = ref(false);
const passwordInputRef = ref<HTMLInputElement | null>(null);

const expanded = ref(new Set<string>());
const selection = ref(new Set<string>());
const anchorPath = ref<string | null>(null);
const query = ref("");
const sortKey = ref<SortKey>("name");
const sortAsc = ref(true);
const openingPath = ref<string | null>(null);
const saving = ref(false);

const jobId = ref<string | null>(null);
const lastResult = ref<{ path: string; name: string } | null>(null);
let resultTimer: ReturnType<typeof setTimeout> | null = null;

const menuVisible = ref(false);
const menuX = ref(0);
const menuY = ref(0);
const menuItems = ref<ContextMenuItem[]>([]);

const isDragOver = ref(false);
let dragDepth = 0;
let loadToken = 0;
let tapStartX = 0;
let tapStartY = 0;
let tapMoved = false;
let lastTapPath: string | null = null;
let lastTapTime = 0;
let lastTapX = 0;
let lastTapY = 0;

const scrollRef = ref<HTMLElement | null>(null);
const originalWindowTitle = ref(props._windowId ? windowStore.getWindowById(props._windowId)?.title || "" : "");

const explorerOpen = computed(() => windowStore.windows.some((win) => win.appId === "fileexplorer"));
const isBlocked = computed(() => !!errorCode.value && BLOCKING_ERRORS.has(errorCode.value));
const needsPassword = computed(() => !!listing.value?.encrypted && !passwordVerified.value && !loading.value && !errorCode.value);

const entriesByPath = computed(() => new Map((listing.value?.entries ?? []).map((entry) => [entry.path, entry])));

const childrenByParent = computed(() => {
  const map = new Map<string, ArchiveEntry[]>();
  for (const entry of listing.value?.entries ?? []) {
    const parent = parentFolder(entry.path);
    pushChild(map, parent && entriesByPath.value.has(parent) ? parent : "", entry);
  }
  for (const list of map.values()) list.sort(compareEntries);
  return map;
});

function pushChild(map: Map<string, ArchiveEntry[]>, parent: string, entry: ArchiveEntry) {
  const list = map.get(parent);
  if (list) list.push(entry);
  else map.set(parent, [entry]);
}

const folderSizes = computed(() => {
  const sizes = new Map<string, number>();
  for (const entry of listing.value?.entries ?? []) {
    if (entry.is_dir) continue;
    const parts = entry.path.split("/");
    for (let depth = 1; depth < parts.length; depth++) {
      const folder = parts.slice(0, depth).join("/");
      sizes.set(folder, (sizes.get(folder) ?? 0) + entry.size);
    }
  }
  return sizes;
});

function compareEntries(a: ArchiveEntry, b: ArchiveEntry): number {
  if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1;
  let result = 0;
  if (sortKey.value === "size") result = entrySize(a) - entrySize(b);
  else if (sortKey.value === "modified") result = (a.modified ?? 0) - (b.modified ?? 0);
  if (result === 0) result = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
  return sortAsc.value ? result : -result;
}

function entrySize(entry: ArchiveEntry): number {
  return entry.is_dir ? (folderSizes.value.get(entry.path) ?? 0) : entry.size;
}

const rows = computed<Row[]>(() => {
  if (!listing.value) return [];
  const needle = query.value.trim().toLowerCase();

  if (needle) {
    return listing.value.entries
      .filter((entry) => entry.name.toLowerCase().includes(needle))
      .sort(compareEntries)
      .map((entry) => ({ entry, depth: 0, childCount: childrenByParent.value.get(entry.path)?.length ?? 0 }));
  }

  const output: Row[] = [];
  const walk = (parent: string, depth: number) => {
    for (const entry of childrenByParent.value.get(parent) ?? []) {
      const children = childrenByParent.value.get(entry.path);
      output.push({ entry, depth, childCount: children?.length ?? 0 });
      if (entry.is_dir && expanded.value.has(entry.path)) walk(entry.path, depth + 1);
    }
  };
  walk("", 0);
  return output;
});

const virtualizer = useVirtualizer(
  computed(() => ({
    count: rows.value.length,
    getScrollElement: () => scrollRef.value,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  })),
);

const extractableEntries = computed(() => (listing.value?.entries ?? []).filter((entry) => !entry.skip));

const selectedForExtraction = computed(() => Array.from(selection.value).filter((path) => !entriesByPath.value.get(path)?.skip));

const canExtract = computed(() => mode.value === "server" && !!listing.value && !loading.value && !errorCode.value && extractableEntries.value.length > 0);

const extractLabel = computed(() => {
  const count = selectedForExtraction.value.length;
  if (!count) return t("Extract All");
  return count === 1 ? t("Extract 1 Item") : t("Extract {n} Items", { n: count });
});

const activeJob = computed(() => {
  if (!jobId.value) return null;
  const job = jobsStore.jobById(jobId.value);
  return job && job.state === "running" ? job : null;
});

const jobPercent = computed(() => {
  const job = activeJob.value;
  if (!job || job.totalBytes <= 0) return null;
  return Math.min(100, Math.round((job.processedBytes / job.totalBytes) * 100));
});

const jobPercentLabel = computed(() => (jobPercent.value === null ? "" : `${jobPercent.value}%`));

const jobDetailLabel = computed(() => {
  const job = activeJob.value;
  if (!job) return "";
  if (job.totalFiles > 0) return t("{done} of {total} files", { done: job.processedFiles, total: job.totalFiles });
  return t("Preparing…");
});

const fileCount = computed(() => (listing.value?.entries ?? []).filter((entry) => !entry.is_dir).length);

const statusMessage = computed(() => {
  if (!listing.value) return fileRef.value?.name || localFileRef.value?.name || t("No Archive");
  const count = selection.value.size;
  if (count) return t("{n} of {total} selected", { n: count, total: listing.value.entries.length });
  const files = fileCount.value === 1 ? t("1 file") : t("{n} files", { n: fileCount.value });
  return `${files}, ${formatSize(listing.value.total_size)}`;
});

const statusInfo = computed(() => {
  if (!listing.value) return "";
  const kind = listing.value.kind === "zip" ? t("ZIP archive") : t("TAR archive");
  return `${kind}, ${formatSize(listing.value.size)}`;
});

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function sizeLabel(row: Row): string {
  if (!row.entry.is_dir) return formatSize(row.entry.size);
  if (!row.childCount) return "--";
  return row.childCount === 1 ? t("1 item") : t("{n} items", { n: row.childCount });
}

const dateFormatter = computed(() => new Intl.DateTimeFormat(locale.value, { dateStyle: "medium", timeStyle: "short" }));

function dateLabel(modified: number | null): string {
  if (!modified) return "--";
  return dateFormatter.value.format(new Date(modified * 1000));
}

function skipReasonLabel(reason: ArchiveSkipReason): string {
  return SKIP_REASONS[reason] || "Skipped";
}

function updateWindowTitle(name: string) {
  if (props._windowId && originalWindowTitle.value) {
    windowStore.updateWindowTitle(props._windowId, name ? `${originalWindowTitle.value} - ${name}` : originalWindowTitle.value);
  }
}

function resetView() {
  listing.value = null;
  errorCode.value = null;
  expanded.value = new Set();
  selection.value = new Set();
  anchorPath.value = null;
  query.value = "";
  password.value = "";
  passwordDraft.value = "";
  passwordVerified.value = false;
  passwordError.value = "";
  jobId.value = null;
  clearResult();
}

async function closeLocalArchive() {
  const archive = localArchive.value;
  localArchive.value = null;
  localFileRef.value = null;
  if (archive) await archive.close().catch(() => {});
}

async function guarded<T>(action: () => Promise<T>): Promise<T | { _canceled: true }> {
  const guard = fileRef.value?.guard;
  if (!guard) return await action();

  const normalizedAction = async () => {
    try {
      return await action();
    } catch (error) {
      throw await normalizeBinaryError(error);
    }
  };

  try {
    const result = await withDangerCheck(guard.absolutePath, normalizedAction, guard.scope);
    if (!(result as any)?._canceled) {
      if (guard.scope) disksPlusStore.slideAppSession(guard.scope);
      else disksPlusStore.slideSession();
    }
    return result;
  } catch (error: any) {
    if (error?.response?.status === 401 && error?.response?.data?.error === "unlock_required") {
      await disksPlusStore.fetchStatus();
      errorCode.value = "unlock_required";
      return { _canceled: true };
    }
    throw error;
  }
}

async function openServerArchive(file: ArchiveFileRef) {
  const token = ++loadToken;
  await closeLocalArchive();
  resetView();
  mode.value = "server";
  fileRef.value = file;
  updateWindowTitle(file.name);
  loading.value = true;

  try {
    const result = await guarded(() => listArchive(file, csrfToken.value));
    if (token !== loadToken) return;
    if ((result as any)?._canceled) {
      if (!errorCode.value) errorCode.value = "unlock_required";
      return;
    }
    applyListing(result as ArchiveListing);
  } catch (error) {
    if (token !== loadToken) return;
    errorCode.value = archiveErrorCode(error);
  } finally {
    if (token === loadToken) loading.value = false;
  }
}

async function openLocal(file: File) {
  const token = ++loadToken;
  await closeLocalArchive();
  resetView();
  mode.value = "local";
  fileRef.value = null;
  localFileRef.value = file;
  updateWindowTitle(file.name);
  loading.value = true;

  try {
    const archive = await openLocalArchive(file);
    if (token !== loadToken) {
      await archive.close().catch(() => {});
      return;
    }
    localArchive.value = archive;
    applyListing(archive.listing);
  } catch (error) {
    if (token !== loadToken) return;
    errorCode.value = error instanceof LocalArchiveError ? error.code : "not_an_archive";
  } finally {
    if (token === loadToken) loading.value = false;
  }
}

function applyListing(result: ArchiveListing) {
  listing.value = result;
  const topLevel = result.entries.filter((entry) => !entry.path.includes("/"));
  if (topLevel.length === 1 && topLevel[0].is_dir) expanded.value = new Set([topLevel[0].path]);
  nextTick(() => scrollRef.value?.focus({ preventScroll: true }));
}

function toggleFolder(path: string) {
  const next = new Set(expanded.value);
  if (next.has(path)) {
    for (const item of next) if (item === path || item.startsWith(`${path}/`)) next.delete(item);
  } else {
    next.add(path);
  }
  expanded.value = next;
}

function expandAll() {
  expanded.value = new Set((listing.value?.entries ?? []).filter((entry) => entry.is_dir).map((entry) => entry.path));
}

function collapseAll() {
  expanded.value = new Set();
}

function setSort(key: SortKey) {
  if (sortKey.value === key) sortAsc.value = !sortAsc.value;
  else {
    sortKey.value = key;
    sortAsc.value = key === "name";
  }
}

function clearSelection() {
  selection.value = new Set();
  anchorPath.value = null;
}

function selectOnly(path: string) {
  selection.value = new Set([path]);
  anchorPath.value = path;
}

function selectRange(toPath: string) {
  const from = rows.value.findIndex((row) => row.entry.path === anchorPath.value);
  const to = rows.value.findIndex((row) => row.entry.path === toPath);
  if (from < 0 || to < 0) return selectOnly(toPath);
  const [start, end] = from < to ? [from, to] : [to, from];
  selection.value = new Set(rows.value.slice(start, end + 1).map((row) => row.entry.path));
}

function onRowClick(row: Row, event: MouseEvent) {
  const path = row.entry.path;

  if (event.shiftKey && anchorPath.value) {
    selectRange(path);
  } else if (event.metaKey || event.ctrlKey) {
    const next = new Set(selection.value);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    selection.value = next;
    anchorPath.value = path;
  } else {
    selectOnly(path);
  }
}

function onRowDoubleClick(row: Row) {
  if (row.entry.is_dir) {
    if (query.value) {
      revealInTree(row.entry.path);
      return;
    }
    toggleFolder(row.entry.path);
    return;
  }
  openEntry(row.entry);
}

function onRowTouchStart(event: TouchEvent) {
  const touch = event.touches[0];
  if (!touch) return;
  tapStartX = touch.clientX;
  tapStartY = touch.clientY;
  tapMoved = false;
}

function onRowTouchMove(event: TouchEvent) {
  const touch = event.touches[0];
  if (!touch) return;
  if (Math.hypot(touch.clientX - tapStartX, touch.clientY - tapStartY) > TAP_MOVE_THRESHOLD) tapMoved = true;
}

function onRowTouchEnd(row: Row, event: TouchEvent) {
  const touch = event.changedTouches[0];
  if (tapMoved || !touch) return;

  const now = Date.now();
  const isDoubleTap = lastTapPath === row.entry.path && now - lastTapTime < DOUBLE_TAP_THRESHOLD && Math.hypot(touch.clientX - lastTapX, touch.clientY - lastTapY) < DOUBLE_TAP_DISTANCE;

  if (isDoubleTap) {
    event.preventDefault();
    lastTapPath = null;
    lastTapTime = 0;
    selectOnly(row.entry.path);
    onRowDoubleClick(row);
    return;
  }

  lastTapPath = row.entry.path;
  lastTapTime = now;
  lastTapX = touch.clientX;
  lastTapY = touch.clientY;
}

function revealInTree(path: string) {
  const next = new Set(expanded.value);
  const parts = path.split("/");
  for (let depth = 1; depth <= parts.length; depth++) next.add(parts.slice(0, depth).join("/"));
  expanded.value = next;
  query.value = "";
  selectOnly(path);
  nextTick(() => scrollToPath(path));
}

function scrollToPath(path: string) {
  const index = rows.value.findIndex((row) => row.entry.path === path);
  if (index >= 0) virtualizer.value.scrollToIndex(index, { align: "auto" });
}

function onListKeydown(event: KeyboardEvent) {
  if (!rows.value.length) return;
  const currentIndex = anchorPath.value ? rows.value.findIndex((row) => row.entry.path === anchorPath.value) : -1;
  const current = currentIndex >= 0 ? rows.value[currentIndex] : null;

  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    const nextIndex = currentIndex < 0 ? 0 : Math.max(0, Math.min(rows.value.length - 1, currentIndex + (event.key === "ArrowDown" ? 1 : -1)));
    const path = rows.value[nextIndex].entry.path;
    if (event.shiftKey && anchorPath.value) {
      const next = new Set(selection.value);
      next.add(path);
      selection.value = next;
      anchorPath.value = path;
    } else {
      selectOnly(path);
    }
    scrollToPath(path);
  } else if (event.key === "ArrowRight" && current?.entry.is_dir && !query.value) {
    event.preventDefault();
    if (!expanded.value.has(current.entry.path)) toggleFolder(current.entry.path);
  } else if (event.key === "ArrowLeft" && current && !query.value) {
    event.preventDefault();
    if (current.entry.is_dir && expanded.value.has(current.entry.path)) toggleFolder(current.entry.path);
    else if (parentFolder(current.entry.path)) {
      selectOnly(parentFolder(current.entry.path));
      scrollToPath(parentFolder(current.entry.path));
    }
  } else if (event.key === "Enter" && current) {
    event.preventDefault();
    onRowDoubleClick(current);
  } else if (event.key === "a" && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    selection.value = new Set(rows.value.map((row) => row.entry.path));
  } else if (event.key === "Escape" && selection.value.size) {
    event.stopPropagation();
    clearSelection();
  }
}

function onSearchEscape(event: KeyboardEvent) {
  if (!query.value) return;
  event.stopPropagation();
  query.value = "";
}

function openRowMenu(row: Row, event: MouseEvent) {
  if (!selection.value.has(row.entry.path)) selectOnly(row.entry.path);
  const multiple = selection.value.size > 1;
  const items: ContextMenuItem[] = [];

  if (!multiple && !row.entry.is_dir && !row.entry.skip) {
    items.push({ label: "Open", icon: openIcon, action: () => openEntry(row.entry) });
    items.push({ label: "Download", icon: downloadIcon, action: () => downloadEntry(row.entry) });
    items.push({ divider: true });
  }
  if (!multiple && row.entry.is_dir && !query.value) {
    items.push({ label: expanded.value.has(row.entry.path) ? "Collapse" : "Expand", icon: expanded.value.has(row.entry.path) ? collapseIcon : expandIcon, action: () => toggleFolder(row.entry.path) });
    items.push({ divider: true });
  }
  if (mode.value === "server") {
    items.push({ label: extractLabel.value, icon: extractIcon, disabled: !canExtract.value || !!activeJob.value || !selectedForExtraction.value.length, action: () => extract(selectedForExtraction.value) });
  }
  showMenu(items, event);
}

function openBlankMenu(event: MouseEvent) {
  clearSelection();
  const items: ContextMenuItem[] = [];
  if (mode.value === "server") items.push({ label: "Extract All", icon: extractIcon, disabled: !canExtract.value || !!activeJob.value, action: () => extract([]) });
  items.push({ divider: true });
  items.push({ label: "Expand All", icon: expandIcon, disabled: !!query.value, action: expandAll });
  items.push({ label: "Collapse All", icon: collapseIcon, disabled: !!query.value, action: collapseAll });
  showMenu(items, event);
}

function showMenu(items: ContextMenuItem[], event: MouseEvent) {
  const cleaned = items.filter((item, index) => !item.divider || (index > 0 && index < items.length - 1 && !items[index - 1].divider));
  if (!cleaned.length) return;
  menuItems.value = cleaned;
  menuX.value = event.clientX;
  menuY.value = event.clientY;
  menuVisible.value = true;
}

function requirePassword(): boolean {
  if (!listing.value?.encrypted || passwordVerified.value) return false;
  shakePassword.value = true;
  passwordError.value = "Enter the password first.";
  nextTick(() => passwordInputRef.value?.focus());
  return true;
}

async function readEntry(entry: ArchiveEntry): Promise<ArrayBuffer | null> {
  const secret = entry.encrypted ? password.value : undefined;
  if (mode.value === "local" && localArchive.value) return await localArchive.value.read(entry.path, secret);
  if (!fileRef.value) return null;
  const file = fileRef.value;
  const result = await guarded(() => readArchiveEntry(file, entry.path, csrfToken.value, secret));
  return (result as any)?._canceled ? null : (result as ArrayBuffer);
}

function readErrorCode(error: unknown): string {
  if (error instanceof LocalArchiveError) return error.code;
  return archiveErrorCode(error);
}

async function withEntryBuffer(entry: ArchiveEntry, use: (buffer: ArrayBuffer) => void) {
  if (entry.skip || entry.is_dir) return;
  if (entry.encrypted && requirePassword()) return;
  openingPath.value = entry.path;
  try {
    const buffer = await readEntry(entry);
    if (buffer) use(buffer);
  } catch (error) {
    message.error(t(archiveErrorMessage(readErrorCode(error))));
  } finally {
    openingPath.value = null;
  }
}

function openEntry(entry: ArchiveEntry) {
  const extension = fileExtension(entry.name);
  const lowerName = entry.name.toLowerCase();

  withEntryBuffer(entry, (buffer) => {
    if (TEXT_EXTENSIONS.has(extension) || TEXT_EXTENSIONS.has(lowerName) || CODE_EXTENSIONS.has(extension) || CODE_EXTENSIONS.has(lowerName)) {
      const appId = CODE_EXTENSIONS.has(extension) || CODE_EXTENSIONS.has(lowerName) ? "code" : "notepad";
      windowStore.openFileInApp(appId, { data: { textFile: { name: entry.name, content: new TextDecoder().decode(buffer) } } });
    } else if (BROWSER_IMAGE_EXTENSIONS.has(extension)) {
      windowStore.openFileInApp("imageviewer", { data: { imageFile: { name: entry.name, extension, format: extension, buffer } } });
    } else if (MEDIA_EXTENSIONS.has(extension)) {
      windowStore.openFileInApp("mediaplayer", { data: { mediaFile: { name: entry.name, extension, buffer } } });
    } else if (PDF_EXTENSIONS.has(extension)) {
      windowStore.openFileInApp("pdfviewer", { data: { pdfFile: { name: entry.name, buffer } } });
    } else if (SHEETS_EXTENSIONS.has(extension)) {
      windowStore.openFileInApp("sheets", { data: { sheetsFile: { name: entry.name, buffer } } });
    } else if (WRITER_EXTENSIONS.has(extension)) {
      windowStore.openFileInApp("writer", { data: { writerFile: { name: entry.name, buffer } } });
    } else if (isZipName(entry.name)) {
      windowStore.openWindow("zipfile", { allowMultiple: true, data: { localFile: new File([buffer], entry.name) } });
    } else {
      triggerDownload(new Blob([buffer]), entry.name);
    }
  });
}

function downloadEntry(entry: ArchiveEntry) {
  withEntryBuffer(entry, (buffer) => triggerDownload(new Blob([buffer]), entry.name));
}

async function unlock() {
  if (!listing.value || !passwordDraft.value || unlocking.value) return;
  const probe = listing.value.entries.filter((entry) => entry.encrypted && !entry.is_dir && !entry.skip).sort((a, b) => a.size - b.size)[0];
  if (!probe) {
    password.value = passwordDraft.value;
    passwordVerified.value = true;
    return;
  }

  unlocking.value = true;
  passwordError.value = "";
  const previous = password.value;
  const candidate = passwordDraft.value;
  password.value = candidate;
  try {
    if (mode.value === "local" && localArchive.value) {
      await localArchive.value.checkPassword(candidate);
    } else if (fileRef.value) {
      const file = fileRef.value;
      const result = await guarded(() => listArchive(file, csrfToken.value, candidate));
      if ((result as any)?._canceled) {
        password.value = previous;
        return;
      }
    }
    passwordVerified.value = true;
    passwordDraft.value = "";
    nextTick(() => scrollRef.value?.focus({ preventScroll: true }));
  } catch (error) {
    password.value = previous;
    const code = readErrorCode(error);
    passwordError.value = code === "wrong_password" || code === "password_required" ? "The password is incorrect." : archiveErrorMessage(code);
    shakePassword.value = true;
    nextTick(() => passwordInputRef.value?.select());
  } finally {
    unlocking.value = false;
  }
}

watch(passwordDraft, () => {
  if (passwordError.value) passwordError.value = "";
});

async function extract(entries: string[]) {
  const file = fileRef.value;
  if (!file || !canExtract.value || activeJob.value) return;
  if (listing.value?.encrypted && requirePassword()) return;

  clearResult();
  const secret = listing.value?.encrypted ? password.value : undefined;

  try {
    const job = await jobsStore.start({
      kind: "extract",
      label: file.name,
      location: file.location,
      folder: parentFolder(file.path),
      archivePath: file.path,
      notify: false,
      csrfToken: csrfToken.value,
      request: async () => {
        const result = await guarded(() => startExtract(file, csrfToken.value, entries, secret));
        return result as string | { _canceled: true };
      },
    });
    if (job) jobId.value = job.id;
  } catch (error) {
    message.error(t(archiveErrorMessage(archiveErrorCode(error))));
  }
}

watch(
  () => (jobId.value ? jobsStore.jobById(jobId.value) : null),
  (job) => {
    if (!job || job.state === "running") return;
    if (job.state === "done" && job.result) {
      lastResult.value = { path: job.result.path, name: job.result.name };
      message.success(t("Extracted “{name}”", { name: job.result.name }));
      if (job.result.skipped > 0) message.warning(t("{n} unsafe items were skipped", { n: job.result.skipped }));
      if (resultTimer) clearTimeout(resultTimer);
      resultTimer = setTimeout(clearResult, RESULT_VISIBLE_MS);
    } else if (job.state === "error") {
      message.error(t(archiveErrorMessage(job.error || "unknown")));
    }
    jobId.value = null;
  },
  { deep: true },
);

function cancelJob() {
  if (jobId.value) jobsStore.cancel(jobId.value);
}

function clearResult() {
  lastResult.value = null;
  if (resultTimer) {
    clearTimeout(resultTimer);
    resultTimer = null;
  }
}

function explorerTarget(folder: string, fileName: string) {
  const location = fileRef.value!.location;
  return {
    initialLocation: location.source,
    initialPath: folder,
    initialFileName: fileName,
    initialContainer: location.container,
    initialMountIndex: location.mount,
    initialDiskId: location.disk,
  };
}

function revealResult() {
  if (!fileRef.value || !lastResult.value) return;
  windowStore.openFileInApp("fileexplorer", { data: explorerTarget(parentFolder(lastResult.value.path), lastResult.value.path) });
  clearResult();
}

function revealArchive() {
  if (!fileRef.value) return;
  windowStore.openFileInApp("fileexplorer", { data: explorerTarget(parentFolder(fileRef.value.path), fileRef.value.path) });
}

function browseArchives() {
  windowStore.openFileInApp("fileexplorer", { data: { initialLocation: "storage", initialPath: ARCHIVES_FOLDER } });
}

async function ensureArchivesFolder() {
  const headers = { "X-HomeDock-CSRF-Token": csrfToken.value };
  try {
    await axios.get("/api/storage/files", { params: { path: ARCHIVES_FOLDER }, headers });
  } catch (error: any) {
    if (error.response?.status !== 404) throw error;
    await axios.post("/api/storage/create-folder", { name: ARCHIVES_FOLDER, path: "" }, { headers });
  }
}

async function saveLocalArchive() {
  const file = localFileRef.value;
  if (!file || saving.value) return;
  saving.value = true;
  try {
    await ensureArchivesFolder();
    const name = await uniqueStorageName(ARCHIVES_FOLDER, file.name, csrfToken.value);
    await uploadToStorage(file, name, ARCHIVES_FOLDER, csrfToken.value);
    announceFilesChanged({ location: { source: "storage" }, folder: ARCHIVES_FOLDER });
    message.success(t("Saved to Storage/Archives/{filename}", { filename: name }));

    const kept = { expanded: expanded.value, password: password.value, verified: passwordVerified.value };
    await openServerArchive({ name, path: `${ARCHIVES_FOLDER}/${name}`, location: { source: "storage" } });
    expanded.value = kept.expanded;
    password.value = kept.password;
    passwordVerified.value = kept.verified;
  } catch (error) {
    console.error("Failed to save archive:", error);
    message.error(t("Failed to save file"));
  } finally {
    saving.value = false;
  }
}

function hasDraggedFiles(event: DragEvent): boolean {
  return Boolean(event.dataTransfer?.types.includes("Files"));
}

function onDragEnter(event: DragEvent) {
  if (!hasDraggedFiles(event)) return;
  dragDepth++;
  isDragOver.value = true;
}

function onDragOver(event: DragEvent) {
  if (!hasDraggedFiles(event) || !event.dataTransfer) return;
  event.dataTransfer.dropEffect = "copy";
}

function onDragLeave(event: DragEvent) {
  if (!hasDraggedFiles(event)) return;
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) isDragOver.value = false;
}

function onDrop(event: DragEvent) {
  dragDepth = 0;
  isDragOver.value = false;
  const files = Array.from(event.dataTransfer?.files ?? []);
  const zip = files.find((file) => isZipName(file.name));
  if (zip) openLocal(zip);
  else if (files.length) message.warning(t("Drop a ZIP archive to open it here."));
}

function handleIncomingFile(event: CustomEvent) {
  const data = event.detail;
  if (data?.archiveFile) openServerArchive(data.archiveFile);
  else if (data?.localFile) openLocal(data.localFile);
}

watch(
  () => props.archiveFile,
  (file) => {
    if (file) openServerArchive(file);
  },
  { immediate: true },
);

watch(
  () => props.localFile,
  (file) => {
    if (file) openLocal(file);
  },
  { immediate: true },
);

onMounted(() => {
  if (props._windowId) window.addEventListener(`homedock:open-file-${props._windowId}`, handleIncomingFile as EventListener);
});

onUnmounted(() => {
  if (props._windowId) window.removeEventListener(`homedock:open-file-${props._windowId}`, handleIncomingFile as EventListener);
  if (resultTimer) clearTimeout(resultTimer);
  loadToken++;
  closeLocalArchive();
});
</script>

<style scoped>
.zipfile {
  user-select: none;
}

.zipfile-col-size {
  width: 84px;
  flex-shrink: 0;
  padding-left: 12px;
}

.zipfile-col-date {
  width: 150px;
  flex-shrink: 0;
  padding-left: 20px;
}

.zipfile-indeterminate {
  animation: zipfile-indeterminate 1.2s ease-in-out infinite;
}

@keyframes zipfile-indeterminate {
  from {
    left: -33%;
  }
  to {
    left: 100%;
  }
}

.zipfile-shake {
  animation: zipfile-shake 0.36s ease;
}

@keyframes zipfile-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20%,
  60% {
    transform: translateX(-5px);
  }
  40%,
  80% {
    transform: translateX(5px);
  }
}

.pill-swap-enter-active,
.pill-swap-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.pill-swap-enter-from,
.pill-swap-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

.bar-reveal-enter-active,
.bar-reveal-leave-active {
  transition:
    opacity 0.2s ease,
    max-height 0.2s ease;
  max-height: 64px;
  overflow: hidden;
}

.bar-reveal-enter-from,
.bar-reveal-leave-to {
  opacity: 0;
  max-height: 0;
}

.drop-fade-enter-active,
.drop-fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.drop-fade-enter-from,
.drop-fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

@container window (max-width: 560px) {
  .zipfile-col-date {
    display: none;
  }

  .zipfile-password-fields {
    width: 100%;
  }

  .zipfile-password-input {
    flex: 1;
    width: auto;
    min-width: 0;
  }
}

@container window (max-width: 480px) {
  .zipfile-pill {
    width: 1.75rem;
    padding: 0;
  }

  .zipfile-pill-label,
  .zipfile-progress-text {
    display: none;
  }

  .zipfile-progress-track {
    width: 4rem;
  }
}
</style>
