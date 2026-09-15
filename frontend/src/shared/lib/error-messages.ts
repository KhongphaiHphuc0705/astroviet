import { reportError } from "./report-error";

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "Email hoặc mật khẩu không đúng.",
  EMAIL_ALREADY_EXISTS: "Email này đã được đăng ký.",
  TOKEN_EXPIRED: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.",
  UNAUTHORIZED: "Bạn cần đăng nhập để tiếp tục.",
  MALFORMED_REQUEST: "Dữ liệu gửi lên không hợp lệ.",
};

export function getErrorMessage(errorCode: string): string {
  const message = ERROR_MESSAGES[errorCode];
  if (!message) {
    reportError(
      new Error(`Unmapped errorCode: ${errorCode}`),
      "error-messages",
    );
    return "Đã có lỗi xảy ra, vui lòng thử lại.";
  }
  return message;
}

export function isKnownBusinessError(errorCode: string): boolean {
  return errorCode in ERROR_MESSAGES;
}
