<!-- homedock-ui/vue3/static/js/__Components__/StatusBar.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div :class="['flex items-center gap-2 h-7 pb-0.5 px-3 border-t', themeClasses.statusBarContainer, themeClasses.statusBarBorder]">
    <div class="flex items-center gap-2 flex-1 min-w-0">
      <slot name="icon">
        <Icon v-if="icon || iconName" :icon="icon || iconName" :class="['w-3.5 h-3.5 flex-shrink-0', themeClasses.statusBarIcon]" />
      </slot>
      <span :class="['text-[10px] leading-none truncate', themeClasses.statusBarText]">
        <slot name="message">{{ message }}</slot>
      </span>
    </div>

    <div v-if="$slots.info || info" :class="['h-3.5 w-px flex-shrink-0', themeClasses.statusBarDivider]"></div>

    <div v-if="$slots.info || info" class="flex items-center flex-shrink-0">
      <span :class="['text-[10px] leading-none whitespace-nowrap', themeClasses.statusBarInfo]">
        <slot name="info">{{ info }}</slot>
      </span>
    </div>

    <div v-if="$slots.extra" :class="['h-3.5 w-px flex-shrink-0', themeClasses.statusBarDivider]"></div>

    <div v-if="$slots.extra" class="flex items-center flex-shrink-0">
      <slot name="extra"></slot>
    </div>

    <template v-if="showHelp || $slots.help">
      <div :class="['h-3 w-px flex-shrink-0', themeClasses.statusBarDivider]"></div>

      <Popover :overlayClassName="themeClasses.scopeSelector" :overlayInnerStyle="{ overflow: 'hidden', borderRadius: '8px' }" :overlayStyle="{ overflow: 'hidden', borderRadius: '8px' }" :align="{ offset: [13, -26] }" :arrow="false" placement="bottomRight" trigger="click">
        <template #content>
          <div class="max-w-[240px] px-2 py-1.5 select-none overflow-hidden">
            <slot name="help">
              <p :class="['text-xs', themeClasses.statusBarText]">Placeholder, help information goes here D:</p>
            </slot>
          </div>
        </template>
        <button :class="['flex items-center justify-center w-5 h-5 rounded-full transition-colors cursor-pointer border-0 bg-transparent', themeClasses.statusBarHelpButton]" title="Help">
          <Icon :icon="helpCircleIcon" class="w-3.5 h-3.5 opacity-60 hover:opacity-100 transition-opacity" />
        </button>
      </Popover>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { Popover } from "ant-design-vue";
import { useTheme } from "../__Themes__/ThemeSelector";

import { Icon } from "@iconify/vue";
import helpCircleIcon from "@iconify-icons/mdi/help-circle";

const { themeClasses } = useTheme();

interface Props {
  message?: string;
  info?: string;
  iconName?: string;
  icon?: any;
  showHelp?: boolean;
}

withDefaults(defineProps<Props>(), {
  message: "",
  info: "",
  iconName: "",
  icon: null,
  showHelp: false,
});
</script>
