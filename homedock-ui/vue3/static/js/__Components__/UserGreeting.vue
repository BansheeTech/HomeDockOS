<!-- homedock-ui/vue3/static/js/__Components__/UserGreeting.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template>
  <span ref="greetingElement" class="greeting inline-flex items-center font-light"></span>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount } from "vue";

export default defineComponent({
  name: "UserGreeting",
  setup() {
    const DEFAULT_GREETING = "Hi there";

    const CHANGE_TIMEFRAME = 12500;
    const TYPE_SPEED_INITIAL = 25;
    const TYPE_SPEED_DEFAULT = 50;
    const TYPE_SPEED_CHANGE = 50;
    const FADE_OUT_DELAY = 200;
    const STORAGE_KEY = "lastGreeting";

    const greetings = ref(["Hola", "Hi there", "Bonjour", "Hallo", "Ciao", "Olá", "Zdravstvuyte", "Nǐ hǎo", "Evoy", "Konnichiwa", "Marhaba", "Namaste", "Shalom", "Yia", "Annyeonghaseyo", "Hej", "Merhaba", "Salaam", "Habari", "Sawubona", "Sav'aaq", "Acho"]);

    const lastGreeting = ref("");
    const isChanging = ref(false);
    const intervalId = ref<number | null>(null);
    const greetingElement = ref<HTMLElement | null>(null);

    const getRandomGreeting = (): string => {
      let newGreeting;
      do {
        const randomIndex = Math.floor(Math.random() * greetings.value.length);
        newGreeting = greetings.value[randomIndex];
      } while (newGreeting === lastGreeting.value && greetings.value.length > 1);

      lastGreeting.value = newGreeting;
      localStorage.setItem(STORAGE_KEY, newGreeting);
      return newGreeting;
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

    const displayGreeting = (greeting: string, speed: number): void => {
      if (greetingElement.value) {
        typeWriter(
          greeting,
          greetingElement.value,
          () => {
            startGreetingInterval(CHANGE_TIMEFRAME);
          },
          speed
        );
      }
    };

    const changeGreeting = (): void => {
      if (isChanging.value) return;
      isChanging.value = true;

      if (greetingElement.value) {
        greetingElement.value.classList.add("fade-out");
        setTimeout(() => {
          if (greetingElement.value) {
            greetingElement.value.innerHTML = "";
            greetingElement.value.classList.remove("fade-out");
            const newGreeting = getRandomGreeting();
            typeWriter(
              newGreeting,
              greetingElement.value,
              () => {
                isChanging.value = false;
              },
              TYPE_SPEED_CHANGE
            );
          }
        }, FADE_OUT_DELAY);
      }
    };

    const startGreetingInterval = (interval: number): void => {
      if (intervalId.value !== null) {
        clearInterval(intervalId.value);
      }
      intervalId.value = setInterval(changeGreeting, interval) as unknown as number;
    };

    const handleVisibilityChange = (): void => {
      if (document.hidden) {
        if (intervalId.value !== null) {
          clearInterval(intervalId.value);
        }
      } else {
        startGreetingInterval(CHANGE_TIMEFRAME);
      }
    };

    const easterr = (): void => {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const usernameElements = document.querySelectorAll(".username_catcher");

      if (day === 21 && month === 3) {
        usernameElements.forEach((element) => {
          if (element.textContent === "Anghios") {
            const easterSpan = document.createElement("span");
            easterSpan.classList.add("easterClass");
            easterSpan.innerHTML = " 🍰";
            element.appendChild(easterSpan);
          }
        });
      }

      if (day === 31 && month === 12) {
        usernameElements.forEach((element) => {
          const easterSpan = document.createElement("span");
          easterSpan.classList.add("easterClass");
          easterSpan.innerHTML = " 🎆";
          element.appendChild(easterSpan);
        });
      }
    };

    onMounted(() => {
      const storedGreeting = localStorage.getItem(STORAGE_KEY);
      if (storedGreeting && greetings.value.includes(storedGreeting)) {
        lastGreeting.value = storedGreeting;
        displayGreeting(storedGreeting, TYPE_SPEED_INITIAL);
      } else {
        displayGreeting(DEFAULT_GREETING, TYPE_SPEED_DEFAULT);
      }
      easterr();
      document.addEventListener("visibilitychange", handleVisibilityChange);
    });

    onBeforeUnmount(() => {
      if (intervalId.value !== null) {
        clearInterval(intervalId.value);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    });

    return {
      greetingElement,
    };
  },
});
</script>

<style scoped>
.fade-out {
  opacity: 0;
  transition: opacity 0.2s;
}

.fade-in {
  opacity: 0;
  transition: opacity 0.5s ease-in;
  opacity: 1;
}

.greeting {
  white-space: pre;
}

.easterClass {
  margin-left: 5px;
}
</style>
