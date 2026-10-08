<!-- homedock-ui/vue3/static/js/__Components__/ComposeEditor.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="compose-editor relative flex overflow-hidden" :class="{ 'is-readonly': readonly }" :style="hljsCssVars">
    <div :class="[themeClasses.utilityToolbarBorder, themeClasses.windowText]" class="compose-gutter flex-shrink-0 overflow-hidden border-r select-none text-right">
      <div :style="{ transform: `translateY(${-scrollTop}px)` }">
        <div v-for="line in lineCount" :key="line" :class="line === cursorLine && !readonly ? 'opacity-80' : 'opacity-30'">{{ line }}</div>
      </div>
    </div>

    <div class="relative flex-1 min-w-0">
      <textarea ref="textareaRef" :value="modelValue" :readonly="readonly" :class="[themeClasses.windowText]" class="compose-code absolute inset-0 w-full h-full m-0 resize-none whitespace-pre overflow-auto outline-hidden border-0 bg-transparent" wrap="off" spellcheck="false" autocapitalize="off" autocomplete="off" @input="handleInput" @scroll="syncScroll" @keydown="handleKeydown" @keyup="updateCursor" @click="updateCursor" @select="updateCursor"></textarea>
      <div ref="overlayRef" class="compose-overlay absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <pre class="m-0 whitespace-pre"><code v-html="highlightedCode"></code></pre>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";

import hljs from "highlight.js/lib/core";
import yaml from "highlight.js/lib/languages/yaml";

import { useTheme } from "../__Themes__/ThemeSelector";

hljs.registerLanguage("yaml", yaml);

interface Props {
  modelValue: string;
  readonly?: boolean;
}

export interface ComposeCursor {
  line: number;
  column: number;
}

const INDENT = "  ";

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  cursor: [cursor: ComposeCursor];
  save: [];
}>();

const { themeClasses } = useTheme();

const textareaRef = ref<HTMLTextAreaElement | null>(null);
const overlayRef = ref<HTMLElement | null>(null);
const scrollTop = ref(0);
const cursorLine = ref(1);

const lineCount = computed(() => props.modelValue.split("\n").length);

const highlightedCode = computed(() => {
  const content = props.modelValue;
  if (!content) return "";
  const result = hljs.highlight(content, { language: "yaml" }).value;
  return content.endsWith("\n") ? `${result} ` : result;
});

const hljsCssVars = computed(() => ({
  "--hljs-base": themeClasses.value.notepadHljsBase,
  "--hljs-keyword": themeClasses.value.notepadHljsKeyword,
  "--hljs-string": themeClasses.value.notepadHljsString,
  "--hljs-number": themeClasses.value.notepadHljsNumber,
  "--hljs-comment": themeClasses.value.notepadHljsComment,
  "--hljs-type": themeClasses.value.notepadHljsType,
  "--hljs-literal": themeClasses.value.notepadHljsLiteral,
  "--hljs-attr": themeClasses.value.notepadHljsAttr,
  "--hljs-variable": themeClasses.value.notepadHljsVariable,
  "--hljs-meta": themeClasses.value.notepadHljsMeta,
  "--hljs-operator": themeClasses.value.notepadHljsOperator,
  "--notepad-caret": themeClasses.value.notepadCaret,
}));

function handleInput(event: Event) {
  emit("update:modelValue", (event.target as HTMLTextAreaElement).value);
  updateCursor();
}

function syncScroll() {
  const textarea = textareaRef.value;
  if (!textarea) return;

  scrollTop.value = textarea.scrollTop;

  if (overlayRef.value) {
    overlayRef.value.scrollTop = textarea.scrollTop;
    overlayRef.value.scrollLeft = textarea.scrollLeft;
  }
}

function updateCursor() {
  const textarea = textareaRef.value;
  if (!textarea) return;

  const lines = textarea.value.slice(0, textarea.selectionStart).split("\n");
  cursorLine.value = lines.length;
  emit("cursor", { line: lines.length, column: lines[lines.length - 1].length + 1 });
}

function insertText(text: string) {
  const textarea = textareaRef.value;
  if (!textarea) return;

  if (!document.execCommand("insertText", false, text)) {
    textarea.setRangeText(text, textarea.selectionStart, textarea.selectionEnd, "end");
    emit("update:modelValue", textarea.value);
    updateCursor();
  }
}

function insertAtCursor(text: string) {
  const textarea = textareaRef.value;
  if (!textarea || props.readonly) return;
  textarea.focus();
  insertText(text);
}

defineExpose({ insertAtCursor });

function currentLineIndent(textarea: HTMLTextAreaElement): string {
  const lineStart = textarea.value.lastIndexOf("\n", textarea.selectionStart - 1) + 1;
  const line = textarea.value.slice(lineStart, textarea.selectionStart);
  const indent = line.match(/^[ \t]*/)?.[0] ?? "";
  return line.trimEnd().endsWith(":") ? indent + INDENT : indent;
}

function handleKeydown(event: KeyboardEvent) {
  const textarea = textareaRef.value;
  if (!textarea) return;

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    emit("save");
    return;
  }

  if (props.readonly || event.ctrlKey || event.metaKey || event.altKey) return;

  if (event.key === "Tab" && !event.shiftKey) {
    event.preventDefault();
    insertText(INDENT);
    return;
  }

  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    insertText(`\n${currentLineIndent(textarea)}`);
  }
}
</script>

<style scoped>
.compose-gutter,
.compose-code,
.compose-overlay pre,
.compose-overlay code {
  font-family: Menlo, Consolas, "DejaVu Sans Mono", "Liberation Mono", monospace !important;
  font-size: 12px;
  line-height: 1.625 !important;
  letter-spacing: 0 !important;
  word-spacing: 0 !important;
  tab-size: 2 !important;
  -moz-tab-size: 2 !important;
}

.compose-gutter {
  min-width: 3rem;
  padding: 0.75rem 0.625rem 0.75rem 0.75rem;
  font-variant-numeric: tabular-nums;
}

.compose-code,
.compose-overlay {
  padding: 0.75rem;
}

.compose-code {
  color: transparent !important;
  caret-color: var(--notepad-caret, #e5e7eb);
}

.is-readonly .compose-code {
  caret-color: transparent;
}

.is-readonly .compose-overlay {
  opacity: 0.6;
}

.compose-code::selection {
  background: rgba(59, 130, 246, 0.3);
}

.compose-overlay pre {
  display: inline-block;
  min-width: 100%;
  padding-right: 1.5rem !important;
  padding-bottom: 1.5rem !important;
}

.compose-overlay pre,
.compose-overlay code {
  background: transparent !important;
  color: var(--hljs-base, #d4d4d4);
  margin: 0 !important;
  padding-left: 0 !important;
  padding-top: 0 !important;
  border: none !important;
}

@container window (max-width: 560px) {
  .compose-gutter {
    min-width: 2.25rem;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }

  .compose-code,
  .compose-overlay {
    padding-left: 0.625rem;
    padding-right: 0.625rem;
  }
}

.compose-overlay :deep(.hljs-attr) {
  color: var(--hljs-attr);
}
.compose-overlay :deep(.hljs-string) {
  color: var(--hljs-string);
}
.compose-overlay :deep(.hljs-number) {
  color: var(--hljs-number);
}
.compose-overlay :deep(.hljs-literal) {
  color: var(--hljs-literal);
}
.compose-overlay :deep(.hljs-comment) {
  color: var(--hljs-comment);
  font-style: italic;
}
.compose-overlay :deep(.hljs-keyword) {
  color: var(--hljs-keyword);
}
.compose-overlay :deep(.hljs-type) {
  color: var(--hljs-type);
}
.compose-overlay :deep(.hljs-meta) {
  color: var(--hljs-meta);
}
.compose-overlay :deep(.hljs-template-variable),
.compose-overlay :deep(.hljs-variable) {
  color: var(--hljs-variable);
}
.compose-overlay :deep(.hljs-bullet),
.compose-overlay :deep(.hljs-punctuation) {
  color: var(--hljs-operator);
}
</style>
