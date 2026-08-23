import { DataIntegrityError } from '../errors/chart.errors.js';

export interface ChartCalculationMetadataProps {
  readonly calculatedAt: Date;
  readonly engineVersion: string;
}

export class ChartCalculationMetadata {
  private constructor(
    private readonly _calculatedAt: Date,
    private readonly _engineVersion: string,
  ) {}

  public get calculatedAt(): Date {
    return this._calculatedAt;
  }

  public get engineVersion(): string {
    return this._engineVersion;
  }

  public static create(props: ChartCalculationMetadataProps): ChartCalculationMetadata {
    if (!props.engineVersion || props.engineVersion.trim() === '') {
      throw new DataIntegrityError('engineVersion cannot be empty');
    }

    return new ChartCalculationMetadata(
      new Date(props.calculatedAt.getTime()),
      props.engineVersion.trim(),
    );
  }
}
