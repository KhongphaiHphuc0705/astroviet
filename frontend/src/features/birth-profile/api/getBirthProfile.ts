import { apiClient } from "@shared/api/client";

import type { BirthProfile } from "./types";

export async function getBirthProfile(id: string): Promise<BirthProfile> {
  const response = await apiClient.get<BirthProfile>(
    `/api/v1/birth-profiles/${id}`,
  );
  return response.data;
}
