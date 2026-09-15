import { apiClient } from "@shared/api/client";

import type { RegisterRequest, RegisterResponse } from "./types";

export async function register(
  input: RegisterRequest,
): Promise<RegisterResponse> {
  const response = await apiClient.post<RegisterResponse>(
    "/api/v1/auth/register",
    input,
  );
  return response.data;
}
