import { Router } from 'express';

import { asyncHandler } from '../../../../shared/express/async-handler.js';
import { authMiddleware } from '../../../../shared/middlewares/auth.middleware.js';
import { requireAuth } from '../../../../shared/middlewares/require-auth.middleware.js';
import { validateBody } from '../../../../shared/middlewares/validate-body.middleware.js';
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
    validateBody(registerSchema),
    asyncHandler(authController.registerHandler),
  );

  authRouter.post('/login', validateBody(loginSchema), asyncHandler(authController.loginHandler));

  authRouter.post(
    '/refresh',
    validateBody(refreshSchema),
    asyncHandler(authController.refreshHandler),
  );

  authRouter.post(
    '/logout',
    authMiddleware(tokenProvider),
    requireAuth(),
    asyncHandler(authController.logoutHandler),
  );

  router.use('/api/v1/auth', authRouter);

  return router;
};
