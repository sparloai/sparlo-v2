import 'server-only';

import { EventSchemas, Inngest } from 'inngest';
import { z } from 'zod';

/**
 * Zod schemas for type-safe Inngest events
 * (Kieran's fix: explicit types for all events)
 */

// Attachment schema for vision support (standard reports)
const StandardAttachmentSchema = z.object({
  filename: z.string(),
  media_type: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  data: z.string(), // base64 encoded
});

export const ReportGenerateEventSchema = z.object({
  reportId: z.string().uuid(),
  accountId: z.string().uuid(),
  userId: z.string().uuid(),
  designChallenge: z.string().min(50),
  conversationId: z.string(),
  attachments: z.array(StandardAttachmentSchema).optional(),
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

// Hybrid Mode event schemas (same structure as discovery)
export const HybridReportGenerateEventSchema = z.object({
  reportId: z.string().uuid(),
  accountId: z.string().uuid(),
  userId: z.string().uuid(),
  designChallenge: z.string().min(50),
  conversationId: z.string(),
  attachments: z.array(AttachmentSchema).optional(),
});

export const HybridClarificationAnsweredEventSchema = z.object({
  reportId: z.string().uuid(),
  answer: z.string().min(1),
});

// Cancel event schema
export const ReportCancelEventSchema = z.object({
  reportId: z.string().uuid(),
  accountId: z.string().uuid(),
  cancelledBy: z.string().uuid(),
});

export type ReportGenerateEvent = z.infer<typeof ReportGenerateEventSchema>;
export type ReportCancelEvent = z.infer<typeof ReportCancelEventSchema>;
export type ClarificationAnsweredEvent = z.infer<
  typeof ClarificationAnsweredEventSchema
>;
export type DiscoveryReportGenerateEvent = z.infer<
  typeof DiscoveryReportGenerateEventSchema
>;
export type DiscoveryClarificationAnsweredEvent = z.infer<
  typeof DiscoveryClarificationAnsweredEventSchema
>;
export type HybridReportGenerateEvent = z.infer<
  typeof HybridReportGenerateEventSchema
>;
export type HybridClarificationAnsweredEvent = z.infer<
  typeof HybridClarificationAnsweredEventSchema
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
  // Hybrid Mode events
  'report/generate-hybrid': { data: HybridReportGenerateEvent };
  'report/hybrid-clarification-answered': {
    data: HybridClarificationAnsweredEvent;
  };
  // Cancel event (works for all report types)
  'report/cancel.requested': { data: ReportCancelEvent };
};

/**
 * Inngest client with typed events
 */
export const inngest = new Inngest({
  id: 'sparlo-v2',
  schemas: new EventSchemas().fromRecord<Events>(),
});
