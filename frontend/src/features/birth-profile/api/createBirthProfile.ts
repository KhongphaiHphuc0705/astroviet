import { apiClient } from "@shared/api/client";

import type { BirthProfile, CreateBirthProfileInput } from "./types";

export async function createBirthProfile(
  input: CreateBirthProfileInput,
): Promise<BirthProfile> {
  const response = await apiClient.post<BirthProfile>(
    "/api/v1/birth-profiles",
    input,
  );
  return response.data;
}
