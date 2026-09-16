import { setRefreshHandler } from "@shared/api/auth-refresh-coordinator";
import { useAuthStore } from "@shared/stores/authStore";

import { refresh } from "./api/refresh";

export { useLoginMutation } from "./hooks/useLoginMutation";
export { useRegisterMutation } from "./hooks/useRegisterMutation";
export { useLogoutMutation } from "./hooks/useLogoutMutation";

export function registerAuthInfrastructure(): void {
  setRefreshHandler(async () => {
    try {
      const result = await refresh();
      useAuthStore.getState().setSession(result.user, result.accessToken);
      return result.accessToken;
    } catch (error) {
      useAuthStore.getState().clearSession();
      throw error;
    }
  });
}
