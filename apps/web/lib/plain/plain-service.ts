import 'server-only';

import { PlainClient } from '@team-plain/typescript-sdk';

import { getLogger } from '@kit/shared/logger';

import { getEnvVar, validateEnvironment } from '~/lib/config/validate-env';
import {
  sanitizeDisplayName,
  sanitizeForPrompt,
} from '~/lib/security/sanitize';

// Validate environment on module load
validateEnvironment();

export interface CreateTicketParams {
  email: string;
  fullName: string;
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'general' | 'feature-request';
}

export interface EscalateChatParams {
  email: string;
  fullName: string;
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  reason?: string;
}

export interface PlainTicketResult {
  threadId: string;
  customerId: string;
}

/**
 * Creates a Plain service instance (factory pattern)
 */
export function createPlainService() {
  const client = new PlainClient({
    apiKey: getEnvVar('PLAIN_API_KEY'),
  });

  return {
    /**
     * Creates a support ticket in Plain
     */
    async createTicket(params: CreateTicketParams): Promise<PlainTicketResult> {
      const logger = await getLogger();
      const ctx = {
        name: 'plain-create-ticket',
        category: params.category,
      };

      try {
        logger.info(ctx, 'Creating Plain ticket');

        const sanitizedName = sanitizeDisplayName(params.fullName);

        // Upsert customer
        const customerResult = await client.upsertCustomer({
          identifier: { emailAddress: params.email },
          onCreate: {
            email: { email: params.email, isVerified: false }, // Don't auto-verify
            fullName: sanitizedName,
          },
          onUpdate: {
            fullName: { value: sanitizedName },
          },
        });

        if (customerResult.error) {
          logger.error(
            { ...ctx, error: customerResult.error },
            'Failed to upsert customer',
          );
          throw new Error('Unable to create support ticket. Please try again.');
        }

        // Create thread with sanitized content
        const threadResult = await client.createThread({
          customerIdentifier: { emailAddress: params.email },
          title: sanitizeForPrompt(params.subject).slice(0, 200),
          components: [
            {
              componentText: {
                text: `**Category:** ${params.category}\n\n${sanitizeForPrompt(params.description).slice(0, 5000)}`,
              },
            },
          ],
          labelTypeIds: getLabelForCategory(params.category),
        });

        if (threadResult.error) {
          logger.error(
            { ...ctx, error: threadResult.error },
            'Failed to create thread',
          );
          throw new Error(
            'Support ticket created but unable to initialize conversation.',
          );
        }

        logger.info(
          { ...ctx, threadId: threadResult.data.id },
          'Plain ticket created',
        );

        return {
          threadId: threadResult.data.id,
          customerId: customerResult.data.customer.id,
        };
      } catch (error) {
        logger.error({ ...ctx, error }, 'Plain ticket creation failed');

        // Re-throw user-friendly errors
        if (error instanceof Error && error.message.includes('Unable to')) {
          throw error;
        }

        throw new Error('An unexpected error occurred. Please try again.');
      }
    },

    /**
     * Escalates a chat conversation to human support
     */
    async escalateChat(params: EscalateChatParams): Promise<PlainTicketResult> {
      const logger = await getLogger();
      const ctx = { name: 'plain-escalate-chat' };

      try {
        logger.info(ctx, 'Escalating chat to Plain');

        const sanitizedName = sanitizeDisplayName(params.fullName);

        // Format chat history (sanitized, limited)
        const chatSummary = params.chatHistory
          .slice(-20) // Limit history
          .map((msg) => {
            const role = msg.role === 'user' ? 'User' : 'Bot';
            const content = sanitizeForPrompt(msg.content).slice(0, 2000);
            return `**${role}:** ${content}`;
          })
          .join('\n\n');

        // Upsert customer
        const customerResult = await client.upsertCustomer({
          identifier: { emailAddress: params.email },
          onCreate: {
            email: { email: params.email, isVerified: false },
            fullName: sanitizedName,
          },
          onUpdate: {},
        });

        if (customerResult.error) {
          logger.error(
            { ...ctx, error: customerResult.error },
            'Failed to upsert customer',
          );
          throw new Error('Unable to escalate conversation. Please try again.');
        }

        // Create escalation thread
        const reason = params.reason
          ? sanitizeForPrompt(params.reason).slice(0, 200)
          : 'User requested human support';

        const threadResult = await client.createThread({
          customerIdentifier: { emailAddress: params.email },
          title: `Chat Escalation: ${reason}`,
          components: [
            {
              componentText: {
                text: `**Escalation Reason:** ${reason}\n\n---\n\n**Chat History:**\n\n${chatSummary}`,
              },
            },
          ],
        });

        if (threadResult.error) {
          logger.error(
            { ...ctx, error: threadResult.error },
            'Failed to create escalation',
          );
          throw new Error('Unable to escalate conversation. Please try again.');
        }

        logger.info(
          { ...ctx, threadId: threadResult.data.id },
          'Chat escalated',
        );

        return {
          threadId: threadResult.data.id,
          customerId: customerResult.data.customer.id,
        };
      } catch (error) {
        logger.error({ ...ctx, error }, 'Chat escalation failed');

        if (error instanceof Error && error.message.includes('Unable to')) {
          throw error;
        }

        throw new Error('An unexpected error occurred. Please try again.');
      }
    },
  };
}

/**
 * Maps category to Plain label type IDs
 */
function getLabelForCategory(category: string): string[] {
  const labelMap: Record<string, string> = {
    technical: getEnvVar('PLAIN_LABEL_TECHNICAL', ''),
    billing: getEnvVar('PLAIN_LABEL_BILLING', ''),
    general: getEnvVar('PLAIN_LABEL_GENERAL', ''),
    'feature-request': getEnvVar('PLAIN_LABEL_FEATURE', ''),
  };
  return labelMap[category] ? [labelMap[category]] : [];
}
