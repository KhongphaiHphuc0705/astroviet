/* eslint-disable no-console */
import 'dotenv/config';

import { z } from 'zod';

const seedSchema = z.object({
  SEED_ADMIN_EMAIL: z.string().email(),
  SEED_ADMIN_PASSWORD: z.string().min(8),
});

const result = seedSchema.safeParse(process.env);

if (!result.success) {
  console.error('❌ Invalid seed configuration:', result.error.format());
  process.exit(1);
}

export const seedConfig = result.data;
