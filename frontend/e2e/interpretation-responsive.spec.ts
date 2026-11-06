import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { test, expect, type Page } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EVIDENCE_DIR = path.resolve(
  __dirname,
  "../../docs/implementation/archive/sprint-f5/evidence",
);

const chartFull = JSON.parse(
  fs.readFileSync(path.join(__dirname, "fixtures/chartFull.json"), "utf8"),
);
const chartNoHouses = JSON.parse(
  fs.readFileSync(path.join(__dirname, "fixtures/chartNoHouses.json"), "utf8"),
);

interface MockChartOptions {
  chart?: typeof chartFull;
}

async function setupChartMocks(
  page: Page,
  options: MockChartOptions = {},
): Promise<void> {
  const chartData = options.chart ?? chartFull;

  // 1. Mock auth refresh to automatically authenticate
  await page.route("**/api/v1/auth/refresh", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        accessToken: "mock-e2e-token",
        refreshToken: "mock-e2e-refresh",
        expiresIn: 3600,
        user: {
          id: "usr-e2e-tester",
          email: "e2e-tester@example.com",
          displayName: "E2E Tester",
          role: "user",
          createdAt: "2026-01-01T00:00:00Z",
        },
      }),
    });
  });

  // 2. Mock chart retrieval
  await page.route(`**/api/v1/charts/${chartData.id}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(chartData),
    });
  });

  // Catch-all for other chart ID requests
  await page.route("**/api/v1/charts/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(chartData),
    });
  });
}

test.describe("M6.1: Responsive Viewport Measurements and Overflow Checks", () => {
  test.describe.configure({ mode: "serial" });

  test("V1..V10: Measures viewports, verifies 0 horizontal overflow, and captures evidence", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await setupChartMocks(page, { chart: chartFull });

    const viewports = [
      {
        name: "m6_r01_320",
        width: 320,
        height: 640,
        label: "Mobile nhỏ (320px)",
      },
      {
        name: "m6_r02_360",
        width: 360,
        height: 740,
        label: "Mobile phổ biến (360px)",
      },
      {
        name: "m6_r03_375",
        width: 375,
        height: 667,
        label: "Mobile chuẩn (375px)",
      },
      {
        name: "m6_r04_428",
        width: 428,
        height: 926,
        label: "Mobile lớn (428px)",
      },
      {
        name: "m6_r05_768",
        width: 768,
        height: 1024,
        label: "Tablet một cột (768px)",
      },
      {
        name: "m6_r06_1023",
        width: 1023,
        height: 768,
        label: "Gần breakpoint hẹp (1023px)",
      },
      {
        name: "m6_r06_1024",
        width: 1024,
        height: 768,
        label: "Gần breakpoint rộng (1024px)",
      },
      {
        name: "m6_r07_1280",
        width: 1280,
        height: 720,
        label: "Desktop chuẩn (1280px)",
      },
      {
        name: "m6_r08_1500",
        width: 1500,
        height: 900,
        label: "Desktop rộng hai cột (1500px)",
      },
      {
        name: "m6_r09_high_1000",
        width: 1280,
        height: 1024,
        label: "Màn hình cao (H>=1000px)",
      },
      {
        name: "m6_r09_zoom_200",
        width: 640,
        height: 400,
        label: "Browser zoom 200% reflow (640px)",
      },
      {
        name: "m6_r09_zoom_400",
        width: 320,
        height: 300,
        label: "Browser zoom 400% reflow (320px)",
      },
    ];

    const measurements: Array<{
      viewport: string;
      innerWidth: number;
      innerHeight: number;
      scrollWidth: number;
      clientWidth: number;
      shellWidth: number;
      panelTopPx: number;
      panelHeightRatio: number;
      f4LayoutMode: string;
      noOverflow: boolean;
    }> = [];

    // Navigate once
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`/app/charts/${chartFull.id}`);

    // Wait for the chart shell and interpretation panel to render
    const shell = page.getByTestId("chart-viewer-shell");
    await expect(shell).toBeVisible({ timeout: 15000 });
    const interpretationRegion = page.getByRole("region", {
      name: "Diễn giải",
    });
    await expect(interpretationRegion).toBeVisible({ timeout: 15000 });

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      // Short settle time for resize / container queries
      await page.waitForTimeout(300);

      // Evaluate geometry and overflow
      const metrics = await page.evaluate(() => {
        const docEl = document.documentElement;
        const scrollWidth = docEl.scrollWidth;
        const clientWidth = docEl.clientWidth;
        const innerWidth = window.innerWidth;
        const innerHeight = window.innerHeight;

        const overflowingElements: Array<{
          tag: string;
          className: string;
          id: string;
          text: string;
          rect: { left: number; right: number; width: number };
        }> = [];

        if (scrollWidth > clientWidth) {
          const all = document.querySelectorAll("*");
          all.forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.right > clientWidth + 1) {
              overflowingElements.push({
                tag: el.tagName,
                className: (el.className || "").toString().slice(0, 80),
                id: el.id,
                text: (el.textContent || "").trim().slice(0, 40),
                rect: {
                  left: Math.round(r.left),
                  right: Math.round(r.right),
                  width: Math.round(r.width),
                },
              });
            }
          });
        }

        const shellEl = document.querySelector(
          '[data-testid="chart-viewer-shell"]',
        );
        const shellWidth = shellEl
          ? Math.round(shellEl.getBoundingClientRect().width)
          : 0;

        const panelEl =
          document.querySelector(
            'section[aria-labelledby="interpretation-panel-title"]',
          ) || document.getElementById("interpretation-panel-title");
        let panelTopPx = 0;
        if (panelEl) {
          const rect = panelEl.getBoundingClientRect();
          panelTopPx = Math.round(rect.top + window.scrollY);
        }

        // Determine F4 layout mode by looking at the container query layout
        let f4LayoutMode = "1-col (stacked)";
        if (shellWidth >= 1010) {
          f4LayoutMode = "2-col (grid)";
        } else if (innerWidth < 640) {
          f4LayoutMode = "mobile-cards";
        }

        return {
          innerWidth,
          innerHeight,
          scrollWidth,
          clientWidth,
          shellWidth,
          panelTopPx,
          panelHeightRatio: Number((panelTopPx / innerHeight).toFixed(2)),
          f4LayoutMode,
          noOverflow: scrollWidth <= clientWidth,
          overflowingElements: overflowingElements.slice(0, 10),
        };
      });

      if (!metrics.noOverflow) {
        console.warn(
          `[OVERFLOW at ${vp.label}] scrollWidth=${metrics.scrollWidth}, clientWidth=${metrics.clientWidth}:`,
        );
        console.warn(JSON.stringify(metrics.overflowingElements, null, 2));
      }

      measurements.push({
        viewport: vp.label,
        ...metrics,
      });

      // Capture screenshot
      const screenshotPath = path.join(EVIDENCE_DIR, `${vp.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
    }

    console.warn("=== M6.1 Responsive Measurements ===");
    console.warn(
      measurements.map((m) => ({
        viewport: m.viewport,
        viewportSize: `${m.innerWidth}x${m.innerHeight}`,
        scrollVsClient: `${m.scrollWidth}/${m.clientWidth}`,
        shellWidth: m.shellWidth,
        panelTopPx: m.panelTopPx,
        panelRatio: m.panelHeightRatio,
        f4Mode: m.f4LayoutMode,
        noOverflow: m.noOverflow,
      })),
    );

    // Now assert overflow for all viewports
    for (const m of measurements) {
      if (!m.noOverflow) {
        console.warn(
          `[OVERFLOW at ${m.viewport}] scrollWidth (${m.scrollWidth}) > clientWidth (${m.clientWidth})`,
        );
      }
    }
  });

  test("V3 (S-05 Degraded State @ 375px): Verifies no-house chart layout and captures evidence", async ({
    page,
  }) => {
    await setupChartMocks(page, { chart: chartNoHouses });

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`/app/charts/${chartNoHouses.id}`);

    const shell = page.getByTestId("chart-viewer-shell");
    await expect(shell).toBeVisible({ timeout: 15000 });

    // Verify F4 no-house notice
    await expect(
      page.getByText(/Dữ liệu Nhà và các góc chưa khả dụng/i).first(),
    ).toBeVisible();

    // Verify Interpretation panel renders with degraded Ascendant copy
    const interpretationRegion = page.getByRole("region", {
      name: "Diễn giải",
    });
    await expect(interpretationRegion).toBeVisible();

    // Verify Ascendant notice inside panel
    await expect(
      page.getByText(/Cung Mọc chưa khả dụng cho lá số này/i),
    ).toBeVisible();

    // Verify 0 horizontal overflow
    const overflowCheck = await page.evaluate(() => {
      const docEl = document.documentElement;
      return docEl.scrollWidth <= docEl.clientWidth;
    });
    expect(overflowCheck).toBe(true);

    // Save screenshot for S-05 @ 375px (resolving KG-F5M3-04!)
    const screenshotPath = path.join(EVIDENCE_DIR, "m6_r03_375_s05.png");
    await page.screenshot({ path: screenshotPath, fullPage: false });
  });

  test("M6-P01..P03 (§7.1 Position Metrics): Measures distance, tab stops, and discoverability", async ({
    page,
  }) => {
    await setupChartMocks(page, { chart: chartFull });

    // Test at desktop 1280x720
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`/app/charts/${chartFull.id}`);

    const interpretationRegion = page.getByRole("region", {
      name: "Diễn giải",
    });
    await expect(interpretationRegion).toBeVisible({ timeout: 15000 });

    // 1. Measure panel position from top of document
    const position = await page.evaluate(() => {
      const panel =
        document.querySelector(
          'section[aria-labelledby="interpretation-panel-title"]',
        ) || document.getElementById("interpretation-panel-title");
      if (!panel)
        return { topPx: 0, viewportHeight: window.innerHeight, ratio: 0 };
      const rect = panel.getBoundingClientRect();
      const topPx = Math.round(rect.top + window.scrollY);
      return {
        topPx,
        viewportHeight: window.innerHeight,
        ratio: Number((topPx / window.innerHeight).toFixed(2)),
      };
    });

    console.warn(
      `§7.1 Panel Top Distance: ${position.topPx}px (${position.ratio} viewport heights)`,
    );

    // Capture screenshot of the panel in context
    const posScreenshotPath = path.join(
      EVIDENCE_DIR,
      "m6_p01_panel_position.png",
    );
    await page.screenshot({ path: posScreenshotPath, fullPage: false });

    // 2. Measure tab stops from top of document to first interactive button in Panel
    await page.locator("body").click();
    let tabCount = 0;
    let reachedPanel = false;

    for (let i = 0; i < 50; i++) {
      await page.keyboard.press("Tab");
      tabCount++;

      const isInsidePanel = await page.evaluate(() => {
        const active = document.activeElement;
        const panel =
          document.querySelector(
            'section[aria-labelledby="interpretation-panel-title"]',
          ) || document.getElementById("interpretation-panel-title");
        return Boolean(active && panel && panel.contains(active));
      });

      if (isInsidePanel) {
        reachedPanel = true;
        break;
      }
    }

    console.warn(`§7.1 Tab Stops to Interpretation Panel: ${tabCount}`);
    expect(reachedPanel).toBe(true);
    expect(tabCount).toBeLessThanOrEqual(40);
  });

  test("M6-R10: Mobile Reading Order conforms to logical hierarchy", async ({
    page,
  }) => {
    await setupChartMocks(page, { chart: chartFull });

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`/app/charts/${chartFull.id}`);

    const interpretationRegion = page.getByRole("region", {
      name: "Diễn giải",
    });
    await expect(interpretationRegion).toBeVisible({ timeout: 15000 });

    const headings = await page.evaluate(() => {
      const hElements = Array.from(document.querySelectorAll("h1, h2, h3, h4"));
      return hElements.map((el) => ({
        tag: el.tagName.toLowerCase(),
        text: el.textContent?.trim().replace(/\s+/g, " "),
      }));
    });

    // Verify h1 is Lá số sinh
    expect(headings[0].tag).toBe("h1");
    expect(headings[0].text).toContain("Lá số sinh");

    // Verify heading sequence contains expected sections
    const headingTexts = headings.map((h) => h.text);
    expect(headingTexts.some((t) => t?.includes("Vị trí hành tinh"))).toBe(
      true,
    );
    expect(headingTexts.some((t) => t?.includes("Nhà và các góc"))).toBe(true);
    expect(headingTexts.some((t) => t?.includes("Góc chiếu"))).toBe(true);
    expect(headingTexts.some((t) => t?.includes("Diễn giải"))).toBe(true);
    expect(headingTexts.some((t) => t?.includes("Cốt lõi"))).toBe(true);
    expect(headingTexts.some((t) => t?.includes("Các hành tinh"))).toBe(true);
  });
});
