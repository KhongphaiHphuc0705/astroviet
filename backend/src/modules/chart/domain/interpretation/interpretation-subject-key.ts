import { InvalidInterpretationSubjectKeyError } from '../errors/chart.errors.js';
import { ZODIAC_SIGNS, ZodiacSign } from '../types/chart.types.js';
import {
  HOUSE_NUMBERS,
  HouseNumber,
  InterpretationSubjectType,
  MVP_INTERPRETATION_PLANETS,
  MvpInterpretationPlanet,
} from '../types/interpretation.types.js';

const VALID_PLANETS_SET = new Set<string>(MVP_INTERPRETATION_PLANETS);
const VALID_SIGNS_SET = new Set<string>(ZODIAC_SIGNS);
const VALID_HOUSES_SET = new Set<number>(HOUSE_NUMBERS);

export function buildPlanetInSignKey(planet: MvpInterpretationPlanet, sign: ZodiacSign): string {
  if (!VALID_PLANETS_SET.has(planet)) {
    throw new InvalidInterpretationSubjectKeyError(`Invalid planet for PlanetInSign: ${planet}`);
  }
  if (!VALID_SIGNS_SET.has(sign)) {
    throw new InvalidInterpretationSubjectKeyError(`Invalid sign for PlanetInSign: ${sign}`);
  }
  return `${planet}_in_${sign}`;
}

export function buildPlanetInHouseKey(planet: MvpInterpretationPlanet, house: HouseNumber): string {
  if (!VALID_PLANETS_SET.has(planet)) {
    throw new InvalidInterpretationSubjectKeyError(`Invalid planet for PlanetInHouse: ${planet}`);
  }
  if (!VALID_HOUSES_SET.has(house)) {
    throw new InvalidInterpretationSubjectKeyError(`Invalid house for PlanetInHouse: ${house}`);
  }
  return `${planet}_in_House_${house}`;
}

export function buildAngleInSignKey(angle: 'Ascendant', sign: ZodiacSign): string {
  if (angle !== 'Ascendant') {
    throw new InvalidInterpretationSubjectKeyError(`Invalid angle for AngleInSign: ${angle}`);
  }
  if (!VALID_SIGNS_SET.has(sign)) {
    throw new InvalidInterpretationSubjectKeyError(`Invalid sign for AngleInSign: ${sign}`);
  }
  return `${angle}_in_${sign}`;
}

/**
 * Validates if the given key strictly matches the grammar for the given subjectType.
 * Non-MVP types (Aspect, PatternType, SignSummary, HouseSummary) will always return false as their grammar is undefined in Sprint 4.
 */
export function isValidInterpretationSubjectKey(
  subjectType: InterpretationSubjectType,
  key: string,
): boolean {
  if (!key) return false;

  const planetNamesRegex = MVP_INTERPRETATION_PLANETS.join('|');
  const signNamesRegex = ZODIAC_SIGNS.join('|');
  const houseNumbersRegex = HOUSE_NUMBERS.join('|');

  switch (subjectType) {
    case 'PlanetInSign': {
      const regex = new RegExp(`^(${planetNamesRegex})_in_(${signNamesRegex})$`);
      return regex.test(key);
    }
    case 'PlanetInHouse': {
      const regex = new RegExp(`^(${planetNamesRegex})_in_House_(${houseNumbersRegex})$`);
      return regex.test(key);
    }
    case 'AngleInSign': {
      const regex = new RegExp(`^Ascendant_in_(${signNamesRegex})$`);
      return regex.test(key);
    }
    default:
      // Aspect, PatternType, SignSummary, HouseSummary have no defined grammar in Sprint 4 MVP
      return false;
  }
}
