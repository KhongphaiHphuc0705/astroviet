import {
  InvalidBirthTimeStateError,
  InvalidLabelError,
  InvalidVersionError,
} from '../errors/birth-profile.errors.js';
import { BirthDate } from '../value-objects/birth-date.vo.js';
import { BirthLocation } from '../value-objects/birth-location.vo.js';
import { BirthTime } from '../value-objects/birth-time.vo.js';

export interface BirthProfileProps {
  id: string;
  userId: string;
  label: string;
  fullName: string | null;
  birthDate: BirthDate;
  birthTime: BirthTime | null;
  isBirthTimeKnown: boolean;
  birthLocation: BirthLocation;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}

export class BirthProfile {
  private constructor(private readonly props: BirthProfileProps) {}

  public static create(props: BirthProfileProps): BirthProfile {
    // INV-BP1: isBirthTimeKnown = false ⟺ birthTime = null
    if (props.isBirthTimeKnown === false && props.birthTime !== null) {
      throw new InvalidBirthTimeStateError('birthTime must be null when isBirthTimeKnown is false');
    }
    if (props.isBirthTimeKnown === true && props.birthTime === null) {
      throw new InvalidBirthTimeStateError(
        'birthTime cannot be null when isBirthTimeKnown is true',
      );
    }

    // INV-BP2: label length 1-100
    if (!props.label || props.label.length < 1 || props.label.length > 100) {
      throw new InvalidLabelError('Label must be between 1 and 100 characters');
    }

    // INV-BP3: version >= 1
    if (props.version < 1) {
      throw new InvalidVersionError('Version must be >= 1');
    }

    return new BirthProfile({ ...props });
  }

  public static reconstitute(props: BirthProfileProps): BirthProfile {
    return new BirthProfile({ ...props });
  }

  public update(
    changes: Partial<Omit<BirthProfileProps, 'id' | 'userId' | 'createdAt'>>,
  ): BirthProfile {
    const updatedProps = { ...this.props, ...changes };

    // Re-validate domain invariants on the merged properties
    if (updatedProps.isBirthTimeKnown === false && updatedProps.birthTime !== null) {
      throw new InvalidBirthTimeStateError('birthTime must be null when isBirthTimeKnown is false');
    }
    if (updatedProps.isBirthTimeKnown === true && updatedProps.birthTime === null) {
      throw new InvalidBirthTimeStateError(
        'birthTime cannot be null when isBirthTimeKnown is true',
      );
    }

    if (!updatedProps.label || updatedProps.label.length < 1 || updatedProps.label.length > 100) {
      throw new InvalidLabelError('Label must be between 1 and 100 characters');
    }

    if (updatedProps.version < 1) {
      throw new InvalidVersionError('Version must be >= 1');
    }

    return new BirthProfile(updatedProps);
  }

  // Getters
  public get id(): string {
    return this.props.id;
  }
  public get userId(): string {
    return this.props.userId;
  }
  public get label(): string {
    return this.props.label;
  }
  public get fullName(): string | null {
    return this.props.fullName;
  }
  public get birthDate(): BirthDate {
    return this.props.birthDate;
  }
  public get birthTime(): BirthTime | null {
    return this.props.birthTime;
  }
  public get isBirthTimeKnown(): boolean {
    return this.props.isBirthTimeKnown;
  }
  public get birthLocation(): BirthLocation {
    return this.props.birthLocation;
  }
  public get createdAt(): Date {
    return this.props.createdAt;
  }
  public get updatedAt(): Date {
    return this.props.updatedAt;
  }
  public get deletedAt(): Date | null {
    return this.props.deletedAt;
  }
  public get version(): number {
    return this.props.version;
  }
}
