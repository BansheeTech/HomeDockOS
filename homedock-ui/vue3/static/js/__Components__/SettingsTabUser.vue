<!-- homedock-ui/vue3/static/js/__Components__/SettingsTabUser.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <SettingsGroup header="USER ACCOUNT" footer="Your account identifier for logging into HomeDock OS.">
    <SettingsItem :icon="accountIcon" icon-color="blue" title="Username" description="Must be alphanumeric only (a-z, A-Z, 0-9)">
      <FormItem :validate-status="isUsernameValid ? 'success' : 'error'" class="mb-0">
        <template #help>
          <div v-if="!isUsernameValid" class="flex items-center text-xs mt-1">
            <Icon :icon="alertIcon" size="14px" color="#FF4D4F" class="mr-1" />
            <span>{{ usernameErrorMessage }}</span>
          </div>
        </template>

        <Input :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" v-model:value="usernameValue" placeholder="Username..." :maxlength="30" autocomplete="username" name="FormInputUsername" id="FormInputUsername" style="width: 240px" />
      </FormItem>
    </SettingsItem>
  </SettingsGroup>

  <SettingsGroup header="SECURITY" footer="Change your account password. Minimum 6 characters required.">
    <div class="px-4 py-3">
      <Checkbox :class="[themeClasses.scopeSelector, themeClasses.userCheckboxScope]" v-model:checked="passwordCheckbox">
        <div class="flex items-center gap-2">
          <Icon :icon="passIcon" class="text-red-500" size="18px" />
          <span :class="[themeClasses.settingsItemTitle]">Change Password</span>
        </div>
      </Checkbox>
    </div>
  </SettingsGroup>

  <Transition name="fade-slide">
    <SettingsGroup v-if="passwordCheckbox" header="NEW PASSWORD">
      <SettingsItem :icon="lockOpenIcon" icon-color="orange" title="New Password" description="Minimum 6 characters">
        <FormItem :validate-status="isPasswordValid ? 'success' : 'error'" class="mb-0">
          <template #help>
            <div v-if="!isPasswordValid" class="flex items-center text-xs mt-1">
              <Icon :icon="alertIcon" size="14px" color="#FF4D4F" class="mr-1" />
              <span>{{ passwordErrorMessage }}</span>
            </div>
          </template>

          <InputPassword :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" v-model:value="passwordValue" placeholder="Password..." :maxlength="30" autocomplete="new-password" name="FormInputPassword" id="FormInputPassword" style="width: 240px" />
        </FormItem>
      </SettingsItem>

      <SettingsItem :icon="lockCheckIcon" icon-color="green" title="Confirm Password" description="Must match new password" is-last>
        <FormItem :validate-status="isConfirmPasswordValid ? 'success' : 'error'" class="mb-0">
          <template #help>
            <div v-if="!isConfirmPasswordValid" class="flex items-center text-xs mt-1">
              <Icon :icon="alertIcon" size="14px" color="#FF4D4F" class="mr-1" />
              <span>{{ confirmPasswordErrorMessage }}</span>
            </div>
          </template>

          <InputPassword :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" v-model:value="confirmPassword" placeholder="Confirm password..." :maxlength="30" autocomplete="new-password" name="FormConfirmPassword" id="FormConfirmPassword" style="width: 240px" />
        </FormItem>
      </SettingsItem>
    </SettingsGroup>
  </Transition>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import { Checkbox, Input, InputPassword, FormItem } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import accountIcon from "@iconify-icons/mdi/account";
import passIcon from "@iconify-icons/mdi/lock";
import lockOpenIcon from "@iconify-icons/mdi/lock-open";
import lockCheckIcon from "@iconify-icons/mdi/lock-check";
import alertIcon from "@iconify-icons/mdi/alert";

import SettingsGroup from "../__Components__/SettingsGroup.vue";
import SettingsItem from "../__Components__/SettingsItem.vue";

const { themeClasses } = useTheme();

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

const usernameValue = ref<string>(props.modelValue.username || "");
const passwordCheckbox = ref<boolean>(props.modelValue.changePassword || false);
const passwordValue = ref<string>(props.modelValue.password || "");
const confirmPassword = ref<string>(props.modelValue.confirmPassword || "");

const isUsernameValid = computed(() => /^[a-zA-Z0-9]+$/.test(usernameValue.value));

const usernameErrorMessage = computed(() => {
  if (!usernameValue.value) return "Username can't be blank!";
  if (usernameValue.value.length > 30) return "Username can't exceed 30 characters";
  if (!isUsernameValid.value) return "Only upper or lowercase letters and numbers";
  return "";
});

const isPasswordValid = computed(() => {
  return passwordValue.value.length >= 6 && passwordValue.value.length <= 30;
});

const passwordErrorMessage = computed(() => {
  if (!passwordValue.value) return "Password can't be blank!";
  if (passwordValue.value.length < 6) return "Must be at least 6 characters long.";
  if (passwordValue.value.length > 30) return "Password can't exceed 30 characters.";
  return "";
});

const isConfirmPasswordValid = computed(() => {
  return confirmPassword.value === passwordValue.value && confirmPassword.value.length > 0;
});

const confirmPasswordErrorMessage = computed(() => {
  if (!confirmPassword.value) return "Confirm password can't be blank!";
  if (confirmPassword.value !== passwordValue.value) return "Passwords do not match.";
  return "";
});

watch(
  () => ({
    username: usernameValue.value,
    changePassword: passwordCheckbox.value,
    password: passwordValue.value,
    confirmPassword: confirmPassword.value,
  }),
  (newValue) => {
    emit("update:modelValue", newValue);
  },
  { deep: true }
);
</script>

<style scoped>
/* Animation Styles */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.5s, transform 0.5s, max-height 0.5s ease-in-out;
  overflow: hidden;
  min-height: 0;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
  max-height: 0;
}

.fade-slide-enter-to,
.fade-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 1000px;
}

/* Fix checkbox visibility in default (white) theme */
.white-mode-theme :deep(.ant-checkbox-checked .ant-checkbox-inner) {
  background-color: #1677ff !important;
  border-color: #1677ff !important;
}

.white-mode-theme :deep(.ant-checkbox-wrapper:hover .ant-checkbox-inner),
.white-mode-theme :deep(.ant-checkbox:hover .ant-checkbox-inner) {
  border-color: #1677ff !important;
}

.white-mode-theme :deep(.ant-checkbox-inner) {
  border-color: #d9d9d9 !important;
}
</style>
