import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider } from "@app/providers/ThemeProvider";
import { chartFull } from "@features/chart/api/mocks/fixtures";
import { getChartSuccess } from "@features/chart/api/mocks/handlers";
import { createQueryClient } from "@shared/api/queryClient";
import { server } from "@test/msw-server";

import ChartDetailPage from "./page";

// Mock toChartViewModel specifically in this file to throw unexpected TypeError
vi.mock("@features/chart", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/chart")>();
  return {
    ...actual,
    toChartViewModel: vi.fn(() => {
      throw new TypeError("Unexpected runtime failure");
    }),
  };
});

describe("ChartDetailPage - Unexpected Error Bubble-up (F4-M3.4 U1)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("U1: unexpected non-ChartViewModelError bubbles up to nearest router errorElement instead of being swallowed", async () => {
    // Suppress console.error from React / Router logging unhandled render error
    vi.spyOn(console, "error").mockImplementation(() => {});

    server.use(getChartSuccess(chartFull));

    const testQueryClient = createQueryClient();
    const router = createMemoryRouter(
      [
        {
          path: "/app/charts/:chartId",
          element: <ChartDetailPage />,
          errorElement: (
            <div data-testid="boundary-error-element">
              Lỗi ứng dụng không mong muốn
            </div>
          ),
        },
      ],
      { initialEntries: [`/app/charts/${chartFull.id}`] },
    );

    render(
      <ThemeProvider>
        <QueryClientProvider client={testQueryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </ThemeProvider>,
    );

    expect(
      await screen.findByTestId("boundary-error-element"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Lỗi ứng dụng không mong muốn"),
    ).toBeInTheDocument();

    // Verify it was NOT swallowed into "Dữ liệu lá số không hợp lệ"
    expect(
      screen.queryByText("Dữ liệu lá số không hợp lệ"),
    ).not.toBeInTheDocument();
  });
});
