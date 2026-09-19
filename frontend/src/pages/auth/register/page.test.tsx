import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { axe } from "vitest-axe";

import { createQueryClient } from "@shared/api/queryClient";
import { useAuthStore } from "@shared/stores/authStore";
import { server } from "@test/msw-server";

import RegisterPage from "./page";

const wrapper = ({
  children,
  initialEntries = ["/register"],
}: {
  children: React.ReactNode;
  initialEntries?: string[];
}) => (
  <QueryClientProvider client={createQueryClient()}>
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/register" element={children} />
        <Route
          path="/login"
          element={<div data-testid="login-page">Login Page</div>}
        />
        <Route
          path="/app"
          element={<div data-testid="app-page">App Page</div>}
        />
      </Routes>
    </MemoryRouter>
  </QueryClientProvider>
);

describe("RegisterPage - Tests", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    useAuthStore.setState({ status: "unauthenticated", user: null });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // M6-T01
  it("M6-T01: shows Zod error on password mismatch and blocks submit", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    render(<RegisterPage />, { wrapper });

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Mật khẩu"), "password123");
    await user.type(screen.getByLabelText("Xác nhận mật khẩu"), "different");

    // Trigger blur
    await user.click(document.body);

    expect(await screen.findByText("Mật khẩu không khớp.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Đăng ký" }));

    expect(screen.getByText("Mật khẩu không khớp.")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // M6-T02
  it("M6-T02: displayName empty is valid, API called without displayName", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let capturedPayload: any = null;
    server.use(
      http.post("*/api/v1/auth/register", async ({ request }) => {
        capturedPayload = await request.json();
        return HttpResponse.json({}, { status: 201 });
      }),
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<RegisterPage />, { wrapper });

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Mật khẩu"), "password123");
    await user.type(screen.getByLabelText("Xác nhận mật khẩu"), "password123");

    // leave displayName empty
    await user.click(screen.getByRole("button", { name: "Đăng ký" }));

    await waitFor(() => {
      expect(capturedPayload).not.toBeNull();
    });

    expect(capturedPayload.email).toBe("test@example.com");
    expect(capturedPayload.password).toBe("password123");
    expect(capturedPayload.confirmPassword).toBeUndefined(); // Ensure confirmPassword is stripped
    expect(capturedPayload.displayName).toBeUndefined();
  });

  // M6-T03
  it("M6-T03: 409 EMAIL_ALREADY_EXISTS shows error under email field", async () => {
    server.use(
      http.post("*/api/v1/auth/register", () => {
        return HttpResponse.json(
          { errorCode: "EMAIL_ALREADY_EXISTS" },
          { status: 409 },
        );
      }),
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<RegisterPage />, { wrapper });

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Mật khẩu"), "password123");
    await user.type(screen.getByLabelText("Xác nhận mật khẩu"), "password123");
    await user.click(screen.getByRole("button", { name: "Đăng ký" }));

    await waitFor(() => {
      expect(
        screen.getByText("Email này đã được đăng ký."),
      ).toBeInTheDocument();
    });

    // ensure it's not a generic Alert variant danger
    const genericAlert = screen.queryByRole("alert");
    expect(genericAlert).not.toBeInTheDocument();
  });

  // M6-T04
  it("M6-T04: successful registration shows success alert and navigates after 2000ms", async () => {
    server.use(
      http.post("*/api/v1/auth/register", () => {
        return HttpResponse.json({}, { status: 201 });
      }),
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<RegisterPage />, { wrapper });

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Mật khẩu"), "password123");
    await user.type(screen.getByLabelText("Xác nhận mật khẩu"), "password123");

    // Spy on authStore to ensure it doesn't change
    const storeSpy = vi.spyOn(useAuthStore, "setState");

    await user.click(screen.getByRole("button", { name: "Đăng ký" }));

    // Success alert should appear
    await waitFor(() => {
      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Đăng ký thành công! Đang chuyển tới trang đăng nhập...",
        ),
      ).toBeInTheDocument();
    });

    expect(storeSpy).not.toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe("unauthenticated");

    // Before timer advances, still on register page (login not rendered)
    expect(screen.queryByTestId("login-page")).not.toBeInTheDocument();

    // Advance timer by 2000ms
    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByTestId("login-page")).toBeInTheDocument();
    });
  });

  // M6-T05
  it("M6-T05: Forgot Password is not present", () => {
    render(<RegisterPage />, { wrapper });
    expect(screen.queryByText(/quên mật khẩu/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/forgot/i)).not.toBeInTheDocument();
  });

  // M6-T06
  it("M6-T06: passes accessibility check (axe) in initial state", async () => {
    const { container } = render(<RegisterPage />, { wrapper });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("M6-T06: passes accessibility check (axe) with error states", async () => {
    server.use(
      http.post("*/api/v1/auth/register", () => {
        return HttpResponse.json(
          { errorCode: "EMAIL_ALREADY_EXISTS" },
          { status: 409 },
        );
      }),
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = render(<RegisterPage />, { wrapper });

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Mật khẩu"), "password123");
    await user.type(screen.getByLabelText("Xác nhận mật khẩu"), "password123");
    await user.click(screen.getByRole("button", { name: "Đăng ký" }));

    await waitFor(() => {
      expect(
        screen.getByText("Email này đã được đăng ký."),
      ).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("M6-T06: passes accessibility check (axe) with success state", async () => {
    server.use(
      http.post("*/api/v1/auth/register", () => {
        return HttpResponse.json({}, { status: 201 });
      }),
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = render(<RegisterPage />, { wrapper });

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Mật khẩu"), "password123");
    await user.type(screen.getByLabelText("Xác nhận mật khẩu"), "password123");
    await user.click(screen.getByRole("button", { name: "Đăng ký" }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
