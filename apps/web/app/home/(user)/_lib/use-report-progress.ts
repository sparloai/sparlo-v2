'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';

import {
  PHASE_LABELS,
  calculateOverallProgress,
  getPhaseLabel,
} from '~/lib/constants/phases';

import type { ConversationStatus } from './types';

// Re-export for backwards compatibility
export { PHASE_LABELS, getPhaseLabel, calculateOverallProgress };

/**
 * Report progress data from Supabase
 */
export interface ReportProgress {
  id: string;
  status: ConversationStatus;
  currentStep: string | null;
  phaseProgress: number;
  title: string;
  clarifications: ClarificationQuestion[];
  reportData: Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: string | null;
}

export interface ClarificationQuestion {
  question: string;
  answer?: string;
  askedAt: string;
  answeredAt?: string;
}

interface UseReportProgressReturn {
  progress: ReportProgress | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to track report generation progress with real-time updates.
 *
 * KIERAN'S FIX: Fetches initial state BEFORE subscribing to realtime
 * to prevent race conditions where updates are missed.
 */
export function useReportProgress(
  reportId: string | null,
): UseReportProgressReturn {
  const supabase = useSupabase();
  const [progress, setProgress] = useState<ReportProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track if component is mounted to prevent state updates after unmount
  const mountedRef = useRef(true);

  /**
   * Fetch current report state from database
   */
  const fetchProgress = useCallback(async () => {
    if (!reportId) {
      setProgress(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('sparlo_reports')
        .select(
          'id, status, current_step, phase_progress, title, clarifications, report_data, error_message, created_at',
        )
        .eq('id', reportId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (!mountedRef.current) return;

      // DEBUG: Log fetched data to understand AN0 timing
      console.log('[useReportProgress] Initial fetch result:', {
        id: data.id,
        status: data.status,
        current_step: data.current_step,
        clarifications:
          (data.clarifications as unknown as ClarificationQuestion[])?.length ??
          0,
      });

      setProgress({
        id: data.id,
        status: data.status as ConversationStatus,
        currentStep: data.current_step,
        phaseProgress: data.phase_progress ?? 0,
        title: data.title,
        clarifications:
          (data.clarifications as unknown as ClarificationQuestion[]) ?? [],
        reportData: data.report_data as Record<string, unknown> | null,
        errorMessage: data.error_message,
        createdAt: data.created_at,
      });
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('Failed to fetch report progress:', err);
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [reportId, supabase]);

  useEffect(() => {
    mountedRef.current = true;

    if (!reportId) {
      setProgress(null);
      setIsLoading(false);
      return;
    }

    // KIERAN'S FIX: Fetch BEFORE subscribing
    // This prevents race conditions where realtime updates are missed
    // because we're not subscribed yet when the initial state is set.
    const initialize = async () => {
      // 1. First, fetch the current state
      await fetchProgress();

      if (!mountedRef.current) return;

      // 2. THEN subscribe to changes
      const channel = supabase
        .channel(`report-progress-${reportId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'sparlo_reports',
            filter: `id=eq.${reportId}`,
          },
          (payload) => {
            if (!mountedRef.current) return;

            const data = payload.new as Record<string, unknown>;

            // DEBUG: Log realtime update to understand AN0 timing
            console.log('[useReportProgress] Realtime update:', {
              id: data.id,
              status: data.status,
              current_step: data.current_step,
              clarifications:
                (data.clarifications as ClarificationQuestion[])?.length ?? 0,
            });

            setProgress({
              id: data.id as string,
              status: data.status as ConversationStatus,
              currentStep: data.current_step as string | null,
              phaseProgress: (data.phase_progress as number) ?? 0,
              title: data.title as string,
              clarifications:
                (data.clarifications as ClarificationQuestion[]) ?? [],
              reportData: data.report_data as Record<string, unknown> | null,
              errorMessage: data.error_message as string | null,
              createdAt: data.created_at as string | null,
            });
          },
        )
        .subscribe();

      // Cleanup function
      return () => {
        supabase.removeChannel(channel);
      };
    };

    let cleanup: (() => void) | undefined;
    initialize().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    return () => {
      mountedRef.current = false;
      cleanup?.();
    };
  }, [reportId, supabase, fetchProgress]);

  return {
    progress,
    isLoading,
    error,
    refetch: fetchProgress,
  };
}

// P2: Phase utilities now imported from ~/lib/constants/phases
