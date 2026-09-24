import { apiClient } from "@shared/api/client";

export async function deleteBirthProfile(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/birth-profiles/${id}`);
}
