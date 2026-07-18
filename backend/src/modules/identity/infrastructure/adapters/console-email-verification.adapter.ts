import crypto from 'node:crypto';

import { ILogger } from '../../../../shared/logger/logger.interface.js';
import { User } from '../../domain/entities/user.entity.js';
import { IEmailVerificationService } from '../../domain/ports/email-verification.port.js';

export class ConsoleEmailVerificationAdapter implements IEmailVerificationService {
  constructor(private readonly logger: ILogger) {}

  async sendVerification(user: User): Promise<void> {
    const placeholderToken = crypto.randomUUID();
    this.logger.info(
      `[PLACEHOLDER] Verification link would be sent with token: ${placeholderToken}`,
      {
        module: 'identity',
        action: 'email_verification_placeholder',
        userId: user.id,
      },
    );
  }
}
