import { Router } from 'express';

import { asyncHandler } from '../../../../shared/express/async-handler.js';
import { validate } from '../../../../shared/middlewares/validate.middleware.js';
import { AuthController } from '../controllers/auth.controller.js';
import { loginSchema } from '../schemas/login.schema.js';
import { registerSchema } from '../schemas/register.schema.js';

export const createAuthRoutes = (authController: AuthController): Router => {
  const router = Router();
  const authRouter = Router();

  authRouter.post(
    '/register',
    validate(registerSchema),
    asyncHandler(authController.registerHandler),
  );

  authRouter.post('/login', validate(loginSchema), asyncHandler(authController.loginHandler));

  router.use('/api/v1/auth', authRouter);

  return router;
};
