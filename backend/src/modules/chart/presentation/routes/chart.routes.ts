import { Router } from 'express';

import { asyncHandler } from '../../../../shared/express/async-handler.js';
import { authMiddleware } from '../../../../shared/middlewares/auth.middleware.js';
import { requireAuth } from '../../../../shared/middlewares/require-auth.middleware.js';
import { validateBody } from '../../../../shared/middlewares/validate-body.middleware.js';
import { validateParams } from '../../../../shared/middlewares/validate-params.middleware.js';
import { validateQuery } from '../../../../shared/middlewares/validate-query.middleware.js';
import { ChartController } from '../controllers/chart.controller.js';
import { chartIdSchema } from '../schemas/chart-id.schema.js';
import { createNatalChartQuerySchema } from '../schemas/create-natal-chart-query.schema.js';
import { createNatalChartSchema } from '../schemas/create-natal-chart.schema.js';
import { listChartsQuerySchema } from '../schemas/list-charts-query.schema.js';

export const createChartRoutes = (
  controller: ChartController,
  tokenProvider: Parameters<typeof authMiddleware>[0],
): Router => {
  const router = Router();
  const chartRouter = Router();

  // authMiddleware áp dụng TOÀN BỘ (populate req.user nếu có token, không throw) — khác birth-profile
  chartRouter.use(authMiddleware(tokenProvider));

  chartRouter.post(
    '/natal',
    validateQuery(createNatalChartQuerySchema),
    validateBody(createNatalChartSchema),
    asyncHandler(controller.createHandler),
    // KHÔNG requireAuth() — Guest hợp lệ cho save=false
  );

  chartRouter.get(
    '/',
    requireAuth(),
    validateQuery(listChartsQuerySchema),
    asyncHandler(controller.listHandler),
  );

  chartRouter.get(
    '/:id',
    requireAuth(),
    validateParams(chartIdSchema),
    asyncHandler(controller.getHandler),
  );

  chartRouter.delete(
    '/:id',
    requireAuth(),
    validateParams(chartIdSchema),
    asyncHandler(controller.deleteHandler),
  );

  router.use('/api/v1/charts', chartRouter);

  return router;
};
