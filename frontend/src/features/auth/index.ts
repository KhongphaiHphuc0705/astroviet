import { setRefreshHandler } from "@shared/api/auth-refresh-coordinator";

import { refresh } from "./api/refresh";

export { useLoginMutation } from "./hooks/useLoginMutation";
export { useRegisterMutation } from "./hooks/useRegisterMutation";
export { useLogoutMutation } from "./hooks/useLogoutMutation";

export function registerAuthInfrastructure(): void {
  setRefreshHandler(async () => {
    const result = await refresh();
    return result.accessToken;
  });
}
