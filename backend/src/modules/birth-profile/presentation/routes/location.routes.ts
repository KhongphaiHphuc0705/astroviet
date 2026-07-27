import { Router, Request } from 'express';

import { asyncHandler } from '../../../../shared/express/async-handler.js';
import { validateQuery } from '../../../../shared/middlewares/validate-query.middleware.js';
import { LocationSearchController } from '../controllers/location-search.controller.js';
import {
  SearchLocationsQuery,
  searchLocationsQuerySchema,
} from '../schemas/location-search.schema.js';

export function createLocationRoutes(controller: LocationSearchController): Router {
  const router = Router();

  router.get(
    '/search',
    validateQuery(searchLocationsQuerySchema),
    asyncHandler((req, res) =>
      controller.search(
        req as unknown as Request<unknown, unknown, unknown, SearchLocationsQuery>,
        res,
      ),
    ),
  );

  return router;
}
