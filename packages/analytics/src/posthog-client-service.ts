'use client';

import type { AnalyticsService } from './types';

export interface PostHogConfig {
  apiKey: string;
  apiHost?: string;
  debug?: boolean;
}

// PostHog instance loaded dynamically
let posthogInstance: typeof import('posthog-js').default | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Check if PostHog has been initialized
 */
function isInitialized(): boolean {
  return posthogInstance !== null && typeof window !== 'undefined';
}

/**
 * Create PostHog client service with lazy loading
 *
 * PostHog is only imported when initialize() is called, reducing
 * the initial bundle size by ~70KB for users who don't consent.
 */
export function createPostHogClientService(
  config: PostHogConfig,
): AnalyticsService {
  return {
    async initialize(): Promise<void> {
      // Skip on server
      if (typeof window === 'undefined') {
        return;
      }

      // Already initialized or initializing
      if (posthogInstance || initPromise) {
        return initPromise ?? Promise.resolve();
      }

      // No API key - skip initialization
      if (!config.apiKey) {
        console.debug('PostHog: No API key provided, skipping initialization');
        return;
      }

      // Dynamically import PostHog only when needed (~70KB savings)
      initPromise = (async () => {
        try {
          const { default: posthog } = await import('posthog-js');

          posthog.init(config.apiKey, {
            api_host: config.apiHost ?? 'https://us.i.posthog.com',
            person_profiles: 'identified_only',
            capture_pageview: false,
            capture_pageleave: false,
            autocapture: false,
            persistence: 'localStorage',
            loaded: (ph) => {
              if (config.debug || process.env.NODE_ENV === 'development') {
                ph.debug();
              }
            },
          });

          posthogInstance = posthog;
        } catch (error) {
          console.error('PostHog: Failed to load', error);
          initPromise = null;
        }
      })();

      return initPromise;
    },

    async trackPageView(path: string): Promise<void> {
      if (!isInitialized()) return;

      try {
        posthogInstance!.capture('$pageview', {
          $current_url: window.location.origin + path,
        });
      } catch (error) {
        console.error('PostHog: trackPageView failed', error);
      }
    },

    async trackEvent(
      eventName: string,
      eventProperties?: Record<string, string | string[]>,
    ): Promise<void> {
      if (!isInitialized()) return;

      try {
        posthogInstance!.capture(eventName, eventProperties);
      } catch (error) {
        console.error('PostHog: trackEvent failed', error);
      }
    },

    async identify(
      userId: string,
      traits?: Record<string, string>,
    ): Promise<void> {
      if (!isInitialized()) return;

      try {
        posthogInstance!.identify(userId, traits);
      } catch (error) {
        console.error('PostHog: identify failed', error);
      }
    },
  };
}

/**
 * Reset PostHog state (for logout)
 */
export function resetPostHog(): void {
  if (typeof window !== 'undefined' && posthogInstance) {
    try {
      posthogInstance.reset();
    } catch (error) {
      console.error('PostHog: reset failed', error);
    }
  }
  posthogInstance = null;
  initPromise = null;
}
