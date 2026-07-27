import { Coordinates } from '../value-objects/coordinates.vo.js';

export interface ITimezoneProvider {
  resolveHistorical(coordinates: Coordinates, date: Date): Promise<string>;
}
