<!-- src/static/js/__Layouts__/Login.vue -->
<!-- Copyright © 2023-2025 Banshee -->
<!-- https://www.banshee.pro -->

<template>
  <AeroPlusWallpaper />
  <ScrollBarThemeLoader />
  <TopComment />
  <NetworkOffline />
  <SplashScreen />
  <StaticOscillatingLines />
  <div :class="[themeClasses.back]" class="flex items-center justify-center min-h-screen login-wrapper relative p-3 overflow-hidden">
    <div :class="{ bounce: isBouncing }" class="w-full max-w-xl">
      <div :class="[themeClasses.form]" class="group px-6 py-12 lg:px-12 rounded-3xl shadow-lg w-full relative z-10 container-scroller mb-2">
        <div class="flex mb-2">
          <BaseImage src="/images/logo_trans.svg" alt="Logo" :class="[themeClasses.logo]" class="h-20 hd-top-form-logo animate-pulse" />
        </div>
        <h2 :class="[themeClasses.mainText]" class="text-xl font-normal mb-2">Welcome to HomeDock OS</h2>
        <p :class="[themeClasses.subText]" class="font-light mb-6 leading-3">Sign in to continue</p>
        <Form layout="vertical" :model="formState" :rules="rules" @finish="handleFinish" @finishFailed="handleFinishFailed">
          <Form.Item name="username">
            <label class="text-gray-300" for="username">Username</label>
            <Input :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" class="h-10 group inputUser" autocomplete="username" v-model:value="formState.username" placeholder="Username..." :maxlength="30" :status="validationStatus" required @focus="showCloudInstances">
              <template #prefix>
                <Icon :icon="accountIcon" class="mr-0.5 transition duration-300" :class="[themeClasses.formIcon, { 'text-gray-300 group-hover:text-blue-500': validationStatus !== 'error', 'text-red-500': validationStatus === 'error' }]" width="16" height="16" />
              </template>
            </Input>
          </Form.Item>
          <div class="mt-2"></div>
          <Form.Item name="">
            <label class="text-gray-300" for="password">Password</label>
            <Input :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" class="h-10 group" autocomplete="current-password" v-model:value="formState.password" :type="passwordVisible ? 'text' : 'password'" placeholder="••••••••" :status="validationStatus" :maxlength="30" required @focus="showCloudInstances">
              <template #prefix>
                <Icon :icon="passIcon" class="mr-0.5 transition duration-300" :class="[themeClasses.formIcon, { 'text-gray-300 group-hover:text-blue-500': validationStatus !== 'error', 'text-red-500': validationStatus === 'error' }]" width="16" height="16" />
              </template>
              <template #suffix>
                <Button class="mb-1 transition duration-300" :class="{ 'text-gray-300 group-hover:text-blue-500': validationStatus !== 'error', 'text-red-500': validationStatus === 'error' }" type="link" @click="togglePasswordVisibility" icon>
                  <Icon :icon="openEye" v-if="passwordVisible" class="mt-1" />
                  <Icon :icon="closedEye" v-else class="mt-1" />
                </Button>
              </template>
            </Input>
          </Form.Item>
          <Button id="main_button_login" @click="triggerBounce" :class="{ clicked: isLoginSuccessful }" :loading="isSubmitting" type="primary" htmlType="submit" class="w-full flex items-center justify-center h-14 mt-8 relative overflow-hidden border-0 disabled:bg-blue-400 disabled:cursor-pointer disabled:text-white" :disabled="isSubmitting || isLoginSuccessful">
            <div v-if="!isLoginSuccessful" class="flex items-center justify-center">
              <Icon :icon="passIcon" class="text-white" width="16" height="16" />
              <span class="ml-1">Sign In</span>
            </div>
            <span v-else>
              <Icon :icon="loadingIcon" class="text-white animate-spin" width="26" height="26" />
            </span>
          </Button>
          <Transition name="slide-down-error">
            <p v-if="remainingAttempts !== null" :class="[themeClasses.subText, 'animated-attempts']" class="text-xs mt-2">Remaining attempts: {{ remainingAttempts }}</p>
          </Transition>
        </Form>
      </div>
      <CloudInstances :isVisible="cloudInstancesVisible" @update:isVisible="cloudInstancesVisible = $event" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";
import { useTheme } from "../__Themes__/ThemeSelector";

import axios from "axios";
import { AxiosError } from "axios";

import { Icon } from "@iconify/vue";
import accountIcon from "@iconify-icons/mdi/account";
import passIcon from "@iconify-icons/mdi/lock";
import openEye from "@iconify-icons/mdi/eye-outline";
import closedEye from "@iconify-icons/mdi/eye-closed";
import loadingIcon from "@iconify-icons/mdi/loading";

import { Form, Input, Button } from "ant-design-vue";
import { message } from "ant-design-vue";
import type { Rule } from "ant-design-vue/es/form";

import AeroPlusWallpaper from "../__Components__/AeroPlusWallpaper.vue";
import ScrollBarThemeLoader from "../__Components__/ScrollBarThemeLoader.vue";
import TopComment from "../__Components__/TopComment.vue";
import BaseImage from "../__Components__/BaseImage.vue";
import StaticOscillatingLines from "../__Components__/StaticOscillatingLines.vue";
import SplashScreen from "../__Components__/SplashScreen.vue";
import CloudInstances from "../__Components__/CloudInstances.vue";
import NetworkOffline from "../__Components__/NetworkOffline.vue";

const formState = ref({
  username: "",
  password: "",
});

const isBouncing = ref(false);

const triggerBounce = () => {
  if (isBouncing.value) return;

  isBouncing.value = true;

  setTimeout(() => {
    isBouncing.value = false;
  }, 1000);
};

const rules: Record<string, Rule[]> = {
  username: [{ required: true, message: "Username is required", trigger: "blur" }],
  password: [{ required: true, message: "Password is required", trigger: "blur" }],
};

const passwordVisible = ref<boolean>(false);
const cloudInstancesVisible = ref<boolean>(false);
const isSubmitting = ref<boolean>(false);
const csrfToken = ref<string | null>(document.querySelector('meta[name="homedock_csrf_token"]')?.getAttribute("content") || null);
const validationStatus = ref<"error" | "warning" | undefined>(undefined);
const remainingAttempts = ref<number | null>(null);
const isLoginSuccessful = ref<boolean>(false);
const { themeClasses } = useTheme();

const togglePasswordVisibility = (): void => {
  passwordVisible.value = !passwordVisible.value;
};

const showCloudInstances = (): void => {
  cloudInstancesVisible.value = true;
};

const handleFinish = async () => {
  if (!csrfToken.value) {
    message.error("CSRF token missing.");
    return;
  }

  if (isSubmitting.value || isLoginSuccessful.value) return;

  isSubmitting.value = true;

  try {
    // 1 Clave pública RSA + Token from Back
    const publicKeyResponse = await axios.get("/api/pksend", {
      headers: {
        "Content-Type": "application/json",
        "X-HomeDock-CSRF-Token": csrfToken.value,
      },
    });

    const pemPublicKey = publicKeyResponse.data.public_key;
    const token = publicKeyResponse.data.token;
    if (!pemPublicKey || !token) {
      throw new Error("Public Key or token not found in response.");
    }

    // 2 Cypher password with RSA
    const forge = (await import("node-forge")).default;
    const encoder = new TextEncoder();
    const encodedPassword = encoder.encode(formState.value.password);
    const binaryStringPassword = Array.from(encodedPassword)
      .map((byte) => String.fromCharCode(byte))
      .join("");

    const publicKey = forge.pki.publicKeyFromPem(pemPublicKey);
    const encryptedPassword = publicKey.encrypt(binaryStringPassword, "RSA-OAEP", {
      md: forge.md.sha256.create(),
      mgf1: { md: forge.md.sha256.create() },
    });

    const encryptedPasswordBase64 = forge.util.encode64(encryptedPassword);

    // 3 Encrypt password with pcrypt
    const pcryptResponse = await axios.post(
      "/api/pcrypt",
      {
        token: token,
        password: encryptedPasswordBase64,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-HomeDock-CSRF-Token": csrfToken.value,
        },
      }
    );

    if (pcryptResponse.data.status !== "success") {
      message.error(pcryptResponse.data.message || "Error encrypting password.");
      return;
    }

    // 4 Login Push
    const loginResponse = await axios.post(
      "/login",
      {
        token: token,
        username: formState.value.username,
        homedock_csrf_token: csrfToken.value,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-HomeDock-CSRF-Token": csrfToken.value,
        },
      }
    );

    if (loginResponse.data.message) {
      if (loginResponse.data.status === "success") {
        message.success(loginResponse.data.message);

        isLoginSuccessful.value = true;

        setTimeout(() => {
          window.location.href = loginResponse.data.redirect_url;
        }, 2500);
      } else {
        if (loginResponse.data.remaining_attempts !== undefined) {
          remainingAttempts.value = loginResponse.data.remaining_attempts;
        }

        message.error(loginResponse.data.message);
        validationStatus.value = "error";
      }
    } else {
      message.error("Unexpected error, please contact support.");
    }

    if (loginResponse.data.redirect_url) {
      setTimeout(() => {
        window.location.href = loginResponse.data.redirect_url;
      }, 2500);
      return;
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response && error.response.data) {
        const { message: backendMessage, redirect_url } = error.response.data;

        if (backendMessage) {
          message.error(backendMessage);
          validationStatus.value = "error";
        }

        if (error.response.data.remaining_attempts !== undefined) {
          remainingAttempts.value = error.response.data.remaining_attempts;
        }

        if (redirect_url) {
          setTimeout(() => {
            window.location.href = redirect_url;
          }, 2500);

          return;
        }
      } else {
        console.error("There was an error while signing in:", error);
        message.error("There was an error while signing in.");
      }
    }
  } finally {
    isSubmitting.value = false;
  }
};

watch(remainingAttempts, () => {
  const element = document.querySelector(".animated-attempts");
  if (element) {
    element.classList.add("updated");
    setTimeout(() => element.classList.remove("updated"), 300);
  }
});

const handleFinishFailed = (errors: any): void => {
  console.log("Validation failed:", errors);
};
</script>

<style scoped>
#main_button_login {
  position: relative;
  overflow: hidden;
  z-index: 1;
  width: 100%;
}

#main_button_login::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgb(50, 50, 50);
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.4s ease-in-out;
  z-index: -1;
}

#main_button_login.clicked::before {
  transform: scaleX(1);
  transform-origin: center;
}

/* Bounce Effect */
@keyframes bounce-effect {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.bounce {
  animation: bounce-effect 0.3s ease;
  z-index: 1;
}

/* Animated Attempts */
.animated-attempts {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.animated-attempts.updated {
  opacity: 0.5;
  transform: translateY(-5px);
}

/* Slide Down Error Transition */
.slide-down-error-enter-active,
.slide-down-error-leave-active {
  transition: height 0.3s ease, opacity 0.3s ease;
}

.slide-down-error-enter-from,
.slide-down-error-leave-to {
  height: 0;
  opacity: 0;
  overflow: hidden;
}

.slide-down-error-enter-to,
.slide-down-error-leave-from {
  height: auto;
  opacity: 1;
}

/* Custom styles for AntD Comps */

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

::v-deep(.white-mode-theme input:autofill) {
  background-color: transparent !important;
  box-shadow: 0 0 0 1000px rgb(255, 255, 255) inset !important;
  -webkit-text-fill-color: #000000 !important;
}

::v-deep(.dark-mode-theme input:autofill) {
  background-color: transparent !important;
  box-shadow: 0 0 0 1000px rgb(39, 39, 42) inset !important;
  -webkit-text-fill-color: #fff !important;
}

::v-deep(.white-mode-theme input:autofill:hover) {
  box-shadow: 0 0 0 1000px rgb(255, 255, 255) inset !important;
}

::v-deep(.dark-mode-theme input:autofill:hover) {
  box-shadow: 0 0 0 1000px rgb(39, 39, 42) inset !important;
}
</style>
