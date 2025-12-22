/**
 * This file is used to register monitoring instrumentation
 * and graceful shutdown handling for your Next.js application.
 *
 * Graceful Shutdown for Inngest Functions:
 * - Tracks active Inngest executions
 * - Waits for in-flight executions to complete on SIGTERM
 * - Prevents report interruption during Railway deployments
 *
 * Required Railway Environment Variables:
 * - RAILWAY_DEPLOYMENT_OVERLAP_SECONDS=300 (5 minutes)
 * - RAILWAY_DEPLOYMENT_DRAINING_SECONDS=180 (3 minutes)
 * - NEXT_MANUAL_SIG_HANDLE=true
 *
 * @see https://docs.railway.com/guides/deployment-teardown
 */
import { type Instrumentation } from 'next';

// Type for the global execution tracker
interface InngestExecutionTracker {
  increment: () => void;
  decrement: () => void;
  get: () => number;
}

// Extend globalThis type
declare global {
  var __inngestActiveExecutions: InngestExecutionTracker | undefined;
}

export async function register() {
  const { registerMonitoringInstrumentation } =
    await import('@kit/monitoring/instrumentation');

  // Register monitoring instrumentation
  // based on the MONITORING_PROVIDER environment variable.
  await registerMonitoringInstrumentation();

  // Register graceful shutdown handler (server-side only)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await registerGracefulShutdown();
  }
}

/**
 * Registers SIGTERM handler to wait for in-flight Inngest executions
 * before shutting down during Railway deployments.
 */
async function registerGracefulShutdown() {
  // Track active Inngest executions
  let activeExecutions = 0;

  // Match Railway's draining period (default 180s = 3 minutes)
  const MAX_SHUTDOWN_WAIT_MS =
    parseInt(process.env.RAILWAY_DEPLOYMENT_DRAINING_SECONDS || '180', 10) *
    1000;

  // Expose tracker for Inngest functions to increment/decrement
  globalThis.__inngestActiveExecutions = {
    increment: () => {
      activeExecutions++;
      console.log(`[Inngest] Execution started (active: ${activeExecutions})`);
    },
    decrement: () => {
      activeExecutions--;
      console.log(
        `[Inngest] Execution completed (active: ${activeExecutions})`,
      );
    },
    get: () => activeExecutions,
  };

  process.on('SIGTERM', async () => {
    console.log(
      `[Graceful Shutdown] SIGTERM received, waiting for ${activeExecutions} Inngest execution(s)...`,
    );
    console.log(
      `[Graceful Shutdown] Max wait time: ${MAX_SHUTDOWN_WAIT_MS / 1000}s`,
    );

    const startTime = Date.now();

    // Wait for active executions to complete (with timeout)
    while (
      activeExecutions > 0 &&
      Date.now() - startTime < MAX_SHUTDOWN_WAIT_MS
    ) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      console.log(
        `[Graceful Shutdown] Waiting for ${activeExecutions} execution(s)... (${elapsed}s elapsed)`,
      );
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Check every 5s
    }

    if (activeExecutions > 0) {
      console.log(
        `[Graceful Shutdown] Timeout reached with ${activeExecutions} execution(s) still running`,
      );
    } else {
      console.log('[Graceful Shutdown] All Inngest executions completed');
    }

    process.exit(0);
  });

  console.log('[Instrumentation] Graceful shutdown handler registered');
}

/**
 * @name onRequestError
 * @description This function is called when an error occurs during the request lifecycle.
 * It is used to capture the error and send it to the monitoring service.
 */
export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context,
) => {
  const { getServerMonitoringService } = await import('@kit/monitoring/server');

  const service = await getServerMonitoringService();

  await service.ready();

  await service.captureException(
    err as Error,
    {},
    {
      path: request.path,
      headers: request.headers,
      method: request.method,
      routePath: context.routePath,
    },
  );
};
