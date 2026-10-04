import { PlanetName } from './chart.types.js';

export const INTERPRETATION_SUBJECT_TYPES = [
  'PlanetInSign',
  'AngleInSign',
  'PlanetInHouse',
  'Aspect',
  'PatternType',
  'SignSummary',
  'HouseSummary',
] as const;

export type InterpretationSubjectType = (typeof INTERPRETATION_SUBJECT_TYPES)[number];

export const MVP_INTERPRETATION_SUBJECT_TYPES = [
  'PlanetInSign',
  'AngleInSign',
  'PlanetInHouse',
] as const;

export type MvpInterpretationSubjectType = (typeof MVP_INTERPRETATION_SUBJECT_TYPES)[number];

export const MVP_INTERPRETATION_PLANETS = [
  PlanetName.Sun,
  PlanetName.Moon,
  PlanetName.Mercury,
  PlanetName.Venus,
  PlanetName.Mars,
  PlanetName.Jupiter,
  PlanetName.Saturn,
  PlanetName.Uranus,
  PlanetName.Neptune,
  PlanetName.Pluto,
] as const;

export type MvpInterpretationPlanet = (typeof MVP_INTERPRETATION_PLANETS)[number];

export const HOUSE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export type HouseNumber = (typeof HOUSE_NUMBERS)[number];

export type InterpretationContentStatus = 'Draft' | 'Published' | 'Archived';
export type InterpretationTone = 'Neutral' | 'Encouraging' | 'Direct';
export type InterpretationContentSource = 'HumanAuthored' | 'AIGenerated' | 'Hybrid';

export interface InterpretationContentRecord {
  subjectType: InterpretationSubjectType;
  subjectKey: string;
  language: string;
  tone: InterpretationTone | null;
  bodyText: string;
  version: string;
  status: InterpretationContentStatus;
  contentSource: InterpretationContentSource;
}

export interface InterpretationSubjectRef {
  subjectType: InterpretationSubjectType;
  subjectKey: string;
}
