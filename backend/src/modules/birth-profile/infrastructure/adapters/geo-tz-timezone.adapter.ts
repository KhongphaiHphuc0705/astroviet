import { find } from 'geo-tz';

import { ITimezoneProvider } from '../../domain/ports/timezone-provider.port.js';
import { Coordinates } from '../../domain/value-objects/coordinates.vo.js';
import { defaultLogger } from '../../../../shared/logger/pino.logger.js';

export class GeoTzTimezoneAdapter implements ITimezoneProvider {
  public async resolveHistorical(coordinates: Coordinates, _date: Date): Promise<string> {
    const timezones = find(coordinates.latitude, coordinates.longitude);

    if (!timezones || timezones.length === 0) {
      throw new Error('Could not resolve timezone for the given coordinates');
    }

    if (timezones.length > 1) {
      defaultLogger.warn(
        'Multiple timezones found for coordinates, using the first one',
        { 
          coordinates: { latitude: coordinates.latitude, longitude: coordinates.longitude }, 
          timezones 
        }
      );
    }

    return timezones[0] as string;
  }
}
