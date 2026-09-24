import { apiClient } from "@shared/api/client";

import type {
  ListBirthProfilesParams,
  ListBirthProfilesResponse,
} from "./types";

export async function listBirthProfiles(
  params?: ListBirthProfilesParams,
): Promise<ListBirthProfilesResponse> {
  const response = await apiClient.get<ListBirthProfilesResponse>(
    "/api/v1/birth-profiles",
    { params },
  );
  return response.data;
}
