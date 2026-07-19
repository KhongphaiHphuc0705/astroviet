import { z } from 'zod';

import '../../../../docs/openapi.js';
import { LoginUserOutput } from '../../application/use-cases/login-user.usecase.js';

import { userResponseSchema, UserResponseMapper } from './user-response.mapper.js';

export const authResponseSchema = z
  .object({
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresIn: z.number(),
    user: userResponseSchema,
  })
  .openapi('AuthResponse');

export type AuthResponse = z.infer<typeof authResponseSchema>;

export class AuthResponseMapper {
  static toResponse(output: LoginUserOutput): AuthResponse {
    return {
      accessToken: output.accessToken,
      refreshToken: output.rawRefreshToken,
      expiresIn: output.expiresIn,
      user: UserResponseMapper.toResponse(output.user),
    };
  }
}
