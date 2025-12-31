<!-- homedock-ui/vue3/static/js/__Components__/EnterpriseStartMenuSlots.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <EnterpriseSlotRenderer v-for="module in startMenuModules" :key="module.name" :module="module.name" @close-menu="$emit('close-menu')" @open-window="(type: string, opts: Record<string, unknown>) => $emit('open-window', type, opts)" />
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import EnterpriseSRILoader from "../__Utils__/EnterpriseSRILoader";
import EnterpriseSlotRenderer from "./EnterpriseSlotRenderer.vue";

defineEmits<{
  (e: "close-menu"): void;
  (e: "open-window", windowType: string, options: any): void;
}>();

const startMenuModules = ref<{ name: string }[]>([]);

function loadModules(): void {
  if (!EnterpriseSRILoader.isReady()) {
    setTimeout(loadModules, 100);
    return;
  }

  startMenuModules.value = EnterpriseSRILoader.getModulesBySlot("startMenu");
}

onMounted(() => {
  loadModules();
});
</script>
