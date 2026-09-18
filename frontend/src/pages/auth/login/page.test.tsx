import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import LoginPage from "./page";

// M5-T01: Invalid email -> Zod error, 0 API calls
describe("LoginPage - Form Validation", () => {
  it("shows Zod error on invalid email blur and blocks submit", async () => {
    const user = userEvent.setup();

    // Mock fetch to verify no API calls are made
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Mật khẩu");
    const submitButton = screen.getByRole("button", { name: "Đăng nhập" });

    // Type invalid email and blur
    await user.type(emailInput, "invalid-email");
    await user.click(document.body); // trigger blur

    // Zod error should appear
    expect(await screen.findByText("Email không hợp lệ.")).toBeInTheDocument();

    // Type valid password
    await user.type(passwordInput, "password123");

    // Submit
    await user.click(submitButton);

    // Zod error still there, API not called
    expect(screen.getByText("Email không hợp lệ.")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });
});
