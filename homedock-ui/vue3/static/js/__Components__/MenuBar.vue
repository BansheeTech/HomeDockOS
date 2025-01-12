<!-- homedock-ui/vue3/static/js/__Components__/MenuBar.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template>
  <aside :class="[themeClasses.back, 'transition-all duration-300', isCollapsed ? 'w-24' : 'w-52']" class="h-full" aria-label="Sidebar">
    <div class="no-scrollbar overflow-y-auto py-3 px-2">
      <MenuContent :mode="'sidebar'" :themeClasses="themeClasses" :activePath="props.activePath" :isCollapsed="isCollapsed" :onSignOut="handleSignOut" />
    </div>
  </aside>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useTheme } from "../__Themes__/ThemeSelector";

import { useUserInterfaceStore } from "../__Stores__/useUserInterface";

import MenuContent from "../__Components__/MenuContent.vue";

import { clientSignOut } from "../__Services__/ClientSignOut";

const props = defineProps<{ activePath: string }>();
const { themeClasses } = useTheme();

const userInterfaceStore = useUserInterfaceStore();
const isCollapsed = computed(() => userInterfaceStore.isMenuCollapsed);

const csrfToken = document.querySelector('meta[name="homedock_csrf_token"]')?.getAttribute("content") || "";

const handleSignOut = () => {
  clientSignOut(csrfToken);
};
</script>

<style scoped></style>
