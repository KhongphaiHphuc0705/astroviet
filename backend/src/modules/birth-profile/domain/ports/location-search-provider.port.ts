export interface LocationSuggestion {
  placeName: string;
  latitude: number;
  longitude: number;
  historicalTimezoneId: string;
}

export interface ILocationSearchProvider {
  search(query: string, dateContext: Date): Promise<LocationSuggestion[]>;
}
