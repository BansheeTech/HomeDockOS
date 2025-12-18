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
  server: {
    cors: {
      origin: "http://localhost",
      credentials: true,
    },
    allowedHosts: ["localhost"],
    hmr: {
      clientPort: 5173,
    },
    watch: {
      ignored: ["**/dropzone/**", "**/compose-link/**", "**/app-store/**", "**/_user_packages/**", "**/__Enterprise__/**"],
    },
  },
  build: {
    outDir: "homedock-ui/vue3/dist",
    manifest: true,
    minify: true,
    rollupOptions: {
      input: {
        global: resolve(__dirname, "homedock-ui/vue3/static/css/global.css"),
        __desktop__: resolve(__dirname, "homedock-ui/vue3/static/js/MountPoints/__desktop__.ts"),
        __login__: resolve(__dirname, "homedock-ui/vue3/static/js/MountPoints/__login__.ts"),
        __limited__: resolve(__dirname, "homedock-ui/vue3/static/js/MountPoints/__limited__.ts"),
        __shieldmode__: resolve(__dirname, "homedock-ui/vue3/static/js/MountPoints/__shieldmode__.ts"),
        __errorcode__: resolve(__dirname, "homedock-ui/vue3/static/js/MountPoints/__errorcode__.ts"),
        __app__: resolve(__dirname, "homedock-ui/vue3/static/js/MountPoints/__app__.ts"),
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
