import { test, expect, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const KNOWN_ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

const MVP_PLANET_NAMES = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
] as const;

const password = "Password123!";

/**
 * Helper to register a new user and log in to reach /app.
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
 * Helper to create a birth profile with options for known/unknown birth time.
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
    // Uncheck "Tôi biết rõ giờ sinh của mình"
    const checkbox = page.getByLabel("Tôi biết rõ giờ sinh của mình");
    await checkbox.uncheck();
  }

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

  // Submit and wait for response/navigation
  await page.getByRole("button", { name: "Hoàn tất" }).click();
  await expect(page.getByText(/Tạo hồ sơ thành công/i)).toBeVisible();
  await page.waitForURL("**/app/profiles");
}

/**
 * Attach unhandled pageerror and unexpected API error observers with allowlist.
 */
function attachErrorObservers(page: Page) {
  const pageErrors: Error[] = [];
  const apiErrors: string[] = [];

  page.on("pageerror", (err) => {
    pageErrors.push(err);
  });

  page.on("response", (res) => {
    if (res.url().includes("/api/") && res.status() >= 400) {
      // Allowlist: POST /api/v1/auth/refresh returning 400 (missing cookie) or 401 (invalid/expired) before session exists (normal bootstrap)
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

  return {
    assertClean() {
      expect(pageErrors, "Expected 0 unhandled page errors").toHaveLength(0);
      expect(apiErrors, "Expected 0 unexpected API >= 400 errors").toHaveLength(
        0,
      );
    },
  };
}

test.describe("Primary E2E Scenario 1: Successful Natal Chart Journey", () => {
  const email1 = `e2e-chart-s1-${Date.now()}@test.local`;
  let page: Page;
  let errorObserver: ReturnType<typeof attachErrorObservers>;
  let createdChartId: string;
  let chartResponseJson: Record<string, unknown>;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    errorObserver = attachErrorObservers(page);
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  test("S1.1: Register and login to reach /app", async () => {
    await registerAndLogin(page, email1);
    expect(page.url()).toContain("/app");
  });

  test("S1.2: Create birth profile with known birth time", async () => {
    await createBirthProfile(page, {
      profileName: "Hồ sơ Lá số Chuẩn",
      birthDate: "1995-10-25",
      isBirthTimeKnown: true,
      birthTime: "08:30",
    });
    await expect(page.getByText("Hồ sơ Lá số Chuẩn")).toBeVisible();
  });

  test("S1.3: Calculate natal chart and intercept contract response", async () => {
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

    // Verify 14 contract fields
    const requiredFields = [
      "id",
      "chartType",
      "houseSystem",
      "isHouseDataAvailable",
      "planets",
      "houses",
      "angles",
      "aspects",
      "patterns",
      "interpretations",
      "interpretationVersion",
      "warnings",
      "calculatedAt",
      "engineVersion",
    ];
    for (const field of requiredFields) {
      expect(
        chartResponseJson,
        `Missing contract field: ${field}`,
      ).toHaveProperty(field);
    }
    expect(chartResponseJson["isHouseDataAvailable"]).toBe(true);
    expect(chartResponseJson["houses"]).toHaveLength(12);

    // Probe A: Permanent contract verification for seeded interpretations (Sprint F5 M1)
    expect(
      chartResponseJson["interpretationVersion"],
      `Expected interpretationVersion === "1.0", got ${String(chartResponseJson["interpretationVersion"])}`,
    ).toBe("1.0");

    const interpretations = (chartResponseJson["interpretations"] ??
      []) as Array<{
      subjectType: string;
      subjectKey: string;
      language: string;
      bodyText: string;
    }>;

    const planetInSignItems = interpretations.filter(
      (item) => item.subjectType === "PlanetInSign",
    );
    const angleInSignItems = interpretations.filter(
      (item) => item.subjectType === "AngleInSign",
    );
    const planetInHouseItems = interpretations.filter(
      (item) => item.subjectType === "PlanetInHouse",
    );

    expect(
      interpretations,
      `Expected 21 interpretations for known birth time, got ${interpretations.length} (PlanetInSign=${planetInSignItems.length}, AngleInSign=${angleInSignItems.length}, PlanetInHouse=${planetInHouseItems.length})`,
    ).toHaveLength(21);
    expect(
      planetInSignItems,
      `Expected 10 PlanetInSign interpretations, got ${planetInSignItems.length}`,
    ).toHaveLength(10);
    expect(
      angleInSignItems,
      `Expected 1 AngleInSign interpretation, got ${angleInSignItems.length}`,
    ).toHaveLength(1);
    expect(
      planetInHouseItems,
      `Expected 10 PlanetInHouse interpretations, got ${planetInHouseItems.length}`,
    ).toHaveLength(10);

    const subjectKeys = new Set<string>();
    for (const item of interpretations) {
      expect(item.language).toBe("vi");
      expect(typeof item.bodyText).toBe("string");
      expect(item.bodyText.trim().length).toBeGreaterThan(0);
      expect(["PlanetInSign", "AngleInSign", "PlanetInHouse"]).toContain(
        item.subjectType,
      );
      expect(
        subjectKeys.has(item.subjectKey),
        `Duplicate subjectKey: ${item.subjectKey}`,
      ).toBe(false);
      subjectKeys.add(item.subjectKey);
    }

    const planets = (chartResponseJson["planets"] ?? []) as Array<{
      name: string;
      sign: string;
      house: number | null;
    }>;
    const angles = (chartResponseJson["angles"] ?? []) as Array<{
      type: string;
      sign: string;
    }>;

    for (const planet of planets) {
      expect(
        KNOWN_ZODIAC_SIGNS,
        `Unknown planet sign: ${planet.sign}`,
      ).toContain(planet.sign);
    }

    for (const mvpName of MVP_PLANET_NAMES) {
      const planet = planets.find((p) => p.name === mvpName);
      expect(planet, `MVP planet not found: ${mvpName}`).toBeDefined();
      if (planet) {
        const expectedSignKey = `${planet.name}_in_${planet.sign}`;
        expect(
          planetInSignItems.some((i) => i.subjectKey === expectedSignKey),
          `Missing PlanetInSign key: ${expectedSignKey}`,
        ).toBe(true);

        const expectedHouseKey = `${planet.name}_in_House_${planet.house}`;
        expect(
          planetInHouseItems.some((i) => i.subjectKey === expectedHouseKey),
          `Missing PlanetInHouse key: ${expectedHouseKey}`,
        ).toBe(true);
      }
    }

    const ascendant = angles.find((a) => a.type === "Ascendant");
    expect(ascendant, "Ascendant not found in angles").toBeDefined();
    if (ascendant) {
      const expectedAscendantKey = `Ascendant_in_${ascendant.sign}`;
      expect(
        angleInSignItems.some((i) => i.subjectKey === expectedAscendantKey),
        `Missing AngleInSign key: ${expectedAscendantKey}`,
      ).toBe(true);
    }

    if (process.env.GITHUB_STEP_SUMMARY) {
      const fs = await import("node:fs");
      fs.appendFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        `\n- **Probe A (S1.3):** interpretationVersion=${String(chartResponseJson["interpretationVersion"])}, count=${interpretations.length} (PlanetInSign=${planetInSignItems.length}, AngleInSign=${angleInSignItems.length}, PlanetInHouse=${planetInHouseItems.length})\n`,
      );
    }

    // Navigates to /app/charts/:chartId
    await page.waitForURL(/\/app\/charts\/[0-9a-fA-F-]+/);
    const match = page.url().match(/\/app\/charts\/([0-9a-fA-F-]+)/);
    expect(match).not.toBeNull();
    createdChartId = match![1]!;

    // Focus / h1 title
    await expect(
      page.getByRole("heading", { name: "Lá số sinh", level: 1 }),
    ).toBeVisible();
  });

  test("S1.4: Inspect viewer contents (wheel and data tables)", async () => {
    const wheelFigure = page.getByTestId("chart-wheel");
    await expect(wheelFigure).toBeVisible();

    const wheelPlanetButtons = wheelFigure.getByRole("button", {
      name: /^Chọn /,
    });
    const planetsArray = chartResponseJson["planets"] as unknown[];
    const planetCount = await wheelPlanetButtons.count();
    expect(planetCount).toBe(planetsArray.length);

    await expect(
      page.getByRole("heading", { name: "Vị trí hành tinh" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Nhà và các góc" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Góc chiếu" }),
    ).toBeVisible();
  });

  test("S1.5: Select planet on wheel and verify cross-surface sync", async () => {
    const wheelFigure = page.getByTestId("chart-wheel");
    const firstPlanetBtn = wheelFigure
      .getByRole("button", { name: /^Chọn / })
      .first();
    await firstPlanetBtn.click();

    await expect(firstPlanetBtn).toHaveAttribute("aria-pressed", "true");

    const liveRegion = page.getByRole("status");
    await expect(liveRegion).toContainText(/Đã chọn/);

    await expect(
      page.getByRole("heading", { name: "Chi tiết đang chọn" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Xóa bộ lọc theo/ }),
    ).toBeVisible();
  });

  test("S1.6: Press Escape to clear selection", async () => {
    await page.keyboard.press("Escape");

    const wheelFigure = page.getByTestId("chart-wheel");
    const firstPlanetBtn = wheelFigure
      .getByRole("button", { name: /^Chọn / })
      .first();
    await expect(firstPlanetBtn).toHaveAttribute("aria-pressed", "false");

    const liveRegion = page.getByRole("status");
    await expect(liveRegion).toContainText("Đã bỏ chọn");
  });

  test("S1.7: Select aspect from AspectTable and verify detail display", async () => {
    const firstAspectBtn = page
      .getByRole("button", { name: /^Chọn góc chiếu/ })
      .first();
    if (await firstAspectBtn.isVisible()) {
      await firstAspectBtn.click();
      await expect(firstAspectBtn).toHaveAttribute("aria-pressed", "true");
      await expect(
        page.getByRole("heading", { name: "Chi tiết đang chọn" }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "Bỏ chọn" })).toBeVisible();
      await page.keyboard.press("Escape");
    }
  });

  test("S1.8: Toggle aspect lines switch on wheel", async () => {
    const aspectSwitch = page.getByRole("switch", {
      name: "Hiện đường góc chiếu",
    });
    await expect(aspectSwitch).toBeVisible();
    await expect(aspectSwitch).toBeChecked();

    await aspectSwitch.click();
    await expect(aspectSwitch).not.toBeChecked();

    await aspectSwitch.click();
    await expect(aspectSwitch).toBeChecked();
  });

  test("S1.9: Navigate to saved charts, verify listing, and reopen chart", async () => {
    const nav = page.getByRole("navigation", { name: "Điều hướng chính" });
    await nav.getByRole("link", { name: "Lá số của tôi" }).click();

    await page.waitForURL("**/app/charts");
    await expect(
      page.getByRole("heading", { name: "Lá số của tôi" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Hồ sơ Lá số Chuẩn" }),
    ).toBeVisible();

    const viewChartLink = page
      .getByRole("link", { name: /xem lá số/i })
      .first();
    await viewChartLink.click();

    await page.waitForURL(`**/app/charts/${createdChartId}`);
    await expect(
      page.getByRole("heading", { name: "Lá số sinh", level: 1 }),
    ).toBeVisible();

    await page.goBack();
    await page.waitForURL("**/app/charts");
    await expect(
      page.getByRole("heading", { name: "Lá số của tôi" }),
    ).toBeVisible();
  });

  test("S1.10: Verify 0 unhandled errors throughout Scenario 1", async () => {
    errorObserver.assertClean();
  });
});

test.describe("Primary E2E Scenario 2: Degraded / Unknown Birth Time Journey", () => {
  const email2 = `e2e-chart-s2-${Date.now()}@test.local`;
  let page: Page;
  let errorObserver: ReturnType<typeof attachErrorObservers>;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    errorObserver = attachErrorObservers(page);
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  test("S2.1: Register and login as new isolated user", async () => {
    await registerAndLogin(page, email2);
    expect(page.url()).toContain("/app");
  });

  test("S2.2: Create birth profile with unknown birth time and probe request", async () => {
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

    // Mock location search API
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

    // Probe create profile request payload (INV-BP1)
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

  test("S2.3: Calculate chart and verify degraded Backend response", async () => {
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
    const chartJson = (await response.json()) as {
      isHouseDataAvailable: boolean;
      houses: unknown[];
      angles: unknown[];
      planets: Array<{ name: string; sign: string; house: number | null }>;
      interpretations: Array<{
        subjectType: string;
        subjectKey: string;
        language: string;
        bodyText: string;
      }>;
      interpretationVersion: string | null;
    };

    // Verify degraded contract: isHouseDataAvailable === false, houses=[], angles=[]
    expect(chartJson.isHouseDataAvailable).toBe(false);
    expect(chartJson.houses).toHaveLength(0);
    expect(chartJson.angles).toHaveLength(0);
    expect(chartJson.planets.length).toBeGreaterThan(0);
    for (const planet of chartJson.planets) {
      expect(planet.house).toBeNull();
    }

    // Probe B: Permanent contract verification for degraded interpretations (Sprint F5 M1)
    expect(
      chartJson.interpretationVersion,
      `Expected interpretationVersion === "1.0", got ${String(chartJson.interpretationVersion)}`,
    ).toBe("1.0");

    const interpretationsB = chartJson.interpretations ?? [];
    const planetInSignItemsB = interpretationsB.filter(
      (item) => item.subjectType === "PlanetInSign",
    );
    const angleInSignItemsB = interpretationsB.filter(
      (item) => item.subjectType === "AngleInSign",
    );
    const planetInHouseItemsB = interpretationsB.filter(
      (item) => item.subjectType === "PlanetInHouse",
    );

    expect(
      interpretationsB,
      `Expected 10 interpretations for unknown birth time, got ${interpretationsB.length} (PlanetInSign=${planetInSignItemsB.length}, AngleInSign=${angleInSignItemsB.length}, PlanetInHouse=${planetInHouseItemsB.length})`,
    ).toHaveLength(10);
    expect(
      planetInSignItemsB,
      `Expected all 10 interpretations to be PlanetInSign, got ${planetInSignItemsB.length}`,
    ).toHaveLength(10);
    expect(angleInSignItemsB).toHaveLength(0);
    expect(planetInHouseItemsB).toHaveLength(0);

    for (const item of interpretationsB) {
      expect(item.language).toBe("vi");
      expect(typeof item.bodyText).toBe("string");
      expect(item.bodyText.trim().length).toBeGreaterThan(0);
    }

    for (const planet of chartJson.planets) {
      expect(
        KNOWN_ZODIAC_SIGNS,
        `Unknown planet sign: ${planet.sign}`,
      ).toContain(planet.sign);
    }

    for (const mvpName of MVP_PLANET_NAMES) {
      const planet = chartJson.planets.find((p) => p.name === mvpName);
      expect(planet, `MVP planet not found: ${mvpName}`).toBeDefined();
      if (planet) {
        const expectedSignKey = `${planet.name}_in_${planet.sign}`;
        expect(
          planetInSignItemsB.some((i) => i.subjectKey === expectedSignKey),
          `Missing PlanetInSign key: ${expectedSignKey}`,
        ).toBe(true);
      }
    }

    if (process.env.GITHUB_STEP_SUMMARY) {
      const fs = await import("node:fs");
      fs.appendFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        `- **Probe B (S2.3):** interpretationVersion=${String(chartJson.interpretationVersion)}, count=${interpretationsB.length} (PlanetInSign=${planetInSignItemsB.length}, degraded/no-birth-time)\n`,
      );
    }

    await page.waitForURL(/\/app\/charts\/[0-9a-fA-F-]+/);
    await expect(
      page.getByRole("heading", { name: "Lá số sinh", level: 1 }),
    ).toBeVisible();
  });

  test("S2.4: Verify degraded viewer notice and clean UI state", async () => {
    await expect(
      page.getByText("Dữ liệu Nhà và các góc chưa khả dụng"),
    ).toBeVisible();

    const pageText = await page.innerText("body");
    expect(pageText).not.toContain("NaN");
    expect(pageText).not.toContain("undefined");

    const wheelFigure = page.getByTestId("chart-wheel");
    await expect(wheelFigure).toBeVisible();
    const planetBtns = wheelFigure.getByRole("button", { name: /^Chọn / });
    expect(await planetBtns.count()).toBeGreaterThan(0);
  });

  test("S2.5: Verify PlanetTable rendered without houses and HouseTable absent", async () => {
    await expect(
      page.getByRole("heading", { name: "Vị trí hành tinh" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Nhà" }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Cusp (độ)" }),
    ).not.toBeVisible();
  });

  test("S2.6: Verify selection interaction remains functional", async () => {
    const wheelFigure = page.getByTestId("chart-wheel");
    const firstPlanetBtn = wheelFigure
      .getByRole("button", { name: /^Chọn / })
      .first();
    await firstPlanetBtn.click();

    await expect(firstPlanetBtn).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("heading", { name: "Chi tiết đang chọn" }),
    ).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(firstPlanetBtn).toHaveAttribute("aria-pressed", "false");
  });

  test("S2.7: Verify 0 unhandled errors throughout Scenario 2", async () => {
    errorObserver.assertClean();
  });
});
