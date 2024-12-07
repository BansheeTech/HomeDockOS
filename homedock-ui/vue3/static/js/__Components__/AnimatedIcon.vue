<!-- src/static/js/__Components__/AnimatedIcon.vue -->
<!-- Copyright © 2023-2025 Banshee -->
<!-- https://www.banshee.pro -->

<template>
  <div :class="['relative', containerClass]" :style="{ width: `${iconSize}px`, height: `${iconSize}px` }">
    <Transition name="fade">
      <Icon :key="iconKey" :icon="currentIcon" class="absolute inset-0 transition-opacity" :width="iconSize" :height="iconSize" />
    </Transition>
  </div>
</template>

<script lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, PropType } from "vue";

import { Icon } from "@iconify/vue";

import type { IconifyIcon } from "@iconify/vue";

export default {
  name: "AnimatedIcon",
  components: {
    Icon,
  },
  props: {
    icons: {
      type: Array as PropType<IconifyIcon[]>,
      required: true,
    },
    interval: {
      type: Number,
      default: 250,
    },
    iconSize: {
      type: Number,
      default: 20,
    },
    containerClass: {
      type: String,
      default: "",
    },
  },
  setup(props) {
    const currentIndex = ref(0);
    const currentIcon = ref(props.icons[0]); // Usa el primer icono como inicial
    const iconKey = computed(() => `icon-${currentIndex.value}`);
    let intervalId: number | NodeJS.Timeout;

    onMounted(() => {
      intervalId = setInterval(() => {
        currentIndex.value = (currentIndex.value + 1) % props.icons.length;
        currentIcon.value = props.icons[currentIndex.value];
      }, props.interval);
    });

    onBeforeUnmount(() => {
      clearInterval(intervalId);
    });

    return {
      currentIcon,
      iconKey,
    };
  },
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
