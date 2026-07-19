import { Router } from 'express';

import { asyncHandler } from '../../../../shared/express/async-handler.js';
import { authenticate } from '../../../../shared/middlewares/authenticate.middleware.js';
import { validate } from '../../../../shared/middlewares/validate.middleware.js';
import { ITokenProvider } from '../../domain/ports/token-provider.port.js';
import { AuthController } from '../controllers/auth.controller.js';
import { loginSchema } from '../schemas/login.schema.js';
import { refreshSchema } from '../schemas/refresh.schema.js';
import { registerSchema } from '../schemas/register.schema.js';

export const createAuthRoutes = (
  authController: AuthController,
  tokenProvider: ITokenProvider,
): Router => {
  const router = Router();
  const authRouter = Router();

  authRouter.post(
    '/register',
    validate(registerSchema),
    asyncHandler(authController.registerHandler),
  );

  authRouter.post('/login', validate(loginSchema), asyncHandler(authController.loginHandler));

  authRouter.post('/refresh', validate(refreshSchema), asyncHandler(authController.refreshHandler));

  authRouter.post(
    '/logout',
    authenticate(tokenProvider),
    asyncHandler(authController.logoutHandler),
  );

  router.use('/api/v1/auth', authRouter);

  return router;
};
