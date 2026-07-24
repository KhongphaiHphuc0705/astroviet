import { describe, expect, it } from 'vitest';
import { InvalidTimezoneError } from '../../../../../../src/modules/birth-profile/domain/errors/birth-profile.errors.js';
import { Timezone } from '../../../../../../src/modules/birth-profile/domain/value-objects/timezone.vo.js';

describe('Timezone Value Object', () => {
  it('1. should create successfully for a valid IANA timezone', () => {
    const tz = Timezone.create('Asia/Ho_Chi_Minh');
    expect(tz.value).toBe('Asia/Ho_Chi_Minh');
  });

  it('2. should accept UTC timezone', () => {
    const tz = Timezone.create('UTC');
    expect(tz.value).toBe('UTC');
  });

  it('3. should reject non-existent timezones', () => {
    expect(() => Timezone.create('Asia/Fake_City')).toThrow(InvalidTimezoneError);
    expect(() => Timezone.create('Invalid/Timezone')).toThrow(InvalidTimezoneError);
  });

  it('4. should reject fixed offsets', () => {
    expect(() => Timezone.create('+07:00')).toThrow(InvalidTimezoneError);
    expect(() => Timezone.create('-05:00')).toThrow(InvalidTimezoneError);
  });

  it('5. should reject empty or whitespace strings', () => {
    expect(() => Timezone.create('')).toThrow(InvalidTimezoneError);
    expect(() => Timezone.create('   ')).toThrow(InvalidTimezoneError);
  });

  it('6. should trim whitespace before validation', () => {
    const tz = Timezone.create('  Asia/Tokyo  ');
    expect(tz.value).toBe('Asia/Tokyo');
  });

  it('7. equals should return true for identical timezones', () => {
    const tz1 = Timezone.create('Europe/London');
    const tz2 = Timezone.create('Europe/London');
    expect(tz1.equals(tz2)).toBe(true);
  });

  it('8. equals should return false for different timezones', () => {
    const tz1 = Timezone.create('Europe/London');
    const tz2 = Timezone.create('Europe/Paris');
    expect(tz1.equals(tz2)).toBe(false);
  });
});
