import type { ListChartsParams } from "../api/types";

export const chartKeys = {
  all: () => ["charts"] as const,
  lists: () => ["charts", "list"] as const,
  list: (params: ListChartsParams) => ["charts", "list", params] as const,
  details: () => ["charts", "detail"] as const,
  detail: (id: string) => ["charts", "detail", id] as const,
};
