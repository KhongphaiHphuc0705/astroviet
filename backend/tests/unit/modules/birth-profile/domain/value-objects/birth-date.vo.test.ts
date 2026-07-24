import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';

import { InvalidBirthDateError } from '../../../../../../src/modules/birth-profile/domain/errors/birth-profile.errors.js';
import { BirthDate } from '../../../../../../src/modules/birth-profile/domain/value-objects/birth-date.vo.js';

describe('BirthDate Value Object', () => {
  beforeEach(() => {
    // Mock the current date to a fixed point in time for deterministic tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-05-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('1. should create successfully for a valid past date', () => {
    const birthDate = BirthDate.create('1990-01-01');
    expect(birthDate.value.getUTCFullYear()).toBe(1990);
    expect(birthDate.value.getUTCMonth()).toBe(0);
    expect(birthDate.value.getUTCDate()).toBe(1);
  });

  it('2. should reject date >= today (same day)', () => {
    expect(() => BirthDate.create('2024-05-15')).toThrow(InvalidBirthDateError);
  });

  it('2. should reject date > today (future)', () => {
    expect(() => BirthDate.create('2024-05-16')).toThrow(InvalidBirthDateError);
  });

  it('3. should accept very old dates (no lower bound)', () => {
    const birthDate = BirthDate.create('1200-01-01');
    expect(birthDate.value.getUTCFullYear()).toBe(1200);
  });

  it('4. should reject invalid date format', () => {
    expect(() => BirthDate.create('invalid-date')).toThrow(InvalidBirthDateError);
  });

  it('5. should correctly handle leap years', () => {
    // 2000 is a leap year
    const leapYearDate = BirthDate.create('2000-02-29');
    expect(leapYearDate.value.getUTCDate()).toBe(29);
    expect(leapYearDate.value.getUTCMonth()).toBe(1);
  });

  it('6. should reject invalid leap year dates', () => {
    // 2001 is NOT a leap year. Date parser might wrap to March 1st or reject.
    // In JS Date, '2001-02-29' wraps to '2001-03-01', which is mathematically a valid Date object.
    // However, since we're using strict Gregorian calendar semantics in our tests, we should check how Date handles it.
    // Actually, `new Date('2001-02-29')` results in 'NaN' in some parsers, or 'March 1' in others.
    // If it's NaN, it throws. Let's see what happens.
    // Wait, `new Date('2001-02-29')` returns Invalid Date in strict ISO format.
    expect(() => BirthDate.create('2001-02-29')).toThrow(InvalidBirthDateError);
  });

  it('7. equals should return true for same date', () => {
    const d1 = BirthDate.create('1990-01-01');
    const d2 = BirthDate.create('1990-01-01');
    expect(d1.equals(d2)).toBe(true);
  });

  it('8. equals should return false for different date', () => {
    const d1 = BirthDate.create('1990-01-01');
    const d2 = BirthDate.create('1990-01-02');
    expect(d1.equals(d2)).toBe(false);
  });

  it('9. should return a copy of the date to prevent mutation (immutability)', () => {
    const birthDate = BirthDate.create('1990-01-01');
    const value = birthDate.value;
    value.setUTCFullYear(2000);

    // Original instance should remain unchanged
    expect(birthDate.value.getUTCFullYear()).toBe(1990);
  });
});
