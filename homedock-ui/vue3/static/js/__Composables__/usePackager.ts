// homedock-ui/vue3/static/js/__Composables__/usePackager.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import axios from "axios";

import { ref, computed, watch, inject, provide, type InjectionKey } from "vue";
import { useI18n } from "vue-i18n";
import { message } from "ant-design-vue";

import { useCsrfToken } from "./useCsrfToken";
import { useDialog } from "./useDialog";
import { useAppStore } from "../__Stores__/useAppStore";
import { useInstallationStore } from "../__Stores__/useInstallationStore";

export type PackagerView = "packages" | "stores" | "create" | "transfer";

export interface PackagerStore {
  id: string;
  name: string;
  url: string;
  color: string;
  authors: string[];
}

export const PREDEFINED_STORES: PackagerStore[] = [
  { id: "casa", name: "Casa App Store", url: "https://github.com/IceWhaleTech/CasaOS-AppStore/archive/refs/heads/main.zip", color: "#4263eb", authors: [] },
  { id: "bigbear", name: "BigBearTechWorld", url: "https://github.com/bigbeartechworld/big-bear-casaos/archive/refs/heads/master.zip", color: "#e8590c", authors: ["BigBearTechWorld", "BigBearCommunity"] },
  { id: "tmc", name: "TMC Store", url: "https://github.com/mariosemes/CasaOS-TMCstore/archive/refs/heads/main.zip", color: "#7048e8", authors: [] },
  { id: "zima", name: "Zima App Store", url: "https://github.com/justserdar/ZimaOS-AppStore/archive/refs/tags/latest-v0.0.8.zip", color: "#1c7ed6", authors: ["JustSerdar"] },
  { id: "coolstore", name: "Coolstore", url: "https://github.com/WisdomSky/CasaOS-Coolstore/archive/refs/heads/main.zip", color: "#1098ad", authors: [] },
  { id: "linuxserver", name: "Casa LinuxServer", url: "https://github.com/WisdomSky/LinuxServer-AppStore/archive/refs/heads/main.zip", color: "#2b8a3e", authors: [] },
];

export const DEV_HOOKS = [
  { placeholder: "[[HD_LOCAL_IP]]", description: "Local IP address of the system", example: "192.168.1.100" },
  { placeholder: "[[HD_INTERNET_IP]]", description: "Public internet IP address", example: "203.0.113.45" },
  { placeholder: "[[HD_USER_NAME]]", description: "HomeDock OS Username", example: "admin" },
  { placeholder: "[[HD_PASSWORD]]", description: "Auto-generated simple password", example: "apple_banana_1234" },
  { placeholder: "[[HD_SYSTEM_PASSWORD]]", description: "Auto-generated secure password (20 chars)", example: "aB3dE5fG7hI9jK1lM3nO" },
  { placeholder: "[[HD_RND_STR]]", description: "Random string (16 chars)", example: "xY4zW9qR2sT7vU1p" },
  { placeholder: "[[INSTALL_PATH]]", description: "App configuration storage path", example: "Linux: /DATA/HomeDock/AppData/\nmacOS: /Users/{username}/HomeDock/AppData/\nWindows: /mnt/c/HomeDock/AppData/" },
  { placeholder: "[[APP_MOUNT_POINT]]", description: "App data storage path", example: "Linux: /DATA/HomeDock/AppFolders/\nmacOS: /Users/{username}/HomeDock/AppFolders/\nWindows: /mnt/c/HomeDock/AppFolders/" },
  { placeholder: "[[SSL_CERT_PATH]]", description: "SSL certificates directory path", example: "Linux: /DATA/SSLCerts\nmacOS: /Users/{username}/HomeDock/SSLCerts\nWindows: /mnt/c/HomeDock/SSLCerts\n\nMake sure to mount them as :ro (read-only) in your Docker Compose." },
];

const MAX_HDS_PACKAGE_SIZE = 5 * 1024 * 1024;
const MAX_COMPOSE_FILE_SIZE = 10 * 1024 * 1024;
const MAX_ICON_FILE_SIZE = 5 * 1024 * 1024;
const MAX_HDSTORE_PACKAGES = 999;
const STORE_PROGRESS_INTERVAL = 500;

const emptyPackage = () => ({
  slug: "",
  display_name: "",
  category: "Media",
  type: "",
  description: "",
  docker_image: "",
  author: "",
  version: "latest",
  default_username: "",
  default_password: "",
  suggested_port: "",
  suggested_trail: "",
});

function downloadBlob(data: BlobPart, filename: string) {
  const url = window.URL.createObjectURL(new Blob([data]));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

export function formatFileSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function packageIconPath(app: any): string {
  const manifest = app?.manifest;
  if (!manifest?.name || !manifest?.icon) return "docker-icons/notfound.jpg";
  return `user-images/${manifest.name}${manifest.icon.substring(manifest.icon.lastIndexOf("."))}`;
}

export function isValidSlug(slug: string): boolean {
  if (!slug) return false;
  if (!/^[a-z0-9\-]+$/.test(slug)) return false;
  return slug[0] !== "-" && slug[slug.length - 1] !== "-";
}

function createPackager() {
  const { t } = useI18n();
  const csrfToken = useCsrfToken();
  const { confirm } = useDialog();
  const appStore = useAppStore();
  const installationStore = useInstallationStore();

  const headers = () => ({ "X-HomeDock-CSRF-Token": csrfToken.value });

  const view = ref<PackagerView>("packages");

  const externalApps = ref<any[]>([]);
  const importedApps = ref<any[]>([]);
  const isLoadingExternal = ref(false);
  const deletingApp = ref<string | null>(null);
  const exportingApp = ref<string | null>(null);

  const packageSearch = ref("");
  const filteredExternalApps = computed(() => {
    const query = packageSearch.value.trim().toLowerCase();
    if (!query) return externalApps.value;
    return externalApps.value.filter((app: any) => [app.manifest?.display_name, app.manifest?.name, app.filename, app.manifest?.author, app.manifest?.category, app.manifest?.type].some((field) => (field || "").toLowerCase().includes(query)));
  });

  const validApps = computed(() => externalApps.value.filter((app: any) => app.is_valid && app.manifest?.name));

  watch(
    () => appStore.apps,
    () => {
      externalApps.value = externalApps.value.map((pkg) => ({ ...pkg, is_installed: appStore.apps.find((app) => app.name === pkg.manifest?.name)?.is_installed || false }));
    },
    { deep: true },
  );

  const loadImportedApps = async () => {
    try {
      const response = await axios.get("/api/pkg/imported", { headers: headers() });
      if (response.data.success) importedApps.value = response.data.apps;
    } catch (error) {
      console.error("Error loading imported apps:", error);
    }
  };

  const loadExternalApps = async () => {
    if (externalApps.value.length === 0 && !isLoadingExternal.value) isLoadingExternal.value = true;
    try {
      const response = await axios.get("/api/pkg/list", { headers: headers() });
      if (response.data.success) externalApps.value = response.data.apps;
    } catch (error) {
      console.error("Error loading external apps:", error);
    } finally {
      isLoadingExternal.value = false;
    }
  };

  const refreshAll = async (reloadStore = true) => {
    await Promise.all([loadExternalApps(), loadImportedApps()]);
    if (reloadStore || appStore.apps.length === 0) await appStore.loadApps(csrfToken.value);
  };

  const reloadStoreApps = () => appStore.loadApps(csrfToken.value);

  const isPackageBeingInstalled = (appSlug?: string): boolean => Boolean(appSlug) && (installationStore.currentlyInstalling === appSlug || installationStore.queue.includes(appSlug!));

  const isImported = (app: any) => importedApps.value.some((imported) => imported.name === app.manifest?.name);

  const detailsApp = ref<any>(null);
  const showDetails = ref(false);
  const openDetails = (app: any) => {
    detailsApp.value = app;
    showDetails.value = true;
  };

  const exportPackage = async (appName: string) => {
    if (!appName || exportingApp.value) return;
    exportingApp.value = appName;
    try {
      const response = await axios.get(`/api/pkg/export-imported?app_name=${appName}`, { headers: headers(), responseType: "blob" });
      downloadBlob(response.data, `${appName}.hds`);
      message.success(t("Successfully exported {name}.hds", { name: appName }));
    } catch (error) {
      console.error("Export error:", error);
      message.error(t("Export failed. Please try again."));
    } finally {
      exportingApp.value = null;
    }
  };

  const performDelete = async (filename: string) => {
    deletingApp.value = filename;
    try {
      const response = await axios.post("/api/pkg/delete", { filename }, { headers: { "Content-Type": "application/json", ...headers() } });
      if (!response.data.success) {
        message.error(t("Deletion failed: {msg}", { msg: response.data.message }));
        return;
      }
      message.success(t("Package and all associated files deleted successfully"));
      await refreshAll();
    } catch (error: any) {
      console.error("Deletion error:", error);
      if (error.response?.status === 409) message.error(t(error.response.data.message || "Cannot delete: App is currently installed"));
      else message.error(t("Deletion failed. Please try again."));
    } finally {
      deletingApp.value = null;
    }
  };

  const deletePackage = (app: any) => {
    const filename = app.filename;
    if (app.is_installed) {
      message.error(t("Cannot delete this package: The app is currently installed. Please uninstall it from the App Store first."));
      return;
    }
    if (isPackageBeingInstalled(app.manifest?.name)) {
      message.error(t("Cannot delete this package: The app is currently installing. Please wait for the installation to complete."));
      return;
    }
    confirm({
      title: t("Confirm Deletion"),
      content: t("Are you sure you want to completely delete {filename}? This will remove it from the App Store.", { filename }),
      okText: t("Delete"),
      cancelText: t("Cancel"),
      onOk: async () => {
        await performDelete(filename);
      },
    });
  };

  const badgeApp = ref<any>(null);
  const showBadgeDialog = ref(false);
  const openBadgeDialog = (app: any) => {
    badgeApp.value = app;
    showBadgeDialog.value = true;
  };

  const isUploading = ref(false);
  const showOverwriteDialog = ref(false);
  const overwriteData = ref<{ displayName: string; appSlug: string; existingFiles: string[] } | null>(null);
  const uploadQueue: File[] = [];
  let processingQueue = false;

  const validateHdsFile = (file: File): Promise<boolean> =>
    new Promise((resolve) => {
      if (!file.name.endsWith(".hds")) {
        message.error(t('"{name}" is not a .hds file', { name: file.name }));
        return resolve(false);
      }
      if (file.size > MAX_HDS_PACKAGE_SIZE) {
        message.error(t('"{name}" is too large. Maximum size: {size}', { name: file.name, size: formatFileSize(MAX_HDS_PACKAGE_SIZE) }));
        return resolve(false);
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const bytes = new Uint8Array(e.target?.result as ArrayBuffer);
        const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
        if (!isZip) {
          message.error(t('"{name}" is not a valid HDS package', { name: file.name }));
          return resolve(false);
        }
        resolve(true);
      };
      reader.readAsArrayBuffer(file.slice(0, 4));
    });

  const uploadSinglePackage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axios.post("/api/pkg/upload", formData, { headers: headers() });
    if (!response.data.success) {
      message.error(t("Upload failed: {msg}", { msg: response.data.message }));
      return;
    }
    message.success(t("Successfully imported {name}!", { name: response.data.display_name || file.name }));
  };

  const processUploadQueue = async () => {
    if (processingQueue) return;
    processingQueue = true;
    isUploading.value = true;
    try {
      while (uploadQueue.length > 0) {
        const file = uploadQueue.shift()!;
        if (!(await validateHdsFile(file))) continue;
        try {
          await uploadSinglePackage(file);
        } catch (error: any) {
          console.error("Upload error:", error);
          if (error.response?.status === 409 && error.response?.data?.code === "PACKAGE_EXISTS") {
            overwriteData.value = { displayName: error.response.data.display_name, appSlug: error.response.data.app_slug, existingFiles: error.response.data.existing_files };
            showOverwriteDialog.value = true;
          } else {
            message.error(t('Failed to import "{name}".', { name: file.name }));
          }
        }
      }
      await refreshAll();
    } finally {
      processingQueue = false;
      isUploading.value = false;
    }
  };

  const queuePackageUpload = (file: File) => {
    if (!uploadQueue.some((queued) => queued.name === file.name && queued.size === file.size)) uploadQueue.push(file);
    processUploadQueue();
  };

  const closeConflictDialog = () => {
    showOverwriteDialog.value = false;
    overwriteData.value = null;
  };

  const composeFile = ref<File | null>(null);
  const composeContent = ref("");
  const composeContentBackup = ref("");
  const isEditingCompose = ref(false);
  const iconFile = ref<File | null>(null);
  const iconPreview = ref<string | null>(null);
  const isCreating = ref(false);
  const hasDefaultCredentials = ref(false);
  const hasSuggestedPort = ref(false);
  const hasSuggestedTrail = ref(false);
  const parsedData = ref<any>({});
  const newPackage = ref(emptyPackage());

  const usedDevHooks = computed(() => (composeContent.value ? DEV_HOOKS.map((hook) => hook.placeholder).filter((placeholder) => composeContent.value.includes(placeholder)) : []));

  const canCreate = computed(() => {
    const pkg = newPackage.value;
    return Boolean(composeFile.value && iconFile.value && isValidSlug(pkg.slug) && pkg.display_name && pkg.category && pkg.type && pkg.description && pkg.docker_image && pkg.author);
  });

  const parseComposeFromContent = async () => {
    if (!composeContent.value) return;
    try {
      const file = new File([new Blob([composeContent.value], { type: "text/yaml" })], composeFile.value?.name || "docker-compose.yml", { type: "text/yaml" });
      const formData = new FormData();
      formData.append("compose", file);
      const response = await axios.post("/api/pkg/parse-compose", formData, { headers: headers() });
      if (response.status !== 200) return;

      parsedData.value = response.data.data || {};
      if (parsedData.value.image) {
        const parts = parsedData.value.image.split(":");
        newPackage.value.docker_image = parts[0];
        if (parts[1]) newPackage.value.version = parts[1];
      }
      if (parsedData.value.container_name) {
        const containerName = parsedData.value.container_name;
        newPackage.value.slug = containerName.toLowerCase();
        newPackage.value.display_name = containerName.charAt(0).toUpperCase() + containerName.slice(1);
      }
    } catch (error) {
      console.error("Error parsing compose:", error);
    }
  };

  const clearCompose = () => {
    composeFile.value = null;
    composeContent.value = "";
  };

  const loadComposeFile = (file: File) => {
    if (file.size > MAX_COMPOSE_FILE_SIZE) {
      message.error(t("Compose file is too large. Maximum size: {size}", { size: formatFileSize(MAX_COMPOSE_FILE_SIZE) }));
      return;
    }
    composeFile.value = file;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      if (!content || content.trim().length === 0) {
        message.error(t("File is empty. Please upload a valid Docker Compose file."));
        return clearCompose();
      }
      if (/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/.test(content.slice(0, 1024))) {
        message.error(t("Binary file detected. Docker Compose must be a plain text YML file."));
        return clearCompose();
      }
      if (!/:\s*\S/.test(content)) {
        message.error(t("Invalid YML format. File must contain YML key-value pairs (key: value)."));
        return clearCompose();
      }
      for (const pattern of ["<?php", "<script", "eval(", "exec(", "__import__"]) {
        if (content.includes(pattern)) {
          message.error(t("Dangerous content detected: {pattern}", { pattern }));
          return clearCompose();
        }
      }
      composeContent.value = content;
      await parseComposeFromContent();
    };
    reader.readAsText(file, "UTF-8");
  };

  const openComposeEditor = () => {
    composeContentBackup.value = composeContent.value;
    isEditingCompose.value = true;
  };

  const saveComposeEdit = async () => {
    await parseComposeFromContent();
  };

  const cancelComposeEdit = () => {
    composeContent.value = composeContentBackup.value;
    isEditingCompose.value = false;
  };

  const loadIconFile = (file: File) => {
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      message.error(t("Please upload a .jpg, .jpeg, or .png file"));
      return;
    }
    if (file.size > MAX_ICON_FILE_SIZE) {
      message.error(t("Icon file is too large. Maximum size: {size}", { size: formatFileSize(MAX_ICON_FILE_SIZE) }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const bytes = new Uint8Array(e.target?.result as ArrayBuffer);
      const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
      const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
      if (!isJpeg && !isPng) {
        message.error(t("Invalid image format. Only JPG and PNG images are allowed."));
        iconFile.value = null;
        iconPreview.value = null;
        return;
      }
      iconFile.value = file;
      const previewReader = new FileReader();
      previewReader.onload = (event) => (iconPreview.value = event.target?.result as string);
      previewReader.readAsDataURL(file);
    };
    reader.readAsArrayBuffer(file);
  };

  const resetNewPackage = () => {
    composeFile.value = null;
    composeContent.value = "";
    iconFile.value = null;
    iconPreview.value = null;
    parsedData.value = {};
    newPackage.value = emptyPackage();
    hasDefaultCredentials.value = false;
    hasSuggestedPort.value = false;
    hasSuggestedTrail.value = false;
  };

  const createPackage = async () => {
    if (!canCreate.value) return;
    isCreating.value = true;
    try {
      const pkg = newPackage.value;
      const formData = new FormData();
      if (composeContent.value) {
        formData.append("compose", new File([new Blob([composeContent.value], { type: "text/yaml" })], composeFile.value?.name || "docker-compose.yml", { type: "text/yaml" }));
      } else {
        formData.append("compose", composeFile.value!);
      }
      formData.append("icon", iconFile.value!);
      for (const key of ["slug", "display_name", "category", "type", "description", "docker_image", "author", "version"] as const) formData.append(key, pkg[key]);
      if (hasDefaultCredentials.value && pkg.default_username && pkg.default_password) {
        formData.append("default_username", pkg.default_username);
        formData.append("default_password", pkg.default_password);
      }
      if (hasSuggestedPort.value && pkg.suggested_port) formData.append("suggested_port", pkg.suggested_port);
      if (hasSuggestedTrail.value && pkg.suggested_trail) formData.append("suggested_trail", pkg.suggested_trail);

      const response = await axios.post("/api/pkg/create", formData, { headers: headers(), responseType: "blob" });
      downloadBlob(response.data, `${pkg.slug}.hds`);
      message.success(t("Successfully created {name}.hds", { name: pkg.slug }));
      resetNewPackage();
    } catch (error) {
      console.error("Creation error:", error);
      message.error(t("Creation failed. Please try again."));
    } finally {
      isCreating.value = false;
    }
  };

  watch(
    () => newPackage.value.slug,
    (newSlug, oldSlug) => {
      if (!composeContent.value || !oldSlug || !newSlug || newSlug === oldSlug) return;
      try {
        const containerNameRegex = new RegExp(`(\\s*container_name:\\s*)${oldSlug}\\b`, "g");
        if (containerNameRegex.test(composeContent.value)) {
          composeContent.value = composeContent.value.replace(containerNameRegex, `$1${newSlug}`);
        } else {
          const serviceRegex = /(services:\s*\n\s+[\w-]+:\s*\n)/;
          if (serviceRegex.test(composeContent.value)) composeContent.value = composeContent.value.replace(serviceRegex, `$1    container_name: ${newSlug}\n`);
        }
      } catch (error) {
        console.error("Error updating container_name:", error);
      }
    },
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success(t("Copied: {text}", { text }));
  };

  const isMigratingSingle = ref(false);
  const migrateProgress = ref("");

  const migrateCompose = (file: File) => {
    if (isMigratingSingle.value) return;
    const reader = new FileReader();
    reader.onload = async () => {
      isMigratingSingle.value = true;
      migrateProgress.value = t("Converting...");
      try {
        const response = await axios.post("/api/pkg/migrate-compose", { compose_content: reader.result as string }, { headers: headers() });
        if (response.data.success) {
          message.success(t("Migrated: {app}", { app: response.data.app }));
          await refreshAll();
          view.value = "packages";
        } else {
          message.error(response.data.message || t("Migration failed"));
        }
      } catch (error: any) {
        message.error(error?.response?.data?.message || error?.message || t("Migration failed"));
      } finally {
        isMigratingSingle.value = false;
        migrateProgress.value = "";
      }
    };
    reader.readAsText(file);
  };

  const thirdPartyUrl = ref("");
  const loadingStoreUrl = ref<string | null>(null);
  const storeProgress = ref<{ phase: "download" | "apps"; done: number; total: number } | null>(null);
  const showThirdPartyDialog = ref(false);
  const thirdPartyPreview = ref<any>(null);
  const thirdPartyCacheId = ref("");
  const isImportingThirdParty = ref(false);
  const thirdPartySelectedSlugs = ref<Set<string>>(new Set());

  const importedFromStore = (store: PackagerStore) => externalApps.value.filter((app: any) => (app.manifest?.source ? app.manifest.source === store.url : store.authors.includes(app.manifest?.author)));

  const toggleThirdPartyPkg = (slug: string) => {
    const next = new Set(thirdPartySelectedSlugs.value);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    thirdPartySelectedSlugs.value = next;
  };

  const thirdPartyToggleAll = () => {
    if (!thirdPartyPreview.value) return;
    const available = thirdPartyPreview.value.packages.filter((pkg: any) => !pkg.already_exists);
    thirdPartySelectedSlugs.value = thirdPartySelectedSlugs.value.size === available.length ? new Set() : new Set(available.map((pkg: any) => pkg.name));
  };

  const previewThirdPartyStore = async (rawUrl: string) => {
    const url = rawUrl.trim();
    if (!url || loadingStoreUrl.value) return;
    if (!url.toLowerCase().endsWith(".zip")) {
      message.error(t("URL must point to a .zip archive. For individual compose files, use the Package Generator."));
      return;
    }

    loadingStoreUrl.value = url;
    storeProgress.value = { phase: "download", done: 0, total: 0 };

    const progressId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    let polling = true;
    const poll = async () => {
      while (polling) {
        await new Promise((resolve) => setTimeout(resolve, STORE_PROGRESS_INTERVAL));
        if (!polling) break;
        try {
          const response = await axios.get("/api/pkg/third-party-progress", { params: { id: progressId }, headers: headers() });
          if (polling && response.data?.progress) storeProgress.value = response.data.progress;
        } catch {
          break;
        }
      }
    };
    poll();

    try {
      const response = await axios.post("/api/pkg/preview-third-party", { url, progress_id: progressId }, { headers: headers() });
      const data = response.data;
      if (!data.success) {
        message.error(data.message || t("Failed to fetch store"));
        return;
      }
      thirdPartyCacheId.value = data.cache_id;
      thirdPartyPreview.value = data;
      thirdPartySelectedSlugs.value = new Set(data.packages.filter((pkg: any) => !pkg.already_exists).map((pkg: any) => pkg.name));
      showThirdPartyDialog.value = true;
    } catch (error: any) {
      message.error(error?.response?.data?.message || error?.message || t("Failed to fetch store"));
    } finally {
      polling = false;
      loadingStoreUrl.value = null;
      storeProgress.value = null;
    }
  };

  const closeThirdPartyDialog = () => {
    showThirdPartyDialog.value = false;
    thirdPartyPreview.value = null;
    thirdPartyCacheId.value = "";
    thirdPartySelectedSlugs.value = new Set();
  };

  const confirmThirdPartyImport = async () => {
    if (!thirdPartyPreview.value || !thirdPartyCacheId.value) return;
    const slugs = [...thirdPartySelectedSlugs.value];
    if (slugs.length === 0) return;

    isImportingThirdParty.value = true;
    try {
      const response = await axios.post("/api/pkg/import-third-party", { cache_id: thirdPartyCacheId.value, slugs }, { headers: headers() });
      const data = response.data;
      if (data.success) {
        message.success(t("Imported {n} app(s)", { n: data.imported }) + (data.skipped > 0 ? `, ${t("{n} skipped", { n: data.skipped })}` : ""));
        thirdPartyUrl.value = "";
        closeThirdPartyDialog();
        await refreshAll();
      } else {
        message.error(data.message || t("Import failed"));
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || t("Import failed"));
    } finally {
      isImportingThirdParty.value = false;
    }
  };

  const showExportStoreDialog = ref(false);
  const selectedStoreApps = ref<Set<string>>(new Set());
  const isExportingStore = ref(false);
  const exportProgress = ref<{ loaded: number; total: number } | null>(null);

  const toggleStoreAppSelection = (slug: string) => {
    const next = new Set(selectedStoreApps.value);
    if (next.has(slug)) next.delete(slug);
    else if (next.size < MAX_HDSTORE_PACKAGES) next.add(slug);
    selectedStoreApps.value = next;
  };

  const selectAllStoreApps = () => {
    selectedStoreApps.value = selectedStoreApps.value.size === validApps.value.length ? new Set() : new Set(validApps.value.slice(0, MAX_HDSTORE_PACKAGES).map((app: any) => app.manifest.name));
  };

  const closeExportStoreDialog = () => {
    showExportStoreDialog.value = false;
    selectedStoreApps.value = new Set();
  };

  const exportStore = async () => {
    if (selectedStoreApps.value.size === 0) return;
    isExportingStore.value = true;
    exportProgress.value = { loaded: 0, total: 0 };
    try {
      const apps = Array.from(selectedStoreApps.value).join(",");
      const response = await axios.get(`/api/pkg/export-hdstore?apps=${encodeURIComponent(apps)}`, {
        headers: headers(),
        responseType: "blob",
        onDownloadProgress: (event) => {
          exportProgress.value = { loaded: event.loaded, total: event.total ?? 0 };
        },
      });
      const disposition = response.headers["content-disposition"] || "";
      const filenameMatch = disposition.match(/filename="?([^";\s]+)"?/);
      downloadBlob(response.data, filenameMatch ? filenameMatch[1] : "HomeDockOSAppStore.hdstore");
      message.success(t("Exported {n} package(s)", { n: selectedStoreApps.value.size }));
      closeExportStoreDialog();
    } catch {
      message.error(t("Export failed. Please try again."));
    } finally {
      isExportingStore.value = false;
      exportProgress.value = null;
    }
  };

  const showImportStoreDialog = ref(false);
  const importStorePreview = ref<any>(null);
  const pendingImportFile = ref<File | null>(null);
  const importStoreSelectedSlugs = ref<Set<string>>(new Set());
  const isImportingStore = ref(false);
  const isPreviewingStore = ref(false);

  const toggleImportStorePkg = (slug: string) => {
    const next = new Set(importStoreSelectedSlugs.value);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    importStoreSelectedSlugs.value = next;
  };

  const importStoreToggleAll = () => {
    if (!importStorePreview.value) return;
    const available = importStorePreview.value.packages.filter((pkg: any) => !pkg.already_exists);
    importStoreSelectedSlugs.value = importStoreSelectedSlugs.value.size === available.length ? new Set() : new Set(available.map((pkg: any) => pkg.name));
  };

  const closeImportStoreDialog = () => {
    showImportStoreDialog.value = false;
    importStorePreview.value = null;
    pendingImportFile.value = null;
    importStoreSelectedSlugs.value = new Set();
  };

  const previewHdstore = async (file: File) => {
    if (!file.name.endsWith(".hdstore")) {
      message.error(t("File must be a .hdstore package"));
      return;
    }
    isPreviewingStore.value = true;
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axios.post("/api/pkg/preview-hdstore", formData, { headers: headers() });
      if (response.data.success) {
        const existingNames = new Set(externalApps.value.map((app: any) => app.manifest?.name).filter(Boolean));
        const packages = (response.data.packages || []).map((pkg: any) => ({ ...pkg, already_exists: existingNames.has(pkg.name) }));
        importStorePreview.value = { ...response.data, packages };
        pendingImportFile.value = file;
        importStoreSelectedSlugs.value = new Set(packages.filter((pkg: any) => !pkg.already_exists).map((pkg: any) => pkg.name));
        showImportStoreDialog.value = true;
      } else {
        message.error(t(response.data.message || "Preview failed"));
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || t("Failed to read .hdstore file."));
    } finally {
      isPreviewingStore.value = false;
    }
  };

  const confirmImportStore = async () => {
    if (!pendingImportFile.value || importStoreSelectedSlugs.value.size === 0) return;
    isImportingStore.value = true;
    try {
      const formData = new FormData();
      formData.append("file", pendingImportFile.value);
      formData.append("selected_slugs", JSON.stringify([...importStoreSelectedSlugs.value]));
      const response = await axios.post("/api/pkg/import-hdstore", formData, { headers: headers() });
      if (response.data.success) {
        const { imported, skipped } = response.data;
        message.success(t("Imported {n} package(s)", { n: imported.length }));
        if (skipped.length > 0) message.warning(t("{n} package(s) skipped", { n: skipped.length }));
        await refreshAll();
      } else {
        message.error(t(response.data.message || "Import failed"));
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || t("Import failed. Please try again."));
    } finally {
      isImportingStore.value = false;
      closeImportStoreDialog();
    }
  };

  const busySections = computed<Partial<Record<PackagerView, boolean>>>(() => ({
    stores: Boolean(loadingStoreUrl.value) || isImportingThirdParty.value,
    create: isCreating.value,
    transfer: isExportingStore.value || isUploading.value || isPreviewingStore.value || isImportingStore.value || isMigratingSingle.value,
  }));

  const handleFiles = (files: File[]) => {
    for (const file of files) {
      if (file.name.endsWith(".hdstore")) previewHdstore(file);
      else queuePackageUpload(file);
    }
  };

  return {
    view,
    busySections,
    externalApps,
    importedApps,
    isLoadingExternal,
    deletingApp,
    exportingApp,
    packageSearch,
    filteredExternalApps,
    validApps,
    refreshAll,
    reloadStoreApps,
    isPackageBeingInstalled,
    isImported,
    detailsApp,
    showDetails,
    openDetails,
    exportPackage,
    deletePackage,
    badgeApp,
    showBadgeDialog,
    openBadgeDialog,
    isUploading,
    showOverwriteDialog,
    overwriteData,
    queuePackageUpload,
    closeConflictDialog,
    handleFiles,
    composeFile,
    composeContent,
    isEditingCompose,
    iconFile,
    iconPreview,
    isCreating,
    hasDefaultCredentials,
    hasSuggestedPort,
    hasSuggestedTrail,
    parsedData,
    newPackage,
    usedDevHooks,
    canCreate,
    loadComposeFile,
    openComposeEditor,
    saveComposeEdit,
    cancelComposeEdit,
    loadIconFile,
    createPackage,
    copyToClipboard,
    isMigratingSingle,
    migrateProgress,
    migrateCompose,
    thirdPartyUrl,
    loadingStoreUrl,
    storeProgress,
    showThirdPartyDialog,
    thirdPartyPreview,
    isImportingThirdParty,
    thirdPartySelectedSlugs,
    importedFromStore,
    toggleThirdPartyPkg,
    thirdPartyToggleAll,
    previewThirdPartyStore,
    closeThirdPartyDialog,
    confirmThirdPartyImport,
    showExportStoreDialog,
    selectedStoreApps,
    isExportingStore,
    exportProgress,
    toggleStoreAppSelection,
    selectAllStoreApps,
    closeExportStoreDialog,
    exportStore,
    showImportStoreDialog,
    importStorePreview,
    importStoreSelectedSlugs,
    isImportingStore,
    isPreviewingStore,
    toggleImportStorePkg,
    importStoreToggleAll,
    closeImportStoreDialog,
    previewHdstore,
    confirmImportStore,
  };
}

export type Packager = ReturnType<typeof createPackager>;

const PACKAGER_KEY: InjectionKey<Packager> = Symbol("packager");

export function providePackager(): Packager {
  const packager = createPackager();
  provide(PACKAGER_KEY, packager);
  return packager;
}

export function usePackager(): Packager {
  const packager = inject(PACKAGER_KEY);
  if (!packager) throw new Error("usePackager() must be used inside the Packager window");
  return packager;
}
