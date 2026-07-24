import { InvalidBirthLocationError } from '../errors/birth-profile.errors.js';
import { Coordinates } from './coordinates.vo.js';
import { Timezone } from './timezone.vo.js';

export class BirthLocation {
  private constructor(
    private readonly _placeName: string,
    private readonly _coordinates: Coordinates,
    private readonly _timezone: Timezone,
  ) {}

  public static create(
    placeName: string,
    coordinates: Coordinates,
    timezone: Timezone,
  ): BirthLocation {
    if (!placeName || placeName.trim().length === 0) {
      throw new InvalidBirthLocationError('Place name cannot be empty');
    }

    const trimmedPlaceName = placeName.trim();

    return new BirthLocation(trimmedPlaceName, coordinates, timezone);
  }

  public get placeName(): string {
    return this._placeName;
  }

  public get coordinates(): Coordinates {
    return this._coordinates;
  }

  public get timezone(): Timezone {
    return this._timezone;
  }

  public equals(other: BirthLocation): boolean {
    return (
      this.placeName === other.placeName &&
      this.coordinates.equals(other.coordinates) &&
      this.timezone.equals(other.timezone)
    );
  }
}
