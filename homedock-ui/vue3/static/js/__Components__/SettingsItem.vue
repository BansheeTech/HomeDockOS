<!-- homedock-ui/vue3/static/js/__Components__/SettingsItem.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div :class="[themeClasses.settingsItemBg, themeClasses.settingsItemBgHover, !isLast && themeClasses.settingsItemSeparator, 'px-4 py-3 transition-all duration-200']">
    <div v-if="!shouldStack" class="flex items-start gap-3">
      <div v-if="icon" :class="[iconBgClass, themeClasses.settingsIconColor, 'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0']">
        <Icon :icon="icon" :size="iconSize" />
      </div>

      <div class="flex-1 min-w-0">
        <div :class="[themeClasses.settingsItemTitle, 'text-sm font-medium leading-4']">
          {{ title }}
        </div>
        <div v-if="description" :class="[themeClasses.settingsItemDescription, 'text-xs leading-2']">
          {{ description }}
        </div>
      </div>

      <div class="flex-shrink-0 flex items-center">
        <slot></slot>
      </div>
    </div>

    <div v-else class="flex flex-col gap-1">
      <div class="flex items-start gap-3">
        <div v-if="icon" :class="[iconBgClass, themeClasses.settingsIconColor, 'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0']">
          <Icon :icon="icon" :size="iconSize" />
        </div>

        <div class="flex-1 min-w-0">
          <div :class="[themeClasses.settingsItemTitle, 'text-sm font-medium leading-3']">
            {{ title }}
          </div>
          <div v-if="description" :class="[themeClasses.settingsItemDescription, 'text-xs mt-0.5 leading-relaxed']">
            {{ description }}
          </div>
        </div>
      </div>

      <div :class="[icon ? 'pl-11' : '', 'settings-control-wrapper-stacked']">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted, onUnmounted, useSlots, type PropType } from "vue";
import { useTheme } from "../__Themes__/ThemeSelector";
import { Icon, type IconifyIcon } from "@iconify/vue";

const { themeClasses } = useTheme();
const slots = useSlots();

const props = defineProps({
  icon: {
    type: [String, Object] as PropType<string | IconifyIcon>,
    default: null,
  },
  iconColor: {
    type: String as PropType<"blue" | "green" | "red" | "orange" | "purple" | "gray" | "cyan" | "pink" | "yellow">,
    default: "blue",
  },
  iconSize: {
    type: String,
    default: "18px",
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  isLast: {
    type: Boolean,
    default: false,
  },
  controlType: {
    type: String as PropType<"auto" | "inline" | "stack" | "always-stack">,
    default: "auto",
  },
});

const iconBgClass = computed(() => {
  const colorMap: Record<string, string> = {
    blue: themeClasses.value.settingsIconBgBlue,
    green: themeClasses.value.settingsIconBgGreen,
    red: themeClasses.value.settingsIconBgRed,
    orange: themeClasses.value.settingsIconBgOrange,
    purple: themeClasses.value.settingsIconBgPurple,
    gray: themeClasses.value.settingsIconBgGray,
    cyan: themeClasses.value.settingsIconBgCyan,
    pink: themeClasses.value.settingsIconBgPink,
    yellow: themeClasses.value.settingsIconBgYellow,
  };
  return colorMap[props.iconColor] || colorMap.blue;
});

const containerWidth = ref(0);
const containerElement = ref<HTMLElement | null>(null);
let resizeObserver: ResizeObserver | null = null;

const updateContainerWidth = () => {
  if (containerElement.value) {
    containerWidth.value = containerElement.value.offsetWidth;
  }
};

const handleResizeObserver = (entries: ResizeObserverEntry[]) => {
  if (entries[0]) {
    containerWidth.value = entries[0].contentRect.width;
  }
};

onMounted(() => {
  containerElement.value = document.querySelector(".app-settings") as HTMLElement;

  if (!containerElement.value) {
    containerElement.value = document.body;
  }

  updateContainerWidth();

  if (containerElement.value) {
    resizeObserver = new ResizeObserver(handleResizeObserver);
    resizeObserver.observe(containerElement.value);
  }

  window.addEventListener("resize", updateContainerWidth);
});

onUnmounted(() => {
  if (resizeObserver && containerElement.value) {
    resizeObserver.unobserve(containerElement.value);
    resizeObserver.disconnect();
  }
  window.removeEventListener("resize", updateContainerWidth);
});

const hasSmallControl = computed(() => {
  if (!slots.default) return false;

  const slotContent = slots.default();
  if (!slotContent || slotContent.length === 0) return false;

  const firstNode = slotContent[0];

  if (firstNode.type && typeof firstNode.type === "object") {
    const typeName = (firstNode.type as any).name;
    if (typeName === "AFormItem" || typeName === "FormItem") {
      return false;
    }
  }

  const componentName = (firstNode.type && typeof firstNode.type === "object" && (firstNode.type as any).name) || (firstNode.type && typeof firstNode.type === "function" && firstNode.type.name) || "";

  const smallControls = ["ASwitch", "Switch", "ACheckbox", "Checkbox", "ARadio", "Radio", "RadioButton"];

  return smallControls.some((name) => componentName.includes(name));
});

const shouldStack = computed(() => {
  if (props.controlType === "inline") return false;

  if (props.controlType === "always-stack") return true;

  if (props.controlType === "stack") {
    return containerWidth.value < 500;
  }

  if (hasSmallControl.value) return false;

  return containerWidth.value < 500;
});
</script>

<style scoped>
/* Force full width controls @ stacked */
.settings-control-wrapper-stacked :deep(.ant-input),
.settings-control-wrapper-stacked :deep(.ant-input-number),
.settings-control-wrapper-stacked :deep(.ant-input-password),
.settings-control-wrapper-stacked :deep(.ant-select),
.settings-control-wrapper-stacked :deep(.ant-form-item) {
  width: 100% !important;
}

.settings-control-wrapper-stacked :deep(.ant-input-number) {
  display: block !important;
}

.settings-control-wrapper-stacked :deep(.ant-select-selector) {
  width: 100% !important;
}

/* RadioGroup full width @ stacked */
.settings-control-wrapper-stacked :deep(.ant-radio-group) {
  width: 100% !important;
  display: flex !important;
}

.settings-control-wrapper-stacked :deep(.ant-radio-button-wrapper) {
  flex: 1 !important;
  text-align: center !important;
}

/* Wallpaper grid take full width even in non-stack */
:deep(.wallpaper-grid-wrapper) {
  width: 100% !important;
  min-width: 0 !important;
}
</style>
