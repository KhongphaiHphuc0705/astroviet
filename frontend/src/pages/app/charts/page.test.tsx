import { focusManager } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import {
  mockListBirthProfiles,
  mockBirthProfile,
} from "@features/birth-profile/api/mocks/handlers";
import { chartSummaryFixtures } from "@features/chart/api/mocks/fixtures";
import { mockListCharts } from "@features/chart/api/mocks/handlers";
import type {
  ChartSummary,
  HouseSystem,
  ListChartsResponse,
} from "@features/chart/api/types";
import { PROFILE_LABEL_FALLBACKS } from "@features/chart/ui/ChartList";
import { server } from "@test/msw-server";
import { renderWithProviders } from "@test/render";

import ChartListPage from "./page";

describe("ChartListPage", () => {
  const createMockChart = (
    id: string,
    birthProfileId: string | null = "p-1",
    houseSystem: HouseSystem = "Placidus",
  ): ChartSummary => ({
    id,
    birthProfileId,
    birthProfileLabel: null,
    houseSystem,
    calculatedAt: "2026-10-10T09:56:46.004Z",
  });

  it("B1: renders exactly 6 skeleton cards with role='status' when loading", () => {
    server.use(
      mockListCharts(async () => new Promise(() => {})),
      mockListBirthProfiles(() =>
        HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 100 }),
      ),
    );

    renderWithProviders(<ChartListPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Lá số của tôi" }),
    ).toBeInTheDocument();

    const loadingRegion = screen.getByRole("status");
    expect(loadingRegion).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Đang tải danh sách lá số…")).toBeInTheDocument();

    const skeletons = loadingRegion.querySelectorAll(".animate-pulse");
    expect(skeletons).toHaveLength(6);
  });

  it("B2: renders error state on initial failure and retries when clicking 'Thử lại'", async () => {
    let attempts = 0;
    server.use(
      mockListCharts(() => {
        attempts++;
        if (attempts === 1) {
          return new HttpResponse(null, { status: 500 });
        }
        const response: ListChartsResponse = {
          items: [createMockChart("c-1")],
          total: 1,
          page: 1,
          pageSize: 12,
        };
        return HttpResponse.json(response);
      }),
      mockListBirthProfiles(() =>
        HttpResponse.json({
          items: [mockBirthProfile({ id: "p-1", fullName: "Nguyễn Văn A" })],
          total: 1,
          page: 1,
          pageSize: 100,
        }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<ChartListPage />);

    expect(
      await screen.findByText("Không thể tải danh sách lá số"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Đã có lỗi xảy ra khi kết nối tới máy chủ. Vui lòng thử lại sau.",
      ),
    ).toBeInTheDocument();

    const retryButton = screen.getByRole("button", { name: "Thử lại" });
    await user.click(retryButton);

    expect(await screen.findByText("Nguyễn Văn A")).toBeInTheDocument();
  });

  it("B3: renders 'Về trang đầu' button when error occurs on page > 1 and returns to page 1", async () => {
    server.use(
      mockListCharts(({ request }) => {
        const url = new URL(request.url);
        const page = url.searchParams.get("page");
        if (page === "2") {
          return new HttpResponse(null, { status: 500 });
        }
        return HttpResponse.json({
          items: Array.from({ length: 12 }, (_, i) =>
            createMockChart(`c-${i + 1}`),
          ),
          total: 15,
          page: 1,
          pageSize: 12,
        });
      }),
      mockListBirthProfiles(() =>
        HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 100 }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<ChartListPage />);

    const nextButton = await screen.findByRole("button", { name: "Sau" });
    await user.click(nextButton);

    expect(
      await screen.findByText("Không thể tải danh sách lá số"),
    ).toBeInTheDocument();

    const returnFirstPageButton = screen.getByRole("button", {
      name: "Về trang đầu",
    });
    await user.click(returnFirstPageButton);

    expect(await screen.findByText("Trang 1 / 2")).toBeInTheDocument();
  });

  it("B4: renders empty state when total === 0 and links to /app/profiles without waiting for profiles", async () => {
    server.use(
      mockListCharts(() =>
        HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 12 }),
      ),
      mockListBirthProfiles(async () => new Promise(() => {})), // delayed profiles query
    );

    renderWithProviders(<ChartListPage />);

    expect(
      await screen.findByText("Bạn chưa có lá số nào"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Tính lá số từ một hồ sơ sinh để lưu và xem lại tại đây.",
      ),
    ).toBeInTheDocument();

    const link = screen.getByRole("link", { name: "Đến hồ sơ sinh" });
    expect(link).toHaveAttribute("href", "/app/profiles");
  });

  it("B5: renders all items in API order with h1 'Lá số của tôi'", async () => {
    const items = [
      createMockChart("c-1", "p-1"),
      createMockChart("c-2", "p-2"),
    ];

    server.use(
      mockListCharts(() =>
        HttpResponse.json({ items, total: 2, page: 1, pageSize: 12 }),
      ),
      mockListBirthProfiles(() =>
        HttpResponse.json({
          items: [
            mockBirthProfile({ id: "p-1", fullName: "Hồ sơ 1" }),
            mockBirthProfile({ id: "p-2", fullName: "Hồ sơ 2" }),
          ],
          total: 2,
          page: 1,
          pageSize: 100,
        }),
      ),
    );

    renderWithProviders(<ChartListPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Lá số của tôi" }),
    ).toBeInTheDocument();

    expect(await screen.findByText("Hồ sơ 1")).toBeInTheDocument();
    expect(screen.getByText("Hồ sơ 2")).toBeInTheDocument();

    const links = screen.getAllByRole("link", { name: /^Xem lá số:/ });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/app/charts/c-1");
    expect(links[1]).toHaveAttribute("href", "/app/charts/c-2");
  });

  it("B6: requests charts with exact keys {page: 1, pageSize: 12} and no userId/birthProfileId/sortBy", async () => {
    let capturedParams: URLSearchParams | null = null;
    server.use(
      mockListCharts(({ request }) => {
        const url = new URL(request.url);
        capturedParams = url.searchParams;
        return HttpResponse.json({
          items: [],
          total: 0,
          page: 1,
          pageSize: 12,
        });
      }),
      mockListBirthProfiles(() =>
        HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 100 }),
      ),
    );

    renderWithProviders(<ChartListPage />);

    await waitFor(() => expect(capturedParams).not.toBeNull());
    const params = capturedParams!;
    expect(params.get("page")).toBe("1");
    expect(params.get("pageSize")).toBe("12");
    expect(params.get("userId")).toBeNull();
    expect(params.get("user_id")).toBeNull();
    expect(params.get("birthProfileId")).toBeNull();
    expect(params.get("sortBy")).toBeNull();
  });

  it("B7: requests birth profiles with page=1 and pageSize=100", async () => {
    let capturedProfileParams: URLSearchParams | null = null;
    server.use(
      mockListCharts(() =>
        HttpResponse.json({
          items: chartSummaryFixtures,
          total: chartSummaryFixtures.length,
          page: 1,
          pageSize: 12,
        }),
      ),
      mockListBirthProfiles(({ request }) => {
        const url = new URL(request.url);
        capturedProfileParams = url.searchParams;
        return HttpResponse.json({
          items: [],
          total: 0,
          page: 1,
          pageSize: 100,
        });
      }),
    );

    renderWithProviders(<ChartListPage />);

    await waitFor(() => expect(capturedProfileParams).not.toBeNull());
    const profileParams = capturedProfileParams!;
    expect(profileParams.get("page")).toBe("1");
    expect(profileParams.get("pageSize")).toBe("100");
  });

  it("B8: shows pagination controls when total > pageSize (13) and hides when total <= pageSize (12)", async () => {
    // 1. total = 12 -> no pagination
    server.use(
      mockListCharts(() =>
        HttpResponse.json({
          items: Array.from({ length: 12 }, (_, i) =>
            createMockChart(`c-${i + 1}`),
          ),
          total: 12,
          page: 1,
          pageSize: 12,
        }),
      ),
      mockListBirthProfiles(() =>
        HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 100 }),
      ),
    );

    const { unmount } = renderWithProviders(<ChartListPage />);

    const badges = await screen.findAllByText("Placidus");
    expect(badges.length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("navigation", { name: "Phân trang danh sách lá số" }),
    ).not.toBeInTheDocument();

    unmount();

    // 2. total = 13 -> pagination visible
    server.use(
      mockListCharts(() =>
        HttpResponse.json({
          items: Array.from({ length: 12 }, (_, i) =>
            createMockChart(`c-${i + 1}`),
          ),
          total: 13,
          page: 1,
          pageSize: 12,
        }),
      ),
    );

    renderWithProviders(<ChartListPage />);

    expect(
      await screen.findByRole("navigation", {
        name: "Phân trang danh sách lá số",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Trang 1 / 2")).toBeInTheDocument();
  });

  it("B9 & B11: verifies pagination 'Trước' disabled on page 1, and clicking 'Sau' fetches page 2", async () => {
    server.use(
      mockListCharts(({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get("page") ?? "1");
        return HttpResponse.json({
          items: [createMockChart(`c-page-${page}`)],
          total: 15,
          page,
          pageSize: 12,
        });
      }),
      mockListBirthProfiles(() =>
        HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 100 }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<ChartListPage />);

    const prevButton = await screen.findByRole("button", { name: "Trước" });
    const nextButton = screen.getByRole("button", { name: "Sau" });

    // B11: "Trước" disabled on first page
    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeEnabled();
    expect(screen.getByText("Trang 1 / 2")).toBeInTheDocument();

    // B9: Click "Sau"
    await user.click(nextButton);

    expect(await screen.findByText("Trang 2 / 2")).toBeInTheDocument();
    expect(nextButton).toBeDisabled();
    expect(prevButton).toBeEnabled();
  });

  it("B10: disables pagination buttons while switching page (isPlaceholderData)", async () => {
    let resolvePage2: ((value: unknown) => void) | null = null;
    server.use(
      mockListCharts(({ request }) => {
        const url = new URL(request.url);
        const page = url.searchParams.get("page");
        if (page === "2") {
          return new Promise((resolve) => {
            resolvePage2 = () =>
              resolve(
                HttpResponse.json({
                  items: [createMockChart("c-page-2")],
                  total: 15,
                  page: 2,
                  pageSize: 12,
                }),
              );
          });
        }
        return HttpResponse.json({
          items: [createMockChart("c-page-1")],
          total: 15,
          page: 1,
          pageSize: 12,
        });
      }),
      mockListBirthProfiles(() =>
        HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 100 }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<ChartListPage />);

    const nextButton = await screen.findByRole("button", { name: "Sau" });
    await user.click(nextButton);

    // During transition: old list is still visible, both buttons disabled
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Trước" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Sau" })).toBeDisabled();
    });

    // Resolve page 2
    if (resolvePage2) {
      (resolvePage2 as () => void)();
    }

    expect(await screen.findByText("Trang 2 / 2")).toBeInTheDocument();
  });

  it("B12: displays chart list with 'Không tải được tên hồ sơ' when birth profile query fails with 500", async () => {
    server.use(
      mockListCharts(() =>
        HttpResponse.json({
          items: [createMockChart("c-1", "p-1")],
          total: 1,
          page: 1,
          pageSize: 12,
        }),
      ),
      mockListBirthProfiles(() => new HttpResponse(null, { status: 500 })),
    );

    renderWithProviders(<ChartListPage />);

    expect(
      await screen.findByText(PROFILE_LABEL_FALLBACKS.unavailable),
    ).toBeInTheDocument();

    const link = screen.getByRole("link", {
      name: new RegExp(`Xem lá số: ${PROFILE_LABEL_FALLBACKS.unavailable}`),
    });
    expect(link).toHaveAttribute("href", "/app/charts/c-1");
  });

  it("B13: does not show 'đã xoá' for item with profileId while profile query is loading, but null profileId shows 'đã xoá'", async () => {
    server.use(
      mockListCharts(() =>
        HttpResponse.json({
          items: [
            createMockChart("c-with-id", "p-1"),
            createMockChart("c-null-id", null),
          ],
          total: 2,
          page: 1,
          pageSize: 12,
        }),
      ),
      mockListBirthProfiles(async () => new Promise(() => {})), // delayed
    );

    renderWithProviders(<ChartListPage />);

    // Item with id shows loading label
    expect(
      await screen.findByText(PROFILE_LABEL_FALLBACKS.loading),
    ).toBeInTheDocument();

    // Item with null id immediately shows deleted label
    expect(
      screen.getByText(PROFILE_LABEL_FALLBACKS.deleted),
    ).toBeInTheDocument();
  });

  it("B14: displays fullName when present and label when fullName is null", async () => {
    server.use(
      mockListCharts(() =>
        HttpResponse.json({
          items: [createMockChart("c-1", "p-1"), createMockChart("c-2", "p-2")],
          total: 2,
          page: 1,
          pageSize: 12,
        }),
      ),
      mockListBirthProfiles(() =>
        HttpResponse.json({
          items: [
            mockBirthProfile({
              id: "p-1",
              fullName: "Nguyễn Văn A",
              label: "Nhãn dự phòng",
            }),
            mockBirthProfile({
              id: "p-2",
              fullName: null,
              label: "Nhãn hồ sơ 2",
            }),
          ],
          total: 2,
          page: 1,
          pageSize: 100,
        }),
      ),
    );

    renderWithProviders(<ChartListPage />);

    expect(await screen.findByText("Nguyễn Văn A")).toBeInTheDocument();
    expect(screen.getByText("Nhãn hồ sơ 2")).toBeInTheDocument();
    expect(screen.queryByText("Nhãn dự phòng")).not.toBeInTheDocument();
  });

  it("B15: preserves cached list and shows warning Alert when background refetch fails", async () => {
    let fetchCount = 0;
    server.use(
      mockListCharts(() => {
        fetchCount++;
        if (fetchCount > 1) {
          return new HttpResponse(null, { status: 500 });
        }
        return HttpResponse.json({
          items: [createMockChart("c-1", "p-1")],
          total: 1,
          page: 1,
          pageSize: 12,
        });
      }),
      mockListBirthProfiles(() =>
        HttpResponse.json({
          items: [mockBirthProfile({ id: "p-1", fullName: "Nguyễn Văn A" })],
          total: 1,
          page: 1,
          pageSize: 100,
        }),
      ),
    );

    renderWithProviders(<ChartListPage />);

    expect(await screen.findByText("Nguyễn Văn A")).toBeInTheDocument();

    // Trigger TanStack Query refetch on window focus
    focusManager.setFocused(false);
    focusManager.setFocused(true);

    expect(
      await screen.findByText("Không thể cập nhật danh sách"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Đã xảy ra lỗi khi đồng bộ dữ liệu mới nhất. Bạn đang xem dữ liệu từ bộ nhớ tạm.",
      ),
    ).toBeInTheDocument();
    // Verify cached items are still preserved
    expect(screen.getByText("Nguyễn Văn A")).toBeInTheDocument();
  });

  it("B16: renders out-of-range empty state with 'Về trang cuối' button when items=[] but total>0 and page>1", async () => {
    server.use(
      mockListCharts(({ request }) => {
        const url = new URL(request.url);
        const page = url.searchParams.get("page");
        if (page === "2") {
          return HttpResponse.json({
            items: [],
            total: 5,
            page: 2,
            pageSize: 12,
          });
        }
        return HttpResponse.json({
          items: [createMockChart("c-1")],
          total: 5,
          page: 1,
          pageSize: 12,
        });
      }),
      mockListBirthProfiles(() =>
        HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 100 }),
      ),
    );

    // Initial page load at page 1, but we can test navigating or page 2
    // Let's test with initial page having items and navigating or mock
    const { unmount } = renderWithProviders(<ChartListPage />);
    unmount();

    // Now test directly when page 2 has 0 items
    server.use(
      mockListCharts(({ request }) => {
        const url = new URL(request.url);
        const page = url.searchParams.get("page");
        if (page === "2") {
          return HttpResponse.json({
            items: [],
            total: 13,
            page: 2,
            pageSize: 12,
          });
        }
        return HttpResponse.json({
          items: Array.from({ length: 12 }, (_, i) =>
            createMockChart(`c-${i + 1}`),
          ),
          total: 13,
          page: 1,
          pageSize: 12,
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ChartListPage />);

    const nextButton = await screen.findByRole("button", { name: "Sau" });
    await user.click(nextButton);

    // If page 2 was out of range:
    // Here total=13 and pageSize=12, so page 2 has 1 item in real life, but our mock returned items: []
    expect(
      await screen.findByText("Không còn lá số ở trang này"),
    ).toBeInTheDocument();
    const returnLastPageButton = screen.getByRole("button", {
      name: "Về trang cuối",
    });
    expect(returnLastPageButton).toBeInTheDocument();
  });

  it("B17: renders raw badge text for unusual houseSystem without breaking page", async () => {
    server.use(
      mockListCharts(() =>
        HttpResponse.json({
          items: [createMockChart("c-1", "p-1", "Koch" as HouseSystem)],
          total: 1,
          page: 1,
          pageSize: 12,
        }),
      ),
      mockListBirthProfiles(() =>
        HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 100 }),
      ),
    );

    renderWithProviders(<ChartListPage />);

    expect(await screen.findByText("Koch")).toBeInTheDocument();
    expect(screen.queryByText("Placidus")).not.toBeInTheDocument();
  });

  it("B18: renders stable formatted date and time dateTime attribute across re-renders", async () => {
    const fixedIso = "2026-03-29T10:30:00.000Z";
    server.use(
      mockListCharts(() =>
        HttpResponse.json({
          items: [
            {
              ...createMockChart("c-1", "p-1"),
              calculatedAt: fixedIso,
            },
          ],
          total: 1,
          page: 1,
          pageSize: 12,
        }),
      ),
      mockListBirthProfiles(() =>
        HttpResponse.json({
          items: [
            {
              id: "p-1",
              fullName: "Nguyễn Văn A",
              birthDate: "1990-01-01",
              birthTime: "12:00",
              cityName: "Hà Nội",
              latitude: 21.0285,
              longitude: 105.8542,
              timezone: "Asia/Ho_Chi_Minh",
              createdAt: "2026-01-01T00:00:00.000Z",
              updatedAt: "2026-01-01T00:00:00.000Z",
            },
          ],
          total: 1,
          page: 1,
          pageSize: 100,
        }),
      ),
    );

    const { rerender } = renderWithProviders(<ChartListPage />);

    const timeElement = await screen.findByText(/2026/);
    expect(timeElement.tagName.toLowerCase()).toBe("time");
    expect(timeElement).toHaveAttribute("dateTime", fixedIso);
    const initialText = timeElement.textContent;

    // Rerender and ensure formatCalculatedAt output and dateTime attribute remain stable
    rerender(<ChartListPage />);
    const timeElementAfter = screen.getByText(/2026/);
    expect(timeElementAfter.tagName.toLowerCase()).toBe("time");
    expect(timeElementAfter).toHaveAttribute("dateTime", fixedIso);
    expect(timeElementAfter.textContent).toBe(initialText);
  });
});
