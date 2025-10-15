<!-- homedock-ui/vue3/static/js/__Components__/SettingsTabSystem.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
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
      <SettingsSeparator :class="[themeClasses.formInputSet]" text="HomeDock OS Behavior" :mdi_icon="wrenchIcon" />
    </label>

    <div class="form-switch mb-1">
      <label class="inline-flex items-start">
        <Switch v-model:checked="homedockLocalValue" size="small" name="FormInputHomeDockLOcal" id="FormInputHomeDockLOcal" class="mt-0.5" />
        <span :class="[themeClasses.optionSelector]" class="ml-2 flex items-start">
          <Icon :icon="lanIcon" :class="[themeClasses.optionSelector]" class="mt-0.5 h-4 min-h-4 min-w-4 min-h-4" />
          <span class="ml-1">Enable access on homedock.local (Requires restart)</span>
        </span>
      </label>
    </div>

    <div class="form-switch mb-1 hidden">
      <label class="inline-flex items-start">
        <Switch v-model:checked="developmentValue" size="small" name="FormInputDevelopmentMode" id="FormInputDevelopmentMode" class="mt-0.5" />
        <span :class="[themeClasses.optionSelector]" class="ml-2 flex items-start">
          <Icon :icon="hazardLightsIcon" :class="[themeClasses.optionSelector]" class="mt-0.5 h-4 min-h-4 min-w-4 min-h-4" />
          <span class="ml-1">Run on development mode (Requires restart)</span>
        </span>
      </label>
    </div>

    <div class="form-switch mb-1">
      <label class="inline-flex items-start">
        <Switch v-model:checked="disableUsageDataValue" size="small" name="FormInputDisableUsageData" id="FormInputDisableUsageData" class="mt-0.5" />
        <span :class="[themeClasses.optionSelector]" class="ml-2 flex items-start">
          <Icon :icon="chartBellCurveIcon" :class="[themeClasses.optionSelector]" class="mt-0.5 h-4 min-h-4 min-w-4 min-h-4" />
          <span class="ml-1">Disable sending anonymous usage data</span>
        </span>
      </label>
    </div>

    <div class="form-switch mb-1">
      <label class="inline-flex items-start">
        <Switch v-model:checked="delOldDataUpdateValue" size="small" name="FormInputDeleteOldImages" id="FormInputDeleteOldImages" class="mt-0.5" />
        <span :class="[themeClasses.optionSelector]" class="ml-2 flex items-start">
          <Icon :icon="deleteClockIcon" :class="[themeClasses.optionSelector]" class="mt-0.5 h-4 min-h-4 min-w-4 min-h-4" />
          <span class="ml-1">Delete old installed image on app update</span>
        </span>
      </label>
    </div>

    <div class="form-switch mb-1">
      <label class="inline-flex items-start">
        <Switch v-model:checked="delOldDataUninstallValue" size="small" name="FormInputDeleteOldImagesUninstall" id="FormInputDeleteOldImagesUninstall" class="mt-0.5" />
        <span :class="[themeClasses.optionSelector]" class="ml-2 flex items-start">
          <Icon :icon="deleteIcon" :class="[themeClasses.optionSelector]" class="mt-0.5 h-4 min-h-4 min-w-4 min-h-4" />
          <span class="ml-1">Delete old installed image on app uninstall</span>
        </span>
      </label>
    </div>

    <div class="form-switch">
      <label class="inline-flex items-start">
        <Switch v-model:checked="deleteOldVolumesUninstall" size="small" name="FormInputDeleteOldImagesUninstall" id="FormInputDeleteOldImagesUninstall" class="mt-0.5" />
        <span :class="[themeClasses.optionSelector]" class="ml-2 flex items-start">
          <Icon :icon="cubeOffIcon" :class="[themeClasses.optionSelector]" class="mt-0.5 h-4 min-h-4 min-w-4 min-h-4" />
          <span class="ml-1">Delete app and user data volumes on uninstall</span>
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
import chartBellCurveIcon from "@iconify-icons/mdi/chart-bell-curve-cumulative";
import cubeOffIcon from "@iconify-icons/mdi/cube-off";

import SettingsBoxFold from "../__Components__/SettingsBoxFold.vue";
import SettingsSeparator from "../__Components__/SettingsSeparator.vue";

const { themeClasses } = useTheme();

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

const portNumber = ref<number>(props.modelValue.runPort || 80);
const hostnameValue = ref<string>(props.modelValue.hostname || "get.homedock.cloud");
const homedockLocalValue = ref<boolean>(props.modelValue.localDNS || false);
const developmentValue = ref<boolean>(props.modelValue.developmentMode || false);
const disableUsageDataValue = ref<boolean>(props.modelValue.disableUsageData || false);
const delOldDataUpdateValue = ref<boolean>(props.modelValue.deleteOldImages || false);
const delOldDataUninstallValue = ref<boolean>(props.modelValue.deleteOldImagesUninstall || false);
const deleteOldVolumesUninstall = ref<boolean>(props.modelValue.deleteVolumesUninstall || false);

const validateInput = (event: KeyboardEvent) => {
  const char = String.fromCharCode(event.keyCode);
  if (!/[0-9]/.test(char)) {
    event.preventDefault();
  }
};

const isPortValid = computed(() => {
  return portNumber.value !== null && portNumber.value >= 80 && portNumber.value <= 65535;
});

const portErrorMessage = computed(() => {
  if (portNumber.value === null) return "Port can't be blank!";
  if (portNumber.value < 80) return "Ports 80 and below are reserved";
  if (portNumber.value > 65535) return "Ports higher than 65535 are not available";
  return "";
});

watch(
  () => ({
    runPort: portNumber.value,
    hostname: hostnameValue.value,
    localDNS: homedockLocalValue.value,
    developmentMode: developmentValue.value,
    disableUsageData: disableUsageDataValue.value,
    deleteOldImages: delOldDataUpdateValue.value,
    deleteOldImagesUninstall: delOldDataUninstallValue.value,
    deleteVolumesUninstall: deleteOldVolumesUninstall.value,
  }),
  (newValue) => {
    emit("update:modelValue", newValue);
  },
  { deep: true }
);
</script>
