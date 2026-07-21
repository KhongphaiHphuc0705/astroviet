import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'node:crypto';

import { ConsoleEmailVerificationAdapter } from '../../../../../src/modules/identity/infrastructure/adapters/console-email-verification.adapter.js';
import { User } from '../../../../../src/modules/identity/domain/entities/user.entity.js';
import { ILogger } from '../../../../../src/shared/logger/logger.interface.js';

describe('ConsoleEmailVerificationAdapter', () => {
  let mockLogger: {
    info: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    debug: ReturnType<typeof vi.fn>;
  };
  let adapter: ConsoleEmailVerificationAdapter;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };
    adapter = new ConsoleEmailVerificationAdapter(mockLogger as unknown as ILogger);
  });

  it('should log the formatted verification email message', async () => {
    const mockUser: User = {
      id: 'test-user-id',
      email: 'test@example.com',
      passwordHash: 'hash',
      displayName: 'Test',
      role: 'user',
      emailVerifiedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      version: 1,
    };

    // We can spy on crypto.randomUUID to ensure predictability, but since we just assert expect.stringContaining we might not need to.
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-0000-0000-000000000000');

    await adapter.sendVerification(mockUser);

    expect(mockLogger.info).toHaveBeenCalledTimes(1);

    const callArgs = mockLogger.info.mock.calls[0];
    const message = callArgs[0] as string;
    const context = callArgs[1] as Record<string, unknown>;

    expect(message).toContain('EMAIL VERIFICATION (DEV ONLY)');
    expect(message).toContain('test@example.com');
    expect(message).toContain('00000000-0000-0000-0000-000000000000');

    expect(context).toMatchObject({
      module: 'identity',
      action: 'email_verification_placeholder',
      userId: 'test-user-id',
      email: 'test@example.com',
    });
    
    vi.restoreAllMocks();
  });
});
