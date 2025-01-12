<!-- homedock-ui/vue3/static/js/__Components__/SplashScreen.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template>
  <div>
    <div id="cloudScreen" class="cloud-screen">
      <div id="cloudImage" class="flex flex-col items-center justify-center" @click="handleCloudImageClick">
        <Icon :class="[themeClasses.splashColor]" :icon="cloudIcon" width="60" height="60" />
        <div :class="[themeClasses.splashColor]" class="cloudtext text-center">Click to Start</div>
      </div>
      <span class="banshee-cloud">
        <a target="_blank" href="https://banshee.pro">
          <span><BaseImage :class="[themeClasses.compLogo]" class="optin-banshee will-change-transform" src="/images/optin_banshee.png" /></span>
        </a>
      </span>
    </div>

    <div :class="[themeClasses.cloudBack]" class="splash" ref="splashElement">
      <h1 class="objectHead">
        <div class="object"><BaseImage :class="[themeClasses.compLogo]" class="object-logo mr-1" src="/images/logo_trans.svg" /></div>
        <div :class="[themeClasses.afterSplash]" class="object object-text ml-1 h-8">HomeDock OS</div>
      </h1>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useTheme } from "../__Themes__/ThemeSelector";

import { Icon } from "@iconify/vue";
import cloudIcon from "@iconify-icons/mdi/cloud-upload";

import BaseImage from "../__Components__/BaseImage.vue";

const splashElement = ref<HTMLElement | null>(null);
const cloudScreen = ref<HTMLElement | null>(null);
const cloudImage = ref<HTMLElement | null>(null);
const { themeClasses } = useTheme();

const ANIMATION_DELAY = 300;
const ANIMATION_STAGGER = 750;
const ANIMATION_WAIT = 2500;

const startupSound = new Audio("/audio/splash.mp3");

const addClassAfterDelay = (element: HTMLElement, className: string, delay: number): void => {
  setTimeout(() => {
    element.classList.add(className);
  }, delay);
};

const triggerAnimations = (): void => {
  startupSound.play().catch((e) => console.error("Error playing sound: ", e));

  let totalDelay = ANIMATION_DELAY;
  const logoItems = splashElement.value!.querySelectorAll<HTMLElement>(".object");

  logoItems.forEach((item) => {
    addClassAfterDelay(item, "filling", totalDelay);
    totalDelay += ANIMATION_STAGGER;
  });

  setTimeout(() => {
    splashElement.value!.classList.add("splashFadeOut");

    splashElement.value!.addEventListener("transitionend", function removeSplash(event) {
      if (event.propertyName === "opacity") {
        splashElement.value!.remove();
        splashElement.value!.removeEventListener("transitionend", removeSplash);
      }
    });
  }, totalDelay + ANIMATION_WAIT);
};

const handleCloudImageClick = (): void => {
  cloudImage.value!.classList.add("shootUp");
  cloudScreen.value!.style.opacity = "0";
  triggerAnimations();

  cloudScreen.value!.addEventListener(
    "transitionend",
    () => {
      cloudScreen.value!.style.display = "none";
    },
    { once: true }
  );

  localStorage.setItem("splashShown", "true");
};

onMounted(() => {
  cloudScreen.value = document.getElementById("cloudScreen") as HTMLElement;
  cloudImage.value = document.getElementById("cloudImage") as HTMLElement;

  if (!localStorage.getItem("splashShown")) {
    splashElement.value!.style.display = "block";
    cloudScreen.value!.style.display = "flex";
  } else {
    splashElement.value!.style.display = "none";
    cloudScreen.value!.style.display = "none";
  }
});
</script>

<style scoped>
.splash {
  display: none;
  position: fixed;
  overflow: hidden;
  z-index: 99998;
  opacity: 1;
  left: 0;
  top: 0;
  width: 100%;
  height: 100vh;
  transition: 1.5s;
}

#cloudScreen {
  overflow: hidden;
  display: none;
  position: fixed;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  opacity: 1;
  left: 0;
  top: 0;
  width: 100%;
  height: 100vh;
  transition: opacity 1.5s ease-in-out;
}

#cloudImage {
  font-size: 62px;
  animation: float 2s ease-in-out infinite;
  cursor: pointer;
  transition: transform 1s ease-in-out;
  line-height: 34px;
  text-align: center;
}

.cloudtext {
  font-size: 12px;
  line-height: 12px;
}

#cloudImage.shootUp {
  animation: shootUpAndFadeOut 1s forwards;
}

.splashFadeOut {
  opacity: 0;
  transition: opacity 0.5s ease-in-out;
}

.objectHead {
  position: absolute;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.object {
  position: relative;
  display: inline-block;
  bottom: -20px;
  opacity: 0;
  transform: scale(0);
}

.object.filling {
  bottom: 0;
  opacity: 1;
  transition: ease-in-out 0.5s, transform 0.5s;
  transform: scale(1);
}

.object-logo {
  width: 24px;
  height: 240px;
}

.object-text {
  font-size: 20px;
}

.optin-banshee {
  height: 16px;
  display: block;
  margin: 0 auto;
  opacity: 0.1;
  scale: 1;
  margin-top: 50px;
  transition: all 0.5s ease;
}

.optin-banshee:hover {
  opacity: 1;
  scale: 1.1;
}

.banshee-cloud {
  position: absolute;
  margin: 0 auto;
  bottom: 24px;
}

@keyframes shootUpAndFadeOut {
  from {
    transform: translateY(0);
    opacity: 1;
  }

  to {
    transform: translateY(-150px);
    opacity: 0;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.6;
    scale: 1;
  }

  50% {
    transform: translateY(-5px);
    opacity: 1;
    scale: 1.1;
  }
}
</style>
