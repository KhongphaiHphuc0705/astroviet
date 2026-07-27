import { z } from 'zod';

import { ExternalServiceError } from '../../../../shared/errors/app-error.js';
import { ErrorCode } from '../../../../shared/errors/error-codes.js';
import { defaultLogger } from '../../../../shared/logger/pino.logger.js';
import {
  ILocationSearchProvider,
  LocationSuggestion,
} from '../../domain/ports/location-search-provider.port.js';
import { ITimezoneProvider } from '../../domain/ports/timezone-provider.port.js';
import { Coordinates } from '../../domain/value-objects/coordinates.vo.js';

export interface GeoNamesConfig {
  username: string;
}

const geoNameItemSchema = z.object({
  name: z.string(),
  lat: z.string(),
  lng: z.string(),
  adminName1: z.string().optional(),
  countryName: z.string().optional(),
});

const geoNamesSearchResponseSchema = z.object({
  geonames: z.array(geoNameItemSchema),
});

export class GeoNamesLocationSearchAdapter implements ILocationSearchProvider {
  constructor(
    private readonly config: GeoNamesConfig,
    private readonly timezoneProvider: ITimezoneProvider,
  ) {}

  public async search(query: string, dateContext: Date): Promise<LocationSuggestion[]> {
    return this.executeWithRetry(query, dateContext, 1);
  }

  private async executeWithRetry(
    query: string,
    dateContext: Date,
    retriesLeft: number,
  ): Promise<LocationSuggestion[]> {
    const url = new URL('https://secure.geonames.org/searchJSON');
    url.searchParams.append('q', query);
    url.searchParams.append('maxRows', '10');
    url.searchParams.append('username', this.config.username);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      let response: Response;
      try {
        response = await fetch(url.toString(), {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Astroviet/1.0',
          },
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        if (response.status >= 500 && retriesLeft > 0) {
          defaultLogger.warn('GeoNames 5xx error, retrying', { status: response.status });
          return this.executeWithRetry(query, dateContext, retriesLeft - 1);
        }

        throw new ExternalServiceError(
          ErrorCode.GEOCODING_PROVIDER_ERROR,
          `GeoNames API returned status ${response.status}`,
        );
      }

      const json = await response.json();
      const parsed = geoNamesSearchResponseSchema.safeParse(json);

      if (!parsed.success) {
        throw new ExternalServiceError(
          ErrorCode.GEOCODING_PROVIDER_ERROR,
          'Invalid response format from GeoNames',
        );
      }

      const suggestions: LocationSuggestion[] = [];

      for (const item of parsed.data.geonames) {
        const latitude = parseFloat(item.lat);
        const longitude = parseFloat(item.lng);

        let historicalTimezoneId = '';
        try {
          const coordinates = Coordinates.create(latitude, longitude);
          historicalTimezoneId = await this.timezoneProvider.resolveHistorical(
            coordinates,
            dateContext,
          );
        } catch (err) {
          defaultLogger.warn(
            'Skipping location suggestion due to invalid coordinates or timezone resolution failure',
            { err, placeName: item.name },
          );
          continue;
        }

        const placeParts = [item.name, item.adminName1, item.countryName].filter(Boolean);

        suggestions.push({
          placeName: placeParts.join(', '),
          latitude,
          longitude,
          historicalTimezoneId,
        });
      }

      return suggestions;
    } catch (err: unknown) {
      if (err instanceof ExternalServiceError) {
        throw err;
      }

      const error = err instanceof Error ? err : new Error(String(err));
      const cause = error.cause as Record<string, unknown> | undefined;
      const errorObj = error as unknown as Record<string, unknown>;

      if (
        error.name === 'AbortError' ||
        cause?.code === 'ECONNREFUSED' ||
        errorObj.type === 'system'
      ) {
        if (retriesLeft > 0) {
          defaultLogger.warn('Network error communicating with GeoNames, retrying', {
            error: error.message,
          });
          return this.executeWithRetry(query, dateContext, retriesLeft - 1);
        }

        defaultLogger.error('Failed to fetch from GeoNames after retries', { query });
        throw new ExternalServiceError(
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          'Network error communicating with GeoNames',
        );
      }

      // Other errors like parse errors or unexpected issues
      if (retriesLeft > 0 && error.message?.includes('fetch')) {
        return this.executeWithRetry(query, dateContext, retriesLeft - 1);
      }

      throw new ExternalServiceError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        error.message || 'Unknown error communicating with external service',
      );
    }
  }
}
