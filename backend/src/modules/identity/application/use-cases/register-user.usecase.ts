import crypto from 'node:crypto';

import { ConflictError, UniqueConstraintError } from '../../../../shared/errors/app-error.js';
import { ErrorCode } from '../../../../shared/errors/error-codes.js';
import { ILogger } from '../../../../shared/logger/logger.interface.js';
import { User } from '../../domain/entities/user.entity.js';
import { IEmailVerificationService } from '../../domain/ports/email-verification.port.js';
import { IPasswordHasher } from '../../domain/ports/password-hasher.port.js';
import { IUserRepository } from '../../domain/ports/user-repository.port.js';

export interface RegisterCommand {
  email: string;
  password: string;
  displayName?: string;
}

export interface RegisterUserOutput {
  user: User;
}

export class RegisterUserUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly emailVerificationService: IEmailVerificationService,
    private readonly logger: ILogger,
  ) {}

  async execute(command: RegisterCommand): Promise<RegisterUserOutput> {
    const isDuplicate = await this.userRepo.existsByEmail(command.email);
    if (isDuplicate) {
      throw new ConflictError(ErrorCode.EMAIL_ALREADY_EXISTS, 'Email đã được sử dụng');
    }

    const passwordHash = await this.passwordHasher.hash(command.password);

    const user: User = {
      id: crypto.randomUUID(),
      email: command.email,
      passwordHash,
      displayName: command.displayName ?? null,
      role: 'user',
      emailVerifiedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      version: 0,
    };

    try {
      await this.userRepo.create(user);
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new ConflictError(ErrorCode.EMAIL_ALREADY_EXISTS, 'Email đã được sử dụng');
      }
      throw error;
    }

    try {
      await this.emailVerificationService.sendVerification(user);
    } catch (error) {
      this.logger.warn('Failed to send email verification placeholder', {
        userId: user.id,
        error: error instanceof Error ? error.message : error,
      });
    }

    return { user };
  }
}
