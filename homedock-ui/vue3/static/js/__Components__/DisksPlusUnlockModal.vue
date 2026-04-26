<!-- homedock-ui/vue3/static/js/__Components__/DisksPlusUnlockModal.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <AppDialog :visible="visible" :title="'Unlock Disks+'" :ok-text="loading ? 'Verifying' : 'Unlock'" :cancel-text="'Cancel'" :ok-cancel="true" :close-on-ok="false" :loading="loading" :ok-disabled="!password" :icon="lockIcon" type="confirm" @ok="handleSubmit" @cancel="handleCancel" @update:visible="onVisibleUpdate">
    <div class="flex flex-col gap-3">
      <p class="text-sm leading-relaxed m-0" :class="themeClasses.notTextDown">Disks+ gives you access to <strong>every mounted disk</strong> on this machine, including system paths protected behind danger zones. Enter your password to start {{ sessionMinutes > 0 ? `a ${sessionMinutes}-minute session` : 'a session with no timeout' }}.</p>

      <div v-if="dockerLimited" class="text-xs rounded-md px-3 py-2" :class="[themeClasses.warningBg, themeClasses.warningText]">
        <strong>HomeDock OS is running in Docker:</strong> Sadly, only paths bind-mounted into the container are visible. Add the host paths you want to browse as volumes in your compose file to be able to access them in Disks+. For example:
        <pre class="bg-transparent p-0 mt-2 mb-0 overflow-x-auto text-xs"><code>{{ "volumes:\n  - /mnt/my-disk:/mnt/my-disk" }}</code></pre>
      </div>

      <label class="text-xs font-semibold uppercase tracking-wider mt-2" :class="themeClasses.notTextUp">Password</label>
      <InputPassword ref="inputRef" v-model:value="password" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :disabled="loading" @keyup.enter="handleSubmit" placeholder="Enter your password" autocomplete="current-password" />

      <div v-if="loading" class="text-xs" :class="themeClasses.notTextDown">Verifying…</div>
      <div v-if="error" class="text-xs text-red-500 mt-1">{{ error }}</div>
    </div>
  </AppDialog>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick, computed, inject } from "vue";
import { InputPassword } from "ant-design-vue";
import AppDialog from "./AppDialog.vue";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useDisksPlusStore } from "../__Stores__/useDisksPlusStore";
import type { SettingsData } from "../__Types__/SettingsData";
import lockIcon from "@iconify-icons/mdi/lock-outline";

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{ "update:visible": [value: boolean]; unlocked: [] }>();

const { themeClasses } = useTheme();
const store = useDisksPlusStore();
const settingsData = inject<SettingsData | null>("data-settings", null);

const password = ref("");
const loading = ref(false);
const error = ref("");
const inputRef = ref<any>(null);
const dockerLimited = computed(() => store.dockerLimited);
const sessionMinutes = computed(() => {
  const ttl = store.session.ttl_seconds;
  if (ttl === 0) return 0;
  if (ttl > 0) return Math.round(ttl / 60);
  return settingsData?.disksplus_session_timeout_minutes ?? 10;
});

watch(
  () => props.visible,
  async (v) => {
    if (v) {
      password.value = "";
      error.value = "";
      loading.value = false;
      await nextTick();
      inputRef.value?.focus?.();
    }
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
    error.value = "Default password is not allowed to access Disks+. Please change it in Settings.";
    return;
  }
  loading.value = true;
  error.value = "";
  const result = await store.unlock(password.value);
  if (result.ok) {
    password.value = "";
    loading.value = false;
    emit("unlocked");
    emit("update:visible", false);
    return;
  }
  loading.value = false;
  error.value = mapError(result.error, result.remaining_attempts, result.retry_after);
}

function mapError(code: string | undefined, remaining: number | undefined, retryAfter: number | undefined): string {
  switch (code) {
    case "default_password":
      return "Default password is not allowed to access Disks+. Please change it in Settings.";
    case "invalid_password":
      if (typeof remaining === "number") return `Invalid password. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`;
      return "Invalid password.";
    case "locked_out":
      return `Too many failed attempts. Locked out for ${retryAfter ?? 300} seconds.`;
    case "decryption_failed":
      return "Password encryption failed. Please try again.";
    default:
      return code || "Unlock failed.";
  }
}
</script>
