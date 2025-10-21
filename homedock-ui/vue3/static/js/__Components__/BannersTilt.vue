<!-- homedock-ui/vue3/static/js/__Components__/BannersTilt.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div ref="tiltContainer" class="tilt-card" @mouseenter="startTilt" @mouseleave="stopTilt">
    <div class="tilt-content">
      <slot name="image"></slot>
      <div v-if="appIcon" class="app-icon" ref="appIconElement" @click="handleLearnMore">
        <img :src="appIcon" draggable="false" alt="App Icon" />
      </div>
      <div v-if="deskScreen" class="desk-screen" ref="deskScreenElement" @click="handleLearnMore">
        <img :src="deskScreen" draggable="false" alt="Desk Screen" />
      </div>
      <div ref="title" class="tilt-title">
        <slot name="title"></slot>
      </div>
      <div ref="text" class="tilt-text">
        <slot name="text"></slot>
      </div>
      <Button ref="installButton" size="small" type="primary" class="tilt-install" @click="handleLearnMore">
        <div class="flex items-center">
          <Icon :icon="bookOpenBlankVariantIcon" class="optionsIcon mr-2" />
          <span class="text-white">Install</span>
        </div>
      </Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";

import { useAppStore } from "../__Stores__/useAppStore";
import { useWindowStore } from "../__Stores__/windowStore";

import { Button } from "ant-design-vue";

import VanillaTilt from "vanilla-tilt";

import { Icon } from "@iconify/vue";
import bookOpenBlankVariantIcon from "@iconify-icons/mdi/arrow-expand-all";

const appStore = useAppStore();
const windowStore = useWindowStore();

const props = defineProps({
  maxTilt: {
    type: Number,
    default: 10,
  },
  speed: {
    type: Number,
    default: 200,
  },
  glare: {
    type: Boolean,
    default: true,
  },
  maxGlare: {
    type: Number,
    default: 0.5,
  },
  appIcon: {
    type: String,
    default: "/images/docker-icons/homedock.jpg",
  },
  deskScreen: {
    type: String,
    default: "/images/banners-desk/plex.jpg",
  },
  appName: {
    type: String,
    required: true,
  },
});

const tiltContainer = ref<HTMLElement | null>(null);
const tiltInstance = ref<VanillaTilt | null>(null);
const tiltActive = ref(false);

const title = ref<HTMLElement | null>(null);
const text = ref<HTMLElement | null>(null);
const appIconElement = ref<HTMLElement | null>(null);
const deskScreenElement = ref<HTMLElement | null>(null);
const installButton = ref<any>(null);

const handleLearnMore = () => {
  const app = appStore.apps.find((a) => a.name.toLowerCase() === props.appName.toLowerCase());

  if (!app) return;

  const existingWindow = windowStore.windows.find((w) => w.appId === "installconfig" && w.data?.app?.name === app.name);

  if (existingWindow) {
    windowStore.focusWindow(existingWindow.id);
    if (existingWindow.isMinimized) {
      existingWindow.isMinimized = false;
    }
    return;
  }

  windowStore.openWindow("installconfig", {
    title: `Install ${app.display_name || app.name}`,
    data: { app: app },
    allowMultiple: true,
  });
};

const startTilt = () => {
  if (tiltActive.value || !tiltContainer.value) return;
  tiltActive.value = true;
  VanillaTilt.init(tiltContainer.value, {
    max: props.maxTilt,
    speed: props.speed,
    glare: props.glare,
    "max-glare": props.maxGlare,
    gyroscope: false,
  });

  tiltInstance.value = (tiltContainer.value as any).vanillaTilt;
};

const stopTilt = () => {
  if (!tiltActive.value) return;
  tiltActive.value = false;
  tiltInstance.value?.destroy();
  tiltInstance.value = null;
};
</script>

<style scoped>
.tilt-card {
  perspective: 1000px;
  position: relative;
}

.tilt-content {
  transform-style: preserve-3d;
  position: relative;
}

.tilt-title {
  position: absolute;
  top: 130px;
  left: 35px;
  transform: translateZ(50px);
  color: white;
  z-index: 10;
  text-shadow: 0px 4px 9px rgba(0, 0, 0, 0.5);
}

.tilt-text {
  position: absolute;
  font-size: 26px;
  bottom: 30px;
  left: 35px;
  transform: translateZ(50px);
  color: white;
  width: 258px;
  line-height: 28px;
  z-index: 10;
  text-shadow: 0px 4px 9px rgba(0, 0, 0, 0.5);
}

.app-icon {
  position: absolute;
  top: 40px;
  left: 35px;
  width: 64px;
  height: 64px;
  z-index: 10;
  transform: translateZ(50px);
  border-radius: 15px;
  overflow: hidden;
  filter: drop-shadow(0px 5px 5px rgba(0, 0, 0, 0.516));
}

.app-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.desk-screen {
  position: absolute;
  bottom: 14px;
  right: 22px;
  width: 234px;
  height: 200px;
  transform: translateZ(50px);
  border-radius: 5px;
  border-bottom-right-radius: 16px;
  overflow: hidden;
}

.desk-screen img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tilt-install {
  position: absolute;
  top: 44px;
  left: 124px;
  padding-left: 22px;
  padding-right: 22px;
  transform: translateZ(100px);
  border-radius: 20px;
  background-color: rgb(0, 115, 255);
}

.tilt-install:hover {
  height: 56px;
  border-radius: 15px;
  filter: drop-shadow(0px 5px 5px rgba(0, 0, 0, 0.516));
}

.tilt-text,
.tilt-title,
.app-icon,
.desk-screen,
.tilt-install {
  transition: all 300ms cubic-bezier(0, 1.7, 1, 1.7);
  cursor: pointer;
}

.app-icon:hover {
  scale: 1.2;
  border-radius: 30px;
}

.tilt-install:hover {
  scale: 1.1;
}

.tilt-text:hover,
.tilt-title:hover {
  scale: 1.1;
}

.desk-screen:hover {
  scale: 0.9;
}
</style>
