<!-- homedock-ui/vue3/static/js/__Components__/SettingsHelpTooltip.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Popover :overlayClassName="themeClasses.scopeSelector" :overlayInnerStyle="{ overflow: 'hidden', borderRadius: '20px', padding: '10px 14px', maxWidth: '240px' }" :arrow="false" placement="bottomRight" trigger="click" :mouseEnterDelay="0" :mouseLeaveDelay="0" v-model:open="open">
    <template #content>
      <p :class="[themeClasses.settingsItemDescription]" class="text-[10px] leading-relaxed m-0 max-w-[276px]">{{ text }}</p>
    </template>

    <button type="button" :aria-label="$t('Learn more')" :class="[themeClasses.settingsItemDescription, open ? 'opacity-100' : 'opacity-45']" class="flex items-center justify-center w-4 h-4 shrink-0 bg-transparent border-0 p-0 cursor-pointer transition-opacity duration-200 hover:opacity-100">
      <Icon :icon="infoIcon" width="13" height="13" />
    </button>
  </Popover>
</template>

<script lang="ts" setup>
import { ref } from "vue";

import { Popover } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import infoIcon from "@iconify-icons/mdi/information-outline";

import { useTheme } from "../__Themes__/ThemeSelector";

const { themeClasses } = useTheme();

defineProps({
  text: {
    type: String,
    required: true,
  },
});

const open = ref(false);
</script>
