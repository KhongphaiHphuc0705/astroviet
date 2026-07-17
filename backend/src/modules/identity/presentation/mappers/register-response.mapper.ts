import { z } from 'zod';

import { User } from '../../domain/entities/user.entity.js';

export const userResponseSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    displayName: z.string().nullable(),
    role: z.enum(['user', 'admin']),
    createdAt: z.date(),
  })
  .openapi('UserResponse');

export const registerResponseSchema = z
  .object({
    user: userResponseSchema,
  })
  .openapi('RegisterResponse');

export type UserResponse = z.infer<typeof userResponseSchema>;
export type RegisterResponse = z.infer<typeof registerResponseSchema>;

export class RegisterResponseMapper {
  static toResponse(user: User): RegisterResponse {
    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }
}
