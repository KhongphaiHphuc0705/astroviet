export const KNOWN_HOUSE_SYSTEMS = ["Placidus", "WholeSign"] as const;
export const KNOWN_OPTIONAL_POINTS = [
  "Chiron",
  "Lilith",
  "NorthNode",
  "SouthNode",
] as const;
export const KNOWN_PLANET_NAMES = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
  "Chiron",
  "NorthNode",
  "SouthNode",
  "Lilith",
] as const;
export const KNOWN_ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;
export const KNOWN_ASPECT_TYPES = [
  "Conjunction",
  "Sextile",
  "Square",
  "Trine",
  "Opposition",
] as const;
export const KNOWN_ANGLE_TYPES = [
  "Ascendant",
  "Midheaven",
  "Descendant",
  "ImumCoeli",
] as const;
export const KNOWN_PLANET_CATEGORIES = ["Personal", "Social", "Outer"] as const;
export const KNOWN_ASPECT_NATURES = [
  "Harmonious",
  "Challenging",
  "Neutral",
] as const;
export const KNOWN_INTERPRETATION_SUBJECT_TYPES = [
  "PlanetInSign",
  "AngleInSign",
  "PlanetInHouse",
] as const;

export type HouseSystem = (typeof KNOWN_HOUSE_SYSTEMS)[number];
export type OptionalPointName = (typeof KNOWN_OPTIONAL_POINTS)[number];
export type PlanetName = (typeof KNOWN_PLANET_NAMES)[number];
export type ZodiacSign = (typeof KNOWN_ZODIAC_SIGNS)[number];
export type AspectType = (typeof KNOWN_ASPECT_TYPES)[number];
export type AngleType = (typeof KNOWN_ANGLE_TYPES)[number];
export type PlanetCategory = (typeof KNOWN_PLANET_CATEGORIES)[number];
export type AspectNature = (typeof KNOWN_ASPECT_NATURES)[number];
export type InterpretationSubjectType =
  (typeof KNOWN_INTERPRETATION_SUBJECT_TYPES)[number];

export interface CreateNatalChartRequest {
  birthProfileId: string;
  houseSystem: HouseSystem;
  includeOptionalPoints: OptionalPointName[];
}

export interface ChartPlanetDto {
  name: PlanetName;
  category: PlanetCategory;
  longitude: number;
  speed: number;
  isRetrograde: boolean;
  sign: ZodiacSign;
  degreeInSign: number;
  house: number | null;
}

export interface ChartHouseDto {
  number: number;
  cuspDegree: number;
  signOnCusp: ZodiacSign;
}

export interface ChartAngleDto {
  type: AngleType;
  longitude: number;
  sign: ZodiacSign;
  degreeInSign: number;
}

export interface ChartAspectDto {
  aspectType: AspectType;
  planetA: PlanetName;
  planetB: PlanetName;
  exactAngle: number;
  orb: number;
  isApplying: boolean;
  nature: AspectNature;
}

export interface ChartPatternDto {
  patternType: string;
  involvedPlanets: PlanetName[];
}

export interface ChartInterpretationDto {
  subjectType: InterpretationSubjectType;
  subjectKey: string;
  language: string;
  bodyText: string;
  tone?: string | null;
}

export interface ChartWarningDto {
  code: string;
  message: string;
  severity: "info" | "warning";
  field?: string;
  details?: Record<string, unknown>;
}

export interface ChartResponse {
  id: string;
  chartType: "Natal";
  houseSystem: HouseSystem;
  isHouseDataAvailable: boolean;
  planets: ChartPlanetDto[];
  houses: ChartHouseDto[];
  angles: ChartAngleDto[];
  aspects: ChartAspectDto[];
  patterns: ChartPatternDto[];
  interpretations: ChartInterpretationDto[];
  interpretationVersion: string | null;
  warnings: ChartWarningDto[];
  calculatedAt: string;
  engineVersion: string;
}

export interface ChartSummary {
  id: string;
  birthProfileId: string | null;
  birthProfileLabel: string | null;
  houseSystem: HouseSystem;
  calculatedAt: string;
}

export interface ListChartsParams {
  page?: number;
  pageSize?: number;
  birthProfileId?: string;
  sortBy?: "calculatedAt";
  order?: "asc" | "desc";
}

export interface ListChartsResponse {
  items: ChartSummary[];
  total: number;
  page: number;
  pageSize: number;
}
