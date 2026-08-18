import { lazy, Suspense } from "react";
import { createBrowserRouter, Outlet, useRouteError } from "react-router-dom";

import { GuestRoute } from "@app/routing/GuestRoute";
import { ProtectedRoute } from "@app/routing/ProtectedRoute";
import { Spinner } from "@shared/ui/Spinner";
import { AppLayout } from "@widgets/app-layout";
import { AuthLayout } from "@widgets/auth-layout";
import { MarketingLayout } from "@widgets/marketing-layout";

// Error Pages
const NotFoundPage = lazy(() => import("@pages/errors/not-found-page"));

// Public Pages
const HomePage = lazy(() => import("@pages/home/page"));
const VerifyPage = lazy(() => import("@pages/verify/page"));

// Auth Pages
const LoginPage = lazy(() => import("@pages/auth/login/page"));
const RegisterPage = lazy(() => import("@pages/auth/register/page"));

// App Pages
const AppPage = lazy(() => import("@pages/app/page"));

const SuspenseFallback = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <Spinner size="lg" label="Đang tải trang..." />
  </div>
);

const RootErrorBoundary = () => {
  const error = useRouteError();
  console.error("Router error:", error);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface p-8 text-center">
      <h1 className="text-display-sm font-semibold text-danger">
        Đã có lỗi xảy ra
      </h1>
      <p className="text-body-base mt-4 text-subtle">
        Không thể hiển thị trang này do lỗi nội bộ. Vui lòng thử lại sau.
      </p>
    </div>
  );
};

export const routesConfig = [
  {
    path: "/",
    errorElement: <RootErrorBoundary />,
    children: [
      // 1. Marketing Layout (Public)
      {
        element: (
          <MarketingLayout>
            <Suspense fallback={<SuspenseFallback />}>
              <Outlet />
            </Suspense>
          </MarketingLayout>
        ),
        children: [
          {
            index: true,
            element: <HomePage />,
          },
        ],
      },
      // 2. Auth Layout (Guest Only)
      {
        element: <GuestRoute />,
        children: [
          {
            element: (
              <AuthLayout>
                <Suspense fallback={<SuspenseFallback />}>
                  <Outlet />
                </Suspense>
              </AuthLayout>
            ),
            children: [
              {
                path: "login",
                element: <LoginPage />,
              },
              {
                path: "register",
                element: <RegisterPage />,
              },
            ],
          },
        ],
      },
      // 3. App Layout (Protected)
      {
        path: "app",
        element: <ProtectedRoute />,
        children: [
          {
            element: (
              <AppLayout>
                <Suspense fallback={<SuspenseFallback />}>
                  <Outlet />
                </Suspense>
              </AppLayout>
            ),
            children: [
              {
                index: true,
                element: <AppPage />,
              },
            ],
          },
        ],
      },
      // 3.5 Dev-only Style Guide
      ...(import.meta.env.DEV
        ? [
            {
              path: "dev/style-guide",
              element: (
                <Suspense fallback={<SuspenseFallback />}>
                  <VerifyPage />
                </Suspense>
              ),
            },
          ]
        : []),
      // 4. Catch-all (Not Found)
      {
        path: "*",
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <NotFoundPage />
          </Suspense>
        ),
      },
    ],
  },
];

export const router = createBrowserRouter(routesConfig);
