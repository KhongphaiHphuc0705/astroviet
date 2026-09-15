export function reportError(error: unknown, context?: string): void {
  // Development: console.error đầy đủ. Production: vẫn console.error ở giai đoạn này
  // (chưa tích hợp dịch vụ ngoài như Sentry — đó là quyết định tương lai, không phải M1).
  console.error(`[reportError]${context ? ` (${context})` : ""}`, error);
}
