import { useMutation } from "@tanstack/react-query";

import { useAuthStore } from "@shared/stores/authStore";

import { logout } from "../api/logout";

export function useLogoutMutation() {
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      useAuthStore.getState().clearSession();
    },
  });
}
