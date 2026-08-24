import { ZodiacSign, ZODIAC_SIGNS } from '../types/chart.types.js';

export class ZodiacPosition {
  private constructor(
    private readonly _longitude: number,
    private readonly _sign: ZodiacSign,
    private readonly _degreeInSign: number,
  ) {
    Object.freeze(this);
  }

  public get longitude(): number {
    return this._longitude;
  }

  public get sign(): ZodiacSign {
    return this._sign;
  }

  public get degreeInSign(): number {
    return this._degreeInSign;
  }

  public static fromLongitude(value: number): ZodiacPosition {
    // Normalize longitude to [0, 360) using safe modulo for negative numbers
    const longitude = ((value % 360) + 360) % 360;

    const signIndex = Math.floor(longitude / 30);
    const sign = ZODIAC_SIGNS[signIndex]!;
    const degreeInSign = longitude % 30;

    return new ZodiacPosition(longitude, sign, degreeInSign);
  }
}
