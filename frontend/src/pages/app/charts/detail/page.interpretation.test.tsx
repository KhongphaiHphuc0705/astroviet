import { screen } from "@testing-library/react";
import { HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as chartModule from "@features/chart";
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

  it("PG-05: does not render interpretation panel when chart API fails", async () => {
    vi.spyOn(reportErrorModule, "reportError").mockImplementation(() => {});
    server.use(
      mockGetChart(() =>
        HttpResponse.json(
          { errorCode: "INTERNAL_SERVER_ERROR", status: 500 },
          {
            status: 500,
            headers: { "Content-Type": "application/problem+json" },
          },
        ),
      ),
    );
    renderPage();
    expect(
      await screen.findByRole("heading", {
        name: "Không thể tải lá số",
        level: 3,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Diễn giải" }),
    ).not.toBeInTheDocument();
  });

  it("PG-06: does not render interpretation panel while chart is loading", () => {
    server.use(
      mockGetChart(async () => {
        return new Promise(() => {}); // never resolves
      }),
    );
    renderPage();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Đang tải lá số…")).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Diễn giải" }),
    ).not.toBeInTheDocument();
  });

  it("D5-V01: F-NullEmpty with version null and empty interpretations renders S-03 unpublished alert, preserves F4 tables, and does not report errors", async () => {
    const report = vi
      .spyOn(reportErrorModule, "reportError")
      .mockImplementation(() => {});

    server.use(
      mockGetChart(() =>
        HttpResponse.json({
          ...chartFull,
          interpretationVersion: null,
          interpretations: [],
        }),
      ),
    );

    renderPage();

    const alertText = await screen.findByText(
      "Nội dung diễn giải chưa được phát hành",
    );
    expect(alertText.closest('[role="status"]')).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Vị trí hành tinh" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Nhà và các góc" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Góc chiếu" }),
    ).toBeInTheDocument();

    expect(report).not.toHaveBeenCalled();
  });

  it("D5-V02: F-VerEmpty with version 1.0 and empty interpretations reports defect error once and renders S-08", async () => {
    const report = vi
      .spyOn(reportErrorModule, "reportError")
      .mockImplementation(() => {});

    server.use(
      mockGetChart(() =>
        HttpResponse.json({
          ...chartFull,
          interpretationVersion: "1.0",
          interpretations: [],
        }),
      ),
    );

    renderPage();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "Hiện chưa thể hiển thị diễn giải cho lá số này.",
    );

    expect(report).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("CONTENT_MISSING"),
      }),
      "interpretation-model",
    );
  });

  it("D5-P01: F-MissingOne renders missing item copy for missing part, preserves other parts, and reports CONTENT_MISSING once", async () => {
    const report = vi
      .spyOn(reportErrorModule, "reportError")
      .mockImplementation(() => {});

    const missingOneDto = {
      ...chartFull,
      interpretations: chartFull.interpretations.filter(
        (i) => i.subjectKey !== "Mars_in_Sagittarius",
      ),
    };

    server.use(mockGetChart(() => HttpResponse.json(missingOneDto)));
    renderPage();

    expect(
      await screen.findByRole("region", { name: "Diễn giải" }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Có 20 diễn giải cho lá số này"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Chưa có nội dung cho mục này"),
    ).toBeInTheDocument();

    expect(report).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("CONTENT_MISSING×1"),
      }),
      "interpretation-model",
    );
  });

  it("D5-E02: rerendering with identical payload does not duplicate reportError calls", async () => {
    const report = vi
      .spyOn(reportErrorModule, "reportError")
      .mockImplementation(() => {});

    server.use(
      mockGetChart(() =>
        HttpResponse.json({
          ...chartFull,
          interpretations: [
            ...chartFull.interpretations,
            {
              subjectType: "UnknownSubject",
              subjectKey: "Unknown_Key",
              language: "vi",
              bodyText: "Invalid",
            },
          ],
        }),
      ),
    );

    const { rerender } = renderPage();

    expect(
      await screen.findByRole("region", { name: "Diễn giải" }),
    ).toBeInTheDocument();

    expect(report).toHaveBeenCalledTimes(1);

    rerender(
      <Routes>
        <Route path="/app/charts/:chartId" element={<ChartDetailPage />} />
      </Routes>,
    );

    expect(report).toHaveBeenCalledTimes(1);
  });

  it("D5-E03: F-ModelThrows (H-1) keeps F4 viewer intact, omits interpretation panel, and reports error with interpretation-model-build context", async () => {
    const report = vi
      .spyOn(reportErrorModule, "reportError")
      .mockImplementation(() => {});

    vi.spyOn(chartModule, "buildInterpretationModel").mockImplementationOnce(
      () => {
        throw new Error("Simulated unexpected model failure");
      },
    );

    server.use(mockGetChart(() => HttpResponse.json(chartFull)));
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Vị trí hành tinh" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Lá số sinh" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Nhà và các góc" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Góc chiếu" }),
    ).toBeInTheDocument();

    expect(screen.queryByRole("region", { name: "Diễn giải" })).toBeNull();

    expect(report).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Simulated unexpected model failure",
      }),
      "interpretation-model-build",
    );
  });
});
