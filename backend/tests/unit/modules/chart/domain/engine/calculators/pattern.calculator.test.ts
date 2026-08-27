import { describe, it, expect } from 'vitest';

import { PatternCalculator } from '../../../../../../../src/modules/chart/domain/engine/calculators/pattern.calculator.js';
import { Aspect } from '../../../../../../../src/modules/chart/domain/entities/aspect.entity.js';
import { Planet } from '../../../../../../../src/modules/chart/domain/entities/planet.entity.js';
import {
  PlanetName,
  PlanetCategory,
  AspectType,
} from '../../../../../../../src/modules/chart/domain/types/chart.types.js';
import { ZodiacPosition } from '../../../../../../../src/modules/chart/domain/value-objects/zodiac-position.vo.js';

describe('PatternCalculator', () => {
  it('should always return an empty array (D-14 DEFERRED)', () => {
    // Create some dummy planets and aspects just to satisfy the function signature
    const p1 = Planet.create({
      id: 'p1',
      name: PlanetName.Sun,
      category: PlanetCategory.Personal,
      longitude: 0,
      latitude: 0,
      speed: 1,
      isRetrograde: false,
      zodiacPosition: ZodiacPosition.fromLongitude(0),
      house: 1,
    });

    const p2 = Planet.create({
      id: 'p2',
      name: PlanetName.Moon,
      category: PlanetCategory.Personal,
      longitude: 90,
      latitude: 0,
      speed: 1,
      isRetrograde: false,
      zodiacPosition: ZodiacPosition.fromLongitude(90),
      house: 4,
    });

    const aspect = Aspect.create({
      id: 'a1',
      planetA: PlanetName.Moon,
      planetB: PlanetName.Sun,
      aspectType: AspectType.Square,
      exactAngle: 90,
      orb: 0,
      isApplying: false,
    });

    const result = PatternCalculator.calculate([p1, p2], [aspect]);

    expect(result).toEqual([]);
  });
});
