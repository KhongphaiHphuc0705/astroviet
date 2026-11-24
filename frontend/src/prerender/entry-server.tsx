import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";
import { renderToString } from "react-dom/server";
import { Route, Routes, StaticRouter } from "react-router-dom";

import {
  ArticleNotFound,
  buildKnowledgeArticleSeo,
  buildKnowledgeListSeo,
  buildKnowledgeNotFoundSeo,
  buildRobotsTxt,
  buildSitemapXml,
  checkContentParity,
  contentRegistry,
  KNOWLEDGE_LIST_PATH,
  KNOWLEDGE_MANIFEST,
  knowledgeArticlePath,
  knowledgeContentService,
  knowledgeKeys,
  parseStrictFlag,
  resolveSiteUrlForBuild,
  serializeHeadTags,
  SITE_NAME,
  validateManifest,
  type KnowledgeArticleMetadata,
  type KnowledgeSeo,
} from "@features/knowledge-base";
import KnowledgeArticlePage from "@pages/knowledge/detail/page";
import KnowledgePage from "@pages/knowledge/page";
import { MarketingLayout } from "@widgets/marketing-layout";

import { normalizePrerenderRoute, PRERENDER_VERSION } from "./marker";
import {
  injectIntoTemplate,
  MIN_ARTICLE_TEXT_LENGTH,
  validatePrerenderOutput,
} from "./validate";

export type PrerenderRoute =
  | {
      readonly kind: "list";
      readonly url: typeof KNOWLEDGE_LIST_PATH;
      readonly outputPaths: readonly ["knowledge.html", "knowledge/index.html"];
    }
  | {
      readonly kind: "article";
      readonly url: string;
      readonly slug: string;
      readonly article: KnowledgeArticleMetadata;
      readonly outputPaths: readonly [string];
    };

export type RenderRouteInfo =
  | {
      readonly kind: "list";
      readonly url: typeof KNOWLEDGE_LIST_PATH;
    }
  | {
      readonly kind: "article";
      readonly url: string;
      readonly slug: string;
      readonly article: KnowledgeArticleMetadata;
    }
  | {
      readonly kind: "not-found";
      readonly url: string;
    };

export interface RenderResult {
  readonly html: string;
  readonly route: RenderRouteInfo;
}

export interface BuiltHead {
  readonly seo: KnowledgeSeo;
  readonly headTags: string;
}

export interface ContentIntegrityReport {
  readonly ok: boolean;
  readonly errors: readonly string[];
}

/**
 * Validates manifest schema and two-way manifest <-> Markdown file parity
 * before prerendering begins.
 */
export function verifyContentIntegrity(): ContentIntegrityReport {
  const errors: string[] = [];

  const manifestResult = validateManifest(KNOWLEDGE_MANIFEST);
  if (manifestResult.status === "invalid") {
    for (const issue of manifestResult.issues) {
      errors.push(`[manifest:${issue.code}] ${issue.message}`);
    }
  }

  const parityResult = checkContentParity(
    KNOWLEDGE_MANIFEST,
    contentRegistry.listRawKeys(),
  );
  for (const issue of parityResult.missingFiles) {
    errors.push(`[parity:missing-file] ${issue.message}`);
  }
  for (const issue of parityResult.orphanFiles) {
    errors.push(`[parity:orphan-file] ${issue.message}`);
  }
  for (const key of parityResult.malformedKeys) {
    errors.push(`[parity:malformed-key] Unexpected content key "${key}"`);
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Returns the deterministic list of routes to prerender (D-F6-P5b, D-F6.5-01).
 *
 * Listing emits BOTH `knowledge.html` and `knowledge/index.html` (identical content,
 * canonical `/knowledge`); each article emits flat `knowledge/<slug>.html`.
 */
export function listPrerenderRoutes(): readonly PrerenderRoute[] {
  const articles = knowledgeContentService.listArticles();
  const routes: PrerenderRoute[] = [
    {
      kind: "list",
      url: KNOWLEDGE_LIST_PATH,
      outputPaths: ["knowledge.html", "knowledge/index.html"],
    },
  ];

  for (const article of articles) {
    routes.push({
      kind: "article",
      url: knowledgeArticlePath(article.slug),
      slug: article.slug,
      article,
      outputPaths: [`knowledge/${article.slug}.html`],
    });
  }

  return routes;
}

/**
 * Returns the validated, deterministically sorted articles from `knowledgeContentService`.
 */
export function listPrerenderArticles(): readonly KnowledgeArticleMetadata[] {
  return knowledgeContentService.listArticles();
}

/**
 * Builds SEO metadata and serialized `<head>` tags (stamped with `data-prerendered="1"`)
 * from the single `model/seo.ts` source of truth.
 */
export function buildHead(
  route: PrerenderRoute | RenderRouteInfo,
  siteUrl: string,
): BuiltHead {
  let seo: KnowledgeSeo;
  if (route.kind === "list") {
    seo = buildKnowledgeListSeo({ siteUrl });
  } else if (route.kind === "article") {
    seo = buildKnowledgeArticleSeo({ siteUrl, article: route.article });
  } else {
    seo = buildKnowledgeNotFoundSeo();
  }

  return {
    seo,
    headTags: serializeHeadTags(seo, { marker: true }),
  };
}

/**
 * Renders a Knowledge Base URL to HTML in pure Node without browser globals (D-F6-P1, D-F6.5-05).
 *
 * - Uses a fresh `QueryClient` per call to prevent cross-route state leakage.
 * - Pre-populates React Query cache for known articles before `renderToString`.
 * - Throws on `content-error` so broken articles fail the prerender build.
 * - Unknown slugs render `ArticleNotFound` without throwing (not written to disk by script).
 */
export async function render(url: string): Promise<RenderResult> {
  const normalizedUrl = normalizePrerenderRoute(url);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });

  try {
    let route: RenderRouteInfo;

    if (normalizedUrl === KNOWLEDGE_LIST_PATH) {
      route = { kind: "list", url: KNOWLEDGE_LIST_PATH };
    } else {
      const slugMatch = /^\/knowledge\/([^/]+)$/.exec(normalizedUrl);
      const slug = slugMatch?.[1];
      const metadata = slug
        ? knowledgeContentService.getArticleMetadata(slug)
        : undefined;

      if (slug && metadata) {
        const result = await knowledgeContentService.getArticle(slug);
        if (result.status === "content-error") {
          throw new Error(
            `SSR prerender failed for "${normalizedUrl}": content-error (${result.reason})`,
          );
        }
        if (result.status === "not-found") {
          throw new Error(
            `SSR prerender failed for "${normalizedUrl}": manifest entry missing content`,
          );
        }
        queryClient.setQueryData(knowledgeKeys.article(slug), result);
        route = {
          kind: "article",
          url: normalizedUrl,
          slug,
          article: metadata,
        };
      } else {
        route = { kind: "not-found", url: normalizedUrl };
      }
    }

    const html = renderToString(
      <QueryClientProvider client={queryClient}>
        <StaticRouter location={normalizedUrl}>
          <Routes>
            <Route
              path="*"
              element={
                <MarketingLayout>
                  <Suspense fallback={null}>
                    <Routes>
                      <Route
                        path={KNOWLEDGE_LIST_PATH}
                        element={<KnowledgePage />}
                      />
                      <Route
                        path="/knowledge/:slug"
                        element={<KnowledgeArticlePage />}
                      />
                      <Route path="*" element={<ArticleNotFound />} />
                    </Routes>
                  </Suspense>
                </MarketingLayout>
              }
            />
          </Routes>
        </StaticRouter>
      </QueryClientProvider>,
    );

    return { html, route };
  } finally {
    queryClient.clear();
  }
}

// Re-export pure helpers consumed by `scripts/prerender.mjs` so the script stays thin I/O only.
export {
  buildRobotsTxt,
  buildSitemapXml,
  injectIntoTemplate,
  MIN_ARTICLE_TEXT_LENGTH,
  parseStrictFlag,
  PRERENDER_VERSION,
  resolveSiteUrlForBuild,
  SITE_NAME,
  validatePrerenderOutput,
};
