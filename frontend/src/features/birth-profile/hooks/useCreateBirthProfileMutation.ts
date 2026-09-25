import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createBirthProfile } from "../api/createBirthProfile";

import { birthProfileKeys } from "./query-keys";

export const useCreateBirthProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBirthProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: birthProfileKeys.lists() });
    },
  });
};
