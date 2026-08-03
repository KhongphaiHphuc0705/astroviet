import { test, expect } from "@playwright/test";

test.describe("Layout Foundations (M4)", () => {
  test("AppLayout sidebar collapses on mobile", async ({ page }) => {
    // Desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/dev/verify");

    // Switch to App Layout demo
    await page.click("text=App Layout");

    // The desktop sidebar should be visible
    const sidebarNav = page.locator('aside nav[aria-label="Điều hướng chính"]');
    await expect(sidebarNav).toBeVisible();

    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // The desktop sidebar should be hidden
    await expect(sidebarNav).toBeHidden();

    // The mobile drawer hamburger should be visible
    const hamburger = page.locator('button[aria-label="Menu"]');
    await expect(hamburger).toBeVisible();

    // Open drawer
    await hamburger.click();

    // The mobile drawer should be visible
    const drawerNav = page.locator(
      'nav[aria-label="Điều hướng chính (Mobile)"]',
    );
    await expect(drawerNav).toBeVisible();
  });

  test("SkipLink becomes visible on focus", async ({ page }) => {
    await page.goto("/dev/verify");
    await page.click("text=Marketing Layout");

    const skipLink = page.locator("text=Skip to content");

    // Initially hidden (sr-only)
    // To test sr-only, we check if it's visually hidden but present in DOM
    // Playwright considers sr-only as hidden for some actions but focus can be applied

    await page.keyboard.press("Tab");

    // After focus, it should be visible (not-sr-only)
    await expect(skipLink).toBeFocused();
    // Playwright evaluates visibility based on CSS
    await expect(skipLink).toBeVisible();
  });
});
