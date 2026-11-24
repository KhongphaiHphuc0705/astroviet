import { normalizeSiteUrl } from "./seo";

export const DEFAULT_DEV_SITE_URL = "http://localhost:5173";

export interface ResolveSiteUrlOptions {
  readonly isDev: boolean;
}

export interface SiteUrlResolution {
  readonly siteUrl: string | undefined;
  readonly invalidError?: Error;
}

export type PrerenderSiteUrlErrorCode =
  "MISSING" | "INVALID" | "NOT_HTTPS" | "LOCAL_HOST" | "RESERVED_HOST";

export type PrerenderSiteUrlResolution =
  | {
      readonly status: "ok";
      readonly siteUrl: string;
      readonly source: "env" | "dev-fallback";
      readonly warnings: readonly string[];
    }
  | {
      readonly status: "error";
      readonly code: PrerenderSiteUrlErrorCode;
      readonly message: string;
    };

export interface ResolveSiteUrlForBuildOptions {
  readonly strict: boolean;
}

export type ParseStrictFlagResult =
  { readonly value: boolean } | { readonly error: string };

function isPrivateOrLocalIpv4(
  a: number,
  b: number,
  c: number,
  d: number,
): boolean {
  if (
    a < 0 ||
    a > 255 ||
    b < 0 ||
    b > 255 ||
    c < 0 ||
    c > 255 ||
    d < 0 ||
    d > 255
  ) {
    return false;
  }
  if (a === 0) return true; // 0.0.0.0/8 unspecified
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 10) return true; // 10.0.0.0/8 RFC1918
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 RFC1918
  if (a === 192 && b === 168) return true; // 192.168.0.0/16 RFC1918
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  return false;
}

function isLocalOrPrivateHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  const host =
    lower.startsWith("[") && lower.endsWith("]") ? lower.slice(1, -1) : lower;

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return true;
  }

  // IPv4 literal
  const ipv4Match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (ipv4Match) {
    return isPrivateOrLocalIpv4(
      Number(ipv4Match[1]),
      Number(ipv4Match[2]),
      Number(ipv4Match[3]),
      Number(ipv4Match[4]),
    );
  }

  // IPv6 loopback, unspecified, link-local (fe80::/10), unique local (fc00::/7)
  if (host === "::1" || host === "::") {
    return true;
  }
  if (/^fe[89ab][0-9a-f]:/.test(host) || /^f[cd][0-9a-f]{2}:/.test(host)) {
    return true;
  }

  // IPv4-mapped IPv6 in hex form (WHATWG URL normalizes ::ffff:127.0.0.1 -> ::ffff:7f00:1)
  const ipv4MappedHex = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(host);
  if (ipv4MappedHex?.[1] !== undefined && ipv4MappedHex[2] !== undefined) {
    const hi = parseInt(ipv4MappedHex[1], 16);
    const lo = parseInt(ipv4MappedHex[2], 16);
    return isPrivateOrLocalIpv4(
      (hi >> 8) & 0xff,
      hi & 0xff,
      (lo >> 8) & 0xff,
      lo & 0xff,
    );
  }

  // IPv4-mapped IPv6 in dotted form
  const ipv4MappedDotted =
    /^::ffff:(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (ipv4MappedDotted) {
    return isPrivateOrLocalIpv4(
      Number(ipv4MappedDotted[1]),
      Number(ipv4MappedDotted[2]),
      Number(ipv4MappedDotted[3]),
      Number(ipv4MappedDotted[4]),
    );
  }

  return false;
}

const RESERVED_TLDS = ["example", "test", "invalid"] as const;
const RESERVED_SLDS = ["example.com", "example.net", "example.org"] as const;

/**
 * Detects RFC 2606 / RFC 6761 reserved & placeholder domains
 * (`.example`, `.test`, `.invalid`, `example.com/net/org` and their subdomains).
 */
export function isReservedPlaceholderHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  for (const tld of RESERVED_TLDS) {
    if (host === tld || host.endsWith(`.${tld}`)) {
      return true;
    }
  }
  for (const sld of RESERVED_SLDS) {
    if (host === sld || host.endsWith(`.${sld}`)) {
      return true;
    }
  }
  return false;
}

/**
 * Parses `PRERENDER_STRICT` flag (D-F6-P4b, D-F6.5-03).
 *
 * Case-insensitive and whitespace-trimmed:
 * - `"true"` | `"1"` -> `{ value: true }`
 * - `"false"` | `"0"` | `""` | `undefined` -> `{ value: false }`
 * - Any other value -> `{ error }` (fails build to catch typos).
 */
export function parseStrictFlag(
  raw: string | undefined,
): ParseStrictFlagResult {
  if (raw === undefined) {
    return { value: false };
  }

  const normalized = raw.trim().toLowerCase();
  if (normalized === "" || normalized === "false" || normalized === "0") {
    return { value: false };
  }
  if (normalized === "true" || normalized === "1") {
    return { value: true };
  }

  return {
    error: `Invalid PRERENDER_STRICT value "${raw}". Expected "true", "1", "false", "0", or unset.`,
  };
}

/**
 * Resolves and validates `VITE_SITE_URL` for build-time prerender (D-F6-P4/P4b, D-F6.5-02/03).
 *
 * Pure and SSR-safe (zero browser globals or runtime env reads):
 * - Missing/empty:
 *   - strict=true  -> error `MISSING`
 *   - strict=false -> ok with `DEFAULT_DEV_SITE_URL` (`source: "dev-fallback"`) + warning
 * - Provided but malformed (path/query/hash/credentials/scheme):
 *   - ALWAYS error `INVALID` (both strict and non-strict, D-F6-A4)
 * - Provided and valid URL:
 *   - strict=true  -> requires `https:` (`NOT_HTTPS`) and non-local/non-private host (`LOCAL_HOST`)
 *   - strict=false -> ok with normalized origin (`source: "env"`, 0 warnings)
 */
export function resolveSiteUrlForBuild(
  raw: string | undefined,
  options: ResolveSiteUrlForBuildOptions,
): PrerenderSiteUrlResolution {
  const trimmed = typeof raw === "string" ? raw.trim() : "";

  if (trimmed.length === 0) {
    if (options.strict) {
      return {
        status: "error",
        code: "MISSING",
        message:
          "Missing VITE_SITE_URL while PRERENDER_STRICT=true. Set VITE_SITE_URL to a valid production https:// origin.",
      };
    }

    return {
      status: "ok",
      siteUrl: DEFAULT_DEV_SITE_URL,
      source: "dev-fallback",
      warnings: [
        `VITE_SITE_URL is not set; falling back to ${DEFAULT_DEV_SITE_URL} because PRERENDER_STRICT is disabled. Set VITE_SITE_URL and PRERENDER_STRICT=true for production builds.`,
      ],
    };
  }

  let normalized: string;
  try {
    normalized = normalizeSiteUrl(trimmed);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return {
      status: "error",
      code: "INVALID",
      message: `Invalid VITE_SITE_URL "${trimmed}": ${detail}. Provide an origin with http:// or https:// and no path, query, hash, or credentials.`,
    };
  }

  if (options.strict) {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "https:") {
      return {
        status: "error",
        code: "NOT_HTTPS",
        message: `Invalid VITE_SITE_URL "${normalized}" while PRERENDER_STRICT=true: production site URL must use https://.`,
      };
    }

    if (isLocalOrPrivateHost(parsed.hostname)) {
      return {
        status: "error",
        code: "LOCAL_HOST",
        message: `Invalid VITE_SITE_URL "${normalized}" while PRERENDER_STRICT=true: localhost and private/loopback IP hosts are not allowed in production.`,
      };
    }

    if (isReservedPlaceholderHost(parsed.hostname)) {
      return {
        status: "error",
        code: "RESERVED_HOST",
        message: `Invalid VITE_SITE_URL "${normalized}" while PRERENDER_STRICT=true: RFC 2606/6761 reserved/placeholder domains (.example, .test, .invalid, example.com/org/net) are not allowed in production.`,
      };
    }
  }

  return {
    status: "ok",
    siteUrl: normalized,
    source: "env",
    warnings: [],
  };
}

/**
 * Resolves and normalizes `VITE_SITE_URL` with diagnostic details (D-F6.4-01, AC-F6.4-A06).
 *
 * Pure and SSR-safe (zero browser globals or runtime env reads):
 * - When `raw` is provided and valid: returns normalized origin (no trailing slash).
 * - When `raw` is provided and invalid: returns `{ siteUrl: undefined, invalidError }`.
 * - When `raw` is omitted/empty and `isDev` is true: falls back to `http://localhost:5173`.
 * - When `raw` is omitted/empty and `isDev` is false: returns `{ siteUrl: undefined }`
 *   (never guesses a production domain).
 */
export function resolveSiteUrlDetailed(
  raw: string | undefined,
  options: ResolveSiteUrlOptions,
): SiteUrlResolution {
  if (typeof raw === "string" && raw.trim().length > 0) {
    try {
      return { siteUrl: normalizeSiteUrl(raw.trim()) };
    } catch (err) {
      return {
        siteUrl: undefined,
        invalidError:
          err instanceof Error
            ? err
            : new Error(`Invalid VITE_SITE_URL: ${String(err)}`),
      };
    }
  }

  if (options.isDev) {
    return { siteUrl: DEFAULT_DEV_SITE_URL };
  }

  return { siteUrl: undefined };
}

/**
 * Resolves `VITE_SITE_URL` to a normalized origin or `undefined` (D-F6.4-01).
 */
export function resolveSiteUrl(
  raw: string | undefined,
  options: ResolveSiteUrlOptions,
): string | undefined {
  return resolveSiteUrlDetailed(raw, options).siteUrl;
}
