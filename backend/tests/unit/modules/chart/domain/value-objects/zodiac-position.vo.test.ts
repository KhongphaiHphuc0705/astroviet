import { describe, it, expect } from 'vitest';

import { ZodiacPosition } from '../../../../../../src/modules/chart/domain/value-objects/zodiac-position.vo.js';

describe('ZodiacPosition VO', () => {
  it('should create correctly at boundary longitude = 0 (Aries 0)', () => {
    const position = ZodiacPosition.fromLongitude(0);
    expect(position.longitude).toBe(0);
    expect(position.sign).toBe('Aries');
    expect(position.degreeInSign).toBe(0);
  });

  it('should create correctly at longitude = 29.999 (Aries 29.999)', () => {
    const position = ZodiacPosition.fromLongitude(29.999);
    expect(position.longitude).toBeCloseTo(29.999);
    expect(position.sign).toBe('Aries');
    expect(position.degreeInSign).toBeCloseTo(29.999);
  });

  it('should create correctly at boundary longitude = 30 (Taurus 0)', () => {
    const position = ZodiacPosition.fromLongitude(30);
    expect(position.longitude).toBe(30);
    expect(position.sign).toBe('Taurus');
    expect(position.degreeInSign).toBe(0);
  });

  it('should create correctly at longitude = 359.999 (Pisces 29.999)', () => {
    const position = ZodiacPosition.fromLongitude(359.999);
    expect(position.longitude).toBeCloseTo(359.999);
    expect(position.sign).toBe('Pisces');
    expect(position.degreeInSign).toBeCloseTo(29.999);
  });

  it('should normalize longitude >= 360 (e.g. 375 -> Aries 15)', () => {
    const position = ZodiacPosition.fromLongitude(375);
    expect(position.longitude).toBe(15);
    expect(position.sign).toBe('Aries');
    expect(position.degreeInSign).toBe(15);
  });

  it('should normalize negative longitude (e.g. -15 -> Pisces 15)', () => {
    const position = ZodiacPosition.fromLongitude(-15);
    expect(position.longitude).toBe(345);
    expect(position.sign).toBe('Pisces');
    expect(position.degreeInSign).toBe(15);
  });

  it('should be immutable (no setters)', () => {
    const position = ZodiacPosition.fromLongitude(10);
    // Object is frozen, so setting it should throw a TypeError in strict mode
    expect(() => {
      (position as any)._longitude = 20;
    }).toThrow(TypeError);

    // Test getters
    expect(position.longitude).toBe(10);
  });
});
