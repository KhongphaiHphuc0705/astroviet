import { DomainError } from '../../../../shared/errors/app-error.js';
import { ErrorCode } from '../../../../shared/errors/error-codes.js';
import {
  InvalidBirthDateError,
  InvalidBirthLocationError,
  InvalidBirthTimeError,
  InvalidBirthTimeStateError,
  InvalidLabelError,
  InvalidTimezoneError,
  LatitudeOutOfRangeError,
  LongitudeOutOfRangeError,
} from '../../domain/errors/birth-profile.errors.js';

/**
 * Maps Domain Errors (from Value Objects and Entities) into Application DomainErrors.
 * If the error is not a recognized domain error, it is re-thrown as-is.
 */
export function mapDomainErrorToAppError(error: Error): DomainError {
  if (error instanceof InvalidBirthDateError) {
    return new DomainError(ErrorCode.INVALID_BIRTH_DATE, error.message);
  }
  if (error instanceof InvalidBirthTimeError) {
    return new DomainError(ErrorCode.INVALID_BIRTH_TIME, error.message);
  }
  if (error instanceof LatitudeOutOfRangeError) {
    return new DomainError(ErrorCode.INVALID_LATITUDE_RANGE, error.message);
  }
  if (error instanceof LongitudeOutOfRangeError) {
    return new DomainError(ErrorCode.INVALID_LONGITUDE_RANGE, error.message);
  }
  if (error instanceof InvalidTimezoneError) {
    return new DomainError(ErrorCode.INVALID_TIMEZONE, error.message);
  }
  if (error instanceof InvalidBirthLocationError) {
    return new DomainError(ErrorCode.INVALID_BIRTH_LOCATION, error.message);
  }
  if (error instanceof InvalidBirthTimeStateError) {
    return new DomainError(ErrorCode.INVALID_BIRTH_TIME_STATE, error.message);
  }
  if (error instanceof InvalidLabelError) {
    return new DomainError(ErrorCode.VALIDATION_ERROR, error.message);
  }

  // Not a domain error, or it's an unexpected error
  throw error;
}
