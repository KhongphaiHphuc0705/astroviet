import { useMutation } from "@tanstack/react-query";

import { ApiError } from "@shared/api/client";

import { register } from "../api/register";
import type { RegisterRequest, RegisterResponse } from "../api/types";

export function useRegisterMutation() {
  return useMutation<RegisterResponse, ApiError, RegisterRequest>({
    mutationFn: register,
  });
}
