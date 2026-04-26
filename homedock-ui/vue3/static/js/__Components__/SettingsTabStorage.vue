<!-- homedock-ui/vue3/static/js/__Components__/SettingsTabStorage.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <SettingsGroup header="TRACKED EXTERNAL DISK" footer="Track a secondary disk for historical usage charts in System Logs.">
    <SettingsItem :icon="harddiskIcon" icon-color="purple" title="Track External Disk" description="Secondary disk shown in System Logs" is-last>
      <Select class="rounded-xl" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" v-model:value="externalDriveValue" name="FormInputTrackExternalDisk" id="FormInputTrackExternalDisk" :popup-class-name="themeClasses.scopeSelector" :show-search="false" style="width: 320px">
        <SelectOption :class="[themeClasses.scopeSelector]" value="disabled">
          <div class="flex items-center gap-2">
            <Icon :icon="disabledIcon" :class="[themeClasses.formIcon]" size="16px" />
            Disabled
          </div>
        </SelectOption>
        <SelectOption :class="[themeClasses.scopeSelector]" v-for="disk in selectableDisks" :key="disk.device" :value="disk.device">
          <div class="flex items-center gap-2">
            <Icon :icon="iconForMediaType(disk.media_type)" :class="[themeClasses.formIcon]" size="16px" />
            <span>{{ disk.label || disk.device }}</span>
            <span class="text-xs opacity-60">{{ formatSize(disk.total_gb) }}</span>
          </div>
        </SelectOption>
      </Select>
    </SettingsItem>
  </SettingsGroup>

  <SettingsGroup header="DISKS+ SECURITY" footer="Configure Disks+ session timeout and protected path access.">
    <SettingsItem :icon="shieldLockIcon" icon-color="orange" title="Password for Protected Paths" description="Require password re-entry to access system-critical directories">
      <Switch v-model:checked="requireProtectedPathsPassword" name="FormInputProtectedPathsPassword" id="FormInputProtectedPathsPassword" />
    </SettingsItem>

    <SettingsItem :icon="timerIcon" icon-color="blue" title="Disks+ Session Timeout" description="How long an unlocked Disks+ session stays active" is-last>
      <Select class="rounded-xl" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :value="disksplusSessionTimeoutMinutes" @change="handleTimeoutChange" name="FormInputDisksPlusSessionTimeout" id="FormInputDisksPlusSessionTimeout" :popup-class-name="themeClasses.scopeSelector" :show-search="false" style="width: 180px">
        <SelectOption :class="[themeClasses.scopeSelector]" :value="0">Disabled</SelectOption>
        <SelectOption :class="[themeClasses.scopeSelector]" :value="3">3 minutes</SelectOption>
        <SelectOption :class="[themeClasses.scopeSelector]" :value="5">5 minutes</SelectOption>
        <SelectOption :class="[themeClasses.scopeSelector]" :value="10">10 minutes</SelectOption>
        <SelectOption :class="[themeClasses.scopeSelector]" :value="15">15 minutes</SelectOption>
      </Select>
    </SettingsItem>
  </SettingsGroup>

  <AppDialog v-model:visible="showDisableTimeoutWarning" type="warning" title="Disable Session Timeout" ok-text="I Understand, Disable" cancel-text="Cancel" @ok="confirmDisableTimeout" @cancel="cancelDisableTimeout" :icon="alertIcon" :width="480" :reverse-buttons="true">
    <div class="space-y-3">
      <p :class="[themeClasses.notTextDown]" class="text-sm leading-relaxed">Disabling the session timeout means your Disks+ session will <strong>never expire automatically</strong>. The session will remain active until you manually lock it or log out.</p>

      <div :class="[themeClasses.dropZoneTotalSizeScope]" class="rounded-lg p-3.5 space-y-2.5">
        <p class="text-sm font-bold flex items-center gap-2">
          <Icon :icon="shieldLockIcon" class="w-5 h-5" />
          <span>Security Risks</span>
        </p>
        <p class="text-xs leading-relaxed">With the session timeout disabled:</p>
        <ul class="text-xs space-y-1.5 ml-4 list-disc">
          <li>Any security breach could expose the <strong>entire contents of all mounted disks</strong></li>
          <li>System-critical paths behind <strong>danger zones</strong> remain accessible indefinitely</li>
          <li>An unattended session is an <strong>open door</strong> to your filesystem</li>
        </ul>
      </div>

      <p :class="[themeClasses.notTextDown]" class="text-xs leading-relaxed font-semibold">We recommend keeping a timeout enabled. Sessions renew automatically on every interaction, so the timeout only triggers during prolonged inactivity.</p>
    </div>
  </AppDialog>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useDisksPlusStore } from "../__Stores__/useDisksPlusStore";

import { Select, SelectOption, Switch } from "ant-design-vue";

import SettingsGroup from "../__Components__/SettingsGroup.vue";
import SettingsItem from "../__Components__/SettingsItem.vue";
import AppDialog from "../__Components__/AppDialog.vue";

import { Icon } from "@iconify/vue";
import harddiskIcon from "@iconify-icons/mdi/harddisk";
import harddiskPlusIcon from "@iconify-icons/mdi/harddisk-plus";
import usbFlashIcon from "@iconify-icons/mdi/usb-flash-drive";
import discIcon from "@iconify-icons/mdi/disc";
import sdIcon from "@iconify-icons/mdi/sd";
import disabledIcon from "@iconify-icons/mdi/close-circle";
import shieldLockIcon from "@iconify-icons/mdi/shield-lock";
import timerIcon from "@iconify-icons/mdi/timer-outline";
import alertIcon from "@iconify-icons/mdi/alert";

const { themeClasses } = useTheme();
const diskStore = useDisksPlusStore();

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

const externalDriveValue = ref<string>(props.modelValue.default_external_drive || "disabled");
const requireProtectedPathsPassword = ref<boolean>(props.modelValue.require_protected_paths_password ?? true);
const disksplusSessionTimeoutMinutes = ref<number>(props.modelValue.disksplus_session_timeout_minutes ?? 10);

const showDisableTimeoutWarning = ref(false);

function handleTimeoutChange(value: any) {
  const numValue = Number(value);
  if (numValue === 0 && disksplusSessionTimeoutMinutes.value !== 0) {
    showDisableTimeoutWarning.value = true;
    return;
  }
  disksplusSessionTimeoutMinutes.value = numValue;
}

function confirmDisableTimeout() {
  showDisableTimeoutWarning.value = false;
  disksplusSessionTimeoutMinutes.value = 0;
}

function cancelDisableTimeout() {
  showDisableTimeoutWarning.value = false;
}

watch(
  () => ({
    default_external_drive: externalDriveValue.value,
    require_protected_paths_password: requireProtectedPathsPassword.value,
    disksplus_session_timeout_minutes: disksplusSessionTimeoutMinutes.value,
  }),
  (newValue) => {
    emit("update:modelValue", newValue);
  },
  { deep: true },
);

const selectableDisks = computed(() => {
  return diskStore.otherDisks.slice().sort((a, b) => {
    if (a.internal && !b.internal) return -1;
    if (!a.internal && b.internal) return 1;
    return (a.label || a.device).localeCompare(b.label || b.device);
  });
});

function iconForMediaType(mediaType: string) {
  switch (mediaType) {
    case "nvme":
      return harddiskPlusIcon;
    case "ssd":
      return harddiskIcon;
    case "hdd":
      return harddiskIcon;
    case "usb":
      return usbFlashIcon;
    case "optical":
      return discIcon;
    default:
      return sdIcon;
  }
}

function formatSize(gb: number): string {
  if (!gb || gb <= 0) return "";
  if (gb >= 1024) return `${(gb / 1024).toFixed(1)} TB`;
  return `${gb.toFixed(0)} GB`;
}
</script>

<style scoped></style>
