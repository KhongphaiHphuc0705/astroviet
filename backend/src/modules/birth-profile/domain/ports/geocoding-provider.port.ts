import { Coordinates } from '../value-objects/coordinates.vo.js';

export interface IGeocodingProvider {
  geocode(placeName: string): Promise<Coordinates>;
}
