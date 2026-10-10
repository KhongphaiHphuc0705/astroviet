import { http, HttpResponse, type RequestHandler } from "msw";

import type { ChartResponse, ListChartsResponse } from "../types";

import { chartFull, chartSummaryFixtures } from "./fixtures";

export function problemDetails(status: number, errorCode: string) {
  return HttpResponse.json(
    { status, errorCode },
    { status, headers: { "Content-Type": "application/problem+json" } },
  );
}

export function mockCreateNatalChart(
  resolver: Parameters<typeof http.post>[1],
) {
  return http.post("*/api/v1/charts/natal", resolver);
}

export function mockGetChart(resolver: Parameters<typeof http.get>[1]) {
  return http.get("*/api/v1/charts/:id", resolver);
}

export function mockListCharts(resolver: Parameters<typeof http.get>[1]) {
  return http.get("*/api/v1/charts", resolver);
}

export function createNatalChartSuccess(
  chart: ChartResponse = chartFull,
): RequestHandler {
  return mockCreateNatalChart(() => HttpResponse.json(chart, { status: 201 }));
}

export function getChartSuccess(
  chart: ChartResponse = chartFull,
): RequestHandler {
  return mockGetChart(() => HttpResponse.json(chart, { status: 200 }));
}

export function listChartsSuccess(
  overrides?: Partial<ListChartsResponse>,
): RequestHandler {
  const response: ListChartsResponse = {
    items: chartSummaryFixtures,
    total: chartSummaryFixtures.length,
    page: 1,
    pageSize: 20,
    ...overrides,
  };
  return mockListCharts(() => HttpResponse.json(response, { status: 200 }));
}

export function chartNotFound(
  mockFn: typeof mockGetChart = mockGetChart,
): RequestHandler {
  return mockFn(() => problemDetails(404, "RESOURCE_NOT_FOUND"));
}

export function chartForbidden(
  mockFn: typeof mockGetChart = mockGetChart,
): RequestHandler {
  return mockFn(() => problemDetails(403, "FORBIDDEN"));
}

export function chartMalformedRequest(
  mockFn: typeof mockGetChart = mockGetChart,
): RequestHandler {
  return mockFn(() => problemDetails(400, "MALFORMED_REQUEST"));
}

export function chartDomainError(
  mockFn: typeof mockCreateNatalChart,
  errorCode: string,
): RequestHandler {
  return mockFn(() => problemDetails(422, errorCode));
}
