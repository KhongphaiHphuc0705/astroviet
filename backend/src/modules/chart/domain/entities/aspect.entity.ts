import { DataIntegrityError } from '../errors/chart.errors.js';
import { PlanetName, AspectType } from '../types/chart.types.js';

export interface AspectProps {
  id: string;
  planetA: PlanetName;
  planetB: PlanetName;
  aspectType: AspectType;
  exactAngle: number;
  orb: number;
  isApplying: boolean;
}

export class Aspect {
  private constructor(private readonly props: AspectProps) {
    Object.freeze(this);
    Object.freeze(this.props);
  }

  get id(): string {
    return this.props.id;
  }
  get planetA(): PlanetName {
    return this.props.planetA;
  }
  get planetB(): PlanetName {
    return this.props.planetB;
  }
  get aspectType(): AspectType {
    return this.props.aspectType;
  }
  get exactAngle(): number {
    return this.props.exactAngle;
  }
  get orb(): number {
    return this.props.orb;
  }
  get isApplying(): boolean {
    return this.props.isApplying;
  }

  public static create(props: AspectProps): Aspect {
    if (props.planetA === props.planetB) {
      throw new DataIntegrityError(`An aspect cannot involve the same planet: ${props.planetA}`);
    }

    if (props.planetA >= props.planetB) {
      throw new DataIntegrityError(
        `Aspect planets must be in canonical alphabetical order. Found: ${props.planetA} - ${props.planetB}`,
      );
    }

    if (props.orb < 0) {
      throw new DataIntegrityError(`Aspect orb cannot be negative: ${props.orb}`);
    }

    return new Aspect({ ...props });
  }

  public static reconstitute(props: AspectProps): Aspect {
    return new Aspect({ ...props });
  }
}
