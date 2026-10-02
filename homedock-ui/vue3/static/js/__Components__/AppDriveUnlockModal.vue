<!-- homedock-ui/vue3/static/js/__Components__/AppDriveUnlockModal.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <AppDialog :visible="visible" :title="t('Protected folder')" :ok-text="loading ? t('Verifying') : t('Unlock')" :cancel-text="t('Cancel')" :ok-cancel="true" :close-on-ok="false" :loading="loading" :ok-disabled="!password" :icon="iconPath || shieldLockIcon" type="confirm" @ok="handleSubmit" @cancel="handleCancel" @update:visible="onVisibleUpdate">
    <div class="flex flex-col gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <span class="relative flex-shrink-0">
          <AppIconGraphic :image-src="iconPath || fallbackIcon" :size="44" />
          <span class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center bg-blue-500 text-white shadow-md shadow-black/20">
            <Icon :icon="shieldLockIcon" class="w-3 h-3" />
          </span>
        </span>
        <div class="flex flex-col min-w-0">
          <span class="text-sm font-semibold truncate" :class="themeClasses.notTextUp">{{ appName }}</span>
          <span class="text-xs font-mono truncate" :class="themeClasses.notTextDown" :title="containerPath">{{ containerPath }}</span>
        </div>
      </div>

      <p class="text-sm leading-relaxed m-0 [overflow-wrap:anywhere]" :class="themeClasses.notTextDown">
        {{ $t("This volume is outside HomeDock OS. {app} reaches it at {path} on the host, so for your security HomeDock OS needs your password again before opening it.", { app: appName, path: hostPath }) }}
        <template v-if="includesDependencies">{{ sessionMinutes > 0 ? $t("{app} and its dependencies will stay unlocked for {n} minutes.", { app: appName, n: sessionMinutes }) : $t("{app} and its dependencies will stay unlocked until you lock them.", { app: appName }) }}</template>
        <template v-else>{{ sessionMinutes > 0 ? $t("It will stay unlocked for {n} minutes.", { n: sessionMinutes }) : $t("It will stay unlocked until you lock it.") }}</template>
      </p>

      <p class="text-xs leading-relaxed m-0 flex items-start gap-1.5" :class="themeClasses.notTextDown">
        <Icon :icon="harddiskIcon" class="w-3.5 h-3.5 flex-shrink-0 mt-px opacity-70" />
        <span>{{ $t("It uses the same protection Disks+ applies to system folders.") }}</span>
      </p>

      <div v-if="store.dockerLimited" class="text-xs rounded-md px-3 py-2" :class="[themeClasses.warningBg, themeClasses.warningText]">
        <strong>{{ $t("HomeDock OS is running in Docker:") }}</strong> {{ $t("Sadly, only paths bind-mounted into the container are visible. Add the host paths your apps use as volumes in your compose file to be able to access them in App Drive. For example:") }}
        <pre class="bg-transparent p-0 mt-2 mb-0 overflow-x-auto text-xs"><code>{{ "volumes:\n  - /mnt/my-disk:/mnt/my-disk" }}</code></pre>
      </div>

      <label class="text-xs font-semibold uppercase tracking-wider mt-1" :class="themeClasses.notTextUp">{{ $t("Password") }}</label>
      <InputPassword ref="inputRef" v-model:value="password" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :disabled="loading" @keyup.enter="handleSubmit" :placeholder="$t('Enter your password')" autocomplete="current-password" />

      <div v-if="loading" class="text-xs" :class="themeClasses.notTextDown">{{ $t("Verifying…") }}</div>
      <div v-if="error" class="text-xs text-red-500 mt-1">{{ error }}</div>
    </div>
  </AppDialog>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick, computed, inject } from "vue";
import { useI18n } from "vue-i18n";
import { InputPassword } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import shieldLockIcon from "@iconify-icons/mdi/shield-lock";
import harddiskIcon from "@iconify-icons/mdi/harddisk";

import AppDialog from "./AppDialog.vue";
import AppIconGraphic from "./AppIconGraphic.vue";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useDisksPlusStore } from "../__Stores__/useDisksPlusStore";
import type { SettingsData } from "../__Types__/SettingsData";

const props = defineProps<{
  visible: boolean;
  appName: string;
  iconPath?: string;
  containerPath: string;
  hostPath: string;
  scope: string;
  includesDependencies?: boolean;
}>();

const emit = defineEmits<{ "update:visible": [value: boolean]; unlocked: [] }>();

const { themeClasses } = useTheme();
const { t } = useI18n();
const store = useDisksPlusStore();
const settingsData = inject<SettingsData | null>("data-settings", null);

const fallbackIcon = "docker-icons/notfound.jpg";
const password = ref("");
const loading = ref(false);
const error = ref("");
const inputRef = ref<any>(null);

const sessionMinutes = computed(() => {
  const ttl = store.session.ttl_seconds;
  if (ttl === 0) return 0;
  if (ttl > 0) return Math.round(ttl / 60);
  return settingsData?.disksplus_session_timeout_minutes ?? 10;
});

watch(
  () => props.visible,
  async (visible) => {
    if (!visible) return;

    password.value = "";
    error.value = "";
    loading.value = false;
    await nextTick();
    inputRef.value?.focus?.();
  },
);

function onVisibleUpdate(value: boolean) {
  if (!value) emit("update:visible", false);
}

function handleCancel() {
  emit("update:visible", false);
}

async function handleSubmit() {
  if (loading.value || !password.value) return;

  if (password.value === "passwd") {
    error.value = t("The default password can't unlock protected folders. Change it in Settings first.");
    return;
  }

  loading.value = true;
  error.value = "";

  const result = await store.unlock(password.value, props.scope);

  loading.value = false;

  if (result.ok) {
    password.value = "";
    emit("unlocked");
    emit("update:visible", false);
    return;
  }

  error.value = mapError(result.error, result.remaining_attempts, result.retry_after);
}

function mapError(code: string | undefined, remaining: number | undefined, retryAfter: number | undefined): string {
  switch (code) {
    case "default_password":
      return t("The default password can't unlock protected folders. Change it in Settings first.");
    case "invalid_password":
      if (typeof remaining === "number") return t("Invalid password. {n} attempts remaining.", { n: remaining });
      return t("Invalid password.");
    case "locked_out":
      return t("Too many failed attempts. Locked out for {n} seconds.", { n: retryAfter ?? 300 });
    case "decryption_failed":
      return t("Password encryption failed. Please try again.");
    default:
      return code || t("Unlock failed.");
  }
}
</script>
