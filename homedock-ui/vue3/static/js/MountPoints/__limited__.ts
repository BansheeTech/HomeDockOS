// src/static/js/systemlogs/__limited__.ts

import { createApp } from "vue";
import Limited from "../__Layouts__/Limited.vue";

interface ThemeData {
  selected_theme: string;
  selected_back: string;
}

const base64Data = document.getElementById("data-theme")?.textContent;

if (base64Data) {
  const jsonData = atob(base64Data);

  let themeData: ThemeData;

  try {
    themeData = JSON.parse(jsonData) as ThemeData;

    const app = createApp(Limited);

    app.provide("data-theme", {
      selectedTheme: themeData.selected_theme,
      selectedBack: themeData.selected_back,
    });

    app.mount("#app-limited-root");
  } catch (error) {
    console.error("Error parsing data-theme objects:", error);
  }
} else {
  console.error("The element 'data-theme' wasn't found or it's empty.");
}
