<!-- homedock-ui/vue3/static/js/__Layouts__/Onboarding.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Favicon />
  <AeroPlusWallpaper />
  <ScrollBarThemeLoader />
  <TopComment />
  <SplashScreen />

  <div class="fixed inset-0 overflow-hidden isolate z-[2]" :class="[themeClasses.scopeSelector, themeClasses.back, 'onb-' + state.selected_theme]">
    <div class="onb-backdrop" aria-hidden="true">
      <div class="onb-bloom"></div>
      <div class="onb-grain"></div>
      <Transition name="aero-veil">
        <div v-if="state.selected_theme === 'aeroplus' && !isSetupSuccessful" class="onb-aero-veil"></div>
      </Transition>
    </div>

    <Transition name="onb-final">
      <div v-if="isSetupSuccessful" class="absolute inset-0 z-[5] flex items-center justify-center p-8">
        <div class="text-center max-w-[560px]">
          <BaseImage src="/images/logo_trans.svg" alt="Logo" :class="[themeClasses.logo]" class="h-16 sm:h-20 mx-auto mb-10 onb-final-logo" />
          <p :class="[themeClasses.subText]" class="text-[11px] tracking-[0.32em] uppercase font-medium opacity-70 m-0 mb-4">{{ $t("Setup complete") }}</p>
          <h1 :class="[themeClasses.mainText]" class="font-extralight tracking-[-0.045em] leading-[0.95] text-[clamp(3rem,9vw,6.5rem)] m-0 mb-5">{{ $t("Welcome.") }}</h1>
          <p :class="[themeClasses.subText]" class="text-base font-light opacity-85 m-0 mb-10">
            <template v-if="usernameDisplay"
              ><span class="scene-name font-medium">{{ usernameDisplay }}</span
              >, {{ $t("your HomeDock OS is ready.") }}</template
            >
            <template v-else>{{ $t("Your HomeDock OS is ready.") }}</template>
          </p>
          <Button id="main_button_onboarding_start" :class="[themeClasses.loginPrimaryButton]" class="h-14 px-12 border-0 onb-final-cta inline-flex items-center" @click="goToLogin">
            <Icon :icon="arrowRightIcon" width="18" height="18" class="mr-2" />
            <span>{{ $t("Sign In") }}</span>
          </Button>
        </div>
      </div>
    </Transition>

    <Transition name="splash-out">
      <div v-if="!hasStarted && !isSetupSuccessful" class="absolute inset-0 z-[4] flex items-center justify-center px-6 py-8">
        <canvas ref="auroraRef" class="absolute left-0 bottom-0 w-full h-full pointer-events-none z-0" style="transform: scaleY(-1)" aria-hidden="true"></canvas>
        <div class="onb-splash-inner relative z-[1] text-center max-w-[640px] w-full">
          <p :class="[themeClasses.subText]" class="text-xs tracking-[0.32em] uppercase font-medium opacity-70 m-0 mb-5">{{ $t("Welcome") }}</p>
          <Transition name="greet" mode="out-in">
            <h1 :key="splashGreetingCode" :class="[themeClasses.mainText]" class="font-extralight tracking-[-0.045em] leading-[0.95] text-[clamp(3.5rem,14vw,8rem)] m-0 break-words">{{ splashGreeting }}<span class="scene-display-dot">.</span></h1>
          </Transition>
          <p :class="[themeClasses.mainText]" class="relative flex items-center justify-center flex-nowrap text-base font-normal tracking-[0.04em] mt-6 mb-14 mx-auto w-max max-w-full lg:text-xl lg:mb-16">
            <span class="onb-pixar-ball" ref="ballRef" aria-hidden="true"></span>
            <span class="inline-flex items-baseline opacity-35">{{ $t("The cloud beyond dashboards.") }}</span>
          </p>

          <button type="button" class="onb-splash-cta" :class="[themeClasses.scopeSelector]" @click="hasStarted = true">
            <span class="onb-splash-cta-orbit" aria-hidden="true"></span>
            <span class="onb-splash-cta-label">{{ $t("Configure") }}</span>
            <Icon :icon="arrowRightIcon" width="16" height="16" />
          </button>
        </div>
      </div>
    </Transition>

    <div v-show="hasStarted && !isSetupSuccessful" class="relative z-[2] flex flex-col h-full lg:flex-row" :class="{ 'onb-split-rising': hasStarted }">
      <section class="relative flex-none flex items-center justify-center overflow-hidden min-h-[24vh] max-h-[36vh] py-6 px-5 lg:flex lg:basis-[56%] lg:min-w-[460px] lg:min-h-0 lg:max-h-none lg:py-16 lg:px-20 lg:items-center lg:justify-start" aria-hidden="true">
        <div class="hidden lg:flex lg:absolute lg:top-10 lg:left-20 lg:items-center lg:gap-2 lg:z-[3]">
          <BaseImage src="/images/logo_trans.svg" alt="" :class="[themeClasses.logo]" class="h-7 opacity-90" />
          <span :class="[themeClasses.mainText]" class="text-sm font-medium tracking-wide opacity-80">HomeDock OS</span>
        </div>

        <div class="hidden lg:block lg:absolute lg:bottom-8 lg:left-20 lg:z-[3]">
          <span :class="[themeClasses.subText]" class="text-[11px] tracking-[0.32em] font-mono opacity-60"> {{ String(currentStep + 1).padStart(2, "0") }} <span class="opacity-50">/</span> {{ String(stepLabels.length).padStart(2, "0") }} — {{ stepLabels[currentStep].toUpperCase() }} </span>
        </div>

        <!-- Scene -->
        <Transition name="scene" mode="out-in">
          <!-- 01 — Language -->
          <div v-if="currentStep === 0" key="lang" class="w-full max-w-[540px] text-center lg:text-left">
            <p :class="[themeClasses.subText]" class="text-[10px] tracking-[0.32em] uppercase font-medium opacity-70 mb-2 lg:text-[11px] lg:mb-5">{{ currentLangCode }} · {{ $t("Welcome") }}</p>
            <Transition name="greet" mode="out-in">
              <h1 :key="state.selected_language" :class="[themeClasses.mainText]" class="font-extralight tracking-[-0.035em] leading-none text-[clamp(1.75rem,7.5vw,2.5rem)] m-0 break-words lg:text-[clamp(3rem,6vw,5.75rem)] lg:leading-[0.95] lg:tracking-[-0.04em] lg:mb-5">{{ currentGreeting }}<span class="scene-display-dot">.</span></h1>
            </Transition>
            <p :class="[themeClasses.subText]" class="block text-[13px] font-light opacity-[0.78] max-w-[32ch] leading-[1.4] mt-2 mx-auto lg:text-[15px] lg:leading-[1.45] lg:m-0">{{ $t("HomeDock OS speaks your language.") }}</p>
          </div>

          <!-- 02 — Account -->
          <div v-else-if="currentStep === 1" key="acc" class="w-full max-w-[540px] text-center lg:text-left">
            <p :class="[themeClasses.subText]" class="text-[10px] tracking-[0.32em] uppercase font-medium opacity-70 mb-2 lg:text-[11px] lg:mb-5">{{ $t("Identity") }}</p>
            <h1 :class="[themeClasses.mainText]" class="font-extralight tracking-[-0.035em] leading-none text-[clamp(1.75rem,7.5vw,2.5rem)] m-0 break-words lg:text-[clamp(3rem,6vw,5.75rem)] lg:leading-[0.95] lg:tracking-[-0.04em] lg:mb-5">
              {{ $t("Hello,") }}<br />
              <span class="inline-block">
                <Transition name="char" mode="out-in">
                  <span :key="usernameDisplay || 'placeholder'" class="scene-name">{{ usernameDisplay || "________" }}<span class="scene-display-dot">.</span></span>
                </Transition>
              </span>
            </h1>
            <p :class="[themeClasses.subText]" class="block text-[13px] font-light opacity-[0.78] max-w-[32ch] leading-[1.4] mt-2 mx-auto lg:text-[15px] lg:leading-[1.45] lg:m-0">{{ $t("A new home for your data.") }}</p>
          </div>

          <!-- 03 — Appearance -->
          <div v-else-if="currentStep === 2" key="app" class="w-full max-w-[540px] text-center lg:text-left">
            <p :class="[themeClasses.subText]" class="text-[10px] tracking-[0.32em] uppercase font-medium opacity-70 mb-2 lg:text-[11px] lg:mb-5">{{ $t("Appearance") }}</p>
            <Transition name="greet" mode="out-in">
              <h1 :key="state.selected_theme" :class="[themeClasses.mainText]" class="font-extralight tracking-[-0.035em] leading-none text-[clamp(1.75rem,7.5vw,2.5rem)] m-0 break-words lg:text-[clamp(3rem,6vw,5.75rem)] lg:leading-[0.95] lg:tracking-[-0.04em] lg:mb-5">{{ currentThemeLabel }}<span class="scene-display-dot">.</span></h1>
            </Transition>
            <Transition name="greet" mode="out-in">
              <p :key="state.selected_theme + '-d'" :class="[themeClasses.subText]" class="block text-[13px] font-light opacity-[0.78] max-w-[32ch] leading-[1.4] mt-2 mx-auto lg:text-[15px] lg:leading-[1.45] lg:m-0">{{ currentThemeDesc }}</p>
            </Transition>
          </div>

          <!-- 04 — Time -->
          <div v-else-if="currentStep === 3" key="time" class="w-full max-w-[540px] text-center lg:text-left">
            <p :class="[themeClasses.subText]" class="text-[10px] tracking-[0.32em] uppercase font-medium opacity-70 mb-2 lg:text-[11px] lg:mb-5">{{ $t("Now") }}</p>
            <div :class="[themeClasses.mainText]" class="font-extralight tracking-[-0.04em] leading-[0.9] text-[clamp(2.75rem,11vw,4rem)] m-0 tabular-nums lg:text-[clamp(5rem,12vw,9.5rem)] lg:tracking-[-0.05em] lg:mb-6">{{ formattedTime }}</div>
            <p :class="[themeClasses.subText]" class="block text-[13px] font-light opacity-[0.78] max-w-[32ch] leading-[1.4] mt-2 mx-auto lg:text-[15px] lg:leading-[1.45] lg:m-0">{{ formattedDate }}</p>
          </div>

          <!-- 05 — Done -->
          <div v-else-if="currentStep === 4" key="done" class="w-full max-w-[540px] text-center lg:text-left">
            <p :class="[themeClasses.subText]" class="text-[10px] tracking-[0.32em] uppercase font-medium opacity-70 mb-2 lg:text-[11px] lg:mb-5">{{ $t("Ready") }}</p>
            <h1 :class="[themeClasses.mainText]" class="font-extralight tracking-[-0.035em] leading-none text-[clamp(1.75rem,7.5vw,2.5rem)] m-0 break-words lg:text-[clamp(3rem,6vw,5.75rem)] lg:leading-[0.95] lg:tracking-[-0.04em] lg:mb-5">
              {{ $t("All set,") }}<br />
              <span class="scene-name">{{ usernameDisplay || $t("friend") }}<span class="scene-display-dot">.</span></span>
            </h1>
            <p :class="[themeClasses.subText]" class="block text-[13px] font-light opacity-[0.78] max-w-[32ch] leading-[1.4] mt-2 mx-auto lg:text-[15px] lg:leading-[1.45] lg:m-0">{{ $t("One last look, then we begin.") }}</p>
          </div>
        </Transition>
      </section>

      <!-- Right -->
      <section class="onb-wizard relative flex-1 flex flex-col min-h-0 px-5 pt-5 pb-4 lg:basis-[44%] lg:flex-grow-0 lg:px-14 lg:pt-12 lg:pb-10">
        <!-- Header -->
        <header class="flex items-center justify-between mb-5">
          <div class="lg:hidden flex items-center gap-2">
            <BaseImage src="/images/logo_trans.svg" alt="" :class="[themeClasses.logo]" class="h-6" />
            <span :class="[themeClasses.mainText]" class="text-xs font-medium tracking-wide opacity-80">HomeDock OS</span>
          </div>
          <span :class="[themeClasses.subText]" class="text-[11px] tracking-[0.28em] uppercase font-mono opacity-70">
            {{ $t("Step {n} of {total}", { n: currentStep + 1, total: stepLabels.length }) }}
          </span>
        </header>

        <!-- Progress -->
        <div class="flex gap-1.5 mb-9" role="progressbar" :aria-valuenow="currentStep + 1" :aria-valuemin="1" :aria-valuemax="stepLabels.length">
          <div v-for="(label, i) in stepLabels" :key="label" class="flex-1 h-0.5 rounded-[2px] transition-[background] duration-[400ms] onb-rail-segment" :class="{ 'onb-rail-done': i < currentStep, 'onb-rail-current': i === currentStep }"></div>
        </div>

        <!-- Step body -->
        <div ref="wizardBodyRef" class="flex-1 min-h-0 relative overflow-y-auto overflow-x-hidden -mx-2 px-2 pb-2 lg:min-h-[280px]">
          <Transition name="step" mode="out-in">
            <div :key="currentStep">
              <!-- 01 — Language -->
              <div v-if="currentStep === 0">
                <h2 :class="[themeClasses.mainText]" class="text-2xl font-light tracking-[-0.015em] leading-tight m-0 mb-2 lg:text-[1.75rem]">{{ $t("Choose your language") }}</h2>
                <p :class="[themeClasses.subText]" class="text-sm font-light leading-relaxed opacity-85 m-0 mb-7 max-w-[42ch]">{{ $t("This will be used across HomeDock OS.") }}</p>
                <Select v-model:value="state.selected_language" :options="languageOptions" class="w-full hd-onboarding-select" size="large" @change="onLanguageChange" />
              </div>

              <!-- 02 — Account -->
              <div v-else-if="currentStep === 1">
                <h2 :class="[themeClasses.mainText]" class="text-2xl font-light tracking-[-0.015em] leading-tight m-0 mb-2 lg:text-[1.75rem]">{{ $t("Create your account") }}</h2>
                <p :class="[themeClasses.subText]" class="text-sm font-light leading-relaxed opacity-85 m-0 mb-7 max-w-[42ch]">{{ $t("Pick a username and password you'll use to sign in.") }}</p>
                <Form layout="vertical">
                  <Form.Item :validate-status="usernameTouched && !isUsernameValid ? 'error' : ''">
                    <template #help>
                      <div v-if="usernameTouched && !isUsernameValid" class="onb-field-error flex items-center gap-1.5 mt-1.5 text-[13px] leading-tight font-medium">
                        <Icon :icon="alertIcon" width="14" height="14" />
                        <span>{{ usernameErrorMessage }}</span>
                      </div>
                    </template>
                    <label :class="[themeClasses.mainText]" class="block text-sm font-medium m-0 mb-2 opacity-90" for="username">{{ $t("Username") }}</label>
                    <Input :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" class="h-11 mt-2" autocomplete="username" v-model:value="state.username" :placeholder="$t('Choose a username...')" :maxlength="30" @blur="usernameTouched = true">
                      <template #prefix>
                        <Icon :icon="accountIcon" class="mr-0.5" :class="[themeClasses.formIcon]" width="16" height="16" />
                      </template>
                    </Input>
                  </Form.Item>
                  <Form.Item :validate-status="passwordTouched && !isPasswordValid ? 'error' : ''">
                    <template #help>
                      <div v-if="passwordTouched && !isPasswordValid" class="onb-field-error flex items-center gap-1.5 mt-1.5 text-[13px] leading-tight font-medium">
                        <Icon :icon="alertIcon" width="14" height="14" />
                        <span>{{ passwordErrorMessage }}</span>
                      </div>
                    </template>
                    <label :class="[themeClasses.mainText]" class="block text-sm font-medium m-0 mb-2 opacity-90" for="password">{{ $t("Password") }}</label>
                    <Input :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" class="h-11 mt-2" autocomplete="new-password" v-model:value="state.password" :type="passwordVisible ? 'text' : 'password'" placeholder="••••••••" :maxlength="30" @blur="passwordTouched = true">
                      <template #prefix>
                        <Icon :icon="passIcon" class="mr-0.5" :class="[themeClasses.formIcon]" width="16" height="16" />
                      </template>
                      <template #suffix>
                        <Button type="link" @click="passwordVisible = !passwordVisible" icon>
                          <Icon :icon="passwordVisible ? openEye : closedEye" class="mt-1" />
                        </Button>
                      </template>
                    </Input>
                  </Form.Item>
                  <Form.Item :validate-status="confirmPasswordTouched && !isConfirmPasswordValid ? 'error' : ''">
                    <template #help>
                      <div v-if="confirmPasswordTouched && !isConfirmPasswordValid" class="onb-field-error flex items-center gap-1.5 mt-1.5 text-[13px] leading-tight font-medium">
                        <Icon :icon="alertIcon" width="14" height="14" />
                        <span>{{ confirmPasswordErrorMessage }}</span>
                      </div>
                    </template>
                    <label :class="[themeClasses.mainText]" class="block text-sm font-medium m-0 mb-2 opacity-90" for="confirmPassword">{{ $t("Confirm Password") }}</label>
                    <Input :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" class="h-11 mt-2" autocomplete="new-password" v-model:value="state.confirmPassword" :type="passwordVisible ? 'text' : 'password'" placeholder="••••••••" :maxlength="30" @blur="confirmPasswordTouched = true">
                      <template #prefix>
                        <Icon :icon="passIcon" class="mr-0.5" :class="[themeClasses.formIcon]" width="16" height="16" />
                      </template>
                    </Input>
                  </Form.Item>
                </Form>
              </div>

              <!-- 03 — Appearance -->
              <div v-else-if="currentStep === 2">
                <h2 :class="[themeClasses.mainText]" class="text-2xl font-light tracking-[-0.015em] leading-tight m-0 mb-2 lg:text-[1.75rem]">{{ $t("Pick your appearance") }}</h2>
                <p :class="[themeClasses.subText]" class="text-sm font-light leading-relaxed opacity-85 m-0 mb-7 max-w-[42ch]">{{ $t("Changes apply instantly so you can preview them.") }}</p>

                <p :class="[themeClasses.subText]" class="text-[11px] tracking-[0.22em] uppercase font-medium opacity-75 m-0 mb-3">{{ $t("Theme") }}</p>
                <div class="grid grid-cols-3 gap-2.5 mb-7">
                  <button v-for="theme in themeOptions" :key="theme.value" type="button" @click="selectTheme(theme.value)" class="onb-theme-card relative rounded-[14px] p-4 text-left border-0 outline outline-[1.5px] outline-offset-[2px] outline-transparent cursor-pointer opacity-[0.78] transition-[transform,box-shadow,opacity] duration-200 hover:opacity-100 hover:-translate-y-px" :class="{ 'onb-theme-card-active': state.selected_theme === theme.value }" :style="{ background: theme.swatch }">
                    <span class="block text-sm font-medium" :style="{ color: theme.fg }">{{ theme.label }}</span>
                    <span class="block text-[11px] mt-1 leading-snug" :style="{ color: theme.fg, opacity: 0.7 }">{{ theme.desc }}</span>
                    <span class="onb-theme-check absolute top-2 right-2 w-4 h-4 rounded-full border flex items-center justify-center opacity-0 transition-opacity duration-200" :style="{ borderColor: theme.fg, color: theme.fg }">
                      <Icon :icon="checkIcon" width="10" height="10" />
                    </span>
                  </button>
                </div>

                <Transition name="step">
                  <div v-if="state.selected_theme === 'aeroplus'" key="wp">
                    <p :class="[themeClasses.subText]" class="text-[11px] tracking-[0.22em] uppercase font-medium opacity-75 m-0 mb-3">{{ $t("Wallpaper") }}</p>
                    <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      <button v-for="back in wallpaperOptions" :key="back" type="button" @click="selectWallpaper(back)" class="onb-wp-card aspect-video rounded-lg overflow-hidden outline outline-[1.5px] outline-offset-[2px] outline-transparent opacity-70 cursor-pointer border-0 p-0 transition-[opacity,transform] duration-200 hover:opacity-100 hover:-translate-y-px" :class="{ 'onb-wp-card-active': state.selected_back === back }">
                        <img :src="`/images/wallpapers/${back}`" :alt="back" class="w-full h-full object-cover" />
                      </button>
                    </div>
                    <p :class="[themeClasses.subText]" class="mt-3.5 text-xs font-light leading-[1.4] opacity-70">{{ $t("You can upload your own wallpaper later in Settings.") }}</p>
                  </div>
                </Transition>
              </div>

              <!-- 04 — Time -->
              <div v-else-if="currentStep === 3">
                <h2 :class="[themeClasses.mainText]" class="text-2xl font-light tracking-[-0.015em] leading-tight m-0 mb-2 lg:text-[1.75rem]">{{ $t("Time & calendar") }}</h2>
                <p :class="[themeClasses.subText]" class="text-sm font-light leading-relaxed opacity-85 m-0 mb-7 max-w-[42ch]">{{ $t("How would you like dates and times displayed?") }}</p>

                <p :class="[themeClasses.subText]" class="text-[11px] tracking-[0.22em] uppercase font-medium opacity-75 m-0 mb-3">{{ $t("Clock format") }}</p>
                <Radio.Group v-model:value="state.clock_format" button-style="solid" class="mb-7">
                  <Radio.Button value="24h">{{ $t("24-hour") }}</Radio.Button>
                  <Radio.Button value="12h">{{ $t("12-hour") }}</Radio.Button>
                </Radio.Group>

                <p :class="[themeClasses.subText]" class="text-[11px] tracking-[0.22em] uppercase font-medium opacity-75 m-0 mb-3">{{ $t("Week starts on") }}</p>
                <Radio.Group v-model:value="state.week_start" button-style="solid">
                  <Radio.Button value="monday">{{ $t("Monday") }}</Radio.Button>
                  <Radio.Button value="sunday">{{ $t("Sunday") }}</Radio.Button>
                </Radio.Group>
              </div>

              <!-- 05 — Done -->
              <div v-else-if="currentStep === 4">
                <h2 :class="[themeClasses.mainText]" class="text-2xl font-light tracking-[-0.015em] leading-tight m-0 mb-2 lg:text-[1.75rem]">{{ $t("Almost there!") }}</h2>
                <p :class="[themeClasses.subText]" class="text-sm font-light leading-relaxed opacity-85 m-0 mb-7 max-w-[42ch]">{{ $t("Review your selections and finish setup.") }}</p>
                <ul class="onb-summary list-none m-0 p-0 border-t">
                  <li class="flex justify-between items-center py-3.5 text-sm border-b">
                    <span :class="[themeClasses.subText]" class="text-[11px] tracking-[0.18em] uppercase font-medium opacity-70">{{ $t("Language") }}</span>
                    <span :class="[themeClasses.mainText]">{{ currentLanguageLabel }}</span>
                  </li>
                  <li class="flex justify-between items-center py-3.5 text-sm border-b">
                    <span :class="[themeClasses.subText]" class="text-[11px] tracking-[0.18em] uppercase font-medium opacity-70">{{ $t("Username") }}</span>
                    <span :class="[themeClasses.mainText]">{{ state.username }}</span>
                  </li>
                  <li class="flex justify-between items-center py-3.5 text-sm border-b">
                    <span :class="[themeClasses.subText]" class="text-[11px] tracking-[0.18em] uppercase font-medium opacity-70">{{ $t("Theme") }}</span>
                    <span :class="[themeClasses.mainText]">{{ currentThemeLabel }}</span>
                  </li>
                  <li class="flex justify-between items-center py-3.5 text-sm border-b">
                    <span :class="[themeClasses.subText]" class="text-[11px] tracking-[0.18em] uppercase font-medium opacity-70">{{ $t("Clock format") }}</span>
                    <span :class="[themeClasses.mainText]">{{ state.clock_format === "24h" ? $t("24-hour") : $t("12-hour") }}</span>
                  </li>
                  <li class="flex justify-between items-center py-3.5 text-sm border-b">
                    <span :class="[themeClasses.subText]" class="text-[11px] tracking-[0.18em] uppercase font-medium opacity-70">{{ $t("Week starts on") }}</span>
                    <span :class="[themeClasses.mainText]">{{ state.week_start === "monday" ? $t("Monday") : $t("Sunday") }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </Transition>
        </div>

        <footer class="onb-wizard-footer flex-none flex justify-between items-center gap-3 mt-4 pt-4 border-t lg:mt-8 lg:pt-5" style="padding-bottom: env(safe-area-inset-bottom, 0px)">
          <Button :class="[themeClasses.loginSecondaryButton]" class="h-12 flex items-center px-6" :disabled="currentStep === 0 || isSubmitting || isSetupSuccessful" @click="prevStep">
            <Icon :icon="arrowLeftIcon" width="16" height="16" class="mr-1" />
            {{ $t("Back") }}
          </Button>
          <Button v-if="currentStep < stepLabels.length - 1" id="main_button_onboarding_next" :class="[themeClasses.loginPrimaryButton]" class="h-12 border-0 flex items-center px-6" @click="nextStep">
            {{ $t("Next") }}
            <Icon :icon="arrowRightIcon" width="16" height="16" class="ml-1" />
          </Button>
          <Button v-else id="main_button_onboarding_finish" :class="[themeClasses.loginPrimaryButton, { clicked: isSetupSuccessful }]" class="h-12 border-0 flex items-center px-6" :disabled="isSubmitting || isSetupSuccessful" @click="handleFinish">
            <Icon :icon="isSubmitting || isSetupSuccessful ? loadingIcon : checkIcon" :class="['text-white', { 'animate-spin': isSubmitting || isSetupSuccessful }]" width="16" height="16" />
            <span class="ml-1">{{ $t("Finish setup") }}</span>
          </Button>
        </footer>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from "axios";
import { reactive, ref, computed, inject, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { useTheme } from "../__Themes__/ThemeSelector";
import { setLanguage } from "../__Languages__";
import { encryptForServer } from "../__Utils__/CryptoClient";
import { clampToBytes, BCRYPT_MAX_BYTES } from "../__Utils__/StringByteClamp";
import { AxiosError } from "axios";

import { Icon } from "@iconify/vue";
import accountIcon from "@iconify-icons/mdi/account";
import alertIcon from "@iconify-icons/mdi/alert-circle";
import passIcon from "@iconify-icons/mdi/lock";
import openEye from "@iconify-icons/mdi/eye-outline";
import closedEye from "@iconify-icons/mdi/eye-closed";
import loadingIcon from "@iconify-icons/mdi/loading";
import checkIcon from "@iconify-icons/mdi/check";
import arrowLeftIcon from "@iconify-icons/mdi/arrow-left";
import arrowRightIcon from "@iconify-icons/mdi/arrow-right";

import { Form, Input, Button, Select, Radio, message } from "ant-design-vue";

import Favicon from "../__Components__/Favicon.vue";
import AeroPlusWallpaper from "../__Components__/AeroPlusWallpaper.vue";
import ScrollBarThemeLoader from "../__Components__/ScrollBarThemeLoader.vue";
import TopComment from "../__Components__/TopComment.vue";
import BaseImage from "../__Components__/BaseImage.vue";
import SplashScreen from "../__Components__/SplashScreen.vue";

import type { ThemeData } from "../__Types__/ThemeData";

const { t, locale } = useI18n();

const themeData = inject<ThemeData>("data-theme") as ThemeData;
const { themeClasses } = useTheme();

const stepLabels = computed(() => [t("Language"), t("Account"), t("Appearance"), t("Time"), t("Done")]);
const currentStep = ref(0);
const hasStarted = ref(false);
const wizardBodyRef = ref<HTMLElement | null>(null);
const ballRef = ref<HTMLElement | null>(null);
const auroraRef = ref<HTMLCanvasElement | null>(null);

watch(currentStep, async () => {
  await nextTick();
  wizardBodyRef.value?.scrollTo({ top: 0, behavior: "auto" });
  window.scrollTo({ top: 0, behavior: "auto" });
});

const state = reactive({
  selected_language: locale.value || "en",
  username: "",
  password: "",
  confirmPassword: "",
  selected_theme: themeData.selected_theme || "default",
  selected_back: themeData.selected_back || "back1.jpg",
  clock_format: "24h" as "24h" | "12h",
  week_start: "monday" as "monday" | "sunday",
});

const passwordVisible = ref(false);
const isSubmitting = ref(false);
const isSetupSuccessful = ref(false);
const successRedirectUrl = ref<string>("/");

const previewNow = ref(new Date());
let clockTimer: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
  clockTimer = setInterval(() => {
    previewNow.value = new Date();
  }, 1000);
});
onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer);
});

let ballTimer: ReturnType<typeof setTimeout> | null = null;
function triggerBallBounce() {
  const el = ballRef.value;
  if (el) {
    el.classList.remove("is-running");
    void el.offsetWidth;
    el.classList.add("is-running");
  }
}
function scheduleBallBounce(initial = false) {
  const delay = initial ? 1800 : 4500 + Math.random() * 8500; // 4.5–13s, random
  ballTimer = setTimeout(() => {
    triggerBallBounce();
    scheduleBallBounce(false);
  }, delay);
}
onMounted(() => scheduleBallBounce(true));
onBeforeUnmount(() => {
  if (ballTimer) clearTimeout(ballTimer);
});

let auroraAnimId: number | null = null;
let auroraResizeHandler: (() => void) | null = null;
onMounted(() => {
  const canvas = auroraRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const SPEED = 0.0016;
  const MAX_HEIGHT = 0.1;
  const REVEAL_DURATION = 2800;
  const COLORS: Array<[number, number, number, number]> = [
    [59, 130, 246, 0.12],
    [99, 102, 241, 0.08],
    [236, 72, 153, 0.06],
    [37, 99, 235, 0.05],
  ];
  const easeOutSmooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 4));

  const waves = COLORS.map((color, i) => ({
    color,
    baseY: (i + 1) / (COLORS.length + 1),
    amplitude: 30 + Math.random() * 40,
    frequency: 0.004 + Math.random() * 0.002,
    phaseSpeed: (0.8 + Math.random() * 0.4) * (i % 2 === 0 ? 1 : -1),
    thickness: 60 + Math.random() * 50,
  }));

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  auroraResizeHandler = resize;

  let time = 0;
  let startTs: number | null = null;
  const draw = (ts: number) => {
    if (!auroraRef.value) return;
    if (startTs === null) startTs = ts;
    const reveal = easeOutSmooth(Math.min((ts - startTs) / REVEAL_DURATION, 1));

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    time += SPEED;
    const w = canvas.width;
    const h = canvas.height;
    const auroraH = h * MAX_HEIGHT;

    for (const wave of waves) {
      const yCenter = wave.baseY * auroraH;
      const amp = wave.amplitude * reveal;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let x = 0; x <= w; x += 4) {
        const nx = x * wave.frequency;
        const y = yCenter + Math.sin(nx + time * wave.phaseSpeed) * amp + Math.sin(nx * 2.3 + time * wave.phaseSpeed * 0.7) * amp * 0.4;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, 0);
      ctx.closePath();

      const [r, g, b, a] = wave.color;
      const aR = a * reveal;
      const grad = ctx.createLinearGradient(0, 0, 0, yCenter + wave.thickness);
      grad.addColorStop(0, `rgba(${r},${g},${b},${aR * 1.5})`);
      grad.addColorStop(0.5, `rgba(${r},${g},${b},${aR})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const nx = x * wave.frequency;
        const y = yCenter + Math.sin(nx + time * wave.phaseSpeed) * amp + Math.sin(nx * 2.3 + time * wave.phaseSpeed * 0.7) * amp * 0.4;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${r},${g},${b},${aR * 2.5})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    auroraAnimId = requestAnimationFrame(draw);
  };

  resize();
  auroraAnimId = requestAnimationFrame(draw);
  window.addEventListener("resize", resize);
});
onBeforeUnmount(() => {
  if (auroraAnimId) cancelAnimationFrame(auroraAnimId);
  if (auroraResizeHandler) window.removeEventListener("resize", auroraResizeHandler);
});

const formattedTime = computed(() => {
  const d = previewNow.value;
  const h24 = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  if (state.clock_format === "12h") {
    const h12 = h24 % 12 || 12;
    const ampm = h24 < 12 ? "AM" : "PM";
    return `${h12}:${m} ${ampm}`;
  }
  return `${h24.toString().padStart(2, "0")}:${m}`;
});

const formattedDate = computed(() => {
  try {
    return new Intl.DateTimeFormat(state.selected_language, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(previewNow.value);
  } catch {
    return previewNow.value.toDateString();
  }
});

const GREETINGS: Record<string, string> = {
  en: "Hello",
  es: "Hola",
  de: "Hallo",
  fr: "Bonjour",
  it: "Ciao",
  pt: "Olá",
  zh: "你好",
  ru: "Привет",
  uk: "Привіт",
  ja: "こんにちは",
  ko: "안녕하세요",
};
const currentGreeting = computed(() => GREETINGS[state.selected_language] || GREETINGS.en);
const currentLangCode = computed(() => state.selected_language.toUpperCase());
const currentThemeDesc = computed(() => themeOptions.value.find((tt) => tt.value === state.selected_theme)?.desc || "");

const GREETING_CODES = Object.keys(GREETINGS);
const splashGreetingCode = ref<string>("en");
const splashGreeting = computed(() => GREETINGS[splashGreetingCode.value]);

let splashCycleTimer: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
  splashCycleTimer = setInterval(() => {
    const candidates = GREETING_CODES.filter((c) => c !== splashGreetingCode.value);
    splashGreetingCode.value = candidates[Math.floor(Math.random() * candidates.length)];
  }, 2200);
});
onBeforeUnmount(() => {
  if (splashCycleTimer) clearInterval(splashCycleTimer);
});
// Once the user enters the wizard the splash is gone — kill the timer too.
watch(hasStarted, (started) => {
  if (started && splashCycleTimer) {
    clearInterval(splashCycleTimer);
    splashCycleTimer = null;
  }
});

const usernameDisplay = computed(() => state.username.replace(/[^a-zA-Z0-9]/g, ""));

const csrfToken = ref<string | null>(document.querySelector('meta[name="homedock_csrf_token"]')?.getAttribute("content") || null);

const languageOptions = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
  { value: "it", label: "Italiano" },
  { value: "pt", label: "Português" },
  { value: "zh", label: "中文" },
  { value: "ru", label: "Русский" },
  { value: "uk", label: "Українська" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
];

const themeOptions = computed(() => [
  { value: "default", label: t("Default"), desc: t("Light, clean, minimal."), swatch: "linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%)", fg: "#1f2937" },
  { value: "noir", label: "Noir", desc: t("Dark and focused."), swatch: "linear-gradient(135deg, #18181b 0%, #27272a 100%)", fg: "#f4f4f5" },
  { value: "aeroplus", label: "Aero+", desc: t("Glass with wallpaper."), swatch: "linear-gradient(135deg, #1e3a8a 0%, #6366f1 100%)", fg: "#ffffff" },
]);

const wallpaperOptions = ["back1.jpg", "back2.jpg", "back3.jpg", "back4.jpg", "back5.jpg", "back6.jpg"];

const currentLanguageLabel = computed(() => languageOptions.find((l) => l.value === state.selected_language)?.label || state.selected_language);
const currentThemeLabel = computed(() => themeOptions.value.find((tt) => tt.value === state.selected_theme)?.label || state.selected_theme);

const USERNAME_RE = /^[a-zA-Z0-9]+$/;

const usernameTouched = ref(false);
const passwordTouched = ref(false);
const confirmPasswordTouched = ref(false);

watch(
  () => state.username,
  (next) => {
    const clamped = clampToBytes(next, BCRYPT_MAX_BYTES);
    if (clamped !== next) state.username = clamped;
  },
);
watch(
  () => state.password,
  (next) => {
    const clamped = clampToBytes(next, BCRYPT_MAX_BYTES);
    if (clamped !== next) state.password = clamped;
  },
);
watch(
  () => state.confirmPassword,
  (next) => {
    const clamped = clampToBytes(next, BCRYPT_MAX_BYTES);
    if (clamped !== next) state.confirmPassword = clamped;
  },
);

const isUsernameValid = computed(() => {
  if (!state.username) return false;
  if (state.username.length > 30) return false;
  if (!USERNAME_RE.test(state.username)) return false;
  if (state.username.toLowerCase() === "user") return false;
  return true;
});

const usernameErrorMessage = computed(() => {
  if (!state.username) return t("Username can't be blank!");
  if (state.username.length > 30) return t("Username can't exceed 30 characters");
  if (!USERNAME_RE.test(state.username)) return t("Only upper or lowercase letters and numbers");
  if (state.username.toLowerCase() === "user") return t("Please choose a different username.");
  return "";
});

const isPasswordValid = computed(() => {
  if (!state.password) return false;
  if (state.password.length < 6) return false;
  if (state.password.length > 30) return false;
  if (state.password === "passwd") return false;
  return true;
});

const passwordErrorMessage = computed(() => {
  if (!state.password) return t("Password can't be blank!");
  if (state.password.length < 6) return t("Must be at least 6 characters long.");
  if (state.password.length > 30) return t("Password can't exceed 30 characters.");
  if (state.password === "passwd") return t("Please choose a different password.");
  return "";
});

const isConfirmPasswordValid = computed(() => {
  if (!state.confirmPassword) return false;
  return state.confirmPassword === state.password;
});

const confirmPasswordErrorMessage = computed(() => {
  if (!state.confirmPassword) return t("Confirm password can't be blank!");
  if (state.confirmPassword !== state.password) return t("Passwords do not match.");
  return "";
});

const canAdvance = computed(() => {
  if (currentStep.value === 0) return !!state.selected_language;
  if (currentStep.value === 1) return isUsernameValid.value && isPasswordValid.value && isConfirmPasswordValid.value;
  return true;
});

watch(
  () => state.selected_theme,
  (next) => {
    themeData.selected_theme = next;
    document.body.className = `theme-${next}`;
  },
);

watch(
  () => state.selected_back,
  (next) => {
    themeData.selected_back = next;
  },
);

async function onLanguageChange(value: unknown) {
  if (typeof value === "string") {
    await setLanguage(value);
  }
}

function selectTheme(value: string) {
  state.selected_theme = value;
}

function selectWallpaper(value: string) {
  state.selected_back = value;
}

function nextStep() {
  if (currentStep.value === 1 && !canAdvance.value) {
    usernameTouched.value = true;
    passwordTouched.value = true;
    confirmPasswordTouched.value = true;
    return;
  }
  if (!canAdvance.value) return;
  if (currentStep.value < stepLabels.value.length - 1) currentStep.value += 1;
}

function prevStep() {
  if (currentStep.value > 0) currentStep.value -= 1;
}

function goToLogin() {
  window.location.href = successRedirectUrl.value;
}

function getOnboardingErrorMessage(code: string): string {
  switch (code) {
    case "username_empty":
      return t("Username can't be blank!");
    case "username_too_long":
      return t("Username can't exceed 30 characters");
    case "username_is_default":
      return t("Please choose a different username.");
    case "password_length":
      return t("Must be at least 6 characters long.");
    case "password_is_default":
      return t("Please choose a different password.");
    case "password_invalid":
      return t("Invalid password.");
    case "decryption_failed":
      return t("Password decryption failed, please contact support.");
    case "missing_payload":
      return t("Invalid request.");
    case "onboarding_unavailable":
      return t("Onboarding is no longer available.");
    default:
      return t("Unexpected error, please contact support.");
  }
}

async function handleFinish() {
  if (!csrfToken.value) {
    message.error(t("CSRF token missing."));
    return;
  }
  if (isSubmitting.value || isSetupSuccessful.value) return;

  isSubmitting.value = true;

  try {
    const encryptedData = await encryptForServer(
      {
        user_name: state.username,
        user_password: state.password,
        selected_language: state.selected_language,
        selected_theme: state.selected_theme,
        selected_back: state.selected_back,
        clock_format: state.clock_format,
        week_start: state.week_start,
      },
      csrfToken.value,
    );

    const response = await axios.post(
      "/api/onboarding",
      {
        encrypted_data: encryptedData,
        homedock_csrf_token: csrfToken.value,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-HomeDock-CSRF-Token": csrfToken.value,
        },
      },
    );

    if (response.data.status === "success") {
      successRedirectUrl.value = response.data.redirect_url || "/";
      isSetupSuccessful.value = true;
    } else {
      message.error(t("Unexpected error, please contact support."));
    }
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      const code = error.response.data.error || "";
      const redirect = error.response.data.redirect_url;
      message.error(getOnboardingErrorMessage(code));
      if (redirect) {
        setTimeout(() => {
          window.location.href = redirect;
        }, 2000);
      }
    } else {
      message.error(t("There was an error during setup."));
    }
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
::v-deep(.dark-mode-theme .ant-radio-button-wrapper),
::v-deep(.aero-mode-theme .ant-radio-button-wrapper) {
  background-color: transparent !important;
  border-color: rgba(255, 255, 255, 0.25) !important;
  color: rgb(244, 244, 245) !important;
}
::v-deep(.dark-mode-theme .ant-radio-button-wrapper-checked),
::v-deep(.aero-mode-theme .ant-radio-button-wrapper-checked) {
  background-color: rgb(59, 130, 246) !important;
  border-color: rgb(59, 130, 246) !important;
  color: rgb(255, 255, 255) !important;
}

::v-deep(.dark-mode-theme .ant-select-selection-item),
::v-deep(.aero-mode-theme .ant-select-selection-item) {
  color: rgb(244, 244, 245) !important;
}

::v-deep(.white-mode-theme input) {
  background-color: rgb(255, 255, 255) !important;
  color: rgb(31, 31, 31) !important;
}

::v-deep(.dark-mode-theme input) {
  background-color: rgb(39, 39, 42) !important;
  color: rgb(255, 255, 255) !important;
}

::v-deep(.aero-mode-theme input) {
  background-color: rgba(255, 0, 0, 0) !important;
  color: rgb(255, 255, 255) !important;
}

::v-deep(.white-mode-theme input::placeholder) {
  color: rgb(210, 210, 210) !important;
}

::v-deep(.dark-mode-theme input::placeholder) {
  color: rgb(100, 100, 100) !important;
}

::v-deep(.aero-mode-theme input::placeholder) {
  color: rgb(100, 100, 100) !important;
}

#main_button_onboarding_next,
#main_button_onboarding_finish {
  position: relative;
  overflow: hidden;
  z-index: 1;
}

#main_button_onboarding_next::before,
#main_button_onboarding_finish::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--login-button-clicked-bg, rgb(50, 50, 50));
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.4s ease-in-out;
  z-index: -1;
}

#main_button_onboarding_finish.clicked::before {
  transform: scaleX(1);
}

#main_button_onboarding_finish:disabled,
#main_button_onboarding_next:disabled {
  opacity: 1 !important;
}

.white-mode-theme #main_button_onboarding_next::before,
.white-mode-theme #main_button_onboarding_finish::before {
  --login-button-clicked-bg: rgb(156, 163, 175);
}

.dark-mode-theme #main_button_onboarding_next::before,
.dark-mode-theme #main_button_onboarding_finish::before {
  --login-button-clicked-bg: rgb(82, 82, 91);
}

.aero-mode-theme #main_button_onboarding_next::before,
.aero-mode-theme #main_button_onboarding_finish::before {
  --login-button-clicked-bg: rgba(255, 255, 255, 0.2);
}

.onb-backdrop {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
}

.onb-bloom {
  position: absolute;
  inset: -20%;
  background: radial-gradient(ellipse 60% 50% at 18% 35%, var(--onb-bloom-a, rgba(99, 102, 241, 0.18)), transparent 60%), radial-gradient(ellipse 55% 45% at 82% 75%, var(--onb-bloom-b, rgba(56, 189, 248, 0.14)), transparent 60%);
  filter: blur(20px);
  opacity: 0.9;
  animation: onb-bloom-drift 60s ease-in-out infinite alternate;
}
@keyframes onb-bloom-drift {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  100% {
    transform: translate3d(2%, -1.5%, 0) scale(1.04);
  }
}
.onb-grain {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  opacity: 0.1;
  mix-blend-mode: overlay;
}

.onb-default {
  --onb-bloom-a: rgba(99, 102, 241, 0.16);
  --onb-bloom-b: rgba(56, 189, 248, 0.12);
}
.onb-noir {
  --onb-bloom-a: rgba(59, 130, 246, 0.2);
  --onb-bloom-b: rgba(168, 85, 247, 0.16);
}
.onb-noir .onb-grain {
  opacity: 0.07;
  mix-blend-mode: screen;
}
.onb-aeroplus {
  --onb-bloom-a: rgba(255, 255, 255, 0.1);
  --onb-bloom-b: rgba(56, 189, 248, 0.1);
}

.onb-aero-veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.3) 38%, rgba(0, 0, 0, 0.18) 60%, rgba(0, 0, 0, 0.4) 100%), radial-gradient(ellipse 60% 70% at 25% 30%, transparent, rgba(0, 0, 0, 0.3) 80%);
}

.scene-display-dot {
  display: inline-block;
  color: #3b82f6;
  margin-left: -0.04em;
  font-weight: 300;
}

.scene-name {
  font-weight: 300;
  background: linear-gradient(110deg, #3b82f6 0%, #6366f1 45%, #ec4899 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.onb-wizard {
  background-color: var(--onb-wizard-bg, rgba(255, 255, 255, 0.92));
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-top: 1px solid var(--onb-divider, rgba(0, 0, 0, 0.06));
}
@media (min-width: 1024px) {
  .onb-wizard {
    border-top: none;
    border-left: 1px solid var(--onb-divider, rgba(0, 0, 0, 0.06));
  }
}
.onb-noir .onb-wizard,
.onb-aeroplus .onb-wizard {
  --onb-wizard-bg: rgba(15, 17, 22, 0.72);
  --onb-divider: rgba(255, 255, 255, 0.08);
}
.onb-aeroplus .onb-wizard {
  --onb-wizard-bg: rgba(15, 17, 22, 0.55);
  backdrop-filter: blur(32px) saturate(200%);
  -webkit-backdrop-filter: blur(32px) saturate(200%);
}

.onb-rail-segment {
  background: rgba(127, 127, 127, 0.18);
}
.onb-rail-done {
  background: #3b82f6;
}
.onb-rail-current {
  background: linear-gradient(90deg, #3b82f6 50%, rgba(127, 127, 127, 0.18) 50%);
  background-size: 200% 100%;
  background-position: 100% 0;
  animation: onb-rail-fill 0.6s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
}
@keyframes onb-rail-fill {
  to {
    background-position: 0% 0;
  }
}

.onb-theme-card-active {
  opacity: 1;
  outline-color: #3b82f6;
  box-shadow: 0 8px 24px -10px rgba(59, 130, 246, 0.5);
}
.onb-theme-card-active .onb-theme-check {
  opacity: 0.8;
}
.onb-wp-card-active {
  opacity: 1;
  outline-color: #3b82f6;
}

.onb-summary {
  border-color: var(--onb-divider, rgba(0, 0, 0, 0.06));
}
.onb-summary li {
  border-color: var(--onb-divider, rgba(0, 0, 0, 0.06));
}
.onb-wizard-footer {
  border-color: var(--onb-divider, rgba(0, 0, 0, 0.06));
}

.onb-field-error {
  color: #ff4d4f;
}
.onb-field-error span {
  color: #ff4d4f;
}
.onb-noir .onb-field-error,
.onb-aeroplus .onb-field-error,
.onb-noir .onb-field-error span,
.onb-aeroplus .onb-field-error span {
  color: #ff7875;
}

::v-deep(.ant-form-item-explain),
::v-deep(.ant-form-item-explain-error) {
  min-height: 0 !important;
  color: inherit !important;
}
::v-deep(.ant-form-item) {
  margin-bottom: 1rem;
}
::v-deep(.ant-form-item-with-help) {
  margin-bottom: 1rem;
}

.scene-enter-active,
.scene-leave-active {
  transition:
    opacity 0.55s cubic-bezier(0.22, 0.61, 0.36, 1),
    transform 0.55s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.scene-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.scene-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.greet-enter-active,
.greet-leave-active {
  transition:
    opacity 0.35s ease,
    transform 0.45s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.greet-enter-from {
  opacity: 0;
  transform: translateY(0.4em);
}
.greet-leave-to {
  opacity: 0;
  transform: translateY(-0.3em);
}

.char-enter-active,
.char-leave-active {
  transition: opacity 0.25s ease;
  display: inline-block;
}
.char-enter-from,
.char-leave-to {
  opacity: 0;
}

.step-enter-active,
.step-leave-active {
  transition:
    opacity 0.35s ease,
    transform 0.4s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.step-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.step-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.onb-final-enter-active {
  transition: opacity 0.6s ease;
}
.onb-final-leave-active {
  transition: opacity 0.4s ease;
}
.onb-final-enter-from,
.onb-final-leave-to {
  opacity: 0;
}

.aero-veil-enter-active {
  transition: opacity 0.4s ease;
}
.aero-veil-leave-active {
  transition: opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.aero-veil-enter-from,
.aero-veil-leave-to {
  opacity: 0;
}

.splash-out-leave-active {
  transition:
    opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.85s cubic-bezier(0.4, 0, 0.2, 1);
}
.splash-out-leave-to {
  opacity: 0;
  transform: translateY(-48px) scale(1.04);
}

.onb-split-rising > * {
  animation: onb-split-rise 0.95s 0.18s cubic-bezier(0.22, 0.61, 0.36, 1) both;
}
@keyframes onb-split-rise {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.onb-splash-inner {
  animation: onb-splash-in 0.9s cubic-bezier(0.22, 0.61, 0.36, 1) both;
}
@keyframes onb-splash-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.onb-final-logo {
  animation: onb-final-logo-in 1.2s cubic-bezier(0.22, 0.61, 0.36, 1) both;
}
@keyframes onb-final-logo-in {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
.onb-final-cta {
  animation: onb-cta-in 1.4s 0.4s cubic-bezier(0.22, 0.61, 0.36, 1) both;
}
@keyframes onb-cta-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.onb-pixar-ball {
  position: absolute;
  left: 0;
  top: 0;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #ec4899 100%);
  box-shadow:
    0 0 14px rgba(99, 102, 241, 0.7),
    0 0 4px rgba(255, 255, 255, 0.5),
    inset 0 -1px 2px rgba(0, 0, 0, 0.25),
    inset 0 1px 1px rgba(255, 255, 255, 0.6);
  opacity: 0;
  pointer-events: none;
  transform: translate(0, 0);
  z-index: 2;
}

.onb-pixar-ball.is-running {
  animation: pixar-traverse 3.2s linear forwards;
}

@keyframes pixar-traverse {
  0% {
    left: -2%;
    transform: translateY(8px) scale(0.6);
    opacity: 0;
    animation-timing-function: ease-out;
  }
  4% {
    left: 2%;
    transform: translateY(0) scale(1);
    opacity: 1;
    animation-timing-function: ease-out;
  }

  9% {
    left: 8%;
    transform: translateY(-34px) scale(1.05, 0.95);
    animation-timing-function: ease-in;
  }
  14% {
    left: 16%;
    transform: translateY(0) scale(0.95, 1.08);
    animation-timing-function: ease-out;
  }

  19% {
    left: 24%;
    transform: translateY(-30px) scale(1.05, 0.95);
    animation-timing-function: ease-in;
  }
  24% {
    left: 34%;
    transform: translateY(0) scale(0.95, 1.08);
    animation-timing-function: ease-out;
  }

  29% {
    left: 44%;
    transform: translateY(-28px) scale(1.05, 0.95);
    animation-timing-function: ease-in;
  }
  35% {
    left: 56%;
    transform: translateY(0) scale(0.95, 1.08);
    animation-timing-function: ease-out;
  }

  41% {
    left: 73%;
    transform: translateY(-32px) scale(1.05, 0.95);
    animation-timing-function: ease-in;
  }
  50% {
    left: 92%;
    transform: translateY(0) scale(0.95, 1.08);
    animation-timing-function: ease-out;
  }

  56% {
    left: 105%;
    transform: translateY(-14px) scale(0.85);
    opacity: 0.6;
  }
  64% {
    left: 110%;
    transform: translateY(0) scale(0.5);
    opacity: 0;
  }
  100% {
    left: 110%;
    transform: translateY(0) scale(0.5);
    opacity: 0;
  }
}

.onb-splash-cta {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 1rem 2.5rem;
  border-radius: 999px;
  border: 1.5px solid;
  border-color: rgba(127, 127, 127, 0.45);
  background-color: transparent;
  color: inherit;
  font-size: 0.9375rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  cursor: pointer;
  overflow: hidden;
  isolation: isolate;
  transition:
    transform 0.3s cubic-bezier(0.22, 0.61, 0.36, 1),
    border-color 0.3s ease,
    background-color 0.3s ease;
  -webkit-tap-highlight-color: transparent;
}
.onb-noir .onb-splash-cta,
.onb-aeroplus .onb-splash-cta {
  border-color: rgba(255, 255, 255, 0.35);
}

.onb-splash-cta:hover {
  transform: translateY(-2px);
  border-color: rgba(127, 127, 127, 0.75);
  background-color: rgba(127, 127, 127, 0.05);
}
.onb-splash-cta:active {
  transform: translateY(0);
}

.onb-splash-cta-label {
  white-space: nowrap;
  position: relative;
}

.onb-splash-cta-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200%;
  aspect-ratio: 1 / 1;
  transform: translate(-50%, -50%);
  background: conic-gradient(from 0deg, transparent 0deg, #3b82f6 60deg, #6366f1 150deg, #ec4899 240deg, transparent 330deg);
  filter: blur(10px);
  opacity: 0.42;
  z-index: -1;
  animation: onb-cta-orbit 7s linear infinite;
  transition: opacity 0.3s ease;
  pointer-events: none;
}
.onb-splash-cta:hover .onb-splash-cta-orbit {
  opacity: 0.65;
}

@keyframes onb-cta-orbit {
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}
</style>
