import { useMutation } from "@tanstack/react-query";

import { ApiError } from "@shared/api/client";
import { useAuthStore } from "@shared/stores/authStore";

import { login } from "../api/login";
import type { LoginRequest, AuthResponse } from "../api/types";

export function useLoginMutation() {
  return useMutation<AuthResponse, ApiError, LoginRequest>({
    mutationFn: login,
    onSuccess: (data) => {
      useAuthStore.getState().setSession(data.user, data.accessToken);
    },
  });
}
