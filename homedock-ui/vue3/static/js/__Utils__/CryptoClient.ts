// homedock-ui/vue3/static/js/__Utils__/CryptoClient.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import axios from "axios";
import forge from "node-forge";

let cachedServerPublicKey: string | null = null;

export interface ServerKeyResponse {
  publicKey: string;
  token?: string;
}

export async function getServerKeyAndToken(csrfToken: string, forceRefresh = false): Promise<ServerKeyResponse> {
  if (cachedServerPublicKey && !forceRefresh) {
    return { publicKey: cachedServerPublicKey };
  }

  const response = await axios.get("/api/pksend", {
    headers: { "X-HomeDock-CSRF-Token": csrfToken },
  });

  if (!response.data.public_key) {
    throw new Error("Server public key not found in response");
  }

  const publicKey: string = response.data.public_key;
  cachedServerPublicKey = publicKey;
  return {
    publicKey,
    token: response.data.token,
  };
}

export async function getServerPublicKey(csrfToken: string, forceRefresh = false): Promise<string> {
  const { publicKey } = await getServerKeyAndToken(csrfToken, forceRefresh);
  return publicKey;
}

// RSA Direct encryption, dimensions limit ~446 bytes
function encryptRSADirect(data: string | object, publicKeyPem: string): string {
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
  const dataString = typeof data === "string" ? data : JSON.stringify(data);

  const encrypted = publicKey.encrypt(dataString, "RSA-OAEP", {
    md: forge.md.sha256.create(),
    mgf1: { md: forge.md.sha256.create() },
  });

  return forge.util.encode64(encrypted);
}

// Hybrid RSA + AES-GCM encryption for larger payloads
function encryptRSA_AES_Hybrid(data: string | object, publicKeyPem: string): string {
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
  const dataString = typeof data === "string" ? data : JSON.stringify(data);

  const aesKey = forge.random.getBytesSync(32);
  const iv = forge.random.getBytesSync(12);

  const cipher = forge.cipher.createCipher("AES-GCM", aesKey);
  cipher.start({ iv: iv, tagLength: 128 });
  cipher.update(forge.util.createBuffer(dataString, "utf8"));
  cipher.finish();

  const encryptedData = cipher.output.getBytes();
  const tag = cipher.mode.tag.getBytes();

  const encryptedKey = publicKey.encrypt(aesKey, "RSA-OAEP", {
    md: forge.md.sha256.create(),
    mgf1: { md: forge.md.sha256.create() },
  });

  return JSON.stringify({
    mode: "hybrid",
    key: forge.util.encode64(encryptedKey),
    iv: forge.util.encode64(iv),
    tag: forge.util.encode64(tag),
    data: forge.util.encode64(encryptedData),
  });
}

export function encryptWithKey(data: string | object, publicKeyPem: string): string {
  try {
    return encryptRSADirect(data, publicKeyPem);
  } catch {
    return encryptRSA_AES_Hybrid(data, publicKeyPem);
  }
}

export async function encryptForServer(data: string | object, csrfToken: string): Promise<string> {
  const publicKeyPem = await getServerPublicKey(csrfToken);
  return encryptWithKey(data, publicKeyPem);
}

export function clearKeyCache(): void {
  cachedServerPublicKey = null;
}
