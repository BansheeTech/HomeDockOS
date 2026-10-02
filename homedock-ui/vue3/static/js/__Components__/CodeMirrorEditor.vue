<!-- homedock-ui/vue3/static/js/__Components__/CodeMirrorEditor.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div ref="hostRef" :class="['codemirror-editor', monospace ? 'codemirror-mono' : 'codemirror-sans']" :style="{ '--codemirror-font-size': `${fontSize}px` }"></div>
</template>

<script lang="ts">
import { Compartment, EditorState, type Extension, type Text } from "@codemirror/state";
import { EditorView, keymap, drawSelection, highlightSpecialChars, dropCursor, rectangularSelection } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { HighlightStyle, LanguageDescription, syntaxHighlighting, indentOnInput, bracketMatching } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { tags } from "@lezer/highlight";

const wrapCompartment = new Compartment();
const languageCompartment = new Compartment();

const LANGUAGE_ALIASES: Record<string, string> = {
  zsh: "Shell",
  fish: "Shell",
  xhtml: "HTML",
  dockerfile: "Dockerfile",
  conf: "Nginx",
  nginx: "Nginx",
  apache: "Properties files",
};

const WORD_COUNT_SLICE = 2_000_000;

const highlightStyle = HighlightStyle.define([
  { tag: [tags.keyword, tags.controlKeyword, tags.operatorKeyword, tags.definitionKeyword, tags.moduleKeyword, tags.modifier], color: "var(--hljs-keyword)" },
  { tag: [tags.string, tags.special(tags.string), tags.character, tags.attributeValue, tags.url, tags.link], color: "var(--hljs-string)" },
  { tag: [tags.number, tags.integer, tags.float], color: "var(--hljs-number)" },
  { tag: [tags.bool, tags.null, tags.atom, tags.unit], color: "var(--hljs-literal)" },
  { tag: [tags.comment, tags.lineComment, tags.blockComment, tags.docComment], color: "var(--hljs-comment)", fontStyle: "italic" },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: "var(--hljs-function)" },
  { tag: [tags.definition(tags.variableName), tags.definition(tags.function(tags.variableName)), tags.heading], color: "var(--hljs-title)", fontWeight: "600" },
  { tag: [tags.className, tags.typeName, tags.namespace], color: "var(--hljs-type)" },
  { tag: [tags.standard(tags.variableName), tags.self], color: "var(--hljs-built-in)" },
  { tag: tags.propertyName, color: "var(--hljs-property)" },
  { tag: tags.attributeName, color: "var(--hljs-attr)" },
  { tag: tags.tagName, color: "var(--hljs-name)" },
  { tag: [tags.variableName, tags.labelName], color: "var(--hljs-variable)" },
  { tag: tags.regexp, color: "var(--hljs-regexp)" },
  { tag: [tags.meta, tags.processingInstruction, tags.annotation], color: "var(--hljs-meta)" },
  { tag: tags.operator, color: "var(--hljs-operator)" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strong, fontWeight: "600" },
]);

const editorTheme = EditorView.theme({
  "&": { height: "100%", fontSize: "var(--codemirror-font-size)", color: "inherit", backgroundColor: "transparent" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: "inherit", lineHeight: "1.625" },
  ".cm-content": { padding: "12px 0", caretColor: "var(--notepad-caret, currentColor)" },
  ".cm-line": { padding: "0 12px" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--notepad-caret, currentColor)" },
  ".cm-selectionBackground, &.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground": { backgroundColor: "rgba(59, 130, 246, 0.3)" },
  ".cm-matchingBracket": { backgroundColor: "rgba(59, 130, 246, 0.2)", outline: "none" },
});

export function createEditorState(text: string): EditorState {
  return EditorState.create({
    doc: text,
    extensions: [history(), drawSelection(), dropCursor(), rectangularSelection(), highlightSpecialChars(), indentOnInput(), bracketMatching(), EditorState.allowMultipleSelections.of(true), keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]), editorTheme, wrapCompartment.of([]), languageCompartment.of([])],
  });
}

export async function loadLanguage(filename: string): Promise<Extension | null> {
  const extension = filename.toLowerCase().split(".").pop() || "";
  const description = LanguageDescription.matchFilename(languages, filename) || (LANGUAGE_ALIASES[extension] ? LanguageDescription.matchLanguageName(languages, LANGUAGE_ALIASES[extension], false) : null);
  if (!description) return null;
  const support = description.support || (await description.load());
  return [support, syntaxHighlighting(highlightStyle)];
}

let cachedDoc: Text | null = null;
let cachedText = "";

function docString(doc: Text): string {
  if (cachedDoc !== doc) {
    cachedText = doc.toString();
    cachedDoc = doc;
  }
  return cachedText;
}

export function findText(doc: Text, needle: string, from: number): { from: number; to: number } | null {
  const text = docString(doc);
  let index = text.indexOf(needle, from);
  if (index === -1 && from > 0) index = text.indexOf(needle);
  return index === -1 ? null : { from: index, to: index + needle.length };
}

export function replaceAllText(doc: Text, needle: string, replacement: string): { text: string; count: number } | null {
  const parts = docString(doc).split(needle);
  if (parts.length === 1) return null;
  return { text: parts.join(replacement), count: parts.length - 1 };
}

export function countWords(doc: Text, isCurrent: () => boolean): Promise<number | null> {
  return new Promise((resolve) => {
    const iterator = doc.iter();
    let words = 0;
    let inWord = false;

    const step = () => {
      if (!isCurrent()) return resolve(null);
      let processed = 0;
      while (processed < WORD_COUNT_SLICE) {
        const { value, done } = iterator.next();
        if (done) return resolve(words);
        for (let index = 0; index < value.length; index++) {
          const code = value.charCodeAt(index);
          const space = code === 32 || (code >= 9 && code <= 13) || code === 160 || code === 12288 || (code >= 8192 && code <= 8202) || code === 8232 || code === 8233 || code === 65279;
          if (space) inWord = false;
          else if (!inWord) {
            inWord = true;
            words++;
          }
        }
        processed += value.length || 1;
      }
      setTimeout(step, 0);
    };

    step();
  });
}
</script>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";

const props = withDefaults(defineProps<{ stateKey: string; loadState: (key: string) => EditorState; wrap?: boolean; fontSize?: number; monospace?: boolean; language?: Extension | null }>(), {
  wrap: true,
  fontSize: 12,
  monospace: false,
  language: null,
});

const emit = defineEmits<{
  update: [state: EditorState, docChanged: boolean];
  scroll: [];
}>();

const hostRef = ref<HTMLElement | null>(null);
const view = shallowRef<EditorView | null>(null);

function applyConfig() {
  view.value?.dispatch({ effects: [wrapCompartment.reconfigure(props.wrap ? EditorView.lineWrapping : []), languageCompartment.reconfigure(props.language ?? [])] });
}

function handleScroll() {
  emit("scroll");
}

onMounted(() => {
  if (!hostRef.value) return;
  view.value = new EditorView({
    state: props.loadState(props.stateKey),
    parent: hostRef.value,
    dispatchTransactions(transactions, editor) {
      editor.update(transactions);
      emit(
        "update",
        editor.state,
        transactions.some((transaction) => transaction.docChanged),
      );
    },
  });
  view.value.scrollDOM.addEventListener("scroll", handleScroll, { passive: true });
  applyConfig();
});

watch(
  () => props.stateKey,
  (key) => {
    if (!view.value) return;
    view.value.setState(props.loadState(key));
    applyConfig();
  },
);

watch(() => [props.wrap, props.language], applyConfig);

onBeforeUnmount(() => {
  view.value?.scrollDOM.removeEventListener("scroll", handleScroll);
  view.value?.destroy();
  view.value = null;
});

defineExpose({ view });
</script>

<style scoped>
.codemirror-editor {
  width: 100%;
  height: 100%;
}

.codemirror-sans {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.codemirror-mono {
  font-family: Menlo, Consolas, "DejaVu Sans Mono", "Liberation Mono", monospace;
}
</style>
