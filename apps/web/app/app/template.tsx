'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useSelectedLayoutSegment } from 'next/navigation';

import { usePrefersReducedMotion } from '@kit/ui/hooks';

import { DURATION, EASE } from '~/app/_lib/animation';
import { FrozenRouter } from '~/components/frozen-router';

/**
 * Page transition template for the app routes.
 *
 * Uses AnimatePresence + FrozenRouter for smooth page transitions:
 * - FrozenRouter keeps router context stable during exit animations
 * - AnimatePresence with mode="wait" ensures clean exit/enter sequencing
 * - Respects prefers-reduced-motion for accessibility
 * - Exit direction fixed: exits DOWN (y: 8) to avoid "escalator effect"
 *
 * @example
 * Navigation flow:
 * 1. User clicks link → exit animation starts
 * 2. FrozenRouter keeps old page visible during exit
 * 3. Exit completes → new page enters with fresh animation
 */
export default function AppTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const segment = useSelectedLayoutSegment();
  const prefersReducedMotion = usePrefersReducedMotion();

  // Reduced motion: opacity only, faster duration
  // FIX: Exit goes DOWN (positive y) to maintain spatial metaphor
  // Enter: slides UP into view (y: 8 -> 0)
  // Exit: fades DOWN and out (y: 0 -> 8) - OPPOSITE direction for natural flow
  const variants = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, y: 8 }, // Enter from below
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 8 }, // Exit downward (FIXED - was -8)
      };

  const transition = {
    duration: prefersReducedMotion
      ? DURATION.fast / 1000
      : DURATION.page / 1000,
    ease: EASE.out,
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={segment}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={transition}
      >
        <FrozenRouter>{children}</FrozenRouter>
      </motion.div>
    </AnimatePresence>
  );
}
