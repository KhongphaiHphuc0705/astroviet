import { useQuery } from "@tanstack/react-query";

import { ApiError } from "@shared/api/client";

import { getChart } from "../api/getChart";
import { isValidChartId } from "../api/isValidChartId";
import type { ChartResponse } from "../api/types";

import { chartKeys } from "./query-keys";

export function useChartQuery(id: string | undefined) {
  return useQuery<ChartResponse, ApiError>({
    queryKey: chartKeys.detail(id ?? ""),
    queryFn: () => getChart(id as string),
    enabled: isValidChartId(id),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
