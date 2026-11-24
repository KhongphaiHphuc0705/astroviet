import type { ReactElement } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";

import { queryClient } from "@shared/api/queryClient";
import { reportError } from "@shared/lib/report-error";

import {
  normalizePrerenderRoute,
  PRERENDER_ROUTE_ATTR,
  PRERENDER_VERSION,
  PRERENDER_VERSION_ATTR,
  PRERENDERED_ATTR,
  PRERENDERED_VALUE,
} from "../prerender/marker";

/**
 * Build-time feature flag controlling conditional Knowledge Base hydration (D-F6-P2, D-F6.5-04).
 *
 * Enabled by default after Owner PASS decision on the local hydration gate (F6.5.8,
 * `KB-H01..KB-H05` PASS). Set `VITE_ENABLE_HYDRATION=false` to fall back to CSR `createRoot`.
 * Single read site for `VITE_ENABLE_HYDRATION`.
 */
export const HYDRATION_ENABLED =
  import.meta.env.VITE_ENABLE_HYDRATION !== "false";

// Kept local to avoid statically importing `@features/knowledge-base` into the entry bundle.
const KNOWLEDGE_LIST_ROUTE = "/knowledge";
const KNOWLEDGE_ARTICLE_SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export interface PrerenderMarker {
  readonly prerendered?: string;
  readonly route?: string;
  readonly version?: string;
}

export interface HydrationInput {
  readonly enabled: boolean;
  readonly pathname: string;
  readonly marker: PrerenderMarker | null;
  readonly h1Count: number;
  readonly hasRoot: boolean;
}

export type HydrationSkipReason =
  | "disabled"
  | "no-root"
  | "no-marker"
  | "not-knowledge-route"
  | "route-mismatch"
  | "version-mismatch"
  | "invalid-markup";

export type HydrationDecision =
  | {
      readonly hydrate: true;
      readonly normalizedRoute: string;
      readonly slug?: string;
    }
  | {
      readonly hydrate: false;
      readonly reason: HydrationSkipReason;
    };

export type AppBootMode = "hydrate" | "csr";

declare global {
  interface Window {
    __ASTROV_BOOT_MODE__?: AppBootMode;
  }
}

function recordBootMode(mode: AppBootMode): void {
  if (typeof window !== "undefined") {
    window.__ASTROV_BOOT_MODE__ = mode;
  }
}

/**
 * Pure decision gate for conditional Knowledge Base hydration (D-F6-P2, KB-U25).
 *
 * Zero DOM or browser global access. Returns `{ hydrate: true }` only when ALL conditions hold:
 * 1. Feature flag `enabled` is true.
 * 2. `#root` exists (`hasRoot`).
 * 3. Prerender marker `data-prerendered="1"` is present.
 * 4. Normalized `pathname` is `/knowledge` or `/knowledge/<valid-slug>`.
 * 5. Marker `version` matches shared `PRERENDER_VERSION`.
 * 6. Normalized marker `route` matches normalized `pathname`.
 * 7. `#root` contains exactly one `<h1>` (`h1Count === 1`).
 */
export function shouldHydrate(input: HydrationInput): HydrationDecision {
  if (!input.enabled) {
    return { hydrate: false, reason: "disabled" };
  }
  if (!input.hasRoot) {
    return { hydrate: false, reason: "no-root" };
  }
  if (!input.marker || input.marker.prerendered !== PRERENDERED_VALUE) {
    return { hydrate: false, reason: "no-marker" };
  }

  const normalizedRoute = normalizePrerenderRoute(input.pathname);
  let slug: string | undefined;

  if (normalizedRoute !== KNOWLEDGE_LIST_ROUTE) {
    const match = /^\/knowledge\/([^/]+)$/.exec(normalizedRoute);
    const candidate = match?.[1];
    if (!candidate || !KNOWLEDGE_ARTICLE_SLUG_PATTERN.test(candidate)) {
      return { hydrate: false, reason: "not-knowledge-route" };
    }
    slug = candidate;
  }

  if (input.marker.version !== PRERENDER_VERSION) {
    return { hydrate: false, reason: "version-mismatch" };
  }

  const normalizedMarkerRoute = input.marker.route
    ? normalizePrerenderRoute(input.marker.route)
    : "";
  if (normalizedMarkerRoute !== normalizedRoute) {
    return { hydrate: false, reason: "route-mismatch" };
  }

  if (input.h1Count !== 1) {
    return { hydrate: false, reason: "invalid-markup" };
  }

  return slug
    ? { hydrate: true, normalizedRoute, slug }
    : { hydrate: true, normalizedRoute };
}

/**
 * Thin DOM helper reading prerender marker attributes from `#root`.
 */
export function readPrerenderMarker(
  root: Element | null,
): PrerenderMarker | null {
  if (!root || !root.hasAttribute(PRERENDERED_ATTR)) {
    return null;
  }

  return {
    prerendered: root.getAttribute(PRERENDERED_ATTR) ?? undefined,
    route: root.getAttribute(PRERENDER_ROUTE_ATTR) ?? undefined,
    version: root.getAttribute(PRERENDER_VERSION_ATTR) ?? undefined,
  };
}

async function defaultPreloadArticle(slug: string): Promise<boolean> {
  const { knowledgeContentService, knowledgeKeys } =
    await import("@features/knowledge-base");

  const result = await knowledgeContentService.getArticle(slug);
  if (result.status !== "found") {
    return false;
  }

  queryClient.setQueryData(knowledgeKeys.article(slug), result);
  return true;
}

export interface HydrateKnowledgeOptions {
  readonly slug?: string;
  readonly preloadArticle?: (slug: string) => Promise<boolean>;
}

/**
 * Hydrates a prerendered Knowledge Base route after pre-populating React Query cache
 * for article pages (D-F6-P2, D-F6.5-05).
 *
 * - Returns `false` (without calling `hydrateRoot`) if article preloading does not succeed,
 *   allowing the caller to fall back cleanly to `createRoot` without double-mounting.
 * - Reports recoverable hydration errors via `reportError(error, "hydration:recoverable")`.
 */
export async function hydrateKnowledge(
  root: HTMLElement,
  element: ReactElement,
  options?: HydrateKnowledgeOptions,
): Promise<boolean> {
  if (options?.slug) {
    const preload = options.preloadArticle ?? defaultPreloadArticle;
    try {
      const preloaded = await preload(options.slug);
      if (!preloaded) {
        return false;
      }
    } catch (err) {
      reportError(err, "hydration:preload");
      return false;
    }
  }

  recordBootMode("hydrate");
  hydrateRoot(root, element, {
    onRecoverableError: (error) => {
      reportError(error, "hydration:recoverable");
    },
  });
  return true;
}

export interface MountAppOptions {
  readonly enabled?: boolean;
  readonly pathname?: string;
  readonly preloadArticle?: (slug: string) => Promise<boolean>;
}

/**
 * Conditional client boot entrypoint (D-F6-A1, D-F6-P2).
 *
 * - When hydration is disabled (default) or `shouldHydrate` is false: calls `createRoot`
 *   synchronously — 100% identical to the existing CSR bootstrap with zero async delay.
 * - When `shouldHydrate` is true: preloads article cache (if needed) and calls `hydrateRoot`.
 *   Never invokes `createRoot` on a container that has already been hydrated.
 */
export function mountApp(
  root: HTMLElement | null,
  element: ReactElement,
  options?: MountAppOptions,
): void {
  if (!root) {
    return;
  }

  const enabled = options?.enabled ?? HYDRATION_ENABLED;
  const pathname =
    options?.pathname ??
    (typeof window !== "undefined" ? window.location.pathname : "/");

  const decision = shouldHydrate({
    enabled,
    pathname,
    marker: readPrerenderMarker(root),
    h1Count: root.querySelectorAll("h1").length,
    hasRoot: true,
  });

  if (!decision.hydrate) {
    recordBootMode("csr");
    createRoot(root).render(element);
    return;
  }

  void hydrateKnowledge(root, element, {
    ...(decision.slug ? { slug: decision.slug } : {}),
    ...(options?.preloadArticle
      ? { preloadArticle: options.preloadArticle }
      : {}),
  }).then((hydrated) => {
    if (!hydrated) {
      recordBootMode("csr");
      createRoot(root).render(element);
    }
  });
}
