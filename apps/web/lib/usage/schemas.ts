import { z } from 'zod';

/**
 * Runtime validation for JSONB responses from PostgreSQL usage functions.
 * These schemas ensure type safety at the application layer since JSONB
 * returns are not typed by the database driver.
 */

export const UsageCheckResponseSchema = z.object({
  allowed: z.boolean(),
  tokens_used: z.number(),
  tokens_limit: z.number(),
  remaining: z.number(),
  percentage: z.number(),
  reports_count: z.number(),
  chat_tokens_used: z.number(),
  period_end: z.string(),
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
