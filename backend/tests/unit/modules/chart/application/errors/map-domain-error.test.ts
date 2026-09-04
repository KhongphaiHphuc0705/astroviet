import { describe, expect, it } from 'vitest';

import { mapChartDomainErrorToAppError } from '../../../../../../src/modules/chart/application/errors/map-domain-error.js';
import {
  ChartCalculationFailed,
  DataIntegrityError,
  InvalidCoordinateError,
  InvalidDateTimeError,
  UnresolvableTimezoneError,
  UnsupportedCelestialBodyError,
  UnsupportedChartTypeError,
  UnsupportedHouseSystemError,
} from '../../../../../../src/modules/chart/domain/errors/chart.errors.js';
import { DomainError } from '../../../../../../src/shared/errors/app-error.js';
import { ErrorCode } from '../../../../../../src/shared/errors/error-codes.js';

describe('mapChartDomainErrorToAppError', () => {
  it('should map InvalidCoordinateError to DomainError with INVALID_COORDINATES', () => {
    const error = new InvalidCoordinateError('Invalid coord');
    const result = mapChartDomainErrorToAppError(error);
    expect(result).toBeInstanceOf(DomainError);
    expect(result.errorCode).toBe(ErrorCode.INVALID_COORDINATES);
    expect(result.statusCode).toBe(422);
    expect(result.message).toBe('Invalid coord');
  });

  it('should map InvalidDateTimeError to DomainError with INVALID_DATETIME', () => {
    const error = new InvalidDateTimeError('Invalid time');
    const result = mapChartDomainErrorToAppError(error);
    expect(result).toBeInstanceOf(DomainError);
    expect(result.errorCode).toBe(ErrorCode.INVALID_DATETIME);
    expect(result.statusCode).toBe(422);
    expect(result.message).toBe('Invalid time');
  });

  it('should map UnsupportedHouseSystemError to DomainError with UNSUPPORTED_HOUSE_SYSTEM', () => {
    const error = new UnsupportedHouseSystemError('Bad house system');
    const result = mapChartDomainErrorToAppError(error);
    expect(result).toBeInstanceOf(DomainError);
    expect(result.errorCode).toBe(ErrorCode.UNSUPPORTED_HOUSE_SYSTEM);
    expect(result.statusCode).toBe(422);
    expect(result.message).toBe('Bad house system');
  });

  it('should map UnsupportedChartTypeError to DomainError with UNSUPPORTED_CHART_TYPE', () => {
    const error = new UnsupportedChartTypeError('Bad type');
    const result = mapChartDomainErrorToAppError(error);
    expect(result).toBeInstanceOf(DomainError);
    expect(result.errorCode).toBe(ErrorCode.UNSUPPORTED_CHART_TYPE);
    expect(result.statusCode).toBe(422);
    expect(result.message).toBe('Bad type');
  });

  it('should map UnsupportedCelestialBodyError to DomainError with UNSUPPORTED_CELESTIAL_BODY', () => {
    const error = new UnsupportedCelestialBodyError('Bad planet');
    const result = mapChartDomainErrorToAppError(error);
    expect(result).toBeInstanceOf(DomainError);
    expect(result.errorCode).toBe(ErrorCode.UNSUPPORTED_CELESTIAL_BODY);
    expect(result.statusCode).toBe(422);
    expect(result.message).toBe('Bad planet');
  });

  it('should map DataIntegrityError to DomainError with DATA_INTEGRITY_ERROR', () => {
    const error = new DataIntegrityError('Bad data');
    const result = mapChartDomainErrorToAppError(error);
    expect(result).toBeInstanceOf(DomainError);
    expect(result.errorCode).toBe(ErrorCode.DATA_INTEGRITY_ERROR);
    expect(result.statusCode).toBe(422);
    expect(result.message).toBe('Bad data');
  });

  it('should map UnresolvableTimezoneError to DomainError with UNRESOLVABLE_TIMEZONE', () => {
    const error = new UnresolvableTimezoneError('Bad timezone');
    const result = mapChartDomainErrorToAppError(error);
    expect(result).toBeInstanceOf(DomainError);
    expect(result.errorCode).toBe(ErrorCode.UNRESOLVABLE_TIMEZONE);
    expect(result.statusCode).toBe(422);
    expect(result.message).toBe('Bad timezone');
  });

  it('should map ChartCalculationFailed to DomainError with CHART_CALCULATION_FAILED', () => {
    const error = new ChartCalculationFailed('Fail');
    const result = mapChartDomainErrorToAppError(error);
    expect(result).toBeInstanceOf(DomainError);
    expect(result.errorCode).toBe(ErrorCode.CHART_CALCULATION_FAILED);
    expect(result.statusCode).toBe(422);
    expect(result.message).toBe('Fail');
  });

  it('should throw the original error if it is not a recognized domain error', () => {
    const error = new Error('Unknown error');
    expect(() => mapChartDomainErrorToAppError(error)).toThrowError(error);
    expect(() => mapChartDomainErrorToAppError(error)).toThrow('Unknown error');
  });
});
