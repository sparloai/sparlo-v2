import { serve } from 'inngest/next';

import { inngest } from '~/lib/inngest/client';
import { functions } from '~/lib/inngest/functions';

/**
 * Inngest API Route Handler
 *
 * This endpoint serves Inngest functions for:
 * - report/generate: Full AN0-AN5 report generation workflow
 * - report/clarification-answered: Resume workflow after user answers clarification
 *
 * Inngest Cloud calls this endpoint to execute functions.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
