import { describe, it, expect } from 'vitest';

import { ChartInputValidator } from '../../../../../../../src/modules/chart/domain/engine/validation/chart-input.validator.js';
import {
  InvalidCoordinateError,
  InvalidDateTimeError,
  UnsupportedCelestialBodyError,
  UnsupportedChartTypeError,
  UnsupportedHouseSystemError,
} from '../../../../../../../src/modules/chart/domain/errors/chart.errors.js';
import {
  ChartType,
  HouseSystem,
  PlanetName,
} from '../../../../../../../src/modules/chart/domain/types/chart.types.js';
import { EngineInput } from '../../../../../../../src/modules/chart/domain/value-objects/engine-input.vo.js';

describe('ChartInputValidator', () => {
  const validBirthData = {
    birthDate: new Date('1990-05-15T00:00:00.000Z'),
    birthTime: { hour: 14, minute: 30, second: 0 },
    isBirthTimeKnown: true,
    latitude: 40.7128,
    longitude: -74.006,
    timezoneId: 'America/New_York',
  };

  const validChartOptions = {
    houseSystem: HouseSystem.Placidus,
    includeOptionalPoints: [PlanetName.Chiron, PlanetName.NorthNode],
    chartType: ChartType.Natal,
  };

  const createValidInput = () => EngineInput.create(validBirthData, validChartOptions);

  it('should pass validation for a valid input', () => {
    const input = createValidInput();
    expect(() => ChartInputValidator.validate(input)).not.toThrow();
  });

  it('should throw UnsupportedChartTypeError if chartType is not Natal', () => {
    const input = EngineInput.create(validBirthData, {
      ...validChartOptions,
      chartType: 'Transit' as ChartType,
    });
    expect(() => ChartInputValidator.validate(input)).toThrowError(UnsupportedChartTypeError);
  });

  it('should throw InvalidCoordinateError for out-of-range latitude', () => {
    const input = EngineInput.create({ ...validBirthData, latitude: 91 }, validChartOptions);
    expect(() => ChartInputValidator.validate(input)).toThrowError(InvalidCoordinateError);

    const input2 = EngineInput.create({ ...validBirthData, latitude: -91 }, validChartOptions);
    expect(() => ChartInputValidator.validate(input2)).toThrowError(InvalidCoordinateError);
  });

  it('should throw InvalidCoordinateError for out-of-range longitude', () => {
    const input = EngineInput.create({ ...validBirthData, longitude: 181 }, validChartOptions);
    expect(() => ChartInputValidator.validate(input)).toThrowError(InvalidCoordinateError);

    const input2 = EngineInput.create({ ...validBirthData, longitude: -181 }, validChartOptions);
    expect(() => ChartInputValidator.validate(input2)).toThrowError(InvalidCoordinateError);
  });

  it('should throw InvalidDateTimeError for invalid birthDate', () => {
    const input = EngineInput.create(
      { ...validBirthData, birthDate: new Date('invalid-date') },
      validChartOptions,
    );
    expect(() => ChartInputValidator.validate(input)).toThrowError(InvalidDateTimeError);
  });

  it('should throw InvalidDateTimeError for invalid birthTime', () => {
    const inputHour = EngineInput.create(
      { ...validBirthData, birthTime: { hour: 24, minute: 0, second: 0 } },
      validChartOptions,
    );
    expect(() => ChartInputValidator.validate(inputHour)).toThrowError(InvalidDateTimeError);

    const inputMinute = EngineInput.create(
      { ...validBirthData, birthTime: { hour: 12, minute: -1, second: 0 } },
      validChartOptions,
    );
    expect(() => ChartInputValidator.validate(inputMinute)).toThrowError(InvalidDateTimeError);

    const inputSecond = EngineInput.create(
      { ...validBirthData, birthTime: { hour: 12, minute: 0, second: 60 } },
      validChartOptions,
    );
    expect(() => ChartInputValidator.validate(inputSecond)).toThrowError(InvalidDateTimeError);
  });

  it('should pass validation if birthTime is null', () => {
    const input = EngineInput.create(
      { ...validBirthData, birthTime: null, isBirthTimeKnown: false },
      validChartOptions,
    );
    expect(() => ChartInputValidator.validate(input)).not.toThrow();
  });

  it('should throw InvalidDateTimeError if isBirthTimeKnown is true but birthTime is null', () => {
    const input = EngineInput.create(
      { ...validBirthData, birthTime: null, isBirthTimeKnown: true },
      validChartOptions,
    );
    expect(() => ChartInputValidator.validate(input)).toThrowError(InvalidDateTimeError);
  });

  it('should throw InvalidDateTimeError if isBirthTimeKnown is false but birthTime is not null', () => {
    const input = EngineInput.create(
      { ...validBirthData, birthTime: { hour: 12, minute: 0, second: 0 }, isBirthTimeKnown: false },
      validChartOptions,
    );
    expect(() => ChartInputValidator.validate(input)).toThrowError(InvalidDateTimeError);
  });

  it('should throw UnsupportedHouseSystemError for unsupported house system', () => {
    const input = EngineInput.create(validBirthData, {
      ...validChartOptions,
      houseSystem: 'Koch' as HouseSystem,
    });
    expect(() => ChartInputValidator.validate(input)).toThrowError(UnsupportedHouseSystemError);
  });

  it('should throw UnsupportedCelestialBodyError for unsupported optional point', () => {
    const input = EngineInput.create(validBirthData, {
      ...validChartOptions,
      includeOptionalPoints: [PlanetName.Sun], // Sun is a standard planet, not optional
    });
    expect(() => ChartInputValidator.validate(input)).toThrowError(UnsupportedCelestialBodyError);
  });
});
