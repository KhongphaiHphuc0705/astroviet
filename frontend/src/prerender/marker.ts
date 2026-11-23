/**
 * Shared prerender marker constants (D-F6-P2, D-F6.5-06).
 *
 * Intentionally pure (zero React, DOM, or env imports) so both the SSR prerender
 * pipeline (`src/prerender/*`) and client hydration (`src/app/hydrate.ts`)
 * share a single source of truth without pulling SSR code into client bundles.
 */
export const PRERENDER_VERSION = "1";
export const PRERENDERED_ATTR = "data-prerendered";
export const PRERENDERED_VALUE = "1";
export const PRERENDER_ROUTE_ATTR = "data-prerender-route";
export const PRERENDER_VERSION_ATTR = "data-prerender-version";
export const BASE_TITLE_ATTR = "data-base-title";

/**
 * Normalizes a route pathname by stripping query/hash fragments and trailing slashes
 * (preserving `"/"`). E.g. `"/knowledge/"` -> `"/knowledge"`.
 */
export function normalizePrerenderRoute(rawUrl: string): string {
  const withoutHash = rawUrl.split("#")[0] ?? "";
  const withoutQuery = withoutHash.split("?")[0] ?? "";
  const trimmed = withoutQuery.trim();
  if (trimmed === "" || trimmed === "/") {
    return "/";
  }
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, "") || "/";
}
