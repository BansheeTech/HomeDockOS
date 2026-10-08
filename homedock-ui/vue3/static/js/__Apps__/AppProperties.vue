<!-- homedock-ui/vue3/static/js/__Apps__/AppProperties.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="properties-app flex flex-col h-full overflow-hidden" :class="[themeClasses.scopeSelector]">
    <div class="flex-1 overflow-auto">
      <div v-if="app" class="flex flex-col">
        <div class="hero-section" :class="[themeClasses.aeroExtraScope, themeClasses.appPropsHeroBorder]">
          <div class="hero-gradient"></div>
          <AppIconGraphic :image-src="app.image_path" :size="190" class="hero-watermark" :class="themeClasses.appPropsHeroWatermark" />
          <div class="relative flex items-center gap-5 px-4 py-3">
            <div class="relative flex-shrink-0">
              <AppIconGraphic :image-src="app.image_path" :size="isMobile ? 60 : 72" :class="getContainerClasses(app)" />
              <Icon v-if="isDependency" :icon="dependencyBadgeIcon" :class="[themeClasses.hubDependencyBadge]" class="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full p-1 ring-1" :title="groupMain ? $t('Dependency of {name}', { name: groupMain.display_name || groupMain.name }) : $t('Dependency')" />
            </div>
            <div class="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
              <h2 class="text-2xl font-bold m-0 leading-tight truncate" :class="[themeClasses.notTextUp]" :title="displayTitle">{{ displayTitle }}</h2>
              <p class="text-sm opacity-70 m-0 overflow-hidden text-ellipsis whitespace-nowrap" :class="[themeClasses.notTextDown]">{{ app.image }}</p>

              <div class="flex items-center gap-2 flex-wrap min-w-0">
                <div v-if="isDependency && groupMain" :class="[themeClasses.appPropsBadgeDependency]" class="inline-flex items-center gap-1.5 h-6 pl-1.5 pr-2.5 rounded-full border w-fit flex-shrink-0" :title="$t('Dependency of {name}', { name: groupMain.display_name || groupMain.name })">
                  <AppIconGraphic :image-src="groupMain.image_path" :size="14" />
                  <span class="text-[11px] font-semibold uppercase tracking-wide leading-none">{{ $t("Dependency") }}</span>
                </div>

                <div :class="[...getStatusClasses(app.statusColor), 'inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full border w-fit flex-shrink-0']">
                  <div :class="[getStatusDotClasses(app.status), 'w-1.5 h-1.5 rounded-full shadow-[0_0_6px_currentColor]', { 'animate-[pulse-success_2s_cubic-bezier(0.4,0,0.6,1)_infinite]': app.status === 'running' }]"></div>
                  <span class="text-[11px] font-semibold uppercase tracking-wide leading-none">{{ $t(app.status) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-1.5 px-4 py-1.5" :class="[themeClasses.appPropsTabsContainerBg, themeClasses.appPropsTabsContainerBorder]">
          <button class="flex items-center gap-2 px-4 py-2 border-none text-xs font-semibold cursor-pointer transition-all duration-300 relative rounded-lg shadow-xs hover:shadow-md" :class="[themeClasses.appPropsTabButton, themeClasses.appPropsTabButtonBg, activeTab === 'general' ? themeClasses.appPropsTabButtonActiveBorder : themeClasses.appPropsTabButtonBorder, themeClasses.appPropsTabButtonHover, { [themeClasses.appPropsTabButtonActive]: activeTab === 'general' }]" @click="activeTab = 'general'">
            <Icon :icon="infoIcon" width="15" height="15" />
            <span>{{ $t("General") }}</span>
          </button>
          <button class="flex items-center gap-2 px-4 py-2 border-none text-xs font-semibold cursor-pointer transition-all duration-300 relative rounded-lg shadow-xs hover:shadow-md" :class="[themeClasses.appPropsTabButton, themeClasses.appPropsTabButtonBg, activeTab === 'files' ? themeClasses.appPropsTabButtonActiveBorder : themeClasses.appPropsTabButtonBorder, themeClasses.appPropsTabButtonHover, { [themeClasses.appPropsTabButtonActive]: activeTab === 'files' }]" @click="activeTab = 'files'">
            <Icon :icon="folderIcon" width="15" height="15" />
            <span>{{ $t("Files") }}</span>
          </button>
          <button class="flex items-center gap-2 px-4 py-2 border-none text-xs font-semibold cursor-pointer transition-all duration-300 relative rounded-lg shadow-xs hover:shadow-md" :class="[themeClasses.appPropsTabButton, themeClasses.appPropsTabButtonBg, activeTab === 'actions' ? themeClasses.appPropsTabButtonActiveBorder : themeClasses.appPropsTabButtonBorder, themeClasses.appPropsTabButtonHover, { [themeClasses.appPropsTabButtonActive]: activeTab === 'actions' }]" @click="activeTab = 'actions'">
            <Icon :icon="cogIcon" width="15" height="15" />
            <span>{{ $t("Actions") }}</span>
          </button>
        </div>

        <div class="p-4">
          <Transition name="tab-fade" mode="out-in">
            <div v-if="activeTab === 'general'" key="general" class="flex flex-col gap-4">
              <div v-if="stoppedDependencies.length" class="flex items-start gap-3 rounded-[10px] px-3.5 py-3 border" :class="[themeClasses.appPropsDependencyWarningBg, themeClasses.appPropsDependencyWarningBorder, themeClasses.aeroExtraScope]">
                <Icon :icon="dependencyOffIcon" width="20" height="20" class="flex-shrink-0 mt-0.5" :class="[themeClasses.appPropsDependencyWarningIcon]" />
                <div class="flex flex-col items-start gap-2 min-w-0">
                  <div class="flex flex-col gap-1 min-w-0">
                    <span class="text-sm font-semibold" :class="[themeClasses.appPropsDependencyWarningTitle]">{{ $t("Dependencies stopped") }}</span>
                    <span class="text-xs opacity-80" :class="[themeClasses.appPropsDependencyWarningText]">{{ $t("This application may not work correctly until they are running again.") }}</span>
                  </div>

                  <div class="flex flex-wrap gap-1.5 min-w-0">
                    <button v-for="dependency in stoppedDependencies" :key="dependency.id" @click="openMemberProperties(dependency)" :title="$t('Properties')" class="flex items-center gap-1.5 h-6 pl-1.5 pr-2.5 rounded-md border text-xs font-medium cursor-pointer transition-colors duration-200 max-w-full min-w-0" :class="[themeClasses.appPropsActionButtonBg, themeClasses.appPropsActionButtonBorder, themeClasses.appPropsActionButtonText, themeClasses.appPropsActionButtonBgHover, themeClasses.appPropsActionButtonBorderHover, themeClasses.aeroExtraScope]">
                      <AppIconGraphic :image-src="dependency.image_path" :size="14" />
                      <span class="truncate leading-none">{{ dependency.name }}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div class="grid md:grid-cols-2 grid-cols-1 gap-3">
                <div class="rounded-[10px] px-3.5 py-3 transition-all duration-200" :class="[themeClasses.appPropsUsageCardBg, themeClasses.appPropsUsageCardBorder, themeClasses.appPropsUsageCardBgHover, themeClasses.appPropsUsageCardBorderHover, themeClasses.aeroExtraScope]">
                  <div class="flex items-center gap-2 mb-2.5">
                    <Icon :icon="cpuIcon" width="20" height="20" :class="[themeClasses.appPropsCardHeaderIcon]" />
                    <span class="text-[15px] font-semibold m-0" :class="[themeClasses.appPropsCardHeaderText]">{{ $t("CPU") }}</span>
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <span class="text-xl font-bold leading-none" :class="[themeClasses.appPropsInfoValue]">{{ app.usagePercent }}%</span>
                    <div class="w-full h-1.5 rounded-full overflow-hidden" :class="[themeClasses.appPropsProgressBarBg]">
                      <div class="h-full rounded-full transition-[width] duration-300" :style="{ width: `${app.usagePercent}%` }" :class="app.usagePercent >= 80 ? themeClasses.appPropsProgressBarFillCritical : app.usagePercent >= 50 ? themeClasses.appPropsProgressBarFillWarning : themeClasses.appPropsProgressBarFillNormal"></div>
                    </div>
                  </div>
                </div>

                <div class="rounded-[10px] px-3.5 py-3 transition-all duration-200" :class="[themeClasses.appPropsUsageCardBg, themeClasses.appPropsUsageCardBorder, themeClasses.appPropsUsageCardBgHover, themeClasses.appPropsUsageCardBorderHover, themeClasses.aeroExtraScope]">
                  <div class="flex items-center gap-2 mb-2.5">
                    <Icon :icon="memoryIcon" width="20" height="20" :class="[themeClasses.appPropsCardHeaderIcon]" />
                    <span class="text-[15px] font-semibold m-0" :class="[themeClasses.appPropsCardHeaderText]">{{ $t("RAM") }}</span>
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <span class="text-xl font-bold leading-none" :class="[themeClasses.appPropsInfoValue]">{{ app.memoryUsagePercent }}%</span>
                    <div class="w-full h-1.5 rounded-full overflow-hidden" :class="[themeClasses.appPropsProgressBarBg]">
                      <div class="h-full rounded-full transition-[width] duration-300" :style="{ width: `${app.memoryUsagePercent}%` }" :class="app.memoryUsagePercent >= 80 ? themeClasses.appPropsProgressBarFillCritical : app.memoryUsagePercent >= 50 ? themeClasses.appPropsProgressBarFillWarning : themeClasses.appPropsProgressBarFillNormal"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="rounded-[10px] px-3.5 py-3 transition-all duration-200" :class="[themeClasses.appPropsUsageCardBg, themeClasses.appPropsUsageCardBorder, themeClasses.appPropsUsageCardBgHover, themeClasses.appPropsUsageCardBorderHover, themeClasses.aeroExtraScope]">
                <div class="flex items-center gap-2 mb-2.5">
                  <Icon :icon="networkIcon" width="20" height="20" :class="[themeClasses.appPropsCardHeaderIcon]" />
                  <span class="text-[15px] font-semibold m-0" :class="[themeClasses.appPropsCardHeaderText]">{{ $t("Network") }}</span>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div class="flex items-center gap-2">
                    <Icon :icon="downloadIcon" width="20" height="20" :class="[themeClasses.appPropsCardHeaderIcon]" />
                    <span class="text-sm font-bold" :class="[themeClasses.appPropsInfoValue]">{{ formatBytes(app.networkRxBytes) }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <Icon :icon="uploadIcon" width="20" height="20" :class="[themeClasses.appPropsCardHeaderIcon]" />
                    <span class="text-sm font-bold" :class="[themeClasses.appPropsInfoValue]">{{ formatBytes(app.networkTxBytes) }}</span>
                  </div>
                </div>
              </div>

              <div class="rounded-[10px] px-3.5 py-3 transition-all duration-200" :class="[themeClasses.appPropsUsageCardBg, themeClasses.appPropsUsageCardBorder, themeClasses.appPropsUsageCardBgHover, themeClasses.appPropsUsageCardBorderHover, themeClasses.aeroExtraScope]">
                <div class="flex items-center gap-2 mb-2.5">
                  <Icon :icon="lightningIcon" width="20" height="20" :class="[themeClasses.appPropsCardHeaderIcon]" />
                  <span class="text-[15px] font-semibold m-0" :class="[themeClasses.appPropsCardHeaderText]">{{ $t("Quick Access") }}</span>
                </div>
                <div class="grid grid-cols-4 gap-2">
                  <button v-for="action in quickAccessActions" :key="action.label" :disabled="action.disabled" :title="$t(action.label)" class="flex flex-col items-center justify-center gap-1.5 px-1 py-2.5 rounded-lg border transition-colors duration-200 min-w-0 enabled:cursor-pointer disabled:opacity-40 disabled:cursor-default" :class="[themeClasses.appPropsActionListItemBg, themeClasses.appPropsActionListItemBorder, themeClasses.appPropsActionListItemText, !action.disabled && [themeClasses.appPropsActionListItemBgHover, themeClasses.appPropsActionListItemBorderHover]]" @click="action.action()">
                    <Icon :icon="action.icon" width="20" height="20" :class="[themeClasses.appPropsCardHeaderIcon]" />
                    <span class="text-[11px] font-medium leading-tight text-center max-w-full [overflow-wrap:anywhere]" :class="[themeClasses.appPropsInfoValue]">{{ $t(action.label) }}</span>
                  </button>
                </div>
              </div>

              <div v-if="defaultCredentials" class="rounded-[10px] px-3.5 py-3 transition-all duration-200" :class="[themeClasses.appPropsUsageCardBg, themeClasses.appPropsUsageCardBorder, themeClasses.appPropsUsageCardBgHover, themeClasses.appPropsUsageCardBorderHover, themeClasses.aeroExtraScope]">
                <div class="flex items-center gap-2 mb-2.5">
                  <Icon :icon="accountKeyIcon" width="20" height="20" :class="[themeClasses.appPropsCardHeaderIcon]" />
                  <span class="text-[15px] font-semibold m-0" :class="[themeClasses.appPropsCardHeaderText]">{{ $t("Default Credentials") }}</span>
                </div>
                <div class="flex flex-col">
                  <div class="flex justify-between items-center py-1.5" :class="[themeClasses.appPropsInfoRowBorder]">
                    <span class="text-xs font-medium flex-shrink-0" :class="[themeClasses.appPropsInfoLabel]">{{ $t("Username") }}</span>
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-mono font-medium" :class="[themeClasses.appPropsInfoValue]">{{ defaultCredentials.username }}</span>
                      <button @click="copyCredential(defaultCredentials.username, 'username')" class="p-0.5 rounded transition-colors duration-150 cursor-pointer" :class="[copiedField === 'username' ? themeClasses.installConfigDefaultCredsCopied : themeClasses.installConfigDefaultCredsCopy]">
                        <Icon :icon="copiedField === 'username' ? checkIcon : contentCopyIcon" width="14" height="14" />
                      </button>
                    </div>
                  </div>
                  <div class="flex justify-between items-center py-1.5 border-b-0">
                    <span class="text-xs font-medium flex-shrink-0" :class="[themeClasses.appPropsInfoLabel]">{{ $t("Password") }}</span>
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-mono font-medium" :class="[themeClasses.appPropsInfoValue]">{{ defaultCredentials.password }}</span>
                      <button @click="copyCredential(defaultCredentials.password, 'password')" class="p-0.5 rounded transition-colors duration-150 cursor-pointer" :class="[copiedField === 'password' ? themeClasses.installConfigDefaultCredsCopied : themeClasses.installConfigDefaultCredsCopy]">
                        <Icon :icon="copiedField === 'password' ? checkIcon : contentCopyIcon" width="14" height="14" />
                      </button>
                    </div>
                  </div>
                </div>
                <p class="text-[10px] mt-2 opacity-50" :class="[themeClasses.appPropsInfoLabel]">{{ $t("Please change these credentials after your first sign-in.") }}</p>
              </div>

              <div v-if="!isDependency" class="rounded-[10px] px-3.5 py-3 transition-all duration-200" :class="[themeClasses.appPropsUsageCardBg, themeClasses.appPropsUsageCardBorder, themeClasses.appPropsUsageCardBgHover, themeClasses.appPropsUsageCardBorderHover, themeClasses.aeroExtraScope]">
                <div class="flex items-center gap-2 mb-2.5">
                  <Icon :icon="webIcon" width="20" height="20" :class="[themeClasses.appPropsCardHeaderIcon]" />
                  <span class="text-[15px] font-semibold m-0" :class="[themeClasses.appPropsCardHeaderText]">{{ $t("Addresses") }}</span>
                </div>

                <div v-if="appAddresses.length > 0">
                  <span class="block text-[10px] uppercase tracking-wide opacity-50" :class="[themeClasses.appPropsInfoLabel]">{{ $t("HomeDock OS subdomain") }}</span>
                  <div v-for="address in appAddresses" :key="address.host" class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-3 py-0.5">
                    <span class="flex items-center gap-1.5 min-w-0">
                      <span v-if="address.current" class="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" :title="$t('You are browsing from this address')"></span>
                      <span class="text-xs font-medium break-all" :class="[themeClasses.appPropsInfoValue]">{{ address.host }}</span>
                    </span>
                    <div class="flex items-center gap-1 flex-shrink-0 -ml-1.5 sm:ml-0">
                      <button @click="copyCredential(address.host, `address-${address.host}`)" class="p-1.5 rounded-md transition-colors cursor-pointer" :class="[copiedField === `address-${address.host}` ? themeClasses.installConfigDefaultCredsCopied : themeClasses.appPropsInfoLink, copiedField === `address-${address.host}` ? '' : 'opacity-50 hover:opacity-100']" :title="$t('Copy')">
                        <Icon :icon="copiedField === `address-${address.host}` ? checkIcon : contentCopyIcon" width="14" height="14" />
                      </button>
                      <button v-if="address.current && appWindowsSupported" @click="openAddressInWindow" class="p-1.5 rounded-md transition-colors opacity-50 hover:opacity-100 cursor-pointer" :class="[themeClasses.appPropsInfoLink]" :title="$t('Open in a window')">
                        <Icon :icon="dockWindowIcon" width="14" height="14" />
                      </button>
                      <button @click="openAddressInTab(address.trail)" class="p-1.5 rounded-md transition-colors opacity-50 hover:opacity-100 cursor-pointer" :class="[themeClasses.appPropsInfoLink]" :title="$t('Open in a new tab')">
                        <Icon :icon="openIcon" width="14" height="14" />
                      </button>
                    </div>
                  </div>
                  <p class="text-[10px] mt-0.5 opacity-50 leading-snug" :class="[themeClasses.appPropsInfoLabel]">{{ $t("Served through HomeDock OS, it works with the app port closed to the outside.") }}</p>
                </div>

                <div v-if="directRoutes.length > 0">
                  <div class="h-px my-3 opacity-60" :class="[themeClasses.hubSeparator]"></div>
                  <span class="block text-[10px] uppercase tracking-wide opacity-50" :class="[themeClasses.appPropsInfoLabel]">{{ $t("Direct access") }}</span>
                  <p class="text-[10px] mt-0.5 mb-1 opacity-50 leading-snug" :class="[themeClasses.appPropsInfoLabel]">{{ $t("Legacy access modes, kept for when you need them.") }}</p>
                  <div v-for="route in directRoutes" :key="route.url" class="py-0.5">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-3">
                      <span class="text-xs font-medium break-all opacity-70" :class="[themeClasses.appPropsInfoValue]">{{ route.url }}</span>
                      <div class="flex items-center gap-1 flex-shrink-0 -ml-1.5 sm:ml-0">
                        <button @click="copyCredential(route.url, `direct-${route.url}`)" class="p-1.5 rounded-md transition-colors cursor-pointer" :class="[copiedField === `direct-${route.url}` ? themeClasses.installConfigDefaultCredsCopied : themeClasses.appPropsInfoLink, copiedField === `direct-${route.url}` ? '' : 'opacity-50 hover:opacity-100']" :title="$t('Copy')">
                          <Icon :icon="copiedField === `direct-${route.url}` ? checkIcon : contentCopyIcon" width="14" height="14" />
                        </button>
                        <button @click="openDirectRoute(route.url)" class="p-1.5 rounded-md transition-colors opacity-50 hover:opacity-100 cursor-pointer" :class="[themeClasses.appPropsInfoLink]" :title="$t('Open in a new tab')">
                          <Icon :icon="openIcon" width="14" height="14" />
                        </button>
                      </div>
                    </div>
                    <span class="block text-[10px] opacity-40 leading-snug" :class="[themeClasses.appPropsInfoLabel]">{{ route.note }}</span>
                  </div>
                </div>

                <div>
                  <div v-if="appAddresses.length > 0 || directRoutes.length > 0" class="h-px my-3 opacity-60" :class="[themeClasses.hubSeparator]"></div>
                  <span class="block text-[10px] uppercase tracking-wide opacity-50" :class="[themeClasses.appPropsInfoLabel]">{{ $t("Port routing") }}</span>
                  <p class="text-[10px] mt-0.5 mb-1.5 opacity-50 leading-snug" :class="[themeClasses.appPropsInfoLabel]">{{ $t("Which container port these addresses route to.") }}</p>
                  <PortRouter :key="app.ports.join(':')" :containerId="app.name" :initialPorts="app.ports.join(':')" :containerStatus="app.status" @update="handlePortsUpdate" />
                </div>
              </div>

              <div v-if="exposureAvailable" class="rounded-[10px] px-3.5 py-3 transition-all duration-200" :class="[themeClasses.appPropsUsageCardBg, themeClasses.appPropsUsageCardBorder, themeClasses.appPropsUsageCardBgHover, themeClasses.appPropsUsageCardBorderHover, themeClasses.aeroExtraScope]">
                <div class="flex items-center gap-2 mb-2.5">
                  <Icon :icon="exposureMode === 'direct' ? earthIcon : shieldLockIcon" width="20" height="20" :class="[exposureMode === 'direct' ? 'text-amber-500' : themeClasses.appPropsCardHeaderIcon]" />
                  <span class="text-[15px] font-semibold m-0" :class="[themeClasses.appPropsCardHeaderText]">{{ $t("Exposure") }}</span>
                </div>
                <Select class="w-full rounded-xl" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :value="exposureMode" @change="saveExposure" :popup-class-name="themeClasses.scopeSelector" :show-search="false">
                  <SelectOption :class="[themeClasses.scopeSelector]" value="gated">{{ $t("Behind your HomeDock OS session") }}</SelectOption>
                  <SelectOption :class="[themeClasses.scopeSelector]" value="direct">{{ $t("Open to anyone with the address") }}</SelectOption>
                </Select>
                <p class="text-[10px] mt-1.5 leading-snug" :class="[exposureMode === 'direct' ? 'text-amber-500 opacity-90' : `opacity-50 ${themeClasses.appPropsInfoLabel}`]">{{ exposureDescription }}</p>
              </div>

              <div v-if="!isDependency" class="rounded-[10px] px-3.5 py-3 transition-all duration-200" :class="[themeClasses.appPropsUsageCardBg, themeClasses.appPropsUsageCardBorder, themeClasses.appPropsUsageCardBgHover, themeClasses.appPropsUsageCardBorderHover, themeClasses.aeroExtraScope]">
                <div class="flex items-center gap-2 mb-2.5">
                  <Icon :icon="dockWindowIcon" width="20" height="20" :class="[themeClasses.appPropsCardHeaderIcon]" />
                  <span class="text-[15px] font-semibold m-0" :class="[themeClasses.appPropsCardHeaderText]">{{ $t("Opening behavior") }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <Select v-if="viewMode === 'port'" class="w-[104px] flex-shrink-0 rounded-xl" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :value="viewScheme" @change="saveViewScheme" :popup-class-name="themeClasses.scopeSelector" :show-search="false">
                    <SelectOption :class="[themeClasses.scopeSelector]" value="http">http://</SelectOption>
                    <SelectOption :class="[themeClasses.scopeSelector]" value="https">https://</SelectOption>
                  </Select>
                  <Select class="flex-1 min-w-0 rounded-xl" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :value="viewMode" @change="saveViewMode" :popup-class-name="themeClasses.scopeSelector" :show-search="false">
                    <SelectOption :class="[themeClasses.scopeSelector]" value="window"
                      >{{ $t("As a window") }}<span v-if="!appWindowsSupported" class="opacity-50"> — {{ $t("Not available here") }}</span></SelectOption
                    >
                    <SelectOption :class="[themeClasses.scopeSelector]" value="tab">{{ $t("In a new tab") }}</SelectOption>
                    <SelectOption :class="[themeClasses.scopeSelector]" value="port"
                      >{{ $t("Straight to its port") }}<span v-if="!directPortSupported" class="opacity-50"> — {{ $t("Not available here") }}</span></SelectOption
                    >
                  </Select>
                </div>
                <p class="text-[10px] mt-1.5 opacity-50 leading-snug" :class="[themeClasses.appPropsInfoLabel]">{{ viewModeDescription }}</p>
              </div>

              <div v-if="showConfiguration" class="rounded-[10px] px-3.5 py-3 transition-all duration-200" :class="[themeClasses.appPropsUsageCardBg, themeClasses.appPropsUsageCardBorder, themeClasses.appPropsUsageCardBgHover, themeClasses.appPropsUsageCardBorderHover, themeClasses.aeroExtraScope]">
                <div class="flex items-center gap-2 mb-2.5">
                  <Icon :icon="settingsIcon" width="20" height="20" :class="[themeClasses.appPropsCardHeaderIcon]" />
                  <span class="text-[15px] font-semibold m-0" :class="[themeClasses.appPropsCardHeaderText]">{{ $t("Configuration") }}</span>
                </div>
                <div class="flex flex-col">
                  <div v-if="app.HDGroup" class="flex justify-between items-start gap-4 py-1.5" :class="[themeClasses.appPropsInfoRowBorder]">
                    <span class="text-xs font-medium flex-shrink-0" :class="[themeClasses.appPropsInfoLabel]">{{ $t("Group") }}</span>
                    <span class="text-xs font-medium text-right break-all" :class="[themeClasses.appPropsInfoValue]">{{ app.HDGroup }}</span>
                  </div>
                  <div v-if="groupMembers.length > 0" class="flex justify-between items-start gap-4 py-1.5" :class="[themeClasses.appPropsInfoRowBorder]">
                    <span class="text-xs font-medium flex-shrink-0" :class="[themeClasses.appPropsInfoLabel]">{{ $t("Role") }}</span>
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border" :class="[isDependency ? themeClasses.appPropsBadgeDependency : themeClasses.appPropsBadgeMain]">{{ isDependency ? $t("Dependency") : $t("Main") }}</span>
                  </div>

                  <div v-if="groupMembers.length > 0" class="flex flex-col gap-1 pt-2">
                    <span class="text-xs font-medium" :class="[themeClasses.appPropsInfoLabel]">{{ $t("Related") }}</span>

                    <div v-for="member in groupMembers" :key="member.id" class="flex items-center gap-2 py-1 min-w-0">
                      <Icon v-if="member.name === app.name" :icon="checkIcon" width="14" height="14" class="flex-shrink-0" :class="[themeClasses.appPropsCardHeaderIcon]" />
                      <span v-else class="w-3.5 flex-shrink-0"></span>

                      <span class="relative flex-shrink-0">
                        <AppIconGraphic :image-src="member.image_path" :size="20" />
                        <Icon v-if="member.HDRole === 'dependency'" :icon="dependencyBadgeIcon" :class="[themeClasses.hubDependencyBadge]" class="absolute -top-1 -right-1 w-3 h-3 rounded-full p-px ring-1" />
                      </span>

                      <span class="text-xs truncate flex-1 min-w-0" :class="[themeClasses.appPropsInfoValue]">{{ member.name }}</span>

                      <span :class="[getStatusDotClasses(member.status)]" class="w-1.5 h-1.5 rounded-full flex-shrink-0"></span>

                      <button v-if="member.name !== app.name" @click="openMemberProperties(member)" :title="$t('Properties')" :class="[themeClasses.appPropsActionListItemBgHover, themeClasses.appPropsInfoLabel]" class="flex items-center justify-center w-6 h-6 rounded-md border-0 bg-transparent cursor-pointer flex-shrink-0">
                        <Icon :icon="infoIcon" width="14" height="14" />
                      </button>
                      <span v-else class="w-6 flex-shrink-0"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="activeTab === 'files'" key="files" class="flex flex-col gap-4">
              <div class="rounded-[10px] px-3.5 py-3 transition-all duration-200" :class="[themeClasses.appPropsUsageCardBg, themeClasses.appPropsUsageCardBorder, themeClasses.appPropsUsageCardBgHover, themeClasses.appPropsUsageCardBorderHover, themeClasses.aeroExtraScope]">
                <div class="flex items-center gap-2 mb-2.5">
                  <Icon :icon="cubeScanIcon" width="20" height="20" :class="[themeClasses.appPropsCardHeaderIcon]" />
                  <span class="text-[15px] font-semibold m-0" :class="[themeClasses.appPropsCardHeaderText]">{{ $t("App Drive Volumes") }}</span>
                </div>

                <div v-if="isLoadingMounts" class="flex items-center justify-center py-6">
                  <Icon :icon="loadingIcon" width="24" height="24" class="animate-spin" :class="[themeClasses.appPropsInfoLabel]" />
                </div>

                <div v-else-if="mountsError" class="flex flex-col items-center justify-center py-6 gap-2">
                  <Icon :icon="alertCircleIcon" width="32" height="32" :class="[themeClasses.appPropsInfoLabel]" class="opacity-50" />
                  <span class="text-xs" :class="[themeClasses.appPropsInfoLabel]">{{ mountsError }}</span>
                </div>

                <div v-else-if="mounts.length === 0" class="flex flex-col items-center justify-center py-6 gap-2">
                  <Icon :icon="folderIcon" width="32" height="32" :class="[themeClasses.appPropsInfoLabel]" class="opacity-50" />
                  <span class="text-xs" :class="[themeClasses.appPropsInfoLabel]">{{ $t("No accessible volumes found") }}</span>
                </div>

                <div v-else class="flex flex-col gap-2">
                  <button v-for="(mount, index) in mounts" :key="index" class="flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 text-left border hover:translate-x-1" :class="[themeClasses.appPropsActionListItemBg, themeClasses.appPropsActionListItemBorder, themeClasses.appPropsActionListItemText, themeClasses.appPropsActionListItemBgHover, themeClasses.appPropsActionListItemBorderHover]" @click="openAppDrive(index)">
                    <Icon :icon="mount.read_only ? lockIcon : folderOpenIcon" width="20" height="20" :class="[themeClasses.appPropsCardHeaderIcon]" />
                    <div class="flex-1 flex flex-col gap-0.5 min-w-0">
                      <span class="text-sm font-medium truncate" :class="[themeClasses.appPropsInfoValue]">{{ mount.container_path }}</span>
                      <span class="text-[10px] opacity-60 truncate" :class="[themeClasses.appPropsInfoLabel]">{{ mount.read_only ? $t("Read-only") : $t("Read/Write") }}</span>
                    </div>
                    <Icon :icon="chevronRightIcon" width="16" height="16" :class="[themeClasses.appPropsInfoLabel]" />
                  </button>
                </div>
              </div>
            </div>

            <div v-else-if="activeTab === 'actions'" key="actions" class="flex flex-col gap-4">
              <div class="flex flex-col gap-4">
                <h3 class="text-sm font-semibold uppercase tracking-wide m-0" :class="[themeClasses.appPropsSectionTitle]">{{ $t("Quick Actions") }}</h3>
                <div class="grid md:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] grid-cols-1 gap-3">
                  <button v-if="app.status === 'exited' || app.status === 'created'" class="flex items-center justify-center gap-2.5 px-6 py-4 rounded-[10px] text-sm font-medium cursor-pointer transition-all duration-200 border hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed" :class="[themeClasses.appPropsActionButtonPrimaryBg, themeClasses.appPropsActionButtonPrimaryBorder, themeClasses.appPropsActionButtonPrimaryText, themeClasses.appPropsActionButtonPrimaryBgHover, themeClasses.appPropsActionButtonPrimaryBorderHover, themeClasses.aeroExtraScope]" @click="handleStart" :disabled="isProcessing">
                    <Icon :icon="isStarting ? loadingIcon : playIcon" width="20" height="20" :class="{ 'animate-spin': isStarting }" />
                    <span>{{ $t("Start {target}", { target: targetNoun }) }}</span>
                  </button>

                  <button v-if="app.status === 'running'" class="flex items-center justify-center gap-2.5 px-6 py-4 rounded-[10px] text-sm font-medium cursor-pointer transition-all duration-200 border hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed" :class="[themeClasses.appPropsActionButtonDangerBg, themeClasses.appPropsActionButtonDangerBorder, themeClasses.appPropsActionButtonDangerText, themeClasses.appPropsActionButtonDangerBgHover, themeClasses.appPropsActionButtonDangerBorderHover, themeClasses.aeroExtraScope]" @click="handleStop" :disabled="isProcessing">
                    <Icon :icon="isStopping ? loadingIcon : stopIcon" width="20" height="20" :class="{ 'animate-spin': isStopping }" />
                    <span>{{ $t("Stop {target}", { target: targetNoun }) }}</span>
                  </button>

                  <button v-if="app.status === 'paused' && !isDependency" class="flex items-center justify-center gap-2.5 px-6 py-4 rounded-[10px] text-sm font-medium cursor-pointer transition-all duration-200 border hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed" :class="[themeClasses.appPropsActionButtonPrimaryBg, themeClasses.appPropsActionButtonPrimaryBorder, themeClasses.appPropsActionButtonPrimaryText, themeClasses.appPropsActionButtonPrimaryBgHover, themeClasses.appPropsActionButtonPrimaryBorderHover, themeClasses.aeroExtraScope]" @click="handleUnpause" :disabled="isProcessing">
                    <Icon :icon="isUnpausing ? loadingIcon : unpauseIcon" width="20" height="20" :class="{ 'animate-spin': isUnpausing }" />
                    <span>{{ $t("Unpause Application") }}</span>
                  </button>

                  <button v-if="app.status === 'running'" class="flex items-center justify-center gap-2.5 px-6 py-4 rounded-[10px] text-sm font-medium cursor-pointer transition-all duration-200 border hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed" :class="[themeClasses.appPropsActionButtonBg, themeClasses.appPropsActionButtonBorder, themeClasses.appPropsActionButtonText, themeClasses.appPropsActionButtonBgHover, themeClasses.appPropsActionButtonBorderHover, themeClasses.aeroExtraScope]" @click="handleRestart" :disabled="isProcessing">
                    <Icon :icon="isRestarting ? loadingIcon : restartIcon" width="20" height="20" :class="{ 'animate-spin': isRestarting }" />
                    <span>{{ $t("Restart {target}", { target: targetNoun }) }}</span>
                  </button>

                  <button v-if="app.status === 'running' && !isDependency" class="flex items-center justify-center gap-2.5 px-6 py-4 rounded-[10px] text-sm font-medium cursor-pointer transition-all duration-200 border hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed" :class="[themeClasses.appPropsActionButtonBg, themeClasses.appPropsActionButtonBorder, themeClasses.appPropsActionButtonText, themeClasses.appPropsActionButtonBgHover, themeClasses.appPropsActionButtonBorderHover, themeClasses.aeroExtraScope]" @click="handlePause" :disabled="isProcessing">
                    <Icon :icon="isPausing ? loadingIcon : pauseIcon" width="20" height="20" :class="{ 'animate-spin': isPausing }" />
                    <span>{{ $t("Pause Application") }}</span>
                  </button>

                  <button class="flex items-center justify-center gap-2.5 px-6 py-4 rounded-[10px] text-sm font-medium cursor-pointer transition-all duration-200 border hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] active:translate-y-0" :class="[themeClasses.appPropsActionButtonBg, themeClasses.appPropsActionButtonBorder, themeClasses.appPropsActionButtonText, themeClasses.appPropsActionButtonBgHover, themeClasses.appPropsActionButtonBorderHover, themeClasses.aeroExtraScope]" @click="openInControlHub">
                    <Icon :icon="nutIcon" width="20" height="20" />
                    <span>{{ $t("View in Control Hub") }}</span>
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <div v-else class="flex flex-col items-center justify-center h-full gap-4 px-6 py-12">
        <Icon :icon="alertIcon" width="64" height="64" class="opacity-30" />
        <h3 class="text-xl font-semibold m-0" :class="[themeClasses.notTextUp]">{{ $t("No Data Available") }}</h3>
        <p class="text-sm opacity-60 m-0" :class="[themeClasses.notTextDown]">{{ $t("Application data could not be loaded") }}</p>
      </div>
    </div>

    <StatusBar v-if="app" :icon="infoIcon" :message="$t('App Properties')" :info="`${$t('Viewing')} ${app.display_name || app.name}`" :showHelp="true">
      <template #help>
        <div class="space-y-2.5 max-w-sm">
          <div class="flex items-center gap-2">
            <StatusBarHelpIcon :icon="infoIcon" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">{{ $t("Properties") }}</h4>
          </div>

          <div :class="['text-[10px] md:text-xs md:leading-4 space-y-2 leading-relaxed', themeClasses.statusBarInfo]">
            <p>{{ $t("View detailed information about your application including real-time CPU and RAM usage, network traffic (sent/received data), detected port network configuration with editable ports, and grouped applications relationships. The General tab displays resource metrics and configuration details, while the Actions tab provides quick controls to start, stop, restart, pause, or unpause your application.") }}</p>
          </div>
        </div>
      </template>
    </StatusBar>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";

import { Select } from "ant-design-vue";

const SelectOption = Select.Option;
import { ref, computed, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useResponsive } from "../__Composables__/useResponsive";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useDesktopStore } from "../__Stores__/desktopStore";
import { subdomainTrail, requestAppToken, buildAppSubdomainUrl, hostSupportsAppWindows, appWindowsAvailable, isLocalNetworkHost, isAddressLiteral, isMulticastTrail, buildDirectPortUrl } from "../__Composables__/useAppSubdomain";
import type { DockerApp } from "../__Stores__/desktopStore";
import { useWindowStore } from "../__Stores__/windowStore";
import { useAppQuickActions } from "../__Composables__/useAppQuickActions";

import { Icon } from "@iconify/vue";
import playIcon from "@iconify-icons/mdi/play";
import stopIcon from "@iconify-icons/mdi/stop";
import restartIcon from "@iconify-icons/mdi/restart";
import pauseIcon from "@iconify-icons/mdi/pause";
import unpauseIcon from "@iconify-icons/mdi/play-pause";
import openIcon from "@iconify-icons/mdi/open-in-new";
import alertIcon from "@iconify-icons/mdi/alert-circle-outline";
import infoIcon from "@iconify-icons/mdi/information-outline";
import cogIcon from "@iconify-icons/mdi/cog-outline";
import cpuIcon from "@iconify-icons/mdi/cpu-64-bit";
import memoryIcon from "@iconify-icons/mdi/memory";
import networkIcon from "@iconify-icons/mdi/network-outline";
import settingsIcon from "@iconify-icons/mdi/tune";
import loadingIcon from "@iconify-icons/mdi/loading";
import chevronRightIcon from "@iconify-icons/mdi/chevron-right";
import downloadIcon from "@iconify-icons/mdi/download";
import uploadIcon from "@iconify-icons/mdi/upload";
import folderIcon from "@iconify-icons/mdi/folder";
import lockIcon from "@iconify-icons/mdi/lock";
import folderOpenIcon from "@iconify-icons/mdi/folder-open";
import alertCircleIcon from "@iconify-icons/mdi/alert-circle";
import cubeScanIcon from "@iconify-icons/mdi/cube-scan";
import dependencyOffIcon from "@iconify-icons/mdi/cube-off-outline";
import dependencyBadgeIcon from "@iconify-icons/mdi/cube-outline";
import nutIcon from "@iconify-icons/mdi/nut";
import lightningIcon from "@iconify-icons/mdi/lightning-bolt-outline";
import accountKeyIcon from "@iconify-icons/mdi/account-key";
import contentCopyIcon from "@iconify-icons/mdi/content-copy";
import checkIcon from "@iconify-icons/mdi/check";
import webIcon from "@iconify-icons/mdi/web";
import dockWindowIcon from "@iconify-icons/mdi/dock-window";
import shieldLockIcon from "@iconify-icons/mdi/shield-lock-outline";
import earthIcon from "@iconify-icons/mdi/earth";

import AppIconGraphic from "../__Components__/AppIconGraphic.vue";
import PortRouter from "../__Components__/PortRouter.vue";
import StatusBar from "../__Components__/StatusBar.vue";
import StatusBarHelpIcon from "../__Components__/StatusBarHelpIcon.vue";

import { useAppStore } from "../__Stores__/useAppStore";
import { startContainer, stopContainer, restartContainer, pauseContainer, unpauseContainer } from "../__Services__/DockerActions";

interface Props {
  appId?: string;
  containerName?: string;
  data?: {
    appId?: string;
    containerName?: string;
  };
}

const props = defineProps<Props>();

const { t } = useI18n();
const { themeClasses } = useTheme();
const { isMobile } = useResponsive();
const desktopStore = useDesktopStore();
const appStore = useAppStore();

const csrfToken = useCsrfToken();

const activeTab = ref("general");

const isProcessing = ref(false);

const isStarting = ref(false);
const isStopping = ref(false);
const isRestarting = ref(false);
const isPausing = ref(false);
const isUnpausing = ref(false);

interface MountInfo {
  host_path: string;
  container_path: string;
  type: string;
  read_only: boolean;
}

const mounts = ref<MountInfo[]>([]);
const isLoadingMounts = ref(false);
const mountsError = ref<string | null>(null);

const windowStore = useWindowStore();
const { quickActionsFor } = useAppQuickActions();

const app = computed<DockerApp | null>(() => {
  const appId = props.appId || props.containerName || props.data?.appId || props.data?.containerName;

  if (!appId) {
    return null;
  }

  return desktopStore.dockerApps.find((a) => a.id === appId || a.name === appId) || null;
});

const groupContainers = computed<DockerApp[]>(() => {
  if (!app.value?.HDGroup) return [];
  return desktopStore.dockerApps.filter((a) => a.HDGroup === app.value?.HDGroup && a.id !== app.value?.id);
});

const isDependency = computed(() => app.value?.HDRole === "dependency");

const displayTitle = computed(() => {
  const current = app.value;
  if (!current) return "";

  return current.HDRole === "dependency" ? current.name : current.display_name || current.name;
});
const targetNoun = computed(() => (isDependency.value ? t("Dependency") : t("Application")));

const groupMembers = computed<DockerApp[]>(() => {
  const group = app.value?.HDGroup;
  if (!group) return [];

  return desktopStore.dockerApps
    .filter((candidate) => candidate.HDGroup === group)
    .slice()
    .sort((a, b) => {
      const aDependency = a.HDRole === "dependency" ? 1 : 0;
      const bDependency = b.HDRole === "dependency" ? 1 : 0;
      if (aDependency !== bDependency) return aDependency - bDependency;
      return a.name.localeCompare(b.name);
    });
});

const groupMain = computed<DockerApp | null>(() => groupMembers.value.find((member) => member.HDRole !== "dependency") || null);

const quickAccessActions = computed(() => {
  if (!app.value) return [];
  const parent = isDependency.value ? groupMain.value : null;
  return quickActionsFor(app.value, { parent }).actions ?? [];
});

function openMemberProperties(member: DockerApp) {
  if (member.name === app.value?.name) return;

  windowStore.openUniqueWindow("properties", member.id, {
    title: `${member.HDRole === "dependency" ? member.name : member.display_name || member.name} - ${t("Properties")}`,
    data: { appId: member.id },
  });
}

const stoppedDependencies = computed<DockerApp[]>(() => {
  if (!app.value || app.value.HDRole === "dependency") return [];
  return groupContainers.value.filter((a) => a.HDRole === "dependency" && a.status !== "running");
});

const showConfiguration = computed<boolean>(() => {
  return !!(app.value?.HDGroup || app.value?.HDRole || groupContainers.value.length > 0);
});

const defaultCredentials = computed(() => {
  if (!app.value?.name) return null;
  const storeApp = appStore.apps.find((a) => a.name === app.value!.name);
  return storeApp?.default_credentials || null;
});

const copiedField = ref<string | null>(null);

function copyCredential(value: string, field: string) {
  navigator.clipboard.writeText(value);
  copiedField.value = field;
  setTimeout(() => {
    copiedField.value = null;
  }, 1500);
}

function getContainerClasses(app: DockerApp): string {
  const statusClasses: Record<string, string> = {
    running: "",
    paused: "brightness-75 opacity-80",
    exited: "grayscale brightness-50 opacity-60",
    created: "brightness-75 sepia opacity-70",
  };

  return statusClasses[app.status] || "";
}

function getStatusClasses(statusColor: string): string[] {
  const colorMap: Record<string, string[]> = {
    success: [themeClasses.value.appPropsStatusSuccessBg, themeClasses.value.appPropsStatusSuccessBorder, themeClasses.value.appPropsStatusSuccessText],
    warning: [themeClasses.value.appPropsStatusWarningBg, themeClasses.value.appPropsStatusWarningBorder, themeClasses.value.appPropsStatusWarningText],
    danger: [themeClasses.value.appPropsStatusDangerBg, themeClasses.value.appPropsStatusDangerBorder, themeClasses.value.appPropsStatusDangerText],
    info: [themeClasses.value.appPropsStatusInfoBg, themeClasses.value.appPropsStatusInfoBorder, themeClasses.value.appPropsStatusInfoText],
    primary: [themeClasses.value.appPropsStatusPrimaryBg, themeClasses.value.appPropsStatusPrimaryBorder, themeClasses.value.appPropsStatusPrimaryText],
    dark: [themeClasses.value.appPropsStatusDarkBg, themeClasses.value.appPropsStatusDarkBorder, themeClasses.value.appPropsStatusDarkText],
  };

  return colorMap[statusColor] || colorMap.dark;
}

function getStatusDotClasses(status: string): string {
  const dotMap: Record<string, string> = {
    running: themeClasses.value.appPropsDotSuccess,
    paused: themeClasses.value.appPropsDotWarning,
    exited: themeClasses.value.appPropsDotDanger,
    created: themeClasses.value.appPropsDotInfo,
  };

  return dotMap[status] || themeClasses.value.appPropsDotDark;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`;
}

function handlePortsUpdate(newPorts: string) {
  if (!app.value) return;

  const portsArray = newPorts.split(":");
  desktopStore.updateDockerApp(app.value.id, {
    ports: portsArray,
    service_url: portsArray.length > 0 && portsArray[0] !== "disabled" && portsArray[0] !== "hostmode" ? `/app/${portsArray[0]}` : null,
  });
}

async function handleStart() {
  if (!app.value || isProcessing.value) return;
  isProcessing.value = true;
  isStarting.value = true;
  try {
    await startContainer(app.value, csrfToken.value, themeClasses.value.scopeSelector);
  } finally {
    isStarting.value = false;
    isProcessing.value = false;
  }
}

async function handleStop() {
  if (!app.value || isProcessing.value) return;
  isProcessing.value = true;
  isStopping.value = true;
  try {
    await stopContainer(app.value, csrfToken.value, themeClasses.value.scopeSelector);
  } finally {
    isStopping.value = false;
    isProcessing.value = false;
  }
}

async function handleRestart() {
  if (!app.value || isProcessing.value) return;
  isProcessing.value = true;
  isRestarting.value = true;
  try {
    await restartContainer(app.value, csrfToken.value, themeClasses.value.scopeSelector);
  } finally {
    isRestarting.value = false;
    isProcessing.value = false;
  }
}

async function handlePause() {
  if (!app.value || isProcessing.value) return;
  isProcessing.value = true;
  isPausing.value = true;
  try {
    await pauseContainer(app.value, csrfToken.value, themeClasses.value.scopeSelector);
  } finally {
    isPausing.value = false;
    isProcessing.value = false;
  }
}

async function handleUnpause() {
  if (!app.value || isProcessing.value) return;
  isProcessing.value = true;
  isUnpausing.value = true;
  try {
    await unpauseContainer(app.value, csrfToken.value, themeClasses.value.scopeSelector);
  } finally {
    isUnpausing.value = false;
    isProcessing.value = false;
  }
}

const appAddresses = computed(() => {
  if (!app.value?.service_url) return [];

  const port = window.location.port ? `:${window.location.port}` : "";
  const entries: { host: string; trail: string; current: boolean }[] = [];

  const slug = app.value.slug;
  const current = subdomainTrail();

  // HDOS00104
  if (slug && current && hostSupportsAppWindows()) {
    entries.push({ host: `${slug}.${current}${port}`, trail: current, current: true });
  }

  return entries;
});

// HDOS00115
const directRoutes = computed(() => {
  const routes: { url: string; note: string }[] = [];

  if (!app.value) return routes;

  if (app.value.service_url) {
    routes.push({ url: `${window.location.origin}${app.value.service_url}`, note: t("Goes through HomeDock OS and needs your session.") });
  }

  const port = app.value.ports?.find((value: string) => value && value !== "disabled" && value !== "hostmode");

  // HDOS00115
  if (port && directPortSupported.value) {
    routes.push({ url: buildDirectPortUrl(port, viewScheme.value), note: t("Reaches the app port directly.") });
  }

  return routes;
});

// HDOS00119
function openAddressInWindow() {
  if (app.value) desktopStore.openDockerWindow(app.value);
}

async function openAddressInTab(trail: string) {
  if (!app.value) return;

  const handoff = await requestAppToken(app.value.name, csrfToken.value);
  if (!handoff) return;

  window.open(buildAppSubdomainUrl(handoff, "", trail), "_blank", "noopener,noreferrer");
}

const viewMode = computed(() => (app.value ? (desktopStore.appViewModes[app.value.name] ?? "window") : "window"));

// HDOS00103
const appWindowsSupported = computed(() => appWindowsAvailable(desktopStore.certificateBlocksAppWindows));

// HDOS00115
const directPortSupported = computed(() => isLocalNetworkHost());

// HDOS00116
const onScreenRequirement = computed(() => {
  if (isAddressLiteral()) return t("Open HomeDock OS by name instead of by IP address and OnScreen Apps come back.");
  if (isMulticastTrail()) return t("OnScreen Apps cannot work on {host}. Set your own domain in Settings to get them back.", { host: window.location.hostname });
  if (!hostSupportsAppWindows()) return t("OnScreen Apps need an address with a dot in it. Open HomeDock OS at homedock.localhost on this machine.");

  if (desktopStore.subdomainCertificate.ssl) {
    if (desktopStore.subdomainCertificate.selfSigned) return t("The certificate is self-signed, and a window cannot ask you to accept it. Issue a trusted one in Settings.");
    if (!desktopStore.subdomainCertificate.coversApps) return t("The certificate does not cover {record}. Reissue it in Settings and OnScreen Apps come back.", { record: `*.${window.location.hostname}` });
  }

  return null;
});

const viewModeDescription = computed(() => {
  if (onScreenRequirement.value) return onScreenRequirement.value;

  if (viewMode.value === "tab") return t("Some apps refuse to run inside a frame. This one opens outside the desktop. Must open the port on your router for remote access.");
  if (viewMode.value === "port") {
    if (!directPortSupported.value) return t("The container port is only reachable from the same network as HomeDock OS, not from {host}.", { host: window.location.hostname });

    return t("Goes to the container port, skipping HomeDock OS and its session check. Must open the port on your router for remote access.");
  }

  // HDOS00116
  if (window.location.protocol === "http:") return t("Opens as an OnScreen App inside HomeDock OS, like the rest.");

  return t("Opens as an OnScreen App inside HomeDock OS, like the rest. Must have a browser-trusted HTTPS certificate.");
});

async function saveViewMode(mode: unknown) {
  if (!app.value) return;

  const value = String(mode);
  const previous = desktopStore.appViewModes[app.value.name];

  desktopStore.appViewModes[app.value.name] = value as "window" | "tab" | "port";

  try {
    await axios.post("/api/app-view-mode", { container: app.value.name, mode: value }, { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });
  } catch {
    if (previous) desktopStore.appViewModes[app.value.name] = previous;
    else delete desktopStore.appViewModes[app.value.name];
  }
}

// HDOS00118
const viewScheme = computed(() => (app.value ? (desktopStore.appViewSchemes[app.value.name] ?? "http") : "http"));

async function saveViewScheme(scheme: unknown) {
  if (!app.value) return;

  const value = String(scheme);
  const previous = desktopStore.appViewSchemes[app.value.name];

  desktopStore.appViewSchemes[app.value.name] = value as "http" | "https";

  try {
    await axios.post("/api/app-view-mode", { container: app.value.name, mode: viewMode.value, scheme: value }, { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });
  } catch {
    if (previous) desktopStore.appViewSchemes[app.value.name] = previous;
    else delete desktopStore.appViewSchemes[app.value.name];
  }
}

// HDOS00112
const exposureAvailable = ref(false);
const exposureModes = ref<Record<string, string>>({});

const exposureMode = computed(() => exposureModes.value[app.value?.slug ?? ""] ?? "gated");

const exposureAddress = computed(() => {
  const trail = subdomainTrail();

  return app.value?.slug && trail ? `${app.value.slug}.${trail}` : "";
});

const exposureDescription = computed(() => {
  if (exposureMode.value === "direct") return t("Anyone on the internet who knows the address {address} can reach the app. Its own login is the only thing left guarding it, so be careful with this one.", { address: exposureAddress.value });

  return t("Only someone already signed in to HomeDock OS can reach the app via {address}. Phone apps like Jellyfin or Nextcloud only know how to log in to the app itself, never to HomeDock OS, so for those you need the other option.", { address: exposureAddress.value });
});

async function loadExposure() {
  try {
    const { data } = await axios.get("/api/app-exposure", { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });

    exposureAvailable.value = Boolean(data?.available);
    exposureModes.value = data?.modes ?? {};
  } catch {
    exposureAvailable.value = false;
  }
}

async function saveExposure(mode: unknown) {
  if (!app.value) return;

  const value = String(mode);
  const slug = app.value.slug ?? "";
  const previous = exposureModes.value[slug];

  if (!slug) return;

  exposureModes.value = { ...exposureModes.value, [slug]: value };

  try {
    await axios.post("/api/app-exposure", { container: app.value.name, mode: value }, { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });
  } catch {
    exposureModes.value = { ...exposureModes.value, [slug]: previous ?? "gated" };
  }
}

function openDirectRoute(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function openInControlHub() {
  if (!app.value) return;

  windowStore.openFileInApp("controlhub", { data: { selectedApp: app.value.name } });
}

function sanitizeContainerName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "").substring(0, 128);
}

async function loadMounts() {
  if (!app.value) return;

  const sanitizedName = sanitizeContainerName(app.value.name);
  if (!sanitizedName) return;

  isLoadingMounts.value = true;
  mountsError.value = null;

  try {
    const response = await axios.get("/api/appdrive/mounts", {
      params: { container: sanitizedName },
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });
    mounts.value = response.data.mounts || [];
  } catch (error: any) {
    mountsError.value = t(error.response?.data?.error || "Failed to load mounts");
    mounts.value = [];
  } finally {
    isLoadingMounts.value = false;
  }
}

function openAppDrive(mountIndex: number) {
  if (!app.value) return;

  const sanitizedName = sanitizeContainerName(app.value.name);
  if (!sanitizedName) return;

  if (mountIndex < 0 || mountIndex >= mounts.value.length) return;

  windowStore.openFileInApp("fileexplorer", {
    title: `File Explorer - ${app.value.display_name || app.value.name}`,
    data: {
      initialLocation: "appdrive",
      initialContainer: sanitizedName,
      initialMountIndex: mountIndex,
    },
  });
}

watch(activeTab, (newTab) => {
  if (newTab === "files" && mounts.value.length === 0 && !isLoadingMounts.value) {
    loadMounts();
  }
});

watch(app, () => {
  if (activeTab.value === "files") {
    loadMounts();
  }
});

onMounted(() => {
  loadExposure();

  if (appStore.apps.length === 0) {
    appStore.loadApps(csrfToken.value);
  }

  desktopStore.loadAppViewModes(csrfToken.value);
  desktopStore.loadCertificateTrust(csrfToken.value);
});

watch(
  () => app.value?.recently_updated,
  (unseen) => {
    if (unseen && app.value) desktopStore.markUpdateSeen(app.value);
  },
  { immediate: true },
);
</script>

<style scoped>
/* Hero Section */
.hero-section {
  position: relative;
  overflow: hidden;
}

.hero-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.hero-section .hero-watermark {
  position: absolute;
  top: 50%;
  right: -36px;
  transform: translateY(-50%) rotate(-33deg);
  pointer-events: none;
}

/* Pulse animation */
@keyframes pulse-success {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Tab transition animations - Cross-Fade */
.tab-fade-enter-active {
  transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-fade-leave-active {
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.6, 1);
}

.tab-fade-enter-from,
.tab-fade-leave-to {
  opacity: 0;
}
</style>
