import { z } from 'zod';

/**
 * Runtime validation for JSONB responses from PostgreSQL usage functions.
 * These schemas ensure type safety at the application layer since JSONB
 * returns are not typed by the database driver.
 */

export const UsageCheckResponseSchema = z.object({
  allowed: z.boolean(),
  tokens_used: z.coerce.number().default(0),
  tokens_limit: z.coerce.number().default(350000),
  remaining: z.coerce.number().default(350000),
  percentage: z.coerce.number().default(0),
  reports_count: z.coerce.number().default(0),
  chat_tokens_used: z.coerce.number().default(0),
  period_end: z.string().nullable().optional(),
});

export const IncrementUsageResponseSchema = z.object({
  tokens_used: z.number(),
  tokens_limit: z.number(),
  reports_count: z.number(),
  chat_tokens_used: z.number(),
  percentage: z.number(),
});

export type UsageCheckResponse = z.infer<typeof UsageCheckResponseSchema>;
export type IncrementUsageResponse = z.infer<
  typeof IncrementUsageResponseSchema
>;
