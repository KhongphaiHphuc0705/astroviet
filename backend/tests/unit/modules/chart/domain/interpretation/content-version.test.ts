import { describe, expect, it } from 'vitest';

import { InvalidContentVersionError } from '../../../../../../src/modules/chart/domain/errors/chart.errors.js';
import {
  compareContentVersion,
  isValidContentVersion,
} from '../../../../../../src/modules/chart/domain/interpretation/content-version.js';

describe('Content Version Utilities', () => {
  describe('isValidContentVersion', () => {
    it.each([['1'], ['1.0'], ['2.10'], ['1.0.1'], ['10.0'], ['0.1'], ['1.9007199254740993']])(
      'should return true for valid version: %s',
      (value) => {
        expect(isValidContentVersion(value)).toBe(true);
      },
    );

    it.each([
      [''],
      [' '],
      [' 1.0'],
      ['1.0 '],
      ['1.0\n'],
      ['v1.0'],
      ['1.'],
      ['.1'],
      ['1..0'],
      ['1.0-beta'],
      ['01.0'],
      ['-1.0'],
      ['1.a'],
      [null as any],
      [undefined as any],
      [1.0 as any],
    ])('should return false for invalid version: %s', (value) => {
      expect(isValidContentVersion(value)).toBe(false);
    });
  });

  describe('compareContentVersion', () => {
    it.each([
      // a < b => -1
      ['1.0', '2.0', -1],
      ['1.9', '1.10', -1],
      ['1.0', '1.0.1', -1],
      ['9.99', '10.0', -1],
      ['1.9007199254740992', '1.9007199254740993', -1],

      // a > b => 1
      ['2.0', '1.10', 1],
      ['1.10', '1.9', 1],
      ['1.0.1', '1.0', 1],
      ['10.0', '9.99', 1],
      ['1.9007199254740993', '1.9007199254740992', 1],

      // a === b => 0
      ['1.0', '1.0', 0],
      ['1', '1.0', 0],
      ['1.0.0', '1.0', 0],
      ['2.10', '2.10', 0],
    ] as const)('compareContentVersion(%s, %s) should return %s', (a, b, expected) => {
      expect(compareContentVersion(a, b)).toBe(expected);
    });

    it('should be antisymmetric', () => {
      expect(compareContentVersion('1.9', '1.10')).toBe(-1);
      expect(compareContentVersion('1.10', '1.9')).toBe(1);
    });

    it('should be usable as a sort comparator', () => {
      const versions = ['2.0', '1.0', '1.10', '1.9', '10.0', '1.0.1', '1'];
      // '1.0' and '1' are equal, stable sort keeps their relative original order ('1.0' before '1')
      const expectedSorted = ['1.0', '1', '1.0.1', '1.9', '1.10', '2.0', '10.0'];
      const sorted = [...versions].sort(compareContentVersion);
      expect(sorted).toEqual(expectedSorted);
    });

    it('should throw InvalidContentVersionError if either version is invalid', () => {
      expect(() => compareContentVersion('1.0', 'invalid')).toThrow(InvalidContentVersionError);
      expect(() => compareContentVersion('invalid', '1.0')).toThrow(InvalidContentVersionError);
      expect(() => compareContentVersion('01.0', '2.0')).toThrow(InvalidContentVersionError);
    });
  });
});
