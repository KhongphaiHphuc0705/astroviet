import { z } from 'zod';

import { registry } from '../../../../docs/openapi.js';
import { searchLocationsQuerySchema } from '../schemas/location-search.schema.js';

export const locationSuggestionSchema = z
  .object({
    placeName: z.string().openapi({ example: 'Hanoi, Vietnam' }),
    latitude: z.number().openapi({ example: 21.0285 }),
    longitude: z.number().openapi({ example: 105.8542 }),
    historicalTimezoneId: z.string().openapi({ example: 'Asia/Ho_Chi_Minh' }),
  })
  .openapi('LocationSuggestion');

export const searchLocationsResponseSchema = z
  .array(locationSuggestionSchema)
  .openapi('SearchLocationsResponse');

registry.registerPath({
  method: 'get',
  path: '/locations/search',
  tags: ['Locations'],
  summary: 'Search birth locations',
  description: 'Autocompletes location search and resolves historical timezones.',
  request: {
    query: searchLocationsQuerySchema,
  },
  responses: {
    200: {
      description: 'A list of location suggestions.',
      content: {
        'application/json': {
          schema: searchLocationsResponseSchema,
        },
      },
    },
    400: {
      description: 'Validation error.',
    },
    502: {
      description: 'External geocoding service error.',
    },
  },
});
