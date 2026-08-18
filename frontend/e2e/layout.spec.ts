import { test, expect } from "@playwright/test";

test.describe("Layout Foundations (M4)", () => {
  test("AppLayout sidebar collapses on mobile", async ({ page }) => {
    // Desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/dev/style-guide");

    // Switch to App Layout demo
    await page.click("text=App Layout");

    // The desktop sidebar should be visible
    const sidebarNav = page.locator('aside nav[aria-label="Điều hướng chính"]');
    await expect(sidebarNav).toBeVisible();

    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // The desktop sidebar should be hidden
    await expect(sidebarNav).toBeHidden();

    // The mobile drawer hamburger should be visible (use last() to target inner layout)
    const hamburger = page.locator('button[aria-label="Menu"]').last();
    await expect(hamburger).toBeVisible();

    // Open drawer
    await hamburger.click();

    // The mobile drawer should be visible
    const drawerNav = page
      .locator('nav[aria-label="Điều hướng chính (Mobile)"]')
      .last();
    await expect(drawerNav).toBeVisible();
  });

  test("SkipLink becomes visible on focus", async ({ page }) => {
    // Visit the home page, which uses MarketingLayout and is not nested
    await page.goto("/");

    const skipLink = page.locator("text=Skip to content");

    await expect(skipLink).not.toBeFocused();

    // Focus the page body to ensure Tab goes to the first element
    await page.locator("body").focus();

    await page.keyboard.press("Tab");

    // After focus, it should be visible (not-sr-only)
    await expect(skipLink).toBeFocused();
    // Playwright evaluates visibility based on CSS
    await expect(skipLink).toBeVisible();
  });
});
