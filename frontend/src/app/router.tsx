import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";

const NotFoundPage = lazy(() => import("@pages/errors/not-found-page"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <div>AstroViet — Coming soon</div>,
  },
  // TODO: Add ProtectedRoute for /app/* in M8
  {
    path: "*",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <NotFoundPage />
      </Suspense>
    ),
  },
]);
