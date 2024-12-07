<!-- src/static/js/__Components__/SettingsTabUser.vue -->
<!-- Copyright © 2023-2024 Banshee -->
<!-- https://www.banshee.pro -->

<template>
  <SettingsBoxFold>
    <label for="FormInputUsername" class="block font-medium mb-2">
      <SettingsSeparator :class="[themeClasses.formInputSet]" text="Username" :mdi_icon="accountIcon" />
    </label>

    <FormItem :validate-status="isUsernameValid ? 'success' : 'error'">
      <template #help>
        <div v-if="!isUsernameValid" class="flex items-center">
          <Icon :icon="alertIcon" size="18px" color="#FF4D4F" class="mr-1" />
          <span>{{ usernameErrorMessage }}</span>
        </div>
      </template>

      <Input :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" v-model:value="usernameValue" placeholder="Username..." :maxlength="30" autocomplete="username" name="FormInputUsername" id="FormInputUsername">
        <template #prefix>
          <Icon :icon="accountIcon" :class="[themeClasses.formIcon]" size="18px" class="mr-1" />
        </template>
      </Input>
    </FormItem>
  </SettingsBoxFold>

  <Checkbox :class="[themeClasses.scopeSelector]" class="mb-2" v-model:checked="passwordCheckbox">
    <div :class="[themeClasses.userCheckboxScope]">Change password?</div>
  </Checkbox>

  <Transition name="fade-slide">
    <SettingsBoxFold v-if="passwordCheckbox">
      <FormItem :validate-status="isPasswordValid ? 'success' : 'error'">
        <label for="FormInputPassword" class="block font-medium mb-2">
          <SettingsSeparator :class="[themeClasses.formInputSet]" text="Password" :mdi_icon="passIcon" />
        </label>

        <template #help>
          <div v-if="!isPasswordValid" class="flex items-center">
            <Icon :icon="alertIcon" size="18px" color="#FF4D4F" class="mr-1" />
            <span>{{ passwordErrorMessage }}</span>
          </div>
        </template>

        <InputPassword :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" v-model:value="passwordValue" placeholder="Password..." :maxlength="30" autocomplete="password" name="FormInputPassword" id="FormInputPassword">
          <template #prefix>
            <Icon :icon="passIcon" :class="[themeClasses.formIcon]" size="18px" class="mr-1" />
          </template>
        </InputPassword>
      </FormItem>

      <FormItem :validate-status="isConfirmPasswordValid ? 'success' : 'error'">
        <label for="FormConfirmPassword" class="block font-medium mb-2 mt-4">
          <SettingsSeparator :class="[themeClasses.formInputSet]" text="Confirm Password" :mdi_icon="passIcon" />
        </label>

        <template #help>
          <div v-if="!isConfirmPasswordValid" class="flex items-center">
            <Icon :icon="alertIcon" size="18px" color="#FF4D4F" class="mr-1" />
            <span>{{ confirmPasswordErrorMessage }}</span>
          </div>
        </template>

        <InputPassword :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" v-model:value="confirmPassword" placeholder="Confirm password..." :maxlength="30" autocomplete="password" name="FormConfirmPassword" id="FormConfirmPassword">
          <template #prefix>
            <Icon :icon="passIcon" :class="[themeClasses.formIcon]" size="18px" class="mr-1" />
          </template>
        </InputPassword>
      </FormItem>
    </SettingsBoxFold>
  </Transition>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import { Checkbox, Input, InputPassword, FormItem } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import accountIcon from "@iconify-icons/mdi/account";
import passIcon from "@iconify-icons/mdi/lock";
import alertIcon from "@iconify-icons/mdi/alert";

import SettingsBoxFold from "../__Components__/SettingsBoxFold.vue";
import SettingsSeparator from "../__Components__/SettingsSeparator.vue";

const { themeClasses } = useTheme();

// Props & Emit
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

// Reactive References
const usernameValue = ref<string>(props.modelValue.username || "");
const passwordCheckbox = ref<boolean>(props.modelValue.changePassword || false);
const passwordValue = ref<string>(props.modelValue.password || "");
const confirmPassword = ref<string>(props.modelValue.confirmPassword || "");

// Reactive Validation
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

// Sync modelValue with reactive references
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
</style>
