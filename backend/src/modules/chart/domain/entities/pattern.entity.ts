import { DataIntegrityError } from '../errors/chart.errors.js';
import { PlanetName } from '../types/chart.types.js';

export interface PatternProps {
  id: string;
  patternType: string;
  involvedPlanets: PlanetName[];
}

export class Pattern {
  private constructor(private readonly props: PatternProps) {
    Object.freeze(this);
    Object.freeze(this.props);
    Object.freeze(this.props.involvedPlanets);
  }

  get id(): string {
    return this.props.id;
  }
  get patternType(): string {
    return this.props.patternType;
  }
  get involvedPlanets(): readonly PlanetName[] {
    return this.props.involvedPlanets;
  }

  public static create(props: PatternProps): Pattern {
    // Pattern detection algorithm deferred — Sprint 3 M3 sẽ luôn tạo patterns=[],
    // entity này tồn tại đúng theo D-14 Confirmed (Natal Chart Domain Spec),
    // không implement thuật toán Grand Trine/T-Square/Grand Cross/Yod.

    if (props.involvedPlanets.length < 3) {
      throw new DataIntegrityError(`Pattern ${props.patternType} must involve at least 3 planets.`);
    }

    return new Pattern({
      ...props,
      involvedPlanets: [...props.involvedPlanets],
    });
  }

  public static reconstitute(props: PatternProps): Pattern {
    return new Pattern({
      ...props,
      involvedPlanets: [...props.involvedPlanets],
    });
  }
}
