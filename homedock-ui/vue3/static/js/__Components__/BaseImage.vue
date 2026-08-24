<!-- homedock-ui/vue3/static/js/__Components__/BaseImage.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <img loading="lazy" :src="computedSrc" />
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  src: string;
}>();

const computedSrc = computed(() => (props.src.startsWith("/") ? props.src : `/images/${props.src}`));
</script>
