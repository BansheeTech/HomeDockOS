// homedock-ui/vue3/static/js/__Types__/DiskData.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

export interface DiskData {
  id: string;
  device: string;
  mountpoint: string;
  label: string;
  fstype: string;
  total_gb: number;
  used_gb: number;
  free_gb: number;
  usage_percent: number;
  media_type: string;
  removable: boolean;
  internal: boolean;
  is_system: boolean;
}
