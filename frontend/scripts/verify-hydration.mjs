import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.resolve(__dirname, "..");

const OUT_DIR = path.join(FRONTEND_DIR, "dist-hydration");
const SSR_OUT_DIR = path.join(FRONTEND_DIR, "dist-ssr-hydration");
const PREVIEW_PORT = 4185;
const JS_DELAY_MS = 800;
const CLS_THRESHOLD = 0.1;

const VIEWPORTS = [
  { name: "1280x800", width: 1280, height: 800 },
  { name: "375x667", width: 375, height: 667 },
];

const HYDRATION_ERROR_PATTERN =
  /hydrat|did not match|Minified React error #(418|423|425)/i;

function parseArgs(argv) {
  let fallback = false;
  let reportPath = path.join(FRONTEND_DIR, "dist-ssr", "hydration-report.json");
  let skipBuild = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--fallback") {
      fallback = true;
    } else if (arg === "--skip-build") {
      skipBuild = true;
    } else if (arg === "--report" && argv[i + 1]) {
      reportPath = path.resolve(FRONTEND_DIR, argv[i + 1]);
      i += 1;
    }
  }

  return { fallback, reportPath, skipBuild };
}

function runCommand(command, args, extraEnv = {}) {
  if (command === "node") {
    execFileSync(process.execPath, args, {
      cwd: FRONTEND_DIR,
      stdio: "inherit",
      env: { ...process.env, ...extraEnv },
    });
    return;
  }

  const isWin = process.platform === "win32";
  const bin = isWin && !command.endsWith(".cmd") ? `${command}.cmd` : command;
  execFileSync(bin, args, {
    cwd: FRONTEND_DIR,
    stdio: "inherit",
    shell: isWin,
    env: { ...process.env, ...extraEnv },
  });
}

function killProcessTree(proc) {
  if (!proc || !proc.pid) {
    return;
  }
  try {
    if (process.platform === "win32") {
      execFileSync("taskkill", ["/pid", String(proc.pid), "/T", "/F"], {
        stdio: "ignore",
      });
    } else {
      proc.kill("SIGTERM");
    }
  } catch {
    // Process may already have exited
  }
}

async function waitForServer(url, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        return;
      }
    } catch {
      // Retry until ready
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for preview server at ${url}`);
}

function readArticleRoutesFromSitemap(outDir) {
  const sitemapPath = path.join(outDir, "sitemap.xml");
  if (!fs.existsSync(sitemapPath)) {
    throw new Error(`Missing sitemap.xml at ${sitemapPath}`);
  }
  const xml = fs.readFileSync(sitemapPath, "utf8");
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const articleRoutes = [];
  for (const rawUrl of urls) {
    const parsed = new URL(rawUrl);
    if (/^\/knowledge\/[a-z0-9-]+$/.test(parsed.pathname)) {
      articleRoutes.push(parsed.pathname);
    }
  }
  return articleRoutes;
}

async function verifyPreJsContent(browser, baseUrl, viewport, routePath) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    javaScriptEnabled: false,
  });
  try {
    const page = await context.newPage();
    const response = await page.goto(`${baseUrl}${routePath}`, {
      waitUntil: "domcontentloaded",
    });
    const status = response ? response.status() : 0;
    const h1Text =
      (await page.locator("h1").first().textContent())?.trim() ?? "";
    const hasMain = (await page.locator("main#main-content").count()) === 1;
    const hasMarker =
      (await page.locator('#root[data-prerendered="1"]').count()) === 1;

    let firstParagraphLength = 0;
    if (routePath.startsWith("/knowledge/")) {
      const pTexts = await page.locator("article p").evaluateAll((nodes) =>
        nodes
          .filter((n) => !n.querySelector("time"))
          .map((n) => (n.textContent ?? "").trim())
          .filter((t) => t.length > 0),
      );
      firstParagraphLength = pTexts[0]?.length ?? 0;
    }

    const ok =
      status === 200 &&
      hasMain &&
      hasMarker &&
      h1Text.length > 0 &&
      (routePath === "/knowledge" || firstParagraphLength > 20);

    return {
      ok,
      status,
      hasMain,
      hasMarker,
      h1Text,
      firstParagraphLength,
    };
  } finally {
    await context.close();
  }
}

async function verifyRouteWithJs(
  browser,
  baseUrl,
  viewport,
  routeSpec,
  fallbackMode,
) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
  });

  try {
    const page = await context.newPage();
    const consoleErrors = [];
    const hydrationMessages = [];
    const pageErrors = [];
    const failedAssets = [];

    page.on("console", (msg) => {
      const text = msg.text();
      if (HYDRATION_ERROR_PATTERN.test(text)) {
        hydrationMessages.push(`[${msg.type()}] ${text}`);
      }
      if (msg.type() === "error") {
        if (
          text.includes("/api/v1/auth/refresh") ||
          text.includes("status of 401")
        ) {
          return;
        }
        consoleErrors.push(text);
      }
    });

    page.on("pageerror", (err) => {
      const text = err.message || String(err);
      pageErrors.push(text);
      if (HYDRATION_ERROR_PATTERN.test(text)) {
        hydrationMessages.push(`[pageerror] ${text}`);
      }
    });

    page.on("response", (res) => {
      const url = res.url();
      if (url.includes("/api/v1/auth/refresh")) {
        return;
      }
      if (res.status() >= 400) {
        failedAssets.push(`${res.status()} ${url}`);
      }
    });

    // Mock auth refresh to avoid requiring a running Backend
    await page.route("**/api/v1/auth/refresh", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Unauthorized" }),
      });
    });

    // Delay main JS assets by 800ms per F6 plan §6.6
    await page.route("**/assets/*.js", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, JS_DELAY_MS));
      await route.continue();
    });

    // Install CLS + H1 MutationObserver BEFORE any app script runs
    await page.addInitScript(() => {
      window.__HYDRATION_GATE__ = {
        cls: 0,
        h1Captured: false,
        h1Removed: false,
        startedAt: performance.now(),
      };

      try {
        const po = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              window.__HYDRATION_GATE__.cls += entry.value;
            }
          }
        });
        po.observe({ type: "layout-shift", buffered: true });
      } catch {
        // Unsupported in older browsers
      }

      document.addEventListener("DOMContentLoaded", () => {
        const root = document.getElementById("root");
        const initialH1 = root ? root.querySelector("h1") : null;
        if (!root || !initialH1) {
          return;
        }
        window.__HYDRATION_GATE__.h1Captured = true;
        const mo = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            for (const removed of mutation.removedNodes) {
              if (
                removed === initialH1 ||
                (removed.nodeType === 1 && removed.contains(initialH1))
              ) {
                window.__HYDRATION_GATE__.h1Removed = true;
              }
            }
          }
        });
        mo.observe(root, { childList: true, subtree: true });
      });
    });

    await page.goto(`${baseUrl}${routeSpec.path}`, {
      waitUntil: "networkidle",
    });

    // Wait explicitly for React boot mode + heading visibility (no waitForTimeout)
    await page.waitForFunction(
      () =>
        window.__ASTROV_BOOT_MODE__ === "hydrate" ||
        window.__ASTROV_BOOT_MODE__ === "csr",
      { timeout: 15000 },
    );
    await page.waitForSelector("h1", { state: "visible", timeout: 10000 });

    // Observe CLS for 1s after networkidle using browser clock inside waitForFunction
    const settleStart = await page.evaluate(() => performance.now());
    await page.waitForFunction(
      (start) => performance.now() - start >= 1000,
      settleStart,
      { timeout: 5000 },
    );

    const metrics = await page.evaluate(() => ({
      bootMode: window.__ASTROV_BOOT_MODE__ ?? null,
      cls: Number((window.__HYDRATION_GATE__?.cls ?? 0).toFixed(4)),
      h1Captured: Boolean(window.__HYDRATION_GATE__?.h1Captured),
      h1Removed: Boolean(window.__HYDRATION_GATE__?.h1Removed),
      h1Text: document.querySelector("h1")?.textContent?.trim() ?? "",
      hasPrerenderMarker:
        document.getElementById("root")?.getAttribute("data-prerendered") ===
        "1",
    }));

    const expectedBootMode =
      !fallbackMode && routeSpec.expectHydrate ? "hydrate" : "csr";

    const h02Pass =
      hydrationMessages.length === 0 &&
      consoleErrors.length === 0 &&
      pageErrors.length === 0;
    const h03Pass =
      expectedBootMode === "hydrate"
        ? metrics.h1Captured && !metrics.h1Removed
        : true;
    // In --fallback (CSR createRoot) mode, replacing prerendered DOM intentionally causes
    // layout shift while lazy chunks mount; still record exact CLS in metrics without failing fallback check.
    const h04Pass = fallbackMode ? true : metrics.cls < CLS_THRESHOLD;
    const h05Pass =
      metrics.bootMode === expectedBootMode && failedAssets.length === 0;

    return {
      route: routeSpec.path,
      viewport: viewport.name,
      expectedBootMode,
      metrics,
      checks: {
        KB_H02: h02Pass,
        KB_H03: h03Pass,
        KB_H04: h04Pass,
        KB_H05: h05Pass,
      },
      diagnostics: {
        hydrationMessages,
        consoleErrors,
        pageErrors,
        failedAssets,
      },
    };
  } finally {
    await context.close();
  }
}

async function main() {
  const { fallback, reportPath, skipBuild } = parseArgs(process.argv.slice(2));
  const enableHydration = !fallback;

  console.log(
    `\n[verify:hydration] mode=${fallback ? "FALLBACK (CSR)" : "HYDRATE"} outDir=${path.relative(FRONTEND_DIR, OUT_DIR)}`,
  );

  let previewProc = null;
  let browser = null;

  try {
    if (!skipBuild) {
      fs.rmSync(OUT_DIR, { recursive: true, force: true });
      fs.rmSync(SSR_OUT_DIR, { recursive: true, force: true });

      console.log(
        `[verify:hydration] Building client bundle with VITE_ENABLE_HYDRATION=${String(enableHydration)}...`,
      );
      runCommand("npx", ["vite", "build", "--outDir", OUT_DIR], {
        VITE_ENABLE_HYDRATION: String(enableHydration),
      });

      console.log("[verify:hydration] Building SSR bundle...");
      runCommand(
        "npx",
        [
          "vite",
          "build",
          "--ssr",
          "src/prerender/entry-server.tsx",
          "--outDir",
          SSR_OUT_DIR,
        ],
        { VITE_ENABLE_HYDRATION: String(enableHydration) },
      );

      console.log("[verify:hydration] Running prerender script...");
      runCommand(
        "node",
        [
          "scripts/prerender.mjs",
          "--outDir",
          OUT_DIR,
          "--ssrEntry",
          path.join(SSR_OUT_DIR, "entry-server.js"),
        ],
        { VITE_ENABLE_HYDRATION: String(enableHydration) },
      );
    }

    const articleRoutes = readArticleRoutesFromSitemap(OUT_DIR);
    const routeSpecs = [
      { path: "/knowledge", expectHydrate: true, checkPreJs: true },
      ...articleRoutes.map((routePath) => ({
        path: routePath,
        expectHydrate: true,
        checkPreJs: true,
      })),
      {
        path: "/knowledge/khong-ton-tai-hydration-gate",
        expectHydrate: false,
        checkPreJs: false,
      },
      { path: "/", expectHydrate: false, checkPreJs: false },
    ];

    const isWin = process.platform === "win32";
    previewProc = spawn(
      isWin ? "npx.cmd" : "npx",
      [
        "vite",
        "preview",
        "--outDir",
        OUT_DIR,
        "--port",
        String(PREVIEW_PORT),
        "--strictPort",
      ],
      { cwd: FRONTEND_DIR, stdio: "pipe", shell: isWin },
    );

    const baseUrl = `http://localhost:${PREVIEW_PORT}`;
    await waitForServer(baseUrl);

    browser = await chromium.launch();

    const preJsResults = [];
    const runtimeResults = [];

    for (const viewport of VIEWPORTS) {
      for (const routeSpec of routeSpecs) {
        if (routeSpec.checkPreJs) {
          const preJs = await verifyPreJsContent(
            browser,
            baseUrl,
            viewport,
            routeSpec.path,
          );
          preJsResults.push({
            route: routeSpec.path,
            viewport: viewport.name,
            ...preJs,
          });
        }

        const runtime = await verifyRouteWithJs(
          browser,
          baseUrl,
          viewport,
          routeSpec,
          fallback,
        );
        runtimeResults.push(runtime);
      }
    }

    const summary = {
      KB_H01: preJsResults.every((r) => r.ok),
      KB_H02: runtimeResults.every((r) => r.checks.KB_H02),
      KB_H03: runtimeResults.every((r) => r.checks.KB_H03),
      KB_H04: runtimeResults.every((r) => r.checks.KB_H04),
      KB_H05: runtimeResults.every((r) => r.checks.KB_H05),
    };
    const passed = Object.values(summary).every(Boolean);

    const report = {
      timestamp: new Date().toISOString(),
      mode: fallback ? "fallback-csr" : "hydrate",
      nodeVersion: process.version,
      platform: process.platform,
      articleCount: articleRoutes.length,
      clsThreshold: CLS_THRESHOLD,
      jsDelayMs: JS_DELAY_MS,
      passed,
      summary,
      preJsResults,
      runtimeResults,
    };

    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(
      reportPath,
      `${JSON.stringify(report, null, 2)}\n`,
      "utf8",
    );

    console.log("\n[verify:hydration] Summary:");
    for (const [id, ok] of Object.entries(summary)) {
      console.log(`  [${ok ? "PASS" : "FAIL"}] ${id}`);
    }
    console.log(
      `[verify:hydration] Report written to: ${path.relative(FRONTEND_DIR, reportPath)}`,
    );
    console.log(passed ? "\nHYDRATION GATE PASS" : "\nHYDRATION GATE FAIL");

    if (!passed) {
      process.exitCode = 1;
    }
  } finally {
    if (browser) {
      await browser.close();
    }
    killProcessTree(previewProc);
    if (!skipBuild) {
      fs.rmSync(OUT_DIR, { recursive: true, force: true });
    }
    fs.rmSync(SSR_OUT_DIR, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error("\n[verify:hydration] FATAL:", err);
  process.exitCode = 1;
});
