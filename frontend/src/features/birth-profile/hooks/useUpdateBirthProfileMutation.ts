import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { UpdateBirthProfileInput } from "../api/types";
import { updateBirthProfile } from "../api/updateBirthProfile";

import { birthProfileKeys } from "./query-keys";

export const useUpdateBirthProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateBirthProfileInput;
    }) => updateBirthProfile(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: birthProfileKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: birthProfileKeys.detail(variables.id),
      });
    },
  });
};
