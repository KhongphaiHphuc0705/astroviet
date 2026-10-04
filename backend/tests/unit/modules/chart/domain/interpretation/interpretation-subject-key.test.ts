import { describe, expect, it } from 'vitest';

import { InvalidInterpretationSubjectKeyError } from '../../../../../../src/modules/chart/domain/errors/chart.errors.js';
import {
  buildAngleInSignKey,
  buildPlanetInHouseKey,
  buildPlanetInSignKey,
  isValidInterpretationSubjectKey,
} from '../../../../../../src/modules/chart/domain/interpretation/interpretation-subject-key.js';
import { PlanetName } from '../../../../../../src/modules/chart/domain/types/chart.types.js';

describe('Interpretation Subject Key Grammar', () => {
  describe('isValidInterpretationSubjectKey', () => {
    it.each([
      ['PlanetInSign', 'Sun_in_Leo'],
      ['PlanetInSign', 'Moon_in_Aries'],
      ['PlanetInSign', 'Venus_in_Virgo'],
      ['PlanetInHouse', 'Sun_in_House_1'],
      ['PlanetInHouse', 'Venus_in_House_7'],
      ['PlanetInHouse', 'Saturn_in_House_10'],
      ['AngleInSign', 'Ascendant_in_Leo'],
      ['AngleInSign', 'Ascendant_in_Aries'],
      // Edge cases
      ['PlanetInHouse', 'Sun_in_House_12'],
      ['PlanetInSign', 'Sun_in_Pisces'],
      ['PlanetInSign', 'Pluto_in_Aries'],
    ] as const)('should return true for valid key %s - %s', (type, key) => {
      expect(isValidInterpretationSubjectKey(type, key)).toBe(true);
    });

    it.each([
      ['PlanetInHouse', 'Sun_in_house_7'],
      ['PlanetInHouse', 'Sun_House_7'],
      ['AngleInSign', 'Ascendant_in_House_1'],
      ['PlanetInSign', 'UnknownPlanet_in_Leo'],
      ['PlanetInSign', 'Sun_in_UnknownSign'],
      ['PlanetInHouse', 'Sun_in_House_0'],
      ['PlanetInHouse', 'Sun_in_House_13'],
      ['PlanetInHouse', 'Sun_in_House_07'],
      ['PlanetInSign', 'Chiron_in_Leo'],
      ['PlanetInSign', 'NorthNode_in_Leo'],
      ['PlanetInSign', ''],
      ['PlanetInSign', ' Sun_in_Leo '],
      ['PlanetInSign', 'Ascendant_in_Leo'], // Ascendant with PlanetInSign
      ['AngleInSign', 'Sun_in_Leo'], // Sun with AngleInSign
      ['Aspect', 'Sun_Square_Moon'], // Non-MVP
      ['PatternType', 'GrandTrine'], // Non-MVP
    ] as const)('should return false for invalid key %s - %s', (type, key) => {
      expect(isValidInterpretationSubjectKey(type, key)).toBe(false);
    });
  });

  describe('Builders', () => {
    it('should build PlanetInSign key correctly', () => {
      expect(buildPlanetInSignKey(PlanetName.Sun, 'Leo')).toBe('Sun_in_Leo');
    });

    it('should throw InvalidInterpretationSubjectKeyError for invalid PlanetInSign inputs', () => {
      expect(() => buildPlanetInSignKey('Chiron' as any, 'Leo')).toThrow(
        InvalidInterpretationSubjectKeyError,
      );
      expect(() => buildPlanetInSignKey(PlanetName.Sun, 'Unknown' as any)).toThrow(
        InvalidInterpretationSubjectKeyError,
      );
    });

    it('should build PlanetInHouse key correctly', () => {
      expect(buildPlanetInHouseKey(PlanetName.Sun, 7)).toBe('Sun_in_House_7');
    });

    it('should throw InvalidInterpretationSubjectKeyError for invalid PlanetInHouse inputs', () => {
      expect(() => buildPlanetInHouseKey('NorthNode' as any, 7)).toThrow(
        InvalidInterpretationSubjectKeyError,
      );
      expect(() => buildPlanetInHouseKey(PlanetName.Sun, 13 as any)).toThrow(
        InvalidInterpretationSubjectKeyError,
      );
      expect(() => buildPlanetInHouseKey(PlanetName.Sun, 0 as any)).toThrow(
        InvalidInterpretationSubjectKeyError,
      );
      expect(() => buildPlanetInHouseKey(PlanetName.Sun, 1.5 as any)).toThrow(
        InvalidInterpretationSubjectKeyError,
      );
    });

    it('should build AngleInSign key correctly', () => {
      expect(buildAngleInSignKey('Ascendant', 'Leo')).toBe('Ascendant_in_Leo');
    });

    it('should throw InvalidInterpretationSubjectKeyError for invalid AngleInSign inputs', () => {
      expect(() => buildAngleInSignKey('Midheaven' as any, 'Leo')).toThrow(
        InvalidInterpretationSubjectKeyError,
      );
      expect(() => buildAngleInSignKey('Ascendant', 'Unknown' as any)).toThrow(
        InvalidInterpretationSubjectKeyError,
      );
    });
  });
});
