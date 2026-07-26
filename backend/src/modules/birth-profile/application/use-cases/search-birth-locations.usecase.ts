import {
  ILocationSearchProvider,
  LocationSuggestion,
} from '../../domain/ports/location-search-provider.port.js';

export class SearchBirthLocationsUseCase {
  constructor(private readonly locationSearchProvider: ILocationSearchProvider) {}

  public async execute(query: string, dateContext: Date): Promise<LocationSuggestion[]> {
    return this.locationSearchProvider.search(query, dateContext);
  }
}
