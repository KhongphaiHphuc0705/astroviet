import { apiClient } from "@shared/api/client";

import type { BirthProfile, UpdateBirthProfileInput } from "./types";

export async function updateBirthProfile(
  id: string,
  input: UpdateBirthProfileInput,
): Promise<BirthProfile> {
  const response = await apiClient.patch<BirthProfile>(
    `/api/v1/birth-profiles/${id}`,
    input,
  );
  return response.data;
}
