import { apiClient } from "@shared/api/client";

export async function logout(): Promise<void> {
  await apiClient.post("/api/v1/auth/logout");
}
