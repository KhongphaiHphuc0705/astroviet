import { apiClient } from "@shared/api/client";

import type { LocationSuggestion, SearchLocationsParams } from "./types";

export async function searchLocations(
  params: SearchLocationsParams,
): Promise<LocationSuggestion[]> {
  const response = await apiClient.get<LocationSuggestion[]>(
    "/api/v1/locations/search",
    { params },
  );
  return response.data;
}
