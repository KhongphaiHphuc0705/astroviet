import { AppConfig } from '../config/env.config.js';
import { InfrastructureError } from '../shared/errors/index.js';
import { ILogger } from '../shared/logger/logger.interface.js';

export interface HealthStatus {
  uptime: number;
  timestamp: string;
  version: string;
  environment: string;
  database: 'up' | 'down';
}

export class HealthService {
  constructor(
    private readonly prisma: unknown, // Typed as unknown here to decouple from PrismaClient explicitly if needed, but in real app we'd use PrismaClient type. We'll use any or unknown and cast.
    private readonly config: AppConfig,
    private readonly logger: ILogger,
  ) {}

  /**
   * Checks if the database is ready by executing a simple raw query.
   * Throws an InfrastructureError if the database is not responding.
   */
  async checkDatabase(): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this.prisma as any).$queryRawUnsafe('SELECT 1');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.error('Database readiness check failed', {}, error);
      throw new InfrastructureError('Database is not ready', undefined, error);
    }
  }

  /**
   * Returns a comprehensive health status of the application.
   */
  async getOverallHealth(): Promise<HealthStatus> {
    let dbStatus: 'up' | 'down' = 'up';
    try {
      await this.checkDatabase();
    } catch {
      dbStatus = 'down';
    }

    return {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
      environment: this.config.NODE_ENV,
      database: dbStatus,
    };
  }
}
