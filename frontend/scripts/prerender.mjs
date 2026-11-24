import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { loadEnv } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.resolve(__dirname, "..");

function parseCliArgs(argv) {
  let outDir = "dist";
  let ssrEntry = path.join("dist-ssr", "entry-server.js");
  let mode = process.env.MODE || "production";

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--outDir" && argv[i + 1]) {
      outDir = argv[i + 1];
      i += 1;
    } else if (arg === "--ssrEntry" && argv[i + 1]) {
      ssrEntry = argv[i + 1];
      i += 1;
    } else if (arg === "--mode" && argv[i + 1]) {
      mode = argv[i + 1];
      i += 1;
    }
  }

  return {
    outDir: path.resolve(FRONTEND_DIR, outDir),
    ssrEntry: path.resolve(FRONTEND_DIR, ssrEntry),
    mode,
  };
}

function readMergedEnv(mode) {
  const fileEnv = loadEnv(mode, FRONTEND_DIR, "");
  const getVar = (key) =>
    Object.prototype.hasOwnProperty.call(process.env, key)
      ? process.env[key]
      : fileEnv[key];

  return {
    rawSiteUrl: getVar("VITE_SITE_URL"),
    rawStrict: getVar("PRERENDER_STRICT"),
  };
}

function collectKnowledgeFiles(distDir) {
  const found = [];

  const flatListing = path.join(distDir, "knowledge.html");
  if (fs.existsSync(flatListing)) {
    found.push("knowledge.html");
  }

  const knowledgeDir = path.join(distDir, "knowledge");
  if (fs.existsSync(knowledgeDir)) {
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else {
          found.push(path.relative(distDir, full).replace(/\\/g, "/"));
        }
      }
    };
    walk(knowledgeDir);
  }

  return found.sort();
}

function fail(message, details = []) {
  console.error(`\n[prerender] ERROR: ${message}`);
  for (const line of details) {
    console.error(`  - ${line}`);
  }
  console.error("\nPRERENDER FAILED");
  process.exitCode = 1;
}

async function main() {
  const { outDir, ssrEntry, mode } = parseCliArgs(process.argv.slice(2));
  const templatePath = path.join(outDir, "index.html");

  if (!fs.existsSync(outDir) || !fs.existsSync(templatePath)) {
    fail(
      `Client build output missing at "${templatePath}". Run "vite build" before prerendering.`,
    );
    return;
  }

  if (!fs.existsSync(ssrEntry)) {
    fail(
      `SSR entry bundle missing at "${ssrEntry}". Run "vite build --ssr src/prerender/entry-server.tsx --outDir dist-ssr" first.`,
    );
    return;
  }

  let ssrModule;
  try {
    ssrModule = await import(pathToFileURL(ssrEntry).href);
  } catch (err) {
    const errText = err instanceof Error ? err.message : String(err);
    if (
      errText.includes("VITE_API_BASE_URL") ||
      (err && err.name === "ZodError")
    ) {
      fail(
        `Failed to load SSR bundle because VITE_API_BASE_URL is missing or invalid during SSR build/import (${errText}). Ensure VITE_API_BASE_URL is set in .env or environment before running SSR build.`,
      );
      return;
    }
    throw err;
  }

  const {
    buildHead,
    buildRobotsTxt,
    buildSitemapXml,
    injectIntoTemplate,
    listPrerenderArticles,
    listPrerenderRoutes,
    parseStrictFlag,
    render,
    resolveSiteUrlForBuild,
    SITE_NAME,
    validatePrerenderOutput,
    verifyContentIntegrity,
  } = ssrModule;

  // 1. Parse PRERENDER_STRICT & resolve VITE_SITE_URL from single source of truth
  const { rawSiteUrl, rawStrict } = readMergedEnv(mode);
  const strictParsed = parseStrictFlag(rawStrict);
  if ("error" in strictParsed) {
    fail(strictParsed.error);
    return;
  }
  const strict = strictParsed.value;

  const siteUrlResolution = resolveSiteUrlForBuild(rawSiteUrl, { strict });
  if (siteUrlResolution.status === "error") {
    fail(`[${siteUrlResolution.code}] ${siteUrlResolution.message}`);
    return;
  }

  const { siteUrl, source, warnings } = siteUrlResolution;
  for (const warning of warnings) {
    console.warn(`[prerender] WARNING: ${warning}`);
  }

  // 2. Verify manifest schema & two-way Markdown file parity
  const integrity = verifyContentIntegrity();
  if (!integrity.ok) {
    fail("Knowledge Base manifest/content parity failed", integrity.errors);
    return;
  }

  const articles = listPrerenderArticles();
  if (articles.length === 0) {
    if (strict) {
      fail(
        "PRERENDER_STRICT=true forbids publishing an empty Knowledge Base manifest (0 articles).",
      );
      return;
    }
    console.warn(
      "[prerender] WARNING: Knowledge Base manifest has 0 articles; generating listing empty state only (non-strict mode).",
    );
  }

  // 3. Clean previously generated prerender artifacts to prevent stale files (R6)
  fs.rmSync(path.join(outDir, "knowledge"), { recursive: true, force: true });
  fs.rmSync(path.join(outDir, "knowledge.html"), { force: true });
  fs.rmSync(path.join(outDir, "sitemap.xml"), { force: true });
  fs.rmSync(path.join(outDir, "robots.txt"), { force: true });

  // 4. Render each route, inject into template, and write UTF-8 files
  const templateHtml = fs.readFileSync(templatePath, "utf8");
  const routes = listPrerenderRoutes();
  const writtenHtmlFiles = {};
  const reportRows = [];

  for (const route of routes) {
    const { html: appHtml } = await render(route.url);
    const { seo, headTags } = buildHead(route, siteUrl);
    const fullHtml = injectIntoTemplate({
      templateHtml,
      appHtml,
      routePath: route.url,
      seo,
      headTags,
      baseTitle: SITE_NAME,
    });

    const byteLength = Buffer.byteLength(fullHtml, "utf8");
    for (const relOutput of route.outputPaths) {
      const targetPath = path.join(outDir, relOutput);
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, fullHtml, "utf8");
      writtenHtmlFiles[relOutput] = fullHtml;
      reportRows.push({ route: route.url, file: relOutput, bytes: byteLength });
    }
  }

  // 5. Generate sitemap.xml and robots.txt
  const sitemapXml = buildSitemapXml({ siteUrl, articles });
  const robotsTxt = buildRobotsTxt({ siteUrl });

  fs.writeFileSync(path.join(outDir, "sitemap.xml"), sitemapXml, "utf8");
  fs.writeFileSync(path.join(outDir, "robots.txt"), robotsTxt, "utf8");
  reportRows.push(
    {
      route: "/sitemap.xml",
      file: "sitemap.xml",
      bytes: Buffer.byteLength(sitemapXml, "utf8"),
    },
    {
      route: "/robots.txt",
      file: "robots.txt",
      bytes: Buffer.byteLength(robotsTxt, "utf8"),
    },
  );

  // 6. Self-validate KB-P01..KB-P11
  const allKnowledgeFiles = collectKnowledgeFiles(outDir);
  const validation = validatePrerenderOutput({
    siteUrl,
    strict,
    articles,
    htmlFiles: writtenHtmlFiles,
    sitemapXml,
    robotsTxt,
    allKnowledgeFiles,
  });

  // 7. Print structured summary report
  console.log(
    `\n[prerender] mode=${mode} strict=${String(strict)} siteUrl=${siteUrl} (source=${source})`,
  );
  console.log("[prerender] Generated artifacts:");
  for (const row of reportRows) {
    console.log(
      `  ${row.route.padEnd(36)} -> ${row.file.padEnd(36)} ${String(row.bytes).padStart(7)} B`,
    );
  }
  console.log("[prerender] Self-validation (KB-P01..KB-P11):");
  for (const check of validation.checks) {
    console.log(
      `  [${check.status.toUpperCase()}] ${check.id}: ${check.message}`,
    );
  }

  if (!validation.ok) {
    fail("Prerender self-validation failed", validation.errors);
    return;
  }

  console.log("\nPRERENDER OK");
}

main().catch((err) => {
  fail(err instanceof Error ? err.message : String(err));
});
