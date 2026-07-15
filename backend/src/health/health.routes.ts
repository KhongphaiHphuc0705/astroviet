import { Router } from 'express';

import { asyncHandler } from '../shared/express/index.js';

import { HealthController } from './health.controller.js';

export const createHealthRoutes = (healthController: HealthController): Router => {
  const router = Router();

  router.get('/live', healthController.getLive);
  router.get('/ready', asyncHandler(healthController.getReady));
  router.get('/health', asyncHandler(healthController.getHealth));

  return router;
};
