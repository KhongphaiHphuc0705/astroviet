import { describe, expect, it } from 'vitest';

import {
  LatitudeOutOfRangeError,
  LongitudeOutOfRangeError,
} from '../../../../../../src/modules/birth-profile/domain/errors/birth-profile.errors.js';
import { Coordinates } from '../../../../../../src/modules/birth-profile/domain/value-objects/coordinates.vo.js';

describe('Coordinates Value Object', () => {
  it('1. should create successfully for valid coordinates', () => {
    const coords = Coordinates.create(21.028511, 105.804817);
    expect(coords.latitude).toBe(21.028511);
    expect(coords.longitude).toBe(105.804817);
  });

  it('2. should accept boundary latitudes -90 and 90', () => {
    expect(Coordinates.create(-90, 0).latitude).toBe(-90);
    expect(Coordinates.create(90, 0).latitude).toBe(90);
  });

  it('3. should accept boundary longitudes -180 and 180', () => {
    expect(Coordinates.create(0, -180).longitude).toBe(-180);
    expect(Coordinates.create(0, 180).longitude).toBe(180);
  });

  it('4. should reject latitude < -90 or > 90', () => {
    expect(() => Coordinates.create(-90.0001, 0)).toThrow(LatitudeOutOfRangeError);
    expect(() => Coordinates.create(90.0001, 0)).toThrow(LatitudeOutOfRangeError);
  });

  it('5. should reject longitude < -180 or > 180', () => {
    expect(() => Coordinates.create(0, -180.0001)).toThrow(LongitudeOutOfRangeError);
    expect(() => Coordinates.create(0, 180.0001)).toThrow(LongitudeOutOfRangeError);
  });

  it('6. should reject NaN and Infinity', () => {
    expect(() => Coordinates.create(NaN, 0)).toThrow(LatitudeOutOfRangeError);
    expect(() => Coordinates.create(0, NaN)).toThrow(LongitudeOutOfRangeError);
    expect(() => Coordinates.create(Infinity, 0)).toThrow(LatitudeOutOfRangeError);
    expect(() => Coordinates.create(0, -Infinity)).toThrow(LongitudeOutOfRangeError);
  });

  it('6b. should reject non-number types', () => {
    expect(() => Coordinates.create('21' as any, 105)).toThrow(LatitudeOutOfRangeError);
    expect(() => Coordinates.create(21, '105' as any)).toThrow(LongitudeOutOfRangeError);
  });

  it('7. should accept coordinates near poles (e.g. 89.9)', () => {
    const coords = Coordinates.create(89.9, 0);
    expect(coords.latitude).toBe(89.9);
  });

  it('8. equals should return true for identical coordinates', () => {
    const c1 = Coordinates.create(21.0, 105.0);
    const c2 = Coordinates.create(21.0, 105.0);
    expect(c1.equals(c2)).toBe(true);
  });

  it('9. equals should return false for different coordinates', () => {
    const c1 = Coordinates.create(21.0, 105.0);
    const c2 = Coordinates.create(21.0, 105.1);
    expect(c1.equals(c2)).toBe(false);
  });
});
