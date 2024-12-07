// vite.config.ts

import { defineConfig } from "vite";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "tailwindcss";

export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/homedock-ui/vue3/dist/" : "/",
  plugins: [vue()],
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  build: {
    outDir: "homedock-ui/vue3/dist",
    manifest: true,
    minify: true,
    rollupOptions: {
      input: {
        global: resolve(__dirname, "homedock-ui/vue3/static/css/global.css"),
        __login__: resolve(__dirname, "homedock-ui/vue3/static/js/login/__login__.ts"),
        __limited__: resolve(__dirname, "homedock-ui/vue3/static/js/limited/__limited__.ts"),
        __shieldmode__: resolve(__dirname, "homedock-ui/vue3/static/js/shieldmode/__shieldmode__.ts"),
        __errorcode__: resolve(__dirname, "homedock-ui/vue3/static/js/errorcode/__errorcode__.ts"),
        __dashboard__: resolve(__dirname, "homedock-ui/vue3/static/js/dashboard/__dashboard__.ts"),
        __appstore__: resolve(__dirname, "homedock-ui/vue3/static/js/appstore/__appstore__.ts"),
        __controlhub__: resolve(__dirname, "homedock-ui/vue3/static/js/controlhub/__controlhub__.ts"),
        __systemlogs__: resolve(__dirname, "homedock-ui/vue3/static/js/systemlogs/__systemlogs__.ts"),
        __settings__: resolve(__dirname, "homedock-ui/vue3/static/js/settings/__settings__.ts"),
      },
      output: {
        chunkFileNames: "hdos_[hash:21].js",
        entryFileNames: "hdos_[hash:21].js",
        assetFileNames: (assetInfo) => {
          const ext = (assetInfo.name ?? "").split(".").pop();
          return `hdos_[hash:21].[ext]`;
        },
      },
    },
  },
}));
