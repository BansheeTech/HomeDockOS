<!-- homedock-ui/vue3/static/js/__Components__/FileNameLabel.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <span ref="root" :title="name">{{ label }}</span>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from "vue";

import { fitFileName } from "../__Utils__/fitFileName";

const props = withDefaults(defineProps<{ name: string; lines?: number }>(), { lines: 2 });

const root = ref<HTMLElement | null>(null);
const label = ref(props.name);

function fit() {
  label.value = root.value ? fitFileName(root.value, props.name, props.lines) : props.name;
}

onMounted(fit);

watch(() => [props.name, props.lines], fit, { flush: "post" });
</script>
