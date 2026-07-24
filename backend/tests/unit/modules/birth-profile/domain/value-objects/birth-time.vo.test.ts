import { describe, expect, it } from 'vitest';
import { InvalidBirthTimeError } from '../../../../../../src/modules/birth-profile/domain/errors/birth-profile.errors.js';
import { BirthTime } from '../../../../../../src/modules/birth-profile/domain/value-objects/birth-time.vo.js';

describe('BirthTime Value Object', () => {
  it('1. should create successfully for valid times', () => {
    const time = BirthTime.create('14:30:45');
    expect(time.hour).toBe(14);
    expect(time.minute).toBe(30);
    expect(time.second).toBe(45);
  });

  it('2. should accept boundary time 00:00:00', () => {
    const time = BirthTime.create('00:00:00');
    expect(time.hour).toBe(0);
    expect(time.minute).toBe(0);
    expect(time.second).toBe(0);
  });

  it('3. should accept boundary time 23:59:59', () => {
    const time = BirthTime.create('23:59:59');
    expect(time.hour).toBe(23);
    expect(time.minute).toBe(59);
    expect(time.second).toBe(59);
  });

  it('4. should reject hour > 23', () => {
    expect(() => BirthTime.create('24:00:00')).toThrow(InvalidBirthTimeError);
  });

  it('5. should reject minute > 59', () => {
    expect(() => BirthTime.create('12:60:00')).toThrow(InvalidBirthTimeError);
  });

  it('6. should reject second > 59', () => {
    expect(() => BirthTime.create('12:00:60')).toThrow(InvalidBirthTimeError);
  });

  it('7. should reject invalid formats', () => {
    expect(() => BirthTime.create('12-00-00')).toThrow(InvalidBirthTimeError);
    expect(() => BirthTime.create('12:0:0')).toThrow(InvalidBirthTimeError);
    expect(() => BirthTime.create('abc')).toThrow(InvalidBirthTimeError);
    expect(() => BirthTime.create('')).toThrow(InvalidBirthTimeError);
  });

  it('8. equals should return true for identical times', () => {
    const t1 = BirthTime.create('12:30:00');
    const t2 = BirthTime.create('12:30:00');
    expect(t1.equals(t2)).toBe(true);
  });

  it('9. equals should return false for different times', () => {
    const t1 = BirthTime.create('12:30:00');
    const t2 = BirthTime.create('12:30:01');
    expect(t1.equals(t2)).toBe(false);
  });
});
