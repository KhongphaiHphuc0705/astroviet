import { useMutation } from "@tanstack/react-query";

import { register } from "../api/register";

export function useRegisterMutation() {
  return useMutation({
    mutationFn: register,
  });
}
