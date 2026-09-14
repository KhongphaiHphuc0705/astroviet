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
});
