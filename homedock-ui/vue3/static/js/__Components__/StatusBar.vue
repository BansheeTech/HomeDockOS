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

    <Transition enter-active-class="transition-all duration-300 ease-out" leave-active-class="transition-all duration-200 ease-in" enter-from-class="opacity-0 translate-x-2" leave-to-class="opacity-0 translate-x-2">
      <div v-if="hasInfo || loading || error" class="items-center gap-2 min-w-0 max-w-[50%]" :class="loading || error ? 'flex' : 'hidden sm:flex'">
        <div :class="['h-3.5 w-px flex-shrink-0', themeClasses.statusBarDivider]"></div>

        <Transition enter-active-class="transition-all duration-200 ease-out" leave-active-class="transition-all duration-150 ease-in" enter-from-class="opacity-0 translate-x-1" leave-to-class="opacity-0" mode="out-in">
          <AnimatedIcon v-if="error" key="error" :icons="[networkStrength1Alert, networkStrength2Alert, networkStrength3Alert, networkStrength4Alert]" :interval="1000" :iconSize="14" :containerClass="`flex-shrink-0 ${themeClasses.statusBarInfo}`" />

          <svg v-else-if="!hasInfo" key="loading" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" :class="['w-3 h-3 flex-shrink-0', themeClasses.statusBarInfo]">
            <g stroke="currentColor">
              <circle cx="12" cy="12" r="9.5" fill="none" stroke-linecap="round" stroke-width="3">
                <animate attributeName="stroke-dasharray" calcMode="spline" dur="1.5s" keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1" keyTimes="0;0.475;0.95;1" repeatCount="indefinite" values="0 150;42 150;42 150;42 150" />
                <animate attributeName="stroke-dashoffset" calcMode="spline" dur="1.5s" keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1" keyTimes="0;0.475;0.95;1" repeatCount="indefinite" values="0;-16;-59;-59" />
              </circle>
              <animateTransform attributeName="transform" dur="2s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12" />
            </g>
          </svg>

          <span v-else key="info" :class="['hidden sm:inline text-[10px] leading-none truncate', themeClasses.statusBarInfo]">
            <slot name="info">{{ info }}</slot>
          </span>
        </Transition>
      </div>
    </Transition>

    <div v-if="$slots.extra" :class="['h-3.5 w-px flex-shrink-0', themeClasses.statusBarDivider]"></div>

    <div v-if="$slots.extra" class="flex items-center flex-shrink-0">
      <slot name="extra"></slot>
    </div>

    <template v-if="showHelp || $slots.help">
      <div :class="['h-3 w-px flex-shrink-0', themeClasses.statusBarDivider]"></div>

      <Popover :overlayClassName="themeClasses.scopeSelector" :overlayInnerStyle="{ overflow: 'hidden', borderRadius: '8px' }" :overlayStyle="{ overflow: 'hidden', borderRadius: '8px' }" :align="{ offset: [13, -26] }" :arrow="false" placement="bottomRight" trigger="click" v-model:open="helpOpen">
        <template #content>
          <div class="max-w-[240px] px-2 py-1.5 select-none overflow-hidden">
            <slot name="help">
              <p :class="['text-xs', themeClasses.statusBarText]">{{ $t("Placeholder, help information goes here D:") }}</p>
            </slot>
          </div>
        </template>
        <button :class="['flex items-center justify-center w-5 h-5 rounded-full transition-colors cursor-pointer border-0 bg-transparent', themeClasses.statusBarHelpButton]" :title="$t('Help')">
          <Icon :icon="helpCircleIcon" class="w-3.5 h-3.5 opacity-60 hover:opacity-100 transition-opacity" />
        </button>
      </Popover>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, useSlots, onMounted, onUnmounted } from "vue";
import { Popover } from "ant-design-vue";
import { useTheme } from "../__Themes__/ThemeSelector";

import { Icon } from "@iconify/vue";
import helpCircleIcon from "@iconify-icons/mdi/help-circle";
import networkStrength1Alert from "@iconify-icons/mdi/network-strength-1-alert";
import networkStrength2Alert from "@iconify-icons/mdi/network-strength-2-alert";
import networkStrength3Alert from "@iconify-icons/mdi/network-strength-3-alert";
import networkStrength4Alert from "@iconify-icons/mdi/network-strength-4-alert";

import AnimatedIcon from "./AnimatedIcon.vue";

const { themeClasses } = useTheme();

const helpOpen = ref(false);

const onWindowBlur = () => {
  setTimeout(() => {
    if (document.activeElement?.tagName === "IFRAME") helpOpen.value = false;
  });
};

onMounted(() => window.addEventListener("blur", onWindowBlur));
onUnmounted(() => window.removeEventListener("blur", onWindowBlur));

interface Props {
  message?: string;
  info?: string;
  iconName?: string;
  icon?: any;
  showHelp?: boolean;
  loading?: boolean;
  error?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  message: "",
  info: "",
  iconName: "",
  icon: null,
  showHelp: false,
  loading: false,
  error: false,
});

const slots = useSlots();

const hasInfo = computed(() => Boolean(slots.info || props.info));
</script>
