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
