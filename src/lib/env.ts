import { z } from 'zod';

const EnvSchema = z.object({
  VITE_MYCONDO_API_BASE_URL: z.string().url().default('https://localhost:7219'),
  VITE_MYCONDO_APP_NAME: z.string().min(1).default('MyCondo'),
  VITE_MYCONDO_ENV: z.enum(['development', 'staging', 'production']).default('development'),
});

const parsed = EnvSchema.safeParse({
  VITE_MYCONDO_API_BASE_URL: import.meta.env.VITE_MYCONDO_API_BASE_URL,
  VITE_MYCONDO_APP_NAME: import.meta.env.VITE_MYCONDO_APP_NAME,
  VITE_MYCONDO_ENV: import.meta.env.VITE_MYCONDO_ENV,
});

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  throw new Error('Environment validation failed. Check .env.');
}

export const env = parsed.data;
export type Env = typeof env;
