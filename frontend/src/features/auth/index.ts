import { setRefreshHandler } from "@shared/api/auth-refresh-coordinator";

import { refresh } from "./api/refresh";

export function registerAuthInfrastructure(): void {
  setRefreshHandler(async () => {
    const result = await refresh();
    return result.accessToken;
  });
}
