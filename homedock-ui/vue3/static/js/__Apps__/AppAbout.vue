<!-- homedock-ui/vue3/static/js/__Apps__/AppAbout.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="app-about flex flex-col h-full overflow-hidden">
    <div class="flex-1 overflow-auto px-8 py-12">
      <div class="max-w-2xl mx-auto space-y-6">
        <div class="text-center mb-8">
          <div class="flex justify-center mb-4">
            <LogoIcon class="h-24 w-24 p-4 rounded-3xl ring-1 shadow-xl" :class="[themeClasses.aboutLogo]" />
          </div>
          <h1 :class="['text-3xl font-bold', themeClasses.aboutTitle]">HomeDock OS</h1>
          <p :class="['text-lg mt-2', themeClasses.aboutSubtitle]">Your Personal Cloud Operating System</p>
          <p :class="['text-[10px] opacity-40', themeClasses.aboutSubtitle]">Private, secure and universally multiplatform</p>
        </div>

        <div :class="['rounded-lg p-6 space-y-3', themeClasses.aboutCard]">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Icon class="w-4 h-4 max-w-4 max-h-4 min-w-4 min-h-4" :icon="tagIcon" :class="[themeClasses.aboutIcon]" />
              <span :class="['font-semibold text-xs', themeClasses.aboutLabel]">Version</span>
            </div>
            <span :class="['font-mono text-xs', themeClasses.aboutValue]">{{ version }}</span>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Icon class="w-4 h-4 max-w-4 max-h-4 min-w-4 min-h-4" :icon="copyrightIcon" :class="[themeClasses.aboutIcon]" />
              <span :class="['font-semibold text-xs', themeClasses.aboutLabel]">Copyright</span>
            </div>
            <span :class="['text-xs', themeClasses.aboutValue]">Banshee Technologies S.L.</span>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Icon class="w-4 h-4 max-w-4 max-h-4 min-w-4 min-h-4" :icon="licenseIcon" :class="[themeClasses.aboutIcon]" size="20px" />
              <span :class="['font-semibold text-xs', themeClasses.aboutLabel]">License</span>
            </div>
            <span :class="['text-xs', themeClasses.aboutValue]">PolyForm Strict License 1.0.0</span>
          </div>
        </div>

        <div :class="['rounded-lg p-6 space-y-3', themeClasses.aboutCard]">
          <h3 :class="['text-base font-semibold mb-3', themeClasses.aboutSectionTitle]">Resources</h3>

          <a href="https://www.homedock.cloud" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-2 px-3 py-2 rounded-xl transition-colors', themeClasses.aboutLink]">
            <Icon :icon="webIcon" size="18px" />
            <span class="flex-1">Official Website</span>
            <Icon :icon="openInNewIcon" size="16px" />
          </a>

          <a href="https://docs.homedock.cloud/" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-2 px-3 py-2 rounded-xl transition-colors', themeClasses.aboutLink]">
            <Icon :icon="docsIcon" size="18px" />
            <span class="flex-1">Documentation</span>
            <Icon :icon="openInNewIcon" size="16px" />
          </a>

          <a href="https://github.com/BansheeTech/HomeDockOS/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-2 px-3 py-2 rounded-xl transition-colors', themeClasses.aboutLink]">
            <Icon :icon="historyIcon" size="18px" />
            <span class="flex-1">Changelog</span>
            <Icon :icon="openInNewIcon" size="16px" />
          </a>

          <a href="https://github.com/BansheeTech/HomeDockOS" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-2 px-3 py-2 rounded-xl transition-colors', themeClasses.aboutLink]">
            <Icon :icon="githubIcon" size="18px" />
            <span class="flex-1">GitHub Repository</span>
            <Icon :icon="openInNewIcon" size="16px" />
          </a>

          <a href="https://github.com/BansheeTech/HomeDockOS/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-2 px-3 py-2 rounded-xl transition-colors', themeClasses.aboutLink]">
            <Icon :icon="accountGroupIcon" size="18px" />
            <span class="flex-1">Contributing</span>
            <Icon :icon="openInNewIcon" size="16px" />
          </a>

          <a href="https://github.com/BansheeTech/HomeDockOS/blob/main/LICENSE.md" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-2 px-3 py-2 rounded-xl transition-colors', themeClasses.aboutLink]">
            <Icon :icon="fileDocumentIcon" size="18px" />
            <span class="flex-1">License Details</span>
            <Icon :icon="openInNewIcon" size="16px" />
          </a>
        </div>

        <div :class="['rounded-lg p-6 space-y-3', themeClasses.aboutCard]">
          <div class="flex items-center gap-2 mb-2">
            <Icon :icon="shareIcon" :class="[themeClasses.aboutIcon]" size="20px" />
            <p :class="['text-base font-semibold', themeClasses.aboutDescription]">Help us spread the word!</p>
          </div>
          <p :class="['text-sm leading-relaxed', themeClasses.aboutDescription]">Loving HomeDock OS? Help us grow by sharing it with your friends, colleagues, and the community. Every star, share, and recommendation helps us build a better future for personal cloud computing.</p>

          <div class="flex flex-wrap gap-2 mt-3">
            <a href="https://github.com/BansheeTech/HomeDockOS" target="_blank" rel="noopener noreferrer" :class="['inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all', themeClasses.aboutShareButton]">
              <Icon :icon="starIcon" size="16px" />
              <span>Star on GitHub</span>
            </a>
            <a href="https://twitter.com/intent/tweet?text=Check%20out%20HomeDock%20OS%20-%20Your%20Personal%20Cloud%20Operating%20System!&url=https://github.com/BansheeTech/HomeDockOS" target="_blank" rel="noopener noreferrer" :class="['inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all', themeClasses.aboutShareButton]">
              <Icon :icon="twitterIcon" size="16px" />
              <span>Share on X</span>
            </a>
            <a href="https://discord.gg/Zj3JCYsRWw" target="_blank" rel="noopener noreferrer" :class="['inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all', themeClasses.aboutShareButton]">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.1.1 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.1 16.1 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02M8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12m6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12" />
              </svg>
              <span>Join Discord</span>
            </a>
          </div>
        </div>

        <div :class="['rounded-lg p-6 space-y-3', themeClasses.aboutCard]">
          <div class="flex items-center gap-2 mb-2">
            <Icon :icon="donateIcon" :class="[themeClasses.aboutIcon]" size="20px" />
            <p :class="['text-base font-semibold', themeClasses.aboutDescription]">Support HomeDock OS</p>
          </div>
          <p :class="['text-sm leading-relaxed', themeClasses.aboutDescription]">HomeDock OS is made with care by a self-funded small team that loves building and shaping the future of the personal cloud. We don't accept donations, but by trying HomeDock OS Cloud Instances you're helping us create the next generation of features and experiences everyone deserves.</p>
          <a href="https://dashboard.homedock.cloud/" target="_blank" rel="noopener noreferrer" :class="['inline-block mt-4 px-4 py-2 rounded-lg font-semibold transition-colors', themeClasses.aboutDonateButton]"> Try Cloud Instances </a>
        </div>

        <div :class="['rounded-lg p-6 space-y-3', themeClasses.aboutCard]">
          <div class="flex items-center gap-2 mb-2">
            <Icon :icon="GUIIcon" :class="[themeClasses.aboutIcon]" size="20px" />
            <h3 :class="['text-base font-semibold', themeClasses.aboutLabel]">Prism Window Manager</h3>
          </div>
          <p :class="['text-sm leading-relaxed', themeClasses.aboutDescription]">HomeDock OS is a powerful, multiplatform and user-friendly Cloud OS designed to simplify application and cloud/home server management. With our brand new <Icon :icon="GUIIcon" class="inline-flex mb-1" :class="[themeClasses.aboutIcon]" size="20px" /> <span class="font-semibold underline">Prism Window Manager</span>, it brings a true desktop-like experience to every device, with intuitive multitasking, fluid window control, and a seamless interface that makes cloud management feel like your own private, secure desktop. We wanted to move faster and create a more unified experience across platforms, so here it is. The future is bright, and if it's running in your own hardware... It shouldn't require a Plus+ one-time fee, period.</p>
        </div>

        <div :class="['rounded-lg p-6 space-y-4', themeClasses.aboutCard]">
          <div class="flex items-center gap-2 mb-2">
            <Icon :icon="codeIcon" :class="[themeClasses.aboutIcon]" size="20px" />
            <h3 :class="['text-base font-semibold', themeClasses.aboutLabel]">Open Source Licenses</h3>
          </div>
          <p :class="['text-xs leading-relaxed', themeClasses.aboutDescription]">HomeDock OS is built with the following open source software. Click on any library to view its license.</p>

          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <Icon :icon="vueIcon" :class="[themeClasses.aboutIcon]" size="14px" />
              <span :class="['text-xs font-semibold uppercase tracking-wide opacity-60', themeClasses.aboutDescription]">Frontend</span>
            </div>
            <div class="grid grid-cols-2 gap-1">
              <a href="https://github.com/vuejs/core/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>Vue 3</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
              <a href="https://github.com/vitejs/vite/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>Vite</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
              <a href="https://github.com/vuejs/router/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>Vue Router</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
              <a href="https://github.com/vuejs/pinia/blob/v2/LICENSE" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>Pinia</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
              <a href="https://github.com/microsoft/TypeScript/blob/main/LICENSE.txt" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>TypeScript</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
              <a href="https://github.com/tailwindlabs/tailwindcss/blob/master/LICENSE" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>TailwindCSS</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
              <a href="https://github.com/postcss/postcss/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>PostCSS</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
              <a href="https://github.com/postcss/autoprefixer/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>Autoprefixer</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
              <a href="https://github.com/vueComponent/ant-design-vue/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>Ant Design Vue</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
              <a href="https://github.com/iconify/iconify/blob/main/license.txt" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>Iconify</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
              <a href="https://github.com/axios/axios/blob/v1.x/LICENSE" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>Axios</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
              <a href="https://github.com/chartjs/Chart.js/blob/master/LICENSE.md" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>Chart.js</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
              <a href="https://github.com/iamkun/dayjs/blob/dev/LICENSE" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>Day.js</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
              <a href="https://github.com/digitalbazaar/forge/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>Node Forge</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
              <a href="https://github.com/vueuse/head/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>VueUse Head</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
              <a href="https://github.com/micku7zu/vanilla-tilt.js/blob/master/LICENSE" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>Vanilla Tilt</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
            </div>
          </div>

          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <Icon :icon="pythonIcon" :class="[themeClasses.aboutIcon]" size="14px" />
              <span :class="['text-xs font-semibold uppercase tracking-wide opacity-60', themeClasses.aboutDescription]">Backend</span>
            </div>
            <div class="grid grid-cols-2 gap-1">
              <a href="https://github.com/pallets/flask/blob/main/LICENSE.txt" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>Flask</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
              <a href="https://github.com/maxcountryman/flask-login/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>Flask-Login</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
              <a href="https://github.com/alisaifee/flask-limiter/blob/master/LICENSE.txt" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>Flask-Limiter</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
              <a href="https://github.com/colour-science/flask-compress/blob/master/LICENSE.txt" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>Flask-Compress</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
              <a href="https://github.com/docker/docker-py/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>Docker SDK</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
              <a href="https://github.com/pgjones/hypercorn/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>Hypercorn</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
              <a href="https://github.com/pallets/werkzeug/blob/main/LICENSE.txt" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>Werkzeug</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
              <a href="https://github.com/pyca/cryptography/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>Cryptography</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
              <a href="https://github.com/pyca/bcrypt/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>Bcrypt</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
              <a href="https://github.com/yaml/pyyaml/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>PyYAML</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
              <a href="https://github.com/psf/requests/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>Requests</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
              <a href="https://github.com/giampaolo/psutil/blob/master/LICENSE" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>Psutil</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
              <a href="https://github.com/python-zeroconf/python-zeroconf/blob/master/COPYING" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>Zeroconf</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
              <a href="https://github.com/urllib3/urllib3/blob/main/LICENSE.txt" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>urllib3</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
              <a href="https://github.com/cython/cython/blob/master/LICENSE.txt" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>Cython</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
              <a href="https://github.com/BansheeTech/vite_fusion/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all', themeClasses.aboutLink]">
                <span>Vite Fusion</span>
                <Icon :icon="openInNewIcon" size="12px" class="opacity-50" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <StatusBar :icon="infoIcon" message="About HomeDock OS" :info="`Version ${version}`" :showHelp="true">
      <template #help>
        <div class="space-y-2.5 max-w-sm">
          <div class="flex items-center gap-2">
            <Icon :icon="infoIcon" :class="['w-5 h-5', themeClasses.statusBarIcon]" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">About</h4>
          </div>

          <div :class="['text-[10px] md:text-xs space-y-2 leading-relaxed', themeClasses.statusBarInfo]">
            <p>This window displays information about HomeDock OS, including the current version, software license, open source component licenses, and useful links to documentation and resources.</p>
          </div>
        </div>
      </template>
    </StatusBar>
  </div>
</template>

<script lang="ts" setup>
import { inject } from "vue";
import { useTheme } from "../__Themes__/ThemeSelector";

import { Icon } from "@iconify/vue";
import infoIcon from "@iconify-icons/mdi/cloud-question";
import tagIcon from "@iconify-icons/mdi/tag";
import copyrightIcon from "@iconify-icons/mdi/copyright";
import GUIIcon from "@iconify-icons/mdi/layers-triple";
import licenseIcon from "@iconify-icons/mdi/shield-check";
import historyIcon from "@iconify-icons/mdi/history";
import githubIcon from "@iconify-icons/mdi/github";
import webIcon from "@iconify-icons/mdi/web";
import fileDocumentIcon from "@iconify-icons/mdi/file-document";
import openInNewIcon from "@iconify-icons/mdi/open-in-new";
import docsIcon from "@iconify-icons/mdi/lifebuoy";
import donateIcon from "@iconify-icons/mdi/coffee";
import codeIcon from "@iconify-icons/mdi/code-braces";
import vueIcon from "@iconify-icons/mdi/vuejs";
import pythonIcon from "@iconify-icons/mdi/language-python";
import shareIcon from "@iconify-icons/mdi/share-variant";
import starIcon from "@iconify-icons/mdi/star";
import twitterIcon from "@iconify-icons/mdi/twitter";
import accountGroupIcon from "@iconify-icons/mdi/account-group";

import StatusBar from "../__Components__/StatusBar.vue";
import LogoIcon from "../__Components__/LogoIcon.vue";

const commonData = inject<{ version: string }>("data-common");

if (!commonData) {
  throw new Error("Common data is missing!");
}

const { version } = commonData;

const { themeClasses } = useTheme();
</script>

<style scoped></style>
