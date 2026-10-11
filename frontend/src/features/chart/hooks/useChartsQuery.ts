import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { ApiError } from "@shared/api/client";

import { listCharts } from "../api/listCharts";
import type { ListChartsParams, ListChartsResponse } from "../api/types";

import { chartKeys } from "./query-keys";

export function useChartsQuery(params: ListChartsParams) {
  return useQuery<ListChartsResponse, ApiError>({
    queryKey: chartKeys.list(params),
    queryFn: () => listCharts(params),
    placeholderData: keepPreviousData,
  });
}
