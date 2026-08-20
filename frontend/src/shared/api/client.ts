import axios, { type AxiosError } from "axios";

import { env } from "@shared/config/env";
import { useAuthStore } from "@shared/stores/authStore";

export class ApiError extends Error {
  public status: number;
  public errorCode: string;
  public title: string;
  public detail?: string;
  public fieldErrors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    errorCode: string,
    title: string,
    detail?: string,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
    this.title = title;
    this.detail = detail;
    this.fieldErrors = fieldErrors;
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
    const data = (error.response?.data || {}) as Record<string, unknown>;

    const errorCode = (data.errorCode as string) || "UNKNOWN_ERROR";
    const title =
      (data.title as string) || error.message || "An unexpected error occurred";
    const detail = data.detail as string | undefined;
    const fieldErrors = data.fieldErrors as
      Record<string, string[]> | undefined;

    const apiError = new ApiError(
      title,
      status,
      errorCode,
      title,
      detail,
      fieldErrors,
    );

    type ExtendedRequestConfig = typeof error.config & { _retry?: boolean };
    const originalRequest = error.config as ExtendedRequestConfig | undefined;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      // TODO(Core): Implement refresh token logic (call refresh endpoint, then retry originalRequest) khi features/auth sẵn sàng
      useAuthStore.getState().logout();
    }

    return Promise.reject(apiError);
  },
);
