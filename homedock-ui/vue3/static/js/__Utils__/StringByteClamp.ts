// homedock-ui/vue3/static/js/__Utils__/StringByteClamp.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

const encoder = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;

export function utf8ByteLength(value: string): number {
  if (encoder) return encoder.encode(value).byteLength;
  return new Blob([value]).size;
}

export function clampToBytes(value: string, maxBytes: number): string {
  if (utf8ByteLength(value) <= maxBytes) return value;
  let bytes = 0;
  let result = "";
  for (const char of value) {
    const charBytes = utf8ByteLength(char);
    if (bytes + charBytes > maxBytes) break;
    bytes += charBytes;
    result += char;
  }
  return result;
}

export const BCRYPT_MAX_BYTES = 72;
