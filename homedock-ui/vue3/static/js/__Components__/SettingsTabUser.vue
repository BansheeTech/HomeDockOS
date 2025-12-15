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

  <SettingsGroup header="TWO-FACTOR AUTHENTICATION" footer="Add an extra layer of security using an authenticator app.">
    <SettingsItem :icon="shieldLockIcon" icon-color="purple" title="Two-Factor Authentication" :description="is2FAEnabled ? 'Currently enabled' : 'Currently disabled'" :is-last="!is2FAEnabled">
      <Switch :checked="is2FAEnabled" :loading="loading2FA" @change="handle2FAToggle" />
    </SettingsItem>

    <SettingsItem v-if="is2FAEnabled" :icon="refreshIcon" icon-color="blue" title="Regenerate Backup Codes" description="Generate new backup codes (invalidates old ones)" is-last>
      <button type="button" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border" :class="[themeClasses.appPropsActionButtonBg, themeClasses.appPropsActionButtonBorder, themeClasses.appPropsActionButtonText, themeClasses.appPropsActionButtonBgHover, themeClasses.appPropsActionButtonBorderHover]" @click="openRegenerateModal">
        <Icon :icon="refreshIcon" width="14" height="14" />
        Regenerate
      </button>
    </SettingsItem>
  </SettingsGroup>

  <AppDialog v-model:visible="show2FASetupModal" :title="setupDialogTitle" :icon="shieldLockIcon" type="info" :width="480" :ok-text="setupDialogOkText" :cancel-text="setupStep === 2 ? 'Back' : 'Cancel'" :ok-cancel="setupStep === 2" :loading="verifying" :reverse-buttons="setupStep === 2" :close-on-ok="false" @ok="handleSetupDialogOk" @cancel="handleSetupDialogCancel">
    <div v-if="setupStep === 1" class="text-center">
      <p :class="[themeClasses.notTextDown]" class="mb-4 text-sm">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
      <img v-if="qrCodeData" :src="qrCodeData" alt="2FA QR Code" class="mx-auto mb-4 rounded-lg" style="max-width: 200px" />
      <div class="mb-2">
        <p :class="[themeClasses.notTextDown]" class="text-xs opacity-70 mb-2">Or enter this code manually:</p>
        <code :class="[themeClasses.settingsGroupFooter]" class="px-3 py-1.5 rounded text-sm select-all font-mono">{{ manualSecret }}</code>
      </div>
    </div>

    <div v-if="setupStep === 2">
      <p :class="[themeClasses.notTextDown]" class="mb-4 text-sm">Enter the 6-digit code from your authenticator app to verify setup:</p>
      <Input :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" v-model:value="verificationCode" placeholder="000000" :maxlength="6" size="large" class="text-center text-2xl" style="letter-spacing: 0.5em" @keyup.enter="verify2FASetup" />
    </div>

    <div v-if="setupStep === 3">
      <div class="flex items-center gap-2 mb-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
        <Icon :icon="checkCircleIcon" class="text-green-500" width="20" height="20" />
        <span :class="[themeClasses.notTextDown]" class="text-sm font-medium">2FA Enabled Successfully!</span>
      </div>
      <div class="flex items-center gap-2 mb-4 p-3 rounded-lg border" :class="[themeClasses.appPropsStatusWarningBg, themeClasses.appPropsStatusWarningBorder]">
        <Icon :icon="alertIcon" :class="[themeClasses.appPropsStatusWarningText]" width="20" height="20" />
        <span :class="[themeClasses.notTextDown]" class="text-sm">Save these backup codes securely. Each can only be used once.</span>
      </div>
      <div :class="[themeClasses.settingsGroupFooter]" class="grid grid-cols-2 gap-2 p-4 rounded-lg">
        <code v-for="code in backupCodes" :key="code" :class="[themeClasses.notTextDown]" class="text-center py-1.5 font-mono text-sm">{{ code }}</code>
      </div>
    </div>
  </AppDialog>

  <AppDialog v-model:visible="show2FADisableModal" title="Disable Two-Factor Authentication" :icon="shieldOffIcon" type="warning" :width="420" ok-text="Disable 2FA" cancel-text="Cancel" :ok-cancel="true" :loading="disabling" @ok="disable2FA" @cancel="show2FADisableModal = false">
    <div class="flex items-center gap-2 mb-4 p-3 rounded-lg border" :class="[themeClasses.appPropsStatusWarningBg, themeClasses.appPropsStatusWarningBorder]">
      <Icon :icon="alertIcon" :class="[themeClasses.appPropsStatusWarningText]" width="20" height="20" />
      <span :class="[themeClasses.notTextDown]" class="text-sm">This will reduce your account security.</span>
    </div>
    <p :class="[themeClasses.notTextDown]" class="mb-4 text-sm">Enter a verification code from your authenticator app or a backup code:</p>
    <Input :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" v-model:value="disableCode" placeholder="Enter code" size="large" @keyup.enter="disable2FA" />
  </AppDialog>

  <AppDialog v-model:visible="showRegenerateModal" :title="regenerateStep === 1 ? 'Regenerate Backup Codes' : 'New Backup Codes'" :icon="refreshIcon" :type="regenerateStep === 1 ? 'confirm' : 'success'" :width="420" :ok-text="regenerateStep === 1 ? 'Regenerate' : 'I\'ve saved my codes'" cancel-text="Cancel" :ok-cancel="regenerateStep === 1" :loading="regenerating" :close-on-ok="false" @ok="handleRegenerateOk" @cancel="closeRegenerateModal">
    <div v-if="regenerateStep === 1">
      <div class="flex items-center gap-2 mb-4 p-3 rounded-lg border" :class="[themeClasses.appPropsStatusWarningBg, themeClasses.appPropsStatusWarningBorder]">
        <Icon :icon="alertIcon" :class="[themeClasses.appPropsStatusWarningText]" width="20" height="20" />
        <span :class="[themeClasses.notTextDown]" class="text-sm">This will invalidate all existing backup codes.</span>
      </div>
      <p :class="[themeClasses.notTextDown]" class="mb-4 text-sm">Enter a verification code from your authenticator app:</p>
      <Input :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" v-model:value="regenerateCode" placeholder="Enter code" size="large" @keyup.enter="regenerateBackupCodes" />
    </div>

    <div v-if="regenerateStep === 2">
      <div class="flex items-center gap-2 mb-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
        <Icon :icon="checkCircleIcon" class="text-green-500" width="20" height="20" />
        <span :class="[themeClasses.notTextDown]" class="text-sm font-medium">Backup codes regenerated!</span>
      </div>
      <div class="flex items-center gap-2 mb-4 p-3 rounded-lg border" :class="[themeClasses.appPropsStatusWarningBg, themeClasses.appPropsStatusWarningBorder]">
        <Icon :icon="alertIcon" :class="[themeClasses.appPropsStatusWarningText]" width="20" height="20" />
        <span :class="[themeClasses.notTextDown]" class="text-sm">Save these backup codes securely. Each can only be used once.</span>
      </div>
      <div :class="[themeClasses.settingsGroupFooter]" class="grid grid-cols-2 gap-2 p-4 rounded-lg">
        <code v-for="code in newBackupCodes" :key="code" :class="[themeClasses.notTextDown]" class="text-center py-1.5 font-mono text-sm">{{ code }}</code>
      </div>
    </div>
  </AppDialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch, onMounted, inject, type Ref } from "vue";
import axios from "axios";
import QRCode from "qrcode";

import { useTheme } from "../__Themes__/ThemeSelector";
import { generateSecureBase32, generateTOTPUri, encryptTOTPSecret } from "../__Utils__/TwoFactorAuth";

import { Checkbox, Input, InputPassword, FormItem, Switch, message } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import accountIcon from "@iconify-icons/mdi/account";
import passIcon from "@iconify-icons/mdi/lock";
import lockOpenIcon from "@iconify-icons/mdi/lock-open";
import lockCheckIcon from "@iconify-icons/mdi/lock-check";
import alertIcon from "@iconify-icons/mdi/alert";
import shieldLockIcon from "@iconify-icons/mdi/shield-lock";
import shieldOffIcon from "@iconify-icons/mdi/shield-off";
import checkCircleIcon from "@iconify-icons/mdi/check-circle";
import refreshIcon from "@iconify-icons/mdi/refresh";

import SettingsGroup from "../__Components__/SettingsGroup.vue";
import SettingsItem from "../__Components__/SettingsItem.vue";
import AppDialog from "../__Components__/AppDialog.vue";

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

const csrfToken = inject<Ref<string>>("csrf-token");
const is2FAEnabled = ref<boolean>(false);
const loading2FA = ref<boolean>(false);
const show2FASetupModal = ref<boolean>(false);
const show2FADisableModal = ref<boolean>(false);
const setupStep = ref<number>(1);
const qrCodeData = ref<string>("");
const manualSecret = ref<string>("");
const verificationCode = ref<string>("");
const backupCodes = ref<string[]>([]);
const verifying = ref<boolean>(false);
const disabling = ref<boolean>(false);
const disableCode = ref<string>("");

const showRegenerateModal = ref<boolean>(false);
const regenerateStep = ref<number>(1);
const regenerating = ref<boolean>(false);
const regenerateCode = ref<string>("");
const newBackupCodes = ref<string[]>([]);

const setupDialogTitle = computed(() => {
  switch (setupStep.value) {
    case 1:
      return "Scan QR Code";
    case 2:
      return "Verify Code";
    case 3:
      return "Backup Codes";
    default:
      return "Enable 2FA";
  }
});

const setupDialogOkText = computed(() => {
  switch (setupStep.value) {
    case 1:
      return "I've scanned the code";
    case 2:
      return "Verify & Enable";
    case 3:
      return "I've saved my codes";
    default:
      return "OK";
  }
});

const handleSetupDialogOk = () => {
  switch (setupStep.value) {
    case 1:
      setupStep.value = 2;
      break;
    case 2:
      verify2FASetup();
      break;
    case 3:
      close2FASetupModal();
      break;
  }
};

const handleSetupDialogCancel = () => {
  if (setupStep.value === 2) {
    setupStep.value = 1;
  } else {
    close2FASetupModal();
  }
};

onMounted(async () => {
  try {
    const response = await axios.get("/api/2fa/status", {
      headers: { "X-HomeDock-CSRF-Token": csrfToken?.value },
    });
    is2FAEnabled.value = response.data.enabled;
  } catch (error) {
    console.error("Failed to fetch 2FA status:", error);
  }
});

const handle2FAToggle = (checked: boolean | string | number) => {
  if (checked) {
    open2FASetupModal();
  } else {
    open2FADisableModal();
  }
};

const open2FASetupModal = async () => {
  loading2FA.value = true;
  try {
    const secret = generateSecureBase32();
    const username = usernameValue.value || "user";
    const provisioningUri = generateTOTPUri(secret, username);

    qrCodeData.value = await QRCode.toDataURL(provisioningUri, { width: 200, margin: 2 });
    manualSecret.value = secret;
    setupStep.value = 1;
    show2FASetupModal.value = true;
  } catch (error: any) {
    message.error("Failed to initialize 2FA setup");
  } finally {
    loading2FA.value = false;
  }
};

const verify2FASetup = async () => {
  if (verificationCode.value.length !== 6) {
    message.warning("Please enter a 6-digit code");
    return;
  }

  verifying.value = true;
  try {
    const encryptedSecret = await encryptTOTPSecret(manualSecret.value, csrfToken?.value || "");

    const response = await axios.post(
      "/api/2fa/setup/verify",
      {
        code: verificationCode.value,
        encrypted_secret: encryptedSecret,
      },
      {
        headers: { "X-HomeDock-CSRF-Token": csrfToken?.value },
      }
    );

    backupCodes.value = response.data.backup_codes;
    is2FAEnabled.value = true;
    setupStep.value = 3;
  } catch (error: any) {
    message.error(error.response?.data?.error || "Invalid verification code");
  } finally {
    verifying.value = false;
  }
};

const close2FASetupModal = () => {
  show2FASetupModal.value = false;
  verificationCode.value = "";
  setupStep.value = 1;
};

const open2FADisableModal = () => {
  disableCode.value = "";
  show2FADisableModal.value = true;
};

const disable2FA = async () => {
  if (!disableCode.value) {
    message.warning("Please enter a verification code");
    return;
  }

  disabling.value = true;
  try {
    await axios.post(
      "/api/2fa/disable",
      { code: disableCode.value },
      {
        headers: { "X-HomeDock-CSRF-Token": csrfToken?.value },
      }
    );

    is2FAEnabled.value = false;
    show2FADisableModal.value = false;
    message.success("Two-factor authentication has been disabled");
  } catch (error: any) {
    message.error(error.response?.data?.error || "Failed to disable 2FA");
  } finally {
    disabling.value = false;
  }
};

const openRegenerateModal = () => {
  regenerateCode.value = "";
  regenerateStep.value = 1;
  newBackupCodes.value = [];
  showRegenerateModal.value = true;
};

const closeRegenerateModal = () => {
  showRegenerateModal.value = false;
  regenerateCode.value = "";
  regenerateStep.value = 1;
};

const handleRegenerateOk = () => {
  if (regenerateStep.value === 1) {
    regenerateBackupCodes();
  } else {
    closeRegenerateModal();
  }
};

const regenerateBackupCodes = async () => {
  if (!regenerateCode.value) {
    message.warning("Please enter a verification code");
    return;
  }

  regenerating.value = true;
  try {
    const response = await axios.post(
      "/api/2fa/regenerate-backup-codes",
      { code: regenerateCode.value },
      {
        headers: { "X-HomeDock-CSRF-Token": csrfToken?.value },
      }
    );

    newBackupCodes.value = response.data.backup_codes;
    regenerateStep.value = 2;
  } catch (error: any) {
    message.error(error.response?.data?.error || "Failed to regenerate backup codes");
  } finally {
    regenerating.value = false;
  }
};
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
