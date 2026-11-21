import { test, expect } from "@playwright/test";

const CATEGORIES = [
  { id: "fundamentals", label: "Khái niệm cơ bản" },
  { id: "planets", label: "Hành tinh" },
  { id: "signs", label: "Cung" },
  { id: "houses", label: "Nhà" },
  { id: "aspects", label: "Góc chiếu" },
] as const;

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

    // Article cards presence: ≥1 article card with link href^="/knowledge/"
    const articles = page.locator("article");
    const articleCount = await articles.count();
    expect(articleCount).toBeGreaterThanOrEqual(1);

    const firstLink = articles.first().locator("a");
    await expect(firstLink).toBeVisible();
    const href = await firstLink.getAttribute("href");
    expect(href).toMatch(/^\/knowledge\/[a-z0-9-]+$/);

    expect(pageErrors).toHaveLength(0);
  });

  test("KB-E04 & KB-E05: Category filtering, count invariant, and empty state reset", async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (err) => pageErrors.push(err));

    await page.goto("/knowledge");

    // Get total initial count from status text
    const statusText = page.locator('p[role="status"]');
    await expect(statusText).toBeVisible();
    const initialText = await statusText.innerText();
    const initialMatch = initialText.match(/Hiển thị\s+(\d+)\s+bài viết/);
    expect(initialMatch).not.toBeNull();
    const totalCount = parseInt(initialMatch![1], 10);
    expect(totalCount).toBeGreaterThanOrEqual(1);

    const articles = page.locator("article");
    await expect(articles).toHaveCount(totalCount);

    // Iterate through all 5 categories
    for (const cat of CATEGORIES) {
      const catButton = page.getByRole("button", {
        name: cat.label,
        exact: true,
      });
      await catButton.click();

      // Button should be pressed
      await expect(catButton).toHaveAttribute("aria-pressed", "true");

      // Verify status counter
      const currentText = await statusText.innerText();
      const currentMatch = currentText.match(/Hiển thị\s+(\d+)\s+bài viết/);
      expect(currentMatch).not.toBeNull();
      const currentCount = parseInt(currentMatch![1], 10);

      if (currentCount > 0) {
        // Articles count must match counter
        await expect(articles).toHaveCount(currentCount);

        // Every individual displayed article card must carry the selected category badge
        for (let i = 0; i < currentCount; i++) {
          await expect(
            articles.nth(i).getByText(cat.label, { exact: true }),
          ).toBeVisible();
        }
      } else {
        // Empty state is displayed
        await expect(articles).toHaveCount(0);
        await expect(
          page.getByText("Chưa có bài viết trong chủ đề này"),
        ).toBeVisible();

        // Reset button restores to "Tất cả"
        const resetBtn = page.getByRole("button", {
          name: "Xem tất cả bài viết",
          exact: true,
        });
        await expect(resetBtn).toBeVisible();
        await resetBtn.click();

        // "Tất cả" is pressed and focused
        const allBtn = page.getByRole("button", {
          name: "Tất cả",
          exact: true,
        });
        await expect(allBtn).toHaveAttribute("aria-pressed", "true");
        await expect(allBtn).toBeFocused();

        // Restores full article count
        await expect(articles).toHaveCount(totalCount);
      }
    }

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
