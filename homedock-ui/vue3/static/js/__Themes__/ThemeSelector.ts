// homedock-ui/vue3/static/js/__Themes__/ThemeSelector.ts
// Copyright © 2023-2025 Banshee, All Rights Reserved
// https://www.banshee.pro

import { inject, computed } from "vue";

export function useTheme() {
  const themeConfig = inject("data-theme") as { selectedTheme: keyof typeof themes };

  if (!themeConfig) {
    throw new Error("ThemeConfig is not provided. Make sure `data-theme` is available.");
  }

  const themes: Record<string, Record<string, string>> = {
    default: {
      // Global Theme Scope Selector
      scopeSelector: "white-mode-theme",
      aeroExtraScope: "",

      // Bubble Color Charts
      successBg: "bg-teal-200",
      successText: "text-teal-600",
      warningBg: "bg-orange-200",
      warningText: "text-orange-600",
      infoBg: "bg-blue-200",
      infoText: "text-blue-600",
      dangerBg: "bg-red-200",
      dangerText: "text-red-600",
      primaryBg: "bg-indigo-200",
      primaryText: "text-indigo-600",
      darkBg: "bg-gray-700",
      darkText: "text-gray-300",
      defaultBg: "bg-gray-200",
      defaultText: "text-gray-600",

      // Common Forms
      back: "bg-gray-100",
      form: "bg-white",
      logo: "",
      mainText: "",
      subText: "text-gray-600",
      hyperLink: "text-blue-400 underline",
      cloudBack: "bg-gradient-to-tr from-gray-100 via-gray-200 to-gray-300",
      compLogo: "",
      splashColor: "text-slate-400",
      afterSplash: "text-black",
      errorMessage: "text-gray-600 leading-4",
      hrSelector: "h-[1px] bg-gray-200",
      loginFormInput: "bg-white",
      footerTextLeft: "text-gray-400",
      footerTextLeftIcons: "text-gray-400 hover:text-blue-500",
      footerTextRight: "text-gray-400",
      formIcon: "text-gray-300",
      loginSocialsCont: "bg-gray-100 border border-gray-200/50",
      loginSocials: "text-gray-300 hover:text-blue-600",

      // Dashboard
      iconHolder: "ring-gray-300/25 bg-gradient-to-tr from-gray-200 via-white to-gray-1000",
      appHolder: "hover:bg-gray-50 border-gray-200",
      appName: "text-gray-800",
      appRepo: "text-gray-400",
      appAccess: "text-gray-800",
      statHolder: "bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 border-gray-200/50",
      statInnerText: "text-black",
      statSubtleText: "text-gray-400",
      statUnprogressText: "text-green-800",
      draggerHandler: "text-gray-400",
      depScope: "text-gray-300",
      portSaveScope: "text-green-500",
      portCancelScope: "text-red-500",
      actionButton: "text-gray-600 bg-white",
      actionMenu: "!bg-white text-gray-600",
      startAction: "hover:bg-green-100 hover:ring-green-200",
      stopAction: "hover:bg-red-100 hover:ring-red-200",
      restartAction: "hover:bg-orange-100 hover:ring-orange-200",
      pauseAction: "hover:bg-blue-100 hover:ring-blue-200",
      unpauseAction: "hover:bg-indigo-100 hover:ring-indigo-200",
      uninstallAction: "hover:bg-red-300 hover:ring-red-400",
      updateAction: "hover:bg-rose-100 hover:ring-rose-200",
      processingBarScope: "bg-gray-200",
      noAppsTextMain: "text-gray-400",
      noAppsIcon: "text-gray-300",

      // App
      appLoadingIcon: "text-gray-500",
      sslAdvisorBack: "bg-green-200",
      sslAdvsisorIcon: "text-green-600",
      appErrorMessage: "text-red-500 bg-red-200",
      appDocsMessage: "text-gray-500 bg-gray-200 hover:text-blue-500 hover:bg-blue-200",
      statusBarAppScope: "bg-gray-800/10 text-black/50 border-black/5",

      // NavBar
      greetingMain: "text-gray-400",
      greetingNext: "text-black",
      hambIcon: "text-black",
      navBarIcon: "text-black",

      // MenuBar
      menuActiveLink: "bg-gray-50 text-blue-800",
      menuInactiveLink: "hover:bg-gray-200",
      menuSubMargin: "text-gray-600",

      // Cards
      cardBack: "bg-white",
      collapseComp: "text-gray-400 bg-transparent hover:text-black hover:bg-gray-200",

      // Notis
      notCont: "border-gray-200",
      notMainContainer: "bg-gray-50",
      topBack: "text-slate-500 border-gray-200 bg-gradient-to-b from-slate-50 to-slate-300",
      notBack: "bg-gray-50 border-b border-gray-300",
      notTextUp: "text-black",
      notTextDown: "text-gray-500",
      notInnerIcon: "bg-gray-300 text-gray-700",

      // App Store
      storeContMainer: "border-gray-200 bg-gradient-to-b from-gray-100 to-transparent",
      storeCardTextAppName: "text-gray-700",
      storeCardTextRepo: "text-gray-400",
      storeTypeScope: "text-gray-400",
      storeSeparator: "bg-gray-200",
      storeIconLoadingInstalling: "bg-white/50 text-black/50",
      storeDescription: "bg-slate-200 text-gray-500",
      storeCardInstall: "bg-blue-600 text-white hover:!bg-blue-500",
      storeCardInstalled: "bg-white text-black hover:!bg-gray-50 hover:!text-blue-500 !border-gray-200 hover:!border-blue-500",
      storeCardInstalling: "bg-green-600 text-white hover:!bg-green-500 hover:!text-white !border-green-400",
      storeCardQueued: "bg-gray-600 text-white hover:!bg-gray-500 hover:!text-white !border-gray-400",
      storeButtonInstall: "bg-blue-600 text-white hover:!bg-blue-500 hover:!text-white",
      storeButtonInstalled: "bg-white text-black hover:!bg-gray-50 hover:!text-blue-500 !border-gray-200 hover:!border-blue-500",
      storeButtonInstalling: "bg-green-600 text-white hover:!bg-green-500 hover:!text-white !border-green-400",
      storeButtonQueued: "bg-gray-600 text-white hover:!bg-gray-500 hover:!text-white !border-gray-400",
      storeCategoriesAll: "bg-white text-gray-400",
      storeCategoriesSelect: "bg-white text-gray-400",
      storeSearchAppName: "text-gray-700",
      storeSearchCategory: "text-gray-300",
      storeEmptyText: "text-gray-400",
      storeCardImageBack: "bg-gradient-to-tr from-gray-200 via-white to-gray-100 ring-gray-300/25",
      storeModalImageBack: "bg-gradient-to-tr from-gray-200 via-white to-gray-100 ring-gray-300/25",
      storeModalAppName: "text-gray-900",
      storeModalAppType: "text-gray-800",
      storeModalAppCategory: "text-gray-400",
      storeModalSeparator: "lg:bg-gradient-to-r from-gray-200 via-gray-100 to-white bg-gray-200",
      storeLicenseScope: "text-gray-600",
      storeDependenciesScope: "text-gray-600",
      storeLinkHDOSButton: "bg-white text-black",
      storeAboutTextScope: "text-gray-900",
      storeAboutTextDescScope: "text-gray-700",
      storeAboutTextDepsScope: "text-gray-600 bg-green-200",
      storeRuntimeRenderTextScope: "text-gray-900",
      storeTextSSLFlag: "text-green-500",
      storePopupSSLFlag: "text-green-500 bg-green-200 border-green-500",
      storeInputSSLFlag: "text-green-500",

      // Control-Hub
      hubContMainer: "border-gray-200 bg-gradient-to-b from-gray-100 to-transparent",
      hubCardTextAppName: "text-gray-700",
      hubCardTextRepo: "text-gray-400",
      hubSeparator: "bg-gray-200",
      hubTextArea: "text-gray-500 bg-gray-200 text-[11px] leading-none p-2",
      hubIconHolder: "bg-gradient-to-tr from-gray-200 via-white to-gray-100 ring-gray-300/25",

      // System Logs
      tableTextUp: "text-gray-700",
      tableBorder: "border-gray-200 hover:bg-gray-100",
      tableTextInner: "text-gray-700",
      tooltipBackColor: "#444",
      tooltipSeparator: "bg-gray-600",
      tooltipViewMore: "text-blue-300",
      discoverNotifyIconBack: "text-gray-300",
      discoverNotifyIconPulse: "text-red-600",

      // Drop Zone
      dropZoneDragIcon: "text-gray-600",
      dropZoneDragUpText: "!text-gray-600",
      dropZoneDragDownText: "!text-gray-400",
      dropZoneDragHolder: "!border-gray-300 hover:!border-blue-600",
      dropZoneInputIcon: "text-gray-400",
      dropZoneFileIcon: "text-gray-600",
      dropZoneFileText: "text-gray-800",
      dropZoneFileSize: "bg-gray-200 text-gray-500",
      dropZoneDeleteIcon: "hover:!text-red-500 hover:!border-red-500",
      dropZoneFileDisplayer: "!border-gray-300 hover:!border-blue-600",
      dropZoneLockIcon: "text-gray-300 group-hover:text-blue-600",
      dropZoneEmptyText: "text-gray-400",
      dropZoneTotalSizeScope: "bg-gray-200 text-gray-500",
      dropZoneViewToggle: "border-gray-300",
      dropZoneViewButtonActive: "bg-blue-500 text-white",
      dropZoneViewButtonInactive: "bg-white text-gray-600 hover:bg-gray-50",
      dropZoneSortSelect: "bg-white border-gray-300 text-gray-700",
      dropZoneSortButton: "bg-white border-gray-300 text-gray-600 hover:bg-gray-50 focus:border-blue-500",
      dropZoneFilesCount: "text-gray-600",
      dropZoneNewBadge: "bg-green-500 text-white",
      dropZoneModalBg: "bg-white",
      dropZoneModalTitle: "text-gray-900",
      dropZoneModalText: "text-gray-700",
      dropZoneModalOverlay: "bg-black/30 backdrop-blur-sm",

      // Settings
      boxFoldScope: "bg-gradient-to-b from-gray-100 to-transparent border-gray-200/50",
      boxFoldSepper: "bg-gradient-to-r from-gray-200 via-transparent to-transparent",
      formInputSet: "text-gray-700",
      formLineSet: "border-slate-200",
      userCheckboxScope: "text-gray-700",
      optionSelector: "text-gray-700",
      radioGroupSelector: "bg-white text-black border border-gray-300",
      radioGroupIconSelector: "text-black",
      upperTabText: "text-gray-700",
      selectedCompScope: "bg-transparent",

      // Scrollbars
      scrollbarWxPx: "10px",
      scrollbarTrack: "rgb(243, 244, 246)",
      scrollbarThumb: "rgb(22, 119, 255)",

      // AntD Components
      datePicker: "bg-white border-gray-300 hover:border-gray-400",
      antProgressTrail: "#ededed",
      antProgressStroke: "blue-400",
    },
    noir: {
      // Global Theme Scope Selector
      scopeSelector: "dark-mode-theme",
      aeroExtraScope: "",

      // Bubble Color Charts
      successBg: "bg-teal-900",
      successText: "text-teal-300",
      warningBg: "bg-orange-900",
      warningText: "text-orange-300",
      infoBg: "bg-blue-900",
      infoText: "text-blue-300",
      dangerBg: "bg-red-900",
      dangerText: "text-red-300",
      primaryBg: "bg-indigo-900",
      primaryText: "text-indigo-300",
      darkBg: "bg-zinc-900",
      darkText: "text-zinc-500",
      defaultBg: "bg-zinc-900",
      defaultText: "text-zinc-400",

      // Common Forms
      back: "bg-zinc-800",
      form: "bg-zinc-900",
      logo: "invert",
      mainText: "text-white",
      subText: "text-zinc-400",
      hyperLink: "",
      cloudBack: "bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-700",
      compLogo: "invert",
      splashColor: "text-white",
      afterSplash: "text-white",
      errorMessage: "text-zinc-400 leading-4",
      hrSelector: "h-[1px] bg-zinc-700",
      loginFormInput: "bg-zinc-800 text-twhite border-zinc-700",
      footerTextLeft: "text-zinc-600",
      footerTextLeftIcons: "text-zinc-600 hover:text-blue-500",
      footerTextRight: "text-zinc-600",
      formIcon: "text-zinc-500",
      loginSocialsCont: "bg-zinc-800 border border-zinc-700/50",
      loginSocials: "text-zinc-600 hover:text-blue-600",

      // Dashboard
      iconHolder: "ring-zinc-600/25 bg-gradient-to-tr from-zinc-800 via-zinc-600 to-zinc-800",
      appHolder: "border-zinc-800 hover:bg-zinc-800",
      appName: "text-white",
      appRepo: "text-zinc-500",
      appAccess: "text-zinc-500",
      statHolder: "bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-zinc-800/50",
      statInnerText: "text-white",
      statSubtleText: "text-zinc-400",
      statUnprogressText: "text-green-600",
      draggerHandler: "text-zinc-600",
      depScope: "text-zinc-700",
      portSaveScope: "text-green-500",
      portCancelScope: "text-red-500",
      actionButton: "text-zinc-200 bg-zinc-800 border-zinc-600",
      actionMenu: "!bg-zinc-800 text-zinc-200",
      startAction: "hover:bg-green-800/50 hover:ring-green-600/50",
      stopAction: "hover:bg-red-800/50 hover:ring-red-600/50",
      restartAction: "hover:bg-orange-800/50 hover:ring-orange-600/50",
      pauseAction: "hover:bg-blue-800/50 hover:ring-blue-600/50",
      unpauseAction: "hover:bg-indigo-800/50 hover:ring-indigo-600/50",
      uninstallAction: "hover:bg-red-600/50 hover:ring-red-400/50",
      updateAction: "hover:bg-rose-800/50 hover:ring-rose-600/50",
      processingBarScope: "bg-zinc-700",
      noAppsTextMain: "text-zinc-500",
      noAppsIcon: "text-gray-700",

      // App
      appLoadingIcon: "text-zinc-400",
      sslAdvisorBack: "bg-green-800",
      sslAdvsisorIcon: "text-green-400",
      appErrorMessage: "text-red-200 bg-red-500",
      appDocsMessage: "text-gray-200 bg-gray-500 hover:text-blue-200 hover:bg-blue-500",
      statusBarAppScope: "bg-zinc-100/10 text-white/50 border-white/5",

      // NavBar
      greetingMain: "text-gray-500",
      greetingNext: "text-white",
      hambIcon: "text-white",
      navBarIcon: "text-white",

      // MenuBar
      menuActiveLink: "bg-zinc-700/50 text-zinc-300",
      menuInactiveLink: "hover:bg-zinc-900",
      menuSubMargin: "text-zinc-500",

      // Cards
      cardBack: "bg-zinc-900",
      collapseComp: "text-zinc-500 bg-transparent hover:text-zinc-100 hover:bg-zinc-700",

      // Notis
      notCont: "border-zinc-700",
      notMainContainer: "bg-zinc-800",
      topBack: "text-zinc-500 border-zinc-600 bg-gradient-to-b from-zinc-600 to-zinc-800",
      notBack: "bg-zinc-800 border-b border-zinc-700",
      notTextUp: "text-white",
      notTextDown: "text-zinc-500",
      notInnerIcon: "bg-zinc-600 text-zinc-400",

      // App Store
      storeContMainer: "border-zinc-800 bg-gradient-to-b from-zinc-800 to-transparent",
      storeCardTextAppName: "text-zinc-200",
      storeCardTextRepo: "text-zinc-500",
      storeTypeScope: "text-zinc-500",
      storeSeparator: "bg-zinc-700",
      storeIconLoadingInstalling: "bg-black/50 text-white/50",
      storeDescription: "bg-zinc-800 text-zinc-400",
      storeCardInstall: "bg-blue-600 text-white hover:!bg-blue-500",
      storeCardInstalled: "bg-zinc-800 text-white hover:!bg-zinc-700 hover:!text-white !border-zinc-700 hover:!border-zinc-600",
      storeCardInstalling: "bg-green-600 text-white hover:!bg-green-500 hover:!text-white !border-green-400",
      storeCardQueued: "bg-gray-600 text-white hover:!bg-gray-500 hover:!text-white !border-gray-400",
      storeButtonInstall: "bg-blue-600 text-white hover:!bg-blue-500 hover:!text-white",
      storeButtonInstalled: "bg-zinc-800 text-white hover:!bg-zinc-700 hover:!text-white !border-zinc-700 hover:!border-zinc-600",
      storeButtonInstalling: "bg-green-600 text-white hover:!bg-green-500 hover:!text-white !border-green-400",
      storeButtonQueued: "bg-gray-600 text-white hover:!bg-gray-500 hover:!text-white !border-gray-400",
      storeCategoriesAll: "bg-zinc-800 text-gray-400 border-zinc-700",
      storeCategoriesSelect: "bg-zinc-800 text-gray-400 border-zinc-700",
      storeSearchAppName: "text-zinc-300",
      storeSearchCategory: "text-zinc-600",
      storeEmptyText: "text-zinc-500",
      storeCardImageBack: "bg-gradient-to-tr from-zinc-900 via-zinc-800 to-zinc-900 ring-zinc-600/25",
      storeModalImageBack: "bg-gradient-to-tr from-zinc-900 via-zinc-800 to-zinc-900 ring-zinc-600/25",
      storeModalAppName: "text-zinc-300",
      storeModalAppType: "text-zinc-500",
      storeModalAppCategory: "text-zinc-600",
      storeModalSeparator: "lg:bg-gradient-to-r from-zinc-700 via-zinc-800 to-zinc-800 bg-zinc-700",
      storeLicenseScope: "text-zinc-400",
      storeDependenciesScope: "text-zinc-400",
      storeLinkHDOSButton: "bg-zinc-800 text-white border-zinc-600",
      storeAboutTextScope: "text-zinc-200",
      storeAboutTextDescScope: "text-zinc-400",
      storeAboutTextDepsScope: "text-gray-600 bg-green-400",
      storeRuntimeRenderTextScope: "text-zinc-200",
      storeTextSSLFlag: "text-green-500",
      storePopupSSLFlag: "text-green-200 bg-green-600 border-green-200",
      storeInputSSLFlag: "text-green-200",

      // Control-Hub
      hubContMainer: "border-zinc-800 bg-gradient-to-b from-zinc-800 to-transparent",
      hubCardTextAppName: "text-zinc-200",
      hubCardTextRepo: "text-zinc-500",
      hubSeparator: "bg-zinc-700",
      hubTextArea: "text-green-500 bg-zinc-900 text-[11px] leading-none p-2",
      hubIconHolder: "bg-gradient-to-tr from-zinc-900 via-zinc-800 to-zinc-900 ring-zinc-600/25",

      // System Logs
      tableTextUp: "text-zinc-400",
      tableBorder: "border-zinc-800 hover:bg-zinc-800",
      tableTextInner: "text-zinc-400",
      tooltipBackColor: "#222",
      tooltipSeparator: "bg-zinc-700",
      tooltipViewMore: "text-blue-300",
      discoverNotifyIconBack: "text-zinc-600",
      discoverNotifyIconPulse: "text-red-400",

      // Drop Zone
      dropZoneDragIcon: "text-zinc-300",
      dropZoneDragUpText: "!text-zinc-400",
      dropZoneDragDownText: "!text-zinc-500",
      dropZoneDragHolder: "!border-zinc-600 hover:!border-blue-600",
      dropZoneInputIcon: "text-zinc-400",
      dropZoneFileIcon: "text-zinc-300",
      dropZoneFileText: "text-zinc-400",
      dropZoneFileSize: "bg-zinc-700 text-zinc-300",
      dropZoneDeleteIcon: "bg-transparent border-white/25 text-white hover:!text-red-500 hover:!border-red-500",
      dropZoneFileDisplayer: "!border-[#4e4e4e] hover:!border-blue-600",
      dropZoneLockIcon: "text-zinc-600 group-hover:text-blue-600",
      dropZoneEmptyText: "text-zinc-600",
      dropZoneTotalSizeScope: "bg-zinc-700 text-zinc-300",
      dropZoneViewToggle: "border-zinc-600",
      dropZoneViewButtonActive: "bg-blue-500 text-white",
      dropZoneViewButtonInactive: "bg-zinc-800 text-zinc-400 hover:bg-zinc-700",
      dropZoneSortSelect: "bg-zinc-800 border-zinc-600 text-zinc-300",
      dropZoneSortButton: "bg-zinc-800 border-zinc-600 text-zinc-400 hover:bg-zinc-700 focus:border-blue-500",
      dropZoneFilesCount: "text-zinc-400",
      dropZoneNewBadge: "bg-green-500 text-white",
      dropZoneModalBg: "bg-zinc-900",
      dropZoneModalTitle: "text-zinc-100",
      dropZoneModalText: "text-zinc-300",
      dropZoneModalOverlay: "bg-black/30 backdrop-blur-sm",

      // Settings
      boxFoldScope: "bg-gradient-to-b from-zinc-800 to-transparent border-zinc-700/50",
      boxFoldSepper: "bg-gradient-to-r from-zinc-700 via-transparent to-transparent",
      formInputSet: "text-zinc-400",
      formLineSet: "border-zinc-700",
      userCheckboxScope: "text-zinc-500",
      optionSelector: "text-zinc-500",
      radioGroupSelector: "bg-zinc-800 text-zinc-500 border border-zinc-600",
      radioGroupIconSelector: "text-zinc-500",
      upperTabText: "text-zinc-400",
      selectedCompScope: "bg-transparent",

      // Scrollbars
      scrollbarWxPx: "10px",
      scrollbarTrack: "rgb(39, 39, 42)",
      scrollbarThumb: "rgb(105, 105, 105)",

      // AntD Components
      datePicker: "bg-zinc-800 border-zinc-700 hover:border-zinc-600",
      antProgressTrail: "#313135",
      antProgressStroke: "blue-400",
    },
    aeroplus: {
      // Global Theme Scope Selector
      scopeSelector: "aero-mode-theme",
      aeroExtraScope: "backdrop-blur-xl saturate-200",

      // Bubble Color Charts
      successBg: "bg-teal-900/50",
      successText: "text-teal-300",
      warningBg: "bg-orange-900/50",
      warningText: "text-orange-300",
      infoBg: "bg-blue-900/50",
      infoText: "text-blue-300",
      dangerBg: "bg-red-900/50",
      dangerText: "text-red-300",
      primaryBg: "bg-indigo-900/50",
      primaryText: "text-indigo-300",
      darkBg: "bg-zinc-900/50",
      darkText: "text-zinc-500",
      defaultBg: "bg-zinc-900/50",
      defaultText: "text-zinc-400",

      // Common Forms
      back: "transparent",
      form: "bg-zinc-800/25 backdrop-blur-xl saturate-200",
      logo: "invert",
      mainText: "text-white",
      subText: "text-zinc-400",
      hyperLink: "",
      cloudBack: "backdrop-blur-[200px] saturate-200",
      compLogo: "invert",
      splashColor: "text-white",
      afterSplash: "text-white",
      errorMessage: "text-zinc-400 leading-4",
      hrSelector: "h-[1px] bg-zinc-700/50",
      loginFormInput: "bg-black/10 text-twhite border-zinc-700/50",
      footerTextLeft: "text-zinc-500",
      footerTextLeftIcons: "text-zinc-500 hover:text-blue-500",
      footerTextRight: "text-zinc-500",
      formIcon: "text-zinc-500",
      loginSocialsCont: "bg-zinc-800/25 border border-zinc-800/25",
      loginSocials: "text-zinc-500 hover:text-blue-500",

      // Dashboard
      iconHolder: "ring-zinc-600/50 bg-gradient-to-tr from-zinc-800 via-zinc-600 to-zinc-800",
      appHolder: "border-zinc-800/50 hover:bg-zinc-800/25",
      appName: "text-white",
      appRepo: "text-zinc-500",
      appAccess: "text-zinc-500",
      statHolder: "bg-gradient-to-br from-zinc-900/25 via-zinc-900/25 to-zinc-800/25 border-zinc-800/10",
      statInnerText: "text-white",
      statSubtleText: "text-zinc-400",
      statUnprogressText: "text-green-600",
      draggerHandler: "text-zinc-600",
      depScope: "text-zinc-700",
      portSaveScope: "text-green-500",
      portCancelScope: "text-red-500",
      actionButton: "text-zinc-200 bg-zinc-800/25 border-zinc-600/50",
      actionMenu: "!bg-zinc-800/50 text-zinc-200 backdrop-blur-xl saturate-200",
      startAction: "hover:bg-green-800/50 hover:ring-green-600/50",
      stopAction: "hover:bg-red-800/50 hover:ring-red-600/50",
      restartAction: "hover:bg-orange-800/50 hover:ring-orange-600/50",
      pauseAction: "hover:bg-blue-800/50 hover:ring-blue-600/50",
      unpauseAction: "hover:bg-indigo-800/50 hover:ring-indigo-600/50",
      uninstallAction: "hover:bg-red-600/50 hover:ring-red-400/50",
      updateAction: "hover:bg-rose-800/50 hover:ring-rose-600/50",
      processingBarScope: "bg-zinc-700",
      noAppsTextMain: "text-zinc-400",
      noAppsIcon: "text-gray-400",

      // App
      appLoadingIcon: "text-zinc-200",
      sslAdvisorBack: "bg-green-600/50",
      sslAdvsisorIcon: "text-green-400",
      appErrorMessage: "text-red-600 bg-red-900/50",
      appDocsMessage: "text-gray-400 bg-gray-900/80 hover:text-blue-400 hover:bg-blue-900/80",
      statusBarAppScope: "bg-zinc-800/20 text-white/50 border-zinc-200/5",

      // NavBar
      greetingMain: "text-gray-400",
      greetingNext: "text-white",
      hambIcon: "text-white",
      navBarIcon: "text-white",

      // MenuBar
      menuActiveLink: "bg-zinc-700/25 text-zinc-300",
      menuInactiveLink: "hover:bg-black/50",
      menuSubMargin: "text-zinc-400",

      // Cards
      cardBack: "bg-transparent backdrop-blur-xl saturate-200",
      collapseComp: "text-zinc-500 bg-transparent hover:text-zinc-100 hover:bg-black/50",

      // Notis
      notCont: "border-zinc-700/25 backdrop-blur-xl saturate-200",
      notMainContainer: "backdrop-blur-xl saturate-200",
      topBack: "text-zinc-400 border-zinc-600/25 bg-gradient-to-b from-transparent to-transparent",
      notBack: "bg-transparent border-b border-zinc-700",
      notTextUp: "text-white",
      notTextDown: "text-zinc-400",
      notInnerIcon: "bg-black/50 text-zinc-400",

      // App Store
      storeContMainer: "border-zinc-700/50 bg-gradient-to-b from-zinc-800/50 to-transparent",
      storeCardTextAppName: "text-zinc-200",
      storeCardTextRepo: "text-zinc-500",
      storeTypeScope: "text-zinc-500",
      storeSeparator: "bg-zinc-700/50",
      storeIconLoadingInstalling: "bg-black/50 text-white/50",
      storeDescription: "bg-zinc-800/50 text-zinc-400",
      storeCardInstall: "bg-blue-600/50 text-white hover:!bg-blue-500",
      storeCardInstalled: "bg-zinc-800/50 text-white hover:!bg-zinc-700 hover:!text-white !border-zinc-700/50 hover:!border-zinc-600",
      storeCardInstalling: "bg-green-600/50 text-white hover:!bg-green-500 hover:!text-white !border-green-400/50",
      storeCardQueued: "bg-gray-600/50 text-white hover:!bg-gray-500 hover:!text-white !border-gray-400/50",
      storeButtonInstall: "bg-blue-600 text-white hover:!bg-blue-500 hover:!text-white",
      storeButtonInstalled: "bg-zinc-800 text-white hover:!bg-zinc-700 hover:!text-white !border-zinc-700 hover:!border-zinc-600",
      storeButtonInstalling: "bg-green-600 text-white hover:!bg-green-500 hover:!text-white !border-green-400",
      storeButtonQueued: "bg-gray-600 text-white hover:!bg-gray-500 hover:!text-white !border-gray-400",
      storeCategoriesAll: "bg-zinc-800/50 text-gray-400 border-zinc-700",
      storeCategoriesSelect: "bg-zinc-800/50 text-gray-400 border-zinc-700",
      storeSearchAppName: "text-zinc-300",
      storeSearchCategory: "text-zinc-600",
      storeEmptyText: "text-zinc-500",
      storeCardImageBack: "bg-gradient-to-tr from-zinc-900/50 via-zinc-800/50 to-zinc-900/50 ring-zinc-600/50",
      storeModalImageBack: "bg-gradient-to-tr from-zinc-900/50 via-zinc-800/50 to-zinc-900/50 ring-zinc-600/50",
      storeModalAppName: "text-zinc-300",
      storeModalAppType: "text-zinc-500",
      storeModalAppCategory: "text-zinc-600",
      storeModalSeparator: "lg:bg-gradient-to-r from-zinc-700/50 to-transparent",
      storeLicenseScope: "text-zinc-400",
      storeDependenciesScope: "text-zinc-400",
      storeLinkHDOSButton: "bg-transparent text-white border-zinc-600/50",
      storeAboutTextScope: "text-zinc-200",
      storeAboutTextDescScope: "text-zinc-400",
      storeAboutTextDepsScope: "text-zinc-100 bg-green-400/50",
      storeRuntimeRenderTextScope: "text-zinc-200",
      storeTextSSLFlag: "text-green-500",
      storePopupSSLFlag: "text-green-300 bg-green-600/80 border-green-300",
      storeInputSSLFlag: "text-green-300",

      // Control-Hub
      hubContMainer: "border-zinc-700/50 bg-gradient-to-b from-zinc-800/50 to-transparent",
      hubCardTextAppName: "text-zinc-200",
      hubCardTextRepo: "text-zinc-500",
      hubSeparator: "bg-zinc-700/50",
      hubTextArea: "text-green-500 bg-zinc-900/50 text-[11px] leading-none p-2",
      hubIconHolder: "bg-gradient-to-tr from-zinc-900/50 via-zinc-800/50 to-zinc-900/50 ring-zinc-600/50",

      // System Logs
      tableTextUp: "text-white/50",
      tableBorder: "border-zinc-800/50 hover:bg-zinc-800/50",
      tableTextInner: "text-white/50",
      tooltipBackColor: "#222",
      tooltipSeparator: "bg-zinc-700",
      tooltipViewMore: "text-blue-300",
      discoverNotifyIconBack: "text-zinc-400/50",
      discoverNotifyIconPulse: "text-red-500",

      // Drop Zone
      dropZoneDragIcon: "text-zinc-100/50",
      dropZoneDragUpText: "!text-zinc-100/50",
      dropZoneDragDownText: "!text-zinc-200/50",
      dropZoneDragHolder: "!border-zinc-300/25 hover:!border-blue-600",
      dropZoneInputIcon: "text-zinc-400",
      dropZoneFileIcon: "text-zinc-100/50",
      dropZoneFileText: "text-zinc-100/50",
      dropZoneFileSize: "bg-zinc-600/50 text-zinc-100/50",
      dropZoneDeleteIcon: "bg-transparent border-white/25 text-white hover:!text-red-500 hover:!border-red-500",
      dropZoneFileDisplayer: "!border-zinc-300/25 hover:!border-blue-600",
      dropZoneLockIcon: "text-zinc-300/25 group-hover:text-blue-600",
      dropZoneEmptyText: "text-zinc-300/25",
      dropZoneTotalSizeScope: "bg-zinc-600/50 text-zinc-100/50",
      dropZoneViewToggle: "border-zinc-600/50",
      dropZoneViewButtonActive: "bg-blue-500/80 text-white backdrop-blur-sm",
      dropZoneViewButtonInactive: "bg-zinc-800/30 text-zinc-300 hover:bg-zinc-700/50 backdrop-blur-sm",
      dropZoneSortSelect: "bg-zinc-800/30 hover:bg-zinc-700/50 border-zinc-600/50 text-zinc-300 backdrop-blur-sm",
      dropZoneSortButton: "bg-zinc-800/30 border-zinc-600/50 text-zinc-400 hover:bg-zinc-700/50 focus:border-blue-500 backdrop-blur-sm",
      dropZoneFilesCount: "text-zinc-300/75",
      dropZoneNewBadge: "bg-green-500/80 text-white backdrop-blur-sm",
      dropZoneModalBg: "bg-zinc-900/10 backdrop-blur-xl",
      dropZoneModalTitle: "text-zinc-100",
      dropZoneModalText: "text-zinc-300",
      dropZoneModalOverlay: "bg-black/30 backdrop-blur-sm",

      // Settings
      boxFoldScope: "bg-gradient-to-b from-black/10 to-transparent border-zinc-800/50",
      boxFoldSepper: "bg-gradient-to-r from-zinc-700/50 via-transparent to-transparent",
      formInputSet: "text-zinc-400",
      formLineSet: "border-zinc-700/50",
      userCheckboxScope: "text-zinc-500",
      optionSelector: "text-zinc-500",
      radioGroupSelector: "bg-zinc-800/50 text-zinc-500 border border-zinc-600/50",
      radioGroupIconSelector: "text-zinc-500/50",
      upperTabText: "text-zinc-400",
      selectedCompScope: "bg-transparent",

      // Scrollbars
      scrollbarWxPx: "10px",
      scrollbarTrack: "rgb(39, 39, 42)",
      scrollbarThumb: "rgb(105, 105, 105)",

      // AntD Components
      datePicker: "bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600/50",
      antProgressTrail: "#5555557d",
      antProgressStroke: "blue-400/50",
    },
  };

  const mergeWithDefault = (theme: (typeof themes)["default"]) => {
    return Object.keys(themes.default).reduce((merged, key) => {
      merged[key] = theme[key] || themes.default[key];
      return merged;
    }, {} as (typeof themes)["default"]);
  };

  const themeClasses = computed(() => {
    const currentTheme = themes[themeConfig.selectedTheme] || themes.default;
    return mergeWithDefault(currentTheme);
  });

  return {
    selectedTheme: themeConfig.selectedTheme,
    themeClasses,
  };
}
