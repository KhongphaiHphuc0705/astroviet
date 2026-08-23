import { describe, it, expect } from 'vitest';

import {
  UnsupportedHouseSystemError,
  UnsupportedChartTypeError,
  UnsupportedCelestialBodyError,
  InvalidCoordinateError,
  InvalidDateTimeError,
  DataIntegrityError,
} from '../../../../../../src/modules/chart/domain/errors/chart.errors.js';

describe('Chart Domain Errors', () => {
  it('UnsupportedHouseSystemError should have correct name and message', () => {
    const error = new UnsupportedHouseSystemError('Test message');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('UnsupportedHouseSystemError');
    expect(error.message).toBe('Test message');
  });

  it('UnsupportedChartTypeError should have correct name and message', () => {
    const error = new UnsupportedChartTypeError('Test message');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('UnsupportedChartTypeError');
    expect(error.message).toBe('Test message');
  });

  it('UnsupportedCelestialBodyError should have correct name and message', () => {
    const error = new UnsupportedCelestialBodyError('Test message');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('UnsupportedCelestialBodyError');
    expect(error.message).toBe('Test message');
  });

  it('InvalidCoordinateError should have correct name and message', () => {
    const error = new InvalidCoordinateError('Test message');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('InvalidCoordinateError');
    expect(error.message).toBe('Test message');
  });

  it('InvalidDateTimeError should have correct name and message', () => {
    const error = new InvalidDateTimeError('Test message');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('InvalidDateTimeError');
    expect(error.message).toBe('Test message');
  });

  it('DataIntegrityError should have correct name and message', () => {
    const error = new DataIntegrityError('Test message');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('DataIntegrityError');
    expect(error.message).toBe('Test message');
  });
});
