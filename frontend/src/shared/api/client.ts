import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

import { env } from "@shared/config/env";
import { useAuthStore } from "@shared/stores/authStore";

export class ApiError extends Error {
  public status: number;
  public data: unknown;

  constructor(message: string, status: number, data: unknown = null) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = "ApiError";
  }
}

export const apiClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach Token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Standardize ApiError & handle 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status || 500;
    const data = error.response?.data;
    const message =
      (data as Record<string, unknown>)?.message ||
      error.message ||
      "An unexpected error occurred";

    const apiError = new ApiError(message, status, data);

    if (status === 401) {
      const originalRequest = error.config;

      if (
        originalRequest &&
        !(originalRequest as CustomAxiosRequestConfig)._retry
      ) {
        (originalRequest as CustomAxiosRequestConfig)._retry = true;

        try {
          // Placeholder for refresh token logic:
          // const newToken = await refreshAuthToken();
          // useAuthStore.getState().setAccessToken(newToken);
          // originalRequest.headers.Authorization = `Bearer ${newToken}`;
          // return apiClient(originalRequest);

          // Currently, auth feature doesn't exist, just logout
          useAuthStore.getState().logout();
        } catch {
          useAuthStore.getState().logout();
        }
      } else {
        useAuthStore.getState().logout();
      }
    }

    return Promise.reject(apiError);
  },
);
