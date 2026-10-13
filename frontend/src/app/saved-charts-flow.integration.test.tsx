import { QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { routesConfig } from "@app/router";
import { mockBirthProfile } from "@features/birth-profile/api/mocks/handlers";
import { chartFull } from "@features/chart/api/mocks/fixtures";
import type {
  ChartResponse,
  ChartSummary,
  HouseSystem,
} from "@features/chart/api/types";
import { createQueryClient } from "@shared/api/queryClient";
import { useAuthStore } from "@shared/stores/authStore";
import { useUiStore } from "@shared/stores/uiStore";
import { server } from "@test/msw-server";

describe("Saved Charts Flow Integration Tests (IT-1, IT-2, IT-3)", () => {
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
    useUiStore.setState({ mobileDrawerOpen: false, sidebarCollapsed: false });
  });

  it("IT-1: /app/charts (1 chart) -> profiles nav -> calculate dialog -> submit (POST 201) -> viewer -> charts nav -> displays 2 charts without reload", async () => {
    const user = userEvent.setup();
    const queryClient = createQueryClient();

    const testProfile = mockBirthProfile({
      id: "550e8400-e29b-41d4-a716-446655440000",
      fullName: "Nguyễn Văn A",
      label: "Hồ sơ A",
    });

    const initialChartId = "a9d7dcb2-68ed-4b67-b6ee-c62690009f24";
    const initialChartSummary: ChartSummary = {
      id: initialChartId,
      birthProfileId: testProfile.id,
      birthProfileLabel: null,
      houseSystem: "Placidus",
      calculatedAt: "2026-10-10T08:00:00.000Z",
    };
    const initialChartFull: ChartResponse = {
      ...chartFull,
      id: initialChartId,
      houseSystem: "Placidus",
      calculatedAt: "2026-10-10T08:00:00.000Z",
    };

    const newChartId = "b9d7dcb2-68ed-4b67-b6ee-c62690009f99";
    const newChartSummary: ChartSummary = {
      id: newChartId,
      birthProfileId: testProfile.id,
      birthProfileLabel: null,
      houseSystem: "WholeSign",
      calculatedAt: "2026-10-12T10:00:00.000Z",
    };
    const newChartFull: ChartResponse = {
      ...chartFull,
      id: newChartId,
      houseSystem: "WholeSign",
      calculatedAt: "2026-10-12T10:00:00.000Z",
    };

    const chartsList: ChartSummary[] = [initialChartSummary];
    const chartsMap = new Map<string, ChartResponse>([
      [initialChartId, initialChartFull],
    ]);
    let chartsGetCount = 0;

    server.use(
      http.get("*/api/v1/birth-profiles", ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get("page") ?? "1");
        const pageSize = Number(url.searchParams.get("pageSize") ?? "20");
        return HttpResponse.json({
          items: [testProfile],
          total: 1,
          page,
          pageSize,
        });
      }),
      http.get("*/api/v1/charts", ({ request }) => {
        chartsGetCount++;
        const url = new URL(request.url);
        const page = Number(url.searchParams.get("page") ?? "1");
        const pageSize = Number(url.searchParams.get("pageSize") ?? "12");
        return HttpResponse.json({
          items: chartsList.slice((page - 1) * pageSize, page * pageSize),
          total: chartsList.length,
          page,
          pageSize,
        });
      }),
      http.post("*/api/v1/charts/natal", async ({ request }) => {
        const body = (await request.json()) as {
          birthProfileId: string;
          houseSystem: HouseSystem;
        };
        chartsList.unshift(newChartSummary);
        chartsMap.set(newChartId, {
          ...newChartFull,
          houseSystem: body.houseSystem || "WholeSign",
        });
        return HttpResponse.json(
          { ...newChartFull, houseSystem: body.houseSystem || "WholeSign" },
          { status: 201 },
        );
      }),
      http.get("*/api/v1/charts/:id", ({ params }) => {
        const found = chartsMap.get(params.id as string);
        if (!found) {
          return HttpResponse.json(
            { status: 404, errorCode: "RESOURCE_NOT_FOUND" },
            { status: 404 },
          );
        }
        return HttpResponse.json(found);
      }),
    );

    const router = createMemoryRouter(routesConfig, {
      initialEntries: ["/app/charts"],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    // 1. Initial list loads with 1 chart
    expect(
      await screen.findByRole(
        "heading",
        { name: "Lá số của tôi" },
        { timeout: 10000 },
      ),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Nguyễn Văn A" }),
    ).toBeInTheDocument();
    const initialLinks = screen.getAllByRole("link", { name: /xem lá số/i });
    expect(initialLinks).toHaveLength(1);
    expect(initialLinks[0]).toHaveAttribute(
      "href",
      `/app/charts/${initialChartId}`,
    );
    expect(chartsGetCount).toBe(1);

    // 2. Navigate to profiles via desktop nav
    const desktopNav = screen.getByRole("navigation", {
      name: "Điều hướng chính",
    });
    const profilesLink = within(desktopNav).getByRole("link", {
      name: /hồ sơ sinh/i,
    });
    await user.click(profilesLink);

    // 3. Profiles page renders, open calculate dialog
    expect(
      await screen.findByRole(
        "heading",
        { name: "Hồ sơ sinh của tôi" },
        { timeout: 10000 },
      ),
    ).toBeInTheDocument();
    const calcBtn = await screen.findByRole("button", {
      name: /tính lá số cho hồ sơ/i,
    });
    await user.click(calcBtn);

    // 4. Select Whole Sign and submit
    expect(
      await screen.findByRole(
        "dialog",
        { name: "Tính lá số" },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
    const wholeSignRadio = screen.getByRole("radio", { name: /whole sign/i });
    await user.click(wholeSignRadio);
    const submitBtn = screen.getByRole("button", { name: /^tính lá số$/i });
    await user.click(submitBtn);

    // 5. Shell viewer renders with new chart
    expect(
      await screen.findByRole(
        "heading",
        { name: "Lá số sinh" },
        { timeout: 10000 },
      ),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/app/charts/${newChartId}`);

    // 6. Navigate back to saved charts via desktop nav
    const desktopNavAfter = screen.getByRole("navigation", {
      name: "Điều hướng chính",
    });
    const chartsLink = within(desktopNavAfter).getByRole("link", {
      name: /lá số của tôi/i,
    });
    await user.click(chartsLink);

    // 7. Verify list renders 2 items without page reload, newest first
    expect(
      await screen.findByRole(
        "heading",
        { name: "Lá số của tôi" },
        { timeout: 10000 },
      ),
    ).toBeInTheDocument();
    const updatedLinks = await screen.findAllByRole("link", {
      name: /xem lá số/i,
    });
    expect(updatedLinks).toHaveLength(2);
    expect(updatedLinks[0]).toHaveAttribute(
      "href",
      `/app/charts/${newChartId}`,
    );
    expect(updatedLinks[1]).toHaveAttribute(
      "href",
      `/app/charts/${initialChartId}`,
    );
    expect(chartsGetCount).toBe(2);
  });

  it("IT-2: starts at /app/profiles without viewing charts first -> calculates chart -> navigates to /app/charts -> displays new chart", async () => {
    const user = userEvent.setup();
    const queryClient = createQueryClient();

    const testProfile = mockBirthProfile({
      id: "550e8400-e29b-41d4-a716-446655440000",
      fullName: "Trần Thị B",
      label: "Hồ sơ B",
    });

    const newChartId = "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c";
    const newChartSummary: ChartSummary = {
      id: newChartId,
      birthProfileId: testProfile.id,
      birthProfileLabel: null,
      houseSystem: "Placidus",
      calculatedAt: "2026-10-12T10:00:00.000Z",
    };
    const newChartFull: ChartResponse = {
      ...chartFull,
      id: newChartId,
      houseSystem: "Placidus",
      calculatedAt: "2026-10-12T10:00:00.000Z",
    };

    const chartsList: ChartSummary[] = [];
    const chartsMap = new Map<string, ChartResponse>();
    let chartsGetCount = 0;

    server.use(
      http.get("*/api/v1/birth-profiles", ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get("page") ?? "1");
        const pageSize = Number(url.searchParams.get("pageSize") ?? "20");
        return HttpResponse.json({
          items: [testProfile],
          total: 1,
          page,
          pageSize,
        });
      }),
      http.get("*/api/v1/charts", ({ request }) => {
        chartsGetCount++;
        const url = new URL(request.url);
        const page = Number(url.searchParams.get("page") ?? "1");
        const pageSize = Number(url.searchParams.get("pageSize") ?? "12");
        return HttpResponse.json({
          items: chartsList.slice((page - 1) * pageSize, page * pageSize),
          total: chartsList.length,
          page,
          pageSize,
        });
      }),
      http.post("*/api/v1/charts/natal", async () => {
        chartsList.unshift(newChartSummary);
        chartsMap.set(newChartId, newChartFull);
        return HttpResponse.json(newChartFull, { status: 201 });
      }),
      http.get("*/api/v1/charts/:id", ({ params }) => {
        const found = chartsMap.get(params.id as string);
        if (!found) {
          return HttpResponse.json(
            { status: 404, errorCode: "RESOURCE_NOT_FOUND" },
            { status: 404 },
          );
        }
        return HttpResponse.json(found);
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

    // 1. Initial page is profiles
    expect(
      await screen.findByRole(
        "heading",
        { name: "Hồ sơ sinh của tôi" },
        { timeout: 10000 },
      ),
    ).toBeInTheDocument();

    // 2. Click calculate chart button
    const calcBtn = await screen.findByRole("button", {
      name: /tính lá số cho hồ sơ/i,
    });
    await user.click(calcBtn);

    // 3. Submit dialog
    expect(
      await screen.findByRole(
        "dialog",
        { name: "Tính lá số" },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
    const submitBtn = screen.getByRole("button", { name: /^tính lá số$/i });
    await user.click(submitBtn);

    // 4. Viewer renders
    expect(
      await screen.findByRole(
        "heading",
        { name: "Lá số sinh" },
        { timeout: 10000 },
      ),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/app/charts/${newChartId}`);

    // 5. Navigate to saved charts via desktop nav
    const desktopNav = screen.getByRole("navigation", {
      name: "Điều hướng chính",
    });
    const chartsLink = within(desktopNav).getByRole("link", {
      name: /lá số của tôi/i,
    });
    await user.click(chartsLink);

    // 6. Charts list loads fresh and displays newly created chart
    expect(
      await screen.findByRole(
        "heading",
        { name: "Lá số của tôi" },
        { timeout: 10000 },
      ),
    ).toBeInTheDocument();
    const links = await screen.findAllByRole("link", { name: /xem lá số/i });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", `/app/charts/${newChartId}`);
    expect(chartsGetCount).toBe(1);
  });

  it("IT-3: from /app/charts -> clicks 'Xem lá số' -> viewer -> Back -> renders immediately from cache without skeleton, refetches in background", async () => {
    const user = userEvent.setup();
    const queryClient = createQueryClient();

    const testProfile = mockBirthProfile({
      id: "550e8400-e29b-41d4-a716-446655440000",
      fullName: "Lê Văn C",
      label: "Hồ sơ C",
    });

    const chartId = "a9d7dcb2-68ed-4b67-b6ee-c62690009f24";
    const chartSummaryItem: ChartSummary = {
      id: chartId,
      birthProfileId: testProfile.id,
      birthProfileLabel: null,
      houseSystem: "Placidus",
      calculatedAt: "2026-10-10T08:00:00.000Z",
    };
    const chartDetailItem: ChartResponse = {
      ...chartFull,
      id: chartId,
      houseSystem: "Placidus",
      calculatedAt: "2026-10-10T08:00:00.000Z",
    };

    let chartsGetCount = 0;

    server.use(
      http.get("*/api/v1/birth-profiles", ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get("page") ?? "1");
        const pageSize = Number(url.searchParams.get("pageSize") ?? "20");
        return HttpResponse.json({
          items: [testProfile],
          total: 1,
          page,
          pageSize,
        });
      }),
      http.get("*/api/v1/charts", () => {
        chartsGetCount++;
        return HttpResponse.json({
          items: [chartSummaryItem],
          total: 1,
          page: 1,
          pageSize: 12,
        });
      }),
      http.get("*/api/v1/charts/:id", () => {
        return HttpResponse.json(chartDetailItem);
      }),
    );

    const router = createMemoryRouter(routesConfig, {
      initialEntries: ["/app/charts"],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    // 1. Chart list renders
    expect(
      await screen.findByRole(
        "heading",
        { name: "Lá số của tôi" },
        { timeout: 10000 },
      ),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Lê Văn C" }),
    ).toBeInTheDocument();
    const viewBtn = screen.getByRole("link", { name: /xem lá số/i });
    expect(chartsGetCount).toBe(1);

    // 2. Click "Xem lá số"
    await user.click(viewBtn);

    // 3. Viewer renders
    expect(
      await screen.findByRole(
        "heading",
        { name: "Lá số sinh" },
        { timeout: 10000 },
      ),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/app/charts/${chartId}`);

    // 4. Navigate back (simulating browser Back button)
    await act(async () => {
      await router.navigate(-1);
    });

    // 5. Immediately rendered from cache without skeleton
    expect(router.state.location.pathname).toBe("/app/charts");
    expect(
      await screen.findByRole(
        "heading",
        { name: "Lá số của tôi" },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Lê Văn C" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /xem lá số/i }),
    ).toBeInTheDocument();

    // 6. Background refetch finishes
    await waitFor(() => {
      expect(chartsGetCount).toBe(2);
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Lê Văn C" }),
    ).toBeInTheDocument();
  });
});
