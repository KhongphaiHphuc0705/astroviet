import { screen } from "@testing-library/react";
import { HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { chartFull, chartNoHouses } from "@features/chart/api/mocks/fixtures";
import { mockGetChart } from "@features/chart/api/mocks/handlers";
import * as reportErrorModule from "@shared/lib/report-error";
import { server } from "@test/msw-server";
import { renderWithProviders } from "@test/render";

import ChartDetailPage from "./page";

describe("ChartDetailPage interpretation integration", () => {
  afterEach(() => vi.restoreAllMocks());

  function renderPage() {
    return renderWithProviders(
      <Routes>
        <Route path="/app/charts/:chartId" element={<ChartDetailPage />} />
      </Routes>,
      { initialEntries: [`/app/charts/${chartFull.id}`] },
    );
  }

  it("passes the built model into the ready viewer", async () => {
    server.use(mockGetChart(() => HttpResponse.json(chartFull)));
    renderPage();
    expect(
      await screen.findByRole("region", { name: "Diễn giải" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Có \d+ diễn giải cho lá số này/),
    ).toBeInTheDocument();
  });

  it("does not report degraded house-data issues", async () => {
    const report = vi
      .spyOn(reportErrorModule, "reportError")
      .mockImplementation(() => {});
    server.use(
      mockGetChart(() =>
        HttpResponse.json({ ...chartNoHouses, id: chartFull.id }),
      ),
    );
    renderPage();
    expect(
      await screen.findByRole("region", { name: "Diễn giải" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Dữ liệu Nhà và một số góc/)).toBeInTheDocument();
    expect(report).not.toHaveBeenCalled();
  });

  it("reports malformed interpretation data once per loaded model", async () => {
    const report = vi
      .spyOn(reportErrorModule, "reportError")
      .mockImplementation(() => {});
    server.use(
      mockGetChart(() =>
        HttpResponse.json({ ...chartFull, interpretations: null }),
      ),
    );
    const { rerender } = renderPage();
    expect(
      await screen.findByRole("region", { name: "Diễn giải" }),
    ).toBeInTheDocument();
    expect(report).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("ENTRY_MALFORMED"),
      }),
      "interpretation-model",
    );
    rerender(
      <Routes>
        <Route path="/app/charts/:chartId" element={<ChartDetailPage />} />
      </Routes>,
    );
    expect(report).toHaveBeenCalledTimes(1);
  });
});
