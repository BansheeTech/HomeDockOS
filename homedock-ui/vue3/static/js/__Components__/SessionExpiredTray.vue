<!-- homedock-ui/vue3/static/js/__Components__/SessionExpiredTray.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Transition name="taskbar-item">
    <div v-if="sessionExpired" class="session-expired-wrapper" ref="indicatorRef">
      <div class="session-expired-indicator" :class="[themeClasses.networkIndicatorBg, themeClasses.networkIndicatorIcon, themeClasses.networkIndicatorBgHover, themeClasses.networkIndicatorIconHover]" @click="toggle">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
          <rect width="24" height="24" fill="none" />
          <mask id="sessionExpiredIcon">
            <defs>
              <symbol id="sessionSettingsPart">
                <path d="M15.24 6.37C15.65 6.6 16.04 6.88 16.38 7.2C16.6 7.4 16.8 7.61 16.99 7.83C17.46 8.4 17.85 9.05 18.11 9.77C18.2 10.03 18.28 10.31 18.35 10.59C18.45 11.04 18.5 11.52 18.5 12">
                  <animate fill="freeze" attributeName="d" begin="0.9s" dur="0.2s" values="M15.24 6.37C15.65 6.6 16.04 6.88 16.38 7.2C16.6 7.4 16.8 7.61 16.99 7.83C17.46 8.4 17.85 9.05 18.11 9.77C18.2 10.03 18.28 10.31 18.35 10.59C18.45 11.04 18.5 11.52 18.5 12;M15.24 6.37C15.65 6.6 16.04 6.88 16.38 7.2C16.38 7.2 19 6.12 19.01 6.14C19.01 6.14 20.57 8.84 20.57 8.84C20.58 8.87 18.35 10.59 18.35 10.59C18.45 11.04 18.5 11.52 18.5 12" />
                </path>
              </symbol>
            </defs>
            <g fill="none" stroke="#fff" stroke-width="1.3">
              <g stroke-linecap="round">
                <path stroke-dasharray="20" stroke-dashoffset="20" d="M12 9c1.66 0 3 1.34 3 3c0 1.66 -1.34 3 -3 3c-1.66 0 -3 -1.34 -3 -3c0 -1.66 1.34 -3 3 -3Z">
                  <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.2s" values="20;0" />
                </path>
                <path stroke-dasharray="48" stroke-dashoffset="48" d="M12 5.5c3.59 0 6.5 2.91 6.5 6.5c0 3.59 -2.91 6.5 -6.5 6.5c-3.59 0 -6.5 -2.91 -6.5 -6.5c0 -3.59 2.91 -6.5 6.5 -6.5Z">
                  <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.2s" dur="0.6s" values="48;0" />
                  <set fill="freeze" attributeName="opacity" begin="0.9s" to="0" />
                </path>
              </g>
              <g opacity="0">
                <use href="#sessionSettingsPart" />
                <use href="#sessionSettingsPart" transform="rotate(60 12 12)" />
                <use href="#sessionSettingsPart" transform="rotate(120 12 12)" />
                <use href="#sessionSettingsPart" transform="rotate(180 12 12)" />
                <use href="#sessionSettingsPart" transform="rotate(240 12 12)" />
                <use href="#sessionSettingsPart" transform="rotate(300 12 12)" />
                <set fill="freeze" attributeName="opacity" begin="0.9s" to="1" />
                <animateTransform attributeName="transform" dur="30s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12" />
              </g>
            </g>
            <g fill="none" stroke="#fff" stroke-dasharray="28" stroke-dashoffset="28" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.3">
              <path stroke="#000" d="M0 11h24" transform="rotate(45 12 12)">
                <animate fill="freeze" attributeName="stroke-dashoffset" begin="1.2s" dur="0.4s" values="28;0" />
              </path>
              <path d="M-1 13h24" transform="rotate(45 12 12)">
                <animate attributeName="d" dur="6s" repeatCount="indefinite" values="M-1 13h24;M1 13h24;M-1 13h24" />
                <animate fill="freeze" attributeName="stroke-dashoffset" begin="1.2s" dur="0.4s" values="28;0" />
              </path>
            </g>
          </mask>
          <rect width="24" height="24" fill="currentColor" mask="url(#sessionExpiredIcon)" />
        </svg>
      </div>

      <TrayPanel :open="isOpen" :anchor="indicatorRef" :title="$t('Session Status')" :subtitle="expiredTime ? `${$t('Expired')}: ${formatTime(expiredTime)}` : undefined" :icon="shieldIcon" icon-color="#f59e0b" @close="close">
        <div class="px-1.5 pt-1 space-y-2.5">
          <div :class="[themeClasses.storeInfoBar]" class="flex items-center gap-3 px-3 py-2.5 rounded-xl border">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0"></span>
            <span :class="[themeClasses.storeCardSubtitle]" class="flex-1 min-w-0 text-xs truncate">{{ $t("Authentication") }}</span>
            <span class="flex-shrink-0 text-xs font-semibold text-amber-500">{{ $t("Session Expired") }}</span>
          </div>
          <p :class="[themeClasses.storeCardSubtitle]" class="m-0 px-1 text-xs leading-relaxed">{{ $t("For security purposes, your session has expired. Please log in again to continue.") }}</p>
        </div>

        <template #footer>
          <button type="button" class="flex items-center justify-center gap-1.5 w-full h-8 rounded-full border-0 bg-blue-600 text-white text-xs font-semibold cursor-pointer transition-colors duration-150 hover:bg-blue-500" @click="redirectToLogin">
            <Icon :icon="loginIcon" class="w-3.5 h-3.5" />
            {{ $t("Log in again") }}
          </button>
        </template>
      </TrayPanel>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import axios, { AxiosError } from "axios";

import { ref, onMounted, onUnmounted } from "vue";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useTrayPanel } from "../__Composables__/useTrayManager";

import { Icon } from "@iconify/vue";
import shieldIcon from "@iconify-icons/mdi/shield-alert";
import loginIcon from "@iconify-icons/mdi/login";

import TrayPanel from "./TrayPanel.vue";

const { themeClasses } = useTheme();
const { isOpen, toggle, close } = useTrayPanel("session-expired-tray");

const indicatorRef = ref<HTMLElement | null>(null);
const sessionExpired = ref(false);
const expiredTime = ref<Date | null>(null);

let interceptorDecepticonId: number | null = null;

function formatTime(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // seconds

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleTimeString();
}

function redirectToLogin() {
  window.location.href = "/";
}

onMounted(() => {
  if (interceptorDecepticonId !== null) {
    return;
  }

  const nativeHasOwnProperty = Object.prototype.hasOwnProperty;
  const nativeIsInteger = Number.isInteger;
  const nativeIndexOf = String.prototype.indexOf;
  const nativeToLowerCase = String.prototype.toLowerCase;

  let lastActivationTime = 0;
  const ACTIVATION_COOLDOWN = 1000;
  let successfulRequests = 0;
  const RECOVERY_THRESHOLD = 3;

  interceptorDecepticonId = axios.interceptors.response.use(
    (response) => {
      if (sessionExpired.value && response.status >= 200 && response.status < 300) {
        successfulRequests++;

        if (successfulRequests >= RECOVERY_THRESHOLD) {
          sessionExpired.value = false;
          expiredTime.value = null;
          close();
          successfulRequests = 0;
        }
      }

      return response;
    },
    (error: AxiosError) => {
      successfulRequests = 0;
      try {
        if (!error || typeof error !== "object") {
          return Promise.reject(error);
        }

        if (!error.response || typeof error.response !== "object") {
          return Promise.reject(error);
        }

        const response = error.response;
        const status = response.status;

        if (typeof status !== "number" || !nativeIsInteger.call(Number, status) || status < 100 || status > 599) {
          return Promise.reject(error);
        }

        const now = Date.now();
        if (now - lastActivationTime < ACTIVATION_COOLDOWN) {
          return Promise.reject(error);
        }

        if (status === 401) {
          try {
            const requestUrl = (error.config?.url as string) || "";
            if (requestUrl.indexOf("/api/disksplus/") !== -1) {
              return Promise.reject(error);
            }
          } catch {}

          if (!sessionExpired.value) {
            sessionExpired.value = true;
            expiredTime.value = new Date();
            lastActivationTime = now;
          }
          return Promise.reject(error);
        }

        if (status === 403) {
          const data = response.data;

          if (!data || typeof data !== "object" || Array.isArray(data)) {
            return Promise.reject(error);
          }

          let errorMessage: unknown;
          let description: unknown;

          try {
            const hasErrorMessage = nativeHasOwnProperty.call(data, "error_message");
            const hasDescription = nativeHasOwnProperty.call(data, "description");

            if (hasErrorMessage) {
              const descriptor = Object.getOwnPropertyDescriptor(data, "error_message");
              if (descriptor && "value" in descriptor && !descriptor.get) {
                errorMessage = descriptor.value;
              }
            }

            if (hasDescription) {
              const descriptor = Object.getOwnPropertyDescriptor(data, "description");
              if (descriptor && "value" in descriptor && !descriptor.get) {
                description = descriptor.value;
              }
            }
          } catch {
            return Promise.reject(error);
          }

          const MAX_STRING_LENGTH = 1000;
          let messageStr = "";
          let descStr = "";

          try {
            if (typeof errorMessage === "string" && errorMessage.length > 0 && errorMessage.length <= MAX_STRING_LENGTH) {
              messageStr = nativeToLowerCase.call(errorMessage);
            }

            if (typeof description === "string" && description.length > 0 && description.length <= MAX_STRING_LENGTH) {
              descStr = nativeToLowerCase.call(description);
            }
          } catch {
            return Promise.reject(error);
          }

          let isCsrfError = false;
          try {
            isCsrfError = nativeIndexOf.call(messageStr, "csrf") !== -1 || nativeIndexOf.call(descStr, "csrf") !== -1;
          } catch {
            return Promise.reject(error);
          }

          if (isCsrfError && !sessionExpired.value) {
            sessionExpired.value = true;
            expiredTime.value = new Date();
            lastActivationTime = now;
          }
        }
      } catch {}
      return Promise.reject(error);
    },
  );
});

onUnmounted(() => {
  if (interceptorDecepticonId !== null) {
    axios.interceptors.response.eject(interceptorDecepticonId);
  }
});
</script>

<style scoped>
.session-expired-wrapper {
  position: relative;
  user-select: none;
}

.session-expired-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  transition: all 0.15s ease;
  cursor: pointer;
}

/* Taskbar item transitions */
.taskbar-item-enter-active,
.taskbar-item-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.taskbar-item-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(10px);
}

.taskbar-item-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(10px);
}
</style>
