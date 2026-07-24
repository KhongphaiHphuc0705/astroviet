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

    // However, to keep it simple and strict as per plan, we will strictly enforce against supportedValuesOf
    // Wait, the plan says: "Dùng Intl.supportedValuesOf('timeZone') để kiểm tra chuỗi có tồn tại thật trong IANA tzdb hay không"
    // So we use it. If it throws RangeError when creating Intl.DateTimeFormat, it's invalid.

    try {
      // Intl.DateTimeFormat is a robust way to check if a timezone string is valid in the current JS environment
      // It will throw a RangeError if the timezone is invalid.
      // We will check using this to allow valid ICU aliases that might not be in supportedValuesOf.
      new Intl.DateTimeFormat('en-US', { timeZone: trimmedValue });
    } catch (e) {
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
