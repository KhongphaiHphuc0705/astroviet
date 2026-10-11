import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse } from "msw";
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

import { createQueryClient } from "@shared/api/queryClient";
import { server } from "@test/msw-server";

import { chartFull } from "../../api/mocks/fixtures";
import {
  createNatalChartSuccess,
  mockCreateNatalChart,
  problemDetails,
} from "../../api/mocks/handlers";

import {
  CalculateChartDialog,
  type CalculateChartTarget,
} from "./CalculateChartDialog";

const defaultTarget: CalculateChartTarget = {
  id: "profile-uuid-1",
  displayName: "Nguyễn Văn A",
  isBirthTimeKnown: true,
};

function renderDialog(
  target: CalculateChartTarget = defaultTarget,
  onClose = vi.fn(),
) {
  const queryClient = createQueryClient();
  let capturedChartId: string | undefined;

  function TargetCapture() {
    const { chartId } = useParams();
    capturedChartId = chartId;
    return <div data-testid="chart-detail-target">Chart: {chartId}</div>;
  }

  const result = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/app/profiles"]}>
        <Routes>
          <Route
            path="/app/profiles"
            element={<CalculateChartDialog target={target} onClose={onClose} />}
          />
          <Route path="/app/charts/:chartId" element={<TargetCapture />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return {
    ...result,
    onClose,
    getCapturedChartId: () => capturedChartId,
  };
}

describe("CalculateChartDialog (F4-M3.1 / Group D)", () => {
  beforeEach(() => {
    server.use(createNatalChartSuccess(chartFull));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("D1: opens dialog with title, target displayName in description, and Placidus checked by default", () => {
    renderDialog();

    expect(
      screen.getByRole("heading", { name: "Tính lá số" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Chọn hệ nhà để tính lá số cho hồ sơ “Nguyễn Văn A”\./),
    ).toBeInTheDocument();

    const placidusRadio = screen.getByRole("radio", { name: /Placidus/ });
    const wholeSignRadio = screen.getByRole("radio", { name: /Whole Sign/ });

    expect(placidusRadio).toBeChecked();
    expect(wholeSignRadio).not.toBeChecked();
  });

  it("D2: selecting Whole Sign checks Whole Sign and unchecks Placidus", async () => {
    const user = userEvent.setup();
    renderDialog();

    const placidusRadio = screen.getByRole("radio", { name: /Placidus/ });
    const wholeSignRadio = screen.getByRole("radio", { name: /Whole Sign/ });

    await user.click(wholeSignRadio);

    expect(wholeSignRadio).toBeChecked();
    expect(placidusRadio).not.toBeChecked();
  });

  it("D3: default submit sends POST with save=true, Placidus enum, profileId, and empty optional points", async () => {
    let capturedRequestUrl = "";
    let capturedRequestBody: unknown = null;

    server.use(
      mockCreateNatalChart(async ({ request }) => {
        capturedRequestUrl = request.url;
        capturedRequestBody = await request.json();
        return HttpResponse.json(chartFull, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderDialog();

    const submitBtn = screen.getByRole("button", { name: "Tính lá số" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(capturedRequestUrl).toContain("save=true");
    });

    expect(capturedRequestBody).toEqual({
      birthProfileId: "profile-uuid-1",
      houseSystem: "Placidus",
      includeOptionalPoints: [],
    });
  });

  it("D4: selecting Whole Sign sends WholeSign enum in payload", async () => {
    let capturedRequestBody: unknown = null;

    server.use(
      mockCreateNatalChart(async ({ request }) => {
        capturedRequestBody = await request.json();
        return HttpResponse.json(chartFull, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderDialog();

    const wholeSignRadio = screen.getByRole("radio", { name: /Whole Sign/ });
    await user.click(wholeSignRadio);

    const submitBtn = screen.getByRole("button", { name: "Tính lá số" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(capturedRequestBody).not.toBeNull();
    });

    expect(capturedRequestBody).toEqual({
      birthProfileId: "profile-uuid-1",
      houseSystem: "WholeSign",
      includeOptionalPoints: [],
    });
  });

  it("D5: pending state sets aria-busy on submit, shows live status, disables Hủy and prevents double submit", async () => {
    let requestCount = 0;
    let finishResolver: () => void = () => {};

    server.use(
      mockCreateNatalChart(async () => {
        requestCount++;
        await new Promise<void>((resolve) => {
          finishResolver = resolve;
        });
        return HttpResponse.json(chartFull, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderDialog();

    const submitBtn = screen.getByRole("button", { name: "Tính lá số" });
    const cancelBtn = screen.getByRole("button", { name: "Hủy" });

    await user.click(submitBtn);

    // During pending
    await waitFor(() => {
      expect(submitBtn).toHaveAttribute("aria-busy", "true");
    });

    expect(
      screen.getByText("Đang tính toán vị trí hành tinh…"),
    ).toHaveAttribute("role", "status");
    expect(cancelBtn).toBeDisabled();

    // Second click should be ignored
    fireEvent.click(submitBtn);
    expect(requestCount).toBe(1);

    // Resolve request
    finishResolver();
    await waitFor(() => {
      expect(screen.getByTestId("chart-detail-target")).toBeInTheDocument();
    });
  });

  it("D6: pending state ignores Escape key, overlay click, and close button", async () => {
    let finishResolver: () => void = () => {};

    server.use(
      mockCreateNatalChart(async () => {
        await new Promise<void>((resolve) => {
          finishResolver = resolve;
        });
        return HttpResponse.json(chartFull, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    const onClose = vi.fn();
    renderDialog(defaultTarget, onClose);

    const submitBtn = screen.getByRole("button", { name: "Tính lá số" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(submitBtn).toHaveAttribute("aria-busy", "true");
    });

    // Press Escape
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();

    // Click overlay
    const overlay = screen.getByTestId("modal-overlay");
    fireEvent.click(overlay);
    expect(onClose).not.toHaveBeenCalled();

    // Click close button
    const closeBtn = screen.getByTestId("modal-close-btn");
    await user.click(closeBtn);
    expect(onClose).not.toHaveBeenCalled();

    finishResolver();
    await waitFor(() => {
      expect(screen.getByTestId("chart-detail-target")).toBeInTheDocument();
    });
  });

  it("D7: renders notice when isBirthTimeKnown=false with 'có thể'; omits notice when true", () => {
    const { unmount } = renderDialog({
      ...defaultTarget,
      isBirthTimeKnown: false,
    });

    const noticeTitle = screen.getByText("Hồ sơ này chưa có giờ sinh");
    expect(noticeTitle).toBeInTheDocument();
    expect(screen.getByText(/có thể/)).toBeInTheDocument();

    unmount();

    renderDialog({
      ...defaultTarget,
      isBirthTimeKnown: true,
    });

    expect(
      screen.queryByText("Hồ sơ này chưa có giờ sinh"),
    ).not.toBeInTheDocument();
  });

  it("D8: handles 422 INVALID_DATETIME showing mapped error, retaining WholeSign, changing button to 'Thử lại'", async () => {
    server.use(
      mockCreateNatalChart(() => problemDetails(422, "INVALID_DATETIME")),
    );

    const user = userEvent.setup();
    renderDialog();

    const wholeSignRadio = screen.getByRole("radio", { name: /Whole Sign/ });
    await user.click(wholeSignRadio);

    const submitBtn = screen.getByRole("button", { name: "Tính lá số" });
    await user.click(submitBtn);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Không thể tính lá số");
    expect(alert).toHaveTextContent(
      "Ngày hoặc giờ sinh của hồ sơ này không thể dùng để tính lá số (ví dụ giờ sinh không tồn tại do đổi múi giờ). Vui lòng kiểm tra lại hồ sơ.",
    );

    // Dialog remains open and selection retained
    expect(wholeSignRadio).toBeChecked();
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });

  it("D9: retry after error succeeds and navigates to chart page", async () => {
    server.use(
      mockCreateNatalChart(() => problemDetails(422, "INVALID_DATETIME")),
    );

    const user = userEvent.setup();
    const { getCapturedChartId } = renderDialog();

    const submitBtn = screen.getByRole("button", { name: "Tính lá số" });
    await user.click(submitBtn);

    const retryBtn = await screen.findByRole("button", { name: "Thử lại" });

    // Switch server to succeed
    server.use(createNatalChartSuccess(chartFull));
    await user.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByTestId("chart-detail-target")).toBeInTheDocument();
    });
    expect(getCapturedChartId()).toBe(chartFull.id);
  });

  it("D10: 500 INTERNAL_SERVER_ERROR displays generic fallback message without raw Backend error", async () => {
    server.use(
      mockCreateNatalChart(() => problemDetails(500, "INTERNAL_SERVER_ERROR")),
    );

    const user = userEvent.setup();
    renderDialog();

    const submitBtn = screen.getByRole("button", { name: "Tính lá số" });
    await user.click(submitBtn);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Đã có lỗi xảy ra, vui lòng thử lại.");
    expect(alert).not.toHaveTextContent("INTERNAL_SERVER_ERROR");
  });

  it("D11: successful calculation navigates using chart.id from response (distinct from profile id)", async () => {
    const customChart = {
      ...chartFull,
      id: "a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d",
    };
    server.use(createNatalChartSuccess(customChart));

    const user = userEvent.setup();
    const { getCapturedChartId } = renderDialog({
      id: "profile-distinct-id",
      displayName: "Nguyễn Văn A",
      isBirthTimeKnown: true,
    });

    const submitBtn = screen.getByRole("button", { name: "Tính lá số" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId("chart-detail-target")).toBeInTheDocument();
    });
    expect(getCapturedChartId()).toBe("a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d");
    expect(getCapturedChartId()).not.toBe("profile-distinct-id");
  });

  it("D12: invalid chart id in response does not navigate, shows danger Alert, and calls reportError", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const invalidChart = { ...chartFull, id: "not-a-valid-uuid" };
    server.use(
      mockCreateNatalChart(() =>
        HttpResponse.json(invalidChart, { status: 201 }),
      ),
    );

    const user = userEvent.setup();
    renderDialog();

    const submitBtn = screen.getByRole("button", { name: "Tính lá số" });
    await user.click(submitBtn);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Không thể tính lá số");
    expect(alert).toHaveTextContent("Đã có lỗi xảy ra, vui lòng thử lại.");

    expect(screen.queryByTestId("chart-detail-target")).not.toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("D13: clicking Hủy when idle invokes onClose", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderDialog(defaultTarget, onClose);

    const cancelBtn = screen.getByRole("button", { name: "Hủy" });
    await user.click(cancelBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("D14: unmounting and remounting with a different profile resets selection and error", async () => {
    server.use(
      mockCreateNatalChart(() => problemDetails(422, "INVALID_DATETIME")),
    );

    const user = userEvent.setup();
    const { unmount } = renderDialog();

    const wholeSignRadio = screen.getByRole("radio", { name: /Whole Sign/ });
    await user.click(wholeSignRadio);

    const submitBtn = screen.getByRole("button", { name: "Tính lá số" });
    await user.click(submitBtn);

    await screen.findByRole("alert");

    unmount();

    // Re-mount with a new target
    renderDialog({
      id: "profile-uuid-2",
      displayName: "Trần Thị B",
      isBirthTimeKnown: true,
    });

    expect(
      screen.getByText(/Chọn hệ nhà để tính lá số cho hồ sơ “Trần Thị B”\./),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Placidus/ })).toBeChecked();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("D15: passes accessibility check with vitest-axe", async () => {
    renderDialog();

    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
});
