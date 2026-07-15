import { Request, Response, NextFunction } from 'express';

import { NotFoundError } from '../errors/index.js';

export const notFoundMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
};
