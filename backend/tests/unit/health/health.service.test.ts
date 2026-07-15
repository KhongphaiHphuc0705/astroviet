import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AppConfig, Environment } from '../../../src/config/env.config.js';
import { HealthService } from '../../../src/health/health.service.js';
import { ILogger } from '../../../src/shared/logger/logger.interface.js';

describe('HealthService Unit Tests', () => {
  let mockPrisma: any;
  let mockLogger: ILogger;
  let mockConfig: AppConfig;
  let healthService: HealthService;

  beforeEach(() => {
    mockPrisma = {
      $queryRawUnsafe: vi.fn(),
    };
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };
    mockConfig = {
      NODE_ENV: Environment.TEST,
      PORT: 3000,
      CORS_ORIGIN: '*',
      DATABASE_URL: 'postgres://localhost/test',
      LOG_LEVEL: 'silent',
    };
    healthService = new HealthService(mockPrisma, mockConfig, mockLogger);
  });

  it('should throw InfrastructureError if DB is down', async () => {
    mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error('Connection Refused'));
    await expect(healthService.checkDatabase()).rejects.toThrow('Database is not ready');
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('should return health status successfully', async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ '?column?': 1 }]);
    const status = await healthService.getOverallHealth();
    expect(status.database).toBe('up');
    expect(status.environment).toBe(Environment.TEST);
    expect(status.uptime).toBeGreaterThan(0);
  });

  it('should return health status with db down if DB is unreachable', async () => {
    mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error('Down'));
    const status = await healthService.getOverallHealth();
    expect(status.database).toBe('down');
  });
});
