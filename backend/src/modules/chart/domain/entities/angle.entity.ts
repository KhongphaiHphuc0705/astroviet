import { DataIntegrityError } from '../errors/chart.errors.js';

export type AngleType = 'Ascendant' | 'Midheaven' | 'Descendant' | 'ImumCoeli';

export interface AngleProps {
  id: string;
  type: AngleType;
  longitude: number;
}

export class Angle {
  private constructor(private readonly props: AngleProps) {
    Object.freeze(this);
    Object.freeze(this.props);
  }

  get id(): string {
    return this.props.id;
  }
  get type(): AngleType {
    return this.props.type;
  }
  get longitude(): number {
    return this.props.longitude;
  }

  public static create(props: AngleProps): Angle {
    if (props.longitude < 0 || props.longitude >= 360) {
      throw new DataIntegrityError(
        `Invalid longitude for angle ${props.type}: ${props.longitude}. Must be in [0, 360).`,
      );
    }

    return new Angle({ ...props });
  }

  public static reconstitute(props: AngleProps): Angle {
    return new Angle({ ...props });
  }
}
