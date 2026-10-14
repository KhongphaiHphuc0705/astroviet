import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { routesConfig } from "@app/router";
import { listBirthProfilesSuccess } from "@features/birth-profile/api/mocks/handlers";
import { chartFull } from "@features/chart/api/mocks/fixtures";
import { createQueryClient } from "@shared/api/queryClient";
import { useAuthStore } from "@shared/stores/authStore";
import { server } from "@test/msw-server";

describe("Chart Flow Integration Tests (I1 - I3)", () => {
  beforeEach(() => {
    useAuthStore.setState({
      status: "authenticated",
      accessToken: "mock-access-token",
      user: {
        id: "user-123",
        email: "tester@astroviet.com",
        displayName: "Tester",
        role: "user",
        createdAt: "2026-01-01T00:00:00Z",
      },
    });
  });

  it("I1: happy path across routes: /app/profiles -> dialog -> Whole Sign -> 201 -> Shell without GET", async () => {
    const user = userEvent.setup();
    const queryClient = createQueryClient();

    server.use(
      listBirthProfilesSuccess(),
      http.post("*/api/v1/charts/natal", async ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("save")).toBe("true");

        const body = (await request.json()) as {
          birthProfileId: string;
          houseSystem: string;
          includeOptionalPoints: string[];
        };
        expect(body.houseSystem).toBe("WholeSign");

        return HttpResponse.json(
          { ...chartFull, houseSystem: "WholeSign" },
          { status: 201 },
        );
      }),
    );

    const router = createMemoryRouter(routesConfig, {
      initialEntries: ["/app/profiles"],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    // 1. Wait for profile card and click "Tính lá số"
    const calcBtn = await screen.findByRole(
      "button",
      {
        name: /tính lá số cho hồ sơ/i,
      },
      { timeout: 10000 },
    );
    await user.click(calcBtn);

    // 2. Dialog appears, select "Whole Sign"
    expect(
      await screen.findByRole(
        "dialog",
        { name: "Tính lá số" },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
    const wholeSignRadio = screen.getByRole("radio", { name: /whole sign/i });
    await user.click(wholeSignRadio);

    // 3. Submit calculation
    const submitBtn = screen.getByRole("button", { name: /^tính lá số$/i });
    await user.click(submitBtn);

    // 4. Verify navigation and Shell renders with "Whole Sign"
    expect(
      await screen.findByRole(
        "heading",
        { name: "Lá số sinh" },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Whole Sign").length).toBeGreaterThanOrEqual(1);
    expect(router.state.location.pathname).toBe(`/app/charts/${chartFull.id}`);
  });

  it("I2: error path: POST 422 INVALID_DATETIME -> Alert -> remains on profiles -> retry 201 -> Shell", async () => {
    const user = userEvent.setup();
    const queryClient = createQueryClient();

    let attempts = 0;
    server.use(
      listBirthProfilesSuccess(),
      http.post("*/api/v1/charts/natal", () => {
        attempts++;
        if (attempts === 1) {
          return HttpResponse.json(
            {
              status: 422,
              errorCode: "INVALID_DATETIME",
              title: "Invalid birth datetime",
            },
            {
              status: 422,
              headers: { "Content-Type": "application/problem+json" },
            },
          );
        }
        return HttpResponse.json(chartFull, { status: 201 });
      }),
    );

    const router = createMemoryRouter(routesConfig, {
      initialEntries: ["/app/profiles"],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    // 1. Open dialog
    const calcBtn = await screen.findByRole(
      "button",
      {
        name: /tính lá số cho hồ sơ/i,
      },
      { timeout: 10000 },
    );
    await user.click(calcBtn);

    // 2. Submit initial attempt
    const submitBtn = await screen.findByRole(
      "button",
      {
        name: /^tính lá số$/i,
      },
      { timeout: 5000 },
    );
    await user.click(submitBtn);

    // 3. Alert displays mapped error and remains on profiles
    const alert = await screen.findByRole("alert", undefined, {
      timeout: 5000,
    });
    expect(alert).toHaveTextContent(
      /ngày hoặc giờ sinh của hồ sơ này không thể dùng để tính lá số/i,
    );
    expect(router.state.location.pathname).toBe("/app/profiles");

    // 4. Retry button is displayed and succeeds on second attempt
    const retryBtn = screen.getByRole("button", { name: "Thử lại" });
    await user.click(retryBtn);

    // 5. Successfully navigates to detail page
    expect(
      await screen.findByRole(
        "heading",
        { name: "Lá số sinh" },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/app/charts/${chartFull.id}`);
  });

  it("I3: deep link with cold cache emits GET request exactly once", async () => {
    const queryClient = createQueryClient();
    let getRequestCount = 0;

    server.use(
      http.get("*/api/v1/charts/:id", () => {
        getRequestCount++;
        return HttpResponse.json(chartFull, { status: 200 });
      }),
    );

    const router = createMemoryRouter(routesConfig, {
      initialEntries: [`/app/charts/${chartFull.id}`],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    expect(
      await screen.findByRole(
        "heading",
        { name: "Lá số sinh" },
        { timeout: 10000 },
      ),
    ).toBeInTheDocument();
    const placidusMatches = await screen.findAllByText("Placidus", undefined, {
      timeout: 5000,
    });
    expect(placidusMatches.length).toBeGreaterThanOrEqual(1);
    expect(getRequestCount).toBe(1);
  });
});
