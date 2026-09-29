import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ApiError } from "@shared/api/client";

import { createBirthProfile } from "../api/createBirthProfile";
import type { BirthProfile, CreateBirthProfileInput } from "../api/types";

import { birthProfileKeys } from "./query-keys";

export const useCreateBirthProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<BirthProfile, ApiError, CreateBirthProfileInput>({
    mutationFn: createBirthProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: birthProfileKeys.lists() });
    },
  });
};
