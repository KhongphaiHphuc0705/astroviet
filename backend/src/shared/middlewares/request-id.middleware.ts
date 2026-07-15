import * as crypto from 'crypto';

import { Request, Response, NextFunction } from 'express';

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Use upstream X-Request-ID if available, else generate a new UUID
  const upstreamId = req.header('X-Request-ID');
  const requestId = upstreamId || crypto.randomUUID();

  // Attach to request
  req.id = requestId;

  // Attach to response header
  res.setHeader('X-Request-ID', requestId);

  next();
};
