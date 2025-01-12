// src/static/js/systemlogs/__errorcode__.ts

import { createApp } from "vue";
import ErrorCode from "../__Layouts__/ErrorCode.vue";
import { error } from "console";

interface ThemeData {
  selected_theme: string;
  selected_back: string;
}

interface ErrorData {
  error_code: string;
  error_message: string;
}

const base64ThemeData = document.getElementById("data-theme")?.textContent;
const base64ErrorData = document.getElementById("data-error")?.textContent;

if (base64ThemeData && base64ErrorData) {
  try {
    const themeJsonData = atob(base64ThemeData);
    const errorJsonData = atob(base64ErrorData);

    const themeData = JSON.parse(themeJsonData) as ThemeData;
    const errorData = JSON.parse(errorJsonData) as ErrorData;

    const app = createApp(ErrorCode);

    app.provide("data-theme", {
      selectedTheme: themeData.selected_theme,
      selectedBack: themeData.selected_back,
    });

    app.provide("data-error", {
      errorCode: errorData.error_code,
      errorMessage: errorData.error_message,
    });

    app.mount("#app-errorcode-root");
  } catch (error) {
    console.error("Error parsing data-theme or data-error objects:", error);
  }
} else {
  if (!base64ThemeData) {
    console.error("The element 'data-theme' wasn't found or it's empty.");
  }
  if (!base64ErrorData) {
    console.error("The element 'data-error' wasn't found or it's empty.");
  }
}
