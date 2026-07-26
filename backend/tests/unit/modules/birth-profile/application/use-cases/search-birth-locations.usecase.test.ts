import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';

import { SearchBirthLocationsUseCase } from '../../../../../../src/modules/birth-profile/application/use-cases/search-birth-locations.usecase.js';
import { ILocationSearchProvider } from '../../../../../../src/modules/birth-profile/domain/ports/location-search-provider.port.js';

describe('SearchBirthLocationsUseCase', () => {
  let useCase: SearchBirthLocationsUseCase;
  let mockProvider: Mocked<ILocationSearchProvider>;

  beforeEach(() => {
    mockProvider = {
      search: vi.fn(),
    };
    useCase = new SearchBirthLocationsUseCase(mockProvider);
  });

  const mockDate = new Date('1990-01-01');

  it('should successfully return location suggestions', async () => {
    const suggestions = [
      {
        placeName: 'Hanoi',
        latitude: 21.0,
        longitude: 105.0,
        historicalTimezoneId: 'Asia/Ho_Chi_Minh',
      },
    ];
    mockProvider.search.mockResolvedValue(suggestions);

    const result = await useCase.execute('Hanoi', mockDate);

    expect(result).toEqual(suggestions);
    expect(mockProvider.search).toHaveBeenCalledWith('Hanoi', mockDate);
  });

  it('should return an empty array if provider returns empty array', async () => {
    mockProvider.search.mockResolvedValue([]);

    const result = await useCase.execute('Nowhere', mockDate);

    expect(result).toEqual([]);
    expect(mockProvider.search).toHaveBeenCalledWith('Nowhere', mockDate);
  });

  it('should propagate errors from the provider', async () => {
    const error = new Error('Provider error');
    mockProvider.search.mockRejectedValue(error);

    await expect(useCase.execute('Fail', mockDate)).rejects.toThrow('Provider error');
    expect(mockProvider.search).toHaveBeenCalledWith('Fail', mockDate);
  });
});
