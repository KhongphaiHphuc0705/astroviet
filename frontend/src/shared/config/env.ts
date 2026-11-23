import { z } from "zod";

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url(),
  // Optional string (validated in `resolveSiteUrl`) so an invalid SEO URL
  // does not crash the entire application at bootstrap (D-F6.4-01).
  VITE_SITE_URL: z.string().optional(),
});

export const env = envSchema.parse(import.meta.env);
