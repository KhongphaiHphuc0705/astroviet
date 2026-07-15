import { PrismaClient } from '@prisma/client';

import { env, Environment } from '../../config/env.config.js';

// Avoid instantiating multiple PrismaClients in development
// by using a global object to hold the instance.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const isProd = env.NODE_ENV === Environment.PRODUCTION;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: isProd ? ['warn', 'error'] : ['query', 'info', 'warn', 'error'],
  });

if (!isProd) {
  globalForPrisma.prisma = prisma;
}
