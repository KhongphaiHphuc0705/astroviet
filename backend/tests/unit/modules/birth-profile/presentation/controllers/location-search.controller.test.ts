import { Request, Response } from 'express';
import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';

import { SearchBirthLocationsUseCase } from '../../../../../../src/modules/birth-profile/application/use-cases/search-birth-locations.usecase.js';
import { LocationSearchController } from '../../../../../../src/modules/birth-profile/presentation/controllers/location-search.controller.js';

describe('LocationSearchController', () => {
  let controller: LocationSearchController;
  let mockUseCase: Mocked<SearchBirthLocationsUseCase>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockUseCase = {
      execute: vi.fn(),
    } as any;

    controller = new LocationSearchController(mockUseCase);

    mockReq = {
      query: { q: 'Hanoi', date: '2000-01-01' },
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('should return location suggestions successfully', async () => {
    const suggestions = [
      {
        placeName: 'Hanoi',
        latitude: 21.0,
        longitude: 105.0,
        historicalTimezoneId: 'Asia/Ho_Chi_Minh',
      },
    ];
    mockUseCase.execute.mockResolvedValue(suggestions);

    await controller.search(mockReq as Request<any, any, any, any>, mockRes as Response);

    expect(mockUseCase.execute).toHaveBeenCalledWith('Hanoi', expect.any(Date));
    // Verify it parses the correct date
    const calledDate = mockUseCase.execute.mock.calls[0][1];
    expect(calledDate.toISOString().startsWith('2000-01-01')).toBe(true);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(suggestions);
  });
});
