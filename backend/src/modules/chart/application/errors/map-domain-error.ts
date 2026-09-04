import { DomainError } from '../../../../shared/errors/app-error.js';
import { ErrorCode } from '../../../../shared/errors/error-codes.js';
import {
  ChartCalculationFailed,
  DataIntegrityError,
  InvalidCoordinateError,
  InvalidDateTimeError,
  UnresolvableTimezoneError,
  UnsupportedCelestialBodyError,
  UnsupportedChartTypeError,
  UnsupportedHouseSystemError,
} from '../../domain/errors/chart.errors.js';

export function mapChartDomainErrorToAppError(error: Error): DomainError {
  if (error instanceof InvalidCoordinateError) {
    return new DomainError(ErrorCode.INVALID_COORDINATES, error.message);
  }
  if (error instanceof InvalidDateTimeError) {
    return new DomainError(ErrorCode.INVALID_DATETIME, error.message);
  }
  if (error instanceof UnsupportedHouseSystemError) {
    return new DomainError(ErrorCode.UNSUPPORTED_HOUSE_SYSTEM, error.message);
  }
  if (error instanceof UnsupportedChartTypeError) {
    return new DomainError(ErrorCode.UNSUPPORTED_CHART_TYPE, error.message);
  }
  if (error instanceof UnsupportedCelestialBodyError) {
    return new DomainError(ErrorCode.UNSUPPORTED_CELESTIAL_BODY, error.message);
  }
  if (error instanceof DataIntegrityError) {
    return new DomainError(ErrorCode.DATA_INTEGRITY_ERROR, error.message);
  }
  if (error instanceof UnresolvableTimezoneError) {
    return new DomainError(ErrorCode.UNRESOLVABLE_TIMEZONE, error.message);
  }
  if (error instanceof ChartCalculationFailed) {
    return new DomainError(ErrorCode.CHART_CALCULATION_FAILED, error.message);
  }
  throw error; // Unknown Error — propagate nguyên trạng, mapper KHÔNG được nuốt lỗi lạ
}
