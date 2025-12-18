// homedock-ui/vue3/static/js/__Utils__/EnterpriseSRILoader.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import axios from "axios";
import * as ed from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha2.js";

if (!globalThis.crypto?.subtle || !window.isSecureContext) {
  ed.hashes.sha512 = (msg: Uint8Array) => sha512(msg);
  ed.hashes.sha512Async = async (msg: Uint8Array) => sha512(msg);
}

import * as Vue from "vue";

import { ref, reactive, computed, watch, onMounted, onUnmounted, h, defineComponent, createApp, type Component } from "vue";
import { message, notification, Modal, Button, Switch, Input, Select, Spin } from "ant-design-vue";
import { getThemeClasses } from "../__Themes__/ThemeSelector";

const ENTERPRISE_PUBLIC_KEY = "oAr2gC4aEQkVVjYoys4bY/Jt+jLjXJkABkG2Lk1Nj88=";

export interface EnterpriseDeps {
  vue: {
    ref: typeof ref;
    reactive: typeof reactive;
    computed: typeof computed;
    watch: typeof watch;
    onMounted: typeof onMounted;
    onUnmounted: typeof onUnmounted;
    h: typeof h;
    defineComponent: typeof defineComponent;
    createApp: typeof createApp;
  };
  axios: typeof axios;
  antd: {
    message: typeof message;
    notification: typeof notification;
    Modal: typeof Modal;
    Button: typeof Button;
    Switch: typeof Switch;
    Input: typeof Input;
    Select: typeof Select;
    Spin: typeof Spin;
  };
  app: {
    csrfToken: string;
    theme: { selectedTheme: string; selectedBack: string };
    updateTheme: (theme: { selectedTheme?: string; selectedBack?: string }) => void;
    getThemeClasses: () => Record<string, string>;
  };
}

interface SignatureData {
  module: string;
  version: string;
  files: Record<string, string>;
  signature: string;
}

interface EnterpriseModule {
  name: string;
  js: string;
  hash: string;
  cog: string;
  sig: SignatureData;
}

interface EnterpriseModuleEntry {
  init?: (deps: EnterpriseDeps) => Promise<void> | void;
  component?: Component;
  destroy?: () => Promise<void> | void;
}

interface AppContext {
  csrfToken: { value: string };
  theme: { selectedTheme: string; selectedBack: string };
  updateTheme: (theme: { selectedTheme?: string; selectedBack?: string }) => void;
}

const loadedScripts = new Set<string>();
const initializedModules = new Set<string>();
const moduleRegistry = new Map<string, EnterpriseModuleEntry>();
const pendingRegistrations = new Map<string, (entry: EnterpriseModuleEntry) => void>();

let appContext: AppContext | null = null;
let isInitialized = false;
let serverPublicKey: string | null = null;

function registerModule(moduleName: string, entry: EnterpriseModuleEntry): void {
  moduleRegistry.set(moduleName, Object.freeze(entry));

  const pendingResolve = pendingRegistrations.get(moduleName);
  if (pendingResolve) {
    pendingResolve(entry);
    pendingRegistrations.delete(moduleName);
  }
}

if (typeof window !== "undefined") {
  (window as any).__HOMEDOCK_REGISTER_MODULE__ = registerModule;
  (window as any).Vue = Vue;
}

function hexToBase64(hexString: string): string {
  const bytes = new Uint8Array(hexString.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
  return btoa(String.fromCharCode(...bytes));
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function verifyEd25519Signature(message: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): Promise<boolean> {
  if (window.crypto?.subtle && window.isSecureContext) {
    try {
      const key = await crypto.subtle.importKey("raw", publicKey.buffer as ArrayBuffer, { name: "Ed25519" }, false, ["verify"]);
      return await crypto.subtle.verify({ name: "Ed25519" }, key, signature.buffer as ArrayBuffer, message.buffer as ArrayBuffer);
    } catch {}
  }
  return await ed.verifyAsync(signature, message, publicKey);
}

function sortObjectKeys(obj: any): any {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  const sorted: Record<string, any> = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = sortObjectKeys(obj[key]);
  }
  return sorted;
}

function deterministicStringify(obj: any): string {
  return JSON.stringify(sortObjectKeys(obj));
}

async function verifyModuleSignature(module: EnterpriseModule, serverPublicKey?: string): Promise<boolean> {
  try {
    const publicKeyB64 = serverPublicKey || ENTERPRISE_PUBLIC_KEY;
    if (serverPublicKey && serverPublicKey !== ENTERPRISE_PUBLIC_KEY) {
      console.error("[EnterpriseSRILoader] Public key mismatch - possible tampering detected");
      return false;
    }

    const publicKey = base64ToUint8Array(publicKeyB64);

    const payload = {
      module: module.sig.module,
      version: module.sig.version,
      files: module.sig.files,
    };

    const deterministicPayload = deterministicStringify(payload);
    const message = new TextEncoder().encode(deterministicPayload);
    const signature = base64ToUint8Array(module.sig.signature);

    const isValid = await verifyEd25519Signature(message, signature, publicKey);

    if (!isValid) {
      console.error(`[EnterpriseSRILoader] INVALID SIGNATURE for module '${module.name}'`);
    }

    return isValid;
  } catch (error) {
    console.error(`[EnterpriseSRILoader] Signature verification error for '${module.name}':`, error);
    return false;
  }
}

async function loadScriptWithSRI(url: string, hexHash: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.integrity = `sha256-${hexToBase64(hexHash)}`;

    const scriptUrl = new URL(url, window.location.href);
    if (scriptUrl.origin !== window.location.origin) {
      script.crossOrigin = "anonymous";
    }

    script.onload = () => resolve();

    script.onerror = () => {
      console.error("[EnterpriseSRILoader] Script failed (SRI check may have failed):", url);
      reject(new Error("Script load failed - integrity check may have failed"));
    };

    document.head.appendChild(script);
  });
}

function waitForRegistration(moduleName: string, timeoutMs: number = 5000): Promise<EnterpriseModuleEntry> {
  const existing = moduleRegistry.get(moduleName);
  if (existing) {
    return Promise.resolve(existing);
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingRegistrations.delete(moduleName);
      reject(new Error(`Module registration timeout: ${moduleName}`));
    }, timeoutMs);

    pendingRegistrations.set(moduleName, (entry) => {
      clearTimeout(timeout);
      resolve(entry);
    });
  });
}

function buildDeps(): EnterpriseDeps {
  if (!appContext) {
    throw new Error("EnterpriseSRILoader not initialized with app context");
  }

  return {
    vue: { ref, reactive, computed, watch, onMounted, onUnmounted, h, defineComponent, createApp },
    axios,
    antd: { message, notification, Modal, Button, Switch, Input, Select, Spin },
    app: {
      csrfToken: appContext.csrfToken.value,
      theme: appContext.theme,
      updateTheme: appContext.updateTheme,
      getThemeClasses: () => getThemeClasses(appContext!.theme.selectedTheme),
    },
  };
}

async function loadAndInitModule(module: EnterpriseModule): Promise<void> {
  if (module.sig) {
    const isValid = await verifyModuleSignature(module, serverPublicKey || undefined);
    if (!isValid) {
      console.error(`[EnterpriseSRILoader] REJECTED: Module '${module.name}' has invalid signature - NOT loading`);
      return;
    }
    console.log(`[EnterpriseSRILoader] Signature verified for module '${module.name}'`);
  } else {
    console.error(`[EnterpriseSRILoader] REJECTED: Module '${module.name}' has no signature - NOT loading`);
    return;
  }

  if (!loadedScripts.has(module.hash)) {
    await loadScriptWithSRI(module.js, module.hash);
    loadedScripts.add(module.hash);
  }

  const entry = await waitForRegistration(module.name);

  if (!initializedModules.has(module.name) && entry.init) {
    const deps = buildDeps();
    await entry.init(deps);
    initializedModules.add(module.name);
  }
}

export async function init(context: AppContext): Promise<void> {
  if (isInitialized) return;

  appContext = context;

  try {
    const response = await fetch("/api/enterprise/modules", {
      headers: { "X-HomeDock-CSRF-Token": context.csrfToken.value },
    });

    if (!response.ok) {
      isInitialized = true;
      return;
    }

    const data = await response.json();
    const modules: EnterpriseModule[] = data.modules || [];

    if (data.publicKey) {
      serverPublicKey = data.publicKey;
    }

    if (modules.length === 0) {
      isInitialized = true;
      return;
    }

    await Promise.all(modules.map((m) => loadAndInitModule(m)));
  } catch (error) {
    console.error("[EnterpriseSRILoader] Error during initialization:", error);
  }

  isInitialized = true;
}

export function getModuleByName(name: string): EnterpriseModuleEntry | null {
  return moduleRegistry.get(name) || null;
}

export function isReady(): boolean {
  return isInitialized;
}

export default {
  init,
  getModuleByName,
  isReady,
};
