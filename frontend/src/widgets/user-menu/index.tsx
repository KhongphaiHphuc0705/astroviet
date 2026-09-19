import { useAuthStore } from "@shared/stores/authStore";
import { Button } from "@shared/ui/Button";
import { Stack } from "@shared/ui/Stack";

export function UserMenu() {
  const user = useAuthStore((state) => state.user);

  const handleLogout = () => {
    // To be implemented in Step 3-4
  };

  return (
    <Stack direction="horizontal" align="center" gap="3">
      <span className="text-body-sm text-muted">
        {user?.displayName ?? user?.email ?? ""}
      </span>
      <Button type="button" variant="ghost" onClick={handleLogout}>
        Đăng xuất
      </Button>
    </Stack>
  );
}
