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
  Placidus = 'Placidus',
  WholeSign = 'WholeSign',
}

export enum PlanetName {
  Sun = 'Sun',
  Moon = 'Moon',
  Mercury = 'Mercury',
  Venus = 'Venus',
  Mars = 'Mars',
  Jupiter = 'Jupiter',
  Saturn = 'Saturn',
  Uranus = 'Uranus',
  Neptune = 'Neptune',
  Pluto = 'Pluto',
  Chiron = 'Chiron',
  NorthNode = 'NorthNode',
  SouthNode = 'SouthNode',
  Lilith = 'Lilith',
}

export enum ChartType {
  Natal = 'Natal',
}

export enum PlanetCategory {
  Personal = 'Personal',
  Social = 'Social',
  Outer = 'Outer',
}

export enum AspectType {
  Conjunction = 'Conjunction',
  Sextile = 'Sextile',
  Square = 'Square',
  Trine = 'Trine',
  Opposition = 'Opposition',
}

export type AspectNature = 'Harmonious' | 'Challenging' | 'Neutral';
