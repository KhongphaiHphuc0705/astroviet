import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";

const NotFoundPage = lazy(() => import("@pages/errors/not-found-page"));

const HomePage = lazy(() => import("@pages/home/page"));
const VerifyPage = lazy(() => import("@pages/verify/page"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <HomePage />
      </Suspense>
    ),
  },
  // TODO: Add ProtectedRoute for /app/* in M8
  {
    path: "/dev/verify",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <VerifyPage />
      </Suspense>
    ),
  },
  {
    path: "*",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <NotFoundPage />
      </Suspense>
    ),
  },
]);
