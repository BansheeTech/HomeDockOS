<!-- homedock-ui/vue3/static/js/__Components__/ReactIsland.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="relative h-full w-full">
    <div ref="container" class="h-full w-full"></div>
    <div v-if="status !== 'ready'" class="absolute inset-0">
      <slot v-if="status === 'loading'" name="loading" />
      <slot v-else name="error" :error="failure" />
    </div>
  </div>
</template>

<script lang="ts" setup generic="N extends IslandName">
import { computed, inject, onBeforeUnmount, onMounted, ref, shallowRef, toRaw, watch } from "vue";
import { useI18n } from "vue-i18n";

import { islands, type IslandName, type IslandProps } from "../__Islands__/registry";

import type { IslandHost } from "../__Islands__/host";
import type { MountedIsland } from "../__Islands__/runtime";
import type { ThemeData } from "../__Types__/ThemeData";

const { name, props: islandProps } = defineProps<{ name: N; props: IslandProps<N> }>();

const emit = defineEmits<{ error: [error: unknown] }>();

const themeData = inject<ThemeData | null>("data-theme", null);
const { locale } = useI18n();

const container = ref<HTMLDivElement | null>(null);
const status = ref<"loading" | "ready" | "failed">("loading");
const failure = shallowRef<unknown>(null);

const host = computed<IslandHost>(() => ({
  theme: themeData?.selected_theme ?? "default",
  appearance: themeData?.selected_appearance === "cupertino" ? "cupertino" : "redmond",
  locale: locale.value,
}));

let island: MountedIsland | null = null;
let disposed = false;

function fail(error: unknown) {
  status.value = "failed";
  failure.value = error;
  emit("error", error);
}

function render() {
  if (status.value === "failed") return;
  island?.render(toRaw(islandProps), host.value);
}

onMounted(async () => {
  try {
    const [{ mountIsland }, module] = await Promise.all([import("../__Islands__/runtime"), islands[name]()]);

    if (disposed || !container.value) return;

    island = mountIsland(container.value, module.default, fail);
    render();

    if (status.value === "loading") status.value = "ready";
  } catch (error) {
    if (!disposed) fail(error);
  }
});

watch([() => islandProps, host], render);

onBeforeUnmount(() => {
  disposed = true;
  island?.unmount();
  island = null;
});
</script>
