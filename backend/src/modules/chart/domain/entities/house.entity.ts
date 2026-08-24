import { DataIntegrityError } from '../errors/chart.errors.js';
import { HouseSystem } from '../types/chart.types.js';

export interface HouseProps {
  id: string;
  number: number;
  cuspDegree: number;
  houseSystem: HouseSystem;
}

export class House {
  private constructor(private readonly props: HouseProps) {
    Object.freeze(this);
    Object.freeze(this.props);
  }

  get id(): string {
    return this.props.id;
  }
  get number(): number {
    return this.props.number;
  }
  get cuspDegree(): number {
    return this.props.cuspDegree;
  }
  get houseSystem(): HouseSystem {
    return this.props.houseSystem;
  }

  public static create(props: HouseProps): House {
    if (props.number < 1 || props.number > 12 || !Number.isInteger(props.number)) {
      throw new DataIntegrityError(
        `Invalid house number: ${props.number}. Must be an integer between 1 and 12.`,
      );
    }

    if (props.cuspDegree < 0 || props.cuspDegree >= 360) {
      throw new DataIntegrityError(`Invalid cuspDegree: ${props.cuspDegree}. Must be in [0, 360).`);
    }

    return new House({ ...props });
  }

  public static reconstitute(props: HouseProps): House {
    return new House({ ...props });
  }
}
