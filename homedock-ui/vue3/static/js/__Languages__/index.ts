// homedock-ui/vue3/static/js/__Languages__/index.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { createI18n, type MessageResolver } from "vue-i18n";

import DOMPurify from "dompurify";

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", flag: "🇺🇦" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
];

const DEFAULT_LOCALE = "en";

function isSupported(code: string | null | undefined): code is string {
  return !!code && SUPPORTED_LANGUAGES.some((l) => l.code === code);
}

function getInitialLocale(): string {
  if (typeof document !== "undefined") {
    const htmlLang = document.documentElement.lang?.trim();
    if (isSupported(htmlLang)) return htmlLang;
  }
  return DEFAULT_LOCALE;
}

const flatMessageResolver: MessageResolver = (obj, path) => {
  if (obj && typeof obj === "object") {
    const value = (obj as Record<string, unknown>)[path];
    if (typeof value === "string") return value;
  }
  return null;
};

export const i18n = createI18n<false>({
  legacy: false,
  globalInjection: true,
  locale: getInitialLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages: {},
  messageResolver: flatMessageResolver,
  fallbackFormat: true,
  missingWarn: false,
  fallbackWarn: false,
  silentFallbackWarn: true,
  silentTranslationWarn: true,
  warnHtmlMessage: false,
});

const globalComposer = i18n.global as unknown as {
  locale: { value: string };
  availableLocales: string[];
  t: (key: string, params?: Record<string, unknown>) => string;
  setLocaleMessage: (code: string, messages: Record<string, string>) => void;
};

const localeLoaders: Record<string, () => Promise<{ default: Record<string, string> }>> = {
  es: () => import("./__es__.json"),
  de: () => import("./__de__.json"),
  fr: () => import("./__fr__.json"),
  it: () => import("./__it__.json"),
  pt: () => import("./__pt__.json"),
  zh: () => import("./__zh__.json"),
  ru: () => import("./__ru__.json"),
  uk: () => import("./__uk__.json"),
  ja: () => import("./__ja__.json"),
  ko: () => import("./__ko__.json"),
};

const inflight = new Map<string, Promise<void>>();

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ["strong", "em", "b", "i", "code", "br", "u"],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
};

const MAX_KEY_LENGTH = 5000;
const MAX_VALUE_LENGTH = 5000;
const VALID_PLACEHOLDER = /^\{[a-zA-Z_]\w*\}$/;
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

function sanitizeMessages(code: string, raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    console.warn(`[i18n:${code}] locale messages must be a plain object — skipping locale.`);
    return {};
  }

  const out: Record<string, string> = {};
  let dropped = 0;
  let mutated = 0;

  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof key !== "string" || key.length === 0 || key.length > MAX_KEY_LENGTH) {
      dropped++;
      continue;
    }
    if (typeof value !== "string" || value.length > MAX_VALUE_LENGTH) {
      dropped++;
      continue;
    }

    const placeholders = value.match(/\{[^}]*\}/g);
    if (placeholders && placeholders.some((p) => !VALID_PLACEHOLDER.test(p))) {
      dropped++;
      continue;
    }

    const stripped = value.replace(CONTROL_CHARS, "");
    const sanitized = DOMPurify.sanitize(stripped, SANITIZE_CONFIG);

    if (sanitized !== value) mutated++;
    out[key] = sanitized;
  }

  if (dropped > 0 || mutated > 0) {
    console.warn(`[i18n:${code}] sanitized locale — ${mutated} value(s) altered, ${dropped} key(s) dropped.`);
  }
  return out;
}

export function loadLocaleMessages(code: string): Promise<void> {
  if (code === DEFAULT_LOCALE) return Promise.resolve();
  if (!isSupported(code)) return Promise.resolve();
  if (globalComposer.availableLocales.includes(code)) return Promise.resolve();

  const cached = inflight.get(code);
  if (cached) return cached;

  const loader = localeLoaders[code];
  if (!loader) return Promise.resolve();

  const promise = loader().then((mod) => {
    globalComposer.setLocaleMessage(code, sanitizeMessages(code, mod.default));
  });
  inflight.set(code, promise);
  return promise;
}

export function bootstrapI18n(): Promise<void> {
  return loadLocaleMessages(getInitialLocale());
}

export function getLanguage(): string {
  return globalComposer.locale.value;
}

export async function setLanguage(code: string): Promise<void> {
  if (!isSupported(code)) return;
  await loadLocaleMessages(code);
  globalComposer.locale.value = code;
  if (typeof document !== "undefined") {
    document.documentElement.lang = code;
  }
}

export function t(key: string, params?: Record<string, unknown>): string {
  return globalComposer.t(key, params);
}
