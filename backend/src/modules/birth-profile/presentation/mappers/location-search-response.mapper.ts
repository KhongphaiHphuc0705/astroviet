import { LocationSuggestion } from '../../domain/ports/location-search-provider.port.js';

export interface LocationSuggestionResponse {
  placeName: string;
  latitude: number;
  longitude: number;
  historicalTimezoneId: string;
}

export function toLocationSearchResponse(
  suggestions: LocationSuggestion[],
): LocationSuggestionResponse[] {
  return suggestions.map((suggestion) => ({
    placeName: suggestion.placeName,
    latitude: suggestion.latitude,
    longitude: suggestion.longitude,
    historicalTimezoneId: suggestion.historicalTimezoneId,
  }));
}
