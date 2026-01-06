import { z } from 'zod';

export const TicketSchema = z.object({
  subject: z
    .string()
    .min(3, 'Subject must be at least 3 characters')
    .max(200, 'Subject must be less than 200 characters'),
  description: z
    .string()
    .min(10, 'Please provide more details')
    .max(2000, 'Description must be less than 2000 characters'),
  category: z.enum(['technical', 'billing', 'general', 'feature-request']),
});

export const FeedbackSchema = z.object({
  messageContent: z.string().min(1).max(10000),
  responseContent: z.string().min(1).max(50000),
  rating: z.enum(['positive', 'negative']),
  comment: z.string().max(1000).optional(),
});

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(10000),
});

export const EscalateSchema = z.object({
  chatHistory: z.array(ChatMessageSchema).max(20),
  reason: z.string().max(200).optional(),
});

export type TicketInput = z.infer<typeof TicketSchema>;
export type FeedbackInput = z.infer<typeof FeedbackSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type EscalateInput = z.infer<typeof EscalateSchema>;
