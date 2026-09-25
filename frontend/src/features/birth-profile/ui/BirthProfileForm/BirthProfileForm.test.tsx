import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BirthProfileForm } from "./BirthProfileForm";

describe("BirthProfileForm - Birth Time Logic (INV-BP1)", () => {
  const queryClient = new QueryClient();

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
});
