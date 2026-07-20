import { IRefreshTokenRepository } from '../../domain/ports/refresh-token-repository.port.js';
import { ITokenProvider } from '../../domain/ports/token-provider.port.js';

export interface LogoutCommand {
  rawRefreshToken?: string;
}

export class LogoutUserUseCase {
  constructor(
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly tokenProvider: ITokenProvider,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    const { rawRefreshToken } = command;

    if (!rawRefreshToken) {
      return;
    }

    const tokenHash = this.tokenProvider.hashRefreshToken(rawRefreshToken);
    await this.refreshTokenRepo.revoke(tokenHash, new Date());
  }
}
