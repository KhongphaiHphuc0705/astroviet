import { z } from 'zod';

import '../../../../docs/openapi.js';

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Email không hợp lệ'),
    password: z.string().min(1, 'Mật khẩu không được để trống'),
  })
  .openapi('LoginRequest');

export type LoginRequest = z.infer<typeof loginSchema>;
