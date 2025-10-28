<!-- homedock-ui/vue3/static/js/__Components__/SettingsTabTheme.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <SettingsGroup header="APPEARANCE" footer="Choose a visual theme for HomeDock OS interface.">
    <SettingsItem :icon="bright4Icon" icon-color="blue" title="Interface Theme" description="Select your preferred color scheme" is-last control-type="stack">
      <RadioGroup v-model:value="themeValue" :class="[themeClasses.scopeSelector]" style="width: auto">
        <RadioButton value="default" name="themeMode" :class="[themeClasses.radioGroupSelector, themeClasses.scopeSelector]" id="defaultMode">
          <div class="flex items-center">
            <Icon :icon="bright4Icon" :class="[themeClasses.radioGroupIconSelector]" class="mr-1" />
            <span>Default</span>
          </div>
        </RadioButton>
        <RadioButton value="noir" name="themeMode" :class="[themeClasses.radioGroupSelector]" id="noirMode">
          <div class="flex items-center">
            <Icon :icon="sunAngleOutlineIcon" :class="[themeClasses.radioGroupIconSelector]" class="mr-1" />
            <span>Noir</span>
          </div>
        </RadioButton>
        <RadioButton value="aeroplus" name="themeMode" :class="[themeClasses.radioGroupSelector]" id="aeroPlusMode">
          <div class="flex items-center">
            <Icon :icon="squareOpacityIcon" :class="[themeClasses.radioGroupIconSelector]" class="mr-1" />
            <span>Aero+</span>
          </div>
        </RadioButton>
      </RadioGroup>
    </SettingsItem>
  </SettingsGroup>

  <Transition name="fade-slide">
    <SettingsGroup v-if="themeValue === 'aeroplus'" header="WALLPAPER" footer="Select from preset wallpapers or upload your own custom image.">
      <SettingsItem :icon="imageAreaIcon" icon-color="green" title="Preset Wallpapers" description="Choose from built-in wallpaper collection" is-last control-type="always-stack">
        <div class="wallpaper-grid-wrapper">
          <div class="wallpaper-grid">
            <button v-for="option in wallpaperOptions" :key="option.value" @click="wallValue = option.value" :class="['wallpaper-option', { 'wallpaper-selected': wallValue === option.value }, themeClasses.scopeSelector]" type="button">
              <img :src="option.payload.src" :alt="option.payload.alt" class="wallpaper-thumbnail" />
            </button>
          </div>
        </div>
      </SettingsItem>
    </SettingsGroup>
  </Transition>

  <Transition name="fade-slide">
    <SettingsGroup v-if="themeValue === 'aeroplus'" header="CUSTOM WALLPAPER">
      <SettingsItem :icon="uploadIcon" icon-color="orange" title="Upload Your Own" description="Upload a custom wallpaper (JPG/PNG, min 800x600px, max 10MB)" is-last control-type="stack">
        <div class="w-full">
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
        </div>
      </SettingsItem>
    </SettingsGroup>
  </Transition>
</template>

<script lang="ts" setup>
import { ref, watch, inject, onMounted, nextTick } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";

import { RadioGroup, RadioButton, Upload, message } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import bright4Icon from "@iconify-icons/mdi/brightness-4";
import sunAngleOutlineIcon from "@iconify-icons/mdi/sun-angle-outline";
import squareOpacityIcon from "@iconify-icons/mdi/square-opacity";
import imageAreaIcon from "@iconify-icons/mdi/image-area";
import uploadIcon from "@iconify-icons/mdi/upload";

import SettingsGroup from "../__Components__/SettingsGroup.vue";
import SettingsItem from "../__Components__/SettingsItem.vue";

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
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out, max-height 0.3s ease-in-out;
  overflow: hidden;
  min-height: 0;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
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

/* Wallpaper Grid Styling */
.wallpaper-grid-wrapper {
  width: 100%;
  max-width: 100%;
}

.wallpaper-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
  gap: 0.5rem;
  width: 100%;
  max-width: 100%;
}

@media (min-width: 640px) {
  .wallpaper-grid {
    grid-template-columns: repeat(auto-fit, minmax(85px, 1fr));
    gap: 0.625rem;
  }
}

@media (min-width: 900px) {
  .wallpaper-grid {
    grid-template-columns: repeat(auto-fit, minmax(95px, 1fr));
    gap: 0.75rem;
  }
}

.wallpaper-option {
  position: relative;
  padding: 0.25rem;
  border: 2px solid transparent;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
  overflow: hidden;
}

.wallpaper-option:hover {
  border-color: rgba(125, 125, 125, 0.3);
  transform: scale(1.05);
}

.wallpaper-option:focus {
  outline: none;
  border-color: rgba(125, 125, 125, 0.5);
}

.wallpaper-selected {
  border-color: rgba(125, 125, 125, 0.7) !important;
  background-color: rgba(125, 125, 125, 0.2);
}

.wallpaper-thumbnail {
  width: 100%;
  height: 50px;
  object-fit: cover;
  border-radius: 0.375rem;
  display: block;
}

@media (min-width: 640px) {
  .wallpaper-thumbnail {
    height: 55px;
  }
}

@media (min-width: 900px) {
  .wallpaper-thumbnail {
    height: 60px;
  }
}
</style>
