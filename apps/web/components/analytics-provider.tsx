'use client';

import { useCallback, useEffect, useRef } from 'react';

import { usePathname, useSearchParams } from 'next/navigation';

import { analytics, initializeAnalytics } from '@kit/analytics/client';
import {
  AppEvent,
  AppEventType,
  ConsumerProvidedEventTypes,
  useAppEvents,
} from '@kit/shared/events';
import { isBrowser } from '@kit/shared/utils';

import { useCookieConsent } from './cookie-consent-banner';

type AnalyticsMapping<
  T extends ConsumerProvidedEventTypes = NonNullable<unknown>,
> = {
  [K in AppEventType<T>]?: (event: AppEvent<T, K>) => unknown;
};

/**
 * Hook to subscribe to app events and map them to analytics actions
 */
function useAnalyticsMapping<T extends ConsumerProvidedEventTypes>(
  mapping: AnalyticsMapping<T>,
  enabled: boolean,
) {
  const appEvents = useAppEvents<T>();

  useEffect(() => {
    if (!enabled) return;

    const handlers = new Map<
      AppEventType<T>,
      (event: AppEvent<T, AppEventType<T>>) => unknown
    >();

    Object.entries(mapping).forEach(([eventType, handler]) => {
      if (handler) {
        handlers.set(eventType as AppEventType<T>, handler);
        appEvents.on(eventType as AppEventType<T>, handler);
      }
    });

    return () => {
      handlers.forEach((handler, eventType) => {
        appEvents.off(eventType, handler);
      });
    };
  }, [appEvents, enabled, mapping]);
}

/**
 * Sanitize URL to only include allowed marketing parameters
 */
function sanitizeUrl(pathname: string, searchParams: URLSearchParams): string {
  const allowedParams = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'ref',
  ];
  const sanitized = new URLSearchParams();

  allowedParams.forEach((key) => {
    const value = searchParams.get(key);
    if (value) sanitized.set(key, value);
  });

  const queryString = sanitized.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

/**
 * Define a mapping of app events to analytics actions
 * Note: Email is intentionally NOT sent to analytics for privacy
 */
const analyticsMapping: AnalyticsMapping = {
  'user.signedIn': (event) => {
    const { userId } = event.payload;

    if (userId) {
      // Only send userId, NOT email or other PII
      return analytics.identify(userId, {});
    }
  },
  'user.signedUp': (event) => {
    // Track signup_completed with method (password, magiclink, etc)
    const payload = event.payload as { method?: string };
    return analytics.trackEvent('signup_completed', {
      method: payload.method ?? 'unknown',
    });
  },
  'checkout.started': (event) => {
    return analytics.trackEvent('checkout_started', {
      plan_id: event.payload.planId,
    });
  },
  'user.updated': () => {
    // Don't track user.updated to analytics (contains PII)
    return;
  },
};

function AnalyticsProviderBrowser(props: React.PropsWithChildren) {
  const { status } = useCookieConsent();
  const analyticsEnabled = status === 'accepted';
  const initializedRef = useRef(false);

  // Initialize analytics only after consent is given
  useEffect(() => {
    if (analyticsEnabled && !initializedRef.current) {
      initializedRef.current = true;
      void initializeAnalytics();
    }
  }, [analyticsEnabled]);

  // Subscribe to app events and map them to analytics actions
  useAnalyticsMapping(analyticsMapping, analyticsEnabled);

  // Report page views to the analytics service (with sanitized URLs)
  useReportPageView(
    useCallback(
      (url) => {
        if (analyticsEnabled) {
          return analytics.trackPageView(url);
        }
      },
      [analyticsEnabled],
    ),
  );

  return props.children;
}

/**
 * Provider for the analytics service
 */
export function AnalyticsProvider(props: React.PropsWithChildren) {
  if (!isBrowser()) {
    return props.children;
  }

  return <AnalyticsProviderBrowser>{props.children}</AnalyticsProviderBrowser>;
}

/**
 * Hook to report page views to the analytics service
 */
function useReportPageView(reportAnalyticsFn: (url: string) => unknown) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sanitizedUrl = sanitizeUrl(pathname, searchParams);
    reportAnalyticsFn(sanitizedUrl);
  }, [pathname, searchParams, reportAnalyticsFn]);
}
