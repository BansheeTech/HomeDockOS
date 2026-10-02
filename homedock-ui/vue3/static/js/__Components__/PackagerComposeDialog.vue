<!-- homedock-ui/vue3/static/js/__Components__/PackagerComposeDialog.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <AppDialog v-model:visible="isEditingCompose" type="info" :title="$t('Edit Docker Compose')" :ok-text="$t('Save')" :cancel-text="$t('Cancel')" :ok-cancel="true" :width="1100" :mask-closable="false" @ok="saveComposeEdit" @cancel="cancelComposeEdit">
    <div class="compose-dialog">
      <div class="compose-layout">
        <div :class="[themeClasses.installConfigSectionCard]" class="compose-pane flex flex-col min-w-0 overflow-hidden">
          <div :class="[themeClasses.utilityToolbarBorder]" class="flex items-center justify-between gap-3 px-4 py-3 border-b">
            <div class="flex items-center gap-2 min-w-0">
              <Icon :icon="fileCodeIcon" :class="[themeClasses.installConfigSectionTitle]" class="h-4 w-4 flex-shrink-0" />
              <h3 :class="[themeClasses.installConfigSectionTitle]" class="m-0 text-sm font-semibold truncate">{{ fileName }}</h3>
              <Transition name="pill-fade">
                <span v-if="isModified" class="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium bg-blue-500/15 text-blue-500">{{ $t("Modified") }}</span>
              </Transition>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0 text-[10px]">
              <span :class="[themeClasses.installConfigLabel]" class="compose-cursor tabular-nums">{{ $t("Ln") }} {{ cursor.line }}, {{ $t("Col") }} {{ cursor.column }}</span>
              <span :class="[themeClasses.dropZoneTotalSizeScope]" class="rounded-full px-2 py-0.5 font-medium">YAML</span>
            </div>
          </div>
          <ComposeEditor ref="editorRef" v-model="composeContent" class="compose-editor-area flex-1 min-h-0" @cursor="cursor = $event" @save="saveFromShortcut" />
        </div>

        <div class="flex flex-col min-h-0 min-w-0">
          <button type="button" class="hooks-toggle flex items-center gap-2 w-full mb-2 px-1 bg-transparent border-0 text-left cursor-pointer" :aria-expanded="showHooks" @click="showHooks = !showHooks">
            <AppIconGraphic :icon="codeIcon" color="#8b5cf6" :size="24" />
            <span :class="[themeClasses.storeModalAppName]" class="text-[13px] font-semibold">{{ $t("DevHooks Reference") }}</span>
            <span :class="[themeClasses.storeCardSubtitle]" class="text-xs tabular-nums">{{ usedDevHooks.length }}/{{ DEV_HOOKS.length }} {{ $t("Used").toLowerCase() }}</span>
            <Icon :icon="chevronIcon" :class="[themeClasses.storeCardSubtitle, showHooks ? 'rotate-90' : '']" class="hooks-chevron w-4 h-4 ml-auto transition-transform duration-200" />
          </button>

          <div :class="showHooks ? '' : 'hooks-collapsed'" class="hooks-body flex flex-col flex-1 min-h-0">
            <p :class="[themeClasses.storeCardSubtitle]" class="m-0 mb-2 px-1 text-xs leading-relaxed">{{ $t("Use these placeholders in your Docker Compose file. They will be automatically replaced when installing the package.") }}</p>
            <div :class="[themeClasses.storeInfoBar]" class="hooks-list flex-1 min-h-0 overflow-y-auto rounded-xl border">
              <template v-for="(hook, index) in DEV_HOOKS" :key="hook.placeholder">
                <div v-if="index > 0" :class="[themeClasses.storeInfoBarDivider]" class="h-px ml-3"></div>
                <div :class="[themeClasses.storeRowHover]" class="group flex items-start gap-2 px-3 py-2.5 cursor-pointer transition-colors duration-150" :title="$t('Insert at cursor')" @click="insertHook(hook.placeholder)">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5 min-w-0">
                      <code :class="[themeClasses.storeModalAppName]" class="font-mono text-[11px] font-semibold truncate">{{ hook.placeholder }}</code>
                      <Icon v-if="usedDevHooks.includes(hook.placeholder)" :icon="checkIcon" class="w-3.5 h-3.5 flex-shrink-0 text-green-500" :aria-label="$t('Used')" />
                    </div>
                    <p :class="[themeClasses.storeCardSubtitle]" class="m-0 mt-0.5 text-xs">{{ $t(hook.description) }}</p>
                    <p :class="[themeClasses.storeCardSubtitle]" class="m-0 mt-1 font-mono text-[10px] leading-relaxed opacity-70 whitespace-pre-line break-all">{{ hook.example }}</p>
                  </div>
                  <button type="button" :class="[themeClasses.storeCardSubtitle]" class="flex items-center justify-center w-7 h-7 -mr-1 rounded-md flex-shrink-0 bg-transparent border-0 cursor-pointer opacity-60 transition-opacity duration-150 group-hover:opacity-100 hover:bg-gray-500/15" :title="$t('Copy to clipboard')" :aria-label="$t('Copy to clipboard')" @click.stop="copyToClipboard(hook.placeholder)">
                    <Icon :icon="copyIcon" class="w-3.5 h-3.5" />
                  </button>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppDialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { usePackager, DEV_HOOKS } from "../__Composables__/usePackager";

import { Icon } from "@iconify/vue";
import fileCodeIcon from "@iconify-icons/mdi/file-code-outline";
import codeIcon from "@iconify-icons/mdi/code-braces";
import copyIcon from "@iconify-icons/mdi/content-copy";
import checkIcon from "@iconify-icons/mdi/check-circle";
import chevronIcon from "@iconify-icons/mdi/chevron-right";

import AppDialog from "./AppDialog.vue";
import AppIconGraphic from "./AppIconGraphic.vue";
import ComposeEditor, { type ComposeCursor } from "./ComposeEditor.vue";

const { themeClasses } = useTheme();
const { composeFile, composeContent, isEditingCompose, usedDevHooks, saveComposeEdit, cancelComposeEdit, copyToClipboard } = usePackager();

const editorRef = ref<InstanceType<typeof ComposeEditor> | null>(null);
const cursor = ref<ComposeCursor>({ line: 1, column: 1 });
const showHooks = ref(false);
const snapshot = ref("");

const fileName = computed(() => composeFile.value?.name || "docker-compose.yml");
const isModified = computed(() => composeContent.value !== snapshot.value);

watch(isEditingCompose, (open) => {
  if (!open) return;
  snapshot.value = composeContent.value;
  cursor.value = { line: 1, column: 1 };
});

function insertHook(placeholder: string) {
  editorRef.value?.insertAtCursor(placeholder);
}

async function saveFromShortcut() {
  isEditingCompose.value = false;
  await saveComposeEdit();
}
</script>

<style scoped>
.compose-dialog {
  container-type: inline-size;
  container-name: compose-dialog;
}

.compose-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.compose-editor-area {
  height: 360px;
}

.hooks-list {
  max-height: 320px;
}

.hooks-collapsed {
  display: none;
}

.pill-fade-enter-active,
.pill-fade-leave-active {
  transition: opacity 0.2s ease;
}

.pill-fade-enter-from,
.pill-fade-leave-to {
  opacity: 0;
}

@container compose-dialog (min-width: 820px) {
  .compose-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    height: 520px;
  }

  .compose-editor-area {
    height: auto;
  }

  .hooks-list {
    max-height: none;
  }

  .hooks-collapsed {
    display: flex;
  }

  .hooks-toggle {
    pointer-events: none;
  }

  .hooks-chevron {
    display: none;
  }
}

@container compose-dialog (max-width: 480px) {
  .compose-cursor {
    display: none;
  }
}
</style>
