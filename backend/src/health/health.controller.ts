import { Request, Response } from 'express';

import { HealthService } from './health.service.js';

export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * GET /live
   * Liveness probe. Purely checks if the Node process is running.
   */
  getLive = (_req: Request, res: Response) => {
    res.status(200).json({ status: 'OK' });
  };

  /**
   * GET /ready
   * Readiness probe. Checks if the application is ready to accept traffic (e.g. DB is up).
   * Will throw error if DB is down, caught by asyncHandler -> global error handler.
   */
  getReady = async (_req: Request, res: Response) => {
    await this.healthService.checkDatabase();
    res.status(200).json({ database: 'up' });
  };

  /**
   * GET /health
   * Provides comprehensive application status.
   */
  getHealth = async (_req: Request, res: Response) => {
    const status = await this.healthService.getOverallHealth();
    // Return 200 even if some components are degraded,
    // unless strictly required to fail. Usually, /ready is for failure.
    res.status(200).json(status);
  };
}
