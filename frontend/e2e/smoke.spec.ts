import { test, expect } from "@playwright/test";

test("has placeholder text", async ({ page }) => {
  await page.goto("/");

  // Expect a title or text content
  await expect(page.locator("text=AstroViet — Coming soon")).toBeVisible();
});
