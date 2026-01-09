<!-- homedock-ui/vue3/static/js/__Components__/DragGhost.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Teleport to="body">
    <div v-if="visible && items.length > 0" class="fixed pointer-events-none" :style="style">
      <div class="relative">
        <div class="flex flex-col items-center gap-1 p-3 rounded-lg w-[100px] opacity-90" :class="[themeClasses.desktopIconBgSelected, themeClasses.desktopIconBorderSelected]">
          <div class="relative w-16 h-16 flex items-center justify-center rounded-2xl overflow-hidden border" :class="[themeClasses.desktopIconContainerBg, themeClasses.desktopIconContainerBorderSelected]">
            <BaseImage :src="items[0].image_path" class="w-12 h-12 object-contain pointer-events-none rounded-xl" alt="" draggable="false" />
          </div>
          <span :class="[themeClasses.desktopIconText]" class="text-xs text-center max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-medium">
            {{ items[0].display_name || items[0].name }}
          </span>
        </div>

        <div v-if="items.length > 1" class="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg">
          {{ items.length }}
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import type { CSSProperties } from "vue";
import type { DockerApp } from "../__Stores__/desktopStore";
import { useTheme } from "../__Themes__/ThemeSelector";
import BaseImage from "./BaseImage.vue";

defineProps<{
  visible: boolean;
  items: DockerApp[];
  style: CSSProperties;
}>();

const { themeClasses } = useTheme();
</script>
