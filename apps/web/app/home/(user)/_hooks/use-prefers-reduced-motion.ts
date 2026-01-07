'use client';

import { useSyncExternalStore } from 'react';

/**
 * Hook to detect if user prefers reduced motion.
 * Returns true if the user has enabled reduced motion in their OS settings.
 * Animations should be disabled or simplified when this returns true.
 *
 * Uses useSyncExternalStore for proper React 18+ compatibility and
 * synchronization with browser media query state.
 */

const MEDIA_QUERY = '(prefers-reduced-motion: reduce)';

function getServerSnapshot(): boolean {
  // Default to false during SSR (animations enabled)
  return false;
}

function getSnapshot(): boolean {
  return window.matchMedia(MEDIA_QUERY).matches;
}

function subscribe(callback: () => void): () => void {
  const mediaQuery = window.matchMedia(MEDIA_QUERY);
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
