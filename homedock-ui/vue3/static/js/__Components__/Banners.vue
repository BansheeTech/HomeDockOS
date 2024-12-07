<!-- src/static/js/__Components__/Banners.vue -->
<!-- Copyright © 2023-2025 Banshee -->
<!-- https://www.banshee.pro -->

<template>
  <div class="rounded-2xl overflow-hidden">
    <Vue3Marquee :duration="250">
      <span v-for="banner in shuffledBanners" :key="banner.container" class="pr-4 rounded-2xl overflow-hidden">
        <BannersTilt :appIcon="banner.appIcon" :appName="banner.container" :deskScreen="banner.deskImg" :maxTilt="5" :speed="1000" :glare="true" :maxGlare="0.4">
          <template #image>
            <img class="rounded-2xl" height="250" width="550" draggable="false" :src="banner.src" :alt="banner.alt" :data-container-name="banner.container" />
          </template>
          <template #title>
            <h3>{{ banner.alt }}</h3>
          </template>
          <template #text>
            <p class="text-balance">{{ banner.text }}</p>
          </template>
        </BannersTilt>
      </span>
    </Vue3Marquee>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import { Vue3Marquee } from "vue3-marquee";

import BannersTilt from "../__Components__/BannersTilt.vue";

interface BannerData {
  src: string;
  alt: string;
  text: string;
  appIcon: string;
  deskImg: string;
  container: string;
}

export default defineComponent({
  components: {
    Vue3Marquee,
    BannersTilt,
  },
  data() {
    return {
      bannerData: [
        { alt: "Pi-Hole", container: "pihole", text: "It's getting annoying... Block it!" },
        { alt: "Plex", container: "plex", text: "Stream everything, everywhere." },
        { alt: "WordPress", container: "wordpress", text: "You're awesome, let the world know." },
        { alt: "WireGuard", container: "wireguard", text: "The state-of-the-art VPN solution." },
        { alt: "Immich", container: "immich", text: "Where memories safely sleep." },
        { alt: "WPS Office", container: "wps-office", text: "Edit your sensitive data on the go." },
        { alt: "File Browser", container: "filebrowser", text: "Access all your data. Everywhere." },
        { alt: "Vaultwarden", container: "vaultwarden", text: "One password to rule them all." },
        { alt: "Drawio", container: "drawio", text: "It may be complex, try with a flowchart." },
        { alt: "Stirling PDF", container: "stirling-pdf", text: "All-in-one PDF Editor, anywhere." },
        { alt: "Ollama GPT", container: "ollama-gpt", text: "Your private AI Large Language Models." },
        { alt: "ownCloud", container: "owncloud", text: "So... Let's talk about storage, you good?" },
        { alt: "Home Assistant", container: "homeassistant", text: "Its name is clear enough. You need it." },
      ].map((banner) => ({
        ...banner,
        src: `/images/banners-bg/${banner.container}.jpg`,
        appIcon: `/images/docker-icons/${banner.container}.jpg`,
        deskImg: `/images/banners-desk/${banner.container}.jpg`,
      })),
      shuffledBanners: [] as BannerData[],
    };
  },
  created() {
    this.shuffleAndDuplicateBanners();
  },
  methods: {
    shuffleArray(array: BannerData[]) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    },
    shuffleAndDuplicateBanners() {
      this.shuffleArray(this.bannerData);
      this.shuffledBanners = this.bannerData.slice(0, 4);
    },
  },
});
</script>

<style scoped></style>
