<!-- homedock-ui/vue3/static/js/__Components__/EnterpriseSlotRenderer.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <component v-if="moduleComponent" :is="moduleComponent" v-bind="$attrs" />
</template>

<script lang="ts" setup>
import { shallowRef, onMounted, watch, type Component } from "vue";
import EnterpriseSRILoader from "../__Utils__/EnterpriseSRILoader";

defineOptions({
  inheritAttrs: false,
});

const props = defineProps<{
  module: string;
}>();

const moduleComponent = shallowRef<Component | null>(null);

function checkModuleAvailability(): void {
  if (!props.module) {
    moduleComponent.value = null;
    return;
  }

  if (!EnterpriseSRILoader.isReady()) {
    setTimeout(checkModuleAvailability, 100);
    return;
  }

  const entry = EnterpriseSRILoader.getModuleByName(props.module);
  moduleComponent.value = entry?.component ?? null;
}

onMounted(() => {
  checkModuleAvailability();
});

watch(
  () => props.module,
  () => {
    moduleComponent.value = null;
    checkModuleAvailability();
  }
);
</script>
