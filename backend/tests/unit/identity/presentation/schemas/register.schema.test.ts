import { describe, it, expect } from 'vitest';

import { registerSchema } from '../../../../../src/modules/identity/presentation/schemas/register.schema.js';

describe('Register Schema Validation', () => {
  it('should pass with 8 characters password', () => {
    const payload = {
      email: 'test@example.com',
      password: 'Passw0rd', // exactly 8 chars
      displayName: 'Test',
    };
    const result = registerSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should fail with 7 characters password', () => {
    const payload = {
      email: 'test@example.com',
      password: 'Passw0r', // 7 chars
      displayName: 'Test',
    };
    const result = registerSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Mật khẩu phải có ít nhất 8 ký tự');
    }
  });

  it('should pass with exactly 72 characters password', () => {
    const payload = {
      email: 'test@example.com',
      password: 'a'.repeat(71) + '1', // 72 chars, 1 digit
      displayName: 'Test',
    };
    const result = registerSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should fail with 73 characters password', () => {
    const payload = {
      email: 'test@example.com',
      password: 'a'.repeat(72) + '1', // 73 chars
      displayName: 'Test',
    };
    const result = registerSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Mật khẩu quá dài (tối đa 72 ký tự)');
    }
  });

  it('should fail with empty string fields', () => {
    const payload = {
      email: '',
      password: '',
      displayName: '',
    };
    const result = registerSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('should fail with whitespace-only password', () => {
    const payload = {
      email: 'test@example.com',
      password: '        ', // 8 spaces
      displayName: 'Test',
    };
    const result = registerSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      // Passes min(8) but fails regex(/\d/)
      expect(result.error.issues[0].message).toBe('Mật khẩu phải có ít nhất 1 chữ số');
    }
  });

  it('should handle unicode characters correctly in displayName', () => {
    const payload = {
      email: 'test@example.com',
      password: 'StrongPassword1',
      displayName: 'Nguyễn Văn A', // Tiếng Việt có dấu
    };
    const result = registerSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});
