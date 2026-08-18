import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it, beforeEach, vi } from "vitest";

import { useAuthStore } from "@shared/stores/authStore";

import { routesConfig } from "./router";

const FakeErrorComponent = () => {
  throw new Error("Fake error for testing ErrorBoundary");
};

describe("Router Integration Tests", () => {
  beforeEach(() => {
    // Reset state before each test
    useAuthStore.setState({
      status: "resolving",
      accessToken: null,
      user: null,
    });
  });

  const renderRouter = (initialPath: string) => {
    // Inject a fake error route for testing RootErrorBoundary by composing a new array
    const testRoutesConfig = [
      {
        ...routesConfig[0],
        children: [
          ...(routesConfig[0]?.children || []),
          {
            path: "test-error",
            element: <FakeErrorComponent />,
          },
        ],
      },
    ];

    const router = createMemoryRouter(testRoutesConfig, {
      initialEntries: [initialPath],
    });
    return render(<RouterProvider router={router} />);
  };

  it("Public route (/) render đúng MarketingLayout + HomePage và test Lazy Loading / Suspense", async () => {
    renderRouter("/");

    // Suspense fallback (Spinner) xuất hiện trong khoảng chờ
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Đang tải trang...")).toBeInTheDocument();

    // Lazy route resolves đúng component sau khi import() promise resolve
    expect(
      await screen.findByText(/AstroViet — Coming soon/i),
    ).toBeInTheDocument();
  });

  it("Guest route (/login) render đúng AuthLayout khi authStore = unauthenticated", async () => {
    useAuthStore.setState({ status: "unauthenticated" });
    renderRouter("/login");

    expect(
      await screen.findByRole("heading", { name: "Đăng nhập" }),
    ).toBeInTheDocument();
  });

  it("Protected route (/app) redirect /login khi unauthenticated", async () => {
    useAuthStore.setState({ status: "unauthenticated" });
    renderRouter("/app");

    // Vì redirect sang /login nên ta sẽ thấy UI của trang đăng nhập
    expect(
      await screen.findByRole("heading", { name: "Đăng nhập" }),
    ).toBeInTheDocument();
  });

  it("Nested route (/app) render đúng bên trong <Outlet/> của AppLayout khi authenticated", async () => {
    useAuthStore.setState({ status: "authenticated" });
    renderRouter("/app");

    expect(
      await screen.findByRole("heading", { name: "Bảng điều khiển" }),
    ).toBeInTheDocument();
  });

  it("Unknown route (/khong-ton-tai) render NotFoundPage", async () => {
    renderRouter("/khong-ton-tai");

    expect(
      await screen.findByText("Không tìm thấy trang bạn yêu cầu."),
    ).toBeInTheDocument();
  });

  it("Error route catches exceptions using RootErrorBoundary", async () => {
    // Suppress console.error for this specific test to keep logs clean
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderRouter("/test-error");

    expect(
      await screen.findByRole("heading", { name: "Đã có lỗi xảy ra" }),
    ).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
