import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@shared/api/client";

import { createNatalChart } from "../api/createNatalChart";
import type { ChartResponse, HouseSystem } from "../api/types";

import { chartKeys } from "./query-keys";

interface CreateNatalChartVariables {
  profileId: string;
  houseSystem: HouseSystem;
}

export function useCreateNatalChartMutation() {
  const queryClient = useQueryClient();

  return useMutation<ChartResponse, ApiError, CreateNatalChartVariables>({
    mutationFn: ({ profileId, houseSystem }) =>
      createNatalChart(profileId, houseSystem),
    onSuccess: (data) => {
      queryClient.setQueryData(chartKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: chartKeys.lists() });
    },
  });
}
