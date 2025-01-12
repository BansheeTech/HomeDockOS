<!-- homedock-ui/vue3/static/js/__Components__/Favicon.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template>
  <div></div>
</template>

<script>
import { useHead } from "@vueuse/head";

export default {
  name: "Favicon",
  setup() {
    useHead({
      meta: [
        { name: "theme-color", content: "#f4f5f7" },
        { name: "background-color", content: "#f4f5f7" },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon/favicon.ico" },
        { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon/favicon-16x16.png" },
        { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon/favicon-32x32.png" },
        { rel: "icon", type: "image/png", sizes: "96x96", href: "/favicon/favicon-96x96.png" },

        { rel: "msapplication-TileImage", content: "/favicon/ms-icon-70x70.png" },
        { rel: "msapplication-TileImage", content: "/favicon/ms-icon-150x150.png" },
        { rel: "msapplication-TileImage", content: "/favicon/ms-icon-310x310.png" },

        { rel: "apple-touch-icon", sizes: "57x57", href: "/favicon/apple-icon-57x57.png" },
        { rel: "apple-touch-icon", sizes: "60x60", href: "/favicon/apple-icon-60x60.png" },
        { rel: "apple-touch-icon", sizes: "72x72", href: "/favicon/apple-icon-72x72.png" },
        { rel: "apple-touch-icon", sizes: "76x76", href: "/favicon/apple-icon-76x76.png" },
        { rel: "apple-touch-icon", sizes: "114x114", href: "/favicon/apple-icon-114x114.png" },
        { rel: "apple-touch-icon", sizes: "120x120", href: "/favicon/apple-icon-120x120.png" },
        { rel: "apple-touch-icon", sizes: "144x144", href: "/favicon/apple-icon-144x144.png" },
        { rel: "apple-touch-icon", sizes: "152x152", href: "/favicon/apple-icon-152x152.png" },
        { rel: "apple-touch-icon", sizes: "180x180", href: "/favicon/apple-icon-180x180.png" },
        { rel: "apple-touch-icon", href: "/favicon/apple-icon.png" },
        { rel: "apple-touch-icon", href: "/favicon/apple-icon-precomposed.png" },

        { rel: "icon", type: "image/png", sizes: "36x36", href: "/favicon/android-icon-36x36.png" },
        { rel: "icon", type: "image/png", sizes: "48x48", href: "/favicon/android-icon-48x48.png" },
        { rel: "icon", type: "image/png", sizes: "72x72", href: "/favicon/android-icon-72x72.png" },
        { rel: "icon", type: "image/png", sizes: "96x96", href: "/favicon/android-icon-96x96.png" },
        { rel: "icon", type: "image/png", sizes: "144x144", href: "/favicon/android-icon-144x144.png" },
        { rel: "icon", type: "image/png", sizes: "192x192", href: "/favicon/android-icon-192x192.png" },

        { rel: "manifest", href: "/favicon/manifest.json" },
      ],
    });
  },
};
</script>
