import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { lazy, Suspense } from "react";
import {
  createMemoryRouter,
  Outlet,
  type RouteObject,
  RouterProvider,
} from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { chartFull } from "@features/chart/api/mocks/fixtures";
import { getChartSuccess } from "@features/chart/api/mocks/handlers";
import { createQueryClient } from "@shared/api/queryClient";
import { useAuthStore } from "@shared/stores/authStore";
import { server } from "@test/msw-server";
import { AppLayout } from "@widgets/app-layout";

import { routesConfig, SuspenseFallback } from "./router";

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
    return render(
      <QueryClientProvider client={createQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );
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
      await screen.findByRole(
        "heading",
        { name: /đăng nhập/i },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
  });

  it("Protected route (/app) redirect /login khi unauthenticated", async () => {
    useAuthStore.setState({ status: "unauthenticated" });
    renderRouter("/app");

    // Vì redirect sang /login nên ta sẽ thấy UI của trang đăng nhập
    expect(
      await screen.findByRole(
        "heading",
        { name: /đăng nhập/i },
        { timeout: 5000 },
      ),
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

  it("R1: Protected chart detail route (/app/charts/:chartId) renders in AppLayout when authenticated", async () => {
    useAuthStore.setState({ status: "authenticated" });
    server.use(getChartSuccess(chartFull));

    renderRouter(`/app/charts/${chartFull.id}`);

    expect(
      await screen.findByRole(
        "heading",
        { name: "Lá số sinh" },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("navigation", { name: /điều hướng chính/i }).length,
    ).toBeGreaterThan(0);
  });

  it("R2: Protected chart route redirects to /login when unauthenticated", async () => {
    useAuthStore.setState({ status: "unauthenticated" });
    renderRouter(`/app/charts/${chartFull.id}`);

    expect(
      await screen.findByRole(
        "heading",
        { name: /đăng nhập/i },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
  });

  it("R3: Invalid chartId format (/app/charts/not-a-uuid) renders not-found state without GET request", async () => {
    useAuthStore.setState({ status: "authenticated" });
    renderRouter("/app/charts/not-a-uuid");

    expect(
      await screen.findByRole(
        "heading",
        { name: "Lá số sinh" },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Không tìm thấy lá số")).toBeInTheDocument();
  });

  it("R4: /app/charts without ID falls back to NotFoundPage", async () => {
    useAuthStore.setState({ status: "authenticated" });
    renderRouter("/app/charts");

    expect(
      await screen.findByText("Không tìm thấy trang bạn yêu cầu.", undefined, {
        timeout: 5000,
      }),
    ).toBeInTheDocument();
  });

  it("R5: Suspense fallback xuất hiện trước khi trang lazy tải", async () => {
    useAuthStore.setState({ status: "authenticated" });
    let resolveComponent: (value: { default: () => React.JSX.Element }) => void;
    const DeferredComponent = lazy(
      () =>
        new Promise<{ default: () => React.JSX.Element }>((resolve) => {
          resolveComponent = resolve;
        }),
    );

    const testRoutesConfig: RouteObject[] = [
      {
        path: "/app",
        element: (
          <AppLayout>
            <Suspense fallback={<SuspenseFallback />}>
              <Outlet />
            </Suspense>
          </AppLayout>
        ),
        children: [
          {
            path: "charts-lazy-test",
            element: <DeferredComponent />,
          },
        ],
      },
    ];

    const router = createMemoryRouter(testRoutesConfig, {
      initialEntries: ["/app/charts-lazy-test"],
    });
    render(
      <QueryClientProvider client={createQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    expect(screen.getByText("Đang tải trang...")).toBeInTheDocument();
    resolveComponent!({ default: () => <h1>Đã tải xong</h1> });
    expect(
      await screen.findByRole(
        "heading",
        { name: "Đã tải xong" },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
  });
});
