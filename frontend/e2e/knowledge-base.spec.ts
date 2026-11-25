import { test, expect } from "@playwright/test";

import { KNOWLEDGE_MANIFEST } from "../src/features/knowledge-base/model/manifest.js";
import {
  KNOWLEDGE_CATEGORIES,
  KNOWLEDGE_CATEGORY_LABELS,
  type KnowledgeArticleMetadata,
} from "../src/features/knowledge-base/model/types.js";

const CATEGORIES = KNOWLEDGE_CATEGORIES.map((id) => ({
  id,
  label: KNOWLEDGE_CATEGORY_LABELS[id],
}));

test.describe("Knowledge Base Listing (/knowledge)", () => {
  test.beforeEach(async ({ page }) => {
    // Unauthenticated guest bootstrap: mock refresh endpoint returning 401
    await page.route("**/api/v1/auth/refresh", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Unauthorized" }),
      });
    });
  });

  test("KB-E01 & KB-E03: Guest access, public layout, and article cards presence", async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (err) => pageErrors.push(err));

    await page.goto("/knowledge");

    // URL remains /knowledge (no redirect to /login)
    expect(page.url()).toContain("/knowledge");

    // Layout check: MarketingLayout nav and main#main-content
    await expect(
      page.getByRole("navigation", { name: "Điều hướng chính" }),
    ).toBeVisible();
    await expect(page.locator("main#main-content")).toBeVisible();

    // H1 heading visible
    const h1 = page.getByRole("heading", {
      level: 1,
      name: "Kiến thức chiêm tinh",
    });
    await expect(h1).toBeVisible();

    // 6 filter buttons present in group
    const filterGroup = page.getByRole("group", { name: "Lọc theo chủ đề" });
    await expect(filterGroup).toBeVisible();
    const allBtn = page.getByRole("button", { name: "Tất cả", exact: true });
    await expect(allBtn).toBeVisible();
    await expect(allBtn).toHaveAttribute("aria-pressed", "true");

    for (const cat of CATEGORIES) {
      const btn = page.getByRole("button", { name: cat.label, exact: true });
      await expect(btn).toBeVisible();
      await expect(btn).toHaveAttribute("aria-pressed", "false");
    }

    // Article cards presence: exact 15 cards matching KNOWLEDGE_MANIFEST (F6.6.6 Scenario 1)
    const articles = page.locator("article");
    await expect(articles).toHaveCount(KNOWLEDGE_MANIFEST.length);
    expect(KNOWLEDGE_MANIFEST).toHaveLength(15);

    for (let i = 0; i < KNOWLEDGE_MANIFEST.length; i += 1) {
      const expected = KNOWLEDGE_MANIFEST[i]!;
      const card = articles.nth(i);
      const cardLink = card.locator("h2 a");
      await expect(cardLink).toHaveText(expected.title);
      await expect(cardLink).toHaveAttribute(
        "href",
        `/knowledge/${expected.slug}`,
      );
      await expect(card).toContainText(expected.summary);
      await expect(
        card.getByText(KNOWLEDGE_CATEGORY_LABELS[expected.category], {
          exact: true,
        }),
      ).toBeVisible();
    }

    expect(pageErrors).toHaveLength(0);
  });

  test("KB-E04 & KB-E05: Category filtering, count invariant (5 categories x 3), and reset to 15", async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (err) => pageErrors.push(err));

    await page.goto("/knowledge");

    // Get total initial count from status text (exact 15 articles)
    const statusText = page.locator('p[role="status"]');
    await expect(statusText).toBeVisible();
    await expect(statusText).toHaveText(
      `Hiển thị ${KNOWLEDGE_MANIFEST.length} bài viết`,
    );

    const articles = page.locator("article");
    await expect(articles).toHaveCount(KNOWLEDGE_MANIFEST.length);

    // Iterate through all 5 categories — each has exact 3 articles in production manifest
    for (const cat of CATEGORIES) {
      const expectedInCat = KNOWLEDGE_MANIFEST.filter(
        (m) => m.category === cat.id,
      );
      expect(expectedInCat).toHaveLength(3);

      const catButton = page.getByRole("button", {
        name: cat.label,
        exact: true,
      });
      await catButton.click();

      // Button should be pressed
      await expect(catButton).toHaveAttribute("aria-pressed", "true");

      // Verify status counter and card count = 3
      await expect(statusText).toHaveText(
        `Hiển thị ${expectedInCat.length} bài viết`,
      );
      await expect(articles).toHaveCount(expectedInCat.length);

      // Every individual displayed article card must carry the selected category badge
      for (let i = 0; i < expectedInCat.length; i += 1) {
        await expect(
          articles.nth(i).getByText(cat.label, { exact: true }),
        ).toBeVisible();
      }
    }

    // Reset back to "Tất cả" restores all 15 articles
    const allBtn = page.getByRole("button", { name: "Tất cả", exact: true });
    await allBtn.click();
    await expect(allBtn).toHaveAttribute("aria-pressed", "true");
    await expect(statusText).toHaveText(
      `Hiển thị ${KNOWLEDGE_MANIFEST.length} bài viết`,
    );
    await expect(articles).toHaveCount(KNOWLEDGE_MANIFEST.length);

    expect(pageErrors).toHaveLength(0);
  });

  test("KB-E12: Direct reload preserves listing and resets filter to 'Tất cả'", async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (err) => pageErrors.push(err));

    await page.goto("/knowledge");

    // Select a category first
    const planetsBtn = page.getByRole("button", {
      name: "Hành tinh",
      exact: true,
    });
    await planetsBtn.click();
    await expect(planetsBtn).toHaveAttribute("aria-pressed", "true");

    // Reload page
    await page.reload();

    // H1 visible
    await expect(
      page.getByRole("heading", { level: 1, name: "Kiến thức chiêm tinh" }),
    ).toBeVisible();

    // "Tất cả" is pressed again (filter does not persist to URL per D-F6.3-09)
    const allBtn = page.getByRole("button", { name: "Tất cả", exact: true });
    await expect(allBtn).toHaveAttribute("aria-pressed", "true");

    // Articles visible
    const articles = page.locator("article");
    const count = await articles.count();
    expect(count).toBeGreaterThanOrEqual(1);

    expect(pageErrors).toHaveLength(0);
  });

  test("KB-E11: Responsive layout column tracks and zero horizontal overflow", async ({
    page,
  }) => {
    const viewports = [
      { width: 320, height: 600, expectedCols: 1 },
      { width: 375, height: 667, expectedCols: 1 },
      { width: 768, height: 1024, expectedCols: 2 },
      { width: 1024, height: 768, expectedCols: 3 },
      { width: 1280, height: 800, expectedCols: 3 },
    ];

    await page.goto("/knowledge");

    const grid = page.locator('ul[role="list"].grid');
    await expect(grid).toBeVisible();

    const filterGroup = page.getByRole("group", { name: "Lọc theo chủ đề" });
    await expect(filterGroup).toBeVisible();

    for (const { width, height, expectedCols } of viewports) {
      await page.setViewportSize({ width, height });

      // Verify gridTemplateColumns track count
      const colTracks = await grid.evaluate((el) => {
        const template = window.getComputedStyle(el).gridTemplateColumns;
        return template.split(" ").filter(Boolean).length;
      });
      expect(
        colTracks,
        `Expected ${expectedCols} columns at ${width}px, got ${colTracks}`,
      ).toBe(expectedCols);

      // Verify no page horizontal overflow: scrollWidth <= clientWidth
      const pageOverflow = await page.evaluate(() => {
        return (
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth
        );
      });
      expect(
        pageOverflow,
        `Expected no horizontal overflow at viewport ${width}px`,
      ).toBe(false);

      // Verify filter container does not have horizontal overflow
      const filterOverflow = await filterGroup.evaluate((el) => {
        return el.scrollWidth > el.clientWidth;
      });
      expect(
        filterOverflow,
        `Expected no filter container overflow at viewport ${width}px`,
      ).toBe(false);
    }
  });
});

test.describe("Knowledge Base Article Detail (/knowledge/:slug)", () => {
  test.beforeEach(async ({ page }) => {
    // Unauthenticated guest bootstrap: mock refresh endpoint returning 401
    await page.route("**/api/v1/auth/refresh", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Unauthorized" }),
      });
    });
  });

  test("Scenario A (KB-E02 & KB-E06): Listing -> Article detail SPA navigation, single h1, metadata, and back-link return", async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (err) => pageErrors.push(err));

    await page.goto("/knowledge");

    // Discover first article dynamically (no hardcoded slug)
    const firstCard = page.locator("article").first();
    const firstLink = firstCard.locator("h2 a");
    await expect(firstLink).toBeVisible();
    const expectedTitle = (await firstLink.innerText()).trim();
    const articleHref = await firstLink.getAttribute("href");
    expect(articleHref).toMatch(/^\/knowledge\/[a-z0-9-]+$/);

    // Plant SPA marker to prove client-side navigation without full reload
    await page.evaluate(() => {
      (window as unknown as { __e2eSpaMarker?: string }).__e2eSpaMarker =
        "alive";
    });

    // Click card link -> navigate to detail page
    await firstLink.click();
    await expect(page).toHaveURL(new RegExp(`${articleHref}$`));

    // Verify SPA navigation (no full reload)
    const spaMarker = await page.evaluate(
      () => (window as unknown as { __e2eSpaMarker?: string }).__e2eSpaMarker,
    );
    expect(spaMarker).toBe("alive");

    // Public MarketingLayout preserved
    await expect(
      page.getByRole("navigation", { name: "Điều hướng chính" }),
    ).toBeVisible();
    await expect(page.locator("main#main-content")).toBeVisible();

    // Exactly one h1 matching article title (KB-E06)
    const h1s = page.locator("h1");
    await expect(h1s).toHaveCount(1);
    await expect(h1s.first()).toHaveText(expectedTitle);

    // Formatted updated date & semantic <time>
    const timeEl = page.locator("article time");
    await expect(timeEl).toBeVisible();
    const dateTimeAttr = await timeEl.getAttribute("datetime");
    expect(dateTimeAttr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const dateLine = await timeEl.locator("..").innerText();
    expect(dateLine).toMatch(/Cập nhật\s+\d{2}\/\d{2}\/\d{4}/);

    // Body content rendered (at least one h2 and paragraph inside article)
    await expect(page.locator("article h2").first()).toBeVisible();
    const bodyText = await page.locator("article p").nth(1).innerText();
    expect(bodyText.trim().length).toBeGreaterThan(20);

    // Metadata assertions (title, description, canonical, og:type, no og:image)
    await expect(page).toHaveTitle(`${expectedTitle} — AstroViet`);
    const metaDesc = await page
      .locator('meta[name="description"]')
      .getAttribute("content");
    expect(metaDesc && metaDesc.trim().length).toBeGreaterThan(0);

    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    expect(canonical).not.toBeNull();
    expect(canonical!).toMatch(new RegExp(`${articleHref}$`));
    expect(canonical!.replace(/^https?:\/\//, "")).not.toContain("//");

    const ogType = await page
      .locator('meta[property="og:type"]')
      .getAttribute("content");
    expect(ogType).toBe("article");
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);

    // Click back-link -> return to /knowledge (SPA, no reload)
    const backLink = page.getByRole("link", {
      name: "Tất cả bài viết",
      exact: true,
    });
    await expect(backLink).toBeVisible();
    await backLink.click();

    await expect(page).toHaveURL(/\/knowledge$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Kiến thức chiêm tinh" }),
    ).toBeVisible();
    await expect(page).toHaveTitle("Kiến thức chiêm tinh — AstroViet");
    const listOgType = await page
      .locator('meta[property="og:type"]')
      .getAttribute("content");
    expect(listOgType).toBe("website");

    const markerAfterBack = await page.evaluate(
      () => (window as unknown as { __e2eSpaMarker?: string }).__e2eSpaMarker,
    );
    expect(markerAfterBack).toBe("alive");

    expect(pageErrors).toHaveLength(0);
  });

  test("Scenario B (KB-E02): Direct URL guest access to article detail page without login redirect", async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (err) => pageErrors.push(err));

    // Discover valid article href from listing first
    await page.goto("/knowledge");
    const firstLink = page.locator("article h2 a").first();
    await expect(firstLink).toBeVisible();
    const expectedTitle = (await firstLink.innerText()).trim();
    const articleHref = await firstLink.getAttribute("href");
    expect(articleHref).toMatch(/^\/knowledge\/[a-z0-9-]+$/);

    // Direct navigation to article URL
    await page.goto(articleHref!);

    expect(page.url()).toContain(articleHref!);
    expect(page.url()).not.toContain("/login");

    await expect(
      page.getByRole("navigation", { name: "Điều hướng chính" }),
    ).toBeVisible();
    await expect(page.locator("main#main-content")).toBeVisible();

    const h1s = page.locator("h1");
    await expect(h1s).toHaveCount(1);
    await expect(h1s.first()).toHaveText(expectedTitle);
    await expect(page).toHaveTitle(`${expectedTitle} — AstroViet`);

    expect(pageErrors).toHaveLength(0);
  });

  test("Scenario C (KB-E08): Unknown article slug renders ArticleNotFound with noindex and navigates back to /knowledge", async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (err) => pageErrors.push(err));

    await page.goto("/knowledge/khong-ton-tai");

    expect(page.url()).toContain("/knowledge/khong-ton-tai");

    // Public layout preserved
    await expect(
      page.getByRole("navigation", { name: "Điều hướng chính" }),
    ).toBeVisible();
    await expect(page.locator("main#main-content")).toBeVisible();

    // Approved Not Found copy & single h1
    const h1s = page.locator("h1");
    await expect(h1s).toHaveCount(1);
    await expect(h1s.first()).toHaveText("Không tìm thấy bài viết");
    await expect(
      page.getByText("Bài viết bạn tìm không tồn tại hoặc đã được di chuyển."),
    ).toBeVisible();

    // SEO metadata: noindex, no canonical, no og:image
    const robots = await page
      .locator('meta[name="robots"]')
      .getAttribute("content");
    expect(robots).toBe("noindex");
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);

    // Back-link navigates to /knowledge and cleans up robots=noindex
    const backLink = page.getByRole("link", {
      name: "Tất cả bài viết",
      exact: true,
    });
    await expect(backLink).toBeVisible();
    await backLink.click();

    await expect(page).toHaveURL(/\/knowledge$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Kiến thức chiêm tinh" }),
    ).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);

    expect(pageErrors).toHaveLength(0);
  });

  test("Scenario F (KB-E13): Reading column 65ch probe verification, line length, and zero horizontal overflow across 5 viewports", async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (err) => pageErrors.push(err));

    await page.goto("/knowledge");
    const firstLink = page.locator("article h2 a").first();
    await expect(firstLink).toBeVisible();
    const articleHref = await firstLink.getAttribute("href");
    expect(articleHref).toMatch(/^\/knowledge\/[a-z0-9-]+$/);

    await page.goto(articleHref!);
    const article = page.locator("article");
    await expect(article).toBeVisible();
    await expect(article.locator("h2").first()).toBeVisible();

    // Wait for web fonts to settle before measuring 65ch probe
    await page.evaluate(async () => {
      if ("fonts" in document) {
        await document.fonts.ready;
      }
    });

    const viewports = [
      { width: 320, height: 700, expectFull65ch: false },
      { width: 375, height: 812, expectFull65ch: false },
      { width: 768, height: 1024, expectFull65ch: false },
      { width: 1024, height: 768, expectFull65ch: true },
      { width: 1280, height: 800, expectFull65ch: true },
    ];

    for (const { width, height, expectFull65ch } of viewports) {
      await page.setViewportSize({ width, height });

      const measurements = await article.evaluate((el) => {
        const probe = document.createElement("div");
        probe.style.width = "65ch";
        probe.style.visibility = "hidden";
        probe.style.position = "absolute";
        probe.style.pointerEvents = "none";
        probe.style.font = "inherit";
        el.appendChild(probe);

        const articleRect = el.getBoundingClientRect();
        const probeRect = probe.getBoundingClientRect();
        probe.remove();

        const h1 = el.querySelector("h1");
        const h1Rect = h1 ? h1.getBoundingClientRect() : null;
        const bodyParagraphs = Array.from(el.querySelectorAll("p")).filter(
          (p) =>
            !p.querySelector("time") &&
            (p.textContent?.trim().length ?? 0) > 40,
        );
        const maxPRight = bodyParagraphs.reduce(
          (max, p) => Math.max(max, p.getBoundingClientRect().right),
          0,
        );

        let avgCharsPerLine: number | null = null;
        if (bodyParagraphs.length > 0) {
          const p = bodyParagraphs[0];
          const text = p.textContent?.trim() ?? "";
          const range = document.createRange();
          range.selectNodeContents(p);
          const lineCount = range.getClientRects().length;
          if (lineCount > 0) {
            avgCharsPerLine = text.length / lineCount;
          }
        }

        return {
          articleWidth: articleRect.width,
          articleRight: articleRect.right,
          probeWidth: probeRect.width,
          h1Right: h1Rect ? h1Rect.right : 0,
          maxPRight,
          avgCharsPerLine,
          docOverflow:
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth,
        };
      });

      expect(
        measurements.docOverflow,
        `Expected zero horizontal overflow on detail page at ${width}px`,
      ).toBe(false);

      if (expectFull65ch) {
        expect(
          Math.abs(measurements.articleWidth - measurements.probeWidth),
          `Expected article width (${measurements.articleWidth}px) to match 65ch probe (${measurements.probeWidth}px) within 1px at ${width}px`,
        ).toBeLessThanOrEqual(1);
      } else {
        expect(
          measurements.articleWidth,
          `Expected article width (${measurements.articleWidth}px) <= viewport (${width}px) and <= 65ch probe (${measurements.probeWidth}px)`,
        ).toBeLessThanOrEqual(Math.min(width, measurements.probeWidth + 1));
      }

      // h1 and body paragraphs remain within article column
      expect(measurements.h1Right).toBeLessThanOrEqual(
        measurements.articleRight + 1,
      );
      expect(measurements.maxPRight).toBeLessThanOrEqual(
        measurements.articleRight + 1,
      );

      // At desktop 1280px, average characters per line lies in readable range 45..80
      if (width === 1280 && measurements.avgCharsPerLine !== null) {
        expect(measurements.avgCharsPerLine).toBeGreaterThanOrEqual(45);
        expect(measurements.avgCharsPerLine).toBeLessThanOrEqual(80);
      }
    }

    expect(pageErrors).toHaveLength(0);
  });

  test("Scenario G (KB-AC-24): Keyboard focus traversal reaches back-link and Enter returns to /knowledge", async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (err) => pageErrors.push(err));

    await page.goto("/knowledge");
    const firstLink = page.locator("article h2 a").first();
    await expect(firstLink).toBeVisible();
    const articleHref = await firstLink.getAttribute("href");
    expect(articleHref).toMatch(/^\/knowledge\/[a-z0-9-]+$/);

    await page.goto(articleHref!);
    const backLink = page.getByRole("link", {
      name: "Tất cả bài viết",
      exact: true,
    });
    await expect(backLink).toBeVisible();

    // Tab forward from body until back-link receives focus (bounded to avoid infinite loops)
    await page.locator("body").focus();
    let focusedBackLink = false;
    for (let step = 0; step < 20; step++) {
      await page.keyboard.press("Tab");
      const isFocused = await backLink.evaluate(
        (el) => document.activeElement === el,
      );
      if (isFocused) {
        focusedBackLink = true;
        break;
      }
    }
    expect(
      focusedBackLink,
      "Expected keyboard Tab traversal to reach 'Tất cả bài viết' back-link",
    ).toBe(true);

    // Press Enter on focused back-link -> returns to /knowledge
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/knowledge$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Kiến thức chiêm tinh" }),
    ).toBeVisible();

    expect(pageErrors).toHaveLength(0);
  });

  test("Scenario D (F6.6.6 T6.2, KB-AC-37): Data-driven detail check across all 15 manifest articles", async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err));
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (
          text.includes("/api/v1/auth/refresh") ||
          text.includes("status of 401")
        ) {
          return;
        }
        consoleErrors.push(text);
      }
    });

    for (const meta of KNOWLEDGE_MANIFEST) {
      await page.goto(`/knowledge/${meta.slug}`);

      await expect(page).toHaveURL(new RegExp(`/knowledge/${meta.slug}$`));

      // Single h1 matching manifest title
      const h1s = page.locator("h1");
      await expect(h1s).toHaveCount(1);
      await expect(h1s.first()).toHaveText(meta.title);

      // Valid heading hierarchy (h1 -> h2 -> ..., no skipped levels, no normalized headings)
      await expect(page.locator("article h2").first()).toBeVisible();
      const headingAudit = await page.evaluate(() => {
        const normalizedCount = document.querySelectorAll(
          "[data-heading-normalized-from]",
        ).length;
        const headings = Array.from(
          document.querySelectorAll(
            "article h1, article h2, article h3, article h4, article h5, article h6",
          ),
        ).map((el) => Number(el.tagName.slice(1)));
        let hasJump = false;
        for (let i = 1; i < headings.length; i += 1) {
          if ((headings[i] ?? 0) - (headings[i - 1] ?? 0) > 1) {
            hasJump = true;
          }
        }
        return {
          normalizedCount,
          firstTwo: headings.slice(0, 2),
          hasJump,
        };
      });
      expect(headingAudit.normalizedCount).toBe(0);
      expect(headingAudit.firstTwo).toEqual([1, 2]);
      expect(headingAudit.hasJump).toBe(false);

      // Metadata & back-link
      await expect(page).toHaveTitle(`${meta.title} — AstroViet`);
      const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute("href");
      expect(canonical).not.toBeNull();
      expect(canonical!).toMatch(new RegExp(`/knowledge/${meta.slug}$`));
      const ogType = await page
        .locator('meta[property="og:type"]')
        .getAttribute("content");
      expect(ogType).toBe("article");
      await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);
      await expect(
        page.getByRole("link", { name: "Tất cả bài viết", exact: true }),
      ).toBeVisible();
    }

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toHaveLength(0);
  });

  test("Scenario E (F6.6.6 T6.2/T6.5, KB-E07, KG-F6-16): Deep check on 3 diverse articles and cross-article SPA navigation", async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (err) => pageErrors.push(err));

    const manifestBySlug = new Map<string, KnowledgeArticleMetadata>(
      KNOWLEDGE_MANIFEST.map((m) => [m.slug, m]),
    );
    const representativeSlugs = [
      KNOWLEDGE_MANIFEST[0]!.slug, // fundamentals: ol + ul + blockquote + internal links
      KNOWLEDGE_MANIFEST.find((m) => m.category === "signs" && m.order === 2)!
        .slug, // signs: 4x3 structured list + blockquote + internal links
      KNOWLEDGE_MANIFEST.find((m) => m.category === "aspects" && m.order === 2)!
        .slug, // aspects: longest article with 5 aspects + h3 + blockquote + internal links
    ];

    for (const slug of representativeSlugs) {
      const meta = manifestBySlug.get(slug)!;
      await page.goto(`/knowledge/${slug}`);

      await expect(page.locator("h1")).toHaveText(meta.title);
      await expect(
        page.locator("article ul, article ol").first(),
      ).toBeVisible();
      await expect(page.locator("article blockquote").first()).toBeVisible();

      // Plant SPA marker and navigate via an in-article internal link
      await page.evaluate(() => {
        (window as unknown as { __e2eSpaMarker?: string }).__e2eSpaMarker =
          "alive";
      });

      const internalLink = page
        .locator('article a[href^="/knowledge/"]')
        .first();
      await expect(internalLink).toBeVisible();
      const targetHref = await internalLink.getAttribute("href");
      expect(targetHref).toMatch(/^\/knowledge\/[a-z0-9-]+$/);
      const targetSlug = targetHref!.replace("/knowledge/", "");
      const targetMeta = manifestBySlug.get(targetSlug);
      expect(targetMeta).toBeDefined();

      await internalLink.click();
      await expect(page).toHaveURL(new RegExp(`${targetHref}$`));
      await expect(page.locator("h1")).toHaveText(targetMeta!.title);

      // Confirm client-side SPA transition without full reload
      const markerAfterNav = await page.evaluate(
        () => (window as unknown as { __e2eSpaMarker?: string }).__e2eSpaMarker,
      );
      expect(markerAfterNav).toBe("alive");

      // Back-link returns cleanly to listing
      await page
        .getByRole("link", { name: "Tất cả bài viết", exact: true })
        .click();
      await expect(page).toHaveURL(/\/knowledge$/);
    }

    expect(pageErrors).toHaveLength(0);
  });

  test("Scenario H (F6.6.6 Scenario 5): DOM Markdown security scan across all 5 categories", async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (err) => pageErrors.push(err));

    // Scan one real article from each of the 5 categories
    const sampleArticles = KNOWLEDGE_CATEGORIES.map((cat) =>
      KNOWLEDGE_MANIFEST.find((m) => m.category === cat)!,
    );

    for (const meta of sampleArticles) {
      await page.goto(`/knowledge/${meta.slug}`);
      await expect(page.locator("article h2").first()).toBeVisible();

      const domSecurity = await page.evaluate(() => {
        const article = document.querySelector("article");
        if (!article) {
          return {
            hasArticle: false,
            scriptCount: -1,
            inlineHandlerCount: -1,
            fallbackCount: -1,
            remoteImageCount: -1,
            unsafeExternalLinks: -1,
          };
        }

        const scriptCount = article.querySelectorAll("script").length;
        const fallbackCount =
          article.querySelectorAll("[data-kb-fallback]").length;

        let inlineHandlerCount = 0;
        for (const el of Array.from(article.querySelectorAll("*"))) {
          for (const attr of Array.from(el.attributes)) {
            if (/^on[a-z]+$/i.test(attr.name)) {
              inlineHandlerCount += 1;
            }
          }
        }

        const remoteImageCount = Array.from(
          article.querySelectorAll("img"),
        ).filter((img) =>
          /^https?:\/\//i.test(img.getAttribute("src") ?? ""),
        ).length;

        const unsafeExternalLinks = Array.from(
          article.querySelectorAll('a[href^="http://"], a[href^="https://"]'),
        ).filter((a) => {
          const rel = (a.getAttribute("rel") ?? "").split(/\s+/);
          return (
            a.getAttribute("target") !== "_blank" ||
            !rel.includes("noopener") ||
            !rel.includes("noreferrer")
          );
        }).length;

        return {
          hasArticle: true,
          scriptCount,
          inlineHandlerCount,
          fallbackCount,
          remoteImageCount,
          unsafeExternalLinks,
        };
      });

      expect(domSecurity.hasArticle).toBe(true);
      expect(domSecurity.scriptCount).toBe(0);
      expect(domSecurity.inlineHandlerCount).toBe(0);
      expect(domSecurity.fallbackCount).toBe(0);
      expect(domSecurity.remoteImageCount).toBe(0);
      expect(domSecurity.unsafeExternalLinks).toBe(0);
    }

    expect(pageErrors).toHaveLength(0);
  });
});

test.describe("Knowledge Base Navigation (KB-E09, KB-AC-06, D-F6-N1)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/auth/refresh", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Unauthorized" }),
      });
    });
  });

  test("KB-E09: Navigates to /knowledge from desktop navbar, mobile drawer, and footer", async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (err) => pageErrors.push(err));

    // 1. Desktop Navbar navigation (1280x800)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const desktopNav = page.locator('nav[aria-label="Điều hướng chính"]');
    const desktopLink = desktopNav.getByRole("link", {
      name: "Kiến thức",
      exact: true,
    });
    await expect(desktopLink).toBeVisible();
    await desktopLink.click();

    await expect(page).toHaveURL(/\/knowledge$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Kiến thức chiêm tinh" }),
    ).toBeVisible();
    await expect(desktopLink).toHaveAttribute("aria-current", "page");

    // 2. Footer navigation (1280x800)
    await page.goto("/");
    const footerNav = page.locator('footer nav[aria-label="Chân trang"]');
    const footerLink = footerNav.getByRole("link", {
      name: "Kiến thức",
      exact: true,
    });
    await expect(footerLink).toBeVisible();
    await footerLink.click();

    await expect(page).toHaveURL(/\/knowledge$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Kiến thức chiêm tinh" }),
    ).toBeVisible();

    // 3. Mobile Drawer navigation (375x812)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    const menuButton = page.getByRole("button", { name: "Menu", exact: true });
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    const mobileNav = page.locator(
      'nav[aria-label="Điều hướng chính (Mobile)"]',
    );
    await expect(mobileNav).toBeVisible();
    const mobileLink = mobileNav.getByRole("link", {
      name: "Kiến thức",
      exact: true,
    });
    await expect(mobileLink).toBeVisible();
    await mobileLink.click();

    await expect(page).toHaveURL(/\/knowledge$/);
    await expect(mobileNav).toBeHidden();
    await expect(
      page.getByRole("heading", { level: 1, name: "Kiến thức chiêm tinh" }),
    ).toBeVisible();

    expect(pageErrors).toHaveLength(0);
  });
});
