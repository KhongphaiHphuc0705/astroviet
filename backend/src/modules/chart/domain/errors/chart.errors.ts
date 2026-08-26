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

export class UnresolvableTimezoneError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnresolvableTimezoneError';
  }
}

export class ChartCalculationFailed extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = 'ChartCalculationFailed';
  }
}
