import { DataIntegrityError } from '../errors/chart.errors.js';
import { PlanetName, PlanetCategory } from '../types/chart.types.js';
import { ZodiacPosition } from '../value-objects/zodiac-position.vo.js';

export interface PlanetProps {
  id: string;
  name: PlanetName;
  category: PlanetCategory;
  longitude: number;
  latitude: number;
  speed: number;
  isRetrograde: boolean;
  zodiacPosition: ZodiacPosition;
  house: number | null;
}

export class Planet {
  private constructor(private readonly props: PlanetProps) {
    Object.freeze(this);
    Object.freeze(this.props);
  }

  get id(): string {
    return this.props.id;
  }
  get name(): PlanetName {
    return this.props.name;
  }
  get category(): PlanetCategory {
    return this.props.category;
  }
  get longitude(): number {
    return this.props.longitude;
  }
  get latitude(): number {
    return this.props.latitude;
  }
  get speed(): number {
    return this.props.speed;
  }
  get isRetrograde(): boolean {
    return this.props.isRetrograde;
  }
  get zodiacPosition(): ZodiacPosition {
    return this.props.zodiacPosition;
  }
  get house(): number | null {
    return this.props.house;
  }

  public static create(props: PlanetProps): Planet {
    if (props.longitude < 0 || props.longitude >= 360) {
      throw new DataIntegrityError(
        `Invalid longitude for planet ${props.name}: ${props.longitude}. Must be in [0, 360).`,
      );
    }

    if ((props.name === PlanetName.Sun || props.name === PlanetName.Moon) && props.isRetrograde) {
      throw new DataIntegrityError(`Luminary ${props.name} cannot be retrograde.`);
    }

    return new Planet({ ...props });
  }

  public static reconstitute(props: PlanetProps): Planet {
    return new Planet({ ...props });
  }
}
