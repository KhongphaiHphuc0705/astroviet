import {
  InvalidCoordinateError,
  InvalidDateTimeError,
  UnsupportedCelestialBodyError,
  UnsupportedChartTypeError,
  UnsupportedHouseSystemError,
} from '../../errors/chart.errors.js';
import { ChartType, HouseSystem, PlanetName } from '../../types/chart.types.js';
import { EngineInput } from '../../value-objects/engine-input.vo.js';

export class ChartInputValidator {
  /**
   * Validates an EngineInput object.
   * Throws the first domain error encountered (Fail-fast).
   */
  public static validate(input: EngineInput): void {
    const { birthData, chartOptions } = input;

    // 1. ChartType Validation
    if (chartOptions.chartType !== ChartType.Natal) {
      throw new UnsupportedChartTypeError(
        `Chart type '${chartOptions.chartType}' is not supported.`,
      );
    }

    // 2. Coordinate Validation
    if (birthData.latitude < -90 || birthData.latitude > 90) {
      throw new InvalidCoordinateError('Vĩ độ (latitude) phải nằm trong khoảng từ -90 đến 90.');
    }

    if (birthData.longitude < -180 || birthData.longitude > 180) {
      throw new InvalidCoordinateError(
        'Kinh độ (longitude) phải nằm trong khoảng từ -180 đến 180.',
      );
    }

    // 3. DateTime Validation
    if (isNaN(birthData.birthDate.getTime())) {
      throw new InvalidDateTimeError('Ngày sinh không hợp lệ.');
    }

    if (birthData.isBirthTimeKnown && birthData.birthTime === null) {
      throw new InvalidDateTimeError('isBirthTimeKnown=true nhưng birthTime bị thiếu.');
    }

    if (!birthData.isBirthTimeKnown && birthData.birthTime !== null) {
      throw new InvalidDateTimeError('isBirthTimeKnown=false nhưng birthTime lại có giá trị.');
    }

    if (birthData.birthTime !== null) {
      const { hour, minute, second } = birthData.birthTime;
      if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
        throw new InvalidDateTimeError('Giờ sinh không hợp lệ.');
      }
    }

    // 4. HouseSystem Validation
    if (
      chartOptions.houseSystem !== HouseSystem.Placidus &&
      chartOptions.houseSystem !== HouseSystem.WholeSign
    ) {
      throw new UnsupportedHouseSystemError(
        `Hệ thống nhà '${chartOptions.houseSystem}' chưa được hỗ trợ.`,
      );
    }

    // 5. OptionalPoints Validation
    const allowedOptionalPoints = [
      PlanetName.Chiron,
      PlanetName.Lilith,
      PlanetName.NorthNode,
      PlanetName.SouthNode,
    ];

    for (const point of chartOptions.includeOptionalPoints) {
      if (!allowedOptionalPoints.includes(point)) {
        throw new UnsupportedCelestialBodyError(
          `Thiên thể '${point}' không được hỗ trợ như một optional point.`,
        );
      }
    }
  }
}
