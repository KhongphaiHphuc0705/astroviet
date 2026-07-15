import { bootstrapApplication } from './composition-root.js';
import { defaultLogger } from './shared/logger/pino.logger.js';

process.on('uncaughtException', (err) => {
  defaultLogger.error('Uncaught Exception! Shutting down...', {}, err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  defaultLogger.error(
    'Unhandled Rejection! Shutting down...',
    {},
    reason instanceof Error ? reason : new Error(String(reason)),
  );
  process.exit(1);
});

async function bootstrap() {
  const { app } = await bootstrapApplication();

  // Need to import env directly for the port
  const { env } = await import('./config/env.config.js');
  const port = env.PORT || 3000;

  const server = app.listen(port, () => {
    defaultLogger.info(`🚀 AstroViet server is running on port ${port} in ${env.NODE_ENV} mode.`);
  });

  const gracefulShutdown = (signal: string) => {
    defaultLogger.info(`${signal} received. Shutting down gracefully...`);

    server.close(() => {
      void (async () => {
        defaultLogger.info('HTTP server closed.');

        // Disconnect Prisma
        const { prisma } = await import('./shared/prisma/prisma-client.js');
        await prisma.$disconnect();
        defaultLogger.info('Prisma disconnected.');

        // Flush logger before exit
        defaultLogger.getPinoLogger().flush();
        process.exit(0);
      })();
    });

    // Timeout in case server.close takes too long
    setTimeout(() => {
      void (async () => {
        defaultLogger.error('Could not close connections in time, forcefully shutting down');
        const { prisma } = await import('./shared/prisma/prisma-client.js');
        await prisma.$disconnect();
        defaultLogger.getPinoLogger().flush();
        process.exit(1);
      })();
    }, 10000).unref();
  };

  process.on('SIGTERM', () => {
    void gracefulShutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    void gracefulShutdown('SIGINT');
  });
}

bootstrap().catch((err) => {
  defaultLogger.error('Failed to bootstrap application', {}, err);
  process.exit(1);
});
