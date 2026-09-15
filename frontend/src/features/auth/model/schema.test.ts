import { describe, it, expect } from "vitest";

import { registerSchema, loginSchema } from "./schema";

describe("auth schemas", () => {
  describe("registerSchema", () => {
    it("validates valid input correctly", () => {
      const validData = {
        email: " Test@EXAMPLE.com  ",
        password: "Password1",
        confirmPassword: "Password1",
      };
      const parsed = registerSchema.parse(validData);
      expect(parsed.email).toBe("test@example.com");
      expect(parsed.password).toBe("Password1");
      expect(parsed.confirmPassword).toBe("Password1");
      expect(parsed.displayName).toBeUndefined();
    });

    it("accepts valid displayName", () => {
      const validData = {
        email: "a@b.com",
        password: "Password1",
        confirmPassword: "Password1",
        displayName: "A valid name",
      };
      const parsed = registerSchema.parse(validData);
      expect(parsed.displayName).toBe("A valid name");
    });

    it("rejects invalid email format", () => {
      const data = {
        email: "not-an-email",
        password: "Password1",
        confirmPassword: "Password1",
      };
      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Email không hợp lệ.");
      }
    });

    it("rejects whitespace-only email", () => {
      const data = {
        email: "   ",
        password: "Password1",
        confirmPassword: "Password1",
      };
      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects password shorter than 8 characters", () => {
      const data = {
        email: "a@b.com",
        password: "abc123",
        confirmPassword: "abc123",
      };
      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "Mật khẩu phải có ít nhất 8 ký tự.",
        );
      }
    });

    it("accepts password at exactly 72 characters", () => {
      const pw = "a".repeat(71) + "1"; // 72 ký tự, có chữ số
      const result = registerSchema.safeParse({
        email: "a@b.com",
        password: pw,
        confirmPassword: pw,
      });
      expect(result.success).toBe(true);
    });

    it("rejects password longer than 72 characters", () => {
      const data = {
        email: "a@b.com",
        password: "a".repeat(72) + "1",
        confirmPassword: "a".repeat(72) + "1",
      };
      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "Mật khẩu tối đa 72 ký tự.",
        );
      }
    });

    it("rejects password without numbers", () => {
      const data = {
        email: "a@b.com",
        password: "abcdefgh",
        confirmPassword: "abcdefgh",
      };
      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "Mật khẩu phải chứa ít nhất 1 chữ số.",
        );
      }
    });

    it("rejects mismatched confirmPassword", () => {
      const data = {
        email: "a@b.com",
        password: "Abc12345",
        confirmPassword: "Different1",
      };
      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Mật khẩu không khớp.");
        expect(result.error.issues[0]?.path).toContain("confirmPassword");
      }
    });

    it("rejects empty displayName", () => {
      const data = {
        email: "a@b.com",
        password: "Password1",
        confirmPassword: "Password1",
        displayName: "",
      };
      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "Tên hiển thị không được để trống.",
        );
      }
    });

    it("rejects displayName longer than 100 characters", () => {
      const data = {
        email: "a@b.com",
        password: "Password1",
        confirmPassword: "Password1",
        displayName: "a".repeat(101),
      };
      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "Tên hiển thị tối đa 100 ký tự.",
        );
      }
    });

    it("rejects missing required fields", () => {
      const data = {};
      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path[0]);
        expect(paths).toContain("email");
        expect(paths).toContain("password");
        expect(paths).toContain("confirmPassword");
      }
    });
  });

  describe("loginSchema", () => {
    it("validates valid input correctly", () => {
      const data = {
        email: "Test@example.com ",
        password: "x",
      };
      const parsed = loginSchema.parse(data);
      expect(parsed.email).toBe("test@example.com");
      expect(parsed.password).toBe("x");
    });

    it("rejects invalid email format", () => {
      const data = {
        email: "invalid",
        password: "x",
      };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects empty password", () => {
      const data = {
        email: "a@b.com",
        password: "",
      };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "Mật khẩu không được để trống.",
        );
      }
    });

    it("rejects missing required fields", () => {
      const data = {};
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path[0]);
        expect(paths).toContain("email");
        expect(paths).toContain("password");
      }
    });
  });
});
