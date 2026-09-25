import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { createQueryClient } from "@shared/api/queryClient";
import { server } from "@test/msw-server";

import { mockSearchLocations } from "../../api/mocks/handlers";

import { BirthProfileForm } from "./BirthProfileForm";

describe("BirthProfileForm Integration", () => {
  let queryClient: ReturnType<typeof createQueryClient>;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    queryClient = createQueryClient();
    queryClient.setDefaultOptions({ queries: { retry: false } });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  const renderComponent = () => {
    const onSubmit = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <BirthProfileForm onSubmit={onSubmit} />
      </QueryClientProvider>,
    );
    return { onSubmit };
  };

  it("handles birth time toggle correctly (Case A and B)", async () => {
    const user = userEvent.setup();
    renderComponent();

    // Fill step 1 and go to step 2
    await user.type(screen.getByLabelText(/Tên hồ sơ/i), "Test Profile");
    await user.click(screen.getByRole("button", { name: /Tiếp tục/i }));

    // Now on step 2
    expect(screen.getByText("Ngày sinh và Địa điểm")).toBeInTheDocument();

    const birthTimeInput = screen.getByLabelText(/^Giờ sinh/i);
    const checkbox = screen.getByLabelText(/Tôi biết rõ giờ sinh/i);

    // Initial state: true -> input is enabled
    expect(checkbox).toBeChecked();
    expect(birthTimeInput).not.toBeDisabled();

    // Type a value
    await user.type(birthTimeInput, "14:30");
    expect(birthTimeInput).toHaveValue("14:30");

    // Case A: Toggle OFF -> input becomes disabled and value is cleared
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(birthTimeInput).toBeDisabled();
    expect(birthTimeInput).toHaveValue("");

    // Case B: Toggle ON -> input becomes enabled and value remains empty (not fake 00:00)
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(birthTimeInput).not.toBeDisabled();
    expect(birthTimeInput).toHaveValue("");
  });

  it("clears selected location when birthDate is changed (OQ-2)", async () => {
    server.use(
      mockSearchLocations(async () => {
        return new Response(
          JSON.stringify([
            {
              placeName: "Ho Chi Minh City",
              latitude: 10,
              longitude: 106,
              historicalTimezoneId: "Asia/Ho_Chi_Minh",
            },
          ]),
          { status: 200 },
        );
      }),
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderComponent();

    // Fill step 1 and go to step 2
    await user.type(screen.getByLabelText(/Tên hồ sơ/i), "Test Profile");
    await user.click(screen.getByRole("button", { name: /Tiếp tục/i }));

    const birthDateInput = screen.getByLabelText(/^Ngày sinh/i);
    await user.type(birthDateInput, "1995-05-12");

    // Search for location
    const locationInput = screen.getByRole("combobox", { name: /Nơi sinh/i });
    await user.type(locationInput, "Hoc");

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Select the location
    const option = await screen.findByText("Ho Chi Minh City");
    await user.click(option);

    // Verify location is selected (readonly view)
    expect(screen.getByText("Ho Chi Minh City")).toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: /Nơi sinh/i }),
    ).not.toBeInTheDocument();

    // Change the birthDate
    await user.clear(birthDateInput);
    await user.type(birthDateInput, "1996-01-01");

    // Verify location is cleared and input is back to combobox
    expect(screen.queryByText("Ho Chi Minh City")).not.toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /Nơi sinh/i }),
    ).toBeInTheDocument();
  });
});
