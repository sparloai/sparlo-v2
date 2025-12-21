import { serve } from 'inngest/next';

import { inngest } from '~/lib/inngest/client';
import { functions } from '~/lib/inngest/functions';

/**
 * Inngest API Route Handler
 *
 * This endpoint serves Inngest functions for:
 * - report/generate: Full AN0-AN5 report generation workflow
 * - report/generate-discovery: Discovery mode report generation
 * - report/generate-hybrid: Hybrid mode full-spectrum analysis
 * - report/clarification-answered: Resume workflow after user answers clarification
 * - report/discovery-clarification-answered: Resume discovery workflow
 * - report/hybrid-clarification-answered: Resume hybrid workflow
 *
 * Inngest Cloud calls this endpoint to execute functions.
 *
 * SECURITY: Signature verification is automatically enabled when INNGEST_SIGNING_KEY
 * environment variable is set. Unsigned requests will be rejected with 401.
 *
 * STREAMING: Enabled for better deployment behavior. When a deployment happens,
 * streaming allows Inngest to detect the connection close and retry the step
 * on the new instance rather than waiting for a timeout.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
  // Explicitly reference signing key to ensure signature verification is enabled
  // The SDK will reject unsigned requests when this is set
  signingKey: process.env.INNGEST_SIGNING_KEY,
  // Enable streaming for better deployment resilience
  // This allows Inngest to quickly detect when a deployment interrupts a function
  // and retry on the new instance rather than waiting for a timeout
  streaming: 'allow',
});
