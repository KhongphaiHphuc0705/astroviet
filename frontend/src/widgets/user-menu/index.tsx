import { useNavigate } from "react-router-dom";

import { useLogoutMutation } from "@features/auth/hooks/useLogoutMutation";
import { useAuthStore } from "@shared/stores/authStore";
import { Button } from "@shared/ui/Button";
import { Stack } from "@shared/ui/Stack";

export function UserMenu() {
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogoutMutation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => navigate("/login"),
    });
  };

  return (
    <Stack direction="horizontal" align="center" gap="3">
      <span className="text-body-sm text-muted">
        {user?.displayName ?? user?.email ?? ""}
      </span>
      <Button
        type="button"
        variant="ghost"
        onClick={handleLogout}
        isLoading={logoutMutation.isPending}
        disabled={logoutMutation.isPending}
      >
        Đăng xuất
      </Button>
    </Stack>
  );
}
