'use client';

import { type Transition } from 'framer-motion';

import { SPRING } from '~/app/_lib/animation';

import { usePrefersReducedMotion } from '@kit/ui/hooks';

/**
 * Returns a spring configuration that adapts to:
 * - User's reduced motion preference (instant transitions)
 * - Device capability (mobile gets faster-settling springs)
 *
 * @returns Spring transition config suitable for current context
 *
 * @example
 * ```tsx
 * function AnimatedButton() {
 *   const spring = useAdaptiveSpring();
 *
 *   return (
 *     <motion.button
 *       whileHover={{ scale: 1.02 }}
 *       transition={spring}
 *     >
 *       Click me
 *     </motion.button>
 *   );
 * }
 * ```
 */
export function useAdaptiveSpring(): Transition {
  const prefersReduced = usePrefersReducedMotion();

  // For accessibility: instant transitions
  if (prefersReduced) {
    return { duration: 0.01 };
  }

  // Check for mobile (SSR-safe)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (isMobile) {
    return SPRING.mobile;
  }

  return SPRING.smooth;
}
