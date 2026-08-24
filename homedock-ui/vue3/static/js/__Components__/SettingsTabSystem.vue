<!-- homedock-ui/vue3/static/js/__Components__/SettingsTabSystem.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <SettingsGroup :header="$t('NETWORK')" :footer="$t('Configure network access ports and more for HomeDock OS.')">
    <SettingsItem :icon="counterIcon" icon-color="blue" :title="$t('HomeDock OS Port')" :description="$t('Port for accessing HomeDock (80-65535)')" is-last>
      <template #badge>
        <SettingsHelpTooltip :text="$t('If a valid certificate is installed and this is still 80, HomeDock OS moves itself to 443 on the next start, which is where browsers expect a secure address. Port 80 stays in use, sending anyone who arrives there on to the secure one. Ports below 80 are reserved, and if something else already holds the port you pick, HomeDock OS will not start.')" />
      </template>
      <FormItem :validate-status="isPortValid ? 'success' : 'error'" class="mb-0">
        <template #help>
          <div v-if="!isPortValid" class="flex items-center text-xs mt-1">
            <Icon :icon="alertIcon" size="14px" color="#FF4D4F" class="mr-1" />
            <span>{{ portErrorMessage }}</span>
          </div>
        </template>

        <InputNumber :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" @keypress="validateInput" v-model:value="portNumber" :min="80" :max="65535" :placeholder="$t('85...')" name="FormInputRunPort" id="FormInputRunPort" pattern="\d*" style="width: 150px" />
      </FormItem>
    </SettingsItem>
  </SettingsGroup>

  <SettingsCertificate v-model:localHttp="localHttpAccessValue" v-model:domain="hostnameValue" v-model:ipSync="dynamicDnsSyncValue" :reverse-proxy="reverseProxyValue" :local-http-changed="localHttpAccessChanged" />

  <SettingsGroup :header="$t('SYSTEM BEHAVIOR')" :footer="$t('Configure how HomeDock OS behaves and manages applications.')">
    <SettingsItem v-if="!isCloudInstance" :icon="lanIcon" icon-color="purple" :title="$t('Local DNS Access')" :description="$t('Enable homedock.local access')">
      <template #badge>
        <SettingsHelpTooltip :text="$t('Makes this machine findable by name on your network instead of by its IP address. OnScreen Apps will not work on that name, though: Windows cannot find their addresses and Safari signs you out of the app as it opens.')" />
      </template>
      <template #after-description>
        <Transition name="restart-badge">
          <span v-if="localDNSChanged" class="inline-block text-[8px] font-semibold uppercase tracking-wide px-1.5 py-px rounded-md bg-blue-400/15 text-blue-400">{{ $t("Requires Restart") }}</span>
        </Transition>
      </template>
      <Switch v-model:checked="homedockLocalValue" name="FormInputHomeDockLocal" id="FormInputHomeDockLocal" />
    </SettingsItem>

    <SettingsItem v-if="!isCloudInstance" :icon="serverNetworkIcon" icon-color="green" :title="$t('External Reverse Proxy')" :description="$t('Enable if running behind a proxy of your own')">
      <template #badge>
        <SettingsHelpTooltip :text="$t('HomeDock OS is the reverse proxy now: it gives every app its own address and checks your session before the request reaches the app, so you do not need another server in front for that. If you already run one and want to keep it, turn this on and HomeDock OS will trust what it says about who is connecting and over which protocol, accepted only from an address on your own network. Either way the apps need HTTPS working on your domain, set up above if HomeDock OS is exposed directly and on your proxy if it is not, because this also switches off plain HTTP on the local network.')" />
      </template>
      <template #after-description>
        <Transition name="restart-badge">
          <span v-if="reverseProxyChanged" class="inline-block text-[8px] font-semibold uppercase tracking-wide px-1.5 py-px rounded-md bg-blue-400/15 text-blue-400">{{ $t("Requires Restart") }}</span>
        </Transition>
        <Transition name="restart-badge">
          <span v-if="reverseProxyChanged" class="inline-block text-[8px] font-semibold uppercase tracking-wide px-1.5 py-px rounded-md bg-blue-400/15 text-blue-400">{{ $t("SSL required on proxy") }}</span>
        </Transition>
      </template>
      <Switch v-model:checked="reverseProxyValue" name="FormInputReverseProxy" id="FormInputReverseProxy" />
    </SettingsItem>

    <SettingsItem :icon="chartBellCurveIcon" icon-color="gray" :title="$t('Anonymous Usage Data')" :description="$t('Disable sending anonymous analytics')">
      <template #badge>
        <SettingsHelpTooltip :text="$t('Twice a day HomeDock OS sends a heartbeat: the version you are running and the system underneath it. No apps, no addresses, no files, nothing about what you do with it. It is there to count how many instances are out there.')" />
      </template>
      <Switch v-model:checked="disableUsageDataValue" name="FormInputDisableUsageData" id="FormInputDisableUsageData" />
    </SettingsItem>

    <SettingsItem :icon="deleteClockIcon" icon-color="orange" :title="$t('Auto-Clean on Update')" :description="$t('Delete old images when updating apps')">
      <template #badge>
        <SettingsHelpTooltip :text="$t('Updating an app downloads a new image and leaves the old one on disk. Deleting it frees the space, at the cost of having to download it again if you ever want to go back to that version.')" />
      </template>
      <Switch v-model:checked="delOldDataUpdateValue" name="FormInputDeleteOldImages" id="FormInputDeleteOldImages" />
    </SettingsItem>

    <SettingsItem :icon="deleteIcon" icon-color="red" :title="$t('Delete Images on Uninstall')" :description="$t('Remove old images when uninstalling apps')">
      <template #badge>
        <SettingsHelpTooltip :text="$t('Uninstalling leaves the image on disk so reinstalling is instant. Deleting it frees the space and makes the next install download everything again.')" />
      </template>
      <Switch v-model:checked="delOldDataUninstallValue" name="FormInputDeleteOldImagesUninstall" id="FormInputDeleteOldImagesUninstall" />
    </SettingsItem>

    <SettingsItem :icon="cubeOffIcon" icon-color="red" :title="$t('Delete Volumes on Uninstall')" :description="$t('Remove app and user data when uninstalling')" is-last>
      <template #badge>
        <SettingsHelpTooltip :text="$t('Deletes the data folders HomeDock OS keeps for that app: databases, settings, uploads. Anything you mounted yourself from elsewhere on the disk is left alone. There is no undo and none of it is in a backup unless you made one, so leaving this off means the data survives an uninstall.')" />
      </template>
      <Switch v-model:checked="deleteOldVolumesUninstall" name="FormInputDeleteVolumes" id="FormInputDeleteVolumes" />
    </SettingsItem>
  </SettingsGroup>

  <EnterpriseSlotRenderer module="SecureTunnel" />

  <div v-if="false">
    <SettingsItem :icon="hazardLightsIcon" icon-color="yellow" :title="$t('Development Mode')" :description="$t('Run in development mode (requires restart)')" is-last>
      <Switch v-model:checked="developmentValue" name="FormInputDevelopmentMode" id="FormInputDevelopmentMode" />
    </SettingsItem>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from "vue";
import { useI18n } from "vue-i18n";

import { useTheme } from "../__Themes__/ThemeSelector";

import { InputNumber, FormItem, Switch } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import counterIcon from "@iconify-icons/mdi/counter";
import deleteIcon from "@iconify-icons/mdi/delete-alert";
import deleteClockIcon from "@iconify-icons/mdi/delete-clock";
import hazardLightsIcon from "@iconify-icons/mdi/hazard-lights";
import lanIcon from "@iconify-icons/mdi/lan";
import alertIcon from "@iconify-icons/mdi/alert";
import chartBellCurveIcon from "@iconify-icons/mdi/chart-bell-curve-cumulative";
import cubeOffIcon from "@iconify-icons/mdi/cube-off";
import serverNetworkIcon from "@iconify-icons/mdi/server-network";

import SettingsGroup from "../__Components__/SettingsGroup.vue";
import SettingsItem from "../__Components__/SettingsItem.vue";
import SettingsHelpTooltip from "../__Components__/SettingsHelpTooltip.vue";
import SettingsCertificate from "../__Components__/SettingsCertificate.vue";

import EnterpriseSlotRenderer from "../__Components__/EnterpriseSlotRenderer.vue";

const { t } = useI18n();

const { themeClasses } = useTheme();

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

const portNumber = ref<number>(props.modelValue.run_port || 80);
const hostnameValue = ref<string>(props.modelValue.dynamic_dns || "get.homedock.cloud");
const homedockLocalValue = ref<boolean>(props.modelValue.local_dns || false);
const initialLocalDNS = props.modelValue.local_dns || false;
const localDNSChanged = computed(() => homedockLocalValue.value !== initialLocalDNS);
const developmentValue = ref<boolean>(props.modelValue.run_on_development || false);
const disableUsageDataValue = ref<boolean>(props.modelValue.disable_usage_data || false);
const delOldDataUpdateValue = ref<boolean>(props.modelValue.delete_old_image_containers_after_update || false);
const delOldDataUninstallValue = ref<boolean>(props.modelValue.delete_old_image_containers_after_uninstall || false);
const deleteOldVolumesUninstall = ref<boolean>(props.modelValue.delete_internal_data_volumes || false);
const reverseProxyValue = ref<boolean>(props.modelValue.reverse_proxy || false);
const initialReverseProxy = props.modelValue.reverse_proxy || false;
const reverseProxyChanged = computed(() => reverseProxyValue.value !== initialReverseProxy);
const localHttpAccessValue = ref<boolean>(props.modelValue.local_http_access || false);
const initialLocalHttpAccess = props.modelValue.local_http_access || false;
const localHttpAccessChanged = computed(() => localHttpAccessValue.value !== initialLocalHttpAccess);
const dynamicDnsSyncValue = ref<boolean>(props.modelValue.dynamic_dns_sync || false);

const isCloudInstance = computed(() => /(^|\.)homedock\.cloud$/i.test(window.location.hostname));

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
  if (portNumber.value === null) return t("Port can't be blank!");
  if (portNumber.value < 80) return t("Ports 80 and below are reserved");
  if (portNumber.value > 65535) return t("Ports higher than 65535 are not available");
  return "";
});

watch(
  () => ({
    run_port: portNumber.value,
    dynamic_dns: hostnameValue.value,
    local_dns: homedockLocalValue.value,
    run_on_development: developmentValue.value,
    disable_usage_data: disableUsageDataValue.value,
    delete_old_image_containers_after_update: delOldDataUpdateValue.value,
    delete_old_image_containers_after_uninstall: delOldDataUninstallValue.value,
    delete_internal_data_volumes: deleteOldVolumesUninstall.value,
    reverse_proxy: reverseProxyValue.value,
    local_http_access: localHttpAccessValue.value,
    dynamic_dns_sync: dynamicDnsSyncValue.value,
  }),
  (newValue) => {
    emit("update:modelValue", newValue);
  },
  { deep: true },
);
</script>

<style scoped>
.restart-badge-enter-active {
  transition: all 0.25s ease-out;
}
.restart-badge-leave-active {
  transition: all 0.2s ease-in;
}
.restart-badge-enter-from,
.restart-badge-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
