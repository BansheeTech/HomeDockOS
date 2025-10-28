<!-- homedock-ui/vue3/static/js/__Components__/SettingsTabStorage.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <SettingsGroup header="EXTERNAL STORAGE" footer="Select an external drive or disable to disable mapping.">
    <SettingsItem :icon="harddiskIcon" icon-color="purple" title="Default External Drive" description="USB or external storage device" is-last>
      <Select class="rounded-xl" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" v-model:value="externalDriveValue" name="FormInputExternalDrive" id="FormInputExternalDrive" :popup-class-name="themeClasses.scopeSelector" :show-search="false" style="width: 280px">
        <SelectOptGroup label="External / USB">
          <SelectOption :class="[themeClasses.scopeSelector]" v-for="drive in validDrives" :key="drive" :value="drive">
            <div class="flex items-center">
              <Icon :icon="harddiskIcon" :class="[themeClasses.formIcon]" class="mr-2" size="16px" />
              {{ drive }}
            </div>
          </SelectOption>
        </SelectOptGroup>
        <SelectOptGroup label="Other">
          <SelectOption :class="[themeClasses.scopeSelector]" value="disabled">
            <div class="flex items-center">
              <Icon :icon="disabledIcon" :class="[themeClasses.formIcon]" class="mr-2" size="16px" />
              Disabled
            </div>
          </SelectOption>
        </SelectOptGroup>
      </Select>
    </SettingsItem>
  </SettingsGroup>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import { Select, SelectOption, SelectOptGroup } from "ant-design-vue";

import SettingsGroup from "../__Components__/SettingsGroup.vue";
import SettingsItem from "../__Components__/SettingsItem.vue";

import { Icon } from "@iconify/vue";
import harddiskIcon from "@iconify-icons/mdi/harddisk";
import disabledIcon from "@iconify-icons/mdi/close-circle";

const { themeClasses } = useTheme();

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

const externalDriveValue = ref<string>(props.modelValue.externalDrive || "Disabled");

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

<style scoped></style>
