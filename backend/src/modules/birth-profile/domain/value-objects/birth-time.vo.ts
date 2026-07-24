import { InvalidBirthTimeError } from '../errors/birth-profile.errors.js';

export class BirthTime {
  private constructor(
    private readonly _hour: number,
    private readonly _minute: number,
    private readonly _second: number,
  ) {}

  public static create(value: string): BirthTime {
    // Expected format: "HH:mm:ss"
    const regex = /^(\d{2}):(\d{2}):(\d{2})$/;
    const match = value.match(regex);

    if (!match) {
      throw new InvalidBirthTimeError('Invalid birth time format. Expected HH:mm:ss');
    }

    const hour = parseInt(match[1]!, 10);
    const minute = parseInt(match[2]!, 10);
    const second = parseInt(match[3]!, 10);

    if (hour < 0 || hour > 23) {
      throw new InvalidBirthTimeError('Hour must be between 0 and 23');
    }

    if (minute < 0 || minute > 59) {
      throw new InvalidBirthTimeError('Minute must be between 0 and 59');
    }

    if (second < 0 || second > 59) {
      throw new InvalidBirthTimeError('Second must be between 0 and 59');
    }

    return new BirthTime(hour, minute, second);
  }

  public get hour(): number {
    return this._hour;
  }

  public get minute(): number {
    return this._minute;
  }

  public get second(): number {
    return this._second;
  }

  public equals(other: BirthTime): boolean {
    return this.hour === other.hour && this.minute === other.minute && this.second === other.second;
  }
}
