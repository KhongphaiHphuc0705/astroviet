import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

import { ThemeProvider } from "@app/providers/ThemeProvider";
import { chartFull, chartNoHouses } from "@features/chart/api/mocks/fixtures";
import {
  chartForbidden,
  chartNotFound,
  getChartSuccess,
  mockGetChart,
} from "@features/chart/api/mocks/handlers";
import { createQueryClient } from "@shared/api/queryClient";
import * as reportErrorModule from "@shared/lib/report-error";
import { server } from "@test/msw-server";
import { renderWithProviders } from "@test/render";

import ChartDetailPage from "./page";

describe("ChartDetailPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderPage = (chartId: string) => {
    return renderWithProviders(
      <Routes>
        <Route path="/app/charts/:chartId" element={<ChartDetailPage />} />
      </Routes>,
      { initialEntries: [`/app/charts/${chartId}`] },
    );
  };

  describe("Group S: States & Routing (F4-M3.3)", () => {
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
        screen.getByText(
          "Lá số này không tồn tại hoặc bạn không có quyền xem.",
        ),
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
        screen.getByText(
          "Lá số này không tồn tại hoặc bạn không có quyền xem.",
        ),
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
        screen.getByText(
          "Lá số này không tồn tại hoặc bạn không có quyền xem.",
        ),
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

      expect(
        await screen.findByTestId("chart-viewer-shell"),
      ).toBeInTheDocument();
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
      expect(
        screen.getByRole("button", { name: "Thử lại" }),
      ).toBeInTheDocument();
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

      expect(
        await screen.findByTestId("chart-viewer-shell"),
      ).toBeInTheDocument();

      // Trigger background refetch that fails
      try {
        await testQueryClient.refetchQueries();
      } catch {
        // Expected refetch error caught
      }

      // Shell remains displayed and error empty state is not shown
      expect(screen.getByTestId("chart-viewer-shell")).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "Không thể tải lá số" }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Group V: View Model & Shell Integration (F4-M3.4)", () => {
    it("V1: renders chartFull with h1, metadata, engineVersion, placeholder and without house notice", async () => {
      server.use(getChartSuccess(chartFull));

      renderPage(chartFull.id);

      expect(
        await screen.findByTestId("chart-viewer-shell"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Lá số sinh", level: 1 }),
      ).toBeInTheDocument();
      expect(screen.getByText("Placidus")).toBeInTheDocument();
      expect(screen.getByText(chartFull.engineVersion)).toBeInTheDocument();

      const timeElement = screen.getByText((_, element) => {
        return (
          element?.tagName.toLowerCase() === "time" &&
          element.getAttribute("dateTime") === chartFull.calculatedAt
        );
      });
      expect(timeElement).toBeInTheDocument();

      expect(
        screen.getByTestId("chart-visualization-placeholder"),
      ).toBeInTheDocument();
      expect(
        screen.queryByText("Dữ liệu Nhà và các góc chưa khả dụng"),
      ).not.toBeInTheDocument();
    });

    it("V2: renders chartNoHouses with HouseDataNotice, without alert error role and without asserting birth time cause", async () => {
      server.use(getChartSuccess(chartNoHouses));

      renderPage(chartNoHouses.id);

      expect(
        await screen.findByTestId("chart-viewer-shell"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Dữ liệu Nhà và các góc chưa khả dụng"),
      ).toBeInTheDocument();
      // Should be status role, not alert role
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();

      // Copy should not assert that the profile definitely lacks birth time
      expect(
        screen.queryByText(/Hồ sơ này chưa có giờ sinh/i),
      ).not.toBeInTheDocument();
      expect(
        screen.getByTestId("chart-visualization-placeholder"),
      ).toBeInTheDocument();
    });

    it("V3: appends backend cause message when HOUSE_SYSTEM_NOT_CONVERGING warning exists", async () => {
      const chartWithWarning = {
        ...chartNoHouses,
        warnings: [
          {
            code: "HOUSE_SYSTEM_NOT_CONVERGING",
            severity: "warning" as const,
            message: "House system failed to converge",
          },
        ],
      };
      server.use(getChartSuccess(chartWithWarning));

      renderPage(chartWithWarning.id);

      expect(
        await screen.findByText(
          /Không tính được chính xác hệ nhà tại vị trí này\./,
        ),
      ).toBeInTheDocument();
    });

    it("V4: handles structural ChartViewModelError (e.g. planets: null) with invalid-data state, reports error once, and refetches upon retry", async () => {
      const reportErrorSpy = vi.spyOn(reportErrorModule, "reportError");
      let callCount = 0;

      server.use(
        mockGetChart(() => {
          callCount++;
          if (callCount === 1) {
            // Structural violation: planets is null
            return HttpResponse.json({
              ...chartFull,
              planets: null,
            });
          }
          return HttpResponse.json(chartFull);
        }),
      );

      renderPage(chartFull.id);

      expect(
        await screen.findByRole("heading", {
          name: "Dữ liệu lá số không hợp lệ",
          level: 3,
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Lá số được tải về nhưng không thể hiển thị. Vui lòng thử lại sau.",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Về danh sách hồ sơ" }),
      ).toBeInTheDocument();

      // reportError called once with context chart-view-model
      expect(reportErrorSpy).toHaveBeenCalledTimes(1);
      expect(reportErrorSpy).toHaveBeenCalledWith(
        expect.any(Error),
        "chart-view-model",
      );

      // Retry re-fetches
      const user = userEvent.setup();
      const retryBtn = screen.getByRole("button", { name: "Thử lại" });
      await user.click(retryBtn);

      expect(
        await screen.findByTestId("chart-viewer-shell"),
      ).toBeInTheDocument();
    });

    it("V5: renders Shell cleanly when interpretations are null or malformed", async () => {
      const chartCorruptInterp = {
        ...chartFull,
        interpretations: null,
      };
      server.use(mockGetChart(() => HttpResponse.json(chartCorruptInterp)));

      renderPage(chartCorruptInterp.id);

      expect(
        await screen.findByTestId("chart-viewer-shell"),
      ).toBeInTheDocument();
    });

    it("V6: renders Shell cleanly on unknown planet issue and does not report issues to console.error", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const chartUnknownPlanet = {
        ...chartFull,
        planets: [
          ...chartFull.planets,
          {
            name: "UnknownExoplanet",
            longitude: 120.5,
            sign: "Cancer",
            degreeInSign: 0.5,
            isRetrograde: false,
            house: 1,
          },
        ],
      };
      server.use(mockGetChart(() => HttpResponse.json(chartUnknownPlanet)));

      renderPage(chartUnknownPlanet.id);

      expect(
        await screen.findByTestId("chart-viewer-shell"),
      ).toBeInTheDocument();
      // issues are diagnostic only, not reported as errors
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("V7: displays warning alert when partialData is true due to missing core body", async () => {
      // Remove Pluto to trigger CORE_BODY_MISSING -> partialData = true
      const chartMissingCore = {
        ...chartFull,
        planets: chartFull.planets.filter((p) => p.name !== "Pluto"),
      };
      server.use(getChartSuccess(chartMissingCore));

      renderPage(chartMissingCore.id);

      expect(
        await screen.findByText("Dữ liệu chưa đầy đủ"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Một số dữ liệu của lá số chưa thể hiển thị đầy đủ."),
      ).toBeInTheDocument();
    });

    it("V8: does not display birth profile name in viewer (FG-01 compliance)", async () => {
      server.use(getChartSuccess(chartFull));

      renderPage(chartFull.id);

      expect(
        await screen.findByTestId("chart-viewer-shell"),
      ).toBeInTheDocument();
      expect(screen.queryByText("Hồ sơ sinh của tôi")).not.toBeInTheDocument();
      expect(screen.queryByText("Nguyễn Văn A")).not.toBeInTheDocument();
    });

    it("V9: passes axe accessibility check in ready state", async () => {
      server.use(getChartSuccess(chartFull));

      const { container } = renderPage(chartFull.id);

      expect(
        await screen.findByTestId("chart-viewer-shell"),
      ).toBeInTheDocument();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("Group L: Page Lifecycle, Title & Focus (F4-M3.4)", () => {
    it("L1: sets document.title and restores previous title on unmount", async () => {
      document.title = "Trang trước đó";
      server.use(getChartSuccess(chartFull));

      const { unmount } = renderPage(chartFull.id);

      expect(document.title).toBe("Lá số sinh — AstroViet");

      unmount();

      expect(document.title).toBe("Trang trước đó");
    });

    it("L2: shifts focus to h1 heading once chart data is ready", async () => {
      server.use(getChartSuccess(chartFull));

      renderPage(chartFull.id);

      expect(
        await screen.findByTestId("chart-viewer-shell"),
      ).toBeInTheDocument();
      const heading = screen.getByRole("heading", {
        name: "Lá số sinh",
        level: 1,
      });
      expect(heading).toHaveFocus();
    });

    it("L3: does not steal focus away when background refetch occurs", async () => {
      server.use(getChartSuccess(chartFull));

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

      expect(
        await screen.findByTestId("chart-viewer-shell"),
      ).toBeInTheDocument();

      const backLink = screen.getByRole("link", { name: "← Hồ sơ sinh" });
      backLink.focus();
      expect(backLink).toHaveFocus();

      // Trigger background refetch
      await testQueryClient.refetchQueries();

      // Focus should remain on backLink
      expect(backLink).toHaveFocus();
    });

    it("L4: focuses h1 in error state and refocuses h1 after retry succeeds", async () => {
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

      const heading = screen.getByRole("heading", {
        name: "Lá số sinh",
        level: 1,
      });

      expect(
        await screen.findByRole("heading", {
          name: "Không thể kết nối",
          level: 3,
        }),
      ).toBeInTheDocument();
      expect(heading).toHaveFocus();

      const user = userEvent.setup();
      const retryBtn = screen.getByRole("button", { name: "Thử lại" });
      await user.click(retryBtn);

      expect(
        await screen.findByTestId("chart-viewer-shell"),
      ).toBeInTheDocument();
      expect(heading).toHaveFocus();
    });
  });
});
