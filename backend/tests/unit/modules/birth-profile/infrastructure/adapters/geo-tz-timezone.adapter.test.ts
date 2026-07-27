import * as geoTz from 'geo-tz';
import { describe, it, expect, vi } from 'vitest';

import { Coordinates } from '../../../../../../src/modules/birth-profile/domain/value-objects/coordinates.vo.js';
import { GeoTzTimezoneAdapter } from '../../../../../../src/modules/birth-profile/infrastructure/adapters/geo-tz-timezone.adapter.js';
import { ExternalServiceError } from '../../../../../../src/shared/errors/app-error.js';
import { ErrorCode } from '../../../../../../src/shared/errors/error-codes.js';
import { defaultLogger } from '../../../../../../src/shared/logger/pino.logger.js';

vi.mock('geo-tz', () => ({
  find: vi.fn(),
}));

vi.mock('../../../../../../src/shared/logger/pino.logger.js', () => ({
  defaultLogger: {
    warn: vi.fn(),
  },
}));

describe('GeoTzTimezoneAdapter', () => {
  const adapter = new GeoTzTimezoneAdapter();
  const mockDate = new Date('1990-01-01');

  it('should return the first timezone when found', async () => {
    vi.mocked(geoTz.find).mockReturnValue(['Asia/Ho_Chi_Minh']);
    const coordinates = Coordinates.create(21.0285, 105.8542);

    const result = await adapter.resolveHistorical(coordinates, mockDate);

    expect(result).toBe('Asia/Ho_Chi_Minh');
    expect(geoTz.find).toHaveBeenCalledWith(coordinates.latitude, coordinates.longitude);
  });

  it('should throw an ExternalServiceError if no timezone is found', async () => {
    vi.mocked(geoTz.find).mockReturnValue([]);
    const coordinates = Coordinates.create(0, 0);

    let error: any;
    try {
      await adapter.resolveHistorical(coordinates, mockDate);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(ExternalServiceError);
    expect(error.errorCode).toBe(ErrorCode.GEOCODING_PROVIDER_ERROR);
  });

  it('should log a warning and return the first timezone if multiple are found', async () => {
    vi.mocked(geoTz.find).mockReturnValue(['Europe/Paris', 'Europe/Berlin']);
    const coordinates = Coordinates.create(49.0, 8.0);

    const result = await adapter.resolveHistorical(coordinates, mockDate);

    expect(result).toBe('Europe/Paris');
    expect(defaultLogger.warn).toHaveBeenCalledWith(
      'Multiple timezones found for coordinates, using the first one',
      {
        coordinates: { latitude: coordinates.latitude, longitude: coordinates.longitude },
        timezones: ['Europe/Paris', 'Europe/Berlin'],
      },
    );
  });
});
