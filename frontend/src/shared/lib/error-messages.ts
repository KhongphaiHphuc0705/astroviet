import { reportError } from "./report-error";

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "Email hoặc mật khẩu không đúng.",
  EMAIL_ALREADY_EXISTS: "Email này đã được đăng ký.",
  TOKEN_EXPIRED: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.",
  UNAUTHORIZED: "Bạn cần đăng nhập để tiếp tục.",
  MALFORMED_REQUEST: "Dữ liệu gửi lên không hợp lệ.",

  // Birth Profile — Sprint F3 §2.4 (+ INVALID_BIRTH_TIME, xem Decision Log D-03)
  RESOURCE_NOT_FOUND:
    "Không tìm thấy nội dung bạn yêu cầu. Có thể nội dung đã bị xóa.",
  FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
  VALIDATION_ERROR: "Thông tin bạn nhập chưa hợp lệ. Vui lòng kiểm tra lại.",
  INVALID_BIRTH_DATE:
    "Ngày sinh không hợp lệ. Vui lòng chọn một ngày có thật trong quá khứ.",
  INVALID_BIRTH_TIME_STATE:
    "Thông tin giờ sinh chưa nhất quán. Vui lòng nhập giờ sinh, hoặc đánh dấu là chưa rõ giờ sinh.",
  INVALID_LATITUDE_RANGE:
    "Vĩ độ của nơi sinh không hợp lệ. Vui lòng chọn lại nơi sinh.",
  INVALID_LONGITUDE_RANGE:
    "Kinh độ của nơi sinh không hợp lệ. Vui lòng chọn lại nơi sinh.",
  INVALID_TIMEZONE:
    "Múi giờ của nơi sinh không hợp lệ. Vui lòng chọn lại nơi sinh.",
  INVALID_BIRTH_LOCATION:
    "Thông tin nơi sinh không hợp lệ. Vui lòng tìm và chọn lại nơi sinh.",
  INVALID_BIRTH_TIME:
    "Giờ sinh không hợp lệ. Vui lòng nhập giờ từ 00:00 đến 23:59.",
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
