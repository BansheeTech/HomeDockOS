<!-- homedock-ui/vue3/static/js/__Components__/SettingsTabStorage.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template>
  <SettingsBoxFold>
    <label for="FormInputExternalDrive" class="block text-gray-700 font-medium mb-2">
      <SettingsSeparator :class="[themeClasses.formInputSet]" text="External Storage" :mdi_icon="harddiskIcon" />
    </label>

    <Select :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" v-model:value="externalDriveValue" class="w-full z-0" name="FormInputExternalDrive" id="FormInputExternalDrive" :popup-class-name="`${themeClasses.scopeSelector} z-0`">
      <SelectOptGroup label="External / USB">
        <SelectOption :class="[themeClasses.scopeSelector]" v-for="drive in validDrives" :key="drive" :value="drive">
          <div class="flex items-center">
            <Icon :icon="harddiskIcon" :class="[themeClasses.formIcon]" class="mr-1" />
            {{ drive }}
          </div>
        </SelectOption>
      </SelectOptGroup>
      <SelectOptGroup label="Other">
        <SelectOption value="disabled" :suffixIcon="disabledIcon">
          <div class="flex items-center">
            <Icon :icon="disabledIcon" :class="[themeClasses.formIcon]" class="mr-1" />
            Disabled
          </div>
        </SelectOption>
      </SelectOptGroup>
    </Select>
  </SettingsBoxFold>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import { Select, SelectOption, SelectOptGroup } from "ant-design-vue";

import SettingsBoxFold from "../__Components__/SettingsBoxFold.vue";
import SettingsSeparator from "../__Components__/SettingsSeparator.vue";

import { Icon } from "@iconify/vue";
import harddiskIcon from "@iconify-icons/mdi/harddisk";
import disabledIcon from "@iconify-icons/mdi/close-circle";

const { themeClasses } = useTheme();

// Props & Emit
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  validDrives: {
    type: Array as () => string[],
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

// Reactive References
const externalDriveValue = ref<string>(props.modelValue.externalDrive || "Disabled");

// Sync modelValue with reactive references
watch(
  () => ({
    externalDrive: externalDriveValue.value,
  }),
  (newValue) => {
    emit("update:modelValue", newValue);
  },
  { deep: true }
);
</script>

<style scoped>
:global(.dark-mode-theme.ant-select-dropdown) {
  background-color: rgb(39, 39, 42) !important;
}

:global(.aero-mode-theme.ant-select-dropdown) {
  background-color: rgb(0, 0, 0, 0) !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
}

:global(.dark-mode-theme .ant-select-item-group) {
  color: rgb(161, 161, 170) !important;
}

:global(.aero-mode-theme .ant-select-item-group) {
  color: rgb(161, 161, 170) !important;
}
</style>
