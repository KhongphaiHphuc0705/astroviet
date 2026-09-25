import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteBirthProfile } from "../api/deleteBirthProfile";

import { birthProfileKeys } from "./query-keys";

export const useDeleteBirthProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteBirthProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: birthProfileKeys.lists() });
    },
  });
};
