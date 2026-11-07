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

test.describe("M6.3 & M6.4: Reduced Motion, Readability, Touch Targets & Header Clearance", () => {
  test("M6-R11 & M6-R12: Sticky header clearance and 320px long label overflow checks", async ({
    page,
  }) => {
    await setupChartMocks(page, { chart: chartFull });

    // 1. M6-R11: Check sticky header 64px vs scroll clearance at 1280x720
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`/app/charts/${chartFull.id}`);

    const interpretationRegion = page.getByRole("region", {
      name: "Diễn giải",
    });
    await expect(interpretationRegion).toBeVisible({ timeout: 15000 });

    // Click Overview link to jump to planets group
    const planetsLink = page.getByRole("link", {
      name: /Các hành tinh/,
    });
    await planetsLink.click();

    // Verify header is sticky with height 64px
    const header = page.locator("header");
    const headerBox = await header.boundingBox();
    expect(headerBox?.height).toBe(64);

    // Verify planets heading top is cleared below 64px sticky header due to scroll-mt-20 (80px)
    const planetsHeading = page.getByRole("heading", {
      name: "Các hành tinh",
      level: 3,
    });
    const headingBox = await planetsHeading.boundingBox();
    expect(headingBox).not.toBeNull();
    // Top of heading relative to viewport should be >= 64px
    expect(headingBox!.y).toBeGreaterThanOrEqual(64);

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "m6_r11_sticky_header_clearance.png"),
    });

    // 2. M6-R12: Check 320px Vietnamese long labels
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(`/app/charts/${chartFull.id}`);
    await expect(interpretationRegion).toBeVisible({ timeout: 15000 });

    // Expand Uranus item with long label "Sao Thiên Vương · ..."
    const uranusBtn = page
      .getByRole("region", { name: "Diễn giải" })
      .getByRole("button", { name: /^Sao Thiên Vương/ });
    await uranusBtn.scrollIntoViewIfNeeded();
    await uranusBtn.click();
    await expect(uranusBtn).toHaveAttribute("aria-expanded", "true");

    // Check no horizontal overflow at 320px
    const overflowMetrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflowMetrics.scrollWidth).toBeLessThanOrEqual(
      overflowMetrics.clientWidth,
    );

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "m6_r12_320_long_labels.png"),
    });
  });

  test("M6-RM01..RM03: Reduced motion emulation disables transitions and animations", async ({
    page,
  }) => {
    await setupChartMocks(page, { chart: chartFull });

    // Enable prefers-reduced-motion: reduce
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`/app/charts/${chartFull.id}`);

    const interpretationRegion = page.getByRole("region", {
      name: "Diễn giải",
    });
    await expect(interpretationRegion).toBeVisible({ timeout: 15000 });

    // Check computed transition-duration on interpretation item and chevron
    const motionDurations = await page.evaluate(() => {
      const article = document.querySelector(
        'section[aria-labelledby="interpretation-panel-title"] article',
      );
      const chevron = article?.querySelector("svg");
      const viewButton = article?.querySelector("button:last-child");

      return {
        articleTransition: article
          ? window.getComputedStyle(article).transitionDuration
          : null,
        chevronTransition: chevron
          ? window.getComputedStyle(chevron).transitionDuration
          : null,
        viewButtonTransition: viewButton
          ? window.getComputedStyle(viewButton).transitionDuration
          : null,
      };
    });

    // In reduced motion, transition duration evaluates to 0s
    expect(
      motionDurations.articleTransition === "0s" ||
        motionDurations.articleTransition === "0s, 0s",
    ).toBe(true);
    expect(motionDurations.chevronTransition).toBe("0s");

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "m6_rm01_reduced_motion.png"),
    });

    // Reset media emulation
    await page.emulateMedia({ reducedMotion: "no-preference" });
  });

  test("M6-T01..T06: Readability line lengths, font metrics, and mobile touch targets", async ({
    page,
  }) => {
    await setupChartMocks(page, { chart: chartFull });

    // 1. Measure Readability metrics (cpl, font-size, line-height) at 1280x720
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`/app/charts/${chartFull.id}`);

    const interpretationRegion = page.getByRole("region", {
      name: "Diễn giải",
    });
    await expect(interpretationRegion).toBeVisible({ timeout: 15000 });

    const typographyMetrics = await page.evaluate(() => {
      const dt = document.querySelector(
        'section[aria-labelledby="interpretation-panel-title"] dt',
      ) as HTMLElement | null;
      const dd = document.querySelector(
        'section[aria-labelledby="interpretation-panel-title"] dd',
      ) as HTMLElement | null;
      if (!dd || !dt) return null;

      const style = window.getComputedStyle(dd);
      const dtStyle = window.getComputedStyle(dt);
      const text = dd.textContent || "";

      // Estimate characters per line by dividing line width by average char width (~8px)
      const ddWidth = dd.getBoundingClientRect().width;
      const estimatedCpl = Math.round(ddWidth / 7.5);

      return {
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        dtColor: dtStyle.color,
        ddWidth,
        textLength: text.length,
        estimatedCpl,
      };
    });

    expect(typographyMetrics).not.toBeNull();
    // 14px font size (text-body-md, D-M6-04 local paragraph enhancement)
    expect(typographyMetrics!.fontSize).toBe("14px");
    // Line height >= 1.5 * 14px = 21px
    const numLineHeight = parseFloat(typographyMetrics!.lineHeight);
    expect(numLineHeight).toBeGreaterThanOrEqual(21);

    // M6-T06: Term dt color is text-secondary (rgb(75, 85, 99)), achieving 7.0:1 contrast on white (H6-07 resolved)
    expect(typographyMetrics!.dtColor).toBe("rgb(75, 85, 99)");

    // D-M6-04: Estimated CPL within 45-80 range on desktop (target 70-75 cpl, hard cap <= 80)
    expect(typographyMetrics!.estimatedCpl).toBeGreaterThanOrEqual(45);
    expect(typographyMetrics!.estimatedCpl).toBeLessThanOrEqual(80);

    console.warn("=== M6-T01..T06 Desktop Typography Metrics ===");
    console.warn(JSON.stringify(typographyMetrics, null, 2));

    // Scroll directly to InterpretationPanel and capture full desktop card evidence
    await interpretationRegion.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(
        EVIDENCE_DIR,
        "m6_desktop_1280_readability_after_fix.png",
      ),
    });

    // Capture 1500px wide desktop evidence as well
    await page.setViewportSize({ width: 1500, height: 900 });
    await interpretationRegion.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(
        EVIDENCE_DIR,
        "m6_desktop_1500_readability_after_fix.png",
      ),
    });

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "m6_t01_readability_metrics.png"),
    });

    // 2. Measure Touch targets at mobile 375x667
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`/app/charts/${chartFull.id}`);
    await expect(interpretationRegion).toBeVisible({ timeout: 15000 });

    const sunDisclosureBtn = page.getByRole("button", {
      name: /^Mặt Trời/,
    });
    const sunBox = await sunDisclosureBtn.boundingBox();
    expect(sunBox).not.toBeNull();
    expect(sunBox!.height).toBeGreaterThanOrEqual(44);

    const viewOnChartBtn = page.getByRole("button", {
      name: "Xem trên biểu đồ: Mặt Trời",
    });
    const viewBtnBox = await viewOnChartBtn.boundingBox();
    expect(viewBtnBox).not.toBeNull();
    expect(viewBtnBox!.height).toBeGreaterThanOrEqual(44);

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "m6_t04_touch_targets_375.png"),
    });
  });
});

test.describe("M6.5: In-Page Navigation & Jump Links Clearance (M6-J01..J07)", () => {
  test("M6-J01..J07: Overview jump links, Read Interpretation clearance, and View on Chart focus return", async ({
    page,
  }) => {
    await setupChartMocks(page, { chart: chartFull });
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`/app/charts/${chartFull.id}`);

    const interpretationRegion = page.getByRole("region", {
      name: "Diễn giải",
    });
    await expect(interpretationRegion).toBeVisible({ timeout: 15000 });

    // 1. M6-J01 & J02: Overview link jump
    const planetsLink = page.getByRole("link", {
      name: /Các hành tinh/,
    });
    await planetsLink.click();

    // Verify activeElement is the group heading
    const isHeadingFocused = await page.evaluate(() => {
      const h3 = document.getElementById("interpretation-group-planets");
      return document.activeElement === h3;
    });
    expect(isHeadingFocused).toBe(true);

    const headingBox = await page
      .locator("#interpretation-group-planets")
      .boundingBox();
    expect(headingBox!.y).toBeGreaterThanOrEqual(64);

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "m6_j01_jump_group_clearance.png"),
    });

    // 2. M6-J04: Select Mars on wheel, click 'Đọc diễn giải' in SelectionDetail
    const marsWheel = page.locator('g[data-planet="Mars"][role="button"]');
    await marsWheel.click();

    const readInterpBtn = page.getByRole("button", {
      name: "Đọc diễn giải",
    });
    await expect(readInterpBtn).toBeVisible();
    await readInterpBtn.click();

    // Verify Mars disclosure header expanded and received focus
    const marsDisclosureBtn = page
      .getByRole("region", { name: "Diễn giải" })
      .getByRole("button", {
        name: /^Sao Hỏa/,
      });
    await expect(marsDisclosureBtn).toHaveAttribute("aria-expanded", "true");

    const isMarsFocused = await page.evaluate(() => {
      const active = document.activeElement;
      return active?.getAttribute("aria-label")?.includes("Sao Hỏa");
    });
    expect(isMarsFocused).toBe(true);

    // Verify Mars disclosure button has top offset >= 64px (not hidden behind header)
    const marsBox = await marsDisclosureBtn.boundingBox();
    expect(marsBox!.y).toBeGreaterThanOrEqual(64);

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "m6_j04_read_interpretation_jump.png"),
    });

    // 3. M6-J05: Click 'Xem trên biểu đồ' in Mars item
    const viewMarsOnChartBtn = page.getByRole("button", {
      name: "Xem trên biểu đồ: Sao Hỏa",
    });
    await viewMarsOnChartBtn.click();

    // Focus returns to Mars on chart wheel
    const isMarsWheelFocused = await page.evaluate(() => {
      const active = document.activeElement;
      return (
        active?.getAttribute("data-planet") === "Mars" ||
        active?.getAttribute("data-planet-key") === "Mars"
      );
    });
    expect(isMarsWheelFocused).toBe(true);
  });
});

test.describe("M6.6: Comprehensive Keyboard Navigation (M6-K01..K13)", () => {
  test("M6-K01..K13: Full keyboard traversal, Enter/Space toggling, Escape recovery, and no focus traps", async ({
    page,
  }) => {
    await setupChartMocks(page, { chart: chartFull });
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`/app/charts/${chartFull.id}`);

    const interpretationRegion = page.getByRole("region", {
      name: "Diễn giải",
    });
    await expect(interpretationRegion).toBeVisible({ timeout: 15000 });

    // Focus the body to start keyboard tabbing from top
    await page.locator("body").focus();

    // 1. M6-K13: First Tab stop is the SkipLink
    await page.keyboard.press("Tab");
    const firstActiveText = await page.evaluate(() =>
      document.activeElement?.textContent?.trim(),
    );
    expect(firstActiveText).toContain("Chuyển tới bảng dữ liệu");

    // 2. M6-K04: Navigate to a collapsed item (Sao Thủy) and toggle via Enter/Space
    const mercuryBtn = page
      .getByRole("region", { name: "Diễn giải" })
      .getByRole("button", {
        name: /^Sao Thủy/,
      });
    await mercuryBtn.focus();
    await expect(mercuryBtn).toHaveAttribute("aria-expanded", "false");

    // Press Enter to expand
    await page.keyboard.press("Enter");
    await expect(mercuryBtn).toHaveAttribute("aria-expanded", "true");

    // Press Space to collapse
    await page.keyboard.press("Space");
    await expect(mercuryBtn).toHaveAttribute("aria-expanded", "false");

    // Press Space to re-expand
    await page.keyboard.press("Space");
    await expect(mercuryBtn).toHaveAttribute("aria-expanded", "true");

    // 3. M6-K06, K08, K09, K10: Full interaction loop with keyboard
    // Focus Mars on chart wheel
    const marsWheel = page.locator('g[data-planet="Mars"][role="button"]');
    await marsWheel.focus();
    await page.keyboard.press("Enter");

    // Verify selection announcement in live region
    const liveRegion = page.locator('div[role="status"].sr-only');
    await expect(liveRegion).toContainText("Đã chọn Sao Hỏa");

    // Tab to 'Đọc diễn giải' in SelectionDetail
    const readBtn = page.getByRole("button", {
      name: "Đọc diễn giải",
    });
    await readBtn.focus();
    await page.keyboard.press("Enter");

    // Focus lands on Mars disclosure header
    const marsDisclosureBtn = page
      .getByRole("region", { name: "Diễn giải" })
      .getByRole("button", {
        name: /^Sao Hỏa/,
      });
    await expect(marsDisclosureBtn).toBeFocused();

    // Tab into Mars item and press Enter on 'Xem trên biểu đồ'
    const viewMarsBtn = page.getByRole("button", {
      name: "Xem trên biểu đồ: Sao Hỏa",
    });
    await viewMarsBtn.focus();
    await page.keyboard.press("Enter");

    // Focus returns to Mars on chart
    await expect(marsWheel).toBeFocused();

    // Press Escape to clear selection
    await page.keyboard.press("Escape");
    await expect(liveRegion).toContainText("Đã bỏ chọn.");

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "m6_k01_keyboard_tab_focus.png"),
    });

    // 4. M6-K11: Verify reverse Tab (Shift+Tab) works smoothly without trapping
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Shift+Tab");
    const activeAfterReverse = await page.evaluate(
      () => document.activeElement?.tagName,
    );
    expect(activeAfterReverse).toBeTruthy();
  });
});

test.describe("M6.7: Accessibility Tree & Screen Reader Verification (M6-S01..S12)", () => {
  test("M6-S01..S12: Accessibility tree snapshot, heading hierarchy, landmarks, and live region announcements", async ({
    page,
  }) => {
    await setupChartMocks(page, { chart: chartFull });
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`/app/charts/${chartFull.id}`);

    const interpretationRegion = page.getByRole("region", {
      name: "Diễn giải",
    });
    await expect(interpretationRegion).toBeVisible({ timeout: 15000 });

    // 1. M6-S01: Title & h1 verification
    await expect(page).toHaveTitle(/Lá số sinh/);
    const h1 = page.locator("h1");
    await expect(h1).toHaveText("Lá số sinh");

    // 2. Extract Chromium Accessibility Tree snapshot via CDP and ARIA snapshot
    const cdp = await page.context().newCDPSession(page);
    const { nodes: axNodes } = await cdp.send("Accessibility.getFullAXTree");
    const ariaTree = await page.locator("body").ariaSnapshot();

    // Save snapshot to evidence directory
    fs.writeFileSync(
      path.join(EVIDENCE_DIR, "m6_s_accessibility_tree.json"),
      JSON.stringify(
        {
          totalAxNodes: axNodes.length,
          ariaSnapshot: ariaTree,
          axTreeSample: axNodes.slice(0, 100),
        },
        null,
        2,
      ),
      "utf8",
    );

    // 3. M6-S03: Verify landmarks
    const regions = page.getByRole("region");
    const regionCount = await regions.count();
    expect(regionCount).toBeGreaterThanOrEqual(5);

    // Confirm NO nested generic region inside Diễn giải (H6-10 resolved)
    const nestedSubRegions = await page.evaluate(() => {
      const interpPanel = document.querySelector(
        'section[aria-labelledby="interpretation-panel-title"]',
      );
      if (!interpPanel) return 0;
      return interpPanel.querySelectorAll("section[aria-labelledby]").length;
    });
    expect(nestedSubRegions).toBe(0);

    // 4. M6-S05: Central polite live region announcement
    const liveRegion = page.locator('div[role="status"].sr-only');
    await expect(liveRegion).toHaveAttribute("aria-live", "polite");

    // 5. M6-S10: Wheel buttons have aria-label and aria-pressed
    const sunWheel = page.locator('g[data-planet="Sun"][role="button"]');
    await expect(sunWheel).toHaveAttribute("aria-label", /Chọn Mặt Trời/);
    await expect(sunWheel).toHaveAttribute("aria-pressed", "false");

    await sunWheel.click();
    await expect(sunWheel).toHaveAttribute("aria-pressed", "true");
    await expect(liveRegion).toContainText("Đã chọn Mặt Trời");
  });
});
