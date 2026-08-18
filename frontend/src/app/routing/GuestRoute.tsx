import { Navigate, Outlet } from "react-router-dom";

import { useAuthStore } from "@shared/stores/authStore";
import { Spinner } from "@shared/ui/Spinner";

export const GuestRoute = () => {
  const { status } = useAuthStore();

  if (status === "resolving") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Spinner size="lg" label="Đang tải..." />
      </div>
    );
  }

  if (status === "authenticated") {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
};
