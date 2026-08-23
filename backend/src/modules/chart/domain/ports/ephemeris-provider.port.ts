import { HouseSystem, PlanetName } from '../types/chart.types.js';

export interface EphemerisRequest {
  utcDateTime: Date;
  coordinates: { latitude: number; longitude: number };
}

export interface RawEphemerisData {
  planets: Array<{ name: PlanetName; longitude: number; latitude: number; speed: number }>;
}

export interface HouseCalculationRequest {
  utcDateTime: Date;
  coordinates: { latitude: number; longitude: number };
  houseSystem: HouseSystem;
}

export interface RawHouseData {
  cusps: number[];
  ascendant: number;
  midheaven: number;
}

export type HouseCalculationResult =
  { status: 'success'; data: RawHouseData } | { status: 'not_convergent' };

export interface IEphemerisProvider {
  calculateNatal(request: EphemerisRequest): Promise<RawEphemerisData>;
  calculateHouses(request: HouseCalculationRequest): Promise<HouseCalculationResult>;
  calculateTransit(request: EphemerisRequest): Promise<RawEphemerisData>;
}
