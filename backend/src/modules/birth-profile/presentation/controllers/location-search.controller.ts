import { Request, Response } from 'express';

import { SearchBirthLocationsUseCase } from '../../application/use-cases/search-birth-locations.usecase.js';
import { toLocationSearchResponse } from '../mappers/location-search-response.mapper.js';
import { SearchLocationsQuery } from '../schemas/location-search.schema.js';

export class LocationSearchController {
  constructor(private readonly searchLocationsUseCase: SearchBirthLocationsUseCase) {}

  public async search(
    req: Request<unknown, unknown, unknown, SearchLocationsQuery>,
    res: Response,
  ): Promise<void> {
    const { q, date } = req.query;
    
    // Parse the date from query param as the context date for timezone resolution
    const dateContext = new Date(date);

    const suggestions = await this.searchLocationsUseCase.execute(q, dateContext);
    const responseBody = toLocationSearchResponse(suggestions);

    res.status(200).json(responseBody);
  }
}
