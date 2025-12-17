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
 *
 * SECURITY: Signature verification is automatically enabled when INNGEST_SIGNING_KEY
 * environment variable is set. Unsigned requests will be rejected with 401.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
  // Explicitly reference signing key to ensure signature verification is enabled
  // The SDK will reject unsigned requests when this is set
  signingKey: process.env.INNGEST_SIGNING_KEY,
});
