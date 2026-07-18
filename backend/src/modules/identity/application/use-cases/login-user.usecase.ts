import { RefreshToken } from '../../domain/entities/refresh-token.entity.js';
import { User } from '../../domain/entities/user.entity.js';
import { IPasswordHasher } from '../../domain/ports/password-hasher.port.js';
import { IRefreshTokenRepository } from '../../domain/ports/refresh-token-repository.port.js';
import { ITokenProvider } from '../../domain/ports/token-provider.port.js';
import { IUserRepository } from '../../domain/ports/user-repository.port.js';
import { AuthenticationError } from '../../../../shared/errors/app-error.js';
import { ErrorCode } from '../../../../shared/errors/error-codes.js';

export interface LoginCommand {
  email: string;
  password: string;
  ipAddress?: string;
}

export interface LoginUserOutput {
  user: User;
  accessToken: string;
  rawRefreshToken: string;
  expiresIn: number;
}

// A pre-computed bcrypt hash of a random string with cost 12.
// Used to mitigate timing attacks by ensuring passwordHasher.verify() takes roughly the same time
// even if the user is not found.
const DUMMY_HASH = '$2b$12$KkQhK2Q1rXj1R4v9h3bMWeZ5W4y9r5q2h8Y4b3q3h8Y4b3q3h8Y4b';

export class LoginUserUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenProvider: ITokenProvider,
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly accessTokenTtlSeconds: number,
  ) {}

  async execute(command: LoginCommand): Promise<LoginUserOutput> {
    const user = await this.userRepo.findByEmail(command.email);

    // Timing attack mitigation: Always verify the password against a hash.
    const hashToVerify = user ? user.passwordHash : DUMMY_HASH;
    const isPasswordValid = await this.passwordHasher.verify(command.password, hashToVerify);

    // If user doesn't exist OR password is invalid, return the exact same generic error.
    if (!user || !isPasswordValid) {
      throw new AuthenticationError(
        'Email hoặc mật khẩu không chính xác.',
        ErrorCode.INVALID_CREDENTIALS,
      );
    }

    // Generate access token
    const accessToken = await this.tokenProvider.generateAccessToken({
      sub: user.id,
      role: user.role,
    });

    // Generate refresh token
    const refreshTokenData = await this.tokenProvider.generateRefreshToken();

    // Persist refresh token
    const refreshTokenEntity: RefreshToken = {
      id: crypto.randomUUID(),
      userId: user.id,
      tokenHash: refreshTokenData.tokenHash,
      issuedAt: new Date(),
      expiresAt: refreshTokenData.expiresAt,
      revokedAt: null,
      replacedByTokenId: null,
      createdByIp: command.ipAddress ?? null,
    };

    await this.refreshTokenRepo.create(refreshTokenEntity);

    return {
      user,
      accessToken,
      rawRefreshToken: refreshTokenData.rawToken,
      expiresIn: this.accessTokenTtlSeconds,
    };
  }
}
