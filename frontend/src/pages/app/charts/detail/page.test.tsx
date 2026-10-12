import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { ThemeProvider } from "@app/providers/ThemeProvider";
import { chartFull } from "@features/chart/api/mocks/fixtures";
import {
  chartForbidden,
  chartNotFound,
  mockGetChart,
} from "@features/chart/api/mocks/handlers";
import { createQueryClient } from "@shared/api/queryClient";
import { server } from "@test/msw-server";
import { renderWithProviders } from "@test/render";

import ChartDetailPage from "./page";

describe("ChartDetailPage (F4-M3.3 Group S: States & Routing)", () => {
  const renderPage = (chartId: string) => {
    return renderWithProviders(
      <Routes>
        <Route path="/app/charts/:chartId" element={<ChartDetailPage />} />
      </Routes>,
      { initialEntries: [`/app/charts/${chartId}`] },
    );
  };

  it("S1: displays ChartViewerSkeleton and h1 heading while loading", () => {
    server.use(
      mockGetChart(async () => {
        return new Promise(() => {}); // never resolves to stay in loading state
      }),
    );

    renderPage(chartFull.id);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Đang tải lá số…")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Lá số sinh", level: 1 }),
    ).toBeInTheDocument();
  });

  it("S2: renders not-found state without emitting network request when chartId is not a valid UUID", async () => {
    let requestCount = 0;
    server.use(
      mockGetChart(() => {
        requestCount++;
        return HttpResponse.json(chartFull);
      }),
    );

    renderPage("not-a-uuid");

    expect(
      await screen.findByRole("heading", {
        name: "Không tìm thấy lá số",
        level: 3,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Lá số này không tồn tại hoặc bạn không có quyền xem."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Về danh sách hồ sơ" }),
    ).toHaveAttribute("href", "/app/profiles");
    expect(
      screen.queryByRole("button", { name: "Thử lại" }),
    ).not.toBeInTheDocument();
    expect(requestCount).toBe(0);
  });

  it("S3: renders neutral not-found state without retry button on 404 RESOURCE_NOT_FOUND", async () => {
    server.use(chartNotFound());

    renderPage(chartFull.id);

    expect(
      await screen.findByRole("heading", {
        name: "Không tìm thấy lá số",
        level: 3,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Lá số này không tồn tại hoặc bạn không có quyền xem."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Về danh sách hồ sơ" }),
    ).toHaveAttribute("href", "/app/profiles");
    expect(
      screen.queryByRole("button", { name: "Thử lại" }),
    ).not.toBeInTheDocument();
  });

  it("S4: renders the same neutral not-found state on 403 FORBIDDEN", async () => {
    server.use(chartForbidden());

    renderPage(chartFull.id);

    expect(
      await screen.findByRole("heading", {
        name: "Không tìm thấy lá số",
        level: 3,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Lá số này không tồn tại hoặc bạn không có quyền xem."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Về danh sách hồ sơ" }),
    ).toHaveAttribute("href", "/app/profiles");
    expect(
      screen.queryByRole("button", { name: "Thử lại" }),
    ).not.toBeInTheDocument();
  });

  it("S5: renders connection error state on network error and succeeds upon clicking retry", async () => {
    let callCount = 0;
    server.use(
      mockGetChart(() => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.error();
        }
        return HttpResponse.json(chartFull);
      }),
    );

    renderPage(chartFull.id);

    expect(
      await screen.findByRole("heading", {
        name: "Không thể kết nối",
        level: 3,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Không thể tải lá số. Vui lòng kiểm tra kết nối mạng và thử lại.",
      ),
    ).toBeInTheDocument();

    const user = userEvent.setup();
    const retryBtn = screen.getByRole("button", { name: "Thử lại" });
    await user.click(retryBtn);

    expect(await screen.findByTestId("chart-ready-view")).toBeInTheDocument();
    expect(screen.getByText(`Lá số: ${chartFull.id}`)).toBeInTheDocument();
  });

  it("S6: renders server error state with mapped message and retry button on 500 error", async () => {
    server.use(
      mockGetChart(() => {
        return HttpResponse.json(
          { errorCode: "INTERNAL_SERVER_ERROR", status: 500 },
          {
            status: 500,
            headers: { "Content-Type": "application/problem+json" },
          },
        );
      }),
    );

    renderPage(chartFull.id);

    expect(
      await screen.findByRole("heading", {
        name: "Không thể tải lá số",
        level: 3,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Đã có lỗi xảy ra, vui lòng thử lại."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });

  it("S7: keeps displaying chart data and does not flash error when background refetch fails", async () => {
    let callCount = 0;
    server.use(
      mockGetChart(() => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json(chartFull);
        }
        return HttpResponse.json(
          { errorCode: "INTERNAL_SERVER_ERROR", status: 500 },
          {
            status: 500,
            headers: { "Content-Type": "application/problem+json" },
          },
        );
      }),
    );

    const testQueryClient = createQueryClient();
    render(
      <ThemeProvider>
        <QueryClientProvider client={testQueryClient}>
          <MemoryRouter initialEntries={[`/app/charts/${chartFull.id}`]}>
            <Routes>
              <Route
                path="/app/charts/:chartId"
                element={<ChartDetailPage />}
              />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </ThemeProvider>,
    );

    expect(await screen.findByTestId("chart-ready-view")).toBeInTheDocument();

    // Trigger background refetch that fails
    try {
      await testQueryClient.refetchQueries();
    } catch {
      // Expected refetch error caught
    }

    // Ready view remains displayed and error empty state is not shown
    expect(screen.getByTestId("chart-ready-view")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Không thể tải lá số" }),
    ).not.toBeInTheDocument();
  });
});
