import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string()
    .email('Email không hợp lệ')
    .transform((v) => v.trim().toLowerCase()),
  password: z
    .string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(/\d/, 'Mật khẩu phải có ít nhất 1 chữ số'),
  displayName: z.string().min(1).max(100).optional(),
});

export type RegisterRequest = z.infer<typeof registerSchema>;
