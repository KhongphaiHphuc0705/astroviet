import { useMutation } from "@tanstack/react-query";

import { useAuthStore } from "@shared/stores/authStore";

import { login } from "../api/login";

export function useLoginMutation() {
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      useAuthStore.getState().setSession(data.user, data.accessToken);
    },
  });
}
