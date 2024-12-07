<!-- src/static/js/__Components__/SettingsTabTheme.vue -->
<!-- Copyright © 2023-2024 Banshee -->
<!-- https://www.banshee.pro -->

<template>
  <SettingsBoxFold>
    <label class="block text-gray-700 font-medium mb-2">
      <SettingsSeparator :class="[themeClasses.formInputSet]" text="Theme" :mdi_icon="bright4Icon" />
    </label>

    <RadioGroup v-model:value="themeValue" :class="[themeClasses.scopeSelector]">
      <RadioButton value="default" name="themeMode" :class="[themeClasses.radioGroupSelector, themeClasses.scopeSelector]" id="defaultMode">
        <div class="flex items-center"><Icon :icon="bright4Icon" :class="[themeClasses.radioGroupIconSelector]" class="mr-1" /> Default</div>
      </RadioButton>
      <RadioButton value="noir" name="themeMode" :class="[themeClasses.radioGroupSelector]" id="noirMode">
        <div class="flex items-center"><Icon :icon="sunAngleOutlineIcon" :class="[themeClasses.radioGroupIconSelector]" class="mr-1" /> Noir</div>
      </RadioButton>
      <RadioButton value="aeroplus" name="themeMode" :class="[themeClasses.radioGroupSelector]" id="aeroPlusMode">
        <div class="flex items-center"><Icon :icon="squareOpacityIcon" :class="[themeClasses.radioGroupIconSelector]" class="mr-1" /> Aero+</div>
      </RadioButton>
    </RadioGroup>
  </SettingsBoxFold>

  <SettingsBoxFold>
    <legend class="switch-texter font-medium text-gray-700 mb-2">
      <SettingsSeparator :class="[themeClasses.formInputSet]" text="Aero+ Wallpaper" :mdi_icon="imageAreaIcon" />
    </legend>

    <Segmented :class="[themeClasses.scopeSelector, themeClasses.selectedCompScope]" v-model:value="wallValue" :options="wallpaperOptions" :block="false" size="small">
      <template #label="{ value, payload }">
        <div class="py-1 sm:py-2">
          <img :src="payload.src" :alt="payload.alt" class="aero-background-thumbnail rounded-md h-4 sm:h-8 md:h-12 lg:h-16" />
        </div>
      </template>
    </Segmented>
  </SettingsBoxFold>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import { RadioGroup, RadioButton, Segmented } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import bright4Icon from "@iconify-icons/mdi/brightness-4";
import sunAngleOutlineIcon from "@iconify-icons/mdi/sun-angle-outline";
import squareOpacityIcon from "@iconify-icons/mdi/square-opacity";
import imageAreaIcon from "@iconify-icons/mdi/image-area";

import SettingsBoxFold from "../__Components__/SettingsBoxFold.vue";
import SettingsSeparator from "../__Components__/SettingsSeparator.vue";

const { themeClasses } = useTheme();

// Props & Emit
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

// Reactive References
const themeValue = ref<string>(props.modelValue.selectedTheme || "default");
const wallValue = ref<string>(props.modelValue.selectedBack || "back1.jpg");

// Sync modelValue with reactive references
watch(
  () => ({
    selectedTheme: themeValue.value,
    selectedBack: wallValue.value,
  }),
  (newValue) => {
    emit("update:modelValue", newValue);
  },
  { deep: true }
);

const wallpaperOptions = ref([
  {
    value: "back1.jpg",
    payload: {
      src: "/images/wallpapers/thumb_back1.jpg",
      alt: "Wallpaper 1",
    },
  },
  {
    value: "back2.jpg",
    payload: {
      src: "/images/wallpapers/thumb_back2.jpg",
      alt: "Wallpaper 2",
    },
  },
  {
    value: "back3.jpg",
    payload: {
      src: "/images/wallpapers/thumb_back3.jpg",
      alt: "Wallpaper 3",
    },
  },
  {
    value: "back4.jpg",
    payload: {
      src: "/images/wallpapers/thumb_back4.jpg",
      alt: "Wallpaper 4",
    },
  },
  {
    value: "back5.jpg",
    payload: {
      src: "/images/wallpapers/thumb_back5.jpg",
      alt: "Wallpaper 5",
    },
  },
  {
    value: "back6.jpg",
    payload: {
      src: "/images/wallpapers/thumb_back6.jpg",
      alt: "Wallpaper 6",
    },
  },
  // {
  //   value: "backCustom",
  //   payload: {
  //     src: "/images/wallpapers/back_custom_default.jpg",
  //     alt: "Wallpaper Custom",
  //   },
  // },
]);
</script>

<style scoped>
/* RadioGroup Styling */
::v-deep(.dark-mode-theme.ant-radio-button-wrapper:first-child) {
  border-inline-start: 1px solid #555555 !important;
}

::v-deep(.aero-mode-theme.ant-radio-button-wrapper:first-child) {
  border-inline-start: 1px solid #55555583 !important;
}

::v-deep(.ant-radio-button-wrapper::before) {
  display: none !important;
}

::v-deep(.dark-mode-theme .ant-radio-button-wrapper-checked) {
  background-color: rgba(24, 24, 24, 0.5) !important;
  color: white !important;
}

::v-deep(.aero-mode-theme .ant-radio-button-wrapper-checked) {
  background-color: rgba(24, 24, 24, 0) !important;
  color: white !important;
}

/* Segmented Styling */
::v-deep(.ant-segmented-item-selected) {
  border-radius: 10px !important;
}

::v-deep(.ant-segmented) {
  padding-left: 0px !important;
  padding-right: 0px !important;
}

::v-deep(.ant-segmented) {
  padding-left: 0px !important;
  padding-right: 0px !important;
}

::v-deep(.ant-segmented-thumb) {
  background-color: transparent !important;
}

::v-deep(.white-mode-theme .ant-segmented-item-selected) {
  background-color: rgba(125, 125, 125, 0.5) !important;
}

::v-deep(.white-mode-theme .ant-segmented-thumb-motion-appear-active) {
  background-color: rgba(125, 125, 125, 0.5) !important;
  border-radius: 10px !important;
}

::v-deep(.dark-mode-theme .ant-segmented-item-selected) {
  background-color: rgba(125, 125, 125, 0.5) !important;
}

::v-deep(.aero-mode-theme .ant-segmented-item-selected) {
  background-color: rgba(125, 125, 125, 0.5) !important;
}

::v-deep(.dark-mode-theme .ant-segmented-thumb-motion-appear-active) {
  background-color: rgba(125, 125, 125, 0.5) !important;
  border-radius: 10px !important;
}

::v-deep(.aero-mode-theme .ant-segmented-thumb-motion-appear-active) {
  background-color: rgba(125, 125, 125, 0.5) !important;
  border-radius: 10px !important;
}
</style>
