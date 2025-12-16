import 'server-only';

import { EventSchemas, Inngest } from 'inngest';
import { z } from 'zod';

/**
 * Zod schemas for type-safe Inngest events
 * (Kieran's fix: explicit types for all events)
 */

export const ReportGenerateEventSchema = z.object({
  reportId: z.string().uuid(),
  accountId: z.string().uuid(),
  userId: z.string().uuid(),
  designChallenge: z.string().min(50),
  conversationId: z.string(),
});

export const ClarificationAnsweredEventSchema = z.object({
  reportId: z.string().uuid(),
  answer: z.string().min(1),
});

export type ReportGenerateEvent = z.infer<typeof ReportGenerateEventSchema>;
export type ClarificationAnsweredEvent = z.infer<
  typeof ClarificationAnsweredEventSchema
>;

/**
 * Type-safe event definitions for Inngest
 */
type Events = {
  'report/generate': { data: ReportGenerateEvent };
  'report/clarification-answered': { data: ClarificationAnsweredEvent };
};

/**
 * Inngest client with typed events
 */
export const inngest = new Inngest({
  id: 'sparlo-v2',
  schemas: new EventSchemas().fromRecord<Events>(),
});
