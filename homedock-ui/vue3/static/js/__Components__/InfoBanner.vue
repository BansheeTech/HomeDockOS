<!-- homedock-ui/vue3/static/js/__Components__/InfoBanner.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div :class="['relative flex items-center gap-3 px-4 py-2 w-full overflow-hidden transition-all duration-300 ease-out border-b border-black/5', themeClasses.infoBannerContainer, visible ? 'opacity-100 translate-y-0 max-h-24' : 'opacity-0 -translate-y-full max-h-0 py-0 border-b-0']">
    <div :class="['relative flex items-center justify-center min-w-6 min-h-6 w-6 h-6 rounded-md', themeClasses.infoBannerIconWrapper]">
      <div :class="['absolute inset-0 rounded-lg animate-pulse-ring', themeClasses.infoBannerIconPulse]"></div>
      <div class="relative flex items-center justify-center z-10">
        <slot name="icon">
          <Icon v-if="icon || iconName" :icon="icon || iconName" :class="['w-[1.125rem] h-[1.125rem]', themeClasses.infoBannerIcon]" />
        </slot>
      </div>
    </div>

    <div class="flex-1 min-w-0 flex flex-col gap-0.5">
      <div :class="['text-[0.8125rem] font-medium leading-[1.125rem] whitespace-nowrap overflow-hidden text-ellipsis', themeClasses.infoBannerTitle]">
        <slot name="title">{{ title }}</slot>
      </div>
      <div v-if="message || $slots.message" :class="['text-[0.6875rem] leading-[0.875rem] overflow-hidden text-ellipsis line-clamp-1 opacity-80', themeClasses.infoBannerMessage]">
        <slot name="message">{{ message }}</slot>
      </div>
    </div>

    <div v-if="actionText || $slots.action" class="flex items-center flex-shrink-0">
      <slot name="action">
        <button v-if="actionText" :class="['px-2.5 py-1 text-[0.6875rem] font-medium rounded transition-all duration-150 border-0 cursor-pointer whitespace-nowrap hover:-translate-y-px hover:opacity-90 active:translate-y-0', themeClasses.infoBannerButton]" @click="$emit('action-click')">
          {{ actionText }}
        </button>
      </slot>
    </div>

    <button v-if="closable" :class="['flex items-center justify-center w-5 h-5 rounded transition-all duration-150 flex-shrink-0 border-0 bg-transparent cursor-pointer ml-1 opacity-60 hover:opacity-100 hover:scale-110', themeClasses.infoBannerClose]" @click="handleClose" aria-label="Close banner">
      <Icon :icon="closeIcon" class="w-3.5 h-3.5" />
    </button>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useTheme } from "../__Themes__/ThemeSelector";

import { Icon } from "@iconify/vue";
import closeCircleIcon from "@iconify-icons/mdi/close";

const { themeClasses } = useTheme();

interface Props {
  title?: string;
  message?: string;
  iconName?: string;
  icon?: any;
  actionText?: string;
  closable?: boolean;
  autoShow?: boolean;
  animationDelay?: number;
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  message: "",
  iconName: "",
  icon: null,
  actionText: "",
  closable: false,
  autoShow: true,
  animationDelay: 100,
});

const emit = defineEmits<{
  "action-click": [];
  close: [];
}>();

const visible = ref(false);
const closeIcon = closeCircleIcon;

onMounted(() => {
  if (props.autoShow) {
    setTimeout(() => {
      visible.value = true;
    }, props.animationDelay);
  }
});

const handleClose = () => {
  visible.value = false;
  setTimeout(() => {
    emit("close");
  }, 300);
};

const show = () => {
  visible.value = true;
};

const hide = () => {
  visible.value = false;
};

defineExpose({
  show,
  hide,
  visible,
});
</script>

<style scoped>
@keyframes pulse-ring {
  0%,
  100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 0;
    transform: scale(1.2);
  }
}

.animate-pulse-ring {
  animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@media (max-width: 640px) {
  .line-clamp-1 {
    font-size: 0.625rem;
  }
}

@media (max-width: 380px) {
  .line-clamp-1 {
    display: none;
  }
}
</style>
