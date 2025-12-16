import { serve } from 'inngest/next';

import { inngest } from '~/lib/inngest/client';
import { functions } from '~/lib/inngest/functions';

/**
 * Inngest API Route
 *
 * This endpoint handles:
 * - Function registration with Inngest
 * - Event processing and step execution
 * - Webhook callbacks for durable workflows
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
