import SwissEph from 'swisseph-wasm';

import { ExternalServiceError } from '../../../../shared/errors/app-error.js';
import { ErrorCode } from '../../../../shared/errors/error-codes.js';
import { defaultLogger as logger } from '../../../../shared/logger/pino.logger.js';
import { UnsupportedChartTypeError } from '../../domain/errors/chart.errors.js';
import {
  IEphemerisProvider,
  EphemerisRequest,
  RawEphemerisData,
  HouseCalculationRequest,
  HouseCalculationResult,
} from '../../domain/ports/ephemeris-provider.port.js';
import { PlanetName } from '../../domain/types/chart.types.js';

import { celestialBodyMapping } from './celestial-body.mapping.js';
import { isAboveConvergenceLatitude } from './high-latitude-policy.js';
import { houseSystemMapping } from './house-system.mapping.js';

class Mutex {
  private promise: Promise<void> = Promise.resolve();

  async run<T>(task: () => Promise<T>): Promise<T> {
    const prev = this.promise;
    let resolveNext!: () => void;
    this.promise = new Promise((resolve) => {
      resolveNext = resolve;
    });
    await prev;
    try {
      return await task();
    } finally {
      resolveNext();
    }
  }
}

export class SwissEphemerisAdapter implements IEphemerisProvider {
  private readonly mutex = new Mutex();
  private readonly SEFLG_SWIEPH = 2;
  private readonly SEFLG_SPEED = 256;

  constructor(private readonly swe: SwissEph) {}

  async calculateNatal(request: EphemerisRequest): Promise<RawEphemerisData> {
    return this.mutex.run(async () => {
      try {
        const julianDay = this.swe.julday(
          request.utcDateTime.getUTCFullYear(),
          request.utcDateTime.getUTCMonth() + 1,
          request.utcDateTime.getUTCDate(),
          request.utcDateTime.getUTCHours() +
            request.utcDateTime.getUTCMinutes() / 60 +
            request.utcDateTime.getUTCSeconds() / 3600,
        );

        const planets: RawEphemerisData['planets'] = [];

        // All 14 celestial bodies required by the contract
        const requiredPlanets: Exclude<PlanetName, PlanetName.SouthNode>[] = [
          PlanetName.Sun,
          PlanetName.Moon,
          PlanetName.Mercury,
          PlanetName.Venus,
          PlanetName.Mars,
          PlanetName.Jupiter,
          PlanetName.Saturn,
          PlanetName.Uranus,
          PlanetName.Neptune,
          PlanetName.Pluto,
          PlanetName.Chiron,
          PlanetName.NorthNode,
          PlanetName.Lilith,
        ];

        let northNodeLongitude = 0;

        for (const planetName of requiredPlanets) {
          const seConstant = celestialBodyMapping[planetName];
          const raw = this.swe.calc_ut(julianDay, seConstant, this.SEFLG_SWIEPH | this.SEFLG_SPEED);

          const longitude = raw[0] as number;
          const latitude = raw[1] as number;
          const speed = raw[3] as number;

          planets.push({
            name: planetName,
            longitude,
            latitude,
            speed,
          });

          if (planetName === PlanetName.NorthNode) {
            northNodeLongitude = longitude;
          }
        }

        // SouthNode is mathematically derived (NorthNode + 180 degrees mod 360)
        planets.push({
          name: PlanetName.SouthNode,
          longitude: (northNodeLongitude + 180) % 360,
          latitude: 0,
          speed: 0,
        });

        return { planets };
      } catch (err) {
        logger.error('Ephemeris calculation failed', { module: 'chart' }, err as Error);
        throw new ExternalServiceError(
          ErrorCode.EPHEMERIS_PROVIDER_ERROR,
          'Không thể tính toán vị trí thiên thể',
        );
      }
    });
  }

  async calculateHouses(request: HouseCalculationRequest): Promise<HouseCalculationResult> {
    return this.mutex.run(async () => {
      try {
        if (isAboveConvergenceLatitude(request.coordinates.latitude)) {
          return { status: 'not_convergent' };
        }

        const julianDay = this.swe.julday(
          request.utcDateTime.getUTCFullYear(),
          request.utcDateTime.getUTCMonth() + 1,
          request.utcDateTime.getUTCDate(),
          request.utcDateTime.getUTCHours() +
            request.utcDateTime.getUTCMinutes() / 60 +
            request.utcDateTime.getUTCSeconds() / 3600,
        );

        const hsysCode = houseSystemMapping[request.houseSystem];
        const result = this.swe.houses(
          julianDay,
          request.coordinates.latitude,
          request.coordinates.longitude,
          hsysCode,
        );

        // Result from swisseph-wasm: cusps has 13 elements, index 0 is unused.
        // We must extract index 1 to 12.
        const cusps12 = Array.from(result.cusps).slice(1, 13);

        return {
          status: 'success',
          data: {
            cusps: cusps12,
            ascendant: result.ascmc[0] as number,
            midheaven: result.ascmc[1] as number,
          },
        };
      } catch (err) {
        logger.error('House calculation failed', { module: 'chart' }, err as Error);
        throw new ExternalServiceError(
          ErrorCode.EPHEMERIS_PROVIDER_ERROR,
          'Không thể tính toán cấu trúc nhà',
        );
      }
    });
  }

  async calculateTransit(_request: EphemerisRequest): Promise<RawEphemerisData> {
    throw new UnsupportedChartTypeError('Transit charts are not supported in the current MVP.');
  }
}
