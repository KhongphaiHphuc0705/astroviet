import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { getErrorMessage, isKnownBusinessError } from "./error-messages";
import * as reportErrorModule from "./report-error";

describe("error-messages", () => {
  let reportErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    reportErrorSpy = vi
      .spyOn(reportErrorModule, "reportError")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    reportErrorSpy.mockRestore();
  });

  describe("getErrorMessage", () => {
    it("mỗi mã trong 5 mã đã biết → đúng message tiếng Việt", () => {
      expect(getErrorMessage("INVALID_CREDENTIALS")).toBe(
        "Email hoặc mật khẩu không đúng.",
      );
      expect(getErrorMessage("EMAIL_ALREADY_EXISTS")).toBe(
        "Email này đã được đăng ký.",
      );
      expect(getErrorMessage("TOKEN_EXPIRED")).toBe(
        "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.",
      );
      expect(getErrorMessage("UNAUTHORIZED")).toBe(
        "Bạn cần đăng nhập để tiếp tục.",
      );
      expect(getErrorMessage("MALFORMED_REQUEST")).toBe(
        "Dữ liệu gửi lên không hợp lệ.",
      );

      expect(reportErrorSpy).not.toHaveBeenCalled();
    });

    it("mã lạ → fallback + reportError được gọi", () => {
      const result = getErrorMessage("UNKNOWN_SUPER_ERROR");
      expect(result).toBe("Đã có lỗi xảy ra, vui lòng thử lại.");

      expect(reportErrorSpy).toHaveBeenCalledTimes(1);
      expect(reportErrorSpy).toHaveBeenCalledWith(
        expect.any(Error),
        "error-messages",
      );
      expect(reportErrorSpy.mock.calls[0][0].message).toBe(
        "Unmapped errorCode: UNKNOWN_SUPER_ERROR",
      );
    });
  });

  describe("isKnownBusinessError", () => {
    it("đúng true/false tương ứng", () => {
      expect(isKnownBusinessError("INVALID_CREDENTIALS")).toBe(true);
      expect(isKnownBusinessError("TOKEN_EXPIRED")).toBe(true);

      expect(isKnownBusinessError("UNKNOWN_ERROR")).toBe(false);
      expect(isKnownBusinessError("500")).toBe(false);
    });
  });

  describe("Birth Profile error codes (§2.4)", () => {
    it("RESOURCE_NOT_FOUND → message tiếng Việt, không reportError", () => {
      expect(getErrorMessage("RESOURCE_NOT_FOUND")).toBe(
        "Không tìm thấy nội dung bạn yêu cầu. Có thể nội dung đã bị xóa.",
      );
      expect(isKnownBusinessError("RESOURCE_NOT_FOUND")).toBe(true);
      expect(reportErrorSpy).not.toHaveBeenCalled();
    });

    it("FORBIDDEN → message tiếng Việt, không reportError", () => {
      expect(getErrorMessage("FORBIDDEN")).toBe(
        "Bạn không có quyền thực hiện thao tác này.",
      );
      expect(isKnownBusinessError("FORBIDDEN")).toBe(true);
      expect(reportErrorSpy).not.toHaveBeenCalled();
    });

    it("VALIDATION_ERROR → message tiếng Việt, không reportError", () => {
      expect(getErrorMessage("VALIDATION_ERROR")).toBe(
        "Thông tin bạn nhập chưa hợp lệ. Vui lòng kiểm tra lại.",
      );
      expect(isKnownBusinessError("VALIDATION_ERROR")).toBe(true);
      expect(reportErrorSpy).not.toHaveBeenCalled();
    });

    it("INVALID_BIRTH_DATE → message tiếng Việt, không reportError", () => {
      expect(getErrorMessage("INVALID_BIRTH_DATE")).toBe(
        "Ngày sinh không hợp lệ. Vui lòng chọn một ngày có thật trong quá khứ.",
      );
      expect(isKnownBusinessError("INVALID_BIRTH_DATE")).toBe(true);
      expect(reportErrorSpy).not.toHaveBeenCalled();
    });

    it("INVALID_BIRTH_TIME_STATE → message tiếng Việt, không reportError", () => {
      expect(getErrorMessage("INVALID_BIRTH_TIME_STATE")).toBe(
        "Thông tin giờ sinh chưa nhất quán. Vui lòng nhập giờ sinh, hoặc đánh dấu là chưa rõ giờ sinh.",
      );
      expect(isKnownBusinessError("INVALID_BIRTH_TIME_STATE")).toBe(true);
      expect(reportErrorSpy).not.toHaveBeenCalled();
    });

    it("INVALID_LATITUDE_RANGE → message tiếng Việt, không reportError", () => {
      expect(getErrorMessage("INVALID_LATITUDE_RANGE")).toBe(
        "Vĩ độ của nơi sinh không hợp lệ. Vui lòng chọn lại nơi sinh.",
      );
      expect(isKnownBusinessError("INVALID_LATITUDE_RANGE")).toBe(true);
      expect(reportErrorSpy).not.toHaveBeenCalled();
    });

    it("INVALID_LONGITUDE_RANGE → message tiếng Việt, không reportError", () => {
      expect(getErrorMessage("INVALID_LONGITUDE_RANGE")).toBe(
        "Kinh độ của nơi sinh không hợp lệ. Vui lòng chọn lại nơi sinh.",
      );
      expect(isKnownBusinessError("INVALID_LONGITUDE_RANGE")).toBe(true);
      expect(reportErrorSpy).not.toHaveBeenCalled();
    });

    it("INVALID_TIMEZONE → message tiếng Việt, không reportError", () => {
      expect(getErrorMessage("INVALID_TIMEZONE")).toBe(
        "Múi giờ của nơi sinh không hợp lệ. Vui lòng chọn lại nơi sinh.",
      );
      expect(isKnownBusinessError("INVALID_TIMEZONE")).toBe(true);
      expect(reportErrorSpy).not.toHaveBeenCalled();
    });

    it("INVALID_BIRTH_LOCATION → message tiếng Việt, không reportError", () => {
      expect(getErrorMessage("INVALID_BIRTH_LOCATION")).toBe(
        "Thông tin nơi sinh không hợp lệ. Vui lòng tìm và chọn lại nơi sinh.",
      );
      expect(isKnownBusinessError("INVALID_BIRTH_LOCATION")).toBe(true);
      expect(reportErrorSpy).not.toHaveBeenCalled();
    });

    it("INVALID_BIRTH_TIME (Correction D-03) → message tiếng Việt, không reportError", () => {
      expect(getErrorMessage("INVALID_BIRTH_TIME")).toBe(
        "Giờ sinh không hợp lệ. Vui lòng nhập giờ từ 00:00 đến 23:59.",
      );
      expect(isKnownBusinessError("INVALID_BIRTH_TIME")).toBe(true);
      expect(reportErrorSpy).not.toHaveBeenCalled();
    });
  });
});
