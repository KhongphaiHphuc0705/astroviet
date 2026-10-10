import { apiClient } from "@shared/api/client";

import type { ListChartsParams, ListChartsResponse } from "./types";

export async function listCharts(
  params?: ListChartsParams,
): Promise<ListChartsResponse> {
  const response = await apiClient.get<ListChartsResponse>("/api/v1/charts", {
    params,
  });
  return response.data;
}
