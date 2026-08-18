import { test, expect } from "@playwright/test";

test.describe("Select Component Breakpoints", () => {
  test.beforeEach(async ({ page }) => {
    // Navigating to the page where all form controls are rendered
    await page.goto("/dev/style-guide");
    await page.waitForSelector(".select-country-demo");
  });

  test("uses custom combobox on desktop (>= sm)", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });

    // Locate the specific Select component (Country Select added to page)
    const selectWrapper = page.locator(".select-country-demo");

    // The native select is present but visually hidden completely on desktop due to sm:hidden
    const nativeSelect = selectWrapper.locator(
      'select[data-testid="native-select"]',
    );
    const nativeDisplay = await nativeSelect.evaluate(
      (el) => window.getComputedStyle(el).display,
    );
    expect(nativeDisplay).toBe("none");

    const trigger = selectWrapper.locator(
      'button[data-testid="combobox-trigger"]',
    );
    const triggerDisplay = await trigger.evaluate(
      (el) => window.getComputedStyle(el).display,
    );
    expect(triggerDisplay).not.toBe("none");

    // Open combobox
    await trigger.click();

    // Verify the portal-rendered listbox is visible (it has sm:block)
    const listbox = page.locator('ul[data-testid="combobox-listbox"]');
    await listbox.waitFor({ state: "visible" });
    const listboxDisplay = await listbox.evaluate(
      (el) => window.getComputedStyle(el).display,
    );
    expect(listboxDisplay).toBe("block");
  });

  test("uses native select on mobile (< sm)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const selectWrapper = page.locator(".select-country-demo");

    // On mobile, the native select is opacity-0 but block/inline-block, taking space and clicks
    const nativeSelect = selectWrapper.locator(
      'select[data-testid="native-select"]',
    );
    const nativeDisplay = await nativeSelect.evaluate(
      (el) => window.getComputedStyle(el).display,
    );
    expect(nativeDisplay).not.toBe("none");

    // Let's force-click the trigger to simulate what happens if a tap goes through
    // or just directly interact with it to show the ul would be hidden.
    const trigger = selectWrapper.locator(
      'button[data-testid="combobox-trigger"]',
    );
    await trigger.click({ force: true });

    // The ul listbox is generated but hidden via CSS (display: none)
    const listbox = page.locator('ul[data-testid="combobox-listbox"]');
    await expect(listbox).toBeHidden();
  });
});
