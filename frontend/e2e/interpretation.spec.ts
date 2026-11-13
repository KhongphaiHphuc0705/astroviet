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

    // Ensure element is in view before measuring baseline scroll
    await wheelMars.scrollIntoViewIfNeeded();

    // Measure scroll position before selection (Mục 8.2 bước 4: không tự cuộn / không dời focus)
    const scrollBefore = await page.evaluate(() => window.scrollY);

    await wheelMars.click();
    await expect(wheelMars).toHaveAttribute("aria-pressed", "true");

    // Focus remains on wheelMars without displacement
    await expect(wheelMars).toBeFocused();

    // Viewport did not scroll automatically upon selection
    const scrollAfter = await page.evaluate(() => window.scrollY);
    expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThanOrEqual(5);

    const tableMars = page.locator('table button[data-planet-key="Mars"]');
    await expect(tableMars).toBeVisible();
    await expect(tableMars).toHaveAttribute("aria-pressed", "true");
    await expect(tableMars).toHaveAttribute("aria-label", "Chọn Sao Hỏa");

    const liveRegion = page.locator('div[role="status"][aria-live="polite"]');
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

    // Verify text matching seed via aria-controls disclosure panel
    const panelId = await marsHeaderBtn.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();
    const marsDisclosure = page.locator(`[id="${panelId}"]`);

    const signDd = marsDisclosure.locator('dt:text("Theo cung") + dd');
    await expect(signDd).toBeVisible();
    const signDdText = (await signDd.textContent())?.trim();
    expect(signDdText).toBe(seedSignItem.bodyText.trim());

    const houseDd = marsDisclosure.locator('dt:text-matches("^Theo nhà") + dd');
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

    const liveRegion = page.locator('div[role="status"][aria-live="polite"]');
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
    await expect(reloadMarsBtn).toHaveAttribute("aria-expanded", "false");

    // Expand Mars item to view persisted interpretation
    await reloadMarsBtn.click();
    await expect(reloadMarsBtn).toHaveAttribute("aria-expanded", "true");

    // Verify Mars interpretation text persists and matches seed after reload
    const panelId = await reloadMarsBtn.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();
    const reloadMarsDisclosure = page.locator(`[id="${panelId}"]`);

    const signDd = reloadMarsDisclosure.locator('dt:text("Theo cung") + dd');
    await expect(signDd).toBeVisible();
    expect((await signDd.textContent())?.trim()).toBe(
      seedSignItem.bodyText.trim(),
    );

    const houseDd = reloadMarsDisclosure.locator(
      'dt:text-matches("^Theo nhà") + dd',
    );
    await expect(houseDd).toBeVisible();
    expect((await houseDd.textContent())?.trim()).toBe(
      seedHouseItem.bodyText.trim(),
    );

    // Verify 0 page errors, 0 API >= 400 errors, and 0 [reportError] console entries
    errorObserver.assertClean();
  });
});

test.describe("Real Backend Scenario B: Degraded / Unknown Birth Time Journey", () => {
  const emailB = `e2e-interp-b-${Date.now()}@test.local`;
  let page: Page;
  let errorObserver: ReturnType<typeof attachErrorObservers>;
  let chartResponseJsonB: Record<string, unknown>;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    errorObserver = attachErrorObservers(page);
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  test("B1: Register and login as new isolated user", async () => {
    await registerAndLogin(page, emailB);
    expect(page.url()).toContain("/app");
  });

  test("B2: Create birth profile with unknown birth time and probe request", async () => {
    await page.goto("/app/profiles");
    await page.getByRole("link", { name: "Tạo hồ sơ mới" }).click();
    await page.waitForURL("**/app/profiles/new");

    // Step 1: Name
    await page.getByLabel("Họ và tên *").fill("Hồ sơ Không Giờ Sinh");
    await page.getByRole("button", { name: "Tiếp tục" }).click();

    // Step 2: Date
    await page.getByLabel("Ngày sinh *").fill("1998-05-12");

    // Uncheck "Tôi biết rõ giờ sinh của mình"
    const timeCheckbox = page.getByLabel("Tôi biết rõ giờ sinh của mình");
    await timeCheckbox.uncheck();

    // Verify birthTime input is disabled
    const timeInput = page.getByLabel("Giờ sinh *");
    await expect(timeInput).toBeDisabled();

    // Mock external location search API (permitted under D-M7-04)
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

    // Probe create profile request payload
    const createProfilePromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/v1/birth-profiles") && req.method() === "POST",
    );

    await page.getByRole("button", { name: "Hoàn tất" }).click();

    const createReq = await createProfilePromise;
    const reqPayload = createReq.postDataJSON() as {
      isBirthTimeKnown?: boolean;
      birthTime?: string | null;
    };
    expect(reqPayload.isBirthTimeKnown).toBe(false);
    expect(reqPayload.birthTime).toBeNull();

    await expect(page.getByText(/Tạo hồ sơ thành công/i)).toBeVisible();
    await page.waitForURL("**/app/profiles");
    await expect(page.getByText("Hồ sơ Không Giờ Sinh")).toBeVisible();
  });

  test("B3: Calculate chart and verify degraded Real Backend response with seed provenance", async () => {
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
    chartResponseJsonB = (await response.json()) as Record<string, unknown>;

    // Assert degraded contract: isHouseDataAvailable === false, houses=[], angles=[]
    expect(chartResponseJsonB["isHouseDataAvailable"]).toBe(false);
    expect(chartResponseJsonB["houses"]).toHaveLength(0);
    expect(chartResponseJsonB["angles"]).toHaveLength(0);

    expect(typeof chartResponseJsonB["interpretationVersion"]).toBe("string");
    expect(chartResponseJsonB["interpretationVersion"]).not.toBeNull();
    expect(chartResponseJsonB["interpretationVersion"]).toBe(seedData.version);

    const interpB = (chartResponseJsonB["interpretations"] ?? []) as Array<{
      subjectType: string;
      subjectKey: string;
      language: string;
      bodyText: string;
    }>;
    expect(interpB).toHaveLength(10);

    const planetInSignB = interpB.filter(
      (item) => item.subjectType === "PlanetInSign",
    );
    const angleInSignB = interpB.filter(
      (item) => item.subjectType === "AngleInSign",
    );
    const planetInHouseB = interpB.filter(
      (item) => item.subjectType === "PlanetInHouse",
    );

    expect(planetInSignB).toHaveLength(10);
    expect(angleInSignB).toHaveLength(0);
    expect(planetInHouseB).toHaveLength(0);

    // Verify all 10 PlanetInSign match seed
    const planets = (chartResponseJsonB["planets"] ?? []) as Array<{
      name: string;
      sign: string;
      house: number | null;
    }>;
    expect(planets.length).toBeGreaterThan(0);

    for (const planet of planets) {
      expect(planet.house).toBeNull();
      const expectedKey = `${planet.name}_in_${planet.sign}`;
      const seedItem = seedMap.get(expectedKey);
      expect(seedItem, `Missing seed for key ${expectedKey}`).toBeDefined();

      const respItem = planetInSignB.find((i) => i.subjectKey === expectedKey);
      expect(respItem, `Missing response for key ${expectedKey}`).toBeDefined();
      expect(respItem!.bodyText.trim()).toBe(seedItem!.bodyText.trim());
    }

    if (process.env.GITHUB_STEP_SUMMARY) {
      fs.appendFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        `\n- **Scenario B (B3):** interpretationVersion=${String(chartResponseJsonB["interpretationVersion"])}, count=${interpB.length} (PlanetInSign=${planetInSignB.length}, degraded/no-birth-time), seedMatch=true\n`,
      );
    }

    await page.waitForURL(/\/app\/charts\/[0-9a-fA-F-]+/);
    await expect(
      page.getByRole("heading", { name: "Lá số sinh", level: 1 }),
    ).toBeVisible();
  });

  test("B4: Verify degraded Interpretation Panel UI, no House sections, and neutral notice", async () => {
    const shell = page.getByTestId("chart-viewer-shell");
    await expect(shell).toBeVisible({ timeout: 15000 });

    const panel = page.getByRole("region", { name: "Diễn giải" });
    await expect(panel).toBeVisible({ timeout: 15000 });

    // Neutral house notice displayed exactly once inside the panel
    const houseNotice = panel.getByText(
      "Dữ liệu Nhà và một số góc trong lá số này chưa khả dụng. Bạn vẫn có thể xem các diễn giải theo cung.",
    );
    await expect(houseNotice).toHaveCount(1);
    await expect(houseNotice).toBeVisible();

    // Zero "Theo nhà" sections in the panel
    const houseSections = panel.locator('dt:text-matches("^Theo nhà")');
    await expect(houseSections).toHaveCount(0);

    // Ascendant item: checked by identifier [id="angle:Ascendant"] and contract (no view button)
    const ascArticle = panel.locator('[id="angle:Ascendant"]');
    await expect(ascArticle).toBeVisible();

    const ascViewBtn = ascArticle.getByRole("button", {
      name: /Xem trên biểu đồ/i,
    });
    await expect(ascViewBtn).toHaveCount(0);

    // All 10 planets in degraded state have "Theo cung" text in DOM matching seed exactly
    const planets = (chartResponseJsonB["planets"] ?? []) as Array<{
      name: string;
      sign: string;
    }>;
    expect(planets.length).toBe(10);

    for (const planet of planets) {
      const planetArticle = panel.locator(`[id="planet:${planet.name}"]`);
      await expect(planetArticle).toBeVisible();

      const signDd = planetArticle.locator('dt:text("Theo cung") + dd');
      const signDdText = (await signDd.textContent())?.trim();
      const expectedKey = `${planet.name}_in_${planet.sign}`;
      const seedItem = seedMap.get(expectedKey);
      expect(seedItem, `Missing seed for key ${expectedKey}`).toBeDefined();
      expect(signDdText).toBe(seedItem!.bodyText.trim());
    }
  });

  test("B5: Verify F4 degraded state interoperability and clean UI state", async () => {
    // Wheel is rendered and interactive
    const wheelFigure = page.getByTestId("chart-wheel");
    await expect(wheelFigure).toBeVisible();

    // Planet Table is rendered without House column
    await expect(
      page.getByRole("heading", { name: "Vị trí hành tinh" }),
    ).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Nhà" })).toHaveCount(
      0,
    );

    // House Table data is absent (HouseDataNotice rendered in place of table)
    await expect(
      page.getByRole("columnheader", { name: "Cusp (độ)" }),
    ).toHaveCount(0);

    // F4 HouseDataNotice banner is visible
    await expect(
      page.getByText("Dữ liệu Nhà và các góc chưa khả dụng"),
    ).toBeVisible();

    // Selecting a planet on wheel synchronizes with panel
    const wheelVenus = page.locator(
      '[data-testid="chart-wheel"] [role="button"][data-planet="Venus"]',
    );
    await wheelVenus.click();
    await expect(wheelVenus).toHaveAttribute("aria-pressed", "true");

    const panel = page.getByRole("region", { name: "Diễn giải" });
    const venusHeaderBtn = panel.getByRole("button", { name: /^Sao Kim/ });
    await expect(venusHeaderBtn).toHaveAttribute("aria-current", "true");
    await expect(venusHeaderBtn).toHaveAttribute("aria-expanded", "true");

    // Zero error alerts in clean degraded state
    await expect(page.getByRole("alert")).toHaveCount(0);
  });

  test("B6: Verify 0 unhandled errors throughout Scenario B", async () => {
    errorObserver.assertClean();
  });
});
