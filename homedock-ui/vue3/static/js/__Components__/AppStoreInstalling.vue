<!-- homedock-ui/vue3/static/js/__Components__/AppStoreInstalling.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="flex flex-col gap-5">
    <section v-if="current">
      <h2 :class="[themeClasses.storeCardSubtitle]" class="m-0 mb-1 text-[11px] font-semibold uppercase tracking-wider">{{ $t("Currently Installing") }}</h2>
      <div class="installing-grid">
        <AppStoreAppCard :app="current" />
      </div>
    </section>

    <section v-if="queued.length">
      <h2 :class="[themeClasses.storeCardSubtitle]" class="m-0 mb-1 text-[11px] font-semibold uppercase tracking-wider">{{ $t("In Queue ({n})", { n: queued.length }) }}</h2>
      <TransitionGroup name="queue-row" tag="div" class="installing-grid">
        <AppStoreAppCard v-for="app in queued" :key="app.name" :app="app" />
      </TransitionGroup>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useInstallationStore } from "../__Stores__/useInstallationStore";
import { useAppStoreActions } from "../__Composables__/useAppStoreActions";

import type { App } from "../__Types__/AppStoreApp";

import AppStoreAppCard from "../__Components__/AppStoreAppCard.vue";

const { themeClasses } = useTheme();
const installationStore = useInstallationStore();
const { findStoreApp } = useAppStoreActions();

const current = computed(() => (installationStore.currentlyInstalling ? findStoreApp(installationStore.currentlyInstalling) : undefined));

const queued = computed(() => installationStore.queue.map((name) => findStoreApp(name)).filter((app): app is App => Boolean(app)));
</script>

<style scoped>
.installing-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  column-gap: 24px;
}

@container appstore-content (min-width: 560px) {
  .installing-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@container appstore-content (min-width: 900px) {
  .installing-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.queue-row-move,
.queue-row-enter-active,
.queue-row-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.queue-row-enter-from,
.queue-row-leave-to {
  opacity: 0;
}
</style>
