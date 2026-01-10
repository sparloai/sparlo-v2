'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseDelayedLoadingOptions {
  /** Delay before showing loading state (ms). Default: 200 */
  showDelay?: number;
  /** Minimum time to display loading state (ms). Default: 300 */
  minDisplayTime?: number;
}

/**
 * Prevents flash of loading state for fast operations.
 * Shows loading only if operation takes longer than showDelay,
 * then displays for at least minDisplayTime.
 *
 * NOTE: This hook is for CLIENT-SIDE loading states only (e.g., useQuery).
 * Next.js loading.tsx files are controlled by React Suspense and cannot use this hook.
 *
 * FIXED: Uses refs to track state across effect cycles, preventing
 * race conditions when isLoading changes rapidly.
 *
 * @param isLoading - Whether loading is in progress
 * @param options - Configuration options
 * @returns Whether to show the loading indicator
 *
 * @example
 * ```tsx
 * function DataComponent() {
 *   const { data, isLoading } = useQuery(...);
 *   const showSkeleton = useDelayedLoading(isLoading);
 *
 *   if (showSkeleton) return <Skeleton />;
 *   return <Data data={data} />;
 * }
 * ```
 */
export function useDelayedLoading(
  isLoading: boolean,
  options: UseDelayedLoadingOptions = {}
): boolean {
  const { showDelay = 200, minDisplayTime = 300 } = options;

  const [showLoading, setShowLoading] = useState(false);

  // Track loading state across effect cycles to prevent race conditions
  const loadingStartedRef = useRef(false);
  const loadingStartTimeRef = useRef<number | null>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup helper
  const clearTimeouts = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isLoading && !loadingStartedRef.current) {
      // Loading started - schedule showing indicator
      loadingStartedRef.current = true;
      clearTimeouts();

      showTimeoutRef.current = setTimeout(() => {
        setShowLoading(true);
        loadingStartTimeRef.current = Date.now();
      }, showDelay);
    }

    if (!isLoading && loadingStartedRef.current) {
      // Loading ended - handle cleanup
      loadingStartedRef.current = false;
      clearTimeouts();

      if (showLoading && loadingStartTimeRef.current) {
        // Ensure minimum display time
        const elapsed = Date.now() - loadingStartTimeRef.current;
        const remaining = Math.max(0, minDisplayTime - elapsed);

        hideTimeoutRef.current = setTimeout(() => {
          setShowLoading(false);
          loadingStartTimeRef.current = null;
        }, remaining);
      } else {
        // Loading finished before we showed anything - reset via timeout to avoid
        // synchronous setState in effect (satisfies react-hooks/set-state-in-effect)
        hideTimeoutRef.current = setTimeout(() => {
          setShowLoading(false);
          loadingStartTimeRef.current = null;
        }, 0);
      }
    }

    return clearTimeouts;
  }, [isLoading, showDelay, minDisplayTime, showLoading, clearTimeouts]);

  return showLoading;
}
