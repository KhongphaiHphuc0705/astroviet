import { describe, it, expect, vi } from 'vitest';

import { env } from '../../../src/config/env.config.js';
import { PinoLogger } from '../../../src/shared/logger/pino.logger.js';

describe('PinoLogger', () => {
  it('should create logger with pino-pretty in non-prod', () => {
    const logger = new PinoLogger('TestLogger');
    expect(logger.getPinoLogger()).toBeDefined();
  });

  it('should call info method', () => {
    const logger = new PinoLogger('TestLogger');
    const pinoLogger = logger.getPinoLogger();
    vi.spyOn(pinoLogger, 'info').mockImplementation(() => {});
    logger.info('Info message', { key: 'value' });
    expect(pinoLogger.info).toHaveBeenCalledWith({ key: 'value' }, 'Info message');
  });

  it('should call warn method', () => {
    const logger = new PinoLogger('TestLogger');
    const pinoLogger = logger.getPinoLogger();
    vi.spyOn(pinoLogger, 'warn').mockImplementation(() => {});
    logger.warn('Warn message');
    expect(pinoLogger.warn).toHaveBeenCalledWith({}, 'Warn message');
  });

  it('should call debug method', () => {
    const logger = new PinoLogger('TestLogger');
    const pinoLogger = logger.getPinoLogger();
    vi.spyOn(pinoLogger, 'debug').mockImplementation(() => {});
    logger.debug('Debug message', { traceId: '123' });
    expect(pinoLogger.debug).toHaveBeenCalledWith({ traceId: '123' }, 'Debug message');
  });

  it('should redact sensitive fields at top level and nested levels', async () => {
    let output = '';

    const stream = {
      write: (msg: string) => {
        output += msg;
      },
    };

    // Force log level to info to ensure it logs even if env says otherwise during tests
    const originalLogLevel = env.LOG_LEVEL;
    (env as any).LOG_LEVEL = 'info';

    const logger = new PinoLogger('RedactTestLogger', stream as any);

    // Log top-level sensitive data
    logger.info('Test top level', { password: 'my-super-secret-password' });

    // Log nested sensitive data
    logger.info('Test nested', { user: { passwordHash: 'secret-hash' } });

    // Restore log level
    (env as any).LOG_LEVEL = originalLogLevel;

    expect(output).toContain('[Redacted]');

    // Ensure the raw secrets are completely missing from the captured log
    expect(output).not.toContain('my-super-secret-password');
    expect(output).not.toContain('secret-hash');
  });
});
