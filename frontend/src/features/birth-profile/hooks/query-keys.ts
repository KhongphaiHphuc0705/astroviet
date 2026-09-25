import type { ListBirthProfilesParams } from "../api/types";

export const birthProfileKeys = {
  lists: () => ["profiles"] as const,
  list: (params?: ListBirthProfilesParams) => ["profiles", params] as const,
  detail: (id: string) => ["profile", id] as const,
};
