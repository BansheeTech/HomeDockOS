<!-- homedock-ui/vue3/static/js/__Components__/WelcomeMessage.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template>
  <span ref="welcomeElement" class="welcome-message inline-flex items-center font-normal"></span>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount } from "vue";

export default defineComponent({
  name: "WelcomeMessage",
  setup() {
    const DEFAULT_MESSAGE = "Welcome to HomeDock OS";

    const CHANGE_TIMEFRAME = 12500;
    const TYPE_SPEED_INITIAL = 1;
    const TYPE_SPEED_CHANGE = 50;
    const FADE_OUT_DELAY = 200;
    const STORAGE_KEY = "lastWelcomeMessage";

    const welcomeMessages = ref(["Welcome to HomeDock OS", "Your private cloud, now truly multiplatform", "From macOS, Windows or Linux, all roads lead here", "Your infrastructure, simplified and secured", "Designed for professionals, built for control", "Desktop and Cloud, finally in sync", "A real cloud OS, without the lock-in", "Have you ever used Drop Zone storage?", "Workspaces that follow your path, not your steps", "This is what owning your cloud looks like"]);

    const lastWelcomeMessage = ref("");
    const isChanging = ref(false);
    const intervalId = ref<number | null>(null);
    const welcomeElement = ref<HTMLElement | null>(null);

    const getRandomWelcomeMessage = (): string => {
      let newMessage;
      do {
        const randomIndex = Math.floor(Math.random() * welcomeMessages.value.length);
        newMessage = welcomeMessages.value[randomIndex];
      } while (newMessage === lastWelcomeMessage.value && welcomeMessages.value.length > 1);

      lastWelcomeMessage.value = newMessage;
      localStorage.setItem(STORAGE_KEY, newMessage);
      return newMessage;
    };

    const typeWriter = (text: string, element: HTMLElement, callback: () => void, speed: number): void => {
      let i = 0;
      const type = () => {
        if (i < text.length) {
          const span = document.createElement("span");
          span.textContent = text.charAt(i);
          element.appendChild(span);
          requestAnimationFrame(() => {
            span.classList.add("fade-in");
          });
          i++;
          setTimeout(type, speed);
        } else {
          callback();
        }
      };
      type();
    };

    const displayWelcomeMessage = (message: string, speed: number): void => {
      if (welcomeElement.value) {
        typeWriter(
          message,
          welcomeElement.value,
          () => {
            startWelcomeInterval(CHANGE_TIMEFRAME);
          },
          speed
        );
      }
    };

    const changeWelcomeMessage = (): void => {
      if (isChanging.value) return;
      isChanging.value = true;

      if (welcomeElement.value) {
        welcomeElement.value.classList.add("fade-out");
        setTimeout(() => {
          if (welcomeElement.value) {
            welcomeElement.value.innerHTML = "";
            welcomeElement.value.classList.remove("fade-out");
            const newMessage = getRandomWelcomeMessage();
            typeWriter(
              newMessage,
              welcomeElement.value,
              () => {
                isChanging.value = false;
              },
              TYPE_SPEED_CHANGE
            );
          }
        }, FADE_OUT_DELAY);
      }
    };

    const startWelcomeInterval = (interval: number): void => {
      if (intervalId.value !== null) {
        clearInterval(intervalId.value);
      }
      intervalId.value = setInterval(changeWelcomeMessage, interval) as unknown as number;
    };

    const handleVisibilityChange = (): void => {
      if (document.hidden) {
        if (intervalId.value !== null) {
          clearInterval(intervalId.value);
        }
      } else {
        startWelcomeInterval(CHANGE_TIMEFRAME);
      }
    };

    onMounted(() => {
      const storedMessage = localStorage.getItem(STORAGE_KEY);
      if (storedMessage && welcomeMessages.value.includes(storedMessage)) {
        lastWelcomeMessage.value = storedMessage;
        displayWelcomeMessage(storedMessage, TYPE_SPEED_INITIAL);
      } else {
        displayWelcomeMessage(DEFAULT_MESSAGE, TYPE_SPEED_CHANGE);
      }
      document.addEventListener("visibilitychange", handleVisibilityChange);
    });

    onBeforeUnmount(() => {
      if (intervalId.value !== null) {
        clearInterval(intervalId.value);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    });

    return {
      welcomeElement,
    };
  },
});
</script>

<style scoped>
.fade-out {
  opacity: 0;
  transition: opacity 0.3s;
}

.fade-in {
  opacity: 0;
  transition: opacity 0.6s ease-in;
  opacity: 1;
}

.welcome-message {
  white-space: pre;
}
</style>
