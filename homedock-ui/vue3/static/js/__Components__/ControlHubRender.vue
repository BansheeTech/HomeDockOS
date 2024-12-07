<!-- src/static/js/__Components__/HubRender.vue -->
<!-- Copyright © 2023-2025 Banshee -->
<!-- https://www.banshee.pro -->

<template>
  <div class="relative">
    <Transition name="fade">
      <div v-if="isLoading" class="absolute inset-0 h-32 flex justify-center items-center z-10">
        <Icon :icon="loadingIcon" class="text-blue-600 animate-spin" width="60" height="60" />
      </div>
    </Transition>

    <Transition name="fade">
      <template v-if="!isLoading">
        <List v-if="apps.length > 0" :dataSource="apps.filter((app) => app.HDRole !== 'dependency')" :grid="{ gutter: 16, column: 5, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 5 }" itemLayout="horizontal">
          <template #renderItem="{ item }">
            <Transition>
              <ListItem class="!p-0">
                <ControlHubApp :app="item" />
              </ListItem>
            </Transition>
          </template>
        </List>
        <div v-else class="flex flex-col justify-center items-center p-3 space-y-1">
          <AnimatedIcon :icons="[iconAnim1, iconAnim2, iconAnim3, iconAnim4, iconAnim3, iconAnim2]" :interval="1000" :iconSize="64" :containerClass="themeClasses.noAppsIcon" class="transition duration-500 hover:-translate-y-2 hover:scale-105" />
          <p :class="[themeClasses.noAppsTextMain]" class="text-sm text-center text-balance">Couldn't find any applications installed.</p>
          <p :class="[themeClasses.noAppsTextMain]" class="text-sm text-center text-balance flex items-center">
            <span>
              Install your first application on the
              <a :class="[themeClasses.hyperLink, 'inline-flex items-center ml-1']" href="/app-store"> <Icon :icon="widgetsOutlineIcon" class="mr-1" />App Store </a>.
            </span>
          </p>
        </div>
      </template>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { useTheme } from "../__Themes__/ThemeSelector";

import { List, ListItem } from "ant-design-vue";

import ControlHubApp from "../__Components__/ControlHubApp.vue";
import AnimatedIcon from "../__Components__/AnimatedIcon.vue";

import { Icon } from "@iconify/vue";
import loadingIcon from "@iconify-icons/mdi/loading";
import widgetsOutlineIcon from "@iconify-icons/mdi/widgets-outline";
import iconAnim1 from "@iconify-icons/mdi/hexagon-outline";
import iconAnim2 from "@iconify-icons/mdi/hexagon-slice-2";
import iconAnim3 from "@iconify-icons/mdi/hexagon-slice-4";
import iconAnim4 from "@iconify-icons/mdi/hexagon-slice-6";

interface App {
  HDRole?: string;
  name: string;
  image: string;
}
defineProps({
  apps: {
    type: Array as () => App[],
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
});

const { themeClasses } = useTheme();
</script>

<style scoped>
/* Fade Transition */
.fade-move,
.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.fade-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
