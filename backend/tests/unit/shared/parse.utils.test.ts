import { describe, it, expect } from 'vitest';

import { parseNumber, parseBoolean } from '../../../src/shared/utils/parse.utils.js';

describe('Parse Utils', () => {
  describe('parseNumber', () => {
    it('should parse valid number string', () => {
      expect(parseNumber('123', 0)).toBe(123);
    });

    it('should return fallback for invalid number string', () => {
      expect(parseNumber('abc', 42)).toBe(42);
    });

    it('should return fallback for undefined or null or empty', () => {
      expect(parseNumber(undefined, 10)).toBe(10);
      expect(parseNumber(null as unknown as string, 20)).toBe(20);
      expect(parseNumber('', 30)).toBe(30);
    });
  });

  describe('parseBoolean', () => {
    it('should return true for "true" and "1"', () => {
      expect(parseBoolean('true', false)).toBe(true);
      expect(parseBoolean('1', false)).toBe(true);
    });

    it('should return false for "false" and "0"', () => {
      expect(parseBoolean('false', true)).toBe(false);
      expect(parseBoolean('0', true)).toBe(false);
    });

    it('should return false for invalid string', () => {
      expect(parseBoolean('abc', true)).toBe(false);
      expect(parseBoolean('abc', false)).toBe(false);
    });

    it('should return fallback for undefined or null or empty', () => {
      expect(parseBoolean(undefined, true)).toBe(true);
      expect(parseBoolean(null as unknown as string, false)).toBe(false);
      expect(parseBoolean('', true)).toBe(true);
    });
  });
});
