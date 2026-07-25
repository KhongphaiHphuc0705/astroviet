import {
  LatitudeOutOfRangeError,
  LongitudeOutOfRangeError,
} from '../errors/birth-profile.errors.js';

export class Coordinates {
  private constructor(
    private readonly _latitude: number,
    private readonly _longitude: number,
  ) {}

  public static create(latitude: number, longitude: number): Coordinates {
    if (typeof latitude !== 'number' || Number.isNaN(latitude) || !Number.isFinite(latitude)) {
      throw new LatitudeOutOfRangeError('Latitude must be a valid number');
    }

    if (latitude < -90 || latitude > 90) {
      throw new LatitudeOutOfRangeError('Latitude must be between -90 and 90');
    }

    if (typeof longitude !== 'number' || Number.isNaN(longitude) || !Number.isFinite(longitude)) {
      throw new LongitudeOutOfRangeError('Longitude must be a valid number');
    }

    if (longitude < -180 || longitude > 180) {
      throw new LongitudeOutOfRangeError('Longitude must be between -180 and 180');
    }

    return new Coordinates(latitude, longitude);
  }

  public get latitude(): number {
    return this._latitude;
  }

  public get longitude(): number {
    return this._longitude;
  }

  public equals(other: Coordinates): boolean {
    return this.latitude === other.latitude && this.longitude === other.longitude;
  }
}
