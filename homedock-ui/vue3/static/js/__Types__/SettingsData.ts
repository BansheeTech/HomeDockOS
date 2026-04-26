// homedock-ui/vue3/static/js/__Types__/SettingsData.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

export interface SettingsData {
  user_name: string;
  run_port: number;
  dynamic_dns: string;
  local_dns: boolean;
  run_on_development: boolean;
  disable_usage_data: boolean;
  delete_old_image_containers_after_update: boolean;
  delete_old_image_containers_after_uninstall: boolean;
  delete_internal_data_volumes: boolean;
  reverse_proxy: boolean;
  default_external_drive: string;
  require_protected_paths_password: boolean;
  disksplus_session_timeout_minutes: number;
}
