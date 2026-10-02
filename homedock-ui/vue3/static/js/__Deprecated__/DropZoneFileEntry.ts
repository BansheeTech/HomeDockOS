// homedock-ui/vue3/static/js/__Deprecated__/DropZoneFileEntry.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

export interface FileEntry {
  name: string;
  display_name?: string;
  size: number;
  modified: string | number;
  is_directory?: boolean;
}
