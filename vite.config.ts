// vite.config.ts

import { defineConfig } from "vite";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "tailwindcss";

export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/homedock-ui/vue3/dist/" : "/",
  plugins: [vue()],
  resolve: {
    dedupe: ["vue"],
  },
  optimizeDeps: {
    exclude: ["@prism-wm/core", "@prism-wm/vue", "@prism-wm/styles"],
  },
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  server: {
    cors: {
      origin: ["http://localhost", "https://localhost", "http://homedock.local", "https://homedock.local", "http://homedock.localhost", "https://homedock.localhost", "http://127.0.0.1", "https://127.0.0.1"],
      credentials: true,
    },
    allowedHosts: ["localhost", "homedock.local", "homedock.localhost", "127.0.0.1"],
    hmr: {
      clientPort: 5173,
    },
    watch: {
      ignored: ["**/dropzone/**", "**/compose-link/**", "**/app-store/**", "**/_user_packages/**", "__Enterprise__/**", "!**/node_modules/@prism-wm/**"],
    },
  },
  build: {
    outDir: "homedock-ui/vue3/dist",
    manifest: true,
    minify: true,
    cssMinify: "esbuild", // tempfix (https://github.com/parcel-bundler/lightningcss/issues/695) rolldown-vite (Vite 8) defaults cssMinify to lightningcss, which drops the unprefixed backdrop-filter (keeps only -webkit-) and breaks frosted-glass surfaces; esbuild minifies CSS without mangling vendor prefixes
    rollupOptions: {
      checks: { pluginTimings: false },
      input: {
        global: resolve(import.meta.dirname, "homedock-ui/vue3/static/css/global.css"),
        __desktop__: resolve(import.meta.dirname, "homedock-ui/vue3/static/js/MountPoints/__desktop__.ts"),
        __login__: resolve(import.meta.dirname, "homedock-ui/vue3/static/js/MountPoints/__login__.ts"),
        __onboarding__: resolve(import.meta.dirname, "homedock-ui/vue3/static/js/MountPoints/__onboarding__.ts"),
        __limited__: resolve(import.meta.dirname, "homedock-ui/vue3/static/js/MountPoints/__limited__.ts"),
        __shieldmode__: resolve(import.meta.dirname, "homedock-ui/vue3/static/js/MountPoints/__shieldmode__.ts"),
        __errorcode__: resolve(import.meta.dirname, "homedock-ui/vue3/static/js/MountPoints/__errorcode__.ts"),
        __appdenied__: resolve(import.meta.dirname, "homedock-ui/vue3/static/js/MountPoints/__appdenied__.ts"),
        __app__: resolve(import.meta.dirname, "homedock-ui/vue3/static/js/MountPoints/__app__.ts"),
      },
      output: {
        comments: { legal: true },
        chunkFileNames: "hdos_[hash:21].js",
        entryFileNames: "hdos_[hash:21].js",
        assetFileNames: "hdos_[hash:21].[ext]",
      },
    },
  },
}));
