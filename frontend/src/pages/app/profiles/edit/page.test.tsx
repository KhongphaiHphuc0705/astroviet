import { screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  birthProfileNotFound,
  getBirthProfileSuccess,
  mockGetBirthProfile,
  mockUpdateBirthProfile,
  problemDetails,
  updateBirthProfileSuccess,
  mockSearchLocations,
} from "@features/birth-profile/api/mocks/handlers";
import { server } from "@test/msw-server";
import { renderWithProviders } from "@test/render";

import BirthProfileEditPage from "./page";

const renderPage = (initialEntries = ["/app/profiles/test-id/edit"]) => {
  return renderWithProviders(
    <Routes>
      <Route path="/app/profiles/:id/edit" element={<BirthProfileEditPage />} />
    </Routes>,
    { initialEntries },
  );
};

describe("BirthProfileEditPage", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    server.use(
      mockSearchLocations(async () => {
        return HttpResponse.json(
          [
            {
              placeName: "Da Nang",
              latitude: 16,
              longitude: 108,
              historicalTimezoneId: "Asia/Ho_Chi_Minh",
            },
          ],
          { status: 200 },
        );
      }),
    );
  });

  it("shows skeleton while loading", () => {
    server.use(getBirthProfileSuccess());
    const { container } = renderPage();

    // Since the request is pending, skeleton should be visible
    // Wait, by the time it renders, MSW might be fast, but react-query starts in loading state
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("shows error state when profile fails to load", async () => {
    server.use(birthProfileNotFound(mockGetBirthProfile));
    renderPage();

    expect(await screen.findByText("Không thể tải hồ sơ")).toBeInTheDocument();
    expect(
      screen.getByText("Hồ sơ không tồn tại hoặc bạn không có quyền truy cập."),
    ).toBeInTheDocument();
  });

  it("populates form with data and handles successful update", async () => {
    server.use(getBirthProfileSuccess());
    server.use(updateBirthProfileSuccess());

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();

    // Verify data is populated in step 1
    expect(await screen.findByLabelText(/Tên hồ sơ/i)).toHaveValue(
      "My Profile",
    );

    // Change label
    const labelInput = screen.getByLabelText(/Tên hồ sơ/i);
    await user.clear(labelInput);
    await user.type(labelInput, "Updated Profile");

    // Click Next to go to Step 2
    await user.click(screen.getByRole("button", { name: /Tiếp tục/i }));

    // Verify data is populated in step 2
    expect(await screen.findByLabelText(/^Ngày sinh/i)).toHaveValue(
      "1995-05-12",
    );

    // Submit
    await user.click(screen.getByRole("button", { name: /Hoàn tất/i }));

    // Check success alert
    expect(
      await screen.findByText(
        "Cập nhật thành công! Đang chuyển về danh sách...",
      ),
    ).toBeInTheDocument();

    // Check that form becomes disabled (Submit button disabled)
    const submitBtn = screen.getByRole("button", { name: /Hoàn tất/i });
    expect(submitBtn).toHaveAttribute("aria-disabled", "true");

    // Wait for the setTimeout
    act(() => {
      vi.advanceTimersByTime(2000);
    });
  });

  it("handles update failure and shows error alert", async () => {
    server.use(getBirthProfileSuccess());
    server.use(
      mockUpdateBirthProfile(() =>
        problemDetails({
          status: 400,
          errorCode: "VALIDATION_ERROR",
          title: "Dữ liệu không hợp lệ",
        }),
      ),
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();

    // Wait for form to populate step 1
    expect(await screen.findByLabelText(/Tên hồ sơ/i)).toHaveValue(
      "My Profile",
    );

    // Click Next to go to Step 2
    await user.click(screen.getByRole("button", { name: /Tiếp tục/i }));

    // Submit
    await user.click(screen.getByRole("button", { name: /Hoàn tất/i }));

    // Check error alert
    expect(await screen.findByText("Dữ liệu không hợp lệ")).toBeInTheDocument();

    // Form should NOT be disabled after failure
    const submitBtn = screen.getByRole("button", { name: /Hoàn tất/i });
    expect(submitBtn).not.toHaveAttribute("aria-disabled", "true");
  });
});
