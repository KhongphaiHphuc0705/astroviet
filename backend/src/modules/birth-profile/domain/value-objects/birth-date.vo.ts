import { InvalidBirthDateError } from '../errors/birth-profile.errors.js';

export class BirthDate {
  private constructor(private readonly _value: Date) {}

  public static create(value: Date | string): BirthDate {
    const date = new Date(value);

    if (isNaN(date.getTime())) {
      throw new InvalidBirthDateError('Invalid date format');
    }

    // Strict validation to catch invalid dates like '2001-02-29' which JS Date might parse as '2001-03-01'
    if (typeof value === 'string') {
      const parts = value.split('-');
      if (parts.length >= 3) {
        const year = parseInt(parts[0]!, 10);
        const month = parseInt(parts[1]!, 10) - 1; // 0-indexed
        const day = parseInt(parts[2]!, 10);
        
        if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month || date.getUTCDate() !== day) {
          throw new InvalidBirthDateError('Invalid calendar date');
        }
      }
    }

    // Must be strictly less than today (only comparing the date part)
    // We normalize both dates to midnight UTC to compare only the date part
    const inputDateUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

    const now = new Date();
    const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

    if (inputDateUtc >= todayUtc) {
      throw new InvalidBirthDateError('Birth date must be in the past');
    }

    // Only keep the date part, discard time
    const normalizedDate = new Date(inputDateUtc);

    return new BirthDate(normalizedDate);
  }

  public get value(): Date {
    // Return a new Date instance to prevent mutation
    return new Date(this._value.getTime());
  }

  public equals(other: BirthDate): boolean {
    return this._value.getTime() === other.value.getTime();
  }
}
