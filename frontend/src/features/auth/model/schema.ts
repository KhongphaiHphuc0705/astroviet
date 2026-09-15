import { z } from "zod";

export const registerSchema = z
  .object({
    email: z
      .string({ message: "Email là bắt buộc." })
      .trim()
      .toLowerCase()
      .email("Email không hợp lệ."),
    password: z
      .string({ message: "Mật khẩu là bắt buộc." })
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự.")
      .max(72, "Mật khẩu tối đa 72 ký tự.")
      .regex(/\d/, "Mật khẩu phải chứa ít nhất 1 chữ số."),
    confirmPassword: z.string({
      message: "Xác nhận mật khẩu là bắt buộc.",
    }),
    displayName: z
      .string()
      .min(1, "Tên hiển thị không được để trống.")
      .max(100, "Tên hiển thị tối đa 100 ký tự.")
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp.",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z
    .string({ message: "Email là bắt buộc." })
    .trim()
    .toLowerCase()
    .email("Email không hợp lệ."),
  password: z
    .string({ message: "Mật khẩu là bắt buộc." })
    .min(1, "Mật khẩu không được để trống."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
