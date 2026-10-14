import { test, expect, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const uniqueEmailA = `e2e-cl-a-${Date.now()}@test.local`;
const uniqueEmailB = `e2e-cl-b-${Date.now()}@test.local`;
const password = "Password123!";

async function registerAndLogin(page: Page, email: string) {
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByLabel("Xác nhận mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng ký" }).click();

  await page.waitForURL("**/login");

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();

  await page.waitForURL("**/app");
}

async function createBirthProfile(page: Page, profileName: string) {
  await page.goto("/app/profiles");
  await page.getByRole("link", { name: "Tạo hồ sơ mới" }).click();
  await page.waitForURL("**/app/profiles/new");

  // Step 1: Name
  await page.getByLabel("Họ và tên *").fill(profileName);
  await page.getByRole("button", { name: "Tiếp tục" }).click();

  // Step 2: Date, time, location
  await page.getByLabel("Ngày sinh *").fill("2000-01-01");
  await page.getByLabel("Giờ sinh *").fill("12:00");

  // Mock location search API to avoid external service dependency in CI
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

  await page.getByRole("combobox", { name: "Nơi sinh" }).fill("Da Nang");
  const suggestion = page.getByRole("option").first();
  await expect(suggestion).toBeVisible({ timeout: 5000 });
  await suggestion.click();

  await page.unroute("**/api/v1/locations/search**");

  await page.getByRole("button", { name: "Hoàn tất" }).click();
  await expect(page.getByText(/Tạo hồ sơ thành công/i)).toBeVisible();
  await page.waitForURL("**/app/profiles");
}

test.describe("Chart List Two-Account Isolation Flow", () => {
  let ctxA: import("@playwright/test").BrowserContext;
  let pageA: Page;
  let ctxB: import("@playwright/test").BrowserContext;
  let pageB: Page;
  let createdChartId: string;

  test.beforeAll(async ({ browser }) => {
    ctxA = await browser.newContext();
    pageA = await ctxA.newPage();
    ctxB = await browser.newContext();
    pageB = await ctxB.newPage();
  });

  test.afterAll(async () => {
    await ctxA?.close();
    await ctxB?.close();
  });

  test("1. User A registers and logs in", async () => {
    await registerAndLogin(pageA, uniqueEmailA);
    expect(pageA.url()).toContain("/app");
  });

  test("2. User A creates birth profile 'Hồ sơ A'", async () => {
    await createBirthProfile(pageA, "Hồ sơ A");
    await expect(pageA.getByText("Hồ sơ A")).toBeVisible();
  });

  test("3. User A calculates natal chart from profile", async () => {
    // Click "Tính lá số" on the profile card
    const calcBtn = pageA
      .getByRole("button", { name: /tính lá số cho hồ sơ/i })
      .first();
    await calcBtn.click();

    // Dialog appears
    const dialog = pageA.getByRole("dialog", { name: "Tính lá số" });
    await expect(dialog).toBeVisible();

    // Submit calculation
    const submitBtn = dialog.getByRole("button", { name: "Tính lá số" });
    await submitBtn.click();

    // Navigates to /app/charts/{chartId}
    await pageA.waitForURL(/\/app\/charts\/[0-9a-fA-F-]+/);
    const url = pageA.url();
    const match = url.match(/\/app\/charts\/([0-9a-fA-F-]+)/);
    expect(match).not.toBeNull();
    createdChartId = match![1]!;
    expect(createdChartId).toMatch(
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    );

    // Verify viewer shell rendered
    await expect(
      pageA.getByRole("heading", { name: "Lá số sinh" }),
    ).toBeVisible();
  });

  test("4. User A navigates to 'Lá số của tôi' and verifies chart is listed", async () => {
    const responsePromiseA = pageA.waitForResponse(
      (res) =>
        res.url().includes("/api/v1/charts") &&
        !res.url().includes("/natal") &&
        res.request().method() === "GET",
    );

    const desktopNav = pageA.getByRole("navigation", {
      name: "Điều hướng chính",
    });
    await desktopNav.getByRole("link", { name: "Lá số của tôi" }).click();

    await pageA.waitForURL("**/app/charts");

    const responseA = await responsePromiseA;
    expect(responseA.status()).toBe(200);
    const dataA = (await responseA.json()) as {
      total: number;
      items: Array<{ id: string }>;
    };
    expect(dataA.total).toBe(1);
    expect(dataA.items).toHaveLength(1);
    expect(dataA.items[0]?.id).toBe(createdChartId);

    // Verify UI card
    await expect(
      pageA.getByRole("heading", { name: "Lá số của tôi" }),
    ).toBeVisible();
    await expect(pageA.getByRole("heading", { name: "Hồ sơ A" })).toBeVisible();
    await expect(pageA.getByText("Placidus")).toBeVisible();

    const viewLink = pageA.getByRole("link", { name: /xem lá số/i });
    await expect(viewLink).toBeVisible();
    await expect(viewLink).toHaveAttribute(
      "href",
      `/app/charts/${createdChartId}`,
    );
  });

  test("5. User A clicks 'Xem lá số' and returns to detail viewer", async () => {
    const viewLink = pageA.getByRole("link", { name: /xem lá số/i });
    await viewLink.click();
    await pageA.waitForURL(`**/app/charts/${createdChartId}`);
    await expect(
      pageA.getByRole("heading", { name: "Lá số sinh" }),
    ).toBeVisible();
  });

  test("6. User B registers and logs in on isolated context", async () => {
    await registerAndLogin(pageB, uniqueEmailB);
    expect(pageB.url()).toContain("/app");
  });

  test("7. User B opens /app/charts and sees empty state (no chart of User A)", async () => {
    const responsePromiseB = pageB.waitForResponse(
      (res) =>
        res.url().includes("/api/v1/charts") &&
        !res.url().includes("/natal") &&
        res.request().method() === "GET",
    );

    await pageB.goto("/app/charts");

    const responseB = await responsePromiseB;
    expect(responseB.status()).toBe(200);

    // Verify request does NOT leak userId query parameter
    const reqUrl = new URL(responseB.request().url());
    expect(reqUrl.searchParams.get("userId")).toBeNull();
    expect(reqUrl.searchParams.get("user_id")).toBeNull();

    const dataB = (await responseB.json()) as {
      total: number;
      items: unknown[];
    };
    expect(dataB.total).toBe(0);
    expect(dataB.items).toHaveLength(0);

    // Assert UI shows empty state
    await expect(
      pageB.getByRole("heading", { name: "Lá số của tôi" }),
    ).toBeVisible();
    await expect(pageB.getByText("Bạn chưa có lá số nào")).toBeVisible();

    // Verify User A's chart link is not in User B's DOM
    await expect(pageB.locator(`a[href*="${createdChartId}"]`)).toHaveCount(0);
  });

  test("8. User B direct URL access to User A's chart shows Not Found / Forbidden page", async () => {
    await pageB.goto(`/app/charts/${createdChartId}`);

    // Detail page handles 403 / 404 with EmptyState "Không tìm thấy lá số"
    await expect(pageB.getByText("Không tìm thấy lá số")).toBeVisible();
    await expect(
      pageB.getByText("Lá số này không tồn tại hoặc bạn không có quyền xem."),
    ).toBeVisible();

    // Ensure User A's profile name and chart data are not displayed
    await expect(pageB.getByText("Hồ sơ A")).not.toBeVisible();
    await expect(pageB.getByText("Placidus")).not.toBeVisible();
  });
});
