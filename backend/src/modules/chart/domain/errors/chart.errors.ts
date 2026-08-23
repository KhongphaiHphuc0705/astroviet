export class UnsupportedHouseSystemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedHouseSystemError';
  }
}

export class UnsupportedChartTypeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedChartTypeError';
  }
}

export class UnsupportedCelestialBodyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedCelestialBodyError';
  }
}

export class InvalidCoordinateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCoordinateError';
  }
}

export class InvalidDateTimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDateTimeError';
  }
}

export class DataIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataIntegrityError';
  }
}
