<!-- homedock-ui/vue3/static/js/__Components__/AppStoreStoresTip.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Transition name="tip-pop">
    <div v-if="visible" role="dialog" :aria-label="$t('Get over 800 apps')" :class="[themeClasses.installDropdownBg, themeClasses.installDropdownBorder, themeClasses.installDropdownShadow, compact ? 'tip-compact' : 'tip-anchored']" class="stores-tip absolute z-20 w-[272px] rounded-2xl border p-3.5">
      <div class="flex items-start gap-3">
        <AppIconGraphic :icon="packageIcon" color="#f59e0b" :size="36" />
        <div class="flex-1 min-w-0">
          <p :class="[themeClasses.storeModalAppName]" class="m-0 text-[13px] font-semibold">{{ $t("Get over 800 apps") }}</p>
          <p :class="[themeClasses.storeCardSubtitle]" class="m-0 mt-0.5 text-xs leading-snug">{{ $t("Add third-party stores like Casa, BigBearTechWorld or Coolstore in Packager to extend the App Store to over 800 apps.") }}</p>
        </div>
        <button type="button" :aria-label="$t('Close')" :class="[themeClasses.explorerClearButton, themeClasses.explorerClearButtonHover]" class="flex items-center justify-center w-5 h-5 -mt-0.5 -mr-1 rounded cursor-pointer flex-shrink-0" @click="emit('dismiss')">
          <Icon :icon="closeIcon" class="w-3.5 h-3.5" />
        </button>
      </div>
      <div class="flex justify-end gap-2 mt-3">
        <button type="button" :class="[themeClasses.storeCardInstalledPill]" class="h-7 px-3.5 rounded-full text-xs font-semibold cursor-pointer transition-colors duration-150" @click="emit('dismiss')">{{ $t("Not now") }}</button>
        <button type="button" class="h-7 px-3.5 rounded-full bg-blue-600 text-white text-xs font-semibold cursor-pointer transition-colors duration-150 hover:bg-blue-500" @click="emit('open-stores')">{{ $t("Add stores") }}</button>
      </div>
      <span v-if="!compact" :class="[themeClasses.installDropdownBg, themeClasses.installDropdownBorder]" class="tip-arrow absolute w-3 h-3 border-r border-b rotate-45" aria-hidden="true"></span>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { useTheme } from "../__Themes__/ThemeSelector";

import { Icon } from "@iconify/vue";
import packageIcon from "@iconify-icons/mdi/package-variant";
import closeIcon from "@iconify-icons/mdi/close";

import AppIconGraphic from "./AppIconGraphic.vue";

defineProps<{
  visible: boolean;
  compact?: boolean;
}>();

const emit = defineEmits<{
  (e: "dismiss"): void;
  (e: "open-stores"): void;
}>();

const { themeClasses } = useTheme();
</script>

<style scoped>
.tip-anchored {
  left: 12px;
  bottom: 88px;
  transform-origin: 24px calc(100% + 8px);
}

.tip-compact {
  left: 16px;
  right: 16px;
  bottom: 92px;
  width: auto;
  transform-origin: 50% 100%;
}

.tip-arrow {
  left: 20px;
  bottom: -6.5px;
}

.tip-pop-enter-active {
  transition:
    opacity 0.25s ease,
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tip-pop-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.tip-pop-enter-from,
.tip-pop-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(6px);
}
</style>
