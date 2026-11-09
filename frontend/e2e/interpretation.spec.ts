import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { test, expect, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const seedPath = path.resolve(
  __dirname,
  "../../backend/prisma/content/interpretations.vi.json",
);

interface SeedItem {
  subjectType: string;
  subjectKey: string;
  bodyText: string;
}

interface SeedData {
  version: string;
  language: string;
  items: SeedItem[];
}

const seedData: SeedData = JSON.parse(fs.readFileSync(seedPath, "utf8"));
const seedMap = new Map<string, SeedItem>();
for (const item of seedData.items) {
  seedMap.set(item.subjectKey, item);
}

const password = "Password123!";

/**
 * Minimal helper to register a new user and log in to reach /app.
 */
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

/**
 * Minimal helper to create a birth profile with options for known/unknown birth time.
 * Note: Under D-M7-04, mocking external GeoNames service is permitted and scoped.
 */
async function createBirthProfile(
  page: Page,
  options: {
    profileName: string;
    birthDate: string;
    isBirthTimeKnown: boolean;
    birthTime?: string;
  },
) {
  await page.goto("/app/profiles");
  await page.getByRole("link", { name: "Tạo hồ sơ mới" }).click();
  await page.waitForURL("**/app/profiles/new");

  // Step 1: Name
  await page.getByLabel("Họ và tên *").fill(options.profileName);
  await page.getByRole("button", { name: "Tiếp tục" }).click();

  // Step 2: Date, time, location
  await page.getByLabel("Ngày sinh *").fill(options.birthDate);

  if (options.isBirthTimeKnown) {
    if (options.birthTime) {
      await page.getByLabel("Giờ sinh *").fill(options.birthTime);
    }
  } else {
    const checkbox = page.getByLabel("Tôi biết rõ giờ sinh của mình");
    await checkbox.uncheck();
  }

  // Permitted mock for external GeoNames location search
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

  // Submit and wait for response/navigation
  await page.getByRole("button", { name: "Hoàn tất" }).click();
  await expect(page.getByText(/Tạo hồ sơ thành công/i)).toBeVisible();
  await page.waitForURL("**/app/profiles");
}

/**
 * Attach unhandled pageerror, unexpected API >= 400, and [reportError] console observers.
 */
function attachErrorObservers(page: Page) {
  const pageErrors: Error[] = [];
  const apiErrors: string[] = [];
  const reportErrors: string[] = [];

  page.on("pageerror", (err) => {
    pageErrors.push(err);
  });

  page.on("response", (res) => {
    if (res.url().includes("/api/") && res.status() >= 400) {
      // Allowlist: POST /api/v1/auth/refresh returning 400 (missing cookie) or 401 before session exists
      if (
        res.url().includes("/auth/refresh") &&
        (res.status() === 400 || res.status() === 401)
      ) {
        return;
      }
      apiErrors.push(
        `${res.request().method()} ${res.url()} -> ${res.status()}`,
      );
    }
  });

  page.on("console", (msg) => {
    if (msg.text().includes("[reportError]")) {
      reportErrors.push(msg.text());
    }
  });

  return {
    assertClean() {
      expect(pageErrors, "Expected 0 unhandled page errors").toHaveLength(0);
      expect(apiErrors, "Expected 0 unexpected API >= 400 errors").toHaveLength(
        0,
      );
      expect(
        reportErrors,
        "Expected 0 client [reportError] issues",
      ).toHaveLength(0);
    },
  };
}

test.describe("Real Backend Scenario A: Successful Natal Chart Interpretation Journey", () => {
  const emailA = `e2e-interp-a-${Date.now()}@test.local`;
  let page: Page;
  let errorObserver: ReturnType<typeof attachErrorObservers>;
  let createdChartId: string;
  let chartResponseJson: Record<string, unknown>;
  let marsPlanet: { name: string; sign: string; house: number | null };
  let expectedSignKey: string;
  let expectedHouseKey: string;
  let seedSignItem: SeedItem;
  let seedHouseItem: SeedItem;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    errorObserver = attachErrorObservers(page);
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  test("A1: Register and login isolated user", async () => {
    await registerAndLogin(page, emailA);
    expect(page.url()).toContain("/app");
  });

  test("A2: Create birth profile with known birth time", async () => {
    await createBirthProfile(page, {
      profileName: "Hồ sơ Diễn giải Chuẩn",
      birthDate: "1995-10-25",
      isBirthTimeKnown: true,
      birthTime: "08:30",
    });
    await expect(page.getByText("Hồ sơ Diễn giải Chuẩn")).toBeVisible();
  });

  test("A3: Calculate natal chart and intercept Real Backend contract with seed provenance", async () => {
    const calcCardBtn = page
      .getByRole("button", { name: /tính lá số cho hồ sơ/i })
      .first();
    await calcCardBtn.click();

    const dialog = page.getByRole("dialog", { name: "Tính lá số" });
    await expect(dialog).toBeVisible();

    const calculatePromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/v1/charts/natal") &&
        res.request().method() === "POST",
    );

    const submitBtn = dialog.getByRole("button", { name: "Tính lá số" });
    await submitBtn.click();

    const response = await calculatePromise;
    expect([200, 201]).toContain(response.status());
    chartResponseJson = (await response.json()) as Record<string, unknown>;

    // Real Backend contract assertions
    expect(chartResponseJson["isHouseDataAvailable"]).toBe(true);
    expect(typeof chartResponseJson["interpretationVersion"]).toBe("string");
    expect(chartResponseJson["interpretationVersion"]).not.toBeNull();
    expect(chartResponseJson["interpretationVersion"]).toBe(seedData.version);

    const interpretations = (chartResponseJson["interpretations"] ??
      []) as Array<{
      subjectType: string;
      subjectKey: string;
      language: string;
      bodyText: string;
    }>;
    expect(interpretations.length).toBeGreaterThan(0);

    // Locate Mars planet
    const planets = (chartResponseJson["planets"] ?? []) as Array<{
      name: string;
      sign: string;
      house: number | null;
    }>;
    const mars = planets.find((p) => p.name === "Mars");
    expect(mars, "Mars not found in response planets").toBeDefined();
    marsPlanet = mars!;
    expect(marsPlanet.sign).toBeTruthy();
    expect(marsPlanet.house).not.toBeNull();

    expectedSignKey = `Mars_in_${marsPlanet.sign}`;
    expectedHouseKey = `Mars_in_House_${marsPlanet.house}`;

    // Verify seed provenance
    const sSign = seedMap.get(expectedSignKey);
    const sHouse = seedMap.get(expectedHouseKey);
    expect(sSign, `Seed missing ${expectedSignKey}`).toBeDefined();
    expect(sHouse, `Seed missing ${expectedHouseKey}`).toBeDefined();
    seedSignItem = sSign!;
    seedHouseItem = sHouse!;

    // Verify Backend response matches seed
    const respSign = interpretations.find(
      (i) =>
        i.subjectKey === expectedSignKey && i.subjectType === "PlanetInSign",
    );
    const respHouse = interpretations.find(
      (i) =>
        i.subjectKey === expectedHouseKey && i.subjectType === "PlanetInHouse",
    );
    expect(
      respSign,
      `Backend missing interpretation ${expectedSignKey}`,
    ).toBeDefined();
    expect(
      respHouse,
      `Backend missing interpretation ${expectedHouseKey}`,
    ).toBeDefined();

    expect(respSign!.bodyText.trim()).toBe(seedSignItem.bodyText.trim());
    expect(respHouse!.bodyText.trim()).toBe(seedHouseItem.bodyText.trim());

    // Record step summary if running in CI
    if (process.env.GITHUB_STEP_SUMMARY) {
      fs.appendFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        `\n- **Scenario A (A3):** interpretationVersion=${String(chartResponseJson["interpretationVersion"])}, Mars signKey=${expectedSignKey}, Mars houseKey=${expectedHouseKey}, seedMatch=true\n`,
      );
    }

    // Wait for navigation to /app/charts/:chartId
    await page.waitForURL(/\/app\/charts\/[0-9a-fA-F-]+/);
    const match = page.url().match(/\/app\/charts\/([0-9a-fA-F-]+)/);
    expect(match).not.toBeNull();
    createdChartId = match![1]!;

    await expect(
      page.getByRole("heading", { name: "Lá số sinh", level: 1 }),
    ).toBeVisible();
  });

  test("A4: Select Mars on wheel, verify selection sync with Planet Table and live region", async () => {
    const shell = page.getByTestId("chart-viewer-shell");
    await expect(shell).toBeVisible({ timeout: 15000 });

    const wheelMars = page.locator(
      '[data-testid="chart-wheel"] [role="button"][data-planet="Mars"]',
    );
    await expect(wheelMars).toBeVisible();
    await wheelMars.click();
    await expect(wheelMars).toHaveAttribute("aria-pressed", "true");

    const tableMars = page.locator('table button[data-planet-key="Mars"]');
    await expect(tableMars).toBeVisible();
    await expect(tableMars).toHaveAttribute("aria-pressed", "true");
    await expect(tableMars).toHaveAttribute("aria-label", "Chọn Sao Hỏa");

    const liveRegion = page.locator('div[role="status"]');
    await expect(liveRegion).toContainText("Đã chọn");
    const liveText = (await liveRegion.textContent()) ?? "";
    expect(liveText).not.toContain(seedSignItem.bodyText.slice(0, 30));
  });

  test("A5: Verify Mars disclosure, text matching seed, 'Đọc diễn giải', 'Xem trên biểu đồ', and Escape recovery", async () => {
    const panel = page.getByRole("region", { name: "Diễn giải" });
    await expect(panel).toBeVisible();

    const marsHeaderBtn = panel.getByRole("button", { name: /^Sao Hỏa/ });
    await expect(marsHeaderBtn).toBeVisible();
    await expect(marsHeaderBtn).toHaveAttribute("aria-current", "true");
    await expect(marsHeaderBtn).toHaveAttribute("aria-expanded", "true");
    await expect(panel.getByText("Đang chọn")).toBeVisible();

    // Verify text matching seed
    const signDd = panel.locator('div:has(dt:text("Theo cung")) dd');
    await expect(signDd).toBeVisible();
    const signDdText = (await signDd.textContent())?.trim();
    expect(signDdText).toBe(seedSignItem.bodyText.trim());

    const houseDd = panel.locator('div:has(dt:text-matches("^Theo nhà")) dd');
    await expect(houseDd).toBeVisible();
    const houseDdText = (await houseDd.textContent())?.trim();
    expect(houseDdText).toBe(seedHouseItem.bodyText.trim());

    // Verify "Đọc diễn giải" button moves focus and re-expands if collapsed
    await marsHeaderBtn.click();
    await expect(marsHeaderBtn).toHaveAttribute("aria-expanded", "false");

    const readBtn = page.getByRole("button", { name: "Đọc diễn giải" });
    await expect(readBtn).toBeVisible();
    await readBtn.click();

    await expect(marsHeaderBtn).toBeFocused();
    await expect(marsHeaderBtn).toHaveAttribute("aria-expanded", "true");

    const wheelMars = page.locator(
      '[data-testid="chart-wheel"] [role="button"][data-planet="Mars"]',
    );
    const tableMars = page.locator('table button[data-planet-key="Mars"]');
    await expect(wheelMars).toHaveAttribute("aria-pressed", "true");
    await expect(tableMars).toHaveAttribute("aria-pressed", "true");

    // Verify "Xem trên biểu đồ" button returns focus to wheel Mars without mutating selection
    const viewOnChartBtn = panel.getByRole("button", {
      name: "Xem trên biểu đồ: Sao Hỏa",
    });
    await expect(viewOnChartBtn).toBeVisible();
    await viewOnChartBtn.click();

    await expect(wheelMars).toBeFocused();
    await expect(wheelMars).toHaveAttribute("aria-pressed", "true");

    // Verify Escape key clears selection while keeping item expanded and focus in place
    await marsHeaderBtn.focus();
    await page.keyboard.press("Escape");

    await expect(panel.getByText("Đang chọn")).toHaveCount(0);
    await expect(wheelMars).toHaveAttribute("aria-pressed", "false");
    await expect(tableMars).toHaveAttribute("aria-pressed", "false");
    await expect(marsHeaderBtn).toHaveAttribute("aria-expanded", "true");
    await expect(marsHeaderBtn).toBeFocused();

    const liveRegion = page.locator('div[role="status"]');
    await expect(liveRegion).toContainText("Đã bỏ chọn.");
  });

  test("A6: Page reload persistence on GET /charts/:id and clean error observers", async () => {
    const getPromise = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/v1/charts/${createdChartId}`) &&
        res.request().method() === "GET",
    );

    await page.reload();

    const getResponse = await getPromise;
    expect(getResponse.status()).toBe(200);
    const getChartJson = (await getResponse.json()) as Record<string, unknown>;
    expect(getChartJson["interpretationVersion"]).toBe(seedData.version);

    const shell = page.getByTestId("chart-viewer-shell");
    await expect(shell).toBeVisible({ timeout: 15000 });
    const panel = page.getByRole("region", { name: "Diễn giải" });
    await expect(panel).toBeVisible({ timeout: 15000 });

    const reloadMarsBtn = panel.getByRole("button", { name: /^Sao Hỏa/ });
    await expect(reloadMarsBtn).toBeVisible();

    // Verify 0 page errors, 0 API >= 400 errors, and 0 [reportError] console entries
    errorObserver.assertClean();
  });
});
