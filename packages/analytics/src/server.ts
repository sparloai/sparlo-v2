import 'server-only';

import { createAnalyticsManager } from './analytics-manager';
import { NullAnalyticsService } from './null-analytics-service';
import { createPostHogServerService } from './posthog-server-service';
import type { AnalyticsManager, AnalyticsProviderFactory } from './types';

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

function getProviders(): Record<string, AnalyticsProviderFactory<object>> {
  if (!posthogKey) {
    return {
      null: () => NullAnalyticsService,
    };
  }

  return {
    posthog: () =>
      createPostHogServerService({
        apiKey: posthogKey,
        apiHost: posthogHost,
      }),
  };
}

export const analytics: AnalyticsManager = createAnalyticsManager({
  providers: getProviders(),
});

export {
  createPostHogServerService,
  type PostHogServerConfig,
} from './posthog-server-service';
