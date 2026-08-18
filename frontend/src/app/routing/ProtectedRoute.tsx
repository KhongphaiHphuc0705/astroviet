/**
 * Frontend route guard cải thiện UX và navigation flow nhưng KHÔNG phải security boundary.
 * Backend authorization vẫn là nguồn thẩm quyền duy nhất.
 */
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { createSafeRedirectUrl } from "@shared/lib/redirect-url";
import { useAuthStore } from "@shared/stores/authStore";
import { Spinner } from "@shared/ui/Spinner";

export const ProtectedRoute = () => {
  const { status } = useAuthStore();
  const location = useLocation();

  if (status === "resolving") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Spinner size="lg" label="Đang xác thực..." />
      </div>
    );
  }

  if (status === "unauthenticated") {
    // Navigate away, preserve current path as redirect query param.
    // Important for F2: When reading the redirect param in LoginForm,
    // ensure it is validated to be a relative path starting with '/'
    // to prevent Open Redirect vulnerabilities.
    const redirectUrl = createSafeRedirectUrl(
      location.pathname,
      location.search,
      location.hash,
    );
    return <Navigate to={redirectUrl} replace />;
  }

  return <Outlet />;
};
