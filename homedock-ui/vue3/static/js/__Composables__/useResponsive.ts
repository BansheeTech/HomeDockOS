// homedock-ui/vue3/static/js/__Composables__/useResponsive.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { ref, computed, onMounted, onUnmounted } from "vue";

// Breakpoints of HomeDock OS Prism Window Manager (common Tailwind CSS conventions)

export const BREAKPOINTS = {
  mobile: 0, // 0px - 767px
  tablet: 768, // 768px - 1199px
  desktop: 1200, // 1200px - 1919px
  wide: 1920, // 1920px+
} as const;

export function useResponsive() {
  const windowWidth = ref(window.innerWidth);
  const windowHeight = ref(window.innerHeight);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  const updateSize = () => {
    windowWidth.value = window.innerWidth;
    windowHeight.value = window.innerHeight;
  };

  let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
  const debouncedUpdateSize = () => {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }
    resizeTimeout = setTimeout(updateSize, 100);
  };

  onMounted(() => {
    window.addEventListener("resize", debouncedUpdateSize);
    updateSize();
  });

  onUnmounted(() => {
    window.removeEventListener("resize", debouncedUpdateSize);
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }
  });

  const isMobile = computed(() => windowWidth.value < BREAKPOINTS.tablet);

  const isTablet = computed(() => windowWidth.value >= BREAKPOINTS.tablet && windowWidth.value < BREAKPOINTS.desktop);

  const isDesktop = computed(() => windowWidth.value >= BREAKPOINTS.desktop && windowWidth.value < BREAKPOINTS.wide);

  const isWide = computed(() => windowWidth.value >= BREAKPOINTS.wide);

  const isDesktopOrWider = computed(() => windowWidth.value >= BREAKPOINTS.desktop);

  const isTabletOrWider = computed(() => windowWidth.value >= BREAKPOINTS.tablet);

  const deviceType = computed<"mobile" | "tablet" | "desktop" | "wide">(() => {
    if (isMobile.value) return "mobile";
    if (isTablet.value) return "tablet";
    if (isDesktop.value) return "desktop";
    return "wide";
  });

  const isPortrait = computed(() => windowHeight.value > windowWidth.value);
  const isLandscape = computed(() => windowWidth.value >= windowHeight.value);

  const aspectRatio = computed(() => windowWidth.value / windowHeight.value);

  const gridColumns = computed(() => {
    return isMobile.value ? 4 : 6;
  });

  const windowsShouldBeFullscreen = computed(() => isMobile.value);

  const isDragEnabled = computed(() => !isMobile.value);

  const isResizeEnabled = computed(() => !isMobile.value);

  const desktopIconSize = computed<"small" | "medium" | "large">(() => {
    if (isMobile.value) return "small"; // 48px
    if (isTablet.value) return "medium"; // 64px
    return "large"; // 80px
  });

  const taskbarHeight = computed(() => {
    if (isMobile.value) return "56px"; // Mobile
    if (isTablet.value) return "56px"; // Tablet
    return "52px"; // Desktop
  });

  const showTaskbarLabels = computed(() => isDesktopOrWider.value);

  const maxRecentApps = computed(() => {
    if (isMobile.value) return 4;
    if (isTablet.value) return 6;
    return 8;
  });

  const startMenuWidth = computed(() => {
    if (isMobile.value) return "100%";
    if (isTablet.value) return "80%";
    if (isDesktop.value) return "600px";
    return "700px";
  });

  const startMenuHeight = computed(() => {
    if (isMobile.value) return "100%";
    if (isTablet.value) return "80%";
    return "700px";
  });

  const viewportHeightPx = computed(() => `${windowHeight.value}px`);

  const taskbarHeightPx = computed(() => {
    if (isMobile.value) return 56;
    if (isTablet.value) return 56;
    return 52; // Desktop
  });

  const availableHeight = computed(() => `${windowHeight.value - taskbarHeightPx.value}px`);

  return {
    windowWidth,
    windowHeight,

    isMobile,
    isTablet,
    isDesktop,
    isWide,
    isDesktopOrWider,
    isTabletOrWider,

    deviceType,
    isPortrait,
    isLandscape,
    aspectRatio,
    isIOS,

    gridColumns,
    windowsShouldBeFullscreen,
    isDragEnabled,
    isResizeEnabled,
    desktopIconSize,
    taskbarHeight,
    taskbarHeightPx,
    showTaskbarLabels,
    maxRecentApps,
    startMenuWidth,
    startMenuHeight,

    viewportHeightPx,
    availableHeight,

    BREAKPOINTS,
  };
}
