import { describe, expect, it } from 'vitest';

import { Angle } from '../../../../../../src/modules/chart/domain/entities/angle.entity.js';
import { Planet } from '../../../../../../src/modules/chart/domain/entities/planet.entity.js';
import { deriveInterpretationSubjects } from '../../../../../../src/modules/chart/domain/interpretation/derive-interpretation-subjects.js';
import {
  PlanetName,
  ZodiacSign,
} from '../../../../../../src/modules/chart/domain/types/chart.types.js';

describe('deriveInterpretationSubjects', () => {
  const createMockPlanet = (name: PlanetName, sign: ZodiacSign, house: number | null): Planet => {
    return {
      name,
      zodiacPosition: { sign },
      house,
    } as any;
  };

  const createMockAngle = (type: string, longitude: number): Angle => {
    return {
      type,
      longitude,
    } as any;
  };

  it('should derive 21 subjects for a full chart in correct order', () => {
    const planets = [
      createMockPlanet(PlanetName.Sun, 'Leo', 7),
      createMockPlanet(PlanetName.Moon, 'Cancer', 6),
      createMockPlanet(PlanetName.Mercury, 'Virgo', 8),
      createMockPlanet(PlanetName.Venus, 'Libra', 9),
      createMockPlanet(PlanetName.Mars, 'Aries', 1),
      createMockPlanet(PlanetName.Jupiter, 'Sagittarius', 3),
      createMockPlanet(PlanetName.Saturn, 'Capricorn', 4),
      createMockPlanet(PlanetName.Uranus, 'Aquarius', 5),
      createMockPlanet(PlanetName.Neptune, 'Pisces', 6),
      createMockPlanet(PlanetName.Pluto, 'Scorpio', 2),
      // Optional planets should be ignored
      createMockPlanet(PlanetName.Chiron, 'Aries', 1),
    ];

    const angles = [
      createMockAngle('Ascendant', 120), // Leo (120-149.999)
      createMockAngle('Midheaven', 30),
    ];

    const chart = {
      planets,
      angles,
      isHouseDataAvailable: true,
    };

    const subjects = deriveInterpretationSubjects(chart as any);

    expect(subjects).toHaveLength(21); // 10 signs + 1 angle + 10 houses

    // Verify ordering
    expect(subjects[0]).toEqual({ subjectType: 'PlanetInSign', subjectKey: 'Sun_in_Leo' });
    expect(subjects[9]).toEqual({ subjectType: 'PlanetInSign', subjectKey: 'Pluto_in_Scorpio' });
    expect(subjects[10]).toEqual({ subjectType: 'AngleInSign', subjectKey: 'Ascendant_in_Leo' });
    expect(subjects[11]).toEqual({ subjectType: 'PlanetInHouse', subjectKey: 'Sun_in_House_7' });
    expect(subjects[20]).toEqual({ subjectType: 'PlanetInHouse', subjectKey: 'Pluto_in_House_2' });
  });

  it('should derive only 10 PlanetInSign subjects when house data is not available', () => {
    const planets = [
      createMockPlanet(PlanetName.Sun, 'Leo', null),
      createMockPlanet(PlanetName.Moon, 'Cancer', null),
      createMockPlanet(PlanetName.Mercury, 'Virgo', null),
      createMockPlanet(PlanetName.Venus, 'Libra', null),
      createMockPlanet(PlanetName.Mars, 'Aries', null),
      createMockPlanet(PlanetName.Jupiter, 'Sagittarius', null),
      createMockPlanet(PlanetName.Saturn, 'Capricorn', null),
      createMockPlanet(PlanetName.Uranus, 'Aquarius', null),
      createMockPlanet(PlanetName.Neptune, 'Pisces', null),
      createMockPlanet(PlanetName.Pluto, 'Scorpio', null),
    ];

    const chart = {
      planets,
      angles: [], // No angles
      isHouseDataAvailable: false,
    };

    const subjects = deriveInterpretationSubjects(chart as any);

    expect(subjects).toHaveLength(10);
    expect(subjects.every((s) => s.subjectType === 'PlanetInSign')).toBe(true);
  });

  it('should silently skip PlanetInHouse if planet.house is null even when house data is available', () => {
    const planets = [
      createMockPlanet(PlanetName.Sun, 'Leo', null), // null house
      createMockPlanet(PlanetName.Moon, 'Cancer', 6),
      // Missing other 8 planets for brevity, derive function should just skip missing MVP planets
    ];

    const chart = {
      planets,
      angles: [createMockAngle('Ascendant', 120)],
      isHouseDataAvailable: true,
    };

    const subjects = deriveInterpretationSubjects(chart as any);

    expect(subjects).toHaveLength(4); // SunInSign, MoonInSign, AscendantInSign, MoonInHouse
    expect(subjects).toContainEqual({
      subjectType: 'PlanetInHouse',
      subjectKey: 'Moon_in_House_6',
    });
    expect(subjects.find((s) => s.subjectKey === 'Sun_in_House_null')).toBeUndefined();
  });

  it('should output same sequence regardless of input array order', () => {
    const p1 = createMockPlanet(PlanetName.Sun, 'Leo', 7);
    const p2 = createMockPlanet(PlanetName.Moon, 'Cancer', 6);
    const a1 = createMockAngle('Ascendant', 120);

    const chart1 = { planets: [p1, p2], angles: [a1], isHouseDataAvailable: true };
    const chart2 = { planets: [p2, p1], angles: [a1], isHouseDataAvailable: true };

    const subjects1 = deriveInterpretationSubjects(chart1 as any);
    const subjects2 = deriveInterpretationSubjects(chart2 as any);

    expect(subjects1).toEqual(subjects2);
  });

  it('should handle boundary angle longitudes correctly', () => {
    const testCases = [
      { longitude: 0, expectedSign: 'Aries' },
      { longitude: 119.999, expectedSign: 'Cancer' },
      { longitude: 120, expectedSign: 'Leo' },
      { longitude: 149.999, expectedSign: 'Leo' },
      { longitude: 150, expectedSign: 'Virgo' },
      { longitude: 359.999, expectedSign: 'Pisces' },
    ];

    for (const tc of testCases) {
      const chart = {
        planets: [],
        angles: [createMockAngle('Ascendant', tc.longitude)],
        isHouseDataAvailable: true,
      };

      const subjects = deriveInterpretationSubjects(chart as any);
      expect(subjects).toContainEqual({
        subjectType: 'AngleInSign',
        subjectKey: `Ascendant_in_${tc.expectedSign}`,
      });
    }
  });

  it('should not mutate the input chart', () => {
    const planets = [createMockPlanet(PlanetName.Sun, 'Leo', 7)];
    const chart = { planets, angles: [], isHouseDataAvailable: true };
    Object.freeze(chart);
    Object.freeze(chart.planets);
    Object.freeze(chart.angles);

    expect(() => deriveInterpretationSubjects(chart as any)).not.toThrow();
  });

  it('should return a new array with frozen objects', () => {
    const chart = {
      planets: [createMockPlanet(PlanetName.Sun, 'Leo', 7)],
      angles: [],
      isHouseDataAvailable: true,
    };
    const subjects1 = deriveInterpretationSubjects(chart as any);
    const subjects2 = deriveInterpretationSubjects(chart as any);

    expect(subjects1).not.toBe(subjects2);
    expect(subjects1).toEqual(subjects2);
    expect(Object.isFrozen(subjects1[0])).toBe(true);
  });
});
