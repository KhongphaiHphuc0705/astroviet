import { apiClient } from "@shared/api/client";

import type { LoginRequest, AuthResponse } from "./types";

export async function login(input: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(
    "/api/v1/auth/login",
    input,
  );
  return response.data;
}
