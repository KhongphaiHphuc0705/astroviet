import { useQuery } from "@tanstack/react-query";

import { getBirthProfile } from "../api/getBirthProfile";

import { birthProfileKeys } from "./query-keys";

export const useBirthProfileQuery = (id: string | undefined) => {
  return useQuery({
    queryKey: birthProfileKeys.detail(id ?? ""),
    // Safe to cast because enabled ensures it only runs when id is truthy
    queryFn: () => getBirthProfile(id as string),
    enabled: Boolean(id),
  });
};
