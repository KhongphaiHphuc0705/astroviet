import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

import { createQueryClient } from "@shared/api/queryClient";
import { server } from "@test/msw-server";

import LoginPage from "./page";

const wrapper = ({
  children,
  initialEntries = ["/login"],
}: {
  children: React.ReactNode;
  initialEntries?: string[];
}) => (
  <QueryClientProvider client={createQueryClient()}>
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login" element={children} />
        <Route
          path="/app"
          element={<div data-testid="app-page">App Page</div>}
        />
        <Route
          path="/profile"
          element={<div data-testid="profile-page">Profile Page</div>}
        />
      </Routes>
    </MemoryRouter>
  </QueryClientProvider>
);

describe("LoginPage - Form Validation", () => {
  // M5-T01: Invalid email -> Zod error, 0 API calls
  it("shows Zod error on invalid email blur and blocks submit", async () => {
    const user = userEvent.setup();

    // Mock fetch to verify no API calls are made
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    render(<LoginPage />, { wrapper });

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

describe("LoginPage - Mutation & Navigation", () => {
  // M5-T02: Login success, mặc định (/app)
  it("M5-T02: successful login navigates to /app by default", async () => {
    server.use(
      http.post("*/api/v1/auth/login", () => {
        return HttpResponse.json(
          {
            accessToken: "fake",
            user: { id: "1" },
          },
          { status: 200 },
        );
      }),
    );

    const user = userEvent.setup();
    render(<LoginPage />, { wrapper });

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Mật khẩu"), "password123");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() => {
      expect(screen.getByTestId("app-page")).toBeInTheDocument();
    });
  });

  // M5-T03: Login success, redirect hợp lệ (/profile)
  it("M5-T03: successful login navigates to valid redirect destination", async () => {
    server.use(
      http.post("*/api/v1/auth/login", () => {
        return HttpResponse.json(
          {
            accessToken: "fake",
            user: { id: "1" },
          },
          { status: 200 },
        );
      }),
    );

    const user = userEvent.setup();
    render(<LoginPage />, {
      wrapper: (props) =>
        wrapper({ ...props, initialEntries: ["/login?redirect=%2Fprofile"] }),
    });

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Mật khẩu"), "password123");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() => {
      expect(screen.getByTestId("profile-page")).toBeInTheDocument();
    });
  });

  // M5-T04: Login failure (401) shows Alert with getErrorMessage
  it("M5-T04: login failure 401 shows error Alert", async () => {
    server.use(
      http.post("*/api/v1/auth/login", () => {
        return HttpResponse.json(
          {
            errorCode: "INVALID_CREDENTIALS",
          },
          { status: 401 },
        );
      }),
    );

    const user = userEvent.setup();
    render(<LoginPage />, { wrapper });

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Mật khẩu"), "wrongpassword");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(
        screen.getByText("Email hoặc mật khẩu không đúng."),
      ).toBeInTheDocument();
    });
  });

  // M5-T05: dangerous redirect defaults to /app
  it("M5-T05: dangerous redirect defaults to /app", async () => {
    server.use(
      http.post("*/api/v1/auth/login", () => {
        return HttpResponse.json(
          { accessToken: "fake", user: { id: "1" } },
          { status: 200 },
        );
      }),
    );

    const user = userEvent.setup();
    render(<LoginPage />, {
      wrapper: (props) =>
        wrapper({
          ...props,
          initialEntries: ["/login?redirect=https://evil.com"],
        }),
    });

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Mật khẩu"), "password123");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() => {
      expect(screen.getByTestId("app-page")).toBeInTheDocument();
    });
  });
});

describe("LoginPage - Accessibility", () => {
  // M5-T06: axe tests
  it("M5-T06: passes accessibility check (axe) in initial state", async () => {
    const { container } = render(<LoginPage />, { wrapper });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("M5-T06: passes accessibility check (axe) with error states", async () => {
    server.use(
      http.post("*/api/v1/auth/login", () => {
        return HttpResponse.json(
          { errorCode: "INVALID_CREDENTIALS" },
          { status: 401 },
        );
      }),
    );

    const user = userEvent.setup();
    const { container } = render(<LoginPage />, { wrapper });

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Mật khẩu"), "wrong");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
