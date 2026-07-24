import { describe, expect, it } from 'vitest';

import { InvalidBirthLocationError } from '../../../../../../src/modules/birth-profile/domain/errors/birth-profile.errors.js';
import { BirthLocation } from '../../../../../../src/modules/birth-profile/domain/value-objects/birth-location.vo.js';
import { Coordinates } from '../../../../../../src/modules/birth-profile/domain/value-objects/coordinates.vo.js';
import { Timezone } from '../../../../../../src/modules/birth-profile/domain/value-objects/timezone.vo.js';

describe('BirthLocation Value Object', () => {
  const validCoords = Coordinates.create(21.028511, 105.804817);
  const validTimezone = Timezone.create('Asia/Ho_Chi_Minh');

  it('1. should create successfully with valid inputs', () => {
    const loc = BirthLocation.create('Hanoi', validCoords, validTimezone);
    expect(loc.placeName).toBe('Hanoi');
    expect(loc.coordinates).toBe(validCoords);
    expect(loc.timezone).toBe(validTimezone);
  });

  it('2. should trim whitespace from placeName', () => {
    const loc = BirthLocation.create('  Hanoi, Vietnam  ', validCoords, validTimezone);
    expect(loc.placeName).toBe('Hanoi, Vietnam');
  });

  it('3. should reject empty placeName', () => {
    expect(() => BirthLocation.create('', validCoords, validTimezone)).toThrow(
      InvalidBirthLocationError,
    );
    expect(() => BirthLocation.create('   ', validCoords, validTimezone)).toThrow(
      InvalidBirthLocationError,
    );
  });

  it('4. equals should return true for identical locations', () => {
    const loc1 = BirthLocation.create('Hanoi', validCoords, validTimezone);
    const loc2 = BirthLocation.create('Hanoi', validCoords, validTimezone);
    expect(loc1.equals(loc2)).toBe(true);
  });

  it('5. equals should return false for different placeNames', () => {
    const loc1 = BirthLocation.create('Hanoi', validCoords, validTimezone);
    const loc2 = BirthLocation.create('Ho Chi Minh City', validCoords, validTimezone);
    expect(loc1.equals(loc2)).toBe(false);
  });

  it('6. equals should return false for different coordinates', () => {
    const loc1 = BirthLocation.create('Hanoi', validCoords, validTimezone);
    const otherCoords = Coordinates.create(10.762622, 106.660172);
    const loc2 = BirthLocation.create('Hanoi', otherCoords, validTimezone);
    expect(loc1.equals(loc2)).toBe(false);
  });

  it('7. equals should return false for different timezones', () => {
    const loc1 = BirthLocation.create('Hanoi', validCoords, validTimezone);
    const otherTimezone = Timezone.create('UTC');
    const loc2 = BirthLocation.create('Hanoi', validCoords, otherTimezone);
    expect(loc1.equals(loc2)).toBe(false);
  });
});
