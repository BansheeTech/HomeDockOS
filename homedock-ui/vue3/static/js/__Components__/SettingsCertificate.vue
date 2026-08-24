<!-- homedock-ui/vue3/static/js/__Components__/SettingsCertificate.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <SettingsGroup :header="$t('HTTPS AND ONSCREEN APPS')" :footer="$t('OnScreen Apps only open when the browser trusts the certificate covering their subdomains.')">
    <SettingsItem :icon="statusIcon" :icon-color="statusColor" :title="statusTitle" :description="statusDescription">
      <template #badge>
        <SettingsHelpTooltip :text="$t('Reads the certificate on disk, which is not always the one being served. A renewed one takes over on its own, with nothing to restart. The very first one is different: HomeDock OS was running without encryption, so there is nothing to swap and it only takes effect on the next start. A self-signed certificate counts as installed, but no browser trusts it and an OnScreen App cannot ask you to accept it.')" />
      </template>
    </SettingsItem>

    <SettingsItem :icon="globeIcon" icon-color="cyan" :title="$t('Hostname')" :description="$t('The address you reach HomeDock OS with, and the name the certificate is issued for')" :is-last="!showForm && !showLocalHttp">
      <template #badge>
        <SettingsHelpTooltip :text="$t('OnScreen Apps live on subdomains of this name, so it has to be a domain you own. A free dynamic DNS name works. Leave the factory value and HomeDock OS adopts whatever address you browse it by.')" />
      </template>
      <Input :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :value="domain" @update:value="(value: string) => emit('update:domain', value)" name="FormInputDynamicDNS" id="FormInputDynamicDNS" :placeholder="$t('get.homedock.cloud')" style="width: 280px" />
    </SettingsItem>

    <template v-if="showForm">
      <SettingsItem :icon="dnsIcon" icon-color="purple" :title="$t('DNS provider')" :description="providerHint">
        <template #badge>
          <SettingsHelpTooltip :text="$t('Let\'s Encrypt proves you own the domain by reading a record it asks you to publish. HomeDock OS publishes it through your provider, so nothing has to be reachable from the internet and no ports need opening.')" />
        </template>
        <template #after-description>
          <Transition name="restart-badge">
            <span v-if="provider === 'cloudflare'" class="inline-block text-[8px] font-semibold uppercase tracking-wide px-1.5 py-px rounded-md bg-amber-400/15 text-amber-400">{{ $t("Must be an API Token, not Global API Key") }}</span>
          </Transition>
        </template>
        <Select class="rounded-xl" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" v-model:value="provider" name="FormInputAcmeProvider" id="FormInputAcmeProvider" :popup-class-name="themeClasses.scopeSelector" :show-search="false" style="width: 180px">
          <SelectOption :class="[themeClasses.scopeSelector]" v-for="name in status?.providers ?? []" :key="name" :value="name">
            {{ status?.provider_labels?.[name] ?? name }}
          </SelectOption>
        </Select>
      </SettingsItem>

      <SettingsItem :icon="keyIcon" icon-color="orange" :title="$t('Provider token')" :description="tokenDescription">
        <template #badge>
          <SettingsHelpTooltip :text="$t('It can rewrite your DNS, so it is stored on this machine and never sent back to the browser. Changing provider asks for it again: a token belongs to the service it was issued by.')" />
        </template>
        <InputPassword :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" v-model:value="token" :placeholder="savedTokenApplies ? '••••••••••••' : $t('API token')" style="width: 280px" autocomplete="off" />
      </SettingsItem>

      <SettingsItem :icon="flaskIcon" icon-color="gray" :title="$t('Test run')" :description="$t('Check the setup without installing anything')">
        <template #badge>
          <SettingsHelpTooltip :text="$t('Runs against the Let\'s Encrypt staging server, so nothing lands on disk. Let\'s Encrypt allows five real certificates per week for the same name and test runs do not count, so use this while you are still getting the provider and the token right.')" />
        </template>
        <Switch v-model:checked="staging" />
      </SettingsItem>

      <SettingsItem :icon="certIcon" icon-color="green" :title="$t('Issue certificate')" :description="issueDescription" :is-last="!showLocalHttp">
        <template #badge>
          <SettingsHelpTooltip :text="issueDetail" />
        </template>
        <button type="button" :disabled="!canIssue" class="flex items-center justify-center gap-1.5 h-9 px-5 rounded-xl text-sm font-medium border transition-all duration-200" :class="blocked ? 'issue-btn-blocked' : [themeClasses.appPropsActionButtonPrimaryBg, themeClasses.appPropsActionButtonPrimaryBorder, themeClasses.appPropsActionButtonPrimaryText, busy ? 'issue-btn-busy' : themeClasses.appPropsActionButtonPrimaryBgHover, busy ? '' : themeClasses.appPropsActionButtonPrimaryBorderHover]" @click="issue">
          <Icon :icon="busy ? loadingIcon : certIcon" width="15" height="15" :class="busy ? 'animate-spin' : ''" />
          <span>{{ busy ? $t("Working...") : $t("Issue certificate") }}</span>
        </button>
      </SettingsItem>
    </template>

    <SettingsItem v-if="showIpSync" :icon="syncIcon" icon-color="green" :title="$t('Automatic IP updates')" :description="ipSyncDescription" :is-last="!showLocalHttp">
      <template #badge>
        <SettingsHelpTooltip :text="ipSyncDetail" />
      </template>
      <Switch :checked="ipSync" @update:checked="(value: unknown) => emit('update:ipSync', Boolean(value))" name="FormInputDynamicDnsSync" id="FormInputDynamicDnsSync" />
    </SettingsItem>

    <SettingsItem v-if="showLocalHttp" :icon="lanIcon" icon-color="orange" :title="$t('Plain HTTP on the local network')" :description="$t('Plain HTTP for local addresses')" is-last>
      <template #badge>
        <SettingsHelpTooltip :text="$t('OnScreen Apps on homedock.localhost work over plain HTTP, and homedock.local is served without a certificate warning. Your session travels unencrypted, on the local network only.')" />
      </template>
      <template #after-description>
        <Transition name="restart-badge">
          <span v-if="localHttpChanged" class="inline-block text-[8px] font-semibold uppercase tracking-wide px-1.5 py-px rounded-md bg-blue-400/15 text-blue-400">{{ $t("Requires Restart") }}</span>
        </Transition>
      </template>
      <Switch :checked="localHttp" @update:checked="(value: unknown) => emit('update:localHttp', Boolean(value))" name="FormInputLocalHttpAccess" id="FormInputLocalHttpAccess" />
    </SettingsItem>
  </SettingsGroup>
</template>

<script lang="ts" setup>
import { ref, computed, inject, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import axios from "axios";

import { Input, Select, Switch, message } from "ant-design-vue";

import { Icon } from "@iconify/vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";

import certIcon from "@iconify-icons/mdi/certificate";
import dnsIcon from "@iconify-icons/mdi/dns";
import keyIcon from "@iconify-icons/mdi/key-variant";
import flaskIcon from "@iconify-icons/mdi/flask-outline";
import alertIcon from "@iconify-icons/mdi/alert";
import checkIcon from "@iconify-icons/mdi/check-decagram";
import lockIcon from "@iconify-icons/mdi/lock-alert";
import lanIcon from "@iconify-icons/mdi/lan-connect";
import syncIcon from "@iconify-icons/mdi/sync";
import globeIcon from "@iconify-icons/mdi/globe";
import restartIcon from "@iconify-icons/mdi/restart";
import loadingIcon from "@iconify-icons/mdi/loading";

import SettingsGroup from "./SettingsGroup.vue";
import SettingsItem from "./SettingsItem.vue";
import SettingsHelpTooltip from "./SettingsHelpTooltip.vue";

const InputPassword = Input.Password;
const SelectOption = Select.Option;

const { t } = useI18n();
const { themeClasses } = useTheme();
const csrfToken = useCsrfToken();

const updateSettings = inject<(settings: Record<string, unknown>) => void>("update-settings");

const PROVIDER_EXAMPLE: Record<string, string> = {
  freemyip: "yourname.freemyip.com",
  duckdns: "yourname.duckdns.org",
  cloudflare: "home.yourdomain.com",
};

interface CertificateState {
  ssl: boolean;
  self_signed: boolean;
  covers_apps: boolean;
  covers_domain: boolean;
  restart_pending: boolean;
  context_active: boolean;
  domains: string[];
  expires_in_days: number | null;
}

interface AcmeStatus {
  providers: string[];
  provider_labels: Record<string, string>;
  provider: string;
  token_set: boolean;
  domain: string;
  host: string;
  certificate: CertificateState;
  state: { running: boolean; step: string; error: string | null; staging: boolean };
  ip_sync: { available: boolean; enabled: boolean; error: string | null; ip: string | null; synced_at: string | null };
}

const props = defineProps({
  domain: {
    type: String,
    default: "",
  },
  localHttp: {
    type: Boolean,
    default: false,
  },
  localHttpChanged: {
    type: Boolean,
    default: false,
  },
  reverseProxy: {
    type: Boolean,
    default: false,
  },
  ipSync: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:localHttp", "update:domain", "update:ipSync"]);

// HDOS00109
const showIpSync = computed(() => Boolean(status.value?.ip_sync?.available));

const ipSyncDescription = computed(() => {
  const sync = status.value?.ip_sync;

  if (sync?.error) return t("The last update failed");
  if (sync?.enabled && sync?.ip) return t("{domain} points at {ip}", { domain: targetDomain.value, ip: sync.ip });

  return t("Keeps your domain pointing here");
});

const ipSyncDetail = computed(() => {
  const sync = status.value?.ip_sync;

  if (sync?.error) return t("The last update failed: {error}", { error: sync.error });

  return t("Dynamic DNS. When your provider changes your IP, the record follows it, so the certificate and the app addresses keep working. Checked every 15 minutes.");
});

const status = ref<AcmeStatus | null>(null);
const provider = ref<string>("");
const token = ref<string>("");
const staging = ref<boolean>(false);

const RESERVED = /(^|\.)homedock\.cloud$/i;

const targetDomain = computed(() => props.domain.trim().toLowerCase().replace(/^\*\./, "").replace(/\/.*$/, "").replace(/\.+$/, ""));

const domainIsReserved = computed(() => RESERVED.test(targetDomain.value));

const domainIsUsable = computed(() => targetDomain.value.includes(".") && !domainIsReserved.value);

let timer: number | undefined;

const busy = computed(() => Boolean(status.value?.state?.running));

const providerHint = computed(() => {
  const example = PROVIDER_EXAMPLE[provider.value];

  return example ? t("Who answers for the domain above. Hostnames look like {example}", { example }) : t("Who answers for the domain above");
});

const settled = computed(() => {
  const cert = status.value?.certificate;
  return Boolean(cert?.ssl && !cert.self_signed && (cert.covers_domain || cert.covers_apps));
});

const needsRestart = computed(() => Boolean(settled.value && status.value?.certificate?.restart_pending));

const browsingElsewhere = computed(() => Boolean(settled.value && !status.value?.certificate?.covers_apps));

const lastError = computed(() => (busy.value ? null : status.value?.state?.error || null));

const renewalFailed = computed(() => Boolean(settled.value && lastError.value));

const testPassed = computed(() => Boolean(!busy.value && !lastError.value && status.value?.state?.staging && status.value?.state?.step === "done"));

const showForm = computed(() => !settled.value || busy.value || Boolean(lastError.value));

const showLocalHttp = computed(() => {
  const cert = status.value?.certificate;
  if (!cert?.ssl || props.reverseProxy) return false;

  if (RESERVED.test(status.value?.host ?? "")) return false;

  // HDOS00104
  return !(cert.domains ?? []).some((name) => name.toLowerCase() === "*.homedock.localhost");
});

const savedTokenApplies = computed(() => Boolean(status.value?.token_set && provider.value && provider.value === (status.value?.provider || "").trim().toLowerCase()));

const hasToken = computed(() => Boolean(token.value || savedTokenApplies.value));

const requirementsMet = computed(() => Boolean(provider.value && hasToken.value && domainIsUsable.value));

const canIssue = computed(() => requirementsMet.value && !busy.value);

const blocked = computed(() => !busy.value && !requirementsMet.value);

const restartAfterIssue = computed(() => Boolean(status.value && !status.value.certificate.context_active && !props.reverseProxy));

const issueDescription = computed(() => {
  if (domainIsReserved.value) return t("Set your own domain in Hostname above — {domain} belongs to HomeDock OS.", { domain: targetDomain.value });
  if (!targetDomain.value.includes(".")) return t("Set the domain you reach HomeDock OS with in Hostname above.");
  if (!hasToken.value) return t("Add the token for your DNS provider above to issue the certificate.");

  return t("For {domain} and {record}", { domain: targetDomain.value, record: `*.${targetDomain.value}` });
});

const issueDetail = computed(() => {
  const base = t("Takes a few minutes: the record has to travel across the DNS before Let's Encrypt reads it. A wildcard covering every app subdomain is issued, and renewal from then on is automatic, thirty days before it expires.");

  return restartAfterIssue.value ? `${base} ${t("This first one only starts being served after a restart.")}` : base;
});

const tokenDescription = computed(() => (savedTokenApplies.value ? t("A token is already saved. Leave it empty to keep it.") : t("Never leaves this device except to your DNS provider")));

const statusIcon = computed(() => {
  if (busy.value) return dnsIcon;
  if (lastError.value) return alertIcon;
  if (needsRestart.value) return restartIcon;
  if (testPassed.value || settled.value) return checkIcon;
  return status.value?.certificate?.ssl ? lockIcon : alertIcon;
});

const statusColor = computed(() => {
  if (busy.value) return "blue";
  if (renewalFailed.value) return "orange";
  if (lastError.value) return "red";
  if (needsRestart.value) return "blue";
  if (testPassed.value || settled.value) return "green";
  return status.value?.certificate?.ssl ? "orange" : "gray";
});

const statusTitle = computed(() => {
  if (busy.value) return t("Requesting certificate...");
  if (renewalFailed.value) return t("Certificate valid, renewal failed");
  if (lastError.value) return t("The last attempt failed");
  if (needsRestart.value) return t("Certificate ready, restart HomeDock OS");
  if (testPassed.value) return t("Test run succeeded");
  if (settled.value) return t("Certificate valid, OnScreen Apps work");
  if (!status.value?.certificate?.ssl) return t("No certificate installed");
  if (status.value.certificate.self_signed) return t("Self-signed certificate");
  return t("Certificate does not cover app subdomains");
});

const statusDescription = computed(() => {
  const cert = status.value?.certificate;

  if (busy.value) {
    const step = status.value?.state?.step ? t("Step: {step}", { step: status.value.state.step }) : t("Working...");

    return `${step} — ${t("It carries on in the background, you can close this window.")}`;
  }

  if (renewalFailed.value) return t("The installed certificate is still valid. The last renewal did not go through: {error}", { error: lastError.value });
  if (lastError.value) return lastError.value;

  if (needsRestart.value) return t("HTTPS will be live on {domain} once you restart. HomeDock OS is still serving the previous configuration.", { domain: status.value?.domain });

  if (testPassed.value) return t("The setup works. Turn off Test run and issue the real certificate.");

  if (browsingElsewhere.value) return t("Issued for {domain}. You are browsing {host}, which this certificate does not cover.", { domain: status.value?.domain, host: status.value?.host });

  if (settled.value) {
    const days = cert?.expires_in_days;
    return days === null || days === undefined ? t("Trusted by browsers, covering {record}", { record: `*.${status.value?.host}` }) : t("Trusted by browsers, {days} days until renewal", { days });
  }

  if (!cert?.ssl) return t("HomeDock OS is serving plain HTTP. OnScreen Apps still work over HTTP on your local network.");
  if (cert.self_signed) return t("Browsers refuse it, and a window cannot ask you to accept it. Issue a real one below.");

  return t("It is trusted, but it does not include {record}.", { record: `*.${status.value?.host}` });
});

async function refresh() {
  try {
    const { data } = await axios.get<AcmeStatus>("/api/acme/status");
    status.value = data;

    if (!provider.value) provider.value = data.provider || data.providers[0] || "";
  } catch {
    // meow
  }
}

async function issue() {
  try {
    await axios.post("/api/acme/issue", { provider: provider.value, token: token.value, staging: staging.value, domain: targetDomain.value }, { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });

    if (!staging.value) updateSettings?.({ dynamic_dns: targetDomain.value });

    token.value = "";
    message.info(t("Requesting certificate, this takes a few minutes."));
    await refresh();
  } catch (error: any) {
    message.error(error?.response?.data?.message || t("Could not start the certificate request."));
  }
}

onMounted(() => {
  refresh();
  timer = window.setInterval(refresh, 5000);
});

onUnmounted(() => {
  if (timer) window.clearInterval(timer);
});
</script>

<style scoped>
/* Same treatment as the Save in Settings */
.issue-btn-blocked {
  border-color: #85858587 !important;
  background-color: #740a0a !important;
  color: #ffffff !important;
  text-decoration: line-through !important;
  cursor: not-allowed !important;
}

.issue-btn-busy {
  cursor: wait !important;
}

.restart-badge-enter-active {
  transition: all 0.25s ease-out;
}

.restart-badge-leave-active {
  transition: all 0.2s ease-in;
}

.restart-badge-enter-from,
.restart-badge-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
