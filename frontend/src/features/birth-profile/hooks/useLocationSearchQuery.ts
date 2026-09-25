import { useQuery } from "@tanstack/react-query";

import { useDebounce } from "@shared/hooks/useDebounce";

import { searchLocations } from "../api/searchLocations";

export const useLocationSearchQuery = ({
  query,
  date,
  enabled = true,
}: {
  query: string;
  date: string | undefined;
  enabled?: boolean;
}) => {
  const debouncedQuery = useDebounce(query, 300);
  const isReady = Boolean(date) && debouncedQuery.trim().length >= 2 && enabled;

  return useQuery({
    queryKey: ["locationSearch", debouncedQuery, date],
    queryFn: () => searchLocations({ q: debouncedQuery, date: date as string }),
    enabled: isReady,
  });
};
