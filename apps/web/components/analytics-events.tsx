'use client';

import { useEffect, useRef } from 'react';

import { useSearchParams } from 'next/navigation';

import { analytics } from '@kit/analytics/client';

import { useCookieConsent } from './cookie-consent-banner';

/**
 * Track signup_started event when user lands on signup page.
 * Includes UTM parameters for marketing attribution.
 *
 * Uses ref-based deduplication to prevent double-tracking from
 * Suspense re-renders caused by useSearchParams.
 */
export function TrackSignupStarted() {
  const { status } = useCookieConsent();
  const searchParams = useSearchParams();
  const hasTracked = useRef(false);

  useEffect(() => {
    // Skip if already tracked or consent not given
    if (hasTracked.current || status !== 'accepted') return;
    hasTracked.current = true;

    const properties: Record<string, string> = {};

    // Include UTM parameters for marketing attribution
    const utmParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'ref',
    ];

    utmParams.forEach((param) => {
      const value = searchParams.get(param);
      if (value) {
        properties[param] = value;
      }
    });

    void analytics.trackEvent('signup_started', properties);
  }, [status, searchParams]);

  return null;
}

/**
 * Track report_started event when user initiates a new report.
 */
export function TrackReportStarted({
  reportType,
  isFirst = false,
}: {
  reportType: 'discovery' | 'hybrid' | 'dd';
  isFirst?: boolean;
}) {
  const { status } = useCookieConsent();
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current || status !== 'accepted') return;
    hasTracked.current = true;

    void analytics.trackEvent('report_started', {
      report_type: reportType,
      is_first: String(isFirst),
    });
  }, [status, reportType, isFirst]);

  return null;
}

/**
 * Track report_viewed event when user views a completed report.
 */
export function TrackReportViewed({
  reportId,
  reportType,
}: {
  reportId: string;
  reportType?: 'discovery' | 'hybrid' | 'dd';
}) {
  const { status } = useCookieConsent();
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current || status !== 'accepted') return;
    hasTracked.current = true;

    const properties: Record<string, string> = { report_id: reportId };
    if (reportType) {
      properties.report_type = reportType;
    }

    void analytics.trackEvent('report_viewed', properties);
  }, [status, reportId, reportType]);

  return null;
}

/**
 * Track report_shared event when user shares a report.
 */
export function trackReportShared(
  reportId: string,
  shareType: 'link' | 'pdf' | 'email',
) {
  void analytics.trackEvent('report_shared', {
    report_id: reportId,
    share_type: shareType,
  });
}
