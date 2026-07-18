// eslint-disable-next-line import/no-named-as-default-member
import bcrypt from 'bcrypt';
import { describe, it, expect, vi } from 'vitest';

import { BcryptPasswordHasherAdapter } from '../../../src/modules/identity/infrastructure/adapters/bcrypt-password-hasher.adapter.js';
import { InfrastructureError } from '../../../src/shared/errors/app-error.js';

describe('BcryptPasswordHasherAdapter', () => {
  const hasher = new BcryptPasswordHasherAdapter();

  describe('hash()', () => {
    it('should return a valid bcrypt hash with prefix $2b$', async () => {
      const plain = 'my-secret-password';
      const result = await hasher.hash(plain);

      expect(result).not.toBe(plain);
      expect(result.startsWith('$2b$')).toBe(true);
    });

    it('should generate different hashes for the same password due to salting', async () => {
      const plain = 'my-secret-password';
      const hash1 = await hasher.hash(plain);
      const hash2 = await hasher.hash(plain);

      expect(hash1).not.toBe(hash2);
    });

    it('should throw InfrastructureError if bcrypt.hash throws', async () => {
      // Create a mock implementation without using any
      vi.spyOn(bcrypt, 'hash').mockRejectedValueOnce(new Error('bcrypt error') as never);

      await expect(hasher.hash('password')).rejects.toThrow(InfrastructureError);

      vi.restoreAllMocks();
    });
  });

  describe('verify()', () => {
    it('should return true for correct password', async () => {
      const plain = 'correct-password';
      const hash = await hasher.hash(plain);

      const isValid = await hasher.verify(plain, hash);
      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const hash = await hasher.hash('correct-password');

      const isValid = await hasher.verify('wrong-password', hash);
      expect(isValid).toBe(false);
    });

    it('should return false when hash is corrupted or invalid without throwing', async () => {
      const isValid = await hasher.verify('password', 'invalid-hash-format');
      expect(isValid).toBe(false);
    });
  });
});
