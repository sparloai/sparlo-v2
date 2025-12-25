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
 * Format elapsed seconds as human-readable duration.
 * Examples: "2m 30s elapsed", "1h 15m elapsed", "18h 39m elapsed"
 */
export function formatElapsed(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m elapsed`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s elapsed`;
  }
  return `${secs}s elapsed`;
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
