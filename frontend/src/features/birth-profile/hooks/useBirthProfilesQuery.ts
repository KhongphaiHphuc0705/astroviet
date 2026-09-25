import { useQuery } from "@tanstack/react-query";

import { listBirthProfiles } from "../api/listBirthProfiles";
import type { ListBirthProfilesParams } from "../api/types";

import { birthProfileKeys } from "./query-keys";

export const useBirthProfilesQuery = (params?: ListBirthProfilesParams) => {
  return useQuery({
    queryKey: birthProfileKeys.list(params),
    queryFn: () => listBirthProfiles(params),
  });
};
