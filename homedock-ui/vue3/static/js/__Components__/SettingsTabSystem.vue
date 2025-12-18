<!-- homedock-ui/vue3/static/js/__Components__/SettingsTabSystem.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <SettingsGroup header="NETWORK" footer="Configure network access ports and more for HomeDock OS.">
    <SettingsItem :icon="counterIcon" icon-color="blue" title="HomeDock OS Port" description="Port for accessing HomeDock (80-65535)">
      <FormItem :validate-status="isPortValid ? 'success' : 'error'" class="mb-0">
        <template #help>
          <div v-if="!isPortValid" class="flex items-center text-xs mt-1">
            <Icon :icon="alertIcon" size="14px" color="#FF4D4F" class="mr-1" />
            <span>{{ portErrorMessage }}</span>
          </div>
        </template>

        <InputNumber :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" @keypress="validateInput" v-model:value="portNumber" :min="80" :max="65535" placeholder="85..." name="FormInputRunPort" id="FormInputRunPort" pattern="\d*" style="width: 150px" />
      </FormItem>
    </SettingsItem>

    <SettingsItem :icon="globeIcon" icon-color="cyan" title="Hostname" description="Dynamic DNS hostname for remote access" is-last>
      <Input :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" v-model:value="hostnameValue" name="FormInputDynamicDNS" id="FormInputDynamicDNS" placeholder="get.homedock.cloud" style="width: 280px" />
    </SettingsItem>
  </SettingsGroup>

  <SettingsGroup header="SYSTEM BEHAVIOR" footer="Configure how HomeDock OS behaves and manages applications.">
    <SettingsItem :icon="lanIcon" icon-color="purple" title="Local DNS Access" description="Enable homedock.local access (requires restart)">
      <Switch v-model:checked="homedockLocalValue" name="FormInputHomeDockLocal" id="FormInputHomeDockLocal" />
    </SettingsItem>

    <SettingsItem :icon="chartBellCurveIcon" icon-color="gray" title="Anonymous Usage Data" description="Disable sending anonymous analytics">
      <Switch v-model:checked="disableUsageDataValue" name="FormInputDisableUsageData" id="FormInputDisableUsageData" />
    </SettingsItem>

    <SettingsItem :icon="deleteClockIcon" icon-color="orange" title="Auto-Clean on Update" description="Delete old images when updating apps">
      <Switch v-model:checked="delOldDataUpdateValue" name="FormInputDeleteOldImages" id="FormInputDeleteOldImages" />
    </SettingsItem>

    <SettingsItem :icon="deleteIcon" icon-color="red" title="Delete Images on Uninstall" description="Remove old images when uninstalling apps">
      <Switch v-model:checked="delOldDataUninstallValue" name="FormInputDeleteOldImagesUninstall" id="FormInputDeleteOldImagesUninstall" />
    </SettingsItem>

    <SettingsItem :icon="cubeOffIcon" icon-color="red" title="Delete Volumes on Uninstall" description="Remove app and user data when uninstalling" is-last>
      <Switch v-model:checked="deleteOldVolumesUninstall" name="FormInputDeleteVolumes" id="FormInputDeleteVolumes" />
    </SettingsItem>
  </SettingsGroup>

  <EnterpriseSlotRenderer module="SecureTunnel" />

  <div v-if="false">
    <SettingsItem :icon="hazardLightsIcon" icon-color="yellow" title="Development Mode" description="Run in development mode (requires restart)" is-last>
      <Switch v-model:checked="developmentValue" name="FormInputDevelopmentMode" id="FormInputDevelopmentMode" />
    </SettingsItem>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import { InputNumber, Input, FormItem, Switch } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import globeIcon from "@iconify-icons/mdi/globe";
import counterIcon from "@iconify-icons/mdi/counter";
import deleteIcon from "@iconify-icons/mdi/delete-alert";
import deleteClockIcon from "@iconify-icons/mdi/delete-clock";
import hazardLightsIcon from "@iconify-icons/mdi/hazard-lights";
import lanIcon from "@iconify-icons/mdi/lan";
import alertIcon from "@iconify-icons/mdi/alert";
import chartBellCurveIcon from "@iconify-icons/mdi/chart-bell-curve-cumulative";
import cubeOffIcon from "@iconify-icons/mdi/cube-off";

import SettingsGroup from "../__Components__/SettingsGroup.vue";
import SettingsItem from "../__Components__/SettingsItem.vue";

import EnterpriseSlotRenderer from "../__Components__/EnterpriseSlotRenderer.vue";

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
