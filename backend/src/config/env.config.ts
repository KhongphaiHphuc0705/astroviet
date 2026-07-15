import 'dotenv/config';

import { z } from 'zod';

import { ConfigurationError } from '../shared/errors/app-error.js';
import { parseNumber } from '../shared/utils/parse.utils.js';

export enum Environment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
}

const envSchema = z.object({
  NODE_ENV: z.nativeEnum(Environment).default(Environment.DEVELOPMENT),
  PORT: z
    .string()
    .optional()
    .transform((val) => parseNumber(val, 3000)),
  CORS_ORIGIN: z.string().url().or(z.string().startsWith('http')),
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

export type AppConfig = z.infer<typeof envSchema>;

const result = envSchema.safeParse(process.env);

if (!result.success) {
  throw new ConfigurationError('Invalid environment configuration', {
    errors: result.error.format(),
  });
}

export const env = result.data;
