import { describe, it, expect, vi } from 'vitest';

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
});
