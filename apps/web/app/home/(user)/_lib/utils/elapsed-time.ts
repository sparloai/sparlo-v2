'use client';

import { useEffect, useState } from 'react';

/**
 * Calculate elapsed seconds from a timestamp string.
 */
export function calculateElapsed(createdAt: string | null): number {
  if (!createdAt) return 0;
  const startTime = new Date(createdAt).getTime();
  if (isNaN(startTime)) return 0;
  return Math.max(0, Math.floor((Date.now() - startTime) / 1000));
}

/**
 * Format elapsed seconds as M:SS
 * Note: Hour format intentionally omitted - reports typically take ~15 minutes.
 * Add hour support when needed (YAGNI).
 */
export function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Hook to calculate elapsed time from a timestamp.
 * Updates every second. Persists correctly across page refresh.
 */
export function useElapsedTime(createdAt: string | null): number {
  const [elapsed, setElapsed] = useState(() => calculateElapsed(createdAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(calculateElapsed(createdAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  return elapsed;
}
