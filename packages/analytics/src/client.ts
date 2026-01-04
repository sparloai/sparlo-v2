'use client';

import { createAnalyticsManager } from './analytics-manager';
import { NullAnalyticsService } from './null-analytics-service';
import { createPostHogClientService } from './posthog-client-service';
import type { AnalyticsManager, AnalyticsProviderFactory } from './types';

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

let analyticsInstance: AnalyticsManager | null = null;
let initializationPromise: Promise<void> | null = null;

function getProviders(): Record<string, AnalyticsProviderFactory<object>> {
  if (!posthogKey) {
    return {
      null: () => NullAnalyticsService,
    };
  }

  return {
    posthog: () =>
      createPostHogClientService({
        apiKey: posthogKey,
        apiHost: posthogHost,
      }),
  };
}

function getAnalyticsManager(): AnalyticsManager {
  if (!analyticsInstance) {
    analyticsInstance = createAnalyticsManager({
      providers: getProviders(),
      autoInit: false,
    });
  }
  return analyticsInstance;
}

export async function initializeAnalytics(): Promise<void> {
  if (typeof window === 'undefined') return;

  if (initializationPromise) {
    await initializationPromise;
    return;
  }

  const manager = getAnalyticsManager();
  initializationPromise = manager.initialize().then(() => undefined);
  await initializationPromise;
}

export const analytics: AnalyticsManager = {
  addProvider: (provider, config) =>
    getAnalyticsManager().addProvider(provider, config),
  removeProvider: (provider) => getAnalyticsManager().removeProvider(provider),
  initialize: () => initializeAnalytics(),
  identify: (userId, traits) => getAnalyticsManager().identify(userId, traits),
  trackPageView: (path) => getAnalyticsManager().trackPageView(path),
  trackEvent: (eventName, eventProperties) =>
    getAnalyticsManager().trackEvent(eventName, eventProperties),
};

export {
  createPostHogClientService,
  resetPostHog,
} from './posthog-client-service';
export type { PostHogConfig } from './posthog-client-service';
