import { z } from 'zod';

import '../../../../docs/openapi.js';
import { User } from '../../domain/entities/user.entity.js';

import { userResponseSchema, UserResponseMapper } from './user-response.mapper.js';

export const registerResponseSchema = z
  .object({
    user: userResponseSchema,
  })
  .openapi('RegisterResponse');

export type RegisterResponse = z.infer<typeof registerResponseSchema>;

export class RegisterResponseMapper {
  static toResponse(user: User): RegisterResponse {
    return {
      user: UserResponseMapper.toResponse(user),
    };
  }
}
