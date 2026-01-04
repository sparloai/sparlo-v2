import 'server-only';

import type { AnalyticsService } from './types';

export interface PostHogServerConfig {
  apiKey: string;
  apiHost?: string;
  /** Timeout in milliseconds for HTTP requests (default: 5000) */
  timeout?: number;
}

/** Request timeout for analytics (prevents hanging requests) */
const DEFAULT_TIMEOUT_MS = 5000;

/**
 * PostHog server-side analytics service
 *
 * Uses the PostHog HTTP API directly for server-side event tracking.
 * This avoids the posthog-node dependency and keeps the bundle lean.
 *
 * Note: Server-side tracking is used for internal product analytics
 * (report generation times, costs, system health) - not user behavioral
 * tracking. This falls under legitimate business interest (GDPR Article 6(1)(f)).
 */
export function createPostHogServerService(
  config: PostHogServerConfig,
): AnalyticsService {
  const apiHost = config.apiHost ?? 'https://us.i.posthog.com';
  const timeoutMs = config.timeout ?? DEFAULT_TIMEOUT_MS;

  async function capture(
    event: string,
    properties: Record<string, unknown>,
    distinctId?: string,
  ): Promise<void> {
    if (!config.apiKey) {
      console.debug('PostHog Server: No API key, skipping event', event);
      return;
    }

    // Use AbortController with timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${apiHost}/capture/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          api_key: config.apiKey,
          event,
          properties: {
            ...properties,
            $lib: 'sparlo-server',
          },
          distinct_id: distinctId ?? properties.user_id ?? 'anonymous',
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        console.error('PostHog Server: Failed to capture event', {
          event,
          status: response.status,
        });
      }
    } catch (error) {
      // Handle abort specifically
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('PostHog Server: Request timed out', { event, timeoutMs });
      } else {
        console.error('PostHog Server: Error capturing event', {
          event,
          error,
        });
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return {
    initialize() {
      // No initialization needed for server-side HTTP API
      return Promise.resolve();
    },

    trackPageView(_path: string) {
      // Page views are typically client-side only
      return Promise.resolve();
    },

    trackEvent(
      eventName: string,
      eventProperties?: Record<string, string | string[]>,
    ) {
      return capture(eventName, eventProperties ?? {});
    },

    identify(userId: string, traits?: Record<string, string>) {
      return capture(
        '$identify',
        {
          $set: traits ?? {},
        },
        userId,
      );
    },
  };
}
