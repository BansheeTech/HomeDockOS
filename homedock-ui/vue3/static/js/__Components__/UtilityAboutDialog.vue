<!-- homedock-ui/vue3/static/js/__Components__/UtilityAboutDialog.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <AppDialog v-model:visible="visible" :title="$t(title)" :icon="icon" :ok-text="$t('Close')" :ok-cancel="false" :width="400">
    <div class="flex flex-col items-center text-center pb-5">
      <div :class="[themeClasses.aboutLogo]" class="w-16 h-16 rounded-2xl ring-1 shadow-lg flex items-center justify-center">
        <Icon :icon="icon" class="w-9 h-9" />
      </div>
      <h3 :class="[themeClasses.windowText]" class="text-lg font-semibold mt-3 mb-0">{{ $t(appName) }}</h3>
      <p :class="[themeClasses.windowText]" class="text-xs opacity-50 m-0">{{ $t("Part of HomeDock OS {version}", { version }) }}</p>
    </div>

    <section class="mb-4">
      <h4 :class="[themeClasses.windowText]" class="text-[11px] font-semibold uppercase tracking-wide opacity-50 mb-1.5">{{ $t("Compatible formats") }}</h4>
      <div v-for="format in formats" :key="format.name" class="flex items-center justify-between">
        <span :class="[themeClasses.windowText]" class="text-sm">{{ $t(format.name) }}</span>
        <span :class="[themeClasses.windowText]" class="text-xs opacity-50">{{ $t(format.support) }}</span>
      </div>
    </section>

    <section class="mb-4">
      <h4 :class="[themeClasses.windowText]" class="text-[11px] font-semibold uppercase tracking-wide opacity-50 mb-1.5">{{ $t("Built with") }}</h4>
      <p :class="[themeClasses.windowText]" class="text-sm m-0">{{ credits.join(" · ") }}</p>
    </section>

    <p :class="[themeClasses.windowText]" class="text-xs opacity-60 leading-relaxed mt-0 mb-3">{{ $t("{app} exists thanks to these open source projects and the people who build them.", { app: $t(appName) }) }}</p>

    <button type="button" :class="[themeClasses.appPropsActionButtonBg, themeClasses.appPropsActionButtonBorder, themeClasses.appPropsActionButtonText, themeClasses.appPropsActionButtonBgHover]" class="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer" @click="openLicenses">
      <Icon :icon="licenseIcon" class="w-4 h-4" />
      {{ $t("View Open Source Licenses") }}
    </button>
  </AppDialog>
</template>

<script lang="ts" setup>
import { inject } from "vue";

import { Icon, type IconifyIcon } from "@iconify/vue";
import licenseIcon from "@iconify-icons/mdi/shield-check";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useWindowStore } from "../__Stores__/windowStore";

import AppDialog from "./AppDialog.vue";

import type { CommonData } from "../__Types__/CommonData";

export interface UtilityFormat {
  name: string;
  support: string;
}

defineProps<{ title: string; appName: string; icon: IconifyIcon; formats: UtilityFormat[]; credits: string[] }>();

const visible = defineModel<boolean>("visible", { required: true });

const { themeClasses } = useTheme();
const windowStore = useWindowStore();
const version = inject<CommonData | null>("data-common", null)?.version ?? "";

function openLicenses() {
  visible.value = false;
  windowStore.openWindow("about");
}
</script>
