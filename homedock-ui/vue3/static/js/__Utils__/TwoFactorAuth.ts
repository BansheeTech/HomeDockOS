// homedock-ui/vue3/static/js/__Utils__/TwoFactorAuth.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import forge from "node-forge";
import { encryptForServer } from "./CryptoClient";

export function generateSecureBase32(byteLength = 20): string {
  const bytes = forge.random.getBytesSync(byteLength);
  return base32Encode(bytes);
}

function base32Encode(input: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let result = "";
  let bits = 0;
  let value = 0;

  for (let i = 0; i < input.length; i++) {
    value = (value << 8) | input.charCodeAt(i);
    bits += 8;

    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += alphabet[(value << (5 - bits)) & 31];
  }

  return result;
}

export function generateTOTPUri(secret: string, accountName: string, issuer = "HomeDock OS"): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountName);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}`;
}

export async function encryptTOTPSecret(secret: string, csrfToken: string): Promise<string> {
  return encryptForServer(secret, csrfToken);
}
