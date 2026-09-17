import { useEffect } from "react";

import { coordinateRefresh } from "@shared/api/auth-refresh-coordinator";

export const useSessionBootstrap = (): void => {
  useEffect(() => {
    coordinateRefresh().catch(() => {
      // Handler đăng ký qua registerAuthInfrastructure() đã tự clearSession()
      // bên trong (xem features/auth/index.ts) — không cần xử lý gì thêm ở đây.
    });
  }, []);
};
