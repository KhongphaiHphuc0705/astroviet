import { DataIntegrityError } from '../errors/chart.errors.js';
import { ChartType, HouseSystem } from '../types/chart.types.js';
import { ChartCalculationMetadata } from '../value-objects/calculation-metadata.vo.js';
import { EngineInput } from '../value-objects/engine-input.vo.js';
import { Warning } from '../value-objects/warning.vo.js';

import { Angle } from './angle.entity.js';
import { Aspect } from './aspect.entity.js';
import { House } from './house.entity.js';
import { Pattern } from './pattern.entity.js';
import { Planet } from './planet.entity.js';

export interface ChartProps {
  id: string;
  userId: string | null;
  chartType: ChartType;
  birthProfileId: string | null;
  engineInput: EngineInput;
  planets: Planet[];
  houses: House[];
  angles: Angle[];
  aspects: Aspect[];
  patterns: Pattern[];
  houseSystem: HouseSystem;
  isHouseDataAvailable: boolean;
  calculationMetadata: ChartCalculationMetadata;
  warnings: Warning[];
  createdAt: Date;
  deletedAt: Date | null;
}

export class Chart {
  private constructor(private readonly props: ChartProps) {
    // Chart is immutable by design — Natal Chart Domain Spec §27.6/§27.7.
    // No update() method exists intentionally.
    Object.freeze(this);
    Object.freeze(this.props);
    Object.freeze(this.props.planets);
    Object.freeze(this.props.houses);
    Object.freeze(this.props.angles);
    Object.freeze(this.props.aspects);
    Object.freeze(this.props.patterns);
    Object.freeze(this.props.warnings);
  }

  get id(): string {
    return this.props.id;
  }
  get userId(): string | null {
    return this.props.userId;
  }
  get chartType(): ChartType {
    return this.props.chartType;
  }
  get birthProfileId(): string | null {
    return this.props.birthProfileId;
  }
  get engineInput(): EngineInput {
    return this.props.engineInput;
  }
  get planets(): readonly Planet[] {
    return this.props.planets;
  }
  get houses(): readonly House[] {
    return this.props.houses;
  }
  get angles(): readonly Angle[] {
    return this.props.angles;
  }
  get aspects(): readonly Aspect[] {
    return this.props.aspects;
  }
  get patterns(): readonly Pattern[] {
    return this.props.patterns;
  }
  get houseSystem(): HouseSystem {
    return this.props.houseSystem;
  }
  get isHouseDataAvailable(): boolean {
    return this.props.isHouseDataAvailable;
  }
  get calculationMetadata(): ChartCalculationMetadata {
    return this.props.calculationMetadata;
  }
  get warnings(): readonly Warning[] {
    return this.props.warnings;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  public static create(props: ChartProps): Chart {
    // INV-1
    if (props.chartType !== ChartType.Natal) {
      throw new DataIntegrityError(`ChartType must be Natal. Found: ${props.chartType}`);
    }

    // INV-2
    if (props.planets.length < 10) {
      throw new DataIntegrityError(
        `A valid chart must have at least 10 planets. Found: ${props.planets.length}`,
      );
    }

    // INV-4
    if (props.isHouseDataAvailable) {
      if (props.houses.length !== 12 || props.angles.length !== 4) {
        throw new DataIntegrityError(
          `Chart with house data must have exactly 12 houses and 4 angles. Found: ${props.houses.length} houses, ${props.angles.length} angles.`,
        );
      }
    } else {
      if (props.houses.length !== 0 || props.angles.length !== 0) {
        throw new DataIntegrityError(
          `Chart without house data must have 0 houses and 0 angles. Found: ${props.houses.length} houses, ${props.angles.length} angles.`,
        );
      }
    }

    // INV-5
    if (props.houses.length > 0) {
      const houseNumbers = new Set(props.houses.map((h) => h.number));
      if (
        houseNumbers.size !== 12 ||
        !Array.from({ length: 12 }, (_, i) => i + 1).every((n) => houseNumbers.has(n))
      ) {
        throw new DataIntegrityError(`Houses must be exactly 1 to 12 without duplicates.`);
      }
    }

    // INV-10
    const aspectPairs = new Set<string>();
    for (const aspect of props.aspects) {
      const pair = `${aspect.planetA}_${aspect.planetB}`;
      if (aspectPairs.has(pair)) {
        throw new DataIntegrityError(`Duplicate aspect pair found: ${pair}`);
      }
      aspectPairs.add(pair);
    }

    // INV-15
    if (props.angles.length === 4) {
      const asc = props.angles.find((a) => a.type === 'Ascendant');
      const dsc = props.angles.find((a) => a.type === 'Descendant');
      const mc = props.angles.find((a) => a.type === 'Midheaven');
      const ic = props.angles.find((a) => a.type === 'ImumCoeli');

      if (!asc || !dsc || !mc || !ic) {
        throw new DataIntegrityError('Missing one or more required angles (ASC, DSC, MC, IC).');
      }

      const getCircularDistance = (a: number, b: number) => {
        const diff = Math.abs(a - b) % 360;
        return Math.min(diff, 360 - diff);
      };

      if (getCircularDistance(dsc.longitude, (asc.longitude + 180) % 360) > 1e-9) {
        throw new DataIntegrityError('Descendant must be exactly opposite to Ascendant.');
      }

      if (getCircularDistance(ic.longitude, (mc.longitude + 180) % 360) > 1e-9) {
        throw new DataIntegrityError('Imum Coeli must be exactly opposite to Midheaven.');
      }
    }

    // Defensive copying for properties that are objects/arrays
    return new Chart({
      ...props,
      engineInput: EngineInput.create(props.engineInput.birthData, props.engineInput.chartOptions), // Deep copy not needed if EngineInput itself is immutable, but we return the same instance since it's frozen
      planets: [...props.planets],
      houses: [...props.houses],
      angles: [...props.angles],
      aspects: [...props.aspects],
      patterns: [...props.patterns],
      warnings: [...props.warnings],
      createdAt: new Date(props.createdAt.getTime()),
      deletedAt: props.deletedAt ? new Date(props.deletedAt.getTime()) : null,
    });
  }

  public static reconstitute(props: ChartProps): Chart {
    return new Chart({
      ...props,
      planets: [...props.planets],
      houses: [...props.houses],
      angles: [...props.angles],
      aspects: [...props.aspects],
      patterns: [...props.patterns],
      warnings: [...props.warnings],
    });
  }

  public softDelete(): Chart {
    return new Chart({
      ...this.props,
      deletedAt: new Date(),
    });
  }
}
