export class InvalidBirthDateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidBirthDateError';
  }
}

export class InvalidBirthTimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidBirthTimeError';
  }
}

export class LatitudeOutOfRangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LatitudeOutOfRangeError';
  }
}

export class LongitudeOutOfRangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LongitudeOutOfRangeError';
  }
}

export class InvalidTimezoneError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTimezoneError';
  }
}

export class InvalidBirthLocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidBirthLocationError';
  }
}

export class InvalidBirthTimeStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidBirthTimeStateError';
  }
}

export class InvalidLabelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidLabelError';
  }
}

export class InvalidVersionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidVersionError';
  }
}
