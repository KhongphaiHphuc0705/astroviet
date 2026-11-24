import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "@testing-library/react";
import { Suspense } from "react";
import { hydrateRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  knowledgeContentService,
  knowledgeKeys,
  SLUG_PATTERN,
} from "@features/knowledge-base";
import KnowledgeArticlePage from "@pages/knowledge/detail/page";
import KnowledgePage from "@pages/knowledge/page";
import * as reportErrorModule from "@shared/lib/report-error";
import { MarketingLayout } from "@widgets/marketing-layout";

import { render as renderSsr } from "../prerender/entry-server";
import {
  PRERENDER_ROUTE_ATTR,
  PRERENDER_VERSION,
  PRERENDER_VERSION_ATTR,
  PRERENDERED_ATTR,
  PRERENDERED_VALUE,
} from "../prerender/marker";

import {
  HYDRATION_ENABLED,
  hydrateKnowledge,
  mountApp,
  readPrerenderMarker,
  shouldHydrate,
  type HydrationInput,
} from "./hydrate";

describe("Conditional Hydration Gate & Integration (KB-U25, D-F6-P2, D-F6-A1, D-F6.5-04/05)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete window.__ASTROV_BOOT_MODE__;
    document.body.innerHTML = "";
  });

  describe("HYDRATION_ENABLED default flag (D-F6.5-04)", () => {
    it("should default to false when VITE_ENABLE_HYDRATION is unset", () => {
      expect(HYDRATION_ENABLED).toBe(false);
    });
  });

  describe("shouldHydrate pure decision gate (KB-U25)", () => {
    const validBase: HydrationInput = {
      enabled: true,
      pathname: "/knowledge/what-is-astrology",
      marker: {
        prerendered: PRERENDERED_VALUE,
        route: "/knowledge/what-is-astrology",
        version: PRERENDER_VERSION,
      },
      h1Count: 1,
      hasRoot: true,
    };

    it("should allow hydration on valid article and listing routes (including trailing slash /knowledge/)", () => {
      expect(shouldHydrate(validBase)).toEqual({
        hydrate: true,
        normalizedRoute: "/knowledge/what-is-astrology",
        slug: "what-is-astrology",
      });

      expect(
        shouldHydrate({
          ...validBase,
          pathname: "/knowledge/",
          marker: {
            prerendered: PRERENDERED_VALUE,
            route: "/knowledge",
            version: PRERENDER_VERSION,
          },
        }),
      ).toEqual({
        hydrate: true,
        normalizedRoute: "/knowledge",
      });

      expect(SLUG_PATTERN.test("what-is-astrology")).toBe(true);
    });

    it("should reject with exact reason when any condition fails", () => {
      expect(shouldHydrate({ ...validBase, enabled: false })).toEqual({
        hydrate: false,
        reason: "disabled",
      });

      expect(shouldHydrate({ ...validBase, hasRoot: false })).toEqual({
        hydrate: false,
        reason: "no-root",
      });

      expect(shouldHydrate({ ...validBase, marker: null })).toEqual({
        hydrate: false,
        reason: "no-marker",
      });

      expect(
        shouldHydrate({
          ...validBase,
          marker: { ...validBase.marker!, prerendered: "0" },
        }),
      ).toEqual({
        hydrate: false,
        reason: "no-marker",
      });

      expect(shouldHydrate({ ...validBase, pathname: "/" })).toEqual({
        hydrate: false,
        reason: "not-knowledge-route",
      });

      expect(
        shouldHydrate({ ...validBase, pathname: "/app/charts/123" }),
      ).toEqual({
        hydrate: false,
        reason: "not-knowledge-route",
      });

      expect(
        shouldHydrate({ ...validBase, pathname: "/knowledge/Bad_Slug" }),
      ).toEqual({
        hydrate: false,
        reason: "not-knowledge-route",
      });

      expect(
        shouldHydrate({
          ...validBase,
          marker: { ...validBase.marker!, version: "999" },
        }),
      ).toEqual({
        hydrate: false,
        reason: "version-mismatch",
      });

      expect(
        shouldHydrate({
          ...validBase,
          marker: { ...validBase.marker!, route: "/knowledge/other-article" },
        }),
      ).toEqual({
        hydrate: false,
        reason: "route-mismatch",
      });

      expect(shouldHydrate({ ...validBase, h1Count: 0 })).toEqual({
        hydrate: false,
        reason: "invalid-markup",
      });

      expect(shouldHydrate({ ...validBase, h1Count: 2 })).toEqual({
        hydrate: false,
        reason: "invalid-markup",
      });
    });
  });

  describe("readPrerenderMarker", () => {
    it("should return null when root or marker attribute is missing, and parse attributes when present", () => {
      expect(readPrerenderMarker(null)).toBeNull();

      const el = document.createElement("div");
      expect(readPrerenderMarker(el)).toBeNull();

      el.setAttribute(PRERENDERED_ATTR, PRERENDERED_VALUE);
      el.setAttribute(PRERENDER_ROUTE_ATTR, "/knowledge");
      el.setAttribute(PRERENDER_VERSION_ATTR, PRERENDER_VERSION);

      expect(readPrerenderMarker(el)).toEqual({
        prerendered: PRERENDERED_VALUE,
        route: "/knowledge",
        version: PRERENDER_VERSION,
      });
    });
  });

  describe("mountApp & jsdom hydration integration", () => {
    it("should mount via CSR createRoot when hydration flag is disabled (matches existing behavior)", async () => {
      const root = document.createElement("div");
      root.setAttribute(PRERENDERED_ATTR, PRERENDERED_VALUE);
      root.setAttribute(PRERENDER_ROUTE_ATTR, "/knowledge");
      root.setAttribute(PRERENDER_VERSION_ATTR, PRERENDER_VERSION);
      root.innerHTML = "<h1>Prerendered</h1>";
      document.body.appendChild(root);

      await act(async () => {
        mountApp(root, <div>CSR App</div>, {
          enabled: false,
          pathname: "/knowledge",
        });
      });

      expect(window.__ASTROV_BOOT_MODE__).toBe("csr");
      expect(root.textContent).toBe("CSR App");
    });

    it("should fall back to CSR without calling hydrateRoot when article preload returns false", async () => {
      const root = document.createElement("div");
      root.setAttribute(PRERENDERED_ATTR, PRERENDERED_VALUE);
      root.setAttribute(PRERENDER_ROUTE_ATTR, "/knowledge/missing-slug");
      root.setAttribute(PRERENDER_VERSION_ATTR, PRERENDER_VERSION);
      root.innerHTML = "<h1>Prerendered</h1>";
      document.body.appendChild(root);

      const hydrated = await hydrateKnowledge(root, <div>App</div>, {
        slug: "missing-slug",
        preloadArticle: async () => false,
      });

      expect(hydrated).toBe(false);
      expect(window.__ASTROV_BOOT_MODE__).toBeUndefined();
    });

    it("should hydrate real SSR HTML cleanly with preloaded React Query cache and fail when cache is omitted (D-F6.5-05)", async () => {
      const slug = "what-is-astrology";
      const ssrResult = await renderSsr(`/knowledge/${slug}`);
      const articleResult = await knowledgeContentService.getArticle(slug);
      expect(articleResult.status).toBe("found");

      // Case A: WITH pre-populated cache -> 0 recoverable errors, HTML preserved
      const containerOk = document.createElement("div");
      containerOk.innerHTML = ssrResult.html;
      document.body.appendChild(containerOk);

      const preloadedClient = new QueryClient({
        defaultOptions: { queries: { retry: false, staleTime: Infinity } },
      });
      preloadedClient.setQueryData(knowledgeKeys.article(slug), articleResult);

      const reportSpy = vi
        .spyOn(reportErrorModule, "reportError")
        .mockImplementation(() => {});

      const okErrors: unknown[] = [];
      let okRoot: ReturnType<typeof hydrateRoot> | undefined;

      await act(async () => {
        okRoot = hydrateRoot(
          containerOk,
          <QueryClientProvider client={preloadedClient}>
            <MemoryRouter initialEntries={[`/knowledge/${slug}`]}>
              <Routes>
                <Route
                  path="*"
                  element={
                    <MarketingLayout>
                      <Suspense fallback={null}>
                        <Routes>
                          <Route
                            path="/knowledge"
                            element={<KnowledgePage />}
                          />
                          <Route
                            path="/knowledge/:slug"
                            element={<KnowledgeArticlePage />}
                          />
                        </Routes>
                      </Suspense>
                    </MarketingLayout>
                  }
                />
              </Routes>
            </MemoryRouter>
          </QueryClientProvider>,
          {
            onRecoverableError: (err) => {
              okErrors.push(err);
              reportErrorModule.reportError(err, "hydration:recoverable");
            },
          },
        );
      });

      expect(okErrors).toHaveLength(0);
      expect(reportSpy).not.toHaveBeenCalled();
      expect(containerOk.innerHTML).toContain("Lịch sử phát triển");

      await act(async () => {
        okRoot?.unmount();
      });

      // Case B: WITHOUT pre-populated cache -> hydration fails and invokes onRecoverableError
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const containerMissingCache = document.createElement("div");
      containerMissingCache.innerHTML = ssrResult.html;
      document.body.appendChild(containerMissingCache);

      const emptyClient = new QueryClient({
        defaultOptions: { queries: { retry: false, staleTime: Infinity } },
      });
      const failErrors: unknown[] = [];
      let failRoot: ReturnType<typeof hydrateRoot> | undefined;

      await act(async () => {
        failRoot = hydrateRoot(
          containerMissingCache,
          <QueryClientProvider client={emptyClient}>
            <MemoryRouter initialEntries={[`/knowledge/${slug}`]}>
              <Routes>
                <Route
                  path="*"
                  element={
                    <MarketingLayout>
                      <Suspense fallback={null}>
                        <Routes>
                          <Route
                            path="/knowledge"
                            element={<KnowledgePage />}
                          />
                          <Route
                            path="/knowledge/:slug"
                            element={<KnowledgeArticlePage />}
                          />
                        </Routes>
                      </Suspense>
                    </MarketingLayout>
                  }
                />
              </Routes>
            </MemoryRouter>
          </QueryClientProvider>,
          {
            onRecoverableError: (err) => {
              failErrors.push(err);
            },
          },
        );
      });

      expect(failErrors.length).toBeGreaterThan(0);

      await act(async () => {
        failRoot?.unmount();
      });
      consoleErrorSpy.mockRestore();
    });
  });
});
