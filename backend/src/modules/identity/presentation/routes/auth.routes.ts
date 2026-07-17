import { Router } from 'express';

import { asyncHandler } from '../../../../shared/express/async-handler.js';
import { validate } from '../../../../shared/middlewares/validate.middleware.js';
import { AuthController } from '../controllers/auth.controller.js';
import { registerSchema } from '../schemas/register.schema.js';

export const createAuthRoutes = (authController: AuthController): Router => {
  const router = Router();
  const authRouter = Router();

  authRouter.post(
    '/register',
    validate(registerSchema),
    asyncHandler(authController.registerHandler),
  );

  router.use('/api/v1/auth', authRouter);

  return router;
};
