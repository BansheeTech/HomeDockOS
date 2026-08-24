// homedock-ui/vue3/static/js/__Composables__/useAppSubdomain.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import axios from "axios";

const IPV4_HOST = /^\d{1,3}(?:\.\d{1,3}){3}$/;
const PRIVATE_IPV4 = /^(?:10\.|127\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/;

// HDOS00106
export function isLocalNetworkHost(hostname: string = window.location.hostname): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (!host) return false;

  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "::1" || PRIVATE_IPV4.test(host)) return true;
  if (!host.includes(".") && !host.includes(":")) return true;

  return host === "homedock.local" || host.endsWith(".local");
}

// HDOS00103
export function hostSupportsAppWindows(hostname: string = window.location.hostname): boolean {
  return hostSupportsSubdomains(hostname) && !isMulticastTrail(hostname);
}

// HDOS00116
export function appWindowsAvailable(certificateBlocks: boolean, hostname: string = window.location.hostname): boolean {
  return hostSupportsAppWindows(hostname) && !certificateBlocks;
}

export interface AppTokenResponse {
  slug: string;
  token: string;
  param: string;
  expires_in: number;
}

export function subdomainTrail(hostname: string = window.location.hostname): string | null {
  if (!hostname) return null;

  const host = hostname.toLowerCase();

  if (host.startsWith("[")) return null;
  if (IPV4_HOST.test(host)) return null;

  return host.includes(".") ? host : null;
}

export function hostSupportsSubdomains(hostname: string = window.location.hostname): boolean {
  return subdomainTrail(hostname) !== null;
}

// HDOS00106
export function isAddressLiteral(hostname: string = window.location.hostname): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  return IPV4_HOST.test(host) || host.includes(":");
}

export async function requestAppToken(containerName: string, csrfToken: string): Promise<AppTokenResponse | null> {
  try {
    const response = await axios.post<AppTokenResponse>(
      "/api/app-token",
      { slug: containerName },
      {
        headers: { "X-HomeDock-CSRF-Token": csrfToken },
      },
    );

    if (!response.data?.slug || !response.data?.token) return null;

    return response.data;
  } catch {
    return null;
  }
}

export function buildAppSubdomainUrl(handoff: AppTokenResponse, path: string = "", hostname: string = window.location.hostname): string {
  const { protocol, port } = window.location;
  const trail = subdomainTrail(hostname);
  const portPart = port ? `:${port}` : "";
  const param = handoff.param || "__hd_token";

  const cleanPath = path.split(/[?#]/)[0].replace(/^\/+/, "");
  const subpath = cleanPath ? `/${cleanPath}` : "/";

  return `${protocol}//${handoff.slug}.${trail}${portPart}${subpath}?${param}=${encodeURIComponent(handoff.token)}`;
}

// HDOS00118
export function buildDirectPortUrl(port: string | number, scheme: string = "http", hostname: string = window.location.hostname): string {
  return `${scheme}://${hostname}:${port}`;
}

// HDOS00106
const reachability = new Map<string, Promise<boolean | null>>();

// HDOS00117
const REACHABILITY_TIMEOUT = 3000;

export type SubdomainBlocker = "dns" | "certificate" | "wrong_host" | "untrusted" | "unknown";

// HDOS00103
export function isMulticastTrail(hostname: string = window.location.hostname): boolean {
  return hostname.toLowerCase().replace(/\.$/, "").endsWith(".local");
}

export interface SubdomainDiagnosis {
  blocker: SubdomainBlocker;
  alternative: string | null;
}

// HDOS00106
export async function diagnoseSubdomainBlocker(): Promise<SubdomainDiagnosis> {
  try {
    const { data } = await axios.get<{ ssl: boolean; covers_apps: boolean; self_signed: boolean; alternative: string | null }>("/api/subdomain-diagnostics");

    if (!data) return { blocker: "unknown", alternative: null };

    if (!data.ssl) return { blocker: "dns", alternative: null };

    if (!data.covers_apps) {
      return { blocker: data.alternative ? "wrong_host" : "certificate", alternative: data.alternative };
    }

    if (data.self_signed) return { blocker: "untrusted", alternative: null };

    return { blocker: "dns", alternative: null };
  } catch {
    return { blocker: "unknown", alternative: null };
  }
}

// HDOS00106
export function probeSubdomainReachable(slug: string): Promise<boolean | null> {
  const trail = subdomainTrail();

  if (!trail || !slug) return Promise.resolve(false);

  const cached = reachability.get(trail);
  if (cached) return cached;

  const { protocol, port } = window.location;
  const url = `${protocol}//${slug}.${trail}${port ? `:${port}` : ""}/`;

  const probe = fetch(url, { mode: "no-cors", cache: "no-store", signal: AbortSignal.timeout(REACHABILITY_TIMEOUT) })
    .then(() => true)
    .catch((error) => (error?.name === "TimeoutError" || error?.name === "AbortError" ? null : false))
    .then((verdict) => {
      if (verdict === null) reachability.delete(trail);

      return verdict;
    });

  reachability.set(trail, probe);

  return probe;
}
