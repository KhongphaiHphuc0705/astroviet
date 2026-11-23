import {
  buildKnowledgeArticleSeo,
  buildKnowledgeListSeo,
  buildRobotsTxt,
  buildSitemapXml,
  escapeHtml,
  KNOWLEDGE_LIST_PATH,
  knowledgeArticlePath,
  normalizeSiteUrl,
  resolveSiteUrlForBuild,
  SITE_NAME,
  type KnowledgeArticleMetadata,
  type KnowledgeSeo,
} from "@features/knowledge-base";

import {
  BASE_TITLE_ATTR,
  PRERENDER_ROUTE_ATTR,
  PRERENDER_VERSION,
  PRERENDER_VERSION_ATTR,
  PRERENDERED_ATTR,
  PRERENDERED_VALUE,
} from "./marker";

/**
 * Minimum visible text length (stripped of HTML tags) required inside `<article>`
 * for prerendered article pages (KB-P07).
 */
export const MIN_ARTICLE_TEXT_LENGTH = 200;

export interface InjectIntoTemplateInput {
  readonly templateHtml: string;
  readonly appHtml: string;
  readonly routePath: string;
  readonly seo: KnowledgeSeo;
  readonly headTags: string;
  readonly baseTitle?: string;
}

/**
 * Injects prerendered `<title>`, head meta tags, and `#root` markup + markers
 * into the built `dist/index.html` template (D-F6-P2, D-F6.5-06).
 *
 * Fails loudly if any required template anchor (`<title>`, `</head>`, `<div id="root"></div>`)
 * is missing or duplicated, and uses function replacers so `$` sequences in article
 * body text are never interpreted as regex replacement patterns.
 */
export function injectIntoTemplate(input: InjectIntoTemplateInput): string {
  const {
    templateHtml,
    appHtml,
    routePath,
    seo,
    headTags,
    baseTitle = SITE_NAME,
  } = input;

  const titleMatches = templateHtml.match(/<title>[^<]*<\/title>/g);
  if (!titleMatches || titleMatches.length !== 1) {
    throw new Error(
      `Template missing unique <title>...</title> anchor (found ${titleMatches?.length ?? 0}).`,
    );
  }

  const headCloseMatches = templateHtml.match(/<\/head>/g);
  if (!headCloseMatches || headCloseMatches.length !== 1) {
    throw new Error(
      `Template missing unique </head> anchor (found ${headCloseMatches?.length ?? 0}).`,
    );
  }

  const rootMatches = templateHtml.match(/<div\s+id="root"\s*><\/div>/g);
  if (!rootMatches || rootMatches.length !== 1) {
    throw new Error(
      `Template missing unique <div id="root"></div> anchor (found ${rootMatches?.length ?? 0}).`,
    );
  }

  const titleTag = `<title ${BASE_TITLE_ATTR}="${escapeHtml(baseTitle)}">${escapeHtml(seo.title)}</title>`;
  const indentedHeadTags = headTags
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => `    ${line}`)
    .join("\n");

  const rootOpening = `<div id="root" ${PRERENDERED_ATTR}="${PRERENDERED_VALUE}" ${PRERENDER_ROUTE_ATTR}="${escapeHtml(routePath)}" ${PRERENDER_VERSION_ATTR}="${escapeHtml(PRERENDER_VERSION)}">`;

  let output = templateHtml.replace(/<title>[^<]*<\/title>/, () => titleTag);
  output = output.replace(/<\/head>/, () => `${indentedHeadTags}\n  </head>`);
  output = output.replace(
    /<div\s+id="root"\s*><\/div>/,
    () => `${rootOpening}${appHtml}</div>`,
  );

  return output;
}

export type PrerenderCheckId =
  | "KB-P01"
  | "KB-P02"
  | "KB-P03"
  | "KB-P04"
  | "KB-P05"
  | "KB-P06"
  | "KB-P07"
  | "KB-P08"
  | "KB-P09"
  | "KB-P10"
  | "KB-P11";

export interface PrerenderValidationCheck {
  readonly id: PrerenderCheckId;
  readonly status: "pass" | "fail";
  readonly message: string;
}

export interface PrerenderValidationInput {
  readonly siteUrl: string;
  readonly strict: boolean;
  readonly articles: readonly KnowledgeArticleMetadata[];
  /** Relative paths under `dist/` using forward slashes (e.g. `"knowledge.html"`, `"knowledge/index.html"`, `"knowledge/<slug>.html"`). */
  readonly htmlFiles: Readonly<Record<string, string>>;
  readonly sitemapXml: string;
  readonly robotsTxt: string;
  /** Optional complete inventory of generated files under `dist/knowledge*` to detect stale or nested `<slug>/index.html` files. */
  readonly allKnowledgeFiles?: readonly string[];
}

export interface PrerenderValidationResult {
  readonly ok: boolean;
  readonly checks: readonly PrerenderValidationCheck[];
  readonly errors: readonly string[];
}

function unescapeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function extractMetaContents(
  html: string,
  attrName: "name" | "property",
  attrValue: string,
): string[] {
  const results: string[] = [];
  const tagRegex = /<meta\b[^>]*>/gi;
  for (const match of html.matchAll(tagRegex)) {
    const tag = match[0];
    const keyMatch = new RegExp(`\\b${attrName}\\s*=\\s*"([^"]*)"`, "i").exec(
      tag,
    );
    if (keyMatch?.[1]?.toLowerCase() !== attrValue.toLowerCase()) {
      continue;
    }
    const contentMatch = /\bcontent\s*=\s*"([^"]*)"/i.exec(tag);
    if (contentMatch?.[1] !== undefined) {
      results.push(unescapeHtml(contentMatch[1]));
    }
  }
  return results;
}

function extractCanonicalHrefs(html: string): string[] {
  const results: string[] = [];
  const linkRegex = /<link\b[^>]*>/gi;
  for (const match of html.matchAll(linkRegex)) {
    const tag = match[0];
    if (!/\brel\s*=\s*"canonical"/i.test(tag)) {
      continue;
    }
    const hrefMatch = /\bhref\s*=\s*"([^"]*)"/i.exec(tag);
    if (hrefMatch?.[1] !== undefined) {
      results.push(unescapeHtml(hrefMatch[1]));
    }
  }
  return results;
}

function extractTitles(html: string): string[] {
  return [...html.matchAll(/<title\b[^>]*>([^<]*)<\/title>/gi)].map((m) =>
    unescapeHtml(m[1] ?? ""),
  );
}

function extractRootOpenTag(html: string): string | null {
  const match = /<div\b[^>]*\bid="root"[^>]*>/i.exec(html);
  return match ? match[0] : null;
}

function extractAttr(tag: string, attrName: string): string | null {
  const match = new RegExp(`\\b${attrName}\\s*=\\s*"([^"]*)"`, "i").exec(tag);
  return match?.[1] !== undefined ? unescapeHtml(match[1]) : null;
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasPlaceholder(text: string): boolean {
  return (
    /<production-domain>/i.test(text) ||
    /\bexample\.com\b/i.test(text) ||
    /\bundefined\/knowledge\b/i.test(text)
  );
}

/**
 * Pure self-validator implementing KB-P01..KB-P11 over prerendered outputs (F6 plan §9.2).
 */
export function validatePrerenderOutput(
  input: PrerenderValidationInput,
): PrerenderValidationResult {
  const { siteUrl, strict, articles, htmlFiles, sitemapXml, robotsTxt } = input;
  const checks: PrerenderValidationCheck[] = [];

  const record = (
    id: PrerenderCheckId,
    issues: readonly string[],
    passMsg: string,
  ): void => {
    if (issues.length === 0) {
      checks.push({ id, status: "pass", message: passMsg });
    } else {
      checks.push({ id, status: "fail", message: issues.join("; ") });
    }
  };

  // Validate siteUrl normalization upfront for downstream checks
  let normalizedSiteUrl = "";
  const p08Issues: string[] = [];
  try {
    normalizedSiteUrl = normalizeSiteUrl(siteUrl);
  } catch (err) {
    p08Issues.push(
      `Invalid siteUrl "${siteUrl}": ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  interface ExpectedFileSpec {
    readonly relPath: string;
    readonly routePath: string;
    readonly kind: "list" | "article";
    readonly seo: KnowledgeSeo;
  }

  const expectedSpecs: ExpectedFileSpec[] = [];
  if (normalizedSiteUrl) {
    const listSeo = buildKnowledgeListSeo({ siteUrl: normalizedSiteUrl });
    expectedSpecs.push(
      {
        relPath: "knowledge.html",
        routePath: KNOWLEDGE_LIST_PATH,
        kind: "list",
        seo: listSeo,
      },
      {
        relPath: "knowledge/index.html",
        routePath: KNOWLEDGE_LIST_PATH,
        kind: "list",
        seo: listSeo,
      },
    );
    for (const article of articles) {
      const routePath = knowledgeArticlePath(article.slug);
      expectedSpecs.push({
        relPath: `knowledge/${article.slug}.html`,
        routePath,
        kind: "article",
        seo: buildKnowledgeArticleSeo({
          siteUrl: normalizedSiteUrl,
          article,
        }),
      });
    }
  }

  // KB-P09: File layout & no stale / nested <slug>/index.html files
  const p09Issues: string[] = [];
  const expectedRelPaths = new Set(expectedSpecs.map((s) => s.relPath));
  for (const spec of expectedSpecs) {
    if (htmlFiles[spec.relPath] === undefined) {
      p09Issues.push(`Missing required prerender file "${spec.relPath}"`);
    }
  }
  if (
    htmlFiles["knowledge.html"] !== undefined &&
    htmlFiles["knowledge/index.html"] !== undefined &&
    htmlFiles["knowledge.html"] !== htmlFiles["knowledge/index.html"]
  ) {
    p09Issues.push(
      'Listing files "knowledge.html" and "knowledge/index.html" must have identical contents',
    );
  }
  const actualInventory = input.allKnowledgeFiles ?? Object.keys(htmlFiles);
  for (const relPath of actualInventory) {
    const normalizedRel = relPath.replace(/\\/g, "/");
    if (
      normalizedRel !== "knowledge/index.html" &&
      /^knowledge\/[^/]+\/index\.html$/i.test(normalizedRel)
    ) {
      p09Issues.push(
        `Forbidden nested article index path "${normalizedRel}" (flat layout required)`,
      );
    } else if (!expectedRelPaths.has(normalizedRel)) {
      p09Issues.push(
        `Unexpected/stale prerender file "${normalizedRel}" not in manifest`,
      );
    }
  }
  record(
    "KB-P09",
    p09Issues,
    `Layout OK: ${expectedSpecs.length} files (knowledge.html + knowledge/index.html + ${articles.length} article flat files, 0 stale)`,
  );

  // KB-P01..P04, P07, P10 across each expected HTML file
  const p01Issues: string[] = [];
  const p02Issues: string[] = [];
  const p03Issues: string[] = [];
  const p04Issues: string[] = [];
  const p07Issues: string[] = [];
  const p10Issues: string[] = [];

  const titleByRoute = new Map<string, string>();
  const routeByTitle = new Map<string, string>();

  for (const spec of expectedSpecs) {
    const html = htmlFiles[spec.relPath];
    if (html === undefined) {
      continue; // Already reported in KB-P09
    }

    // KB-P01: <title>
    const titles = extractTitles(html);
    if (titles.length !== 1) {
      p01Issues.push(
        `${spec.relPath}: expected 1 <title>, found ${titles.length}`,
      );
    } else {
      const actualTitle = titles[0] ?? "";
      if (actualTitle.trim().length === 0) {
        p01Issues.push(`${spec.relPath}: <title> is empty`);
      } else if (actualTitle !== spec.seo.title) {
        p01Issues.push(
          `${spec.relPath}: <title> mismatch ("${actualTitle}" !== "${spec.seo.title}")`,
        );
      } else {
        const existingRoute = routeByTitle.get(actualTitle);
        if (existingRoute && existingRoute !== spec.routePath) {
          p01Issues.push(
            `Duplicate <title> "${actualTitle}" shared by "${existingRoute}" and "${spec.routePath}"`,
          );
        }
        routeByTitle.set(actualTitle, spec.routePath);
        titleByRoute.set(spec.routePath, actualTitle);
      }
    }

    // KB-P02: meta description
    const descriptions = extractMetaContents(html, "name", "description");
    if (descriptions.length !== 1) {
      p02Issues.push(
        `${spec.relPath}: expected 1 meta description, found ${descriptions.length}`,
      );
    } else if (descriptions[0] !== spec.seo.description) {
      p02Issues.push(`${spec.relPath}: meta description does not match SEO`);
    }

    // KB-P03: canonical
    const canonicals = extractCanonicalHrefs(html);
    if (canonicals.length !== 1) {
      p03Issues.push(
        `${spec.relPath}: expected 1 canonical link, found ${canonicals.length}`,
      );
    } else {
      const actualCanonical = canonicals[0] ?? "";
      if (actualCanonical !== spec.seo.canonicalUrl) {
        p03Issues.push(
          `${spec.relPath}: canonical mismatch ("${actualCanonical}" !== "${spec.seo.canonicalUrl}")`,
        );
      }
      if (actualCanonical.endsWith("/")) {
        p03Issues.push(
          `${spec.relPath}: canonical must not end with trailing slash ("${actualCanonical}")`,
        );
      }
      if (/[^:]\/\//.test(actualCanonical)) {
        p03Issues.push(
          `${spec.relPath}: canonical contains double slash ("${actualCanonical}")`,
        );
      }
    }

    // KB-P04: OG minimal, no duplicates, no og:image
    const ogTitle = extractMetaContents(html, "property", "og:title");
    const ogDesc = extractMetaContents(html, "property", "og:description");
    const ogType = extractMetaContents(html, "property", "og:type");
    const ogUrl = extractMetaContents(html, "property", "og:url");
    const ogImage = extractMetaContents(html, "property", "og:image");

    if (ogTitle.length !== 1 || ogTitle[0] !== spec.seo.openGraph.title) {
      p04Issues.push(`${spec.relPath}: invalid or duplicate og:title`);
    }
    if (ogDesc.length !== 1 || ogDesc[0] !== spec.seo.openGraph.description) {
      p04Issues.push(`${spec.relPath}: invalid or duplicate og:description`);
    }
    if (ogType.length !== 1 || ogType[0] !== spec.seo.openGraph.type) {
      p04Issues.push(`${spec.relPath}: invalid or duplicate og:type`);
    }
    if (ogUrl.length !== 1 || ogUrl[0] !== spec.seo.openGraph.url) {
      p04Issues.push(`${spec.relPath}: invalid or duplicate og:url`);
    }
    if (ogImage.length > 0) {
      p04Issues.push(`${spec.relPath}: forbidden og:image tag present`);
    }

    // KB-P07: exactly 1 <h1> + real rendered content (not SPA shell)
    const h1Matches = html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi) ?? [];
    if (h1Matches.length !== 1) {
      p07Issues.push(
        `${spec.relPath}: expected exactly 1 <h1>, found ${h1Matches.length}`,
      );
    }
    if (!html.includes('id="main-content"')) {
      p07Issues.push(`${spec.relPath}: missing <main id="main-content">`);
    }
    if (/<div\b[^>]*\bid="root"[^>]*>\s*<\/div>/i.test(html)) {
      p07Issues.push(`${spec.relPath}: #root is empty (SPA shell only)`);
    }
    if (spec.kind === "list") {
      if (!html.includes("Kiến thức chiêm tinh")) {
        p07Issues.push(
          `${spec.relPath}: listing HTML missing approved heading text`,
        );
      }
    } else {
      const articleMatch = /<article\b[^>]*>([\s\S]*?)<\/article>/i.exec(html);
      const articleText = articleMatch
        ? stripHtmlTags(articleMatch[1] ?? "")
        : "";
      if (articleText.length < MIN_ARTICLE_TEXT_LENGTH) {
        p07Issues.push(
          `${spec.relPath}: article text length ${articleText.length} < minimum ${MIN_ARTICLE_TEXT_LENGTH}`,
        );
      }
    }

    // KB-P08: placeholder scan on HTML
    if (hasPlaceholder(html)) {
      p08Issues.push(`${spec.relPath}: contains placeholder domain/URL`);
    }

    // KB-P10: #root data-prerendered marker attributes
    const rootTag = extractRootOpenTag(html);
    if (!rootTag) {
      p10Issues.push(`${spec.relPath}: missing #root element`);
    } else {
      const isPrerendered = extractAttr(rootTag, PRERENDERED_ATTR);
      const routeAttr = extractAttr(rootTag, PRERENDER_ROUTE_ATTR);
      const versionAttr = extractAttr(rootTag, PRERENDER_VERSION_ATTR);
      if (isPrerendered !== PRERENDERED_VALUE) {
        p10Issues.push(
          `${spec.relPath}: missing or invalid ${PRERENDERED_ATTR}="${PRERENDERED_VALUE}"`,
        );
      }
      if (routeAttr !== spec.routePath) {
        p10Issues.push(
          `${spec.relPath}: ${PRERENDER_ROUTE_ATTR}="${routeAttr ?? ""}" !== "${spec.routePath}"`,
        );
      }
      if (versionAttr !== PRERENDER_VERSION) {
        p10Issues.push(
          `${spec.relPath}: ${PRERENDER_VERSION_ATTR}="${versionAttr ?? ""}" !== "${PRERENDER_VERSION}"`,
        );
      }
    }
  }

  record(
    "KB-P01",
    p01Issues,
    `Unique <title> verified across ${titleByRoute.size} routes`,
  );
  record("KB-P02", p02Issues, "Meta description verified on all HTML files");
  record(
    "KB-P03",
    p03Issues,
    "Canonical URLs verified (exact host, no trailing slash, no double slash)",
  );
  record(
    "KB-P04",
    p04Issues,
    "Minimal OG tags verified with 0 duplicates and 0 og:image",
  );

  // KB-P05: sitemap.xml parity with manifest & generated files
  const p05Issues: string[] = [];
  if (!normalizedSiteUrl) {
    p05Issues.push("Cannot validate sitemap.xml without valid siteUrl");
  } else {
    if (!sitemapXml.includes("<urlset")) {
      p05Issues.push("sitemap.xml missing <urlset>");
    }
    const locs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
      unescapeHtml(m[1] ?? ""),
    );
    const seenLocs = new Set<string>();
    for (const loc of locs) {
      if (seenLocs.has(loc)) {
        p05Issues.push(`Duplicate <loc> in sitemap.xml: "${loc}"`);
      }
      seenLocs.add(loc);
      if (loc === normalizedSiteUrl || loc === `${normalizedSiteUrl}/`) {
        p05Issues.push(`Forbidden root home URL in sitemap.xml: "${loc}"`);
      }
    }

    const expectedLocs = [
      `${normalizedSiteUrl}${KNOWLEDGE_LIST_PATH}`,
      ...articles.map(
        (a) => `${normalizedSiteUrl}${knowledgeArticlePath(a.slug)}`,
      ),
    ];
    const expectedLocSet = new Set(expectedLocs);

    for (const expectedLoc of expectedLocs) {
      if (!seenLocs.has(expectedLoc)) {
        p05Issues.push(`Missing expected URL in sitemap.xml: "${expectedLoc}"`);
      }
    }
    for (const actualLoc of seenLocs) {
      if (!expectedLocSet.has(actualLoc)) {
        p05Issues.push(
          `Unexpected URL in sitemap.xml with no manifest entry: "${actualLoc}"`,
        );
      }
    }

    // Verify exact canonical XML matches generator output
    const canonicalXml = buildSitemapXml({
      siteUrl: normalizedSiteUrl,
      articles,
    });
    if (locs.length !== expectedLocs.length) {
      p05Issues.push(
        `sitemap.xml URL count mismatch (${locs.length} !== ${expectedLocs.length})`,
      );
    } else if (sitemapXml.trim() !== canonicalXml.trim()) {
      p05Issues.push("sitemap.xml content diverges from deterministic builder");
    }
  }
  record(
    "KB-P05",
    p05Issues,
    `sitemap.xml verified (${articles.length + 1} URLs, exact manifest parity, no / or duplicates)`,
  );

  // KB-P06: robots.txt
  const p06Issues: string[] = [];
  if (!normalizedSiteUrl) {
    p06Issues.push("Cannot validate robots.txt without valid siteUrl");
  } else {
    const expectedRobots = buildRobotsTxt({ siteUrl: normalizedSiteUrl });
    if (robotsTxt.replace(/\r\n/g, "\n") !== expectedRobots) {
      p06Issues.push("robots.txt does not match approved template & Sitemap");
    }
    if (hasPlaceholder(robotsTxt)) {
      p06Issues.push("robots.txt contains placeholder domain");
    }
  }
  record(
    "KB-P06",
    p06Issues,
    "robots.txt matches approved directives & Sitemap",
  );

  record(
    "KB-P07",
    p07Issues,
    `All prerendered files contain single <h1> and real content (>= ${MIN_ARTICLE_TEXT_LENGTH} chars per article)`,
  );

  if (hasPlaceholder(sitemapXml) || hasPlaceholder(robotsTxt)) {
    p08Issues.push("sitemap.xml or robots.txt contains placeholder domain");
  }
  record(
    "KB-P08",
    p08Issues,
    `Site URL valid (${normalizedSiteUrl}) with 0 placeholders`,
  );
  record(
    "KB-P10",
    p10Issues,
    `Prerender markers (${PRERENDERED_ATTR}, ${PRERENDER_ROUTE_ATTR}, ${PRERENDER_VERSION_ATTR}="${PRERENDER_VERSION}") verified`,
  );

  // KB-P11: PRERENDER_STRICT enforcement
  const p11Issues: string[] = [];
  if (strict) {
    const strictCheck = resolveSiteUrlForBuild(siteUrl, { strict: true });
    if (strictCheck.status === "error") {
      p11Issues.push(strictCheck.message);
    }
    if (articles.length === 0) {
      p11Issues.push(
        "PRERENDER_STRICT=true forbids publishing an empty Knowledge Base manifest (0 articles)",
      );
    }
    const localLeakPattern =
      /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?::\d+)?/i;
    for (const [relPath, html] of Object.entries(htmlFiles)) {
      const canonicals = extractCanonicalHrefs(html);
      for (const href of canonicals) {
        if (!href.startsWith("https://") || localLeakPattern.test(href)) {
          p11Issues.push(
            `${relPath}: strict mode forbids non-https/local canonical "${href}"`,
          );
        }
      }
    }
    if (
      localLeakPattern.test(sitemapXml) ||
      /<loc>http:\/\//i.test(sitemapXml)
    ) {
      p11Issues.push(
        "sitemap.xml contains localhost or non-https URL in strict mode",
      );
    }
    if (
      localLeakPattern.test(robotsTxt) ||
      /Sitemap:\s*http:\/\//i.test(robotsTxt)
    ) {
      p11Issues.push(
        "robots.txt contains localhost or non-https Sitemap URL in strict mode",
      );
    }
  }
  record(
    "KB-P11",
    p11Issues,
    strict
      ? "PRERENDER_STRICT=true verified (https, non-local, non-empty manifest, 0 leaks)"
      : "PRERENDER_STRICT=false (non-strict local/CI mode)",
  );

  const errors = checks
    .filter((c) => c.status === "fail")
    .map((c) => `[${c.id}] ${c.message}`);

  return {
    ok: errors.length === 0,
    checks,
    errors,
  };
}
