<!-- homedock-ui/vue3/static/js/__Components__/SettingsTabTheme.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
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

  <Transition name="fade-slide">
    <SettingsBoxFold v-if="themeValue === 'aeroplus'">
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
  </Transition>

  <Transition name="fade-slide">
    <SettingsBoxFold v-if="themeValue === 'aeroplus'">
      <legend class="switch-texter font-medium text-gray-700 mb-2">
        <SettingsSeparator :class="[themeClasses.formInputSet]" text="Custom Wallpaper" :mdi_icon="uploadIcon" />
      </legend>

      <UploadDragger :class="[themeClasses.dropZoneDragHolder, themeClasses.scopeSelector]" v-model:file-list="wallpaperFileList" name="wallpaper" accept=".jpg,.jpeg,.png" :multiple="false" :customRequest="handleWallpaperUpload" @change="handleWallpaperChange" :showUploadList="false" :maxCount="1" :beforeUpload="beforeWallpaperUpload" class="compact-dragger h-[140px]">
        <div class="flex items-center align-center justify-center flex-col h-full">
          <p class="ant-upload-drag-icon">
            <Icon v-if="!wallpaperPreview" :icon="imageAreaIcon" :class="['text-4xl', themeClasses.dropZoneDragIcon]" />
            <img v-else :src="wallpaperPreview" class="w-32 h-20 rounded object-cover" />
          </p>
          <p :class="[themeClasses.dropZoneDragUpText, 'px-4 text-balance text-sm']">
            {{ wallpaperFile ? wallpaperFile.name : "Click or drag wallpaper here" }}
          </p>
          <p :class="[themeClasses.dropZoneDragDownText, 'px-4 text-balance text-xs']">.jpg or .png (min 800x600px)</p>
        </div>
      </UploadDragger>

      <p v-if="uploadStatus" :class="['text-sm mt-2', uploadStatus.type === 'success' ? 'text-green-600' : 'text-red-600']">
        {{ uploadStatus.message }}
      </p>
    </SettingsBoxFold>
  </Transition>
</template>

<script lang="ts" setup>
import { ref, watch, inject, onMounted, nextTick } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";

import { RadioGroup, RadioButton, Segmented, Upload, message } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import bright4Icon from "@iconify-icons/mdi/brightness-4";
import sunAngleOutlineIcon from "@iconify-icons/mdi/sun-angle-outline";
import squareOpacityIcon from "@iconify-icons/mdi/square-opacity";
import imageAreaIcon from "@iconify-icons/mdi/image-area";
import uploadIcon from "@iconify-icons/mdi/upload";

import SettingsBoxFold from "../__Components__/SettingsBoxFold.vue";
import SettingsSeparator from "../__Components__/SettingsSeparator.vue";

const UploadDragger = Upload.Dragger;
const { themeClasses } = useTheme();
const csrfToken = useCsrfToken();

const updateTheme = inject<(newTheme: { selectedTheme?: string; selectedBack?: string }) => void>("update-theme");

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue", "wallpaper-pending"]);

const themeValue = ref<string>(props.modelValue.selectedTheme || "default");
const wallValue = ref<string>(props.modelValue.selectedBack || "back1.jpg");

watch(
  () => ({
    selectedTheme: themeValue.value,
    selectedBack: wallValue.value,
  }),
  (newValue) => {
    if (updateTheme) {
      updateTheme({
        selectedTheme: newValue.selectedTheme,
        selectedBack: newValue.selectedBack,
      });
    }

    emit("update:modelValue", newValue);
  },
  { deep: true }
);

watch(themeValue, (newTheme, oldTheme) => {
  if (oldTheme === "aeroplus" && newTheme !== "aeroplus") {
    if (wallpaperFile.value) {
      wallpaperFile.value = null;
      wallpaperFileList.value = [];
      wallpaperPreview.value = "";
      uploadStatus.value = null;
    }
  }
});

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
]);

const MAX_WALLPAPER_SIZE = 10 * 1024 * 1024; // 10MB
const wallpaperFile = ref<File | null>(null);
const wallpaperFileList = ref([]);
const wallpaperPreview = ref("");
const uploadStatus = ref<{ type: "success" | "error"; message: string } | null>(null);

const beforeWallpaperUpload = (file: File) => {
  const validTypes = ["image/jpeg", "image/png", "image/jpg"];
  const isValidType = validTypes.includes(file.type);

  if (!isValidType) {
    message.error("Please upload a .jpg, .jpeg, or .png file");
    return false;
  }

  const isValidSize = file.size <= MAX_WALLPAPER_SIZE;
  if (!isValidSize) {
    message.error(`File too large. Maximum size is ${MAX_WALLPAPER_SIZE / 1024 / 1024}MB`);
    return false;
  }

  return true;
};

const handleWallpaperUpload = async ({ file }: any) => {
  return false;
};

const handleWallpaperChange = (info: any) => {
  const { fileList } = info;
  if (fileList.length > 0) {
    const file = fileList[0].originFileObj;
    wallpaperFile.value = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      wallpaperPreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    emit("wallpaper-pending", file);
    uploadStatus.value = {
      type: "success",
      message: "Wallpaper ready to upload. Click 'Save Settings' to apply.",
    };
  }
};

const uploadWallpaper = async (file: File) => {
  try {
    uploadStatus.value = null;

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload_wallpaper", {
      method: "POST",
      headers: {
        "X-CSRF-Token": csrfToken.value,
      },
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      uploadStatus.value = {
        type: "success",
        message: `Wallpaper uploaded successfully! (${data.file_type.toUpperCase()})`,
      };
      message.success("Custom wallpaper uploaded successfully!");

      const filename = data.wallpaper_url.split("/").pop();

      addCustomWallpaperOption(filename);

      if (wallValue.value && wallValue.value.startsWith("_back_custom")) {
        wallValue.value = "back1.jpg";
        await nextTick();
      }
      wallValue.value = filename;

      wallpaperFile.value = null;
      wallpaperFileList.value = [];

      uploadStatus.value = {
        type: "success",
        message: `Wallpaper uploaded successfully! (${data.file_type.toUpperCase()})`,
      };
    } else {
      uploadStatus.value = {
        type: "error",
        message: data.message || "Failed to upload wallpaper",
      };
      message.error(data.message || "Failed to upload wallpaper");
      throw new Error(data.message || "Failed to upload wallpaper");
    }
  } catch (error: any) {
    uploadStatus.value = {
      type: "error",
      message: error.message || "Error uploading wallpaper",
    };
    message.error(error.message || "Error uploading wallpaper");
    throw error;
  }
};

const addCustomWallpaperOption = (filename: string) => {
  wallpaperOptions.value = wallpaperOptions.value.filter((opt) => !opt.value.startsWith("_back_custom"));

  wallpaperOptions.value.push({
    value: filename,
    payload: {
      src: `/images/user-wallpaper/${filename}?t=${Date.now()}`,
      alt: "Custom Wallpaper",
    },
  });
};

onMounted(() => {
  if (wallValue.value && wallValue.value.startsWith("_back_custom")) {
    addCustomWallpaperOption(wallValue.value);
  }
});

defineExpose({
  uploadPendingWallpaper: async () => {
    if (wallpaperFile.value) {
      await uploadWallpaper(wallpaperFile.value);
      return true;
    }
    return false;
  },
  hasPendingWallpaper: () => wallpaperFile.value !== null,
  clearPendingWallpaper: () => {
    wallpaperFile.value = null;
    wallpaperFileList.value = [];
    wallpaperPreview.value = "";
    uploadStatus.value = null;
  },
});
</script>

<style scoped>
/* Animation Styles */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.5s, transform 0.5s, max-height 0.5s ease-in-out;
  overflow: hidden;
  min-height: 0;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
  max-height: 0;
}

.fade-slide-enter-to,
.fade-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 1000px;
}

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
