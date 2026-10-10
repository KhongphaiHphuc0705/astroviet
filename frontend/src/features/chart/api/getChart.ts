import { apiClient } from "@shared/api/client";

import type { ChartResponse } from "./types";

export async function getChart(id: string): Promise<ChartResponse> {
  const response = await apiClient.get<ChartResponse>(
    `/api/v1/charts/${encodeURIComponent(id)}`,
  );
  return response.data;
}
