import { Chart } from '../entities/chart.entity.js';
import {
  HouseNumber,
  InterpretationSubjectRef,
  MVP_INTERPRETATION_PLANETS,
} from '../types/interpretation.types.js';
import { ZodiacPosition } from '../value-objects/zodiac-position.vo.js';

import {
  buildAngleInSignKey,
  buildPlanetInHouseKey,
  buildPlanetInSignKey,
} from './interpretation-subject-key.js';

export function deriveInterpretationSubjects(
  chart: Pick<Chart, 'planets' | 'angles' | 'isHouseDataAvailable'>,
): InterpretationSubjectRef[] {
  const subjects: InterpretationSubjectRef[] = [];

  // 1. PlanetInSign
  for (const mvpPlanet of MVP_INTERPRETATION_PLANETS) {
    const planet = chart.planets.find((p) => p.name === mvpPlanet);
    if (planet) {
      subjects.push(
        Object.freeze({
          subjectType: 'PlanetInSign',
          subjectKey: buildPlanetInSignKey(mvpPlanet, planet.zodiacPosition.sign),
        }),
      );
    }
  }

  // 2. AngleInSign (Ascendant)
  const ascendant = chart.angles.find((a) => a.type === 'Ascendant');
  if (ascendant) {
    const sign = ZodiacPosition.fromLongitude(ascendant.longitude).sign;
    subjects.push(
      Object.freeze({
        subjectType: 'AngleInSign',
        subjectKey: buildAngleInSignKey('Ascendant', sign),
      }),
    );
  }

  // 3. PlanetInHouse
  if (chart.isHouseDataAvailable) {
    for (const mvpPlanet of MVP_INTERPRETATION_PLANETS) {
      const planet = chart.planets.find((p) => p.name === mvpPlanet);
      if (planet && planet.house !== null) {
        subjects.push(
          Object.freeze({
            subjectType: 'PlanetInHouse',
            subjectKey: buildPlanetInHouseKey(mvpPlanet, planet.house as HouseNumber),
          }),
        );
      }
    }
  }

  return subjects;
}
