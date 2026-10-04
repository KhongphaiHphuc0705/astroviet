import { ZODIAC_SIGNS } from '../types/chart.types.js';
import {
  HOUSE_NUMBERS,
  InterpretationSubjectRef,
  MVP_INTERPRETATION_PLANETS,
} from '../types/interpretation.types.js';

import {
  buildAngleInSignKey,
  buildPlanetInHouseKey,
  buildPlanetInSignKey,
} from './interpretation-subject-key.js';

/**
 * Acts as the canonical subject manifest generator for the MVP interpretation scope.
 * Generates exactly 252 subjects:
 * - 10 PlanetInSign × 12 signs (120)
 * - 1 AngleInSign × 12 signs (12)
 * - 10 PlanetInHouse × 12 houses (120)
 *
 * This contains no content generation logic and purely outputs the keys in deterministic order.
 */
export function enumerateMvpInterpretationSubjects(): InterpretationSubjectRef[] {
  const subjects: InterpretationSubjectRef[] = [];

  // 1. PlanetInSign
  for (const planet of MVP_INTERPRETATION_PLANETS) {
    for (const sign of ZODIAC_SIGNS) {
      subjects.push(
        Object.freeze({
          subjectType: 'PlanetInSign',
          subjectKey: buildPlanetInSignKey(planet, sign),
        }),
      );
    }
  }

  // 2. AngleInSign (Ascendant)
  for (const sign of ZODIAC_SIGNS) {
    subjects.push(
      Object.freeze({
        subjectType: 'AngleInSign',
        subjectKey: buildAngleInSignKey('Ascendant', sign),
      }),
    );
  }

  // 3. PlanetInHouse
  for (const planet of MVP_INTERPRETATION_PLANETS) {
    for (const house of HOUSE_NUMBERS) {
      subjects.push(
        Object.freeze({
          subjectType: 'PlanetInHouse',
          subjectKey: buildPlanetInHouseKey(planet, house),
        }),
      );
    }
  }

  return subjects;
}
