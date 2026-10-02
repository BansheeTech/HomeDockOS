<!-- homedock-ui/vue3/static/js/__Components__/FileThumbnail.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div ref="root" class="flex items-center justify-center">
    <img v-if="src" :src="src" alt="" draggable="false" class="file-thumbnail max-w-full max-h-full object-contain rounded-md shadow-sm ring-1 ring-black/10" />
    <slot v-else />
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";

import { useThumbnails, type ThumbnailRequest } from "../__Composables__/useThumbnails";

const props = defineProps<{ request: ThumbnailRequest | null }>();

const { thumbnailUrl, loadThumbnail, whenVisible } = useThumbnails();

const root = ref<HTMLElement | null>(null);

const src = computed(() => (props.request ? thumbnailUrl(props.request.key) : null));

let stopWatching: (() => void) | null = null;

function observe() {
  stopWatching?.();
  stopWatching = null;

  const request = props.request;
  if (!request || !root.value || thumbnailUrl(request.key) !== undefined) return;

  stopWatching = whenVisible(root.value, () => loadThumbnail(request));
}

watch([() => props.request?.key, root, src], observe, { flush: "post" });

onBeforeUnmount(() => stopWatching?.());
</script>

<style scoped>
.file-thumbnail {
  animation: file-thumbnail-in 0.2s ease-out;
}

@keyframes file-thumbnail-in {
  from {
    opacity: 0;
  }
}
</style>
