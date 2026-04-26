<!-- homedock-ui/vue3/static/js/__Components__/DisksPlusDangerAuthModal.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <AppDialog :visible="modalState.visible" :title="'Access to Protected Path'" :ok-text="modalState.loading ? 'Verifying' : 'Authorize'" :cancel-text="'Cancel'" :ok-cancel="true" :close-on-ok="false" :loading="modalState.loading" :ok-disabled="!password" :icon="warningIcon" type="warning" @ok="handleSubmit" @cancel="handleCancel" @update:visible="onVisibleUpdate">
    <div class="flex flex-col gap-3">
      <p class="text-sm leading-relaxed m-0" :class="themeClasses.notTextDown">You are about to access a system-protected path:</p>

      <div class="rounded-lg px-3 py-2 text-xs font-mono break-all border" :class="[themeClasses.loginFormInput, themeClasses.notTextUp]">
        {{ modalState.zone || modalState.path }}
      </div>

      <p class="text-xs" :class="themeClasses.notTextDown">Confirm with your password to authorize access for the rest of <u>this</u> session.</p>

      <label class="text-xs font-semibold uppercase tracking-wider mt-2" :class="themeClasses.notTextUp">Password</label>
      <InputPassword ref="inputRef" v-model:value="password" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :disabled="modalState.loading" @keyup.enter="handleSubmit" placeholder="Enter your password" autocomplete="current-password" />

      <div v-if="modalState.loading" class="text-xs" :class="themeClasses.notTextDown">Verifying…</div>
      <div v-if="modalState.error" class="text-xs text-red-500 mt-1">{{ modalState.error }}</div>
    </div>
  </AppDialog>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick } from "vue";
import { InputPassword } from "ant-design-vue";
import AppDialog from "./AppDialog.vue";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useDangerAuth } from "../__Composables__/useDangerAuth";
import warningIcon from "@iconify-icons/mdi/shield-alert-outline";

const { themeClasses } = useTheme();
const { modalState, submitDangerAuth, cancelDangerAuth } = useDangerAuth();

const password = ref("");
const inputRef = ref<any>(null);

watch(
  () => modalState.visible,
  async (v) => {
    if (v) {
      password.value = "";
      await nextTick();
      inputRef.value?.focus?.();
    } else {
      password.value = "";
    }
  },
);

function onVisibleUpdate(value: boolean) {
  if (!value) cancelDangerAuth();
}

async function handleSubmit() {
  if (modalState.loading || !password.value) return;
  const pw = password.value;
  password.value = "";
  await submitDangerAuth(pw);
}

function handleCancel() {
  cancelDangerAuth();
}
</script>
