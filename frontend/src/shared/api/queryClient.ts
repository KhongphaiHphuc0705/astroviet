import { QueryClient } from "@tanstack/react-query";

import { isKnownBusinessError } from "@shared/lib/error-messages";
import { reportError } from "@shared/lib/report-error";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // auth session không dùng useQuery — cấu hình mặc định an toàn không auto-retry lỗi 401/403
        retry: false,
      },
      mutations: {
        onError: (error: unknown) => {
          const errorCode =
            error != null &&
            typeof error === "object" &&
            "errorCode" in error &&
            typeof (error as Record<string, unknown>).errorCode === "string"
              ? ((error as Record<string, unknown>).errorCode as string)
              : null;

          // Chỉ báo cáo lỗi khi không phải lỗi nghiệp vụ đã biết
          if (!errorCode || !isKnownBusinessError(errorCode)) {
            reportError(error, "TanStack Query Mutation");
          }
        },
      },
    },
  });
}
export const queryClient = createQueryClient();
