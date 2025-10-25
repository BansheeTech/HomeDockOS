// homedock-ui/vue3/static/js/__Types__/AppStoreApp.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

export interface App {
  dependencies: string[];
  docker_image: string;
  picture_path: string;
  is_group: boolean;

  name: string;

  display_name?: string;

  category: string;
  type: string;
  icon: string;
  description: string;
  is_new: boolean;
  new_until: string | boolean;
  is_installed?: boolean;
  sslEnabled?: boolean;
  is_external?: boolean;
  author?: string;
  version?: string;
  screenshot_count?: number;
}
