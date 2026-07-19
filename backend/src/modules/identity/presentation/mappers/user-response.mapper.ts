import { z } from 'zod';

import '../../../../docs/openapi.js';
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

export type UserResponse = z.infer<typeof userResponseSchema>;

export class UserResponseMapper {
  static toResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role as 'user' | 'admin',
      createdAt: user.createdAt,
    };
  }
}
