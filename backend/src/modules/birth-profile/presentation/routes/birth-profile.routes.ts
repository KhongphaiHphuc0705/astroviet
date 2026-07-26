import { Router } from 'express';

import { asyncHandler } from '../../../../shared/express/async-handler.js';
import { authMiddleware } from '../../../../shared/middlewares/auth.middleware.js';
import { requireAuth } from '../../../../shared/middlewares/require-auth.middleware.js';
import { validateBody } from '../../../../shared/middlewares/validate-body.middleware.js';
import { validateParams } from '../../../../shared/middlewares/validate-params.middleware.js';
import { validateQuery } from '../../../../shared/middlewares/validate-query.middleware.js';
import { ITokenProvider } from '../../../identity/domain/ports/token-provider.port.js';
import { BirthProfileController } from '../controllers/birth-profile.controller.js';
import { birthProfileIdSchema } from '../schemas/birth-profile-id.schema.js';
import { createBirthProfileSchema } from '../schemas/create-birth-profile.schema.js';
import { listBirthProfilesQuerySchema } from '../schemas/list-birth-profiles-query.schema.js';
import { updateBirthProfileSchema } from '../schemas/update-birth-profile.schema.js';

export const createBirthProfileRoutes = (
  controller: BirthProfileController,
  tokenProvider: ITokenProvider,
): Router => {
  const router = Router();
  const bpRouter = Router();

  // All endpoints require authentication
  bpRouter.use(authMiddleware(tokenProvider), requireAuth());

  bpRouter.post(
    '/',
    validateBody(createBirthProfileSchema),
    asyncHandler(controller.createHandler),
  );

  bpRouter.get(
    '/',
    validateQuery(listBirthProfilesQuerySchema),
    asyncHandler(controller.listHandler),
  );

  bpRouter.get('/:id', validateParams(birthProfileIdSchema), asyncHandler(controller.getHandler));

  bpRouter.patch(
    '/:id',
    validateParams(birthProfileIdSchema),
    validateBody(updateBirthProfileSchema),
    asyncHandler(controller.updateHandler),
  );

  bpRouter.delete(
    '/:id',
    validateParams(birthProfileIdSchema),
    asyncHandler(controller.deleteHandler),
  );

  router.use('/api/v1/birth-profiles', bpRouter);

  return router;
};
