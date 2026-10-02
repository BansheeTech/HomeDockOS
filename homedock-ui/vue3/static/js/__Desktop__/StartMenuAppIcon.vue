<!-- homedock-ui/vue3/static/js/__Desktop__/StartMenuAppIcon.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <AppIconGraphic :icon="app.icon" :color="app.color" :image-src="app.kind === 'docker' ? app.imagePath : undefined" :size="size" :status="app.dockerApp?.status">
    <EnterpriseIndicator v-if="app.kind === 'enterprise'" size="mini" class="absolute -right-1 -top-1" />
  </AppIconGraphic>
</template>

<script lang="ts" setup>
import type { StartMenuApp } from "../__Composables__/useStartMenuApps";

import AppIconGraphic from "../__Components__/AppIconGraphic.vue";
import EnterpriseIndicator from "../__Components__/EnterpriseIndicator.vue";

withDefaults(defineProps<{ app: StartMenuApp; size?: number }>(), { size: 48 });
</script>
