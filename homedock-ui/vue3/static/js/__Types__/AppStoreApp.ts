// src/static/js/__Types__/AppStoreApp.ts
// Copyright © 2023-2025 Banshee
// https://www.banshee.pro

export interface App {
  dependencies: string[];
  docker_image: string;
  picture_path: string;
  is_group: boolean;
  name: string;
  category: string;
  type: string;
  icon: string;
  description: string;
  is_new: boolean;
  new_until: string | boolean;
  is_installed?: boolean;
}
