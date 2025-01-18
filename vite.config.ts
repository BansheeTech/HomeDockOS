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
        __login__: resolve(__dirname, "homedock-ui/vue3/static/js/MountPoints/__login__.ts"),
        __limited__: resolve(__dirname, "homedock-ui/vue3/static/js/MountPoints/__limited__.ts"),
        __shieldmode__: resolve(__dirname, "homedock-ui/vue3/static/js/MountPoints/__shieldmode__.ts"),
        __errorcode__: resolve(__dirname, "homedock-ui/vue3/static/js/MountPoints/__errorcode__.ts"),
        __dashboard__: resolve(__dirname, "homedock-ui/vue3/static/js/MountPoints/__dashboard__.ts"),
        __app__: resolve(__dirname, "homedock-ui/vue3/static/js/MountPoints/__app__.ts"),
        __appstore__: resolve(__dirname, "homedock-ui/vue3/static/js/MountPoints/__appstore__.ts"),
        __controlhub__: resolve(__dirname, "homedock-ui/vue3/static/js/MountPoints/__controlhub__.ts"),
        __dropzone__: resolve(__dirname, "homedock-ui/vue3/static/js/MountPoints/__dropzone__.ts"),
        __systemlogs__: resolve(__dirname, "homedock-ui/vue3/static/js/MountPoints/__systemlogs__.ts"),
        __settings__: resolve(__dirname, "homedock-ui/vue3/static/js/MountPoints/__settings__.ts"),
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
