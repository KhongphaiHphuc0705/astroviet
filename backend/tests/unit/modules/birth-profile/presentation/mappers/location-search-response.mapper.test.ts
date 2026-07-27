import { describe, it, expect } from 'vitest';

import { LocationSuggestion } from '../../../../../../src/modules/birth-profile/domain/ports/location-search-provider.port.js';
import { toLocationSearchResponse } from '../../../../../../src/modules/birth-profile/presentation/mappers/location-search-response.mapper.js';

describe('LocationSearchResponseMapper', () => {
  it('should map suggestions to response DTOs', () => {
    const suggestions: LocationSuggestion[] = [
      {
        placeName: 'Hanoi',
        latitude: 21.0,
        longitude: 105.0,
        historicalTimezoneId: 'Asia/Ho_Chi_Minh',
      },
    ];

    const result = toLocationSearchResponse(suggestions);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      placeName: 'Hanoi',
      latitude: 21.0,
      longitude: 105.0,
      historicalTimezoneId: 'Asia/Ho_Chi_Minh',
    });
  });
});
