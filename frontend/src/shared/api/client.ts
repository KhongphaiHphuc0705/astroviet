import axios, { type AxiosError } from "axios";

import { env } from "@shared/config/env";
import { useAuthStore } from "@shared/stores/authStore";

import { coordinateRefresh } from "./auth-refresh-coordinator";

export const AUTH_REFRESH_ENDPOINT = "/api/v1/auth/refresh";

function isRefreshRequest(config?: { url?: string }): boolean {
  return config?.url === AUTH_REFRESH_ENDPOINT;
}

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
  withCredentials: true,
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
    const metadata = data.metadata as Record<string, unknown> | undefined;
    const fieldErrors = metadata?.fieldErrors as
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
      if (isRefreshRequest(originalRequest)) {
        return Promise.reject(apiError);
      }
      originalRequest._retry = true;
      try {
        const newAccessToken = await coordinateRefresh<string>();
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch {
        return Promise.reject(apiError);
      }
    }

    return Promise.reject(apiError);
  },
);
