import { type Variants } from 'framer-motion';

import { DURATION, EASE } from '~/app/_lib/animation';

/**
 * Modal animation variants for deep tech aesthetic.
 * Subtle scale and opacity transitions - no bounce or spring.
 */
export const modalVariants: {
  backdrop: Variants;
  content: Variants;
} = {
  backdrop: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: DURATION.fast / 1000 },
    },
    exit: {
      opacity: 0,
      transition: { duration: DURATION.instant / 1000 },
    },
  },
  content: {
    hidden: {
      opacity: 0,
      scale: 0.96,
      y: 8,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: DURATION.normal / 1000,
        ease: EASE.out,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.98,
      transition: {
        duration: DURATION.fast / 1000,
        ease: EASE.in,
      },
    },
  },
};

/**
 * Modal variants for users with reduced motion preference.
 * Opacity-only transitions with faster timing.
 */
export const modalVariantsReduced: {
  backdrop: Variants;
  content: Variants;
} = {
  backdrop: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.1 } },
    exit: { opacity: 0, transition: { duration: 0.05 } },
  },
  content: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.1 } },
    exit: { opacity: 0, transition: { duration: 0.05 } },
  },
};

/**
 * Helper to get appropriate modal variants based on reduced motion preference.
 */
export function getModalVariants(prefersReducedMotion: boolean) {
  return prefersReducedMotion ? modalVariantsReduced : modalVariants;
}
