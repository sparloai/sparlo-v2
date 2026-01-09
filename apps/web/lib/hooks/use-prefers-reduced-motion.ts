'use client';

import { useEffect, useState } from 'react';

/**
 * Hook that subscribes to the user's reduced motion preference.
 *
 * Unlike a one-time check, this hook will re-render the component
 * when the user changes their system preference mid-session.
 *
 * @returns true if the user prefers reduced motion
 *
 * @example
 * ```tsx
 * function AnimatedComponent() {
 *   const prefersReducedMotion = usePrefersReducedMotion();
 *
 *   if (prefersReducedMotion) {
 *     return <StaticContent />;
 *   }
 *
 *   return <AnimatedContent />;
 * }
 * ```
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // SSR-safe: return false during server render
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Update state when preference changes
    const handler = (event: MediaQueryListEvent): void => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, []);

  return prefersReducedMotion;
}
