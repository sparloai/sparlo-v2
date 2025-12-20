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

// Attachment schema for vision support
const AttachmentSchema = z.object({
  filename: z.string(),
  media_type: z.enum([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ]),
  data: z.string(), // base64 encoded
});

// Discovery Mode event schemas (same structure, different chain)
export const DiscoveryReportGenerateEventSchema = z.object({
  reportId: z.string().uuid(),
  accountId: z.string().uuid(),
  userId: z.string().uuid(),
  designChallenge: z.string().min(50),
  conversationId: z.string(),
  attachments: z.array(AttachmentSchema).optional(),
});

export const DiscoveryClarificationAnsweredEventSchema = z.object({
  reportId: z.string().uuid(),
  answer: z.string().min(1),
});

export type ReportGenerateEvent = z.infer<typeof ReportGenerateEventSchema>;
export type ClarificationAnsweredEvent = z.infer<
  typeof ClarificationAnsweredEventSchema
>;
export type DiscoveryReportGenerateEvent = z.infer<
  typeof DiscoveryReportGenerateEventSchema
>;
export type DiscoveryClarificationAnsweredEvent = z.infer<
  typeof DiscoveryClarificationAnsweredEventSchema
>;

/**
 * Type-safe event definitions for Inngest
 */
type Events = {
  'report/generate': { data: ReportGenerateEvent };
  'report/clarification-answered': { data: ClarificationAnsweredEvent };
  // Discovery Mode events
  'report/generate-discovery': { data: DiscoveryReportGenerateEvent };
  'report/discovery-clarification-answered': {
    data: DiscoveryClarificationAnsweredEvent;
  };
};

/**
 * Inngest client with typed events
 */
export const inngest = new Inngest({
  id: 'sparlo-v2',
  schemas: new EventSchemas().fromRecord<Events>(),
});
