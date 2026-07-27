import { describe, it, expect, vi, beforeEach, afterEach, Mocked } from 'vitest';

import { ITimezoneProvider } from '../../../../../../src/modules/birth-profile/domain/ports/timezone-provider.port.js';
import { GeoNamesLocationSearchAdapter } from '../../../../../../src/modules/birth-profile/infrastructure/adapters/geonames-location-search.adapter.js';
import { ExternalServiceError } from '../../../../../../src/shared/errors/app-error.js';
import { ErrorCode } from '../../../../../../src/shared/errors/error-codes.js';
import { defaultLogger } from '../../../../../../src/shared/logger/pino.logger.js';

vi.mock('../../../../../../src/shared/logger/pino.logger.js', () => ({
  defaultLogger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('GeoNamesLocationSearchAdapter', () => {
  let adapter: GeoNamesLocationSearchAdapter;
  let mockTimezoneProvider: Mocked<ITimezoneProvider>;
  let globalFetchMock: any;

  beforeEach(() => {
    mockTimezoneProvider = {
      resolveHistorical: vi.fn(),
    } as any;

    adapter = new GeoNamesLocationSearchAdapter({ username: 'testuser' }, mockTimezoneProvider);

    globalFetchMock = vi.fn();
    global.fetch = globalFetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockDate = new Date('1990-01-01');

  it('should successfully search and map results', async () => {
    const mockResponse = {
      geonames: [
        {
          name: 'Hanoi',
          lat: '21.0285',
          lng: '105.8542',
          adminName1: 'Hanoi Province',
          countryName: 'Vietnam',
        },
      ],
    };

    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(mockResponse),
    });

    mockTimezoneProvider.resolveHistorical.mockResolvedValue('Asia/Ho_Chi_Minh');

    const result = await adapter.search('Hanoi', mockDate);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      placeName: 'Hanoi, Hanoi Province, Vietnam',
      latitude: 21.0285,
      longitude: 105.8542,
      historicalTimezoneId: 'Asia/Ho_Chi_Minh',
    });

    expect(globalFetchMock).toHaveBeenCalledTimes(1);
    const requestUrl = globalFetchMock.mock.calls[0][0];
    expect(requestUrl).toContain('https://secure.geonames.org');
    expect(requestUrl).toContain('q=Hanoi');
    expect(requestUrl).toContain('username=testuser');
    expect(requestUrl).toContain('maxRows=10');
  });

  it('should throw GeocodingProviderError on 4xx response without retry', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    let error: any;
    try {
      await adapter.search('Hanoi', mockDate);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(ExternalServiceError);
    expect(error.errorCode).toBe(ErrorCode.GEOCODING_PROVIDER_ERROR);
    expect(globalFetchMock).toHaveBeenCalledTimes(1); // No retry for 4xx
  });

  it('should retry on 5xx response and succeed', async () => {
    globalFetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          geonames: [{ name: 'Test', lat: '0', lng: '0' }],
        }),
      });

    mockTimezoneProvider.resolveHistorical.mockResolvedValue('UTC');

    const result = await adapter.search('Test', mockDate);

    expect(result).toHaveLength(1);
    expect(globalFetchMock).toHaveBeenCalledTimes(2);
    expect(defaultLogger.warn).toHaveBeenCalledWith(
      'GeoNames 5xx error, retrying',
      expect.objectContaining({ status: 500 }),
    );
  });

  it('should throw ExternalServiceError if network request rejects', async () => {
    const networkError = new Error('fetch failed');
    (networkError as any).cause = { code: 'ECONNREFUSED' };

    globalFetchMock.mockRejectedValue(networkError);

    let error: any;
    try {
      await adapter.search('Hanoi', mockDate);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(ExternalServiceError);
    expect(error.errorCode).toBe(ErrorCode.EXTERNAL_SERVICE_ERROR);
    expect(globalFetchMock).toHaveBeenCalledTimes(2); // Initial + 1 retry
    expect(defaultLogger.error).toHaveBeenCalled();
  });

  it('should throw GeocodingProviderError if response shape is invalid', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ invalid: 'shape' }),
    });

    let error: any;
    try {
      await adapter.search('Hanoi', mockDate);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(ExternalServiceError);
    expect(error.errorCode).toBe(ErrorCode.GEOCODING_PROVIDER_ERROR);
    expect(error.message).toBe('Invalid response format from GeoNames');
  });

  it('should skip items that have invalid coordinates or fail timezone resolution and continue with valid items', async () => {
    const mockResponse = {
      geonames: [
        {
          name: 'Invalid Place',
          lat: 'NaN',
          lng: '105.8542',
        },
        {
          name: 'Valid Place',
          lat: '21.0285',
          lng: '105.8542',
        },
      ],
    };

    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(mockResponse),
    });

    mockTimezoneProvider.resolveHistorical.mockResolvedValue('Asia/Ho_Chi_Minh');

    const result = await adapter.search('Place', mockDate);

    expect(result).toHaveLength(1);
    expect(result[0].placeName).toBe('Valid Place');

    expect(defaultLogger.warn).toHaveBeenCalledWith(
      'Skipping location suggestion due to invalid coordinates or timezone resolution failure',
      expect.objectContaining({ placeName: 'Invalid Place' }),
    );
  });
});
