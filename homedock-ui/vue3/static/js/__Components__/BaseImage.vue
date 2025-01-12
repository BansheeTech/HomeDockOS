<!-- src/static/js/__Components__/BaseImage.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template>
  <img loading="lazy" :src="computedSrc" v-bind="rest" />
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  src: string;
}>();

const { src, ...rest } = props;

const computedSrc = computed(() => (src.startsWith("/") ? src : `/images/${src}`));
</script>
