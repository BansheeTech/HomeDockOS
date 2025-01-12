<!-- homedock-ui/vue3/static/js/__Components__/SettingsTabSystem.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template>
  <SettingsBoxFold>
    <label for="FormInputRunPort" class="block font-medium mb-2">
      <SettingsSeparator :class="[themeClasses.formInputSet]" text="HomeDock Port Access" :mdi_icon="counterIcon" />
    </label>

    <FormItem :validate-status="isPortValid ? 'success' : 'error'">
      <template #help>
        <div v-if="!isPortValid" class="flex items-center">
          <Icon :icon="alertIcon" size="18px" color="#FF4D4F" class="mr-1" />
          <span>{{ portErrorMessage }}</span>
        </div>
      </template>

      <InputNumber :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" @keypress="validateInput" v-model:value="portNumber" :min="80" :max="65535" placeholder="85..." class="w-full" name="FormInputRunPort" id="FormInputRunPort" pattern="\d*">
        <template #prefix>
          <Icon :icon="counterIcon" :class="[themeClasses.formIcon]" class="mr-1" />
        </template>
      </InputNumber>
    </FormItem>
  </SettingsBoxFold>

  <SettingsBoxFold>
    <label for="FormInputDynamicDNS" class="block font-medium mb-2">
      <SettingsSeparator :class="[themeClasses.formInputSet]" text="Hostname" :mdi_icon="webRefreshIcon" />
    </label>

    <Input :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" v-model:value="hostnameValue" name="FormInputDynamicDNS" id="FormInputDynamicDNS" placeholder="get.homedock.cloud">
      <template #prefix>
        <Icon :icon="globeIcon" :class="[themeClasses.formIcon]" class="mr-1" />
      </template>
    </Input>
  </SettingsBoxFold>

  <SettingsBoxFold>
    <label class="block font-medium mb-2">
      <SettingsSeparator :class="[themeClasses.formInputSet]" text="HomeDock Behavior" :mdi_icon="wrenchIcon" />
    </label>

    <div class="form-switch mb-2">
      <label class="inline-flex items-center">
        <Switch v-model:checked="homedockLocalValue" size="small" name="FormInputHomeDockLOcal" id="FormInputHomeDockLOcal" />
        <span :class="[themeClasses.optionSelector]" class="ml-2 flex items-center">
          <Icon :icon="lanIcon" :class="[themeClasses.optionSelector]" />
          <span class="ml-1">Enable access on homedock.local (Requires restart)</span>
        </span>
      </label>
    </div>

    <div class="form-switch mb-2">
      <label class="inline-flex items-center">
        <Switch v-model:checked="developmentValue" size="small" name="FormInputDevelopmentMode" id="FormInputDevelopmentMode" />
        <span :class="[themeClasses.optionSelector]" class="ml-2 flex items-center">
          <Icon :icon="hazardLightsIcon" :class="[themeClasses.optionSelector]" />
          <span class="ml-1">Run on development mode (Requires restart)</span>
        </span>
      </label>
    </div>

    <div class="form-switch mb-2">
      <label class="inline-flex items-center">
        <Switch v-model:checked="delOldDataUpdateValue" size="small" name="FormInputDeleteOldImages" id="FormInputDeleteOldImages" />
        <span :class="[themeClasses.optionSelector]" class="ml-2 flex items-center">
          <Icon :icon="deleteClockIcon" :class="[themeClasses.optionSelector]" />
          <span class="ml-1">Delete old data on app update</span>
        </span>
      </label>
    </div>

    <div class="form-switch">
      <label class="inline-flex items-center">
        <Switch v-model:checked="delOldDataUninstallValue" size="small" name="FormInputDeleteOldImagesUninstall" id="FormInputDeleteOldImagesUninstall" />
        <span :class="[themeClasses.optionSelector]" class="ml-2 flex items-center">
          <Icon :icon="deleteIcon" :class="[themeClasses.optionSelector]" />
          <span class="ml-1">Delete old data on app uninstall</span>
        </span>
      </label>
    </div>
  </SettingsBoxFold>
</template>
<script lang="ts" setup>
import { ref, watch, computed } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import { InputNumber, Input, FormItem, Switch } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import wrenchIcon from "@iconify-icons/mdi/wrench";
import globeIcon from "@iconify-icons/mdi/globe";
import counterIcon from "@iconify-icons/mdi/counter";
import deleteIcon from "@iconify-icons/mdi/delete-alert";
import deleteClockIcon from "@iconify-icons/mdi/delete-clock";
import hazardLightsIcon from "@iconify-icons/mdi/hazard-lights";
import lanIcon from "@iconify-icons/mdi/lan";
import alertIcon from "@iconify-icons/mdi/alert";
import webRefreshIcon from "@iconify-icons/mdi/web-refresh";

import SettingsBoxFold from "../__Components__/SettingsBoxFold.vue";
import SettingsSeparator from "../__Components__/SettingsSeparator.vue";

const { themeClasses } = useTheme();

// Props & Emit
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

// Reactive References
const portNumber = ref<number>(props.modelValue.runPort || 80);
const hostnameValue = ref<string>(props.modelValue.hostname || "get.homedock.cloud");
const homedockLocalValue = ref<boolean>(props.modelValue.localDNS || false);
const developmentValue = ref<boolean>(props.modelValue.developmentMode || false);
const delOldDataUpdateValue = ref<boolean>(props.modelValue.deleteOldImages || false);
const delOldDataUninstallValue = ref<boolean>(props.modelValue.deleteOldImagesUninstall || false);

// Input Validation
const validateInput = (event: KeyboardEvent) => {
  const char = String.fromCharCode(event.keyCode);
  if (!/[0-9]/.test(char)) {
    event.preventDefault();
  }
};

// Computed Validation
const isPortValid = computed(() => {
  return portNumber.value !== null && portNumber.value >= 80 && portNumber.value <= 65535;
});

const portErrorMessage = computed(() => {
  if (portNumber.value === null) return "Port can't be blank!";
  if (portNumber.value < 80) return "Ports 80 and below are reserved";
  if (portNumber.value > 65535) return "Ports higher than 65535 are not available";
  return "";
});

// Sync modelValue with reactive references
watch(
  () => ({
    runPort: portNumber.value,
    hostname: hostnameValue.value,
    localDNS: homedockLocalValue.value,
    developmentMode: developmentValue.value,
    deleteOldImages: delOldDataUpdateValue.value,
    deleteOldImagesUninstall: delOldDataUninstallValue.value,
  }),
  (newValue) => {
    emit("update:modelValue", newValue);
  },
  { deep: true }
);
</script>
