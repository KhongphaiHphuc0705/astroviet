import { test, expect } from "@playwright/test";

test("has placeholder text", async ({ page }) => {
  await page.goto("/");

  // Expect a title or text content
  await expect(page.locator("text=AstroViet — Coming soon")).toBeVisible();
});

test("renders style guide", async ({ page }) => {
  await page.goto("/dev/style-guide");
  const heading = page.getByRole("heading", {
    name: "M3/M4 Verification",
    level: 1,
  });
  await expect(heading).toBeVisible();
});
