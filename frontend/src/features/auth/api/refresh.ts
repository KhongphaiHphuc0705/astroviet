import { apiClient, AUTH_REFRESH_ENDPOINT } from "@shared/api/client";

import type { AuthResponse } from "./types";

export async function refresh(): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(
    AUTH_REFRESH_ENDPOINT,
    {},
  );
  return response.data;
}
