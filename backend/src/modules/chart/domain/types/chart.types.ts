export const ZODIAC_SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
] as const;

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

export enum HouseSystem {
  PLACIDUS = 'Placidus',
  KOCH = 'Koch',
  CAMPANUS = 'Campanus',
  REGIOMONTANUS = 'Regiomontanus',
  EQUAL = 'Equal',
  WHOLE_SIGN = 'WholeSign',
}

export enum PlanetName {
  SUN = 'Sun',
  MOON = 'Moon',
  MERCURY = 'Mercury',
  VENUS = 'Venus',
  MARS = 'Mars',
  JUPITER = 'Jupiter',
  SATURN = 'Saturn',
  URANUS = 'Uranus',
  NEPTUNE = 'Neptune',
  PLUTO = 'Pluto',
  CHIRON = 'Chiron',
  TRUE_NODE = 'TrueNode',
  MEAN_NODE = 'MeanNode',
  LILITH = 'Lilith',
}

export enum ChartType {
  NATAL = 'Natal',
}

export enum PlanetCategory {
  LUMINARY = 'Luminary',
  INNER = 'Inner',
  OUTER = 'Outer',
  ASTEROID = 'Asteroid',
  POINT = 'Point',
}

export enum AspectType {
  CONJUNCTION = 'Conjunction',
  SEXTILE = 'Sextile',
  SQUARE = 'Square',
  TRINE = 'Trine',
  OPPOSITION = 'Opposition',
}
