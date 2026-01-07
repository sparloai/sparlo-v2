'use client';

import { useEffect, useMemo, useRef } from 'react';

import { useRouter } from 'next/navigation';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';

import type { DashboardReport } from './types';

/**
 * Hook to subscribe to real-time status updates for processing reports.
 *
 * When a report transitions from 'processing' to another status (like 'complete'),
 * this hook triggers a router.refresh() to update the dashboard.
 */
export function useProcessingReportsSubscription(reports: DashboardReport[]) {
  const supabase = useSupabase();
  const router = useRouter();
  const mountedRef = useRef(true);

  // Get IDs of reports that are currently processing
  const processingReportIds = useMemo(() => {
    return reports
      .filter((r) => r.status === 'processing' || r.status === 'confirm_rerun')
      .map((r) => r.id);
  }, [reports]);

  useEffect(() => {
    mountedRef.current = true;

    // No processing reports, nothing to subscribe to
    if (processingReportIds.length === 0) {
      return;
    }

    // Subscribe to updates for all processing reports
    const channel = supabase
      .channel('dashboard-processing-reports')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sparlo_reports',
        },
        (payload) => {
          if (!mountedRef.current) return;

          const updatedReport = payload.new as { id: string; status: string };

          // Check if this is one of our processing reports
          if (!processingReportIds.includes(updatedReport.id)) {
            return;
          }

          // If status changed from processing to something else, refresh
          const newStatus = updatedReport.status;
          if (newStatus !== 'processing' && newStatus !== 'confirm_rerun') {
            router.refresh();
          }
        },
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [supabase, processingReportIds, router]);
}
