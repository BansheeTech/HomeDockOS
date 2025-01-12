<!-- src/static/js/__Components__/Card.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template>
  <li :class="[themeClasses.cardBack]" class="list-none flex p-5 rounded-2xl mb-4 max-w-full w-full">
    <div class="w-full">
      <h2 class="flex m-0 font-normal justify-between items-center">
        <span class="flex items-center text-base font-normal leading-3">
          <Icon :class="[themeClasses.navBarIcon]" :icon="mdi_icon" class="mr-1 h-5 w-5" />
          <span :class="[themeClasses.mainText]" class="font-semibold text-[16px]">{{ title }}</span>
        </span>

        <slot name="actions"></slot>

        <button :class="[themeClasses.collapseComp]" v-if="collapsible" @click="toggleCollapse" class="transition-all duration-300 ease-in-out rounded-full hover:scale-[1.50] hover:px-2 hover:mx-2">
          <Icon :icon="isCollapsed ? iconExpand : iconCollapse" class="h-4 w-4" v-bind:class="{ 'rotate-icon': !isCollapsed, 'rotate-icon-back': isCollapsed }" />
        </button>
      </h2>
      <Transition name="collapse" @before-enter="beforeEnter" @enter="enter" @after-enter="afterEnter" @before-leave="beforeLeave" @leave="leave" @after-leave="afterLeave">
        <div v-show="!isCollapsed" ref="content" class="collapsible-content">
          <span class="mb-2">
            <div :class="[themeClasses.subText]" class="text-[13px] mt-1 font-normal text-slate-400">{{ body }}</div>
          </span>
          <div class="mt-2">
            <slot></slot>
          </div>
        </div>
      </Transition>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { computed, ref, nextTick, onMounted, PropType } from "vue";
import { useTheme } from "../__Themes__/ThemeSelector";

import { useUserInterfaceStore } from "../__Stores__/useUserInterface";

import { Icon, IconifyIcon } from "@iconify/vue";
import iconExpand from "@iconify-icons/mdi/arrow-expand";
import iconCollapse from "@iconify-icons/mdi/arrow-collapse";

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  title: String,
  body: String,
  mdi_icon: {
    type: [String, Object] as PropType<string | IconifyIcon>,
    required: true,
  },
  collapsible: {
    type: Boolean,
    default: false,
  },
});

const { themeClasses } = useTheme();

const userInterfaceStore = useUserInterfaceStore();

const isCollapsed = computed(() => userInterfaceStore.isCardCollapsed(props.id));

const content = ref<HTMLElement | null>(null);

const beforeEnter = (el: Element) => {
  (el as HTMLElement).style.maxHeight = "0";
};

const enter = (el: Element) => {
  (el as HTMLElement).style.maxHeight = (el as HTMLElement).scrollHeight + "px";
};

const afterEnter = (el: Element) => {
  (el as HTMLElement).style.maxHeight = "none";
};

const beforeLeave = (el: Element) => {
  (el as HTMLElement).style.maxHeight = (el as HTMLElement).scrollHeight + "px";
};

const leave = (el: Element) => {
  nextTick(() => {
    (el as HTMLElement).style.maxHeight = "0";
  });
};

const afterLeave = (el: Element) => {
  (el as HTMLElement).style.maxHeight = "0";
};

const toggleCollapse = () => {
  userInterfaceStore.toggleCard(props.id);
};

onMounted(() => {
  if (content.value && !isCollapsed.value) {
    content.value.style.maxHeight = "none";
  }
});
</script>

<style scoped>
.collapsible-content {
  transition: max-height 0.3s ease-in-out;
  overflow: hidden;
}

.collapse-enter-active,
.collapse-leave-active {
  transition: max-height 0.3s ease-in-out;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
}

.rotate-icon {
  transition: transform 0.3s ease-in-out;
  transform: rotate(180deg);
}

.rotate-icon-back {
  transition: transform 0.3s ease-in-out;
  transform: rotate(0deg);
}
</style>
