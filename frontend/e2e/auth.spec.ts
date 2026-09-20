import { test, expect } from "@playwright/test";

// Luồng E2E chính phụ thuộc lẫn nhau: Register -> Login -> Logout
test.describe.configure({ mode: "serial" });

const uniqueEmail = `e2e-${Date.now()}@test.local`;
const password = "Password123!";

test.describe("Full Auth Flow", () => {
  // Phát hiện 1 từ M8 Plan: Bỏ qua test này trên CI vì không có hạ tầng backend
  test.skip(
    !!process.env.CI,
    "Yêu cầu backend thật + Postgres cục bộ — CI chưa có hạ tầng này (Phát hiện 1, out of scope M8)",
  );

  let page: import("@playwright/test").Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("1. Register a new user", async () => {
    await page.goto("/register");

    // Điền form đăng ký
    await page.getByLabel("Email").fill(uniqueEmail);
    // Playwright `getByLabel` matches EXACT text if we don't use regex, but we might have 2 fields with "Mật khẩu" and "Xác nhận mật khẩu".
    // We can use exact matches.
    await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
    await page.getByLabel("Xác nhận mật khẩu", { exact: true }).fill(password);

    await page.getByRole("button", { name: "Đăng ký" }).click();

    // Chờ thông báo thành công (Alert)
    const alert = page.getByRole("status");
    await expect(alert).toContainText(/thành công/i);

    // Xác nhận đã tự động điều hướng sang trang login sau 2 giây
    await page.waitForURL("**/login");
    await expect(
      page.getByRole("heading", { name: "ĐĂNG NHẬP" }),
    ).toBeVisible();
  });

  test("2. Login with the newly created user", async () => {
    await page.goto("/login");

    // Điền form đăng nhập
    await page.getByLabel("Email").fill(uniqueEmail);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(password);

    await page.getByRole("button", { name: "Đăng nhập" }).click();

    // Xác nhận điều hướng vào app
    await page.waitForURL("**/app");
    await expect(
      page.getByRole("heading", { name: "Bảng điều khiển" }),
    ).toBeVisible();
  });

  test("3. Logout from the app", async () => {
    // Navigate straight to /app to verify session persists across tabs/reloads
    await page.goto("/app");
    await expect(
      page.getByRole("heading", { name: "Bảng điều khiển" }),
    ).toBeVisible();

    // Nhấn Đăng xuất
    await page.getByRole("button", { name: "Đăng xuất" }).click();

    // Xác nhận điều hướng về /login
    await page.waitForURL("**/login*");
    await expect(
      page.getByRole("heading", { name: "ĐĂNG NHẬP" }),
    ).toBeVisible();

    // Xác nhận đã logout thực sự bằng cách truy cập lại /app -> sẽ bị đẩy về /login
    await page.goto("/app");
    await page.waitForURL("**/login*");
  });
});
