import { InvalidTimezoneError } from '../errors/birth-profile.errors.js';

export class Timezone {
  private constructor(private readonly _value: string) {}

  public static create(value: string): Timezone {
    if (!value || value.trim().length === 0) {
      throw new InvalidTimezoneError('Timezone cannot be empty');
    }

    const trimmedValue = value.trim();

    // Reject fixed UTC offsets like "+07:00" or "-05:00"
    if (/^[+-]\d{2}:\d{2}$/.test(trimmedValue)) {
      throw new InvalidTimezoneError(
        'Fixed offset timezones are not allowed. Use IANA identifiers.',
      );
    }

    try {
      // We use Intl.DateTimeFormat instead of Intl.supportedValuesOf('timeZone')
      // because supportedValuesOf strictly returns canonical names and rejects
      // valid aliases like 'Asia/Ho_Chi_Minh' or 'UTC' in some Node.js versions.
      new Intl.DateTimeFormat('en-US', { timeZone: trimmedValue });
    } catch {
      throw new InvalidTimezoneError(`Invalid IANA timezone identifier: ${trimmedValue}`);
    }

    return new Timezone(trimmedValue);
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: Timezone): boolean {
    return this.value === other.value;
  }
}
