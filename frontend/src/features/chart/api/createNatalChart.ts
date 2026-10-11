import { apiClient } from "@shared/api/client";

import type { ChartResponse, HouseSystem } from "./types";

export async function createNatalChart(
  profileId: string,
  houseSystem: HouseSystem,
): Promise<ChartResponse> {
  const response = await apiClient.post<ChartResponse>(
    "/api/v1/charts/natal",
    {
      birthProfileId: profileId,
      houseSystem,
      includeOptionalPoints: [],
    },
    {
      params: { save: true },
    },
  );
  return response.data;
}
