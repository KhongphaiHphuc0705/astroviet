import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const uniqueEmail = `e2e-bp-${Date.now()}@test.local`;
const password = "Password123!";

test.describe("Birth Profile CRUD Flow", () => {
  let page: import("@playwright/test").Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();

    // Register and Login
    await page.goto("/register");
    await page.getByLabel("Email").fill(uniqueEmail);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
    await page.getByLabel("Xác nhận mật khẩu", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Đăng ký" }).click();

    await page.waitForURL("**/login");

    await page.getByLabel("Email").fill(uniqueEmail);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Đăng nhập" }).click();

    await page.waitForURL("**/app");
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("1. Go to profiles and see empty state", async () => {
    await page.goto("/app/profiles");
    await expect(
      page.getByRole("heading", { name: "Hồ sơ sinh của tôi" }),
    ).toBeVisible();
    await expect(page.getByText("Bạn chưa có hồ sơ sinh nào")).toBeVisible();
  });

  test("2. Create a new birth profile", async () => {
    await page.getByRole("link", { name: "Tạo hồ sơ mới" }).click();
    await page.waitForURL("**/app/profiles/new");

    // Step 1
    await page.getByLabel("Họ và tên *").fill("Hồ sơ E2E Test");
    await page.getByRole("button", { name: "Tiếp tục" }).click();

    // Step 2
    await page.getByLabel("Ngày sinh *").fill("2000-01-01");
    await page.getByLabel("Giờ sinh *").fill("12:00");

    // Mock location search API to avoid depending on external Geonames service in CI
    await page.route("**/api/v1/locations/search**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            placeName: "Da Nang, Vietnam",
            latitude: 16.0544,
            longitude: 108.2022,
            historicalTimezoneId: "Asia/Ho_Chi_Minh",
          },
        ]),
      }),
    );

    // Type into location search combobox to trigger the dropdown
    await page.getByRole("combobox", { name: "Nơi sinh" }).fill("Da Nang");

    // Wait for the mocked dropdown suggestion to appear
    const suggestion = page.getByRole("option").first();
    await expect(suggestion).toBeVisible({ timeout: 5000 });
    await suggestion.click();

    // Clean up route mock
    await page.unroute("**/api/v1/locations/search**");

    await page.getByRole("button", { name: "Hoàn tất" }).click();

    // Alert success
    await expect(page.getByText(/Tạo hồ sơ thành công/i)).toBeVisible();

    // Wait for redirect
    await page.waitForURL("**/app/profiles");
  });

  test("3. Verify profile in list and edit it", async () => {
    await expect(page.getByText("Hồ sơ E2E Test")).toBeVisible();

    // Click "Sửa" on the profile card
    await page.getByRole("link", { name: "Sửa" }).first().click();

    await page.waitForURL("**/app/profiles/*/edit");

    // Verify populated data
    await expect(page.getByLabel("Họ và tên *")).toHaveValue("Hồ sơ E2E Test");

    // Change label
    await page.getByLabel("Họ và tên *").fill("Hồ sơ E2E Test (Đã sửa)");

    // Navigate steps and save
    await page.getByRole("button", { name: "Tiếp tục" }).click();

    await page.getByRole("button", { name: "Hoàn tất" }).click();

    // Alert success
    await expect(page.getByText(/Cập nhật thành công/i)).toBeVisible();

    // Wait for redirect
    await page.waitForURL("**/app/profiles");

    // Verify updated name
    await expect(page.getByText("Hồ sơ E2E Test (Đã sửa)")).toBeVisible();
    await expect(
      page.getByText("Hồ sơ E2E Test", { exact: true }),
    ).not.toBeVisible();
  });

  test("4. Delete the profile", async () => {
    await page.getByRole("button", { name: "Xóa" }).first().click();

    // Confirm delete in modal — wait for the dialog itself, not #modal-root
    // (#modal-root is always in DOM but empty, so it's always "hidden" to Playwright)
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "Xóa" }).click();

    // Should be back to empty state
    await expect(page.getByText("Bạn chưa có hồ sơ sinh nào")).toBeVisible();
    await expect(page.getByText("Hồ sơ E2E Test (Đã sửa)")).not.toBeVisible();
  });
});
